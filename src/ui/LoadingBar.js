import Phaser from 'phaser';
import Emblem from './Emblem.js';
import { drawAjrakBand } from '../fx/ajrakPattern.js';
import { newCanvas } from '../fx/canvasUtil.js';
import { COLORS, CSS, FONT_TITLE } from '../data/colors.js';
import { addText, setSource } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';

const TIP_KEYS = ['loading.tip1', 'loading.tip2', 'loading.tip3', 'loading.tip4', 'loading.tip5', 'loading.tip6'];
const BAR_WIDTH = 640;
const BAR_HEIGHT = 30;

// The styled loading screen: emblem, an Ajrak-bordered bar, "Loading... 40%" and Mithu's tips.
// Used by the Preload scene (title screen files) and the Loading scene (the art of one level).
//   const bar = new LoadingBar(scene);   bar.update(delta, targetProgress 0..1)   bar.progress -> what is shown
export default class LoadingBar {
  constructor(scene) {
    this.scene = scene;
    this.shown = 0;
    this.percentValue = 0;
    this.lastPercent = -1;

    scene.add.rectangle(640, 360, 1280, 720, COLORS.dark);
    scene.add.tileSprite(640, 360, 1280, 720, 'ajrak-tile').setAlpha(0.06);
    scene.add.image(640, 300, 'fx-glow').setScale(8).setTint(0x2b3580).setAlpha(0.4);
    new Emblem(scene, 640, 150).setScale(0.5).startSparkles();

    const x = 640 - BAR_WIDTH / 2;
    const y = 360;
    if (!scene.textures.exists('bar-band')) {
      const canvas = newCanvas(BAR_WIDTH + 20, 16);
      drawAjrakBand(canvas.getContext('2d'), 0, 0, BAR_WIDTH + 20, 16);
      scene.textures.addCanvas('bar-band', canvas);
    }
    scene.add.rectangle(640, y + BAR_HEIGHT / 2, BAR_WIDTH + 28, BAR_HEIGHT + 44, 0x2a0e14);
    scene.add.rectangle(640, y + BAR_HEIGHT / 2, BAR_WIDTH + 12, BAR_HEIGHT + 6, 0x0b0d1a);
    scene.add.image(640, y - 11, 'bar-band');
    scene.add.image(640, y + BAR_HEIGHT + 11, 'bar-band');
    this.fill = scene.add.tileSprite(x, y, 2, BAR_HEIGHT, 'ajrak-tile').setOrigin(0, 0).setTileScale(0.5);
    scene.add.rectangle(640, y + 5, BAR_WIDTH, 6, 0xffffff, 0.16);

    this.percent = addText(scene, 640, y + 88, () => `${t('loading.text')} ${this.percentValue}%`, { fontFamily: FONT_TITLE, fontSize: '24px', color: CSS.cream }).setOrigin(0.5);

    addText(scene, 640, 520, 'loading.tipsTitle', { fontFamily: FONT_TITLE, fontSize: '22px', color: CSS.gold }).setOrigin(0.5);
    this.tip = addText(scene, 640, 575, TIP_KEYS[0], { fontFamily: FONT_TITLE, fontSize: '30px', color: CSS.cream, align: 'center', wordWrap: { width: 980 } }).setOrigin(0.5);
    this.tipIndex = Phaser.Math.Between(0, TIP_KEYS.length - 1);
    this.showTip();
    scene.time.addEvent({ delay: 2600, loop: true, callback: () => this.showTip() });
  }

  // the bar eases towards the target
  update(delta, target) {
    this.shown += (target - this.shown) * Math.min(1, delta / 120);
    this.fill.setSize(Math.max(2, BAR_WIDTH * this.shown), BAR_HEIGHT);
    this.percentValue = Math.round(this.shown * 100);
    if (this.percentValue !== this.lastPercent) {
      this.lastPercent = this.percentValue;
      setSource(this.percent, () => `${t('loading.text')} ${this.percentValue}%`);
    }
  }

  showTip() {
    const scene = this.scene;
    scene.tweens.add({
      targets: this.tip,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        setSource(this.tip, TIP_KEYS[this.tipIndex % TIP_KEYS.length]);
        this.tipIndex++;
        scene.tweens.add({ targets: this.tip, alpha: 1, duration: 300 });
      },
    });
  }
}
