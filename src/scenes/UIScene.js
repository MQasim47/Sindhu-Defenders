import Phaser from 'phaser';
import Button from '../ui/Button.js';
import { COLORS, CSS, FONT } from '../data/colors.js';
import { addText } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';
import { playSfx } from '../fx/sound.js';
import { makeCanvasTexture, roundRectPath } from '../fx/canvasUtil.js';

const COIN_POOL = 16;
const ARC = { cx: 640, cy: 470, r: 430, from: 245, to: 295 }; // wave timer bar (degrees)

// UI: the HUD. It runs next to the Level scene (in parallel).
//   coin counter, curved wave timer, "Pakray gaye / Ghus gaye" counters, coin flights
//   and the results panel at the end of the wave.
// Everything is big and bold so it can be read from 2 metres away.
export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  init(data) {
    this.levelScene = data.level;
    this.config = data.config;
    this.ready = false;
  }

  create() {
    this.coins = this.config.startCoins;
    this.caught = 0;
    this.sneaked = 0;
    this.earned = 0;
    this.lastBar = -1;

    this.buildCoinPanel();
    this.buildCounters();
    this.buildTimer();
    this.buildFlights();
    this.ready = true;
  }

  // ---------- Panels ----------

  // A rounded dark-blue panel with a gold line. Drawn once into a texture (fast).
  panel(x, y, w, h) {
    const key = `hud-panel-${w}x${h}`;
    makeCanvasTexture(this, key, w + 12, h + 16, (ctx) => {
      ctx.translate(6, 4);
      roundRectPath(ctx, 3, 7, w, h, 22);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fill();
      roundRectPath(ctx, -3, -3, w + 6, h + 6, 24);
      ctx.fillStyle = '#3A1C16';
      ctx.fill();
      roundRectPath(ctx, 0, 0, w, h, 21);
      ctx.fillStyle = 'rgba(28,36,87,0.94)';
      ctx.fill();
      roundRectPath(ctx, 4, 4, w - 8, h - 8, 18);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(232,184,74,0.9)';
      ctx.stroke();
      roundRectPath(ctx, 10, 8, w - 20, 12, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fill();
    });
    return this.add.image(x - 6, y - 4, key).setOrigin(0);
  }

  numberText(x, y, value, origin = 0) {
    return this.add
      .text(x, y, String(value), {
        fontFamily: FONT,
        fontSize: '46px',
        fontStyle: '700',
        color: CSS.cream,
        stroke: '#10143a',
        strokeThickness: 7,
        resolution: 2,
      })
      .setOrigin(origin, 0.5);
  }

  buildCoinPanel() {
    this.panel(20, 16, 200, 72);
    this.coinIcon = this.add.image(62, 52, 'ui-coin').setScale(1.1);
    this.coinText = this.numberText(100, 52, this.coins).setColor(CSS.gold);
    this.coinPos = { x: 62, y: 52 };
  }

  buildCounters() {
    const w = 330;
    const x = 1280 - 20 - w;
    [['caught', 'icon-caught', 16, 'hud.caught'], ['sneaked', 'icon-sneaked', 98, 'hud.sneaked']].forEach(([key, icon, y, label]) => {
      this.panel(x, y, w, 72);
      this.add.image(x + 44, y + 38, icon).setScale(1.0);
      addText(this, x + 80, y + 36, label, { fontFamily: FONT, fontSize: '28px', fontStyle: '600', color: CSS.cream }).setOrigin(0, 0.5);
      this[`${key}Text`] = this.numberText(x + w - 26, y + 36, 0, 1);
    });
  }

  // The wave timer: a curved bar with an Ajrak border (crimson edges, white diamonds, indigo track).
  buildTimer() {
    // the bar is drawn into a canvas texture, and only redrawn when it changes
    this.timerCanvas = document.createElement('canvas');
    this.timerCanvas.width = 480;
    this.timerCanvas.height = 120;
    this.timerTexture = this.textures.addCanvas(`hud-timer-${Date.now()}`, this.timerCanvas);
    this.timerImage = this.add.image(400, 10, this.timerTexture.key).setOrigin(0);
    this.timeText = this.add
      .text(640, 92, '1:00', { fontFamily: FONT, fontSize: '40px', fontStyle: '700', color: CSS.cream, stroke: '#10143a', strokeThickness: 7, resolution: 2 })
      .setOrigin(0.5);
    addText(this, 640, 128, 'hud.wave', { fontFamily: FONT, fontSize: '22px', fontStyle: '600', color: CSS.gold, stroke: '#10143a', strokeThickness: 5 }).setOrigin(0.5);
    this.drawTimer(1);
  }

  drawTimer(frac) {
    const ctx = this.timerCanvas.getContext('2d');
    const cx = ARC.cx - 400;
    const cy = ARC.cy - 10;
    const r = ARC.r;
    const a0 = Phaser.Math.DegToRad(ARC.from);
    const a1 = Phaser.Math.DegToRad(ARC.to);
    const arc = (radius, width, color, start = a0, end = a1) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, end, false);
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.lineCap = 'butt';
      ctx.stroke();
    };
    ctx.clearRect(0, 0, 480, 120);
    arc(r + 2, 44, '#000000');
    arc(r, 40, '#2a0e14');
    arc(r, 34, '#8e1b2b'); // crimson border
    arc(r, 22, '#1c2457'); // indigo track
    ctx.fillStyle = '#f4ebdd'; // white diamonds along the crimson edges
    for (let i = 0; i <= 30; i++) {
      const a = a0 + ((a1 - a0) * i) / 30;
      [r - 14, r + 14].forEach((rad) => {
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    // the time that is left (gold, red near the end)
    if (frac > 0.005) arc(r, 14, frac > 0.2 ? '#ffd24a' : '#ff5a4a', a0, a0 + (a1 - a0) * frac);
    this.timerTexture.refresh();
  }

  // ---------- Called by the Level ----------

  setTime(seconds, total) {
    const left = Math.max(0, total - seconds);
    const step = Math.round((left / total) * 200);
    if (step === this.lastBar) return;
    this.lastBar = step;
    this.drawTimer(left / total);
    const s = Math.ceil(left);
    this.timeText.setText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
  }

  setCaught(n) {
    this.caught = n;
    this.caughtText.setText(String(n));
    this.bounce(this.caughtText);
  }

  setSneaked(n) {
    this.sneaked = n;
    this.sneakedText.setText(String(n));
    this.bounce(this.sneakedText);
  }

  bounce(target) {
    this.tweens.killTweensOf(target);
    target.setScale(1.45);
    this.tweens.add({ targets: target, scale: 1, duration: 340, ease: 'Back.Out' });
  }

  // ---------- Coin flights ----------

  buildFlights() {
    this.flights = [];
    for (let i = 0; i < COIN_POOL; i++) {
      const img = this.add.image(0, 0, 'ui-coin').setVisible(false).setDepth(50);
      this.flights.push({ img, active: false });
    }
  }

  // Coins pop out at (sx, sy) on the screen, then fly to the coin counter.
  addCoins(n, sx, sy) {
    this.earned += n;
    for (let i = 0; i < n; i++) {
      this.launch({
        from: { x: sx + (i - (n - 1) / 2) * 26, y: sy },
        to: () => this.coinPos,
        pop: true,
        delay: i * 0.09,
        onArrive: () => {
          this.coins += 1;
          this.coinText.setText(String(this.coins));
          this.bounce(this.coinText);
          this.tweens.add({ targets: this.coinIcon, angle: { from: -15, to: 0 }, duration: 200 });
          playSfx(this, 'sfx-coin');
        },
      });
    }
  }

  // Coins fly out of the counter towards a thief. targetFn gives its screen position.
  stealCoins(n, targetFn) {
    const take = Math.min(n, this.coins);
    this.coins -= take;
    this.coinText.setText(String(this.coins));
    this.bounce(this.coinText);
    for (let i = 0; i < take; i++) {
      this.launch({ from: { x: this.coinPos.x, y: this.coinPos.y }, to: targetFn, pop: false, delay: i * 0.12, onArrive: () => {} });
    }
  }

  launch({ from, to, pop, delay, onArrive }) {
    const f = this.flights.find((fl) => !fl.active);
    if (!f) {
      onArrive();
      return;
    }
    Object.assign(f, { active: true, t: -delay, pop, from: { ...from }, to, onArrive, pos: { x: from.x, y: from.y } });
    f.img.setVisible(false).setScale(pop ? 0 : 0.9);
  }

  update(time, delta) {
    const dt = delta / 1000;
    for (const f of this.flights) {
      if (!f.active) continue;
      f.t += dt;
      if (f.t < 0) continue;
      f.img.setVisible(true);
      const POP = f.pop ? 0.3 : 0;
      if (f.t < POP) {
        // pop up out of the person
        const k = Phaser.Math.Easing.Back.Out(f.t / POP);
        f.img.setPosition(f.from.x, f.from.y - 46 * k).setScale(k);
        continue;
      }
      const FLY = 0.75;
      const k = Math.min(1, (f.t - POP) / FLY);
      const e = k * k * (3 - 2 * k);
      const start = f.pop ? { x: f.from.x, y: f.from.y - 46 } : f.from;
      const end = f.to();
      const arc = Math.sin(Math.PI * e) * (f.pop ? 70 : -60);
      f.img.setPosition(start.x + (end.x - start.x) * e, start.y + (end.y - start.y) * e - arc).setScale(0.9 + 0.2 * Math.sin(Math.PI * e)).setAngle(k * 360);
      if (k >= 1) {
        f.active = false;
        f.img.setVisible(false);
        f.onArrive();
      }
    }
  }

  // ---------- Results ----------

  showResults(stats) {
    const total = stats.caught + stats.sneaked;
    const stars = stats.sneaked === 0 ? 3 : stats.caught / total >= 0.6 ? 2 : 1;
    const blocker = this.add.rectangle(640, 360, 1280, 720, 0x0b0d1a, 0.7).setInteractive().setDepth(100);
    const card = this.add.container(640, 380).setDepth(101);
    const w = 760;
    const h = 600;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(-w / 2, -h / 2 + 10, w, h, 34);
    g.fillStyle(0x5a0f1d, 1);
    g.fillRoundedRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10, 36);
    g.fillStyle(COLORS.cream, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 32);
    g.fillStyle(COLORS.indigo, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, 92, { tl: 32, tr: 32, bl: 0, br: 0 });
    g.fillStyle(COLORS.red, 1);
    g.fillRect(-w / 2, -h / 2 + 86, w, 7);
    card.add(g);
    card.add(
      addText(this, 0, -h / 2 + 46, 'results.title', { fontFamily: FONT, fontSize: '54px', fontStyle: '700', color: CSS.cream, stroke: '#10143a', strokeThickness: 8 }).setOrigin(0.5),
    );

    // stars pop in one by one
    for (let i = 0; i < 3; i++) {
      const star = this.add.image(-130 + i * 130, -h / 2 + 170, i < stars ? 'ui-star' : 'ui-star-off').setScale(0).setAngle(-20);
      card.add(star);
      this.tweens.add({ targets: star, scale: i === 1 ? 1.5 : 1.25, angle: 0, duration: 420, delay: 500 + i * 320, ease: 'Back.Out' });
    }

    const rows = [
      ['results.caught', stats.caught, 'icon-caught'],
      ['results.sneaked', stats.sneaked, 'icon-sneaked'],
      ['results.coins', `+${stats.earned}`, 'ui-coin'],
    ];
    rows.forEach(([label, value, icon], i) => {
      const y = -h / 2 + 270 + i * 58;
      card.add(this.add.image(-250, y, icon).setScale(0.85));
      card.add(addText(this, -205, y, label, { fontFamily: FONT, fontSize: '34px', fontStyle: '600', color: CSS.indigo }).setOrigin(0, 0.5));
      card.add(this.add.text(250, y, String(value), { fontFamily: FONT, fontSize: '42px', fontStyle: '700', color: CSS.red, resolution: 2 }).setOrigin(1, 0.5));
    });

    const mithuKey = stars >= 2 ? 'mithu.waveGood' : 'mithu.waveBad';
    card.add(
      addText(this, 0, h / 2 - 132, () => t('results.mithu', { line: t(mithuKey) }), { fontFamily: FONT, fontSize: '28px', fontStyle: '500', color: CSS.indigo, align: 'center', wordWrap: { width: 680 } }).setOrigin(0.5),
    );
    const retry = new Button(this, -150, h / 2 - 58, 'results.retry', () => this.again(), { width: 240, height: 76, fontSize: 34 });
    const menu = new Button(this, 150, h / 2 - 58, 'results.menu', () => this.toMenu(), { width: 240, height: 76, fontSize: 34, style: 'indigo' });
    card.add([retry, menu]);

    card.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 340, ease: 'Back.Out' });
    playSfx(this, 'sfx-win');
    this.resultObjects = [blocker, card];
  }

  again() {
    const level = this.levelScene;
    level.scene.resume();
    level.scene.restart(); // the Level starts a fresh HUD itself
  }

  toMenu() {
    const level = this.levelScene;
    level.scene.resume();
    level.cameras.main.fadeOut(400, 11, 13, 26);
    level.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      level.scene.start('Menu');
    });
  }
}
