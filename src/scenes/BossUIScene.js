import Phaser from 'phaser';
import Button from '../ui/Button.js';
import JadugarPortrait from '../ui/JadugarPortrait.js';
import PauseMenu from '../ui/PauseMenu.js';
import { DEFENCES, fit } from '../boss/showdownParts.js';
import { addText, setSource } from '../i18n/i18nText.js';
import { COLORS, CSS, FONT } from '../data/colors.js';
import { newCanvas, INK } from '../fx/canvasUtil.js';
import { fillAjrak } from '../fx/ajrakPattern.js';
import { goToScene } from '../systems/sceneFlow.js';

const BAR_W = 440;
const BAR_H = 34;
const DODO_BAR = { x: 176, y: 44 };
const JAD_BAR = { x: 664, y: 44 };
const HEARTS = 5;
const BUTTON = { w: 292, h: 96, y: 654, gap: 12 };

// The HUD of the showdown (a fighting game screen). It runs next to BossScene.
//   two big bars with a delayed "ghost" part (Dodo's bar has 5 hearts, the Jadugar's bar shows his health),
//   two portraits, the round counter, the combo counter, big banners (ROUND 1 - FIGHT!, K.O.!),
//   the 4 defence buttons (also keys 1-4) and the "lose" card.
export default class BossUIScene extends Phaser.Scene {
  constructor() {
    super('BossUI');
  }

  init(data) {
    this.levelScene = data.level;
    this.ready = false;
  }

  create() {
    this.dodoHp = { value: 1, ghost: 1, hold: 0 };
    this.bossHp = { value: 1, ghost: 1, hold: 0 };
    this.hearts = HEARTS;
    this.glowing = 0;
    this.bars = this.add.graphics().setDepth(10);

    this.buildPortraits();
    this.buildTexts();
    this.buildHearts();
    this.buildButtons();
    this.drawBars();

    this.escKey = this.input.keyboard.addKey('ESC');
    this.pauseMenu = new PauseMenu(this, this.levelScene, () => this.toMenu());
    this.loseOpen = false;
    this.ready = true;
  }

  // ---------- Building ----------

