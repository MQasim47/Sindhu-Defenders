import Phaser from 'phaser';
import { pushOut } from '../systems/collision.js';
import { playSfx } from '../fx/sound.js';

const WALK_SPEED = 88;
const WINDUP = 0.5; // seconds to raise the hammer
const HOLD = 0.12;
const SWING = 0.13;
const RECOVER = 0.5;
const RAISED = 2.8; // arm angle with the hammer up
const DOWN = 0.5; // arm angle at the moment of impact
const MAX_HITS = 9; // he gets tired after this many hits
const EASY_HITS = 4; // ...or after this many hits that only chip a strong wall

// Hathoda Dev: a big round strongman (an original cartoon blob, built from parts).
// He walks from the gate to the wall section that HackerBrain chose and hammers it.
// Damage per hit comes from the password strength of that section (see passwordAI.js).
//   weak wall    -> breaks in a few hits, he walks in and steals coins
//   strong wall  -> barely chipped, he gets tired and gives up
// Every hit makes a shockwave ring on the ground: jump over it (Space) or Dodo is knocked back.
// Pooled (made once, reused).
export default class HathodaDev extends Phaser.GameObjects.Container {
  constructor(scene, world) {
    super(scene, 0, 0);
    this.world = world;
    this.state = 'off';
    this.time = 0;
    this.section = null;
    this.hits = 0;
    this.dir = 1;

    const add = scene.add;
    this.shadow = add.image(0, 4, 'shadow').setScale(1.9, 0.9).setAlpha(0.85);
    this.armBack = add.image(-62, -88, 'hathoda-arm').setOrigin(0.5, 0.06).setRotation(0.25).setScale(0.95);
    this.bodyImage = add.image(0, 0, 'hathoda-body').setOrigin(0.5, 1);
    this.eyeL = add.image(-23, -84, 'hathoda-eye').setScale(0.95);
    this.eyeR = add.image(23, -84, 'hathoda-eye').setScale(0.95);
    this.browL = add.image(-24, -103, 'hathoda-brow').setScale(0.9);
    this.browR = add.image(24, -103, 'hathoda-brow').setScale(0.9).setFlipX(true);
    this.mouth = add.image(0, -56, 'hathoda-mouth').setScale(0.85);
    // the hammer arm swings from the shoulder
    this.hammerImage = add.image(0, 52, 'hathoda-hammer').setOrigin(0.5, 0.96).setRotation(Math.PI).setScale(0.8);
    this.armFront = add.image(0, 0, 'hathoda-arm').setOrigin(0.5, 0.06).setScale(0.95);
    this.hammerArm = add.container(62, -88, [this.hammerImage, this.armFront]);
    this.sway = add.container(0, 0, [this.armBack, this.bodyImage, this.eyeL, this.eyeR, this.browL, this.browR, this.mouth, this.hammerArm]);
    this.add([this.shadow, this.sway]);
    scene.add.existing(this);
    this.setActive(false).setVisible(false);
    this.hammerArm.setRotation(0.2);
  }

