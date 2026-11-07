import Phaser from 'phaser';
import Villager, { KIND_NAMES } from '../objects/Villager.js';
import Behroopia from '../objects/Behroopia.js';
import TrojanSystem from './TrojanSystem.js';

const POOL_VILLAGERS = 10;
const POOL_MONSTERS = 6;

// Sends villagers, Behroopias and the Trojan Ghoda through the gate during a wave.
// The numbers of a wave come from src/data/levels.js. WHAT is sent (which disguise,
// phishing or trojan) comes from the AI Hacker's plan (brain.current). Objects are pooled.
export default class WaveSpawner {
  constructor(scene, world, level, brain) {
    this.scene = scene;
    this.world = world; // { colliders, gate, center, bounds, speedFactor, throwChance }
    this.level = level;
    this.brain = brain;
    this.time = 0;
    this.nextSpawn = 1.6;
    this.running = false;
    this.wave = null;
    this.pending = 0; // monsters that are still coming out of the magic swirl
    this.firstMonsterDone = false;
    this.firstHorseDone = false;
    this.villagerWeights = { ...level.villagerWeights };

    this.villagers = [];
    this.monsters = [];
    for (let i = 0; i < POOL_VILLAGERS; i++) this.villagers.push(new Villager(scene, world));
    for (let i = 0; i < POOL_MONSTERS; i++) this.monsters.push(new Behroopia(scene, world));
    this.trojan = new TrojanSystem(scene, world, brain);
    // everything the Lantern can check (and that must be updated every frame)
    this.all = this.villagers.concat(this.monsters, this.trojan.gifts);
  }

  beginWave(wave) {
    this.wave = wave;
    this.time = 0;
    this.nextSpawn = 1.2;
    this.running = true;
  }

  get phase() {
    const phases = this.wave.phases;
    return phases.find((p) => this.time < p.until) || phases[phases.length - 1];
  }

  activeCount() {
    let n = this.pending;
    for (const v of this.all) if (v.active) n++;
    return n + (this.trojan.horseActive ? 1 : 0) + this.trojan.bugCount;
  }

  // Dangers right now (never more than level.maxThreats, so it stays fair)
  threatCount() {
    let n = this.pending;
    for (const m of this.monsters) if (m.active && !m.revealed && m.state !== 'steal' && m.state !== 'flee') n++;
    return n + this.trojan.threatCount();
  }

  update(dt) {
    for (const v of this.villagers) if (v.active) v.update(dt);
    for (const m of this.monsters) if (m.active) m.update(dt);
    for (const g of this.trojan.gifts) if (g.active) g.update(dt);
    this.trojan.update(dt);
    if (!this.running) return;

    this.time += dt;
    this.world.speedFactor = this.phase.speed;

    if (this.time < this.wave.duration) {
      this.nextSpawn -= dt;
      if (this.nextSpawn <= 0) {
        this.spawnOne();
        const [a, b] = this.phase.interval;
        this.nextSpawn = Phaser.Math.FloatBetween(a, b);
      }
    } else if (this.activeCount() === 0 || this.time > this.wave.duration + 18) {
      this.running = false;
      this.scene.events.emit('wave-done', this.wave);
    }
  }

  // pick a name using weights, e.g. { chacha: 0.2, amma: 0.7, bacha: 0.1 }
  pickKind(weights) {
    let total = 0;
    KIND_NAMES.forEach((n) => (total += weights[n] || 0));
    let r = Math.random() * total;
    for (const n of KIND_NAMES) {
      r -= weights[n] || 0;
      if (r <= 0) return n;
    }
    return KIND_NAMES[0];
  }

  spawnOne() {
    const lv = this.level;
    if (this.threatCount() >= lv.maxThreats) {
      this.nextSpawn = 0.8; // too many dangers: wait a little
      return;
    }
    let monster = Math.random() < this.phase.monsterChance;
    if (this.wave.n === 1 && !this.firstMonsterDone) monster = this.time >= lv.firstMonsterAt;

    if (!monster) return this.sendVillager();

    // the AI Hacker decides: phishing or trojan?
    const aw = this.brain.current.attackWeights;
    const wantTrojan = this.wave.trojan && !this.trojan.isBusy && this.threatCount() <= 3 && Math.random() < aw.trojan;
    if (wantTrojan) return this.sendHorse();
    this.sendBehroopia();
  }

  sendVillager() {
    const free = this.villagers.find((v) => !v.active);
    if (!free || this.villagers.filter((v) => v.active).length >= this.level.maxVillagers) return;
    const kind = this.pickKind(this.villagerWeights);
    this.place(free, kind);
  }

  sendBehroopia() {
    const free = this.monsters.find((m) => !m.active && !m.pending);
    if (!free || this.monsters.filter((m) => m.active).length >= this.level.maxMonsters) return;
    const kind = this.pickKind(this.brain.current.disguiseWeights);
    this.brain.recordSent('phishing', kind);
    // the Jadugar points at the gate, a magic swirl opens, then the monster steps out
    const g = this.world.gate;
    this.scene.events.emit('send', g.x, g.y);
    free.pending = true;
    this.pending++;
    this.scene.time.delayedCall(450, () => {
      this.place(free, kind);
      free.pending = false;
      this.pending--;
    });
    if (!this.firstMonsterDone) {
      this.firstMonsterDone = true;
      this.scene.events.emit('first-monster', free);
    }
  }

  sendHorse() {
    const count = this.wave.n >= 3 ? Phaser.Math.Between(4, 5) : Phaser.Math.Between(3, 4);
    const g = this.world.gate;
    this.scene.events.emit('send', g.x, g.y);
    this.pending++;
    this.scene.time.delayedCall(450, () => {
      this.trojan.startHorse(count);
      this.pending--;
    });
    if (!this.firstHorseDone) {
      this.firstHorseDone = true;
      this.scene.events.emit('first-horse');
    }
  }

  // walk through the gate along a natural path towards the middle
  place(npc, kind) {
    const g = this.world.gate;
    const c = this.world.center;
    const x = g.x + Phaser.Math.Between(-40, 40);
    const path = [
      { x: x + Phaser.Math.Between(-30, 30), y: g.y + 90 },
      { x: c.x + Phaser.Math.Between(-240, 240), y: (g.y + c.y) / 2 + Phaser.Math.Between(-30, 40) },
      { x: c.x + Phaser.Math.Between(-80, 80), y: c.y + Phaser.Math.Between(-30, 30) },
    ];
    npc.activate(kind, x, g.y, path);
  }
}
