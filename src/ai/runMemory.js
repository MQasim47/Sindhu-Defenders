// The AI Hacker's memory for ONE run of the game (Level 1 -> Level 2 -> Boss).
// It is kept in localStorage (inside try/catch), so the boss can use what the AI learned earlier.
//   Level 1 starts a new run (resetRun), every level saves the brain's counts when it ends,
//   the boss reads them (loadRun) and saves what it learned in the fight (saveBoss).
const KEY = 'sindhu-defenders-run';

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { stats: saved.stats || {}, boss: saved.boss || null };
  } catch (e) {
    return { stats: {}, boss: null };
  }
}

function write(run) {
  try {
    localStorage.setItem(KEY, JSON.stringify(run));
  } catch (e) {
    // storage blocked: the boss simply starts without old knowledge
  }
}

export const loadRun = read;

export function resetRun() {
  write({ stats: {}, boss: null });
}

// brain.stats = { name: { faced, fails } }
export function saveBrain(brain) {
  const run = read();
  run.stats = JSON.parse(JSON.stringify(brain.stats));
  write(run);
}

// what the boss learned in the fight: { attacks: { name: { used, hits } }, top }
export function saveBoss(info) {
  const run = read();
  run.boss = info;
  write(run);
}
