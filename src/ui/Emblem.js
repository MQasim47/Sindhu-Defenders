import Phaser from 'phaser';
import { newCanvas, outline, INK } from '../fx/canvasUtil.js';
import { makeAjrakTile, AJRAK } from '../fx/ajrakPattern.js';
import { paintTopi } from '../objects/dodoTextures.js';
import { TOPI_MIRRORS } from '../objects/dodoTextures.js';
import ShineTexture from './ShineTexture.js';

// The emblem is drawn at 2x size (500x600) and shown at half size, so it stays sharp.
const W = 250;
const H = 300;
const SHIELD_SCALE = 0.88; // the Ajrak border grows outwards, so the shield is a little smaller
const TOPI = { x: 125 - 86, y: 62, s: 2.4 }; // where the topi is drawn (in the 250x300 grid)

function shieldPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(14, 36);
  ctx.quadraticCurveTo(70, 32, 125, 12);
  ctx.quadraticCurveTo(180, 32, 236, 36);
  ctx.lineTo(236, 154);
  ctx.quadraticCurveTo(230, 244, 125, 288);
  ctx.quadraticCurveTo(20, 244, 14, 154);
  ctx.closePath();
}

// Points along the shield outline (to place the white dots of the border).
function shieldPoints() {
  const pts = [];
  const curve = (x0, y0, cx, cy, x1, y1) => {
    for (let i = 0; i < 24; i++) {
      const t = i / 24;
      const u = 1 - t;
      pts.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]);
    }
  };
  curve(14, 36, 70, 32, 125, 12);
  curve(125, 12, 180, 32, 236, 36);
  for (let i = 0; i < 24; i++) pts.push([236, 36 + (118 * i) / 24]);
  curve(236, 154, 230, 244, 125, 288);
  curve(125, 288, 20, 244, 14, 154);
  for (let i = 0; i < 24; i++) pts.push([14, 154 - (118 * i) / 24]);
  return pts;
}

function drawMirror(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(0.45, '#BFE8F8');
  g.addColorStop(1, '#6FB4D8');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = r * 0.28;
  ctx.strokeStyle = '#F7E6B8';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 1.18, 0, Math.PI * 2);
  ctx.lineWidth = r * 0.22;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

