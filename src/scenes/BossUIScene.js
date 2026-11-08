import Phaser from 'phaser';
import Button from '../ui/Button.js';
import JadugarPortrait from '../ui/JadugarPortrait.js';
import PauseMenu from '../ui/PauseMenu.js';
import { addText, setSource } from '../i18n/i18nText.js';
import { COLORS, CSS, FONT } from '../data/colors.js';
import { newCanvas, INK } from '../fx/canvasUtil.js';
import { fillAjrak } from '../fx/ajrakPattern.js';

const BAR_W = 440;
const BAR_H = 34;
const DODO_BAR = { x: 176, y: 44 };
const JAD_BAR = { x: 664, y: 44 };

// The HUD of the boss fight (a fighting game screen). It runs next to BossScene.
//   two big health bars with a delayed "ghost" bar, two portraits, the round counter,
//   the combo counter, the shield cooldown ring, big banners (ROUND 1 - FIGHT!, K.O.!),
//   the Jadugar's taunts and the "lose" card.
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
    this.bars = this.add.graphics().setDepth(10);

    this.buildPortraits();
    this.buildTexts();
    this.buildShieldIcon();
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
    const nameStyle = { fontFamily: FONT, fontSize: '26px', fontStyle: '700', color: CSS.cream, stroke: '#10143a', strokeThickness: 6 };
    this.add.text(DODO_BAR.x, 92, 'DODO', { ...nameStyle, resolution: 2 }).setDepth(12);
    this.add.text(JAD_BAR.x + BAR_W, 92, 'JADUGAR', { ...nameStyle, resolution: 2 }).setOrigin(1, 0).setDepth(12);

    this.roundText = addText(this, 640, 118, 'boss.round', { fontFamily: FONT, fontSize: '30px', fontStyle: '700', color: CSS.gold, stroke: '#10143a', strokeThickness: 6 }, { n: 1 }).setOrigin(0.5).setDepth(12);
    this.comboText = addText(this, 176, 176, 'boss.combo', { fontFamily: FONT, fontSize: '44px', fontStyle: '700', color: '#FFD24A', stroke: '#8E1B2B', strokeThickness: 8 }, { n: 0 }).setOrigin(0, 0.5).setDepth(12).setVisible(false);
    this.banner = addText(this, 640, 330, 'boss.fight', { fontFamily: FONT, fontSize: '120px', fontStyle: '700', color: CSS.cream, stroke: '#8E1B2B', strokeThickness: 16 }).setOrigin(0.5).setDepth(40).setVisible(false);
    this.subBanner = addText(this, 640, 440, 'boss.fight', { fontFamily: FONT, fontSize: '70px', fontStyle: '700', color: '#FFD24A', stroke: '#10143a', strokeThickness: 12 }).setOrigin(0.5).setDepth(40).setVisible(false);

    // the Jadugar's taunt (a small speech box under his portrait)
    this.tauntBox = this.add.container(1050, 196).setDepth(30).setVisible(false);
    const bg = this.add.graphics();
    bg.fillStyle(0xfff6dc, 1);
    bg.fillRoundedRect(-170, -30, 340, 60, 18);
    bg.lineStyle(4, 0x3a1c16, 1);
    bg.strokeRoundedRect(-170, -30, 340, 60, 18);
    this.tauntText = addText(this, 0, 0, 'boss.taunt.switch', { fontFamily: FONT, fontSize: '22px', fontStyle: '700', color: CSS.ink, align: 'center', wordWrap: { width: 320 } }).setOrigin(0.5);
    this.tauntBox.add([bg, this.tauntText]);

    // controls hint at the start
    const hint = addText(this, 640, 690, 'hud.controlsBoss', { fontFamily: FONT, fontSize: '22px', fontStyle: '500', color: CSS.cream, backgroundColor: 'rgba(11,13,26,0.6)', padding: { x: 14, y: 5 } })
      .setOrigin(0.5)
      .setDepth(12);
    this.tweens.add({ targets: hint, alpha: 0, delay: 9000, duration: 800, onComplete: () => hint.destroy() });
  }

  // the Firewall Shield icon (bottom left) with a ring that fills while it recharges
  buildShieldIcon() {
    this.shieldRing = this.add.graphics().setDepth(12);
    this.shieldKey = this.add.text(70, 636, 'E', { fontFamily: FONT, fontSize: '34px', fontStyle: '700', color: CSS.cream, resolution: 2 }).setOrigin(0.5).setDepth(13);
    addText(this, 70, 688, 'boss.shield', { fontFamily: FONT, fontSize: '20px', fontStyle: '600', color: CSS.cream, stroke: '#10143a', strokeThickness: 4 }).setOrigin(0.5).setDepth(13);
    this.shieldFrac = 1;
    this.drawShield(1);
  }

  drawShield(frac) {
    const g = this.shieldRing;
    g.clear();
    g.fillStyle(0x1c2457, 0.9);
    g.fillCircle(70, 636, 36);
    g.lineStyle(7, 0x2a0e14, 1);
    g.strokeCircle(70, 636, 36);
    g.lineStyle(7, frac >= 1 ? 0xffd24a : 0x9a929e, 1);
    g.beginPath();
    g.arc(70, 636, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac, false);
    g.strokePath();
    this.shieldKey.setAlpha(frac >= 1 ? 1 : 0.5);
  }

  // ---------- Health bars ----------

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
    // shine
    g.fillStyle(0xffffff, 0.2);
    g.fillRoundedRect(x + 6, y + 4, BAR_W - 12, 8, 4);
    g.lineStyle(3, 0xe8b84a, 1);
    g.strokeRoundedRect(x - 1, y - 1, BAR_W + 2, BAR_H + 2, 11);
  }

  drawBars() {
    const g = this.bars;
    g.clear();
    this.drawBar(g, DODO_BAR, this.dodoHp, false, (v) => (v > 0.5 ? 0x3fcf6a : v > 0.25 ? 0xf2c230 : 0xe5453a));
    this.drawBar(g, JAD_BAR, this.bossHp, true, () => 0xb05cf0);
  }

  // frac 0..1
  setDodoHp(frac) {
    const hit = frac < this.dodoHp.value;
    this.dodoHp.value = Phaser.Math.Clamp(frac, 0, 1);
    if (hit) {
      this.dodoHp.hold = 0.5;
      this.tweens.add({ targets: [this.dodoFace, this.dodoFrame], scale: { from: 1.15, to: 1 }, duration: 260, ease: 'Back.Out' });
    } else this.dodoHp.ghost = Math.max(this.dodoHp.ghost, this.dodoHp.value);
  }

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

  setShield(frac) {
    if (frac === this.shieldFrac || (frac < 1 && Math.abs(frac - this.shieldFrac) < 0.01)) return;
    const wasReady = this.shieldFrac >= 1;
    this.shieldFrac = frac;
    this.drawShield(frac);
    if (frac >= 1 && !wasReady) this.tweens.add({ targets: this.shieldKey, scale: { from: 1.5, to: 1 }, duration: 260, ease: 'Back.Out' });
  }

  // a big text in the middle: "ROUND 1" then "FIGHT!", "K.O.!" ...
  // main = [key, vars], sub = [key, vars] (optional). The text zooms in, stays, and fades.
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

  // the Jadugar talks (the AI noticed something): his portrait laughs and a box shows the line
  taunt(key, mood = 'laugh') {
    this.portrait.setMood(mood, 2400);
    setSource(this.tauntText, key);
    this.tauntBox.setVisible(true).setScale(0);
    this.tweens.killTweensOf(this.tauntBox);
    this.tweens.add({ targets: this.tauntBox, scale: 1, duration: 260, ease: 'Back.Out' });
    this.tweens.add({ targets: this.tauntBox, alpha: 0, delay: 2600, duration: 300, onComplete: () => this.tauntBox.setVisible(false).setAlpha(1) });
  }

  setJadugarMood(mood) {
    this.portrait.setMood(mood);
  }

  // Dodo lost: a card with one tip. tipKey = a key like 'boss.tip.hathoda'
  showLose(tipKey) {
    this.loseOpen = true;
    const blocker = this.add.rectangle(640, 360, 1280, 720, 0x0b0d1a, 0.75).setInteractive().setDepth(100);
    const card = this.add.container(640, 360).setDepth(101);
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
    this.loseObjects = [blocker, card];
  }

  retry() {
    const level = this.levelScene;
    level.scene.resume();
    level.cameras.main.fadeOut(300, 11, 13, 26);
    level.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      level.scene.restart();
    });
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
    if (moved || this.barsDirty) this.drawBars();
    this.barsDirty = moved;
    if (!moved && (this.lastDodo !== this.dodoHp.value || this.lastBoss !== this.bossHp.value)) this.drawBars();
    this.lastDodo = this.dodoHp.value;
    this.lastBoss = this.bossHp.value;
  }
}
