import Phaser from 'phaser';
import { playSfx } from '../fx/sound.js';

const SPEED = 250; // slow enough to see it coming and jump
const LIFE = 2.2;
const HIT_DISTANCE = 34;
const SAFE_HEIGHT = 28; // Dodo must be higher than this to jump over it

// Sticky "spam blob" thrown by a revealed Behroopia. It slides along the ground.
// Jump over it (Space) to avoid it. If it hits Dodo he is slowed for 2 seconds.
// A small pool: blobs are reused, never created while playing.
export default class SpamBlobs {
  constructor(scene, size = 4) {
    this.scene = scene;
    this.items = [];
    for (let i = 0; i < size; i++) {
      const blob = scene.add.image(0, 0, 'spam-blob').setVisible(false);
      const shadow = scene.add.image(0, 0, 'shadow').setScale(0.5).setVisible(false);
      this.items.push({ blob, shadow, life: 0, vx: 0, vy: 0, passed: false });
    }
  }

  // from (x, y) towards the target's position right now (a straight, dodge-able line)
  launch(x, y, target) {
    const item = this.items.find((i) => i.life <= 0);
    if (!item) return;
    const a = Math.atan2(target.y - y, target.x - x);
    item.vx = Math.cos(a) * SPEED;
    item.vy = Math.sin(a) * SPEED;
    item.life = LIFE;
    item.passed = false;
    item.blob.setPosition(x, y - 16).setVisible(true).setScale(0.6);
    item.shadow.setPosition(x, y + 2).setVisible(true);
    this.scene.tweens.add({ targets: item.blob, scale: 1, duration: 160, ease: 'Back.Out' });
  }

  update(dt, player, fx) {
    for (const item of this.items) {
      if (item.life <= 0) continue;
      item.life -= dt;
      const b = item.blob;
      b.x += item.vx * dt;
      b.y += item.vy * dt;
      b.rotation += dt * 7;
      item.shadow.setPosition(b.x, b.y + 18);
      // the blob hops a little so it reads as alive (the shadow stays on the ground)
      b.y += Math.sin(item.life * 18) * 0.6;
      const groundY = b.y + 16;
      b.setDepth(groundY);
      item.shadow.setDepth(groundY - 1);

      const d = Phaser.Math.Distance.Between(b.x, groundY, player.x, player.y);
      if (d < HIT_DISTANCE) {
        if (player.z < SAFE_HEIGHT) {
          player.getSlimed();
          fx.smoke(b.x, groundY);
          playSfx(this.scene, 'sfx-hit');
          this.scene.events.emit('slimed');
          this.end(item);
        } else if (!item.passed) {
          item.passed = true;
          this.scene.events.emit('dodged');
        }
      }
      if (item.life <= 0) this.end(item);
    }
  }

  end(item) {
    item.life = 0;
    item.blob.setVisible(false);
    item.shadow.setVisible(false);
  }
}
