import Phaser from 'phaser';
import { CSS, FONT } from '../data/colors.js';
import { addText, setSource } from '../i18n/i18nText.js';

// A small keyboard key ("Q", "E") that floats and pulses. Used to teach the keys.
//   setAction('prompt.backup')  - a short label under the key ("Hold E: Backup"), it follows the language
//   setProgress(0..1)           - a ring that fills around the key (for "hold E")
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
    this.ring = scene.add.graphics();
    this.label = addText(scene, 0, 50, '', {
      fontFamily: FONT,
      fontSize: '22px',
      fontStyle: '700',
      color: CSS.cream,
      backgroundColor: 'rgba(11,13,26,0.78)',
      padding: { x: 12, y: 4 },
    }).setOrigin(0.5, 0);
    this.label.setVisible(false);
    this.add([g, text, this.ring, this.label]);
    this.setDepth(99600).setVisible(false);
    scene.add.existing(this);
    this.shown = false;
    this.actionKey = '';
    this.progress = 0;
  }

  setAction(key) {
    if (key === this.actionKey) return;
    this.actionKey = key;
    this.label.setVisible(!!key);
    if (key) setSource(this.label, key);
  }

  setProgress(p) {
    if (p === this.progress) return;
    this.progress = p;
    const g = this.ring;
    g.clear();
    if (p <= 0) return;
    g.lineStyle(7, 0x2a0e14, 0.8);
    g.strokeCircle(0, -4, 38);
    g.lineStyle(7, 0x9bdcff, 1);
    g.beginPath();
    g.arc(0, -4, 38, -Math.PI / 2, -Math.PI / 2 + Math.min(1, p) * Math.PI * 2, false);
    g.strokePath();
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
    this.setProgress(0);
    this.scene.tweens.add({ targets: this, scale: 0, duration: 160, ease: 'Back.In', onComplete: () => this.setVisible(false) });
  }

  // follow a point in the world
  place(x, y) {
    this.setPosition(x, y + Math.sin(this.scene.time.now / 260) * 4);
  }
}
