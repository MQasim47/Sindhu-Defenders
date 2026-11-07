import Phaser from 'phaser';
import { CSS, FONT } from '../data/colors.js';

// A small keyboard key ("Q", "E") that floats and pulses. Used to teach the keys.
export default class KeyHint extends Phaser.GameObjects.Container {
  constructor(scene, letter) {
    super(scene, 0, 0);
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(-24, -20, 48, 52, 12);
    g.fillStyle(0x3a1c16, 1);
    g.fillRoundedRect(-26, -26, 52, 54, 13);
    g.fillStyle(0xfff6dc, 1);
    g.fillRoundedRect(-22, -22, 44, 42, 10);
    g.fillStyle(0xffffff, 0.6);
    g.fillRoundedRect(-17, -19, 34, 7, 4);
    const text = scene.add
      .text(0, -3, letter, { fontFamily: FONT, fontSize: '32px', fontStyle: '700', color: CSS.red, resolution: 2 })
      .setOrigin(0.5);
    this.add([g, text]);
    this.setDepth(99600).setVisible(false);
    scene.add.existing(this);
    this.shown = false;
  }

  show() {
    if (this.shown) return;
    this.shown = true;
    this.setVisible(true).setScale(0);
    this.scene.tweens.add({ targets: this, scale: 1, duration: 260, ease: 'Back.Out' });
    this.pulse = this.scene.tweens.add({ targets: this, scale: 1.12, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: 300 });
  }

  hide() {
    if (!this.shown) return;
    this.shown = false;
    if (this.pulse) this.pulse.stop();
    this.scene.tweens.add({ targets: this, scale: 0, duration: 160, ease: 'Back.In', onComplete: () => this.setVisible(false) });
  }

  // follow a point in the world
  place(x, y) {
    this.setPosition(x, y + Math.sin(this.scene.time.now / 260) * 4);
  }
}
