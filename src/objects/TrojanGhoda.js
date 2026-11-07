import Phaser from 'phaser';
import { playSfx } from '../fx/sound.js';

const SPEED_IN = 105; // pixels per second along the road
const SPEED_OUT = 125;
const WHEEL_RADIUS = 17;

// Trojan Ghoda: a wooden horse on wheels. It rolls in through the gate along a curved road,
// stops, opens the hatch in its belly and drops FREE gifts around the courtyard.
// Then it turns round and rolls back out. Its body always faces the way it travels
// (it flips left/right and tilts a little), the wheels spin and it bobs while rolling.
// Pooled (made once, reused).
export default class TrojanGhoda extends Phaser.GameObjects.Container {
  constructor(scene, world, system) {
    super(scene, 0, 0);
    this.world = world;
    this.system = system;
    this.state = 'off';
    this.time = 0;
    this.facing = 1; // 1 = looking right, -1 = looking left

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
    // The road is a curve: out of the gate (going down), bending to one side, ending
    // sideways at the stopping place. P0 = gate, P1 = bend, P2 = stop.
    const side = Math.random() < 0.5 ? -1 : 1;
    const stop = { x: g.x + side * Phaser.Math.Between(260, 400), y: g.y + (c.y - g.y) * Phaser.Math.FloatBetween(0.4, 0.6) };
    this.road = { p0: { x: g.x, y: g.y }, p1: { x: g.x + side * 30, y: stop.y }, p2: stop };
    this.t = 0;
    this.dir = 1; // 1 = going in, -1 = going out
    this.facing = side;
    this.sway.setScale(side, 1);
    this.setPosition(g.x, g.y).setActive(true).setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 400 });
    this.giftCount = count;
    this.state = 'in';
    this.timer = 0;
    this.hatch.setRotation(0);
    playSfx(this.scene, 'sfx-horse');
  }

  deactivate() {
    this.state = 'off';
    this.setActive(false).setVisible(false);
    this.scene.tweens.killTweensOf([this, this.hatch, this.sway]);
  }

  // point on the road and the direction of travel (not yet turned round) at t
  road_at(t) {
    const { p0, p1, p2 } = this.road;
    const u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
      dx: 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
      dy: 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
    };
  }

  // roll along the road; returns true when the end of the road is reached
  roll(speed, dt) {
    const here = this.road_at(this.t);
    const len = Math.hypot(here.dx, here.dy) || 1;
    this.t = Phaser.Math.Clamp(this.t + (this.dir * speed * dt) / len, 0, 1);
    const p = this.road_at(this.t);
    const moveX = this.x;
    const moveY = this.y;
    this.setPosition(p.x, p.y);

    // the body faces the way it travels, and tilts nose-down when rolling down the screen
    const vx = (p.dx * this.dir) / len;
    const vy = (p.dy * this.dir) / len;
    if (Math.abs(vx) > 0.35 && Math.sign(vx) !== this.facing) {
      this.facing = Math.sign(vx);
      this.scene.tweens.add({ targets: this.sway, scaleX: this.facing, duration: 220, ease: 'Back.Out' });
    }
    const wanted = Phaser.Math.Clamp(vy * 0.32, -0.3, 0.3) * this.facing;
    this.sway.rotation += (wanted + Math.sin(this.time * 9) * 0.025 - this.sway.rotation) * 0.2;
    this.sway.y = -Math.abs(Math.sin(this.time * 9)) * 1.8;

    // the wheels turn with the distance travelled
    const travelled = Math.hypot(this.x - moveX, this.y - moveY);
    const turn = (travelled / WHEEL_RADIUS) * (vx >= 0 ? 1 : -1);
    this.wheelBack.rotation += turn;
    this.wheelFront.rotation += turn;
    return this.t === (this.dir > 0 ? 1 : 0);
  }

  update(dt) {
    if (!this.active) return;
    this.time += dt;
    const g = this.world.gate;

    if (this.state === 'in') {
      if (this.roll(SPEED_IN, dt)) this.unload();
    } else if (this.state === 'unload') {
      this.timer -= dt;
      this.sway.rotation *= 0.9;
      if (this.timer <= 0) this.leave();
    } else if (this.state === 'out') {
      const done = this.roll(SPEED_OUT, dt);
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

  // turn round and roll back along the same road
  leave() {
    this.state = 'out';
    this.dir = -1;
    playSfx(this.scene, 'sfx-horse');
  }

  // where the gifts fall out
  get belly() {
    return { x: this.x, y: this.y - 8 };
  }
}
