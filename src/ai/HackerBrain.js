// The AI Hacker's brain (Jadugar). Small and readable on purpose: students must be able to explain it.
//
// It remembers, for every kind of attack, disguise, wall and building:
//   faced = how many times it was sent / aimed at it
//   fails = how many times the player FAILED against it
//           Level 1: a Behroopia of that disguise got in, or a Trojan gift was opened
//           Level 2: a wall section was broken, or a building was locked without a backup
//
// Weakness score = (fails + 1) / (faced + 2)
//   nothing known yet: (0+1)/(0+2) = 0.5
//   failed 3 times out of 3: (3+1)/(3+2) = 0.8   -> the AI sends more of this
//   never failed, faced 6:  (0+1)/(6+2) = 0.125  -> the AI sends less of this
//
// plan() decides what the NEXT wave looks like:
//   85% of the time it EXPLOITS: weights follow the weakness scores.
//   15% of the time it EXPLORES: weights are random, so it keeps testing new things.
// Whatever plan() decides is stored in "current". The game uses exactly these numbers.

export const DISGUISES = ['chacha', 'amma', 'bacha'];
export const ATTACKS = ['phishing', 'trojan'];
// Level 2
export const WALLS = ['wall_left', 'wall_center', 'wall_right'];
export const BUILDINGS = ['building_kutubkhana', 'building_anaaj', 'building_ghar'];
export const ATTACKS_L2 = ['hathoda', 'taala'];

export const EXPLORE_CHANCE = 0.15;
const LOG_SIZE = 20;

export default class HackerBrain {
  constructor(random = Math.random) {
    this.random = random;
    this.reset();
  }

  // a new game starts with an empty memory
  reset() {
    this.stats = {};
    [...DISGUISES, ...ATTACKS, ...WALLS, ...BUILDINGS, ...ATTACKS_L2].forEach((name) => (this.stats[name] = { faced: 0, fails: 0 }));
    this.log = [];
    this.plans = 0;
    const even = (names) => Object.fromEntries(names.map((n) => [n, 1 / names.length]));
    this.current = {
      mode: 'exploit',
      disguiseWeights: even(DISGUISES),
      attackWeights: { phishing: 1, trojan: 0 },
      wallWeights: even(WALLS),
      buildingWeights: even(BUILDINGS),
      attackWeights2: { hathoda: 1, taala: 0 },
    };
  }

  // ---------- Remembering ----------

  // Starts from the counts of an earlier level of the same run (see runMemory.js).
  loadStats(saved = {}) {
    Object.keys(this.stats).forEach((name) => {
      const old = saved[name];
      if (old) this.stats[name] = { faced: old.faced || 0, fails: old.fails || 0 };
    });
  }

  // A threat was sent. attack = 'phishing' or 'trojan' (disguise only for phishing).
  recordSent(attack, disguise) {
    this.stats[attack].faced++;
    if (disguise) this.stats[disguise].faced++;
  }

  // The player failed against it.
  recordFail(attack, disguise) {
    this.stats[attack].fails++;
    if (disguise) this.stats[disguise].fails++;
    this.addLog('brain.log.noted', { name: disguise || attack });
  }

  // Level 2: the AI aimed at a wall section or a building (item), using an attack ('hathoda' / 'taala')
  recordAimed(attack, item) {
    this.stats[attack].faced++;
    this.stats[item].faced++;
  }

  // Level 2: the player failed (the wall broke / the building was locked without a backup)
  recordBroke(attack, item) {
    this.stats[attack].fails++;
    this.stats[item].fails++;
    this.addLog(item.startsWith('wall') ? 'brain.log.wallBroke' : 'brain.log.noBackup', { name: item });
  }

  weakness(name) {
    const s = this.stats[name];
    return (s.fails + 1) / (s.faced + 2);
  }

  // ---------- Planning ----------

  // opts: allowTrojan (Level 1), or level2: true with allowTaala
  plan({ allowTrojan = true, level2 = false, allowTaala = false } = {}) {
    this.plans++;
    const explore = this.random() < EXPLORE_CHANCE;
    const pick = (names) => {
      // exploit: stronger weight for the weak spots (score squared). explore: random numbers.
      const raw = names.map((n) => (explore ? 0.15 + this.random() : this.weakness(n) ** 2));
      const total = raw.reduce((a, b) => a + b, 0);
      const weights = {};
      names.forEach((n, i) => (weights[n] = raw[i] / total));
      return weights;
    };

    const next = { mode: explore ? 'explore' : 'exploit' };
    next.disguiseWeights = pick(DISGUISES);
    next.attackWeights = allowTrojan ? pick(ATTACKS) : { phishing: 1, trojan: 0 };
    next.wallWeights = pick(WALLS);
    next.buildingWeights = pick(BUILDINGS);
    next.attackWeights2 = allowTaala ? pick(ATTACKS_L2) : { hathoda: 1, taala: 0 };
    this.current = next;

    if (level2) this.writeLog2(explore, allowTaala);
    else this.writeLog(explore, allowTrojan);
    return this.current;
  }

