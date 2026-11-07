// The AI Hacker's brain (Jadugar). Small and readable on purpose: students must be able to explain it.
//
// It remembers, for every kind of attack and every disguise:
//   faced = how many times it was sent
//   fails = how many times the player FAILED against it
//           (a Behroopia of that disguise got in, or a Trojan gift was opened)
//
// Weakness score = (fails + 1) / (faced + 2)
//   nothing known yet: (0+1)/(0+2) = 0.5
//   failed 3 times out of 3: (3+1)/(3+2) = 0.8   -> the AI sends more of this
//   never failed, faced 6:  (0+1)/(6+2) = 0.125  -> the AI sends less of this
//
// plan() decides what the NEXT wave looks like:
//   85% of the time it EXPLOITS: weights follow the weakness scores.
//   15% of the time it EXPLORES: weights are random, so it keeps testing new things.
// Whatever plan() decides is stored in "current" and shown in the AI ka Dimagh panel.
// The game uses exactly these numbers (nothing is hidden).

export const DISGUISES = ['chacha', 'amma', 'bacha'];
export const ATTACKS = ['phishing', 'trojan'];
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
    [...DISGUISES, ...ATTACKS].forEach((name) => (this.stats[name] = { faced: 0, fails: 0 }));
    this.log = [];
    this.plans = 0;
    this.current = {
      mode: 'exploit',
      disguiseWeights: { chacha: 1 / 3, amma: 1 / 3, bacha: 1 / 3 },
      attackWeights: { phishing: 1, trojan: 0 },
    };
  }

  // ---------- Remembering ----------

  // A threat was sent. attack = 'phishing' or 'trojan'; disguise only for phishing.
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

  weakness(name) {
    const s = this.stats[name];
    return (s.fails + 1) / (s.faced + 2);
  }

  // ---------- Planning ----------

  // allowTrojan: false in the first wave (the Trojan Ghoda has not appeared yet)
  plan({ allowTrojan = true } = {}) {
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

    const disguiseWeights = pick(DISGUISES);
    let attackWeights = pick(ATTACKS);
    if (!allowTrojan) attackWeights = { phishing: 1, trojan: 0 };

    this.current = { mode: explore ? 'explore' : 'exploit', disguiseWeights, attackWeights };
    this.writeLog(explore, allowTrojan);
    return this.current;
  }

  // The human-readable story of what the AI learned.
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

  // log entry = a text key + values (so the panel can show it in any language)
  addLog(key, vars) {
    this.log.unshift({ key, vars });
    if (this.log.length > LOG_SIZE) this.log.pop();
  }

  // ---------- Reading (for the panel and the report) ----------

  // the item the player is weakest against (null if nothing happened yet)
  biggestWeakness() {
    let best = null;
    [...DISGUISES, ...ATTACKS].forEach((name) => {
      const s = this.stats[name];
      if (s.fails === 0) return;
      if (!best || this.weakness(name) > this.weakness(best)) best = name;
    });
    return best;
  }

  getState() {
    const weights = { ...this.current.disguiseWeights, ...this.current.attackWeights };
    const weakness = {};
    Object.keys(this.stats).forEach((n) => (weakness[n] = this.weakness(n)));
    return {
      mode: this.current.mode,
      plans: this.plans,
      weights, // share of each item in the next plan (disguises add up to 1, attacks add up to 1)
      weakness,
      stats: this.stats,
      log: this.log,
    };
  }

  // developers: press I in the game to see this table in the browser console
  printTable() {
    const rows = {};
    Object.keys(this.stats).forEach((n) => {
      rows[n] = { ...this.stats[n], weakness: +this.weakness(n).toFixed(3), weight: +(this.getState().weights[n] || 0).toFixed(3) };
    });
    console.log(`AI plan #${this.plans}: ${this.current.mode}`);
    console.table(rows);
  }
}
