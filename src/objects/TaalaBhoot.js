import Phaser from 'phaser';
import { playSfx } from '../fx/sound.js';

const FLY_SPEED = 130;
const HOVER_HEIGHT = 238; // how high above the ground it floats over a building

// Taala Bhoot: a cute ghost with a padlock (ransomware). It floats to the building that
// HackerBrain chose and wraps it in chains with a big padlock. A locked building slowly costs coins.
// Unlock it with E: with a backup it is instant, without one it takes 8 seconds.
// Pooled (made once, reused).
export default class TaalaBhoot extends Phaser.GameObjects.Container {
  constructor(scene, world) {
    super(scene, 0, 0);
    this.world = world;
    this.state = 'off';
    this.time = 0;
    this.lift = 70; // height above the ground

    this.shadow = scene.add.image(0, 2, 'shadow').setScale(1.2, 0.6).setAlpha(0.7);
    this.ghost = scene.add.image(0, -70, 'taala-ghost').setOrigin(0.5, 1);
    this.add([this.shadow, this.ghost]);
    scene.add.existing(this);
    this.setActive(false).setVisible(false);
  }

  activate(building) {
    const g = this.world.gate;
    this.building = building;
    this.setPosition(g.x, g.y).setActive(true).setVisible(true).setAlpha(0).setScale(1);
    this.scene.tweens.add({ targets: this, alpha: 0.95, duration: 400 });
    this.lift = 70;
    // a gentle curve to the building (a quadratic curve through a bend point)
    const side = building.x < g.x ? -1 : 1;
    this.curve = {
      p0: { x: g.x, y: g.y },
      p1: { x: g.x + side * 120, y: (g.y + building.y) / 2 + 30 },
      p2: { x: building.x, y: building.y + 12 },
    };
    this.t = 0;
    this.state = 'fly';
    this.ghost.setScale(1, 1).setAlpha(1);
    playSfx(this.scene, 'sfx-ghost-whoosh');
  }

  deactivate() {
    this.state = 'off';
    this.setActive(false).setVisible(false);
    this.scene.tweens.killTweensOf([this, this.ghost]);
  }

  curveAt(t) {
    const { p0, p1, p2 } = this.curve;
    const u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
      dx: 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
      dy: 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
    };
  }

  update(dt) {
    if (!this.active) return;
    this.time += dt;
    const bob = Math.sin(this.time * 3.2) * 6;

    if (this.state === 'fly') {
      const here = this.curveAt(this.t);
      const len = Math.hypot(here.dx, here.dy) || 1;
      this.t = Math.min(1, this.t + (FLY_SPEED * dt) / len);
      const p = this.curveAt(this.t);
      this.setPosition(p.x, p.y);
      if (Math.abs(p.dx) > 2) this.ghost.scaleX = p.dx > 0 ? 1 : -1;
      this.ghost.rotation = Math.sin(this.time * 4) * 0.08 + Phaser.Math.Clamp(p.dx / len, -1, 1) * 0.12;
      if (this.t >= 1) {
        this.state = 'rise';
        this.riseT = 0;
      }
    } else if (this.state === 'rise') {
      // up over the building, spinning while it wraps the chains round it
      this.riseT += dt;
      const k = Math.min(1, this.riseT / 0.7);
      this.lift = 70 + (HOVER_HEIGHT - 70) * k;
      this.ghost.rotation = Math.sin(k * Math.PI * 4) * 0.4;
      if (k >= 1) {
        this.state = 'hover';
        this.ghost.rotation = 0;
        this.building.lock(this);
      }
    } else if (this.state === 'hover') {
      this.lift = HOVER_HEIGHT + bob;
      this.ghost.rotation = Math.sin(this.time * 2) * 0.05;
    }

    this.ghost.y = -this.lift;
    this.shadow.setScale(1.2 - this.lift / 600, 0.6 - this.lift / 1200).setAlpha(0.7);
    this.setDepth(this.y + 400);
  }

  // the building was unlocked: the ghost goes "poof"
  poof() {
    if (this.state === 'off' || this.state === 'poof') return;
    this.state = 'poof';
    this.scene.smoke(this.x, this.y - this.lift);
    this.scene.tweens.add({
      targets: this.ghost,
      scaleX: 0.2,
      scaleY: 1.6,
      alpha: 0,
      angle: 200,
      duration: 380,
      ease: 'Back.In',
      onComplete: () => {
        this.deactivate();
        this.scene.events.emit('ghost-gone', this);
      },
    });
  }
}
