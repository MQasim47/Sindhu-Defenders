// Level and wave data. The AI Hacker in Step 3 will change the numbers in a wave
// (for example the disguise weights) while the game is running.
export const LEVELS = {
  test: {
    name: 'Sann Gate (test wave)',
    duration: 60, // seconds of spawning
    startCoins: 10,
    safeCoins: 2, // coins a real villager brings
    stealAmount: 3, // coins Behroopia steals
    greetBonus: 1,
    throwChance: 0.5, // chance that a revealed Behroopia throws a spam blob
    firstMonsterAt: 7, // seconds: the first Behroopia comes early, so Mithu can teach
    maxVillagers: 8,
    maxMonsters: 4,
    // How often (seconds), how many are monsters and how fast, getting busier.
    phases: [
      { until: 20, interval: [3.8, 5.2], monsterChance: 0.18, speed: 0.8 },
      { until: 42, interval: [2.6, 3.6], monsterChance: 0.32, speed: 1.0 },
      { until: 60, interval: [1.7, 2.6], monsterChance: 0.42, speed: 1.12 },
    ],
    // Which disguise a Behroopia wears. Higher number = more likely.
    disguiseWeights: { chacha: 1, amma: 1, bacha: 1 },
    // Which villager types appear as real villagers.
    villagerWeights: { chacha: 1, amma: 1, bacha: 1 },
  },
};
