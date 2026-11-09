import Phaser from 'phaser';
import { COLORS, CSS, FONT_TITLE } from '../data/colors.js';
import { addText } from '../i18n/i18nText.js';
import { playSfx } from '../fx/sound.js';

const STYLES = {
  red: { top: 0xb0283c, bottom: 0x8e1b2b, edge: 0x5a0f1d },
  indigo: { top: 0x34419a, bottom: 0x1c2457, edge: 0x0f1438 },
  locked: { top: 0x9a929e, bottom: 0x726b78, edge: 0x3a3640 }, // not available yet
};

// A chunky rounded button. The label is a text key from src/i18n. It grows on hover, squashes when pressed,
// and can "breathe" gently (options.pulse). Click sound slot: 'sfx-click'.
export default class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, label, onClick, options = {}) {
    super(scene, x, y);
    const { width = 300, height = 78, fontSize = 34, style = 'red', pulse = false } = options;
    this.onClick = onClick;
    this.enabled = true;

    const c = STYLES[style] || STYLES.red;
    const r = height / 2;
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.35);
    bg.fillRoundedRect(-width / 2, -height / 2 + 8, width, height, r);
    bg.fillStyle(c.edge, 1);
    bg.fillRoundedRect(-width / 2 - 3, -height / 2 - 3, width + 6, height + 12, r + 3);
    bg.fillStyle(c.bottom, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height + 5, r);
    bg.fillStyle(c.top, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height * 0.62, { tl: r, tr: r, bl: r * 0.5, br: r * 0.5 });
    bg.lineStyle(3, COLORS.cream, 0.95);
    bg.strokeRoundedRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 4, r - 5);
    bg.fillStyle(0xffffff, 0.2);
    bg.fillRoundedRect(-width / 2 + 16, -height / 2 + 9, width - 32, height * 0.22, 10);

    // label is a text key (see src/i18n), so it changes with the language
    const text = addText(scene, 0, -1, label, {
      fontFamily: FONT_TITLE,
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      color: CSS.cream,
      stroke: '#2A0E14',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // the visual part can pulse without fighting the hover/press scaling
    this.visual = scene.add.container(0, 0, [bg, text]);
    this.add(this.visual);
    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true });

    if (pulse) {
      this.pulseTween = scene.tweens.add({
        targets: this.visual,
        scale: 1.045,
        duration: 760,
        ease: 'Sine.InOut',
        yoyo: true,
        repeat: -1,
      });
    }

    // keyboard focus: a gold ring around the button (setFocused), and press() = the same as a click
    this.focusRing = scene.add.graphics().setVisible(false);
    this.focusRing.lineStyle(6, 0xffd24a, 1);
    this.focusRing.strokeRoundedRect(-width / 2 - 8, -height / 2 - 8, width + 16, height + 20, r + 8);
    this.add(this.focusRing);

    this.on('pointerover', () => this.enabled && this.grow(1.08, 1.08));
    this.on('pointerout', () => this.grow(1, 1));
    this.on('pointerdown', () => this.enabled && this.grow(1.06, 0.88));
    this.on('pointerup', () => {
      if (!this.enabled) return;
      this.grow(1.08, 1.08);
      playSfx(scene, 'sfx-click');
      this.onClick();
    });

    scene.add.existing(this);
  }

  setFocused(on) {
    this.focusRing.setVisible(on);
    this.grow(on ? 1.06 : 1, on ? 1.06 : 1);
  }

  // the same as a mouse click
  press() {
    if (!this.enabled) return;
    playSfx(this.scene, 'sfx-click');
    this.onClick();
  }

  grow(scaleX, scaleY) {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scaleX,
      scaleY,
      duration: 150,
      ease: 'Back.Out',
    });
  }
}
