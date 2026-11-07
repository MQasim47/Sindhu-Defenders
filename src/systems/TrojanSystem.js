import Phaser from 'phaser';
import TrojanGhoda from '../objects/TrojanGhoda.js';
import Gift from '../objects/Gift.js';
import Bug from '../objects/Bug.js';
import { pushOut } from './collision.js';
import { playSfx } from '../fx/sound.js';

const HORSES = 2;
const GIFTS = 8;
const BUGS = 30;
const SWEEP_RANGE = 175;

// Everything for the Trojan attack in one place: the horses, the gifts, the bugs and the
// Antivirus Jharoo (broom). All of them are pooled (made once, reused).
export default class TrojanSystem {
  constructor(scene, world, brain) {
    this.scene = scene;
    this.world = world;
    this.brain = brain;
    this.horses = [];
    this.gifts = [];
    this.bugs = [];
    for (let i = 0; i < HORSES; i++) this.horses.push(new TrojanGhoda(scene, world, this));
    for (let i = 0; i < GIFTS; i++) this.gifts.push(new Gift(scene, world, this));
    for (let i = 0; i < BUGS; i++) this.bugs.push(new Bug(scene));

    // the broom that sweeps
    this.broom = scene.add.image(0, 0, 'prop-broom').setOrigin(0.5, 0.04).setVisible(false);
    this.sweeping = false;
  }

  // Sends one horse (if there is a free one and no other horse is busy).
  startHorse(giftCount) {
    if (this.horses.some((h) => h.active)) return false;
    const horse = this.horses.find((h) => !h.active);
    if (!horse) return false;
    horse.activate(giftCount);
    return true;
  }

  get horseActive() {
    return this.horses.some((h) => h.active);
  }

  // gifts fall out of the horse and hop to places around the courtyard
  dropGifts(horse, count) {
    const b = this.world.bounds;
    const p = this.scene.player;
    let dropped = 0;
    for (let i = 0; i < count; i++) {
      const gift = this.gifts.find((g) => !g.active);
      if (!gift) break;
      // a place around the horse, not too close to Dodo
      let tx = horse.x;
      let ty = horse.y;
      for (let tries = 0; tries < 12; tries++) {
        const a = Math.random() * Math.PI * 2;
        const r = Phaser.Math.Between(150, 380);
        tx = Phaser.Math.Clamp(horse.x + Math.cos(a) * r, 0, 9999);
        ty = Phaser.Math.Clamp(horse.y + 60 + Math.sin(a) * r * 0.55, b.minY + 20, b.maxY - 20);
        tx = Phaser.Math.Clamp(tx, b.minXAt(ty) + 30, b.maxXAt(ty) - 30);
        if (Phaser.Math.Distance.Between(tx, ty, p.x, p.y) > 170) break;
      }
      const spot = { x: tx, y: ty };
      pushOut(spot, this.world.colliders, 18, 10);
      const belly = horse.belly;
      gift.activate(belly.x, belly.y, spot.x, spot.y, 450 + i * 400);
      this.brain.recordSent('trojan');
      dropped++;
    }
    this.scene.events.emit('gifts-dropped', dropped);
  }

  releaseBugs(x, y, count) {
    for (let i = 0; i < count; i++) {
      const bug = this.bugs.find((u) => !u.active);
      if (!bug) break;
      bug.activate(x + Phaser.Math.Between(-18, 18), y + Phaser.Math.Between(-10, 10));
    }
  }

  get bugCount() {
    let n = 0;
    for (const b of this.bugs) if (b.active && b.state === 'chase') n++;
    return n;
  }

  // Dangers right now: the horse, unopened gifts, and the bug swarm (a swarm counts as a few).
  threatCount() {
    let n = this.horseActive ? 1 : 0;
    for (const g of this.gifts) if (g.active && g.state !== 'ghost') n++;
    return n + Math.ceil(this.bugCount / 4);
  }

  get isBusy() {
    return this.horseActive || this.gifts.some((g) => g.active) || this.bugCount > 0;
  }

  update(dt) {
    for (const h of this.horses) if (h.active) h.update(dt);
    for (const b of this.bugs) if (b.active) b.update(dt);
  }

  // ---------- Antivirus Jharoo ----------

  // Quick broom sweep in front of Dodo. Returns how many bugs were zapped.
  sweep(player) {
    if (this.sweeping) return 0;
    this.sweeping = true;
    const dir = player.facingDir;
    const scene = this.scene;
    playSfx(scene, 'sfx-broom');

    const broom = this.broom;
    broom.setVisible(true).setScale(1.5);
    const swing = { r: -1.35 };
    scene.tweens.add({
      targets: swing,
      r: 1.35,
      duration: 230,
      ease: 'Cubic.Out',
      onUpdate: () => {
        // the broom starts at Dodo's hand and swings from behind to the front
        broom.setPosition(player.x + dir * 22, player.y - player.z - 70);
        broom.setRotation(-dir * swing.r);
        broom.setDepth(player.y + 1);
        if (Math.random() < 0.5) scene.fx.puff(player.x + dir * (30 + 50 * (swing.r + 1.35)), player.y, dir);
      },
      onComplete: () => {
        broom.setVisible(false);
        this.sweeping = false;
      },
    });

    let zapped = 0;
    for (const bug of this.bugs) {
      if (!bug.active || bug.state !== 'chase') continue;
      const dx = bug.x - player.x;
      const dy = bug.y - player.y;
      if (dx * dir > -35 && Math.hypot(dx, dy * 1.4) < SWEEP_RANGE && bug.zap()) zapped++;
    }
    return zapped;
  }

  // is there a bug close enough to sweep?
  bugNear(player) {
    for (const b of this.bugs) {
      if (b.active && b.state === 'chase' && Math.hypot(b.x - player.x, (b.y - player.y) * 1.4) < SWEEP_RANGE + 30) return true;
    }
    return false;
  }
}
