import Phaser from 'phaser';
import Emblem from '../ui/Emblem.js';
import { drawAjrakBand } from '../fx/ajrakPattern.js';
import { newCanvas, cutOutWhiteBackground } from '../fx/canvasUtil.js';
import { createPlaceholderTextures } from '../objects/placeholderTextures.js';
import { IMAGES, AUDIO } from '../data/assetList.js';
import { COLORS, CSS, FONT_TITLE } from '../data/colors.js';
import { addText, setSource } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';

const TIP_KEYS = ['loading.tip1', 'loading.tip2', 'loading.tip3', 'loading.tip4', 'loading.tip5', 'loading.tip6'];

const BAR_WIDTH = 640;
const BAR_HEIGHT = 30;
const MIN_TIME = 2200; // show the loading screen at least this long (so the tips can be read)

// Preload: loads every file and shows an Ajrak-bordered loading bar and Mithu's tips.
// A file that is missing or broken is ignored: the game then uses art drawn in code.
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    this.cameras.main.fadeIn(300, 11, 13, 26);
    createPlaceholderTextures(this);
    this.drawScreen();

    this.load.on('progress', (value) => (this.loadProgress = value));
    this.load.on('loaderror', () => {
      // ignore: the missing file is replaced by generated art
    });
    Object.entries(IMAGES).forEach(([key, path]) => this.load.image(key, path));
    Object.entries(AUDIO).forEach(([key, path]) => this.load.audio(key, path));
  }

  create() {
    this.prepareDodoFull();
    this.finished = false;
    this.startTime = this.time.now;
  }

  update(time, delta) {
    // the bar eases towards the real progress, and always takes MIN_TIME at least
    if (this.finished || this.startTime === undefined) {
      this.moveBar(delta, this.load.isLoading() ? this.loadProgress || 0 : 0);
      return;
    }
    const timeProgress = Math.min(1, (time - this.startTime) / MIN_TIME);
    this.moveBar(delta, timeProgress);
    if (timeProgress >= 1 && this.shown >= 0.995) {
      this.finished = true;
      this.cameras.main.fadeOut(400, 11, 13, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Menu'));
    }
  }

  // The painted Dodo has a plain white background. Make it transparent.
  prepareDodoFull() {
    if (!this.textures.exists('dodo-full-raw') || this.textures.exists('dodo-full')) return;
    try {
      const source = this.textures.get('dodo-full-raw').getSourceImage();
      const cut = cutOutWhiteBackground(source, 0.5);
      this.textures.addCanvas('dodo-full', cut.canvas);
      this.registry.set('dodoFullCrop', { x: cut.cropX, y: cut.cropY, scale: cut.scale });
    } catch (e) {
      // fall back to the generated Dodo on the title screen
    }
  }

  moveBar(delta, target) {
    this.shown = (this.shown || 0) + (target - (this.shown || 0)) * Math.min(1, delta / 120);
    const width = Math.max(2, BAR_WIDTH * this.shown);
    this.fill.setSize(width, BAR_HEIGHT);
    this.percentValue = Math.round(this.shown * 100);
    if (this.percentValue !== this.lastPercent) {
      this.lastPercent = this.percentValue;
      setSource(this.percent, () => `${t('loading.text')} ${this.percentValue}%`);
    }
  }

  drawScreen() {
    this.add.rectangle(640, 360, 1280, 720, COLORS.dark);
    this.add.tileSprite(640, 360, 1280, 720, 'ajrak-tile').setAlpha(0.06);
    this.add.image(640, 300, 'fx-glow').setScale(8).setTint(0x2b3580).setAlpha(0.4);

    new Emblem(this, 640, 150).setScale(0.5).startSparkles();

    // Ajrak-border loading bar: band above and below, patterned fill inside
    const x = 640 - BAR_WIDTH / 2;
    const y = 360;
    if (!this.textures.exists('bar-band')) {
      const canvas = newCanvas(BAR_WIDTH + 20, 16);
      drawAjrakBand(canvas.getContext('2d'), 0, 0, BAR_WIDTH + 20, 16);
      this.textures.addCanvas('bar-band', canvas);
    }
    this.add.rectangle(640, y + BAR_HEIGHT / 2, BAR_WIDTH + 28, BAR_HEIGHT + 44, 0x2a0e14).setStrokeStyle(0);
    this.add.rectangle(640, y + BAR_HEIGHT / 2, BAR_WIDTH + 12, BAR_HEIGHT + 6, 0x0b0d1a);
    this.add.image(640, y - 11, 'bar-band');
    this.add.image(640, y + BAR_HEIGHT + 11, 'bar-band');
    this.fill = this.add.tileSprite(x, y, 2, BAR_HEIGHT, 'ajrak-tile').setOrigin(0, 0);
    this.fill.setTileScale(0.5);
    this.add.rectangle(640, y + 5, BAR_WIDTH, 6, 0xffffff, 0.16);

    this.percentValue = 0;
    this.percent = addText(this, 640, y + 88, () => `${t('loading.text')} ${this.percentValue}%`, {
      fontFamily: FONT_TITLE,
      fontSize: '24px',
      color: CSS.cream,
    }).setOrigin(0.5);

    // Mithu's tips, one after another
    addText(this, 640, 520, 'loading.tipsTitle', { fontFamily: FONT_TITLE, fontSize: '22px', color: CSS.gold }).setOrigin(0.5);
    this.tip = addText(this, 640, 575, TIP_KEYS[0], {
      fontFamily: FONT_TITLE,
      fontSize: '30px',
      color: CSS.cream,
      align: 'center',
      wordWrap: { width: 980 },
    }).setOrigin(0.5);
    this.tipIndex = Phaser.Math.Between(0, TIP_KEYS.length - 1);
    this.showTip();
    this.time.addEvent({ delay: 2600, loop: true, callback: () => this.showTip() });
  }

  showTip() {
    this.tweens.add({
      targets: this.tip,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        setSource(this.tip, TIP_KEYS[this.tipIndex % TIP_KEYS.length]);
        this.tipIndex++;
        this.tweens.add({ targets: this.tip, alpha: 1, duration: 300 });
      },
    });
  }
}
