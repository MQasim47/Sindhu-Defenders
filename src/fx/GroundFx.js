import { settings } from '../data/settings.js';

// A pool of images that live for a short time (dust puffs, rings, footprints).
// Items are made once and reused, so nothing is created while playing.
class SpritePool {
  constructor(scene, key, size) {
    this.items = [];
    this.next = 0;
    for (let i = 0; i < size; i++) {
      const image = scene.add.image(0, 0, key).setVisible(false);
      image.life = 0;
      this.items.push(image);
    }
  }

  // opts: life (s), scale0, scale1, alpha0, vx, vy, angle, tint, depth
  spawn(x, y, opts) {
    const item = this.items[this.next];
    this.next = (this.next + 1) % this.items.length;
    item.setPosition(x, y).setVisible(true);
    item.life = opts.life;
    item.maxLife = opts.life;
    item.o = opts;
    item.setAngle(opts.angle || 0);
    item.setDepth(opts.depth);
    if (opts.tint) item.setTint(opts.tint);
    else item.clearTint();
    this.apply(item, 0);
  }

  apply(item, t) {
    const o = item.o;
    const s = o.scale0 + (o.scale1 - o.scale0) * t;
    item.setScale(s * (o.stretchX || 1), s);
    item.setAlpha(o.alpha0 * (o.hold && t < o.hold ? 1 : 1 - (t - (o.hold || 0)) / (1 - (o.hold || 0))));
  }

  update(dt) {
    for (const item of this.items) {
      if (!item.visible) continue;
      item.life -= dt;
      if (item.life <= 0) {
        item.setVisible(false);
        continue;
      }
      const t = 1 - item.life / item.maxLife;
      if (item.o.vx) item.x += item.o.vx * dt;
      if (item.o.vy) item.y += item.o.vy * dt;
      this.apply(item, t);
    }
  }
}

// Dust puffs, landing rings and footprints in the sand.
export default class GroundFx {
  constructor(scene) {
    this.puffs = new SpritePool(scene, 'fx-dust', settings.low ? 8 : 16);
    this.rings = new SpritePool(scene, 'fx-ring', 4);
    this.prints = new SpritePool(scene, 'fx-print', settings.low ? 0 : 22);
    this.hearts = new SpritePool(scene, 'fx-heart', 8);
  }

  puff(x, y, dirX) {
    const count = settings.low ? 1 : 2;
    for (let i = 0; i < count; i++) {
      this.puffs.spawn(x + (Math.random() - 0.5) * 14, y - 2, {
        life: 0.5 + Math.random() * 0.2,
        scale0: 0.25,
        scale1: 0.8 + Math.random() * 0.3,
        alpha0: 0.55,
        vx: -dirX * (20 + Math.random() * 30),
        vy: -14 - Math.random() * 12,
        depth: y + 1,
      });
    }
  }

  ring(x, y) {
    this.rings.spawn(x, y, { life: 0.45, scale0: 0.3, scale1: 1.4, alpha0: 0.6, depth: y - 1 });
    this.puff(x - 14, y, -1);
    this.puff(x + 14, y, 1);
  }

  print(x, y, angle) {
    if (!this.prints.items.length) return;
    this.prints.spawn(x, y, { life: 4, scale0: 1, scale1: 1, alpha0: 0.3, hold: 0.2, angle, depth: 1 });
  }

  // purple smoke when Behroopia's disguise pops off
  smoke(x, y) {
    const count = settings.low ? 3 : 7;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      this.puffs.spawn(x + Math.cos(a) * 14, y + Math.sin(a) * 10, {
        life: 0.7,
        scale0: 0.5,
        scale1: 1.7,
        alpha0: 0.8,
        vx: Math.cos(a) * 70,
        vy: Math.sin(a) * 45 - 25,
        tint: 0xa070e0,
        depth: 90000,
      });
    }
  }

  heart(x, y) {
    this.hearts.spawn(x + (Math.random() - 0.5) * 24, y, { life: 1.1, scale0: 0.4, scale1: 1, alpha0: 1, hold: 0.5, vy: -55, depth: 90000 });
  }

  update(dt) {
    this.hearts.update(dt);
    this.puffs.update(dt);
    this.rings.update(dt);
    this.prints.update(dt);
  }
}
