import Phaser from 'phaser';
import { ARENA } from '../level/bossArena.js';
import { playSfx } from '../fx/sound.js';

// The three normal attacks of the Jadugar. Every attack:
//   - shows a red warning marker for WARN seconds first (so it is always fair)
//   - is pooled (all pictures are made once in the constructor)
//   - has start(), update(dt), clear() and a flag "active"
// They talk to the BossScene (the "boss" argument): boss.player, boss.jadGround, boss.inBeam(x, y, pad),
// boss.shieldBlocks(x, y), boss.hurtDodo(amount, attackName), boss.igniteBugs(), boss.burned(), boss.fx
export const WARN = 0.6;
const RED = 0xff3b3b;

// a red warning on the floor: a glowing disc with a ring (set its scale to grow it)
function marker(scene) {
  const glow = scene.add.image(0, 0, 'fx-glow').setTint(RED).setBlendMode(Phaser.BlendModes.ADD).setScale(1.3).setAlpha(0.6);
  const ring = scene.add.image(0, 0, 'fx-ring').setTint(0xff7a6a).setBlendMode(Phaser.BlendModes.ADD).setScale(1.5);
  return scene.add.container(0, 0, [glow, ring]).setVisible(false);
}

// ---------------------------------------------------------------------------------------------
// Phishing Barish: fake letters rain down on marked spots. Burn them with the lantern or step away.
// ---------------------------------------------------------------------------------------------
export class LetterRain {
  constructor(boss) {
    this.boss = boss;
    this.active = false;
    this.letters = [];
    for (let i = 0; i < 8; i++) {
      this.letters.push({
        mark: marker(boss),
        image: boss.add.image(0, 0, 'boss-letter').setVisible(false).setOrigin(0.5, 1),
        state: 'idle',
        t: 0,
        delay: 0,
        x: 0,
        y: 0,
      });
    }
  }

  // round 1: 4 letters, round 2: 5, round 3: 6. The first one is aimed at Dodo.
  start(round) {
    const boss = this.boss;
    const p = boss.player;
    const count = 3 + round;
    this.active = true;
    this.letters.slice(0, count).forEach((l, i) => {
      l.x = i === 0 ? p.x : Phaser.Math.Between(ARENA.minX + 40, ARENA.maxX - 40);
      l.y = i === 0 ? p.y : Phaser.Math.Between(ARENA.minY + 20, ARENA.maxY);
      l.state = 'warn';
      l.t = -i * 0.22; // a short pause between the letters
      l.mark.setVisible(false);
    });
  }

  update(dt) {
    if (!this.active) return;
    const boss = this.boss;
    const p = boss.player;
    let alive = false;
    for (const l of this.letters) {
      if (l.state === 'idle') continue;
      alive = true;
      l.t += dt;
      if (l.t < 0) continue;
      if (l.state === 'warn') {
        const k = Math.min(1, l.t / WARN);
        l.mark.setVisible(true).setPosition(l.x, l.y).setScale(0.3 + k * 0.7, (0.3 + k * 0.7) * 0.42).setAlpha(0.5 + 0.4 * Math.sin(l.t * 24)).setDepth(l.y - 5);
        if (l.t >= WARN) {
          l.state = 'fall';
          l.t = 0;
          l.image.setVisible(true).setAngle(0);
        }
      } else if (l.state === 'fall') {
        const k = Math.min(1, l.t / 0.55);
        const y = l.y - 420 * (1 - k * k);
        l.image.setPosition(l.x, y).setDepth(y + 400).setAngle(Math.sin(l.t * 14) * 14);
        // the lantern burns it, or the shield stops it
        if (boss.inBeam(l.x, y - 20, 46)) this.burn(l);
        else if (boss.shieldBlocks(l.x, y)) this.pop(l);
        else if (k >= 1) this.land(l, p);
      } else if (l.state === 'lying') {
        l.image.setAlpha(Math.max(0, 1 - l.t / 0.35));
        if (l.t >= 0.35) this.end(l);
      }
    }
    if (!alive) this.active = false;
  }