  // a round picture of Dodo's face (from the painted Dodo, else from the drawn parts)
  makeDodoFace() {
    if (this.textures.exists('boss-dodo-face')) return;
    const S = 130;
    const canvas = newCanvas(S, S);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, 62, 0, Math.PI * 2);
    ctx.clip();
    const bg = ctx.createRadialGradient(S / 2, 50, 6, S / 2, S / 2, 70);
    bg.addColorStop(0, '#34419a');
    bg.addColorStop(1, '#1c2457');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, S, S);
    try {
      if (this.textures.exists('dodo-full')) {
        const img = this.textures.get('dodo-full').getSourceImage();
        const side = img.width * 0.95; // the top part of the picture: topi, face
        ctx.drawImage(img, img.width * 0.025, 0, side, side, 0, 6, S, S);
      } else {
        const head = this.textures.get('dodo-head').getSourceImage();
        const k = 1.35;
        ctx.drawImage(head, (S - head.width * k) / 2, (S - head.height * k) / 2 + 6, head.width * k, head.height * k);
      }
    } catch (e) {
      // a plain blue circle is fine
    }
    this.textures.addCanvas('boss-dodo-face', canvas);
  }

  makeDodoFrame() {
    if (this.textures.exists('boss-dodo-frame')) return;
    const S = 156;
    const c = S / 2;
    const canvas = newCanvas(S, S);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(c, c, 75, 0, Math.PI * 2);
    ctx.arc(c, c, 60, 0, Math.PI * 2, true);
    ctx.fillStyle = '#140A10';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c, c, 72, 0, Math.PI * 2);
    ctx.arc(c, c, 62.5, 0, Math.PI * 2, true);
    fillAjrak(ctx, 20);
    ctx.beginPath();
    ctx.arc(c, c, 61, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#E8B84A';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c, c, 75, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    this.textures.addCanvas('boss-dodo-frame', canvas);
  }

  buildPortraits() {
    this.makeDodoFace();
    this.makeDodoFrame();
    this.dodoFace = this.add.image(82, 84, 'boss-dodo-face').setDepth(20);
    this.dodoFrame = this.add.image(82, 84, 'boss-dodo-frame').setDepth(21);
    this.portrait = new JadugarPortrait(this, 1198, 84);
  }

  buildTexts() {
    const nameStyle = { fontFamily: FONT, fontSize: '26px', fontStyle: '700', color: CSS.cream, stroke: '#10143a', strokeThickness: 6, resolution: 2 };
    this.add.text(DODO_BAR.x, 92, 'DODO', nameStyle).setDepth(12);
    this.add.text(JAD_BAR.x + BAR_W, 92, 'JADUGAR', nameStyle).setOrigin(1, 0).setDepth(12);
    this.roundText = addText(this, 640, 118, 'boss.round', { fontFamily: FONT, fontSize: '30px', fontStyle: '700', color: CSS.gold, stroke: '#10143a', strokeThickness: 6 }, { n: 1 }).setOrigin(0.5).setDepth(12);
    this.comboText = addText(this, 176, 172, 'boss.combo', { fontFamily: FONT, fontSize: '44px', fontStyle: '700', color: '#FFD24A', stroke: '#8E1B2B', strokeThickness: 8 }, { n: 0 }).setOrigin(0, 0.5).setDepth(12).setVisible(false);
    this.banner = addText(this, 640, 300, 'boss.fight', { fontFamily: FONT, fontSize: '120px', fontStyle: '700', color: CSS.cream, stroke: '#8E1B2B', strokeThickness: 16 }).setOrigin(0.5).setDepth(40).setVisible(false);
    this.subBanner = addText(this, 640, 410, 'boss.fight', { fontFamily: FONT, fontSize: '70px', fontStyle: '700', color: '#FFD24A', stroke: '#10143a', strokeThickness: 12 }).setOrigin(0.5).setDepth(40).setVisible(false);
    const hint = addText(this, 640, 578, 'hud.controlsBoss', { fontFamily: FONT, fontSize: '20px', fontStyle: '500', color: CSS.cream, backgroundColor: 'rgba(11,13,26,0.6)', padding: { x: 12, y: 4 } }).setOrigin(0.5).setDepth(12);
    this.tweens.add({ targets: hint, alpha: 0, delay: 12000, duration: 800, onComplete: () => hint.destroy() });
  }

  // five hearts on Dodo's bar
  buildHearts() {
    this.heartImages = [];
    for (let i = 0; i < HEARTS; i++) {
      const x = DODO_BAR.x + (BAR_W / HEARTS) * (i + 0.5);
      this.heartImages.push(this.add.image(x, DODO_BAR.y + BAR_H / 2, 'fx-heart').setScale(1.25).setDepth(14));
    }
  }

  // the four defence buttons: icon, number key, label. A glowing frame shows the right one (round 1).
  buildButtons() {
    const total = BUTTON.w * 4 + BUTTON.gap * 3;
    this.buttons = DEFENCES.map((d, i) => {
      const x = 640 - total / 2 + BUTTON.w / 2 + i * (BUTTON.w + BUTTON.gap);
      const c = this.add.container(x, BUTTON.y).setDepth(30);
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.4);
      g.fillRoundedRect(-BUTTON.w / 2, -BUTTON.h / 2 + 8, BUTTON.w, BUTTON.h, 24);
      g.fillStyle(0x5a0f1d, 1);
      g.fillRoundedRect(-BUTTON.w / 2 - 4, -BUTTON.h / 2 - 4, BUTTON.w + 8, BUTTON.h + 8, 26);
      g.fillStyle(COLORS.cream, 1);
      g.fillRoundedRect(-BUTTON.w / 2, -BUTTON.h / 2, BUTTON.w, BUTTON.h, 22);
      g.fillStyle(COLORS.indigo, 1);
      g.fillRoundedRect(-BUTTON.w / 2, -BUTTON.h / 2, 96, BUTTON.h, { tl: 22, tr: 0, bl: 22, br: 0 });
      const icon = fit(this.add.image(-BUTTON.w / 2 + 48, 6, d.icon), 62);
      const num = this.add.text(-BUTTON.w / 2 + 14, -BUTTON.h / 2 + 8, String(d.n), { fontFamily: FONT, fontSize: '30px', fontStyle: '700', color: CSS.gold, stroke: '#10143a', strokeThickness: 5, resolution: 2 });
      const label = addText(this, 52, 0, d.label, { fontFamily: FONT, fontSize: '25px', fontStyle: '700', color: CSS.indigo, align: 'center', wordWrap: { width: 176 } }).setOrigin(0.5);
      const glow = this.add.graphics().setVisible(false);
      glow.lineStyle(8, 0xffd24a, 1);
      glow.strokeRoundedRect(-BUTTON.w / 2 - 6, -BUTTON.h / 2 - 6, BUTTON.w + 12, BUTTON.h + 12, 28);
      const flash = this.add.rectangle(0, 0, BUTTON.w, BUTTON.h, 0xffffff, 0).setOrigin(0.5);
      c.add([g, icon, num, label, glow, flash]);
      c.setSize(BUTTON.w, BUTTON.h).setInteractive({ useHandCursor: true });
      c.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.04, duration: 100 }));
      c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 100 }));
      c.on('pointerdown', () => this.levelScene.defend(d.n));
      c.glow = glow;
      c.flash = flash;
      c.pulse = null;
      return c;
    });
  }

  // ---------- Bars ----------

  drawBar(g, bar, hp, mirror, colors) {
    const x = bar.x;
    const y = bar.y;
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(x - 4, y - 2, BAR_W + 8, BAR_H + 12, 14);
    g.fillStyle(0x3a1c16, 1);
    g.fillRoundedRect(x - 6, y - 5, BAR_W + 12, BAR_H + 10, 14);
    g.fillStyle(0x140a10, 1);
    g.fillRoundedRect(x, y, BAR_W, BAR_H, 10);
    const part = (frac, color) => {
      const w = Math.max(0, BAR_W * frac);
      if (w < 1) return;
      g.fillStyle(color, 1);
      g.fillRoundedRect(mirror ? x + BAR_W - w : x, y, w, BAR_H, 10);
    };
    part(hp.ghost, 0xfff2b0); // the delayed ghost bar (what was just lost)
    part(hp.value, colors(hp.value));
    g.fillStyle(0xffffff, 0.2);
    g.fillRoundedRect(x + 6, y + 4, BAR_W - 12, 8, 4);
    g.lineStyle(3, 0xe8b84a, 1);
    g.strokeRoundedRect(x - 1, y - 1, BAR_W + 2, BAR_H + 2, 11);
  }

  drawBars() {
    const g = this.bars;
    g.clear();
    this.drawBar(g, DODO_BAR, this.dodoHp, false, () => 0xe5453a);
    // the five heart steps on Dodo's bar
    g.lineStyle(3, 0x3a1c16, 0.9);
    for (let i = 1; i < HEARTS; i++) {
      const x = DODO_BAR.x + (BAR_W / HEARTS) * i;
      g.beginPath();
      g.moveTo(x, DODO_BAR.y + 2);
      g.lineTo(x, DODO_BAR.y + BAR_H - 2);
      g.strokePath();
    }
    this.drawBar(g, JAD_BAR, this.bossHp, true, () => 0xb05cf0);
  }

  // hearts left (0-5)
  setHearts(n) {
    const lost = n < this.hearts;
    this.hearts = n;
    const frac = n / HEARTS;
    if (lost) this.dodoHp.hold = 0.5;
    else this.dodoHp.ghost = Math.max(this.dodoHp.ghost, frac);
    this.dodoHp.value = frac;
    this.heartImages.forEach((h, i) => {
      h.setTint(i < n ? 0xffffff : 0x4a3a44).setAlpha(i < n ? 1 : 0.6);
      if (lost && i === n) this.tweens.add({ targets: h, scale: { from: 1.9, to: 1.25 }, duration: 320, ease: 'Back.Out' });
    });
    if (lost) this.tweens.add({ targets: [this.dodoFace, this.dodoFrame], scale: { from: 1.15, to: 1 }, duration: 260, ease: 'Back.Out' });
  }

  // frac 0..1
  setBossHp(frac) {
    const hit = frac < this.bossHp.value;
    this.bossHp.value = Phaser.Math.Clamp(frac, 0, 1);
    if (hit) this.bossHp.hold = 0.5;
    else this.bossHp.ghost = Math.max(this.bossHp.ghost, this.bossHp.value);
  }

  // ---------- Called by the BossScene ----------

  setRound(n) {
    setSource(this.roundText, 'boss.round', { n });
  }

  setCombo(n) {
    if (n < 2) {
      this.comboText.setVisible(false);
      return;
    }
    setSource(this.comboText, 'boss.combo', { n });
    this.comboText.setVisible(true);
    this.tweens.killTweensOf(this.comboText);
    this.comboText.setScale(1.4);
    this.tweens.add({ targets: this.comboText, scale: 1, duration: 200, ease: 'Back.Out' });
  }

  // the right button gently glows (0 = none)
  setGlow(n) {
    this.glowing = n;
    this.buttons.forEach((b, i) => {
      const on = i + 1 === n;
      b.glow.setVisible(on);
      if (b.pulse) {
        b.pulse.stop();
        b.pulse = null;
        b.setScale(1);
      }
      if (on) b.pulse = this.tweens.add({ targets: b, scale: 1.06, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    });
  }

  pressFlash(n) {
    const b = this.buttons[n - 1];
    if (!b) return;
    b.flash.setAlpha(0.7).setFillStyle(0xffffff);
    this.tweens.add({ targets: b.flash, alpha: 0, duration: 220 });
  }

  // a wrong button: it flashes red
  markWrong(n) {
    const b = this.buttons[n - 1];
    if (!b) return;
    b.flash.setFillStyle(0xff3b3b).setAlpha(0.7);
    this.tweens.add({ targets: b.flash, alpha: 0, duration: 420 });
    this.tweens.add({ targets: b, x: b.x + 8, duration: 50, yoyo: true, repeat: 3 });
  }

  // a big text in the middle: "ROUND 1" then "FIGHT!", "K.O.!" ...
  showBanner(main, sub, hold = 900, color = CSS.cream) {
    this.banner.setColor(color);
    setSource(this.banner, main[0], main[1]);
    this.banner.setVisible(true).setAlpha(1).setScale(2.2);
    this.tweens.killTweensOf([this.banner, this.subBanner]);
    this.tweens.add({ targets: this.banner, scale: 1, duration: 320, ease: 'Back.Out' });
    this.tweens.add({ targets: this.banner, alpha: 0, scale: 1.15, delay: 320 + hold, duration: 280, onComplete: () => this.banner.setVisible(false) });
    if (sub) {
      setSource(this.subBanner, sub[0], sub[1]);
      this.subBanner.setVisible(true).setAlpha(0).setScale(0.5);
      this.tweens.add({ targets: this.subBanner, alpha: 1, scale: 1, duration: 260, delay: hold * 0.6, ease: 'Back.Out' });
      this.tweens.add({ targets: this.subBanner, alpha: 0, delay: 320 + hold, duration: 280, onComplete: () => this.subBanner.setVisible(false) });
    }
  }

  setJadugarMood(mood) {
    this.portrait.setMood(mood);
  }

  // Dodo lost all hearts: a card with one tip. tipKey = a key like 'boss.tip.hammer'
  showLose(tipKey) {
    this.loseOpen = true;
    const blocker = this.add.rectangle(640, 360, 1280, 720, 0x0b0d1a, 0.75).setInteractive().setDepth(100);
    const card = this.add.container(640, 340).setDepth(101);
    const w = 760;
    const h = 430;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(-w / 2, -h / 2 + 10, w, h, 30);
    g.fillStyle(0x5a0f1d, 1);
    g.fillRoundedRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 32);
    g.fillStyle(COLORS.cream, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 28);
    g.fillStyle(COLORS.indigo, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, 84, { tl: 28, tr: 28, bl: 0, br: 0 });
    g.fillStyle(COLORS.red, 1);
    g.fillRect(-w / 2, -h / 2 + 78, w, 6);
    card.add(g);
    card.add(addText(this, 0, -h / 2 + 42, 'boss.lose', { fontFamily: FONT, fontSize: '40px', fontStyle: '700', color: CSS.cream, stroke: '#10143a', strokeThickness: 7 }).setOrigin(0.5));
    card.add(addText(this, 0, -30, tipKey, { fontFamily: FONT, fontSize: '28px', fontStyle: '600', color: CSS.indigo, align: 'center', wordWrap: { width: w - 100 } }).setOrigin(0.5));
    card.add(new Button(this, -170, h / 2 - 70, 'boss.retry', () => this.retry(), { width: 270, height: 74, fontSize: 32, pulse: true }));
    card.add(new Button(this, 170, h / 2 - 70, 'boss.menu', () => this.toMenu(), { width: 240, height: 74, fontSize: 30, style: 'indigo' }));
    card.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 340, ease: 'Back.Out' });
  }

  // try again: the fight starts at the round where Dodo lost
  retry() {
    const level = this.levelScene;
    level.scene.resume();
    level.cameras.main.fadeOut(300, 11, 13, 26);
    level.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      level.scene.restart({ startRound: level.round, codeWord: level.codeWord });
    });
  }

  toMenu() {
    const level = this.levelScene;
    level.scene.resume();
    level.cameras.main.fadeOut(400, 11, 13, 26);
    level.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      goToScene(level, 'Menu');
    });
  }

  // ---------- Update ----------

  update(time, delta) {
    if (!this.ready) return;
    const dt = Math.min(delta, 50) / 1000;
    if (!this.loseOpen && !this.levelScene.cutscene && Phaser.Input.Keyboard.JustDown(this.escKey)) this.pauseMenu.toggle();

    // the ghost bars slowly follow the real bars
    let moved = false;
    [this.dodoHp, this.bossHp].forEach((hp) => {
      if (hp.ghost > hp.value) {
        moved = true;
        if (hp.hold > 0) hp.hold -= dt;
        else hp.ghost = Math.max(hp.value, hp.ghost - dt * 0.35);
      }
    });
    if (moved || this.barsDirty || this.lastDodo !== this.dodoHp.value || this.lastBoss !== this.bossHp.value) this.drawBars();
    this.barsDirty = moved;
    this.lastDodo = this.dodoHp.value;
    this.lastBoss = this.bossHp.value;
  }
}
