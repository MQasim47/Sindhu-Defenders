import Phaser from 'phaser';
import LoadingBar from '../ui/LoadingBar.js';
import { groupFiles } from '../data/assetList.js';

// Loading: loads the heavy art (and the music) of ONE level, with the styled loading bar,
// then opens that level. Started by goToScene() in src/systems/sceneFlow.js.
export default class LoadingScene extends Phaser.Scene {
  constructor() {
    super('Loading');
  }

  init(data) {
    this.next = data.next;
    this.nextData = data.data;
    this.group = data.group;
    this.done = false;
  }

  preload() {
    this.cameras.main.fadeIn(200, 11, 13, 26);
    this.bar = new LoadingBar(this);
    this.load.on('progress', (value) => (this.progress = value));
    this.load.on('loaderror', () => {
      // a file that cannot be loaded is ignored: the level uses art drawn in code
    });
    groupFiles(this.group).forEach((f) => {
      if (f.type === 'image' && !this.textures.exists(f.key)) this.load.image(f.key, f.path);
      if (f.type === 'audio' && !this.cache.audio.exists(f.key)) this.load.audio(f.key, f.path);
    });
    this.progress = 0;
    this.startTime = performance.now();
  }

  update(time, delta) {
    const loading = this.load.isLoading() || this.load.totalToLoad > this.load.totalComplete + this.load.totalFailed;
    this.bar.update(delta, loading ? this.progress || 0 : 1);
    if (!this.done && !loading && this.bar.shown >= 0.97 && performance.now() - this.startTime > 350) {
      this.done = true;
      this.cameras.main.fadeOut(200, 11, 13, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.next, this.nextData));
    }
  }
}
