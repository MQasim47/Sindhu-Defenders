import Phaser from 'phaser';
import { SCAN_TIME } from './Villager.js';
import { playSfx } from '../fx/sound.js';
import { settings } from '../data/settings.js';

const RANGE = 410; // how far the light reaches (pixels)
const HALF_ANGLE = 0.65; // half width of the cone (radians): about 74 degrees in total
const CONE_IMAGE_LENGTH = 420;
const TURN_SPEED = Phaser.Math.DegToRad(110); // how fast the beam turns (per second)
const AIM_ASSIST_ANGLE = Phaser.Math.DegToRad(20); // a target this close to the beam pulls it a little
const AIM_ASSIST_PULL = Phaser.Math.DegToRad(8); // ...but never more than this
const MOTE_COUNT = 14;

// Sach ki Lalten. Hold Q: Dodo raises the lantern and stands still.
//   - The beam starts exactly in the direction Dodo is facing (no jump).
//   - While Q is held, the arrow keys / WASD turn the BEAM. Dodo turns his body to follow it.
//   - Soft aim help: a person close to the beam pulls it gently (never snaps).
//   - Anyone inside the cone for SCAN_TIME seconds is checked: a Behroopia loses its disguise,
//     a real villager smiles, a gift turns see-through. The progress drains slowly when the
//     light moves away, so a small wobble does not lose it.
export default class Lantern {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.on = false;
    this.amount = 0; // 0..1 fade of the light
    this.angle = 0; // where the player aims (radians, 0 = right)
    this.omega = 0; // how fast the beam turns right now
    this.bend = 0; // the small pull of the aim help
    this.beam = 0; // angle + bend: the real direction of the light
    this.origin = { x: 0, y: 0 };
    this.onFirstUse = null; // set by the level (to hide the "Q" hint)
    this.used = false;

