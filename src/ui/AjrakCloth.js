import Phaser from 'phaser';
import { newCanvas, INK } from '../fx/canvasUtil.js';
import { makeAjrakTile, drawAjrakBand } from '../fx/ajrakPattern.js';

const STRIPS = 28;
const TEXTURE_KEY = 'ajrak-cloth';

// A big Ajrak cloth that unrolls from the middle and then waves softly, like real cloth.
// It is made of vertical strips. Each strip follows a wave with a spring,
// so neighbours move one after the other. After a little while the waving settles.
export default class AjrakCloth {
  constructor(scene, x, y, width = 640, height = 380) {
    this.scene = scene;
    this.time = 0;
    this.width = width;
    this.height = height;
    this.makeTexture(width, height);

    const texture = scene.textures.get(TEXTURE_KEY);
    const stripW = width / STRIPS;
    this.strips = [];
    for (let i = 0; i < STRIPS; i++) {
      const frame = `strip-${i}`;
      if (!texture.has(frame)) texture.add(frame, 0, i * stripW, 0, stripW + 0.5, height);
      const finalX = x - width / 2 + stripW * (i + 0.5);
      const image = scene.add.image(x, y - height / 2, TEXTURE_KEY, frame).setOrigin(0.5, 0).setScale(0.12, 1).setAlpha(0);
      const strip = { image, finalX, y: y - height / 2, dy: 0, vy: 0, i };
      this.strips.push(strip);

      // unroll: strips slide out from the middle one after another
      const delay = Math.abs(i - (STRIPS - 1) / 2) * 34;
      scene.tweens.add({ targets: image, x: finalX, scaleX: 1, alpha: 1, duration: 620, delay, ease: 'Back.Out' });
    }
  }

  makeTexture(w, h) {
    if (this.scene.textures.exists(TEXTURE_KEY)) return;
    const canvas = newCanvas(w, h);
    const ctx = canvas.getContext('2d');
    const m = 6;
    // cloth body with the Ajrak pattern
    ctx.fillStyle = ctx.createPattern(makeAjrakTile(58), 'repeat');
    ctx.fillRect(m, m, w - m * 2, h - m * 2);
    // border bands along the top and the bottom
    drawAjrakBand(ctx, m, m, w - m * 2, 34);
    drawAjrakBand(ctx, m, h - m - 34, w - m * 2, 34);
    // soft shading: darker at the edges
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.3)');
    g.addColorStop(0.2, 'rgba(0,0,0,0)');
    g.addColorStop(0.8, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(m, m, w - m * 2, h - m * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = INK;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
    this.scene.textures.addCanvas(TEXTURE_KEY, canvas);
  }

  update(dt) {
    this.time += dt;
    const t = this.time;
    // big waves at the start, then it settles (a tiny breeze is left)
    const amp = 18 * Math.exp(-t / 1.7) + 1.8;
    for (const s of this.strips) {
      const phase = t * 2.7 - s.i * 0.52;
      const target = Math.sin(phase) * amp;
      s.vy += ((target - s.dy) * 70 - s.vy * 9) * dt;
      s.dy += s.vy * dt;
      s.image.y = s.y + s.dy;
      // a little stretch and shade where the cloth bends
      const slope = Math.cos(phase);
      s.image.scaleY = 1 + Math.abs(slope) * 0.012 * (amp / 18);
      // dimmer than the shield, so the emblem stands out in front of it
      const shade = Math.round(255 * (0.56 + 0.16 * (0.5 - 0.5 * slope * Math.min(1, amp / 6))));
      s.image.setTint(Phaser.Display.Color.GetColor(shade, shade, shade));
    }
  }

  destroy() {
    this.strips.forEach((s) => s.image.destroy());
    this.strips = [];
  }
}
