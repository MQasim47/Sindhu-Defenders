import Phaser from 'phaser';
import { newCanvas, outline, INK } from '../fx/canvasUtil.js';
import { fillAjrak } from '../fx/ajrakPattern.js';

const SIZE = 130; // the face picture
const MOODS = {
  smirk: { brow: 0.24, eyes: 1, mouth: 'jadugar-smirk', flipMouth: false, top: '#5A2F9A', bottom: '#2A1458' },
  laugh: { brow: -0.12, eyes: 0.38, mouth: 'jadugar-laugh', flipMouth: false, top: '#8A56D6', bottom: '#40207A' },
  angry: { brow: 0.55, eyes: 0.9, mouth: 'jadugar-smirk', flipMouth: true, top: '#B83A4A', bottom: '#4A1030' },
};

// A small round picture of the Jadugar Hacker in the top-right corner of the HUD.
// He smirks when nothing happens, laughs when something gets in, looks angry when Dodo
// catches something, and his crystal ball glows while he plans the next wave.
// The faces are drawn once from the Jadugar parts (3 pictures), then swapped.
export default class JadugarPortrait {
  constructor(scene, x, y) {
    this.scene = scene;
    this.mood = 'smirk';
    this.holdTimer = null;

    Object.keys(MOODS).forEach((mood) => this.makeFace(mood));
    this.makeFrame();

    this.face = scene.add.image(x, y, 'jportrait-smirk').setDepth(20);
    this.frame = scene.add.image(x, y, 'jportrait-frame').setDepth(21);
    this.glow = scene.add.image(x + 46, y + 52, 'fx-glow').setTint(0x8fe0ff).setBlendMode(Phaser.BlendModes.ADD).setScale(0.55).setAlpha(0.3).setDepth(22);
    this.ball = scene.add.image(x + 46, y + 52, 'jadugar-ball').setScale(0.46).setDepth(23);
    this.baseScale = 1;

    scene.tweens.add({ targets: [this.face, this.frame], scale: 1.025, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.ballTween = scene.tweens.add({ targets: this.glow, alpha: 0.5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  // draws one face (mood) into a round texture
  makeFace(mood) {
    const key = `jportrait-${mood}`;
    if (this.scene.textures.exists(key)) return;
    const m = MOODS[mood];
    const tx = this.scene.textures;
    const img = (name) => tx.get(name).getSourceImage();
    const canvas = newCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');
    const c = SIZE / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(c, c, 62, 0, Math.PI * 2);
    ctx.clip();
    const bg = ctx.createRadialGradient(c, c - 10, 6, c, c, 70);
    bg.addColorStop(0, m.top);
    bg.addColorStop(1, m.bottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, SIZE, SIZE);

    const s = 1.25;
    const hx = c;
    const hy = 90; // head centre
    const put = (name, rx, ry, scale = s, flipY = false) => {
      const i = img(name);
      ctx.save();
      ctx.translate(hx + rx * s, hy + ry * s);
      if (flipY) ctx.scale(1, -1);
      ctx.drawImage(i, (-i.width * scale) / 2, (-i.height * scale) / 2, i.width * scale, i.height * scale);
      ctx.restore();
    };
    // robe collar and head
    ctx.fillStyle = '#6B3FA0';
    ctx.beginPath();
    ctx.ellipse(c, 150, 62, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    put('jadugar-head', 0, 0);
    // eyes (a laughing face has them nearly closed)
    [-11, 11].forEach((ex) => {
      const i = img('jadugar-eye');
      ctx.save();
      ctx.translate(hx + ex * s, hy - 3);
      ctx.scale(1.0, 1.0 * m.eyes);
      ctx.drawImage(i, -i.width / 2, -i.height / 2);
      ctx.restore();
    });
    // eyebrows: raised for a smirk, high for a laugh, steep for angry
    [-1, 1].forEach((side) => {
      const i = img('jadugar-brow');
      ctx.save();
      ctx.translate(hx + side * 12 * s, hy - (mood === 'laugh' ? 21 : 16));
      ctx.rotate(side * m.brow);
      if (side === 1) ctx.scale(-1, 1);
      ctx.drawImage(i, (-i.width * 1.0) / 2, (-i.height * 1.0) / 2, i.width, i.height);
      ctx.restore();
    });
    put(m.mouth, 2, mood === 'laugh' ? 27 : 24, 1.0, m.flipMouth);
    put('jadugar-moustache', 0, 13, 0.95);
    // the pointy hat
    const hat = img('jadugar-hat');
    ctx.save();
    ctx.translate(c, 64);
    ctx.rotate(0.06);
    ctx.drawImage(hat, (-hat.width * 1.1) / 2, -hat.height * 1.1 * 0.9, hat.width * 1.1, hat.height * 1.1);
    ctx.restore();
    ctx.restore();

    this.scene.textures.addCanvas(key, canvas);
  }

  // round frame with an Ajrak border
  makeFrame() {
    if (this.scene.textures.exists('jportrait-frame')) return;
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
    outline(ctx, INK, 3);
    this.scene.textures.addCanvas('jportrait-frame', canvas);
  }

  // laugh / angry for a moment, then back to the smirk
  setMood(mood, ms = 1800) {
    this.face.setTexture(`jportrait-${mood}`);
    this.scene.tweens.add({ targets: [this.face, this.frame], scale: { from: 1.14, to: 1 }, duration: 320, ease: 'Back.Out' });
    if (this.holdTimer) this.holdTimer.remove(false);
    this.holdTimer = this.scene.time.delayedCall(ms, () => this.face.setTexture('jportrait-smirk'));
  }

  // the crystal ball glows while he plans the next wave
  setThinking(on) {
    this.scene.tweens.killTweensOf([this.glow, this.ball]);
    if (on) {
      this.glow.setScale(0.9);
      this.scene.tweens.add({ targets: this.glow, alpha: { from: 0.55, to: 1 }, scale: 1.2, duration: 260, yoyo: true, repeat: -1 });
      this.scene.tweens.add({ targets: this.ball, scale: 0.56, duration: 260, yoyo: true, repeat: -1 });
    } else {
      this.glow.setScale(0.55).setAlpha(0.3);
      this.ball.setScale(0.46);
      this.scene.tweens.add({ targets: this.glow, alpha: 0.5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
  }
}