    this.cone = scene.add
      .image(0, 0, 'fx-cone')
      .setOrigin(0, 0.5)
      .setScale(RANGE / CONE_IMAGE_LENGTH)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0)
      .setVisible(false);
    this.glow = scene.add.image(0, 0, 'fx-glow').setBlendMode(Phaser.BlendModes.ADD).setScale(2.2).setAlpha(0).setVisible(false);
    this.aimLine = scene.add.graphics().setVisible(false);
    this.rings = scene.add.graphics().setDepth(98900);

    this.motes = [];
    const count = settings.low ? 6 : MOTE_COUNT;
    for (let i = 0; i < count; i++) {
      const m = scene.add.image(0, 0, 'fx-mote').setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
      m.life = 0;
      this.motes.push(m);
    }
    this.moteTimer = 0;
  }

  update(dt, npcs) {
    const p = this.player;
    const held = p.keys.lantern.isDown && p.state !== 'crouch' && !p.inputLocked;
    if (held && !this.on) this.turnOn();
    if (!held && this.on) this.on = false;
    p.lanternUp = this.on;

    this.amount += ((this.on ? 1 : 0) - this.amount) * Math.min(1, dt * 12);
    const visible = this.amount > 0.02;
    this.cone.setVisible(visible);
    this.glow.setVisible(visible);
    this.aimLine.setVisible(visible);

    if (this.on) this.aim(dt, npcs);

    if (visible) {
      // the light starts at the lantern in Dodo's raised hand (it moves smoothly when he turns)
      const targetX = p.x + p.facingDir * p.lanternHand.x;
      const targetY = p.y - p.z - p.lanternHand.y;
      this.origin.x += (targetX - this.origin.x) * Math.min(1, dt * 16);
      this.origin.y += (targetY - this.origin.y) * Math.min(1, dt * 16);
      const flicker = settings.low || settings.reduced ? 0 : Math.sin(this.scene.time.now / 70) * 0.04;
      this.cone.setPosition(this.origin.x, this.origin.y).setRotation(this.beam).setAlpha((0.62 + flicker) * this.amount).setDepth(p.y + 0.5);
      this.glow.setPosition(this.origin.x, this.origin.y).setAlpha(0.28 * this.amount).setDepth(p.y + 0.4);
      this.drawAimLine(p.y + 0.55);
    }

    this.updateMotes(dt);
    this.scan(dt, npcs);
  }

  turnOn() {
    const p = this.player;
    this.on = true;
    // the beam starts exactly where Dodo looks: no snap, no jump
    this.angle = p.facingDir > 0 ? 0 : Math.PI;
    this.omega = 0;
    this.bend = 0;
    this.beam = this.angle;
    this.origin.x = p.x + p.facingDir * p.lanternHand.x;
    this.origin.y = p.y - p.z - p.lanternHand.y;
    playSfx(this.scene, 'sfx-lantern');
    if (!this.used) {
      this.used = true;
      if (this.onFirstUse) this.onFirstUse();
    }
  }

  // Turns the beam with the keys, adds the soft aim help, and turns Dodo's body.
  aim(dt, npcs) {
    const p = this.player;
    const k = p.keys;
    const ix = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
    const iy = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);

    // keys say where the beam should point. It turns towards it at a fixed speed,
    // slowing down near the end (ease-out) and speeding up smoothly (ease-in).
    let wanted = 0;
    if (ix || iy) {
      const diff = Phaser.Math.Angle.Wrap(Math.atan2(iy, ix) - this.angle);
      wanted = Phaser.Math.Clamp(diff / 0.5, -1, 1) * TURN_SPEED;
    }
    this.omega += (wanted - this.omega) * Math.min(1, dt * 11);
    this.angle = Phaser.Math.Angle.Wrap(this.angle + this.omega * dt);

    // soft aim help: the person closest to the beam (within 20 degrees) pulls it a little
    let pull = 0;
    let bestDiff = AIM_ASSIST_ANGLE;
    for (let i = 0; i < npcs.length; i++) {
      const n = npcs[i];
      if (!n.active || !n.scannable || n.verified || (n.impostor && n.revealed)) continue;
      const dx = n.x - this.origin.x;
      const dy = n.y - 40 - this.origin.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 20 || d > RANGE) continue;
      const diff = Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - this.angle);
      if (Math.abs(diff) < Math.abs(bestDiff)) {
        bestDiff = diff;
        pull = Phaser.Math.Clamp(diff, -AIM_ASSIST_PULL, AIM_ASSIST_PULL);
      }
    }
    this.bend += (pull - this.bend) * Math.min(1, dt * 5);
    this.beam = this.angle + this.bend;

    // Dodo turns his body to follow the beam
    const c = Math.cos(this.beam);
    const want = c > 0.3 ? 1 : c < -0.3 ? -1 : p.facingDir;
    if (want !== p.facingDir) p.turn(want);
  }

  // a faint dotted line along the middle of the cone
  drawAimLine(depth) {
    const g = this.aimLine;
    g.clear();
    g.setDepth(depth);
    g.lineStyle(3, 0xfff2b0, 0.42 * this.amount);
    const cos = Math.cos(this.beam);
    const sin = Math.sin(this.beam);
    for (let i = 0; i < 12; i++) {
      const a = 40 + i * 32;
      const b = a + 16;
      g.beginPath();
      g.moveTo(this.origin.x + cos * a, this.origin.y + sin * a);
      g.lineTo(this.origin.x + cos * b, this.origin.y + sin * b);
      g.strokePath();
    }
  }

  // who is inside the cone?
  scan(dt, npcs) {
    const g = this.rings;
    g.clear();
    const lit = this.on && this.amount > 0.6;
    for (let i = 0; i < npcs.length; i++) {
      const n = npcs[i];
      if (!n.active) continue;
      let inside = false;
      if (lit && n.scannable && !(n.impostor && n.revealed)) {
        const dx = n.x - this.origin.x;
        const dy = n.y - 40 - this.origin.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < RANGE && d > 10) {
          const a = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - this.beam));
          inside = a < HALF_ANGLE + 0.12 * (1 - d / RANGE);
        }
      }
      if (inside) n.shine(dt);
      else n.cool(dt);

      // progress ring above the head
      if (n.lit > 0.02 && n.active && !n.verified && !(n.impostor && n.revealed)) {
        const top = n.topPoint;
        const r = 17;
        const t = Math.min(1, n.lit / SCAN_TIME);
        g.fillStyle(0x2a0e14, 0.65);
        g.fillCircle(top.x, top.y - 12, r + 4);
        g.lineStyle(6, 0xffe08a, 1);
        g.beginPath();
        g.arc(top.x, top.y - 12, r, -Math.PI / 2, -Math.PI / 2 + t * Math.PI * 2, false);
        g.strokePath();
      }
    }
  }

  // light motes float out of the lantern
  updateMotes(dt) {
    const p = this.player;
    if (this.on && !settings.reduced) {
      this.moteTimer -= dt;
      if (this.moteTimer <= 0) {
        this.moteTimer = 0.09;
        const m = this.motes.find((mote) => mote.life <= 0);
        if (m) {
          const spread = (Math.random() - 0.5) * HALF_ANGLE * 1.6;
          const a = this.beam + spread;
          const speed = 70 + Math.random() * 90;
          m.life = m.maxLife = 1 + Math.random() * 0.7;
          m.vx = Math.cos(a) * speed;
          m.vy = Math.sin(a) * speed;
          m.setPosition(this.origin.x + Math.cos(a) * 20, this.origin.y + Math.sin(a) * 20).setVisible(true).setScale(0.5 + Math.random() * 0.6);
        }
      }
    }
    for (const m of this.motes) {
      if (m.life <= 0) continue;
      m.life -= dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.setAlpha(Math.min(1, m.life / m.maxLife) * 0.8).setDepth(p.y + 0.6);
      if (m.life <= 0) m.setVisible(false);
    }
  }
}
