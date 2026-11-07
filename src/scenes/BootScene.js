import Phaser from 'phaser';
import Emblem from '../ui/Emblem.js';
import AjrakCloth from '../ui/AjrakCloth.js';
import { createPlaceholderTextures } from '../objects/placeholderTextures.js';
import { COLORS, CSS, FONT_TITLE } from '../data/colors.js';
import { addText } from '../i18n/i18nText.js';

const SPLASH_TIME = 3200;

// Boot: a short splash. The emblem pops in, a light sweeps over it, the subtitle fades in.
// Any key or click skips it. (The emblem is drawn in code, so nothing must load first.)
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    createPlaceholderTextures(this);
    this.leaving = false;

    this.add.rectangle(640, 360, 1280, 720, COLORS.dark);
    const pattern = this.add.tileSprite(640, 360, 1280, 720, 'ajrak-tile').setAlpha(0.07);
    this.tweens.add({ targets: pattern, tilePositionX: 128, tilePositionY: 128, duration: 6000, repeat: -1 });
    // dark vignette so the emblem stands out
    const glow = this.add.image(640, 330, 'fx-glow').setScale(7).setTint(0x2b3580).setAlpha(0.35);
    this.tweens.add({ targets: glow, alpha: 0.5, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // an Ajrak cloth unrolls and waves behind the shield, then settles
    this.cloth = new AjrakCloth(this, 640, 270, 680, 340);

    // a dark soft shadow behind the shield, so it stands out from the cloth
    const shadow = this.add.image(640, 285, 'fx-glow').setScale(4.4).setTint(0x000000).setAlpha(0);
    this.tweens.add({ targets: shadow, alpha: 0.75, duration: 700, delay: 500 });
    const emblem = new Emblem(this, 640, 278).setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: emblem, scale: 1.22, alpha: 1, duration: 700, delay: 500, ease: 'Back.Out' });
    this.time.delayedCall(1300, () => emblem.shine(850));
    emblem.startSparkles();

    const name = addText(this, 640, 490, 'game.title', {
      fontFamily: FONT_TITLE,
      fontSize: '46px',
      fontStyle: 'bold',
      color: CSS.cream,
      stroke: '#2A0E14',
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setAlpha(0);
    const subtitle = addText(this, 640, 552, 'boot.stream', { fontFamily: FONT_TITLE, fontSize: '28px', color: CSS.gold })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: name, alpha: 1, y: 482, duration: 500, delay: 1100, ease: 'Cubic.Out' });
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 600, delay: 1500 });

    this.cameras.main.fadeIn(300, 11, 13, 26);
    this.time.delayedCall(SPLASH_TIME, () => this.leave());
    this.input.keyboard.once('keydown', () => this.leave());
    this.input.once('pointerdown', () => this.leave());
  }

  update(time, delta) {
    if (this.cloth) this.cloth.update(Math.min(delta, 50) / 1000);
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(300, 11, 13, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Preload'));
  }
}
