import Phaser from 'phaser';
import { playSfx } from '../fx/sound.js';

const SPEED_IN = 95;
const SPEED_OUT = 120;
const WHEEL_RADIUS = 17;

// Trojan Ghoda: a wooden horse on wheels. It rolls in through the gate, stops, opens
// the hatch in its belly and drops FREE gifts around the courtyard. Then it rolls out again.
// Pooled (made once, reused).
export default class TrojanGhoda extends Phaser.GameObjects.Container {
  constructor(scene, world, system) {
    super(scene, 0, 0);
    this.world = world;
    this.system = system;
    this.state = 'off';
    this.time = 0;

    const add = scene.add;
    this.shadow = add.image(0, 4, 'shadow').setScale(2.6, 1.2).setAlpha(0.8);
    this.horse = add.image(0, -22, 'trojan-horse').setOrigin(0.5, 1);
    this.hatch = add.image(-24, -80, 'trojan-hatch').setOrigin(0, 0.5);
    this.wheelBack = add.image(-48, -18, 'trojan-wheel');
    this.wheelFront = add.image(50, -18, 'trojan-wheel');
    this.sway = add.container(0, 0, [this.horse, this.hatch, this.wheelBack, this.wheelFront]);
    this.add([this.shadow, this.sway]);
    scene.add.existing(this);
    this.setScale(0.95);
    this.setActive(false).setVisible(false);
  }

  // count = how many gifts to drop
  activate(count) {
    const g = this.world.gate;
    const c = this.world.center;
    this.setPosition(g.x, g.y).setActive(true).setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 400 });
    this.giftCount = count;
    this.state = 'in';
    this.timer = 0;
    this.hatch.setRotation(0);
    // stop on the way to the middle
    this.stop = { x: g.x + Phaser.Math.Between(-60, 60), y: g.y + (c.y - g.y) * 0.5 };
    playSfx(this.scene, 'sfx-horse');
  }

  deactivate() {
    this.state = 'off';
    this.setActive(false).setVisible(false);
    this.scene.tweens.killTweensOf([this, this.hatch]);
  }

  // roll towards a point; returns true when we are there
  rollTo(x, y, speed, dt) {
    const dx = x - this.x;
    const dy = y - this.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 6) return true;
    const step = Math.min(d, speed * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    const turn = (step / WHEEL_RADIUS) * (dx >= 0 ? 1 : -1);
    this.wheelBack.rotation += turn;
    this.wheelFront.rotation += turn;
    // the horse rocks a little as it rolls
    this.sway.rotation = Math.sin(this.time * 9) * 0.03;
    this.sway.y = -Math.abs(Math.sin(this.time * 9)) * 1.6;
    return false;
  }

  update(dt) {
    if (!this.active) return;
    this.time += dt;
    const g = this.world.gate;

    if (this.state === 'in') {
      if (this.rollTo(this.stop.x, this.stop.y, SPEED_IN, dt)) this.unload();
    } else if (this.state === 'unload') {
      this.timer -= dt;
      this.sway.rotation = 0;
      if (this.timer <= 0) this.leave();
    } else if (this.state === 'out') {
      const done = this.rollTo(g.x, g.y - 6, SPEED_OUT, dt);
      this.setAlpha(Phaser.Math.Clamp((this.y - g.y) / 70, 0, 1));
      if (done) {
        this.deactivate();
        this.scene.events.emit('horse-gone', this);
      }
    }
    this.setDepth(this.y);
  }

  // open the belly hatch and drop the gifts one after another
  unload() {
    this.state = 'unload';
    this.timer = 0.7 + this.giftCount * 0.4 + 0.7;
    this.scene.tweens.add({ targets: this.hatch, rotation: 1.45, duration: 320, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: this.sway, scaleY: 0.96, duration: 120, yoyo: true, repeat: 1 });
    this.system.dropGifts(this, this.giftCount);
    this.scene.time.delayedCall(this.timer * 1000 - 500, () => {
      if (this.state === 'unload') this.scene.tweens.add({ targets: this.hatch, rotation: 0, duration: 260, ease: 'Cubic.In' });
    });
  }

  leave() {
    this.state = 'out';
    playSfx(this.scene, 'sfx-horse');
  }

  // where the gifts fall out
  get belly() {
    return { x: this.x, y: this.y - 8 };
  }
}
