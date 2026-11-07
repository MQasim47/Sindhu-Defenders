import Phaser from 'phaser';
import { pushOut } from '../systems/collision.js';
import { playSfx } from '../fx/sound.js';

export const SCAN_TIME = 0.6; // seconds of lantern light needed to check someone

// Look of each villager type. Heights are in "feet up" pixels before scaling.
//   headY / bodyY: where the parts sit, topY: top of the head gear (for icons above)
const KINDS = {
  chacha: { speed: 78, scale: 1.2, bodyY: -6, headY: -70, hatY: -76, topY: 138, bob: 4 },
  amma: { speed: 52, scale: 1.18, bodyY: -6, headY: -77, hatY: -78, topY: 104, bob: 2.4 },
  bacha: { speed: 104, scale: 1.15, bodyY: -6, headY: -58, hatY: -50, topY: 100, bob: 5.5 },
};
export const KIND_NAMES = Object.keys(KINDS);

// A villager (Chacha, Amma or Bacha) built from separate parts.
// The same class is used from a pool: activate() sets one up, deactivate() puts it away.
// Behroopia (a subclass) looks the same but is a disguised monster.
export default class Villager extends Phaser.GameObjects.Container {
  constructor(scene, world) {
    super(scene, 0, 0);
    this.world = world; // { colliders, gate, speedFactor }
    this.kind = 'chacha';
    this.impostor = false;
    this.state = 'idle';
    this.path = [];
    this.pathIndex = 0;
    this.timer = 0;
    this.phase = Math.random() * 6;
    this.faceDir = 1;
    this.lit = 0; // how long the lantern has shone on this villager (seconds)
    this.verified = false; // lantern has shown that this is a real villager
    this.greeted = false;
    this.time = 0;

    this.buildParts(scene);
    this.deactivate();
    scene.add.existing(this);
  }

  buildParts(scene) {
    const add = scene.add;
    this.shadow = add.image(0, 3, 'shadow').setScale(1);
    this.tailTell = add.image(-20, -16, 'npc-tail').setOrigin(0.5, 0).setVisible(false);
    this.footLeft = add.image(-8, 0, 'npc-foot').setOrigin(0.5, 1);
    this.footRight = add.image(8, 0, 'npc-foot').setOrigin(0.5, 1);
    this.bodyImage = add.image(0, 0, 'npc-chacha-body').setOrigin(0.5, 1);
    this.badge = add.image(7, -30, 'npc-badge').setVisible(false);
    this.headImage = add.image(0, 0, 'npc-chacha-head');
    this.squint = add.image(0, 0, 'npc-squint').setVisible(false);
    this.hat = add.image(0, 0, 'npc-chacha-hat').setOrigin(0.5, 1);
    this.hatAmma = add.image(0, 0, 'npc-amma-hat').setVisible(false);
    this.topi = add.image(0, 0, 'dodo-topi').setOrigin(0.5, 41.5 / 46).setScale(0.5).setVisible(false);
    this.prop = add.image(0, 0, 'npc-chacha-prop').setOrigin(0.5, 1);
    this.hand = add.image(0, 0, 'npc-hand').setVisible(false);
    this.kite = add.image(0, 0, 'npc-bacha-prop').setVisible(false);
    this.string = add.graphics();
    this.eyeGlow = add.image(0, 0, 'fx-glow').setBlendMode(Phaser.BlendModes.ADD).setScale(0.32).setTint(0xfff070).setVisible(false);
    this.eyeGlow2 = add.image(0, 0, 'fx-glow').setBlendMode(Phaser.BlendModes.ADD).setScale(0.32).setTint(0xfff070).setVisible(false);
    this.check = add.image(0, 0, 'fx-check').setVisible(false);

    this.upper = add.container(0, 0, [
      this.bodyImage, this.badge, this.headImage, this.squint, this.hat, this.hatAmma, this.topi,
      this.eyeGlow, this.eyeGlow2, this.prop, this.hand,
    ]);
    this.facing = add.container(0, 0, [this.tailTell, this.string, this.kite, this.footLeft, this.footRight, this.upper]);
    this.bobber = add.container(0, 0, [this.facing]);
    this.squash = add.container(0, 0, [this.bobber]);
    this.add([this.shadow, this.squash, this.check]);
  }

  // ---------- Pool ----------