  // The human-readable story of what the AI learned (Level 1).
  writeLog(explore, allowTrojan) {
    if (explore) {
      const w = this.current.disguiseWeights;
      const name = DISGUISES.reduce((a, b) => (w[a] >= w[b] ? a : b));
      this.addLog('brain.log.explore', { name });
      return;
    }
    const top = DISGUISES.reduce((a, b) => (this.weakness(a) >= this.weakness(b) ? a : b));
    if (this.stats[top].fails > 0) {
      this.addLog('brain.log.missed', { name: top, n: this.stats[top].fails });
    } else {
      this.addLog('brain.log.learning', {});
    }
    if (allowTrojan && this.stats.trojan.fails > 0) {
      this.addLog('brain.log.gifts', { n: this.stats.trojan.fails });
    }
  }

  // The story for Level 2 (walls and buildings).
  writeLog2(explore, allowTaala) {
    if (explore) {
      this.addLog('brain.log.explore2', {});
      return;
    }
    const topWall = WALLS.reduce((a, b) => (this.weakness(a) >= this.weakness(b) ? a : b));
    if (this.stats[topWall].fails > 0) this.addLog('brain.log.wallMissed', { name: topWall, n: this.stats[topWall].fails });
    else this.addLog('brain.log.learning', {});
    if (allowTaala) {
      const topBuilding = BUILDINGS.reduce((a, b) => (this.weakness(a) >= this.weakness(b) ? a : b));
      if (this.stats[topBuilding].fails > 0) this.addLog('brain.log.noBackupMissed', { name: topBuilding, n: this.stats[topBuilding].fails });
    }
  }

  // log entry = a text key + values (so the panel can show it in any language)
  addLog(key, vars) {
    this.log.unshift({ key, vars });
    if (this.log.length > LOG_SIZE) this.log.pop();
  }

  // ---------- Choosing a target (Level 2) ----------

  // Which item of a group (walls or buildings) is attacked next?
  //   exploit: the item with the highest weakness score (a tie is decided by tieBreak: smaller is chosen first)
  //   explore: a random item
  // items = the names that can be chosen. tieBreak(name) = a number (optional).
  chooseTarget(items, tieBreak = () => 0) {
    if (items.length === 1) return items[0];
    if (this.current.mode === 'explore') return items[Math.floor(this.random() * items.length)];
    return items.reduce((best, n) => {
      const diff = this.weakness(n) - this.weakness(best);
      if (diff > 1e-9) return n;
      if (diff < -1e-9) return best;
      return tieBreak(n) < tieBreak(best) ? n : best;
    });
  }

  // ---------- Reading (for the chat and the report) ----------

  // the item the player is weakest against (null if nothing happened yet)
  biggestWeakness() {
    let best = null;
    Object.keys(this.stats).forEach((name) => {
      const s = this.stats[name];
      if (s.fails === 0) return;
      // 'hathoda' and 'taala' are attack types, not weak spots: skip them
      if (ATTACKS_L2.includes(name)) return;
      if (!best || this.weakness(name) > this.weakness(best)) best = name;
    });
    return best;
  }

  getState() {
    const c = this.current;
    const weights = { ...c.disguiseWeights, ...c.attackWeights, ...c.wallWeights, ...c.buildingWeights, ...c.attackWeights2 };
    const weakness = {};
    Object.keys(this.stats).forEach((n) => (weakness[n] = this.weakness(n)));
    return {
      mode: c.mode,
      plans: this.plans,
      weights, // share of each item in the next plan
      weakness,
      stats: this.stats,
      log: this.log,
    };
  }

  // developers: press I in the game to see this table in the browser console
  printTable() {
    const rows = {};
    const weights = this.getState().weights;
    Object.keys(this.stats).forEach((n) => {
      rows[n] = { ...this.stats[n], weakness: +this.weakness(n).toFixed(3), weight: +(weights[n] || 0).toFixed(3) };
    });
    console.log(`AI plan #${this.plans}: ${this.current.mode}`);
    console.table(rows);
  }
}
