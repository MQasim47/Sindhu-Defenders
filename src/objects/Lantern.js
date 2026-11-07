import Phaser from 'phaser';
import { SCAN_TIME } from './Villager.js';
import { playSfx } from '../fx/sound.js';
import { settings } from '../data/settings.js';

const RANGE = 340; // how far the light reaches (pixels)
const HALF_ANGLE = 0.52; // half width of the cone (radians, about 30 degrees)
const CONE_IMAGE_LENGTH = 420;
const MOTE_COUNT = 14;

// Sach ki Lalten. Hold Q: Dodo raises a brass lantern and a warm cone of light
// points where he faces. Anyone inside the cone for SCAN_TIME seconds is checked:
// a disguised Behroopia is revealed, a real villager smiles and waves.
export default class Lantern {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.on = false;
    this.amount = 0; // 0..1 fade of the light
    this.angle = 0;
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

    if (visible) {
      // light starts at the lantern in Dodo's raised hand
      this.origin.x = p.x + p.facingDir * p.lanternHand.x;
      this.origin.y = p.y - p.z - p.lanternHand.y;
      const diff = Phaser.Math.Angle.Wrap(p.aim - this.angle);
      this.angle += diff * Math.min(1, dt * 14);
      const flicker = settings.low || settings.reduced ? 0 : Math.sin(this.scene.time.now / 70) * 0.04;
      this.cone.setPosition(this.origin.x, this.origin.y).setRotation(this.angle).setAlpha((0.62 + flicker) * this.amount).setDepth(p.y + 0.5);
      this.glow.setPosition(this.origin.x, this.origin.y).setAlpha(0.28 * this.amount).setDepth(p.y + 0.4);
    }

    this.updateMotes(dt);
    this.scan(dt, npcs);
  }

  turnOn() {
    const p = this.player;
    this.on = true;
    // aim the way Dodo is facing, until he moves another way
    if (!p.vx && !p.vy) p.aim = p.facingDir > 0 ? 0 : Math.PI;
    this.angle = p.aim;
    playSfx(this.scene, 'sfx-lantern');
    if (!this.used) {
      this.used = true;
      if (this.onFirstUse) this.onFirstUse();
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
          const a = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - this.angle));
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
          const a = this.angle + spread;
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
