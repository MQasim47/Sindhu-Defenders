import { ensureBrickTexture } from './amriTextures.js';

const MAX_BRICKS = 5;
const HEAD = 196; // pixels above Dodo's feet (the top of his topi)
const SLOT = 22; // height of one brick in the stack

// What Dodo carries on his head: up to 5 password bricks, a wobbly stack.
// The higher the brick, the more it wobbles (but every letter stays readable).
export default class CarryStack {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.items = []; // { ch }
    this.time = 0;
    this.sprites = [];
    for (let i = 0; i < MAX_BRICKS; i++) {
      const image = scene.add.image(0, 0, 'fx-print').setVisible(false).setOrigin(0.5, 1);
      this.sprites.push({ image, from: null, t: 1 });
    }
  }

  get count() {
    return this.items.length;
  }

  get canTakeBrick() {
    return this.count < MAX_BRICKS;
  }

  // a brick flies from (x, y) on the ground onto Dodo's head
  pushBrick(ch, x, y) {
    const s = this.sprites[this.count];
    this.items.push({ ch });
    s.image.setTexture(ensureBrickTexture(this.scene, ch)).setVisible(true);
    s.from = { x, y };
    s.t = 0;
  }

  // the top brick leaves the stack. Returns { ch, x, y } (where it was, for the flight to the wall)
  popBrick() {
    const index = this.count - 1;
    if (index < 0) return null;
    const s = this.sprites[index];
    const out = { ch: this.items[index].ch, x: s.image.x, y: s.image.y };
    this.items.splice(index, 1);
    s.image.setVisible(false);
    return out;
  }

  // Dodo was hit: everything falls off. Returns the characters of the lost bricks.
  dropAll() {
    const chars = this.items.map((i) => i.ch);
    this.items = [];
    this.sprites.forEach((s) => s.image.setVisible(false));
    return { chars };
  }

  update(dt) {
    this.time += dt;
    const p = this.player;
    const baseX = p.x;
    const baseY = p.y - p.z - HEAD * 0.96;
    const speed = Math.min(1, Math.hypot(p.vx, p.vy) / 340);

    for (let i = 0; i < this.count; i++) {
      const s = this.sprites[i];
      // the stack wobbles: more at the top, and more when Dodo runs (kept small so letters stay readable)
      const wobble = Math.sin(this.time * 8 + i * 1.1) * (1 + i * 1.5 + speed * 2.6 * (i + 1));
      let x = baseX + wobble;
      let y = baseY - i * SLOT;
      if (s.t < 1) {
        s.t = Math.min(1, s.t + dt / 0.26);
        const e = 1 - (1 - s.t) * (1 - s.t);
        x = s.from.x + (x - s.from.x) * e;
        y = s.from.y + (y - s.from.y) * e - Math.sin(e * Math.PI) * 40;
      }
      s.image.setPosition(x, y).setDepth(p.y + 3 + i * 0.01).setAngle(wobble * 1.1);
    }
  }
}
