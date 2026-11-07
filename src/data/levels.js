// Level data. Level 1 = Sann Gate. Everything that changes the feel of a level is here.
//
// A level is a list of steps, played one after another:
//   intro  - the camera shows the Jadugar, then flies to Dodo
//   prep   - Tayyari: free movement and short hints
//   wave   - monsters come through the gate (spawn numbers below)
//   replan - the spawning stops, the AI Hacker "thinks" and plans the next wave
export const LEVELS = {
  sann: {
    id: 'sann',
    nameKey: 'level.sann',
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
        duration: 45,
        trojan: true,
        phases: [
          { until: 15, interval: [3.2, 4.2], monsterChance: 0.34, speed: 0.95 },
          { until: 45, interval: [2.4, 3.4], monsterChance: 0.42, speed: 1.0 },
        ],
      },
      { type: 'replan', allowTrojan: true },
      {
        type: 'wave',
        n: 3,
        duration: 45,
        trojan: true,
        phases: [
          { until: 15, interval: [2.4, 3.2], monsterChance: 0.42, speed: 1.0 },
          { until: 45, interval: [1.8, 2.6], monsterChance: 0.5, speed: 1.1 },
        ],
      },
    ],
  },
};

export const FIRST_LEVEL = 'sann';
