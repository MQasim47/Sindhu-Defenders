import Phaser from 'phaser';
import Button from '../ui/Button.js';
import { COLORS, CSS, FONT } from '../data/colors.js';
import { addText } from '../i18n/i18nText.js';

// Base for scenes that are not built yet: shows a title (a text key) and a back button.
export default class StubScene extends Phaser.Scene {
  constructor(key, title) {
    super(key);
    this.stubTitle = title;
  }

  create() {
    this.cameras.main.fadeIn(400, 11, 13, 26);
    this.add.rectangle(640, 360, 1280, 720, COLORS.indigo);
    addText(this, 640, 300, this.stubTitle, { fontFamily: FONT, fontSize: '64px', fontStyle: 'bold', color: CSS.cream }).setOrigin(0.5);
    addText(this, 640, 390, 'common.comingSoon', { fontFamily: FONT, fontSize: '30px', color: CSS.gold }).setOrigin(0.5);
    new Button(this, 640, 540, 'common.back', () => {
      this.cameras.main.fadeOut(400, 11, 13, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Menu'));
    });
  }
}
