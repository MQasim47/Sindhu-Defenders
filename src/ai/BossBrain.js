// The Jadugar's brain in the boss fight. It uses the SAME idea as HackerBrain, only for his four attacks:
//
//   used = how many times he used the attack
//   hits = how many times it really HIT Dodo
//   score = (hits + 1) / (used + 2)      <- the higher, the better the attack works against this player
//
// choose() picks the next attack: 85% of the time it EXPLOITS (the attacks that hit most are
// chosen more often), 15% of the time it EXPLORES (a random attack, to keep testing).
// The brain starts with what HackerBrain learned in Level 1 and Level 2 (seedFrom).

export const BOSS_ATTACKS = ['phishing', 'hathoda', 'trojan', 'deepfake'];
// which attacks exist in which round
export const ROUND_ATTACKS = {
  1: ['phishing', 'hathoda'],
  2: ['phishing', 'hathoda', 'trojan'],
  3: ['phishing', 'hathoda', 'trojan', 'deepfake'],
};
export const EXPLORE_CHANCE = 0.15;

export default class BossBrain {
  constructor(random = Math.random) {
    this.random = random;
    this.stats = {};
    BOSS_ATTACKS.forEach((name) => (this.stats[name] = { used: 0, hits: 0 }));
    this.seeded = []; // attacks that started with knowledge from the earlier levels
    this.focus = null; // the attack the boss likes best right now
    this.mode = 'exploit';
    this.last = null; // the attack used last, and how many times in a row (so it never gets boring)
    this.streak = 0;
  }

  // runStats = HackerBrain stats saved by runMemory: { phishing: { faced, fails }, trojan, hathoda ... }
  // Level 1 phishing -> Phishing Barish, Level 1 trojan (gifts opened) -> Trojan Tohfa,
  // Level 2 hathoda (walls broken) -> Hathoda Lehar.
  seedFrom(runStats = {}) {
    const map = { phishing: 'phishing', trojan: 'trojan', hathoda: 'hathoda' };
    Object.entries(map).forEach(([old, name]) => {
      const s = runStats[old];
      if (!s || !s.faced) return;
      const used = Math.min(s.faced, 6); // old knowledge counts, but not too much
      const hits = Math.min(Math.round((s.fails / s.faced) * used), used);
      this.stats[name] = { used, hits };
      if (hits > 0) this.seeded.push(name);
    });
    this.focus = this.favourite(1);
  }

  score(name) {
    const s = this.stats[name];
    return (s.hits + 1) / (s.used + 2);
  }

  // the attack with the best score among the ones of this round (deepfake is a special trick, kept apart)
  favourite(round) {
    const names = ROUND_ATTACKS[round].filter((n) => n !== 'deepfake');
    return names.reduce((a, b) => (this.score(b) > this.score(a) ? b : a));
  }

  // the next attack. exclude = names that must not be used now (for example on cooldown)
  choose(round, exclude = []) {
    let names = ROUND_ATTACKS[round].filter((n) => !exclude.includes(n));
    // the same attack three times in a row is boring: after two, pick something else
    if (this.streak >= 2 && names.length > 1) names = names.filter((n) => n !== this.last);
    const explore = this.random() < EXPLORE_CHANCE;
    this.mode = explore ? 'explore' : 'exploit';
    // exploit: weight = score squared (as in HackerBrain). explore: random weights.
    const raw = names.map((n) => (explore ? 0.15 + this.random() : this.score(n) ** 2));
    const total = raw.reduce((a, b) => a + b, 0);
    let pick = this.random() * total;
    for (let i = 0; i < names.length; i++) {
      pick -= raw[i];
      if (pick <= 0) return names[i];
    }
    return names[names.length - 1];
  }

  recordUsed(name) {
    this.stats[name].used++;
    this.streak = name === this.last ? this.streak + 1 : 1;
    this.last = name;
  }

  recordHit(name) {
    this.stats[name].hits++;
  }

  // Did his favourite change? Returns the NEW favourite (a name) or null. Call after a hit.
  checkFocus(round) {
    const now = this.favourite(round);
    if (now === this.focus) return null;
    // only switch when the new one is clearly better (a tie never makes him change his mind)
    if (this.score(now) - this.score(this.focus || now) < 0.05) return null;
    this.focus = now;
    return now;
  }

  // the attack that hit Dodo most (by number of hits), for the tip and the report
  topHitter() {
    let best = null;
    BOSS_ATTACKS.forEach((n) => {
      if (this.stats[n].hits > 0 && (!best || this.stats[n].hits > this.stats[best].hits)) best = n;
    });
    return best;
  }
}