// The game emblem: a shield with a real Ajrak border (black lines, crimson trim with white
// dots, a band of star medallions), a Sindhi topi with mirrors, and the Ranikot wall.
export function drawEmblemBase() {
  const canvas = newCanvas(W * 2, H * 2);
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  ctx.lineJoin = 'round';

  ctx.save();
  ctx.translate(125, 150);
  ctx.scale(SHIELD_SCALE, SHIELD_SCALE);
  ctx.translate(-125, -150);

  // soft shadow
  ctx.save();
  ctx.translate(0, 8);
  shieldPath(ctx);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  ctx.restore();

  // indigo field with a faint Ajrak pattern
  shieldPath(ctx);
  const field = ctx.createLinearGradient(0, 20, 0, 290);
  field.addColorStop(0, '#2B3580');
  field.addColorStop(1, '#141A45');
  ctx.fillStyle = field;
  ctx.fill();
  ctx.save();
  shieldPath(ctx);
  ctx.clip();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = ctx.createPattern(makeAjrakTile(54), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // the border band, drawn as thick lines along the shield edge (wide to narrow)
  const band = (width, style) => {
    shieldPath(ctx);
    ctx.lineWidth = width;
    ctx.strokeStyle = style;
    ctx.stroke();
  };
  band(48, '#E8B84A'); // gold rim, so the border stands out from the cloth behind
  band(42, AJRAK.black);
  band(38, AJRAK.crimson); // crimson trim (white dots go here)
  band(30, AJRAK.black);
  band(26, ctx.createPattern(makeAjrakTile(40), 'repeat')); // star medallions
  band(5, 'rgba(0,0,0,0.0)');

  // white dots along the outer crimson trim and a gold line inside
  ctx.fillStyle = AJRAK.white;
  const pts = shieldPoints();
  for (let i = 0; i < pts.length; i += 2) {
    const [x, y] = pts[i];
    const dx = x - 125;
    const dy = y - 150;
    const len = Math.hypot(dx, dy) || 1;
    // push the dot outwards, onto the crimson trim (about 17px from the line)
    ctx.beginPath();
    ctx.arc(x + (dx / len) * 17, y + (dy / len) * 17, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(125, 150);
  ctx.scale(0.8, 0.8);
  ctx.translate(-125, -150);
  shieldPath(ctx);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#E8B84A';
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // the Sindhi topi, big, with mirrors
  ctx.save();
  ctx.translate(TOPI.x, TOPI.y);
  ctx.scale(TOPI.s, TOPI.s);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  paintTopi(ctx);
  ctx.shadowColor = 'transparent';
  TOPI_MIRRORS.forEach(([mx, my]) => drawMirror(ctx, mx, my, 3.3));
  ctx.restore();

  // little Ranikot wall under the topi
  ctx.save();
  ctx.beginPath();
  ctx.rect(78, 196, 94, 28);
  for (let i = 0; i < 5; i++) ctx.rect(78 + i * 20, 186, 13, 12);
  ctx.fillStyle = '#F3E9D2';
  ctx.fill();
  outline(ctx, INK, 2.4);
  ctx.fillStyle = '#9A8B78';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(113, 205, 24, 19, [12, 12, 0, 0]) : ctx.rect(113, 205, 24, 19);
  ctx.fill();
  ctx.restore();

  return canvas;
}

// Puts the picture of public/assets/ui/emblem.png (if it was loaded) into the same canvas size.
function drawEmblemFromFile(scene) {
  const img = scene.textures.get('emblem-png').getSourceImage();
  const canvas = newCanvas(W * 2, H * 2);
  const k = Math.min((W * 2) / img.width, (H * 2) / img.height);
  canvas.getContext('2d').drawImage(img, (W * 2 - img.width * k) / 2, (H * 2 - img.height * k) / 2, img.width * k, img.height * k);
  return canvas;
}

// The emblem as a game object. It is a container: the picture + sparkles on the topi mirrors.
// Use setScale() to pop it in, .shine() for a light sweep.
export default class Emblem extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    const fromFile = scene.textures.exists('emblem-png');
    const base = fromFile ? drawEmblemFromFile(scene) : drawEmblemBase();
    this.shineTexture = new ShineTexture(scene, fromFile ? 'emblem-file' : 'emblem', base);
    this.image = scene.add.image(0, 0, this.shineTexture.texture.key).setScale(0.5);
    this.add(this.image);

    // one sparkle for every topi mirror
    this.glints = [];
    if (!fromFile) {
      TOPI_MIRRORS.forEach(([mx, my]) => {
        const gx = TOPI.x + mx * TOPI.s - 125;
        const gy = TOPI.y + my * TOPI.s - 150;
        const glint = scene.add.image(gx, gy, 'fx-glint').setScale(0).setBlendMode(Phaser.BlendModes.ADD);
        this.glints.push(glint);
      });
      this.add(this.glints);
    }
    scene.add.existing(this);
    this.once('destroy', () => this.sparkleTimer && this.sparkleTimer.remove(false));
  }

  shine(duration) {
    this.shineTexture.sweep(duration);
  }

  // The mirrors sparkle one after another, then rest for a moment.
  startSparkles() {
    if (!this.glints.length) return;
    let i = 0;
    const next = () => {
      const glint = this.glints[i];
      this.scene.tweens.add({ targets: glint, scale: { from: 0, to: 1.5 }, angle: 90, duration: 240, yoyo: true, ease: 'Sine.Out', onComplete: () => glint.setAngle(0) });
      i++;
      const pause = i >= this.glints.length ? 1500 : 170;
      if (i >= this.glints.length) i = 0;
      this.sparkleTimer = this.scene.time.delayedCall(pause, next);
    };
    this.sparkleTimer = this.scene.time.delayedCall(500, next);
  }
}
