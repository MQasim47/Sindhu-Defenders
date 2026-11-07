import Phaser from 'phaser';
import { ensureBrickTexture } from './amriTextures.js';

const MAX_BRICKS = 3;
const HEAD = 196; // pixels above Dodo's feet (the top of his topi)
const SLOT = 25; // height of one brick in the stack

// What Dodo carries on his head: up to 3 password bricks (a wobbly stack),
// or one Backup Scroll (his hands are full, so not both).
export default class CarryStack {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.items = []; // { ch } for a brick, { scroll: Building } for a scroll
    this.time = 0;
    this.sprites = [];
    for (let i = 0; i < MAX_BRICKS; i++) {
      const image = scene.add.image(0, 0, 'fx-print').setVisible(false).setOrigin(0.5, 1);
      this.sprites.push({ image, from: null, t: 1 });
    }
    this.scrollImage = scene.add.image(0, 0, 'backup-scroll').setVisible(false).setOrigin(0.5, 1).setScale(1.3);
    this.scrollGlow = scene.add.image(0, 0, 'fx-glow').setTint(0xffe08a).setBlendMode(Phaser.BlendModes.ADD).setScale(0.8).setAlpha(0.5).setVisible(false);
  }

  get count() {
    return this.items.filter((i) => i.ch).length;
  }

  get scroll() {
    const item = this.items.find((i) => i.scroll);
    return item ? item.scroll : null;
  }

  get canTakeBrick() {
    return !this.scroll && this.count < MAX_BRICKS;
  }

  get canTakeScroll() {
    return this.items.length === 0;
  }

  // a brick flies from (x, y) on the ground onto Dodo's head
  pushBrick(ch, x, y) {
    const index = this.count;
    this.items.push({ ch });
    const s = this.sprites[index];
    s.image.setTexture(ensureBrickTexture(this.scene, ch)).setVisible(true);
    s.from = { x, y };
    s.t = 0;
  }

  pushScroll(building, x, y) {
    this.items.push({ scroll: building });
    this.scrollImage.setVisible(true);
    this.scrollGlow.setVisible(true);
    this.scrollFrom = { x, y };
    this.scrollT = 0;
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

  popScroll() {
    const building = this.scroll;
    this.items = [];
    this.scrollImage.setVisible(false);
    this.scrollGlow.setVisible(false);
    return { building, x: this.scrollImage.x, y: this.scrollImage.y };
  }

  // Dodo was hit: everything falls off. Returns the characters of the lost bricks.
  dropAll() {
    const chars = this.items.filter((i) => i.ch).map((i) => i.ch);
    const scroll = this.scroll;
    this.items = [];
    this.sprites.forEach((s) => s.image.setVisible(false));
    this.scrollImage.setVisible(false);
    this.scrollGlow.setVisible(false);
    return { chars, scroll };
  }

  update(dt) {
    this.time += dt;
    const p = this.player;
    const baseX = p.x;
    const baseY = p.y - p.z - HEAD * 0.96;
    const speed = Math.min(1, Math.hypot(p.vx, p.vy) / 340);

    for (let i = 0; i < this.count; i++) {
      const s = this.sprites[i];
      // the stack wobbles: more at the top, and more when Dodo runs
      const wobble = Math.sin(this.time * 8 + i * 1.1) * (1.5 + i * 2.2 + speed * 4 * (i + 1));
      let x = baseX + wobble;
      let y = baseY - i * SLOT;
      if (s.t < 1) {
        s.t = Math.min(1, s.t + dt / 0.26);
        const e = 1 - (1 - s.t) * (1 - s.t);
        x = s.from.x + (x - s.from.x) * e;
        y = s.from.y + (y - s.from.y) * e - Math.sin(e * Math.PI) * 40;
      }
      s.image.setPosition(x, y).setDepth(p.y + 3 + i * 0.01).setAngle(wobble * 1.4);
    }

    if (this.scrollImage.visible) {
      let x = baseX;
      let y = baseY - 8 + Math.sin(this.time * 4) * 3;
      if (this.scrollT < 1) {
        this.scrollT = Math.min(1, this.scrollT + dt / 0.26);
        const e = 1 - (1 - this.scrollT) * (1 - this.scrollT);
        x = this.scrollFrom.x + (x - this.scrollFrom.x) * e;
        y = this.scrollFrom.y + (y - this.scrollFrom.y) * e - Math.sin(e * Math.PI) * 40;
      }
      this.scrollImage.setPosition(x, y).setDepth(p.y + 3);
      this.scrollGlow.setPosition(x, y - 24).setDepth(p.y + 2.9).setAlpha(0.45 + Math.sin(this.time * 6) * 0.15);
    }
  }
}
