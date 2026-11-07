import Phaser from 'phaser';
import { settings } from '../data/settings.js';
import { makeCanvasTexture } from '../fx/canvasUtil.js';
import { TORCHES, BANNERS } from './courtyardData.js';

const VIEW_W = 1280;
const VIEW_H = 720;

// Life for the level: torches that flicker, banners that sway, drifting dust,
// a warm late-afternoon colour wash and a soft vignette.
export default class Atmosphere {
  constructor(scene, k) {
    this.scene = scene;
    this.time = 0;
    this.torches = [];
    this.banners = [];
    this.motes = [];

    this.addGrade();
    this.addMotes();
    if (k) {
      this.addTorches(k);
      this.addBanners(k);
    }
  }

  // One screen-sized picture: warm gradient + dark corners.
  addGrade() {
    makeCanvasTexture(this.scene, 'level-grade', VIEW_W, VIEW_H, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      g.addColorStop(0, 'rgba(255,150,70,0.16)');
      g.addColorStop(0.5, 'rgba(255,190,110,0.05)');
      g.addColorStop(1, 'rgba(110,40,70,0.16)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      const v = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.45, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.72);
      v.addColorStop(0, 'rgba(30,10,20,0)');
      v.addColorStop(1, 'rgba(30,10,20,0.5)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    });
    this.scene.add.image(0, 0, 'level-grade').setOrigin(0).setScrollFactor(0).setDepth(99000);
  }

  // A few dust specks drifting through the light (the count is capped).
  addMotes() {
    const count = settings.low ? 8 : 24;
    for (let i = 0; i < count; i++) {
      const mote = this.scene.add
        .image(Math.random() * VIEW_W, Math.random() * VIEW_H, 'fx-mote')
        .setScrollFactor(0)
        .setDepth(98000)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(0.5 + Math.random() * 0.9)
        .setAlpha(0.15 + Math.random() * 0.35);
      mote.speed = 8 + Math.random() * 16;
      mote.wobble = Math.random() * 6.28;
      this.motes.push(mote);
    }
  }

  addTorches(k) {
    TORCHES.forEach(([x, y], i) => {
      const wx = x * k;
      const wy = y * k;
      // soot mark above the flame, then bracket, flame and glow
      this.scene.add.image(wx, wy - 70, 'fx-dust').setTint(0x000000).setAlpha(0.28).setScale(1.5, 2.6).setDepth(wy);
      this.scene.add.image(wx, wy, 'prop-torch').setOrigin(0.5, 0.9).setDepth(wy);
      const flame = this.scene.add.image(wx, wy - 36, 'prop-flame').setOrigin(0.5, 1).setDepth(wy + 1);
      const glow = this.scene.add
        .image(wx, wy - 50, 'fx-glow')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(2.6)
        .setAlpha(0.42)
        .setDepth(wy + 2);
      this.torches.push({ flame, glow, phase: i * 1.7 });
    });
  }

  addBanners(k) {
    BANNERS.forEach(([x, y], i) => {
      const banner = this.scene.add.image(x * k, y * k, 'prop-banner').setOrigin(0.5, 0).setDepth(y * k + 150);
      this.banners.push({ banner, phase: i * 1.3 });
    });
  }

  update(dt) {
    this.time += dt;
    const t = this.time;

    for (const m of this.motes) {
      m.x += m.speed * dt;
      m.y += Math.sin(t * 0.7 + m.wobble) * 6 * dt - 2 * dt;
      if (m.x > VIEW_W + 10) m.x = -10;
      if (m.y < -10) m.y = VIEW_H + 10;
    }

    const calm = settings.low || settings.reduced;
    for (const torch of this.torches) {
      const f = Math.sin(t * 13 + torch.phase) * 0.5 + Math.sin(t * 7.3 + torch.phase * 2) * 0.5;
      torch.flame.setScale(1 + f * 0.06, 1 + f * (calm ? 0.04 : 0.16));
      torch.glow.setAlpha(0.4 + (calm ? 0 : f * 0.08));
    }
    for (const b of this.banners) {
      b.banner.rotation = Math.sin(t * 1.5 + b.phase) * 0.05 + Math.sin(t * 3.1 + b.phase) * 0.012;
    }
  }
}