  // Set up for a new visit. path = list of {x, y} to walk along.
  activate(kind, x, y, path) {
    const k = KINDS[kind];
    this.kind = kind;
    this.cfg = k;
    this.setPosition(x, y);
    this.setScale(k.scale);
    this.path = path;
    this.pathIndex = 0;
    this.state = 'walk';
    this.timer = 0;
    this.lit = 0;
    this.verified = false;
    this.greeted = false;
    this.leaving = false;
    this.speed = k.speed;
    this.dir = { x: 0, y: 1 };
    this.dressUp(kind);
    this.setActive(true).setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 450 });
    this.squash.setScale(1);
    this.facing.setScale(1, 1);
    this.faceDir = 1;
    this.check.setVisible(false);
    this.squint.setVisible(false);
    this.hand.setVisible(false);
  }

  deactivate() {
    this.state = 'idle';
    this.setActive(false).setVisible(false);
    this.scene.tweens.killTweensOf(this);
  }

  // Choose the right pictures and positions for the villager type.
  dressUp(kind) {
    const k = KINDS[kind];
    this.bodyImage.setTexture(`npc-${kind}-body`).setY(k.bodyY);
    this.headImage.setTexture(`npc-${kind}-head`).setY(k.headY);
    this.squint.setY(k.headY + 1);
    this.hat.setVisible(kind === 'chacha');
    this.prop.setVisible(kind !== 'bacha');
    this.hatAmma.setVisible(kind === 'amma');
    this.topi.setVisible(kind === 'bacha');
    this.kite.setVisible(kind === 'bacha');
    this.string.setVisible(kind === 'bacha');
    this.badge.setVisible(kind === 'chacha');
    this.tailTell.setVisible(false);
    this.eyeGlow.setVisible(false);
    this.eyeGlow2.setVisible(false);
    this.badge.setTint(0x2f9e5a); // real villagers have a green badge

    if (kind === 'chacha') {
      this.hat.setTexture('npc-chacha-hat').setPosition(0, k.hatY);
      this.prop.setTexture('npc-chacha-prop').setOrigin(0.5, 1).setPosition(0, k.hatY - 16).setScale(1).setAngle(0);
      this.hand.setPosition(23, k.bodyY - 22);
    } else if (kind === 'amma') {
      this.hatAmma.setPosition(0, k.hatY);
      this.prop.setTexture('npc-amma-prop').setOrigin(0.5, 1).setPosition(26, 2).setScale(0.82).setAngle(0);
      this.hand.setPosition(-23, k.bodyY - 22);
    } else {
      this.topi.setPosition(0, k.headY - 8);
      this.kite.setPosition(-22, -128);
      this.hand.setPosition(21, k.bodyY - 20);
    }
    this.upper.setAngle(kind === 'amma' ? 3 : 0);
    this.eyeGlow.setPosition(-8, k.headY + 1);
    this.eyeGlow2.setPosition(8, k.headY + 1);
    this.check.setPosition(0, -k.topY - 20);
  }

  // ---------- Lantern ----------

  get scannable() {
    return this.active && (this.state === 'walk' || this.state === 'leave' || this.state === 'wave');
  }

  // The lantern shines on this villager. Real villagers are verified after 0.6 s.
  shine(dt) {
    this.lit += dt;
    this.squint.setVisible(true);
    this.headImage.setScale(1, 0.94);
    if (this.lit >= SCAN_TIME) this.onScanned();
  }

  // the light moved away: the progress drains slowly
  cool(dt) {
    if (this.lit <= 0) return;
    this.lit = Math.max(0, this.lit - dt * 0.6);
    if (this.lit === 0) {
      this.squint.setVisible(false);
      this.headImage.setScale(1, 1);
    }
  }

  onScanned() {
    this.markVerified();
  }

  markVerified() {
    if (this.verified) return;
    this.verified = true;
    this.check.setVisible(true).setScale(0);
    this.scene.tweens.add({ targets: this.check, scale: 1, duration: 300, ease: 'Back.Out' });
    this.waveHand(1500);
    this.scene.events.emit('verified', this);
  }

  waveHand(ms) {
    this.hand.setVisible(true);
    this.scene.tweens.add({ targets: this.hand, y: this.hand.y - 12, angle: 20, duration: 160, yoyo: true, repeat: Math.floor(ms / 320) });
    this.scene.time.delayedCall(ms, () => this.hand && this.hand.setVisible(false));
  }

  get canGreet() {
    return this.active && !this.impostor && this.verified && !this.greeted && this.state !== 'idle';
  }

  // E key: say salaam to a verified villager.
  greet() {
    this.greeted = true;
    this.check.setVisible(false);
    this.squash.setScale(1);
    this.scene.tweens.add({ targets: this.bobber, y: -18, duration: 160, yoyo: true, ease: 'Sine.Out' });
    this.waveHand(900);
    playSfx(this.scene, 'sfx-greet');
    this.scene.events.emit('greeted', this);
  }

  // ---------- Update ----------

  update(dt) {
    if (!this.active) return;
    this.time += dt;
    if (this.state === 'walk' || this.state === 'leave' || this.state === 'flee') this.move(dt);
    else if (this.state === 'wave') this.updateWave(dt);
    this.animate(dt);
    this.setDepth(this.y);
  }

  move(dt) {
    const target = this.path[this.pathIndex];
    if (!target) return this.onPathEnd();
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) {
      this.pathIndex++;
      if (this.pathIndex >= this.path.length) this.onPathEnd();
      return;
    }
    const v = this.speed * (this.state === 'leave' || this.state === 'flee' ? 1 : this.world.speedFactor);
    this.dir.x = dx / dist;
    this.dir.y = dy / dist;
    this.x += this.dir.x * v * dt;
    this.y += this.dir.y * v * dt;
    pushOut(this, this.world.colliders, 12, 6);
    if (Math.abs(this.dir.x) > 0.2) this.face(this.dir.x > 0 ? 1 : -1);

    // near the gate on the way out: fade away
    if (this.leaving) {
      const g = this.world.gate;
      this.setAlpha(Phaser.Math.Clamp((this.y - g.y) / 60, 0, 1));
    }
  }

  face(dir) {
    if (dir === this.faceDir) return;
    this.faceDir = dir;
    this.scene.tweens.add({ targets: this.facing, scaleX: dir, duration: 140, ease: 'Back.Out' });
  }

  // reached the end of the walking path
  onPathEnd() {
    if (this.leaving) {
      this.finish('left');
    } else if (this.state === 'walk') {
      this.arrive();
    } else {
      this.finish('left');
    }
  }

  // reached the middle of the fort safely: wave, coins pop out
  arrive() {
    this.state = 'wave';
    this.timer = 1.7;
    this.face(1);
    this.waveHand(1500);
    this.squash.setScale(1);
    this.scene.tweens.add({ targets: this.bobber, y: -14, duration: 170, yoyo: true, repeat: 1, ease: 'Sine.Out' });
    this.scene.events.emit('safe', this);
  }

  updateWave(dt) {
    this.timer -= dt;
    if (this.timer <= 0) this.leave();
  }

  // walk back out of the gate
  leave() {
    const g = this.world.gate;
    this.state = 'leave';
    this.leaving = true;
    this.path = [{ x: this.x + Phaser.Math.Between(-60, 60), y: this.y - 120 }, { x: g.x, y: g.y - 10 }];
    this.pathIndex = 0;
    this.speed = KINDS[this.kind].speed * 1.1;
  }

  finish(reason) {
    this.state = 'done';
    this.deactivate();
    this.scene.events.emit('gone', this, reason);
  }

  animate(dt) {
    const moving = this.state === 'walk' || this.state === 'leave' || this.state === 'flee';
    const k = this.cfg;
    if (moving) this.phase += dt * (this.speed / 10);
    const s = Math.sin(this.phase);
    const w = moving ? 1 : 0;
    if (this.state !== 'wave') this.bobber.y += (-Math.abs(s) * k.bob * w - this.bobber.y) * Math.min(1, dt * 14);
    this.footLeft.y = -Math.max(0, s) * 5 * w;
    this.footRight.y = -Math.max(0, -s) * 5 * w;
    this.upper.rotation = (this.kind === 'amma' ? 0.06 : 0) + s * 0.03 * w;
    this.headImage.rotation = Math.sin(this.time * 1.6) * 0.03;
    // gentle breathing when standing
    this.upper.scaleY = 1 + Math.sin(this.time * 2.4) * 0.012;

    if (this.kind === 'chacha') this.prop.rotation = s * 0.04 * w;
    if (this.kind === 'amma') this.prop.rotation = -s * 0.08 * w;
    if (this.kind === 'bacha') this.animateKite(dt);
  }

  // The kite floats on a string above Bacha's hand.
  animateKite(dt) {
    const sway = Math.sin(this.time * 2.2) * 5;
    this.kite.setPosition(-24 + sway - (this.state === 'walk' ? 6 : 0), -126 + Math.sin(this.time * 3) * 3);
    this.kite.rotation = Math.sin(this.time * 2.2 + 1) * 0.25;
    const g = this.string;
    g.clear();
    g.lineStyle(1.6, 0x3a1c16, 0.9);
    g.beginPath();
    g.moveTo(21, this.cfg.bodyY - 20);
    g.lineTo(this.kite.x, this.kite.y + 22);
    g.strokePath();
  }

  // Screen-space helper for icons above the head (world position)
  get topPoint() {
    return { x: this.x, y: this.y - this.cfg.topY * this.scaleY };
  }
}
