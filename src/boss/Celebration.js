import Phaser from 'phaser';
import { settings } from '../data/settings.js';
import { playSfx } from '../fx/sound.js';

const COLORS = [0xe8b84a, 0x8e1b2b, 0x1c2457, 0xf3e9d2, 0x3fcf6a, 0xb05cf0, 0xff8a3d];

// The win party: confetti (pooled, nothing is created while it falls) and two Ajrak banners.
export default class Celebration {
  constructor(scene) {
    this.scene = scene;
    this.running = false;
    this.spawnLeft = 0;
    this.pieces = [];
    const count = settings.low ? 30 : 80;
    for (let i = 0; i < count; i++) {
      const image = scene.add.image(0, 0, 'boss-confetti').setVisible(false).setDepth(850);
      this.pieces.push({ image, on: false, vx: 0, vy: 0, spin: 0, phase: 0 });
    }
    this.banners = [240, 1040].map((x) => scene.add.image(x, -340, 'boss-banner').setOrigin(0.5, 0).setDepth(840).setVisible(false));
  }

  start() {
    this.running = true;
    this.spawnLeft = this.pieces.length * 2.2; // each piece is used about twice
    playSfx(this.scene, 'sfx-confetti');
    this.banners.forEach((b, i) => {
      b.setVisible(true).setY(-340);
      this.scene.tweens.add({ targets: b, y: 135, duration: 900, delay: 300 + i * 200, ease: 'Bounce.Out' });
      this.scene.tweens.add({ targets: b, angle: { from: -2.5, to: 2.5 }, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: 1400 });
    });
  }

  update(dt) {
    if (!this.running) return;
    if (this.spawnLeft > 0) {
      const burst = Math.min(3, Math.ceil(dt * 90));
      for (let i = 0; i < burst && this.spawnLeft > 0; i++) {
        const piece = this.pieces.find((p) => !p.on);
        if (!piece) break;
        this.spawnLeft--;
        Object.assign(piece, { on: true, vx: Phaser.Math.Between(-60, 60), vy: Phaser.Math.Between(90, 230), spin: Phaser.Math.Between(-400, 400), phase: Math.random() * 6 });
        piece.image.setVisible(true).setPosition(Phaser.Math.Between(20, 1260), -20).setTint(COLORS[Phaser.Math.Between(0, COLORS.length - 1)]).setAngle(Math.random() * 360);
      }
    }
    for (const p of this.pieces) {
      if (!p.on) continue;
      p.phase += dt * 4;
      p.image.x += (p.vx + Math.sin(p.phase) * 50) * dt;
      p.image.y += p.vy * dt;
      p.image.angle += p.spin * dt;
      p.image.scaleY = Math.abs(Math.cos(p.phase)) + 0.2;
      if (p.image.y > 760) {
        p.on = false;
        p.image.setVisible(false);
      }
    }
  }
}
