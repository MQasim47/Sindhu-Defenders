import Phaser from 'phaser';
import { ensureBrickTexture, brickKind } from './amriTextures.js';
import { pushOut } from '../systems/collision.js';
import { playSfx } from '../fx/sound.js';

const MAX_ACTIVE = 14;
const POOL = 18;
const PICK_DISTANCE = 78;

const LOWER = 'abcdefghjkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const NUMBERS = '2345789';
const SYMBOLS = '@#!$%&*?';
// sets that tempt the player to make weak passwords (zxcvbn will punish them)
const WEAK_SETS = [['1', '2', '3', '4'], ['a', 'b', 'c'], ['q', 'w', 'e', 'r'], ['1', '1', '1'], ['p', 'a', 's', 's']];

const pickFrom = (text) => text[Math.floor(Math.random() * text.length)];

// The password bricks that lie around the courtyard: lowercase (clay brown), UPPERCASE (red),
// numbers (blue) and symbols (gold). Dodo picks them up (E) and places them on a wall.
// Bricks are pooled.
export default class BrickSystem {
  constructor(scene, area) {
    this.scene = scene;
    this.area = area; // { minY, maxY, minXAt(y), maxXAt(y), colliders }
    this.timer = 1;
    this.bricks = [];
    for (let i = 0; i < POOL; i++) {
      const image = scene.add.image(0, 0, 'fx-print').setVisible(false);
      const shadow = scene.add.image(0, 0, 'shadow').setScale(0.42).setAlpha(0.7).setVisible(false);
      this.bricks.push({ image, shadow, ch: '', active: false, time: Math.random() * 6 });
    }
  }

  get activeCount() {
    return this.bricks.filter((b) => b.active).length;
  }

  // one set of 3 to 5 bricks around (cx, cy)
  makeSet() {
    if (Math.random() < 0.22) return WEAK_SETS[Math.floor(Math.random() * WEAK_SETS.length)];
    const set = [pickFrom(LOWER), pickFrom(UPPER), pickFrom(NUMBERS), pickFrom(SYMBOLS)];
    if (Math.random() < 0.6) set.push(pickFrom(Math.random() < 0.5 ? LOWER : UPPER + NUMBERS));
    return set.sort(() => Math.random() - 0.5);
  }

  spawnSet() {
    const a = this.area;
    const free = POOL - this.activeCount;
    const chars = this.makeSet();
    if (free < chars.length || this.activeCount + chars.length > MAX_ACTIVE) return;
    const y = Phaser.Math.Between(a.minY + 150, a.maxY - 40);
    const cx = Phaser.Math.Between(a.minXAt(y) + 90, a.maxXAt(y) - 90);
    chars.forEach((ch, i) => {
      const spot = { x: cx + (i - (chars.length - 1) / 2) * 62 + Phaser.Math.Between(-10, 10), y: y + Phaser.Math.Between(-30, 30) };
      pushOut(spot, a.colliders, 40, 22);
      spot.x = Phaser.Math.Clamp(spot.x, a.minXAt(spot.y) + 40, a.maxXAt(spot.y) - 40);
      spot.y = Phaser.Math.Clamp(spot.y, a.minY + 120, a.maxY - 20);
      this.place(ch, spot.x, spot.y, spot.x + Phaser.Math.Between(-20, 20), spot.y - 70, i * 90);
    });
  }

  // put a brick on the ground (it hops from (fromX, fromY) to (x, y))
  place(ch, x, y, fromX = x, fromY = y - 40, delay = 0) {
    const b = this.bricks.find((k) => !k.active);
    if (!b) return null;
    b.active = true;
    b.ch = ch;
    b.x = x;
    b.y = y;
    b.image.setTexture(ensureBrickTexture(this.scene, ch)).setVisible(false).setOrigin(0.5, 0.8).setAlpha(1).setScale(1).setAngle(0);
    b.shadow.setVisible(false);
    const scene = this.scene;
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 480,
      delay,
      ease: 'Sine.Out',
      onStart: () => {
        b.image.setVisible(true);
        b.shadow.setVisible(true);
      },
      onUpdate: (tw) => {
        const p = tw.getValue();
        b.drawX = fromX + (x - fromX) * p;
        b.drawY = fromY + (y - fromY) * p;
        b.lift = Math.sin(p * Math.PI) * 46;
      },
      onComplete: () => {
        b.drawX = x;
        b.drawY = y;
        b.lift = 0;
        scene.tweens.add({ targets: b.image, scaleY: 0.82, scaleX: 1.12, duration: 80, yoyo: true });
      },
    });
    b.drawX = fromX;
    b.drawY = fromY;
    b.lift = 0;
    return b;
  }

  nearest(player, maxDistance = PICK_DISTANCE) {
    let best = null;
    let bestD = maxDistance;
    for (const b of this.bricks) {
      if (!b.active) continue;
      const d = Phaser.Math.Distance.Between(player.x, player.y, b.x, b.y);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    return best;
  }

  // Dodo takes the brick: returns its character
  take(brick) {
    brick.active = false;
    brick.image.setVisible(false);
    brick.shadow.setVisible(false);
    playSfx(this.scene, 'sfx-brick-pick');
    return brick.ch;
  }

  update(dt, enabled) {
    if (enabled) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = this.activeCount < 6 ? 2.6 : 6;
        if (this.activeCount < 11) this.spawnSet();
      }
    }
    for (const b of this.bricks) {
      if (!b.active) continue;
      b.time += dt;
      const bob = Math.sin(b.time * 3 + b.x) * 2;
      b.image.setPosition(b.drawX, b.drawY - b.lift + bob).setDepth(b.y);
      b.shadow.setPosition(b.drawX, b.drawY + 6).setDepth(b.y - 1);
    }
  }

  // for the tests and the "kind" helper
  static kindOf(ch) {
    return brickKind(ch);
  }
}
