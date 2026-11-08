// Level data. Everything that changes the feel of a level is here.
//
// A level is a list of steps, played one after another:
//   intro  - the camera shows the Jadugar, then flies to Dodo
//   prep   - Tayyari: free movement, collect things, get ready
//   wave   - the attacks come (spawn numbers below)
//   replan - the spawning stops, the AI Hacker "thinks" and plans the next wave
export const LEVELS = {
  // ---------- Level 1: Sann Gate (phishing + trojan) ----------
  sann: {
    id: 'sann',
    sceneKey: 'Level',
    nameKey: 'level.sann',
    nextId: 'amri',
    nextNameKey: 'level.amri',
    startCoins: 10,
    safeCoins: 2, // coins a real villager brings
    stealAmount: 3, // coins Behroopia steals
    greetBonus: 1,
    giftBonus: 2, // coins for checking a gift with the lantern
    throwChance: 0.45, // chance that a revealed Behroopia throws a spam blob
    maxThreats: 6, // never more than this many dangers at once (fair for a 12-year-old)
    firstMonsterAt: 6,
    maxVillagers: 8,
    maxMonsters: 4,
    villagerWeights: { chacha: 1, amma: 1, bacha: 1 }, // which real villagers come
    steps: [
      { type: 'intro', duration: 8 },
      { type: 'prep', duration: 15 },
      {
        type: 'wave',
        n: 1,
        duration: 40,
        trojan: false,
        phases: [
          { until: 15, interval: [3.8, 5.0], monsterChance: 0.2, speed: 0.8 },
          { until: 40, interval: [2.8, 3.8], monsterChance: 0.32, speed: 0.95 },
        ],
      },
      { type: 'replan', allowTrojan: true },
      {
        type: 'wave',
        n: 2,
        duration: 55,
        trojan: true,
        phases: [
          { until: 20, interval: [3.0, 4.0], monsterChance: 0.4, speed: 0.95 },
          { until: 55, interval: [2.2, 3.0], monsterChance: 0.5, speed: 1.05 },
        ],
      },
    ],
  },

  // ---------- Level 2: Amri Gate (passwords + backups) ----------
  amri: {
    id: 'amri',
    sceneKey: 'Level2',
    nameKey: 'level.amri',
    nextId: 'miri',
    nextNameKey: 'level.miri',
    startCoins: 10,
    stealAmount: 3, // coins Hathoda Dev steals when he gets in
    drainEvery: 2.6, // seconds between two coins lost to a locked building
    maxThreats: 5, // never more than this many dangers at once
    maxHathoda: 2,
    maxTaala: 2,
    counterKeys: ['hud.stopped', 'hud.damage'], // the two counters of the HUD
    firstPlan: { level2: true, allowTaala: false },
    // the password every wall section starts with (all weak, so the player must improve them)
    startPasswords: { wall_left: 'abc', wall_center: 'password', wall_right: '1234' },
    steps: [
      { type: 'intro', duration: 8 },
      { type: 'prep', duration: 25 },
      {
        type: 'wave',
        n: 1,
        duration: 45,
        hathoda: true,
        taala: false,
        hathodaEvery: [9, 12],
      },
      { type: 'replan', plan: { level2: true, allowTaala: true } },
      {
        type: 'wave',
        n: 2,
        duration: 50,
        hathoda: true,
        taala: true,
        hathodaEvery: [10, 13],
        taalaEvery: [11, 15],
      },
    ],
  },

  // ---------- Boss: Miri Fort (deepfake). The fight itself is in src/scenes/BossScene.js ----------
  miri: {
    id: 'miri',
    sceneKey: 'Boss',
    nameKey: 'level.miri',
    nextId: null,
    nextNameKey: 'level.miri',
  },
};

export const FIRST_LEVEL = 'sann';
export const LEVEL_ORDER = ['sann', 'amri', 'miri'];
