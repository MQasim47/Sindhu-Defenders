// The Jadugar's brain in the Face-to-Face Showdown (Level 3). It uses the SAME idea as HackerBrain:
//
//   used  = how many times he threw this attack
//   wrong = how many times the player answered it WRONG or TOO LATE
//   score = (wrong + 1) / (used + 2)      <- the higher, the weaker the player is against it
//
// choose() picks the next attack: 85% of the time it EXPLOITS (the attacks the player gets wrong most
// are chosen more often), 15% of the time it EXPLORES (a random attack, to keep testing).
// The brain starts with what HackerBrain learned in Level 1 and Level 2 (seedFrom).

// attack -> the defence that beats it (1 Lantern, 2 Password Shield, 3 Backup Scroll, 4 Code Word)
export const BOSS_ATTACKS = {
  phishing: 1, // fake letter from a Behroopia
  trojan: 1, // shiny FREE gift
  hammer: 2, // giant hammer = brute-force password attack
  ransom: 3, // padlock chain = ransomware
  deepfake: 4, // Mithu-voice bubble
};
export const ATTACK_IDS = Object.keys(BOSS_ATTACKS);
// which attacks exist in which round (the finale is a special deepfake, see BossScene)
export const ROUND_ATTACKS = {
  1: ['phishing', 'trojan', 'hammer'],
  2: ['phishing', 'trojan', 'hammer', 'ransom'],
  3: ['phishing', 'trojan', 'hammer', 'ransom', 'deepfake'],
};
export const EXPLORE_CHANCE = 0.15;

export default class BossBrain {
  constructor(random = Math.random) {
    this.random = random;
    this.stats = {};
    ATTACK_IDS.forEach((id) => (this.stats[id] = { used: 0, wrong: 0 }));
    this.seeded = []; // attacks that started with knowledge from the earlier levels
    this.mode = 'exploit'; // what the last choice was
    this.last = null; // the attack used last, and how many times in a row (so it never gets boring)
    this.streak = 0;
  }

  // runStats = HackerBrain counts saved by runMemory: { phishing: { faced, fails }, trojan, hathoda, taala ... }
  // Level 1 phishing -> fake letter, Level 1 trojan (gifts opened) -> FREE gift,
  // Level 2 hathoda (walls broken) -> hammer, Level 2 taala (locked without a backup) -> padlock chain.
  seedFrom(runStats = {}) {
    const map = { phishing: 'phishing', trojan: 'trojan', hathoda: 'hammer', taala: 'ransom' };
    Object.entries(map).forEach(([old, id]) => {
      const s = runStats[old];
      if (!s || !s.faced) return;
      const used = Math.min(s.faced, 6); // old knowledge counts, but not too much
      const wrong = Math.min(Math.round((s.fails / s.faced) * used), used);
      this.stats[id] = { used, wrong };
      if (wrong > 0) this.seeded.push(id);
    });
  }

  score(id) {
    const s = this.stats[id];
    return (s.wrong + 1) / (s.used + 2);
  }

  // the next attack. exclude = ids that must not be used now
  choose(round, exclude = []) {
    let ids = ROUND_ATTACKS[round].filter((n) => !exclude.includes(n));
    // the same attack three times in a row is boring: after two, pick something else
    if (this.streak >= 2 && ids.length > 1) ids = ids.filter((n) => n !== this.last);
    const explore = this.random() < EXPLORE_CHANCE;
    this.mode = explore ? 'explore' : 'exploit';
    // exploit: weight = score squared (as in HackerBrain). explore: random weights.
    const raw = ids.map((n) => (explore ? 0.15 + this.random() : this.score(n) ** 2));
    const total = raw.reduce((a, b) => a + b, 0);
    let pick = this.random() * total;
    for (let i = 0; i < ids.length; i++) {
      pick -= raw[i];
      if (pick <= 0) return ids[i];
    }
    return ids[ids.length - 1];
  }

  recordThrown(id) {
    this.stats[id].used++;
    this.streak = id === this.last ? this.streak + 1 : 1;
    this.last = id;
  }

  recordWrong(id) {
    this.stats[id].wrong++;
  }

  // true if he is using a known weakness: the last choice was an exploit and the score is high
  isExploiting(id) {
    return this.mode === 'exploit' && this.score(id) >= 0.6;
  }

  // the attack the player missed most in THIS fight (for the tip and the report)
  worst(fightWrong) {
    let best = null;
    ATTACK_IDS.forEach((id) => {
      if ((fightWrong[id] || 0) > 0 && (!best || fightWrong[id] > fightWrong[best])) best = id;
    });
    return best;
  }
}