  land(l, p) {
    const boss = this.boss;
    l.state = 'lying';
    l.t = 0;
    l.image.setPosition(l.x, l.y).setDepth(l.y).setAngle(0).setAlpha(1);
    l.mark.setVisible(false);
    boss.fx.puff(l.x, l.y, 0);
    playSfx(boss, 'sfx-letter-land');
    const dx = (p.x - l.x) / 54;
    const dy = (p.y - l.y) / 28;
    if (dx * dx + dy * dy < 1 && p.z < 30) boss.hurtDodo(6, 'phishing');
  }

  burn(l) {
    this.boss.burned(l.x, l.image.y);
    this.pop(l);
  }

  pop(l) {
    this.boss.fx.sparkle(l.x, l.image.y - 10);
    this.end(l);
  }

  end(l) {
    l.state = 'idle';
    l.mark.setVisible(false);
    l.image.setVisible(false).setAlpha(1);
  }

  clear() {
    this.letters.forEach((l) => this.end(l));
    this.active = false;
  }
}

// ---------------------------------------------------------------------------------------------
// Hathoda Lehar: the Jadugar slams the ground, a shockwave ring spreads. Jump over it (Space).
// ---------------------------------------------------------------------------------------------
export class SlamWave {
  constructor(boss) {
    this.boss = boss;
    this.active = false;
    this.mark = marker(boss);
    this.ring = boss.add.image(0, 0, 'fx-ring').setTint(0xb48cff).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.t = 0;
    this.phase = 'idle';
    this.hit = false;
    this.x = 0;
    this.y = 0;
  }

  start() {
    const g = this.boss.jadGround;
    this.x = g.x;
    this.y = g.y;
    this.t = 0;
    this.phase = 'warn';
    this.hit = false;
    this.active = true;
    this.boss.jadSlamPrep(true);
  }

  update(dt) {
    if (!this.active) return;
    const boss = this.boss;
    const p = boss.player;
    this.t += dt;
    if (this.phase === 'warn') {
      const k = Math.min(1, this.t / WARN);
      this.mark.setVisible(true).setPosition(this.x, this.y).setScale(0.4 + k * 0.5, (0.4 + k * 0.5) * 0.4).setAlpha(0.5 + 0.4 * Math.sin(this.t * 24)).setDepth(this.y - 5);
      if (this.t >= WARN) {
        this.phase = 'wave';
        this.t = 0;
        this.mark.setVisible(false);
        boss.jadSlam();
        boss.impact(70, 0.006);
        playSfx(boss, 'sfx-shockwave');
        this.ring.setVisible(true);
      }
    } else if (this.phase === 'wave') {
      const k = this.t / 1.15;
      if (k >= 1) {
        this.phase = 'idle';
        this.ring.setVisible(false);
        this.active = false;
        boss.jadSlamPrep(false);
        return;
      }
      const radius = 40 + 480 * k;
      this.ring.setPosition(this.x, this.y).setScale(radius / 36, (radius / 36) * 0.4).setAlpha(1 - k * 0.8).setDepth(this.y + 1);
      if (!this.hit && p.z < 28) {
        const dx = (p.x - this.x) / radius;
        const dy = (p.y - this.y) / (radius * 0.4);
        if (Math.abs(Math.hypot(dx, dy) - 1) < 0.13) {
          this.hit = true;
          boss.hurtDodo(14, 'hathoda', p.x >= this.x ? 1 : -1);
        }
      }
    }
  }

  clear() {
    this.mark.setVisible(false);
    this.ring.setVisible(false);
    if (this.active) this.boss.jadSlamPrep(false);
    this.active = false;
    this.phase = 'idle';
  }
}

// ---------------------------------------------------------------------------------------------
// Trojan Tohfa: three FREE gifts slide towards Dodo. A touch releases bugs (damage over time).
// Burn a gift with the lantern or block it with the shield.
// ---------------------------------------------------------------------------------------------
const GIFT_SPEED = 230;

