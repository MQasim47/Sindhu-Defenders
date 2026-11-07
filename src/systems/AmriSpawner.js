import Phaser from 'phaser';
import HathodaDev from '../objects/HathodaDev.js';
import TaalaBhoot from '../objects/TaalaBhoot.js';

const POOL = 3;

// Sends Hathoda Dev (to a wall section) and Taala Bhoot (to a building) during a wave of Level 2.
// WHICH section or building is chosen comes from HackerBrain (the weakest one: highest weakness score;
// a tie goes to the weakest password / a building without a backup). Objects are pooled.
export default class AmriSpawner {
  constructor(scene, world, level, brain, sections, buildings) {
    this.scene = scene;
    this.world = world;
    this.level = level;
    this.brain = brain;
    this.sections = sections; // WallSection[]
    this.buildings = buildings; // Building[]
    this.time = 0;
    this.running = false;
    this.wave = null;
    this.pending = 0;
    this.nextHathoda = 2;
    this.nextTaala = 6;
    this.firstHathoda = false;
    this.firstGhost = false;

    this.hathodas = [];
    this.ghosts = [];
    for (let i = 0; i < POOL; i++) this.hathodas.push(new HathodaDev(scene, world));
    for (let i = 0; i < POOL; i++) this.ghosts.push(new TaalaBhoot(scene, world));
  }

  beginWave(wave) {
    this.wave = wave;
    this.time = 0;
    this.running = true;
    this.nextHathoda = 2;
    this.nextTaala = 7;
  }

  activeCount() {
    let n = this.pending;
    this.hathodas.forEach((h) => h.active && n++);
    this.ghosts.forEach((g) => g.active && g.state !== 'hover' && n++);
    return n;
  }

  // dangers right now (a hovering ghost over a locked building is already "done" and counts only a little)
  threatCount() {
    let n = this.pending;
    this.hathodas.forEach((h) => h.active && n++);
    this.ghosts.forEach((g) => g.active && n++);
    return n;
  }

  update(dt) {
    this.hathodas.forEach((h) => h.active && h.update(dt));
    this.ghosts.forEach((g) => g.active && g.update(dt));
    if (!this.running) return;

    this.time += dt;
    const w = this.wave;
    if (this.time < w.duration) {
      this.nextHathoda -= dt;
      if (this.nextHathoda <= 0 && w.hathoda) {
        this.nextHathoda = Phaser.Math.FloatBetween(...w.hathodaEvery);
        this.sendHathoda();
      }
      this.nextTaala -= dt;
      if (this.nextTaala <= 0 && w.taala) {
        this.nextTaala = Phaser.Math.FloatBetween(...w.taalaEvery);
        this.sendTaala();
      }
    } else if (this.activeCount() === 0 || this.time > w.duration + 28) {
      this.running = false;
      this.scene.events.emit('wave-done', w);
    }
  }

  // ---------- Hathoda Dev -> a wall section ----------

  sendHathoda() {
    const lv = this.level;
    const free = this.hathodas.find((h) => !h.active && !h.pending);
    if (!free || this.hathodas.filter((h) => h.active).length + this.pending >= lv.maxHathoda || this.threatCount() >= lv.maxThreats) return;

    // not the section another Hathoda is already hammering (if there is a choice)
    const busy = new Set(this.hathodas.filter((h) => h.active && h.section).map((h) => h.section.id));
    let candidates = this.sections.filter((s) => !busy.has(s.id));
    if (!candidates.length) candidates = this.sections;
    const byId = Object.fromEntries(this.sections.map((s) => [s.id, s]));
    const id = this.brain.chooseTarget(candidates.map((s) => s.id), (name) => byId[name].crackSeconds);
    this.brain.recordAimed('hathoda', id);

    const g = this.world.gate;
    this.scene.events.emit('send', g.x, g.y);
    free.pending = true;
    this.pending++;
    this.scene.time.delayedCall(450, () => {
      free.activate(byId[id]);
      free.pending = false;
      this.pending--;
    });
    if (!this.firstHathoda) {
      this.firstHathoda = true;
      this.scene.events.emit('first-hathoda');
    }
  }

  // ---------- Taala Bhoot -> a building ----------

  sendTaala() {
    const lv = this.level;
    const free = this.ghosts.find((g) => !g.active && !g.pending);
    if (!free || this.ghosts.filter((g) => g.active).length + this.pending >= lv.maxTaala || this.threatCount() >= lv.maxThreats) return;

    // buildings that are free (not locked, no ghost on its way); those WITHOUT a backup first
    const taken = new Set(this.ghosts.filter((g) => g.active && g.building).map((g) => g.building.id));
    let free_ = this.buildings.filter((b) => !b.locked && !taken.has(b.id));
    if (!free_.length) return;
    const unbacked = free_.filter((b) => !b.backedUp);
    if (unbacked.length) free_ = unbacked;
    const byId = Object.fromEntries(this.buildings.map((b) => [b.id, b]));
    const id = this.brain.chooseTarget(free_.map((b) => b.id));
    this.brain.recordAimed('taala', id);

    const g = this.world.gate;
    this.scene.events.emit('send', g.x, g.y);
    free.pending = true;
    this.pending++;
    this.scene.time.delayedCall(450, () => {
      free.activate(byId[id]);
      free.pending = false;
      this.pending--;
    });
    if (!this.firstGhost) {
      this.firstGhost = true;
      this.scene.events.emit('first-ghost');
    }
  }
}
