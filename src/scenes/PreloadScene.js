import Phaser from 'phaser';
import LoadingBar from '../ui/LoadingBar.js';
import { cutOutWhiteBackground } from '../fx/canvasUtil.js';
import { groupFiles } from '../data/assetList.js';
import { mark } from '../systems/perfWatch.js';

const MIN_TIME = 250; // show the loading screen at least this long (so it never flashes)

// Preload: loads only what the title screen needs (fast cold start) and shows the styled loading bar.
// The heavy art of each level is loaded later by the Loading scene. A file that is missing or broken
// is ignored: the game then uses art drawn in code.
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    mark('preload start');
    this.cameras.main.fadeIn(150, 11, 13, 26);
    this.bar = new LoadingBar(this);
    this.load.on('progress', (value) => (this.loadProgress = value));
    this.load.on('loaderror', () => {
      // ignore: the missing file is replaced by generated art
    });
    groupFiles('boot').forEach((f) => (f.type === 'image' ? this.load.image(f.key, f.path) : this.load.audio(f.key, f.path)));
  }

  create() {
    mark('files loaded');
    this.prepareDodoFull();
    mark('dodo ready');
    this.finished = false;
    this.startTime = this.time.now;
  }

  update(time, delta) {
    if (this.finished || this.startTime === undefined) {
      this.bar.update(delta, this.load.isLoading() ? this.loadProgress || 0 : 0);
      return;
    }
    const timeProgress = Math.min(1, (time - this.startTime) / MIN_TIME);
    this.bar.update(delta, timeProgress);
    if (timeProgress >= 1 && this.bar.shown >= 0.97) {
      this.finished = true;
      this.cameras.main.fadeOut(150, 11, 13, 26);
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
      // the places of Dodo's eyes, shoulder... are measured in the ORIGINAL 2752 px picture (art-src/),
      // the file we load is smaller, so the crop is written in original pixels
      const f = source.width / 2752;
      this.registry.set('dodoFullCrop', { x: cut.cropX / f, y: cut.cropY / f, scale: cut.scale * f });
    } catch (e) {
      // fall back to the generated Dodo on the title screen
    }
  }
}