export class GiftThrow {
  constructor(boss) {
    this.boss = boss;
    this.active = false;
    this.phase = 'idle';
    this.t = 0;
    this.lines = boss.add.graphics().setDepth(900);
    this.gifts = [];
    for (let i = 0; i < 3; i++) {
      this.gifts.push({ image: boss.add.image(0, 0, 'gift-box').setVisible(false).setOrigin(0.5, 0.9), shadow: boss.add.image(0, 0, 'shadow').setScale(0.5).setAlpha(0.6).setVisible(false), on: false, x: 0, y: 0, vx: 0, vy: 0, time: 0 });
    }
    this.aim = 0;
  }

  start() {
    const boss = this.boss;
    const g = boss.jadGround;
    this.aim = Math.atan2(boss.player.y - g.y, boss.player.x - g.x);
    this.phase = 'warn';
    this.t = 0;
    this.active = true;
    boss.jadWindup();
  }

  update(dt) {
    if (!this.active) return;
    const boss = this.boss;
    const p = boss.player;
    const g = boss.jadGround;
    const angles = [-0.34, 0, 0.34];
    if (this.phase === 'warn') {
      this.t += dt;
      this.lines.clear();
      this.lines.lineStyle(5, RED, 0.35 + 0.35 * Math.sin(this.t * 26));
      angles.forEach((a) => {
        const ang = this.aim + a;
        this.lines.beginPath();
        this.lines.moveTo(g.x, g.y);
        this.lines.lineTo(g.x + Math.cos(ang) * 600, g.y + Math.sin(ang) * 600 * 0.7);
        this.lines.strokePath();
      });
      if (this.t >= WARN) {
        this.lines.clear();
        this.phase = 'slide';
        playSfx(boss, 'sfx-gift-throw');
        this.gifts.forEach((gift, i) => {
          const ang = this.aim + angles[i];
          Object.assign(gift, { on: true, x: g.x, y: g.y, vx: Math.cos(ang) * GIFT_SPEED, vy: Math.sin(ang) * GIFT_SPEED * 0.7, time: i });
          gift.image.setVisible(true);
          gift.shadow.setVisible(true);
        });
      }
      return;
    }
    // sliding
    let any = false;
    for (const gift of this.gifts) {
      if (!gift.on) continue;
      gift.time += dt;
      gift.x += gift.vx * dt;
      gift.y += gift.vy * dt;
      const hop = Math.abs(Math.sin(gift.time * 6)) * 14;
      gift.image.setPosition(gift.x, gift.y - hop).setDepth(gift.y).setAngle(Math.sin(gift.time * 8) * 8);
      gift.shadow.setPosition(gift.x, gift.y + 4).setDepth(gift.y - 1);
      if (boss.inBeam(gift.x, gift.y - 24, 44) || boss.shieldBlocks(gift.x, gift.y - 24)) {
        this.pop(gift, true);
        continue;
      }
      if (Math.abs(gift.x - p.x) < 40 && Math.abs(gift.y - p.y) < 30 && p.z < 30) {
        this.pop(gift, false);
        boss.hurtDodo(4, 'trojan');
        boss.igniteBugs();
        continue;
      }
      if (gift.x < 30 || gift.x > 1250 || gift.y > 700 || gift.y < ARENA.minY - 60) {
        this.off(gift);
        continue;
      }
      any = true;
    }
    if (!any) {
      this.active = false;
      this.phase = 'idle';
    }
  }

  // safe = the gift was burned or blocked (no bugs)
  pop(gift, safe) {
    this.boss.fx.sparkle(gift.x, gift.y - 24);
    if (safe) {
      this.boss.burned(gift.x, gift.y - 24);
      playSfx(this.boss, 'sfx-gift-pop');
    }
    this.off(gift);
  }

  off(gift) {
    gift.on = false;
    gift.image.setVisible(false);
    gift.shadow.setVisible(false);
  }

  clear() {
    this.lines.clear();
    this.gifts.forEach((g) => this.off(g));
    this.active = false;
    this.phase = 'idle';
  }
}