  // section = the WallSection to hammer
  activate(section) {
    const g = this.world.gate;
    this.section = section;
    this.hits = 0;
    this.setPosition(g.x, g.y).setActive(true).setVisible(true).setAlpha(0).setScale(1);
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 350 });
    // he stands just behind the wall, so the hammer lands on its top
    this.stand = { x: section.x + Phaser.Math.Between(-130, 130), y: section.wallY - 128 };
    this.state = 'walk';
    this.timer = 0;
    this.leaving = false;
    this.hammerArm.setRotation(0.2);
    this.sway.setScale(1, 1).setRotation(0);
  }

  deactivate() {
    this.state = 'off';
    this.setActive(false).setVisible(false);
    this.scene.tweens.killTweensOf([this, this.sway]);
  }

  // ---------- movement ----------

  moveTo(x, y, speed, dt, ignoreColliders = false) {
    const dx = x - this.x;
    const dy = y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) return true;
    const step = Math.min(d, speed * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    if (!ignoreColliders) pushOut(this, this.world.colliders, 36, 14);
    if (Math.abs(dx) > 4) this.dir = dx > 0 ? 1 : -1;
    // waddle
    this.sway.y = -Math.abs(Math.sin(this.time * 9)) * 4;
    this.sway.rotation = Math.sin(this.time * 9) * 0.05;
    this.sway.scaleX = this.dir;
    return false;
  }

  // ---------- the attack ----------

  update(dt) {
    if (!this.active) return;
    this.time += dt;
    const g = this.world.gate;

    switch (this.state) {
      case 'walk':
        if (this.moveTo(this.stand.x, this.stand.y, WALK_SPEED, dt, true)) this.beginCycle();
        break;
      case 'attack':
        this.updateAttack(dt);
        break;
      case 'enter':
        if (this.moveTo(this.enterTarget.x, this.enterTarget.y, WALK_SPEED * 1.15, dt)) this.steal();
        break;
      case 'steal':
        this.timer -= dt;
        this.sway.y = -Math.abs(Math.sin(this.time * 14)) * 10;
        if (this.timer <= 0) this.leave();
        break;
      case 'leave': {
        const wp = this.route[0];
        if (wp && this.moveTo(wp.x, wp.y, WALK_SPEED * 1.3, dt, true)) this.route.shift();
        if (!this.route.length) {
          this.deactivate();
          this.scene.events.emit('hathoda-gone', this);
        } else {
          this.setAlpha(Phaser.Math.Clamp((this.y - g.y) / 70, 0, 1));
        }
        break;
      }
      default:
        break;
    }
    this.setDepth(this.y);
  }

  beginCycle() {
    this.state = 'attack';
    this.phase = 'windup';
    this.phaseT = 0;
    this.sway.scaleX = 1;
    this.sway.rotation = 0;
    this.sway.y = 0;
    this.scene.events.emit('hathoda-arrived', this);
  }

  // windup (anticipation) -> hold -> swing -> impact -> recover
  updateAttack(dt) {
    this.phaseT += dt;
    const arm = this.hammerArm;
    const ease = (t) => 1 - (1 - t) * (1 - t);
    if (this.phase === 'windup') {
      const t = Math.min(1, this.phaseT / WINDUP);
      arm.rotation = 0.2 + (RAISED - 0.2) * ease(t);
      // lean back and gather strength
      this.sway.scaleY = 1 - 0.05 * Math.sin(t * Math.PI);
      this.sway.rotation = -0.06 * t;
      this.browL.angle = this.browR.angle = 0;
      if (t >= 1) this.switchPhase('hold');
    } else if (this.phase === 'hold') {
      arm.rotation = RAISED + Math.sin(this.time * 40) * 0.03;
      if (this.phaseT >= HOLD) this.switchPhase('swing');
    } else if (this.phase === 'swing') {
      const t = Math.min(1, this.phaseT / SWING);
      arm.rotation = RAISED + (DOWN - RAISED) * t * t;
      this.sway.rotation = -0.06 + 0.1 * t;
      if (t >= 1) {
        this.impact();
        if (this.state === 'attack') this.switchPhase('recover');
      }
    } else if (this.phase === 'recover') {
      const t = Math.min(1, this.phaseT / RECOVER);
      arm.rotation = DOWN + (0.2 - DOWN) * ease(t);
      this.sway.scaleY += (1 - this.sway.scaleY) * 0.2;
      this.sway.rotation *= 0.85;
      if (t >= 1) {
        // is he tired of hammering?
        if (this.hits >= MAX_HITS || (this.hits >= EASY_HITS && this.lastDamage <= 4)) this.giveUp();
        else if (this.section.broken) this.breakIn();
        else this.switchPhase('windup');
      }
    }
  }

  switchPhase(name) {
    this.phase = name;
    this.phaseT = 0;
  }

  // the hammer lands on the wall
  impact() {
    const s = this.section;
    const scene = this.scene;
    this.hits++;
    const damage = s.hitDamage;
    this.lastDamage = damage;
    // the hammer head lands in front of him, on the top of the wall
    const hx = this.x + 40;
    const hy = this.y + 40;
    scene.fx.puff(hx - 40, hy, -1);
    scene.fx.puff(hx + 10, hy, 1);
    scene.shock(this.x, s.wallY + 10);
    playSfx(scene, 'sfx-hammer-hit');
    scene.impact(50, 0.0035);
    scene.tweens.add({ targets: this.sway, scaleY: 0.9, scaleX: 1.06, duration: 70, yoyo: true });
    const broke = s.takeHit(damage);
    scene.events.emit('hathoda-hit', this, damage);
    if (broke) {
      // the wall breaks: he walks in
      this.state = 'broke';
      scene.time.delayedCall(450, () => this.breakIn());
    }
  }

  // too tired: stamps and leaves (the player stopped him!)
  giveUp() {
    this.state = 'steal'; // (a short pause where nothing else happens)
    this.timer = 0.9;
    this.gaveUp = true;
    this.scene.events.emit('hathoda-gave-up', this);
    this.scene.tweens.add({ targets: this.sway, scaleY: 0.88, duration: 90, yoyo: true, repeat: 2 });
    this.browL.angle = -12;
    this.browR.angle = 12;
  }

  // through the gap, towards a building
  breakIn() {
    if (this.state === 'enter' || this.leaving) return;
    this.state = 'enter';
    this.sway.scaleX = 1;
    const buildings = this.world.buildings;
    const b = buildings[Math.floor(Math.random() * buildings.length)];
    this.enterTarget = { x: b.x + Phaser.Math.Between(-70, 70), y: b.y + 70 };
  }

  steal() {
    this.state = 'steal';
    this.timer = 1.1;
    this.gaveUp = false;
    this.mouth.setScale(1.1);
    this.scene.events.emit('hathoda-steal', this);
  }

  leave() {
    const g = this.world.gate;
    const s = this.section;
    this.state = 'leave';
    this.leaving = true;
    this.mouth.setScale(0.85);
    this.browL.angle = this.browR.angle = 0;
    // back out the same way: through the gap (if there was one), then to the gate
    this.route = this.gaveUp
      ? [{ x: (this.x + g.x) / 2, y: this.y - 80 }, { x: g.x, y: g.y - 10 }]
      : [{ x: s.x, y: s.wallY + 90 }, { x: s.x, y: s.wallY - 140 }, { x: g.x, y: g.y - 10 }];
  }
}
