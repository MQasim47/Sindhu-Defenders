import Phaser from 'phaser';
import Villager, { KIND_NAMES } from '../objects/Villager.js';
import Behroopia from '../objects/Behroopia.js';

const POOL_VILLAGERS = 10;
const POOL_MONSTERS = 6;

// Sends villagers and Behroopias through the gate during one wave.
// All numbers come from the level data (src/data/levels.js). Objects are pooled.
export default class WaveSpawner {
  constructor(scene, world, level) {
    this.scene = scene;
    this.world = world; // { colliders, gate, center, speedFactor, throwChance }
    this.level = level;
    this.time = 0;
    this.nextSpawn = 2.2;
    this.started = false;
    this.spawnedMonster = false;
    this.done = false;
    this.disguiseWeights = { ...level.disguiseWeights };
    this.villagerWeights = { ...level.villagerWeights };

    this.villagers = [];
    this.monsters = [];
    for (let i = 0; i < POOL_VILLAGERS; i++) this.villagers.push(new Villager(scene, world));
    for (let i = 0; i < POOL_MONSTERS; i++) this.monsters.push(new Behroopia(scene, world));
    this.all = this.villagers.concat(this.monsters);
  }

  start() {
    this.started = true;
  }

  // The AI Hacker (Step 3) can call this to change which disguises are used.
  setDisguiseWeights(weights) {
    Object.assign(this.disguiseWeights, weights);
  }

  get phase() {
    const phases = this.level.phases;
    return phases.find((p) => this.time < p.until) || phases[phases.length - 1];
  }

  get activeCount() {
    let n = 0;
    for (const v of this.all) if (v.active) n++;
    return n;
  }

  update(dt) {
    for (const v of this.all) if (v.active) v.update(dt);
    if (!this.started || this.done) return;

    this.time += dt;
    this.world.speedFactor = this.phase.speed;

    if (this.time < this.level.duration) {
      this.nextSpawn -= dt;
      if (this.nextSpawn <= 0) {
        this.spawnOne();
        const [a, b] = this.phase.interval;
        this.nextSpawn = Phaser.Math.FloatBetween(a, b);
      }
    } else if (this.activeCount === 0 || this.time > this.level.duration + 16) {
      this.done = true;
      this.scene.events.emit('wave-end');
    }
  }

  pickKind(weights) {
    const names = KIND_NAMES;
    let total = 0;
    names.forEach((n) => (total += weights[n] || 0));
    let r = Math.random() * total;
    for (const n of names) {
      r -= weights[n] || 0;
      if (r <= 0) return n;
    }
    return names[0];
  }

  spawnOne() {
    const lv = this.level;
    let monster = Math.random() < this.phase.monsterChance;
    if (!this.spawnedMonster && this.time >= lv.firstMonsterAt) monster = true;
    if (this.time < lv.firstMonsterAt && !this.spawnedMonster) monster = false;

    const pool = monster ? this.monsters : this.villagers;
    const limit = monster ? lv.maxMonsters : lv.maxVillagers;
    let used = 0;
    let free = null;
    for (const v of pool) {
      if (v.active) used++;
      else if (!free) free = v;
    }
    if (!free || used >= limit) return;

    const kind = this.pickKind(monster ? this.disguiseWeights : this.villagerWeights);
    const g = this.world.gate;
    const c = this.world.center;
    const x = g.x + Phaser.Math.Between(-40, 40);
    // a natural path: out of the gate, a bend in the middle, then towards the centre
    const path = [
      { x: x + Phaser.Math.Between(-30, 30), y: g.y + 90 },
      { x: c.x + Phaser.Math.Between(-240, 240), y: (g.y + c.y) / 2 + Phaser.Math.Between(-30, 40) },
      { x: c.x + Phaser.Math.Between(-80, 80), y: c.y + Phaser.Math.Between(-30, 30) },
    ];
    free.activate(kind, x, g.y, path);
    if (monster && !this.spawnedMonster) {
      this.spawnedMonster = true;
      this.scene.events.emit('first-monster', free);
    }
  }
}
