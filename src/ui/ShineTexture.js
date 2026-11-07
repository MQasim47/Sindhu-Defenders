import { newCanvas } from '../fx/canvasUtil.js';

// A canvas texture that can show a light-sweep ("shine") moving across it.
// The shine only lights up pixels that already have colour, so it stays inside
// the shape (a shield, letters...). The base picture is drawn once, by the caller.
export default class ShineTexture {
  constructor(scene, key, base) {
    this.scene = scene;
    this.base = base;
    this.canvas = newCanvas(base.width, base.height);
    this.ctx = this.canvas.getContext('2d');
    this.texture = scene.textures.exists(key) ? scene.textures.get(key) : scene.textures.addCanvas(key, this.canvas);
    // when the key already existed we keep drawing into the texture's own canvas
    this.ctx = this.texture.getSourceImage().getContext('2d');
    this.canvas = this.texture.getSourceImage();
    this.render(-1);
  }

  // t from 0 to 1 moves the band from left to right; outside that range: no shine
  render(t) {
    const { ctx, canvas, base } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);
    if (t >= 0 && t <= 1) {
      const w = canvas.width;
      const h = canvas.height;
      const band = Math.max(40, w * 0.18);
      const x = -band * 2 + t * (w + band * 4);
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.transform(1, 0, -0.3, 1, 0, 0);
      const g = ctx.createLinearGradient(x, 0, x + band, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.7)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - h * 0.3, 0, band + h * 0.6, h);
      ctx.restore();
    }
    this.texture.refresh();
  }

  sweep(duration = 800) {
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: 'Sine.InOut',
      onUpdate: (tween) => this.render(tween.getValue()),
      onComplete: () => this.render(-1),
    });
  }
}
