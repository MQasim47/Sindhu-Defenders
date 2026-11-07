import { tEn } from '../i18n/index.js';

// Live facts about the game that Mithu can use when he answers (real numbers, not guesses).
// A "snapshot" is a plain object. It is made from the Level scene while the game runs,
// and saved in the game registry so the title screen can still use the last one.

const BASE_NAMES = ['chacha', 'amma', 'bacha', 'phishing', 'trojan'];
const ALL_NAMES = [...BASE_NAMES, 'wall_left', 'wall_center', 'wall_right', 'building_kutubkhana', 'building_anaaj', 'building_ghar'];
// the names that matter now: the Level 1 ones always, the Level 2 ones once the AI used them
const namesOf = (b) => ALL_NAMES.filter((n) => BASE_NAMES.includes(n) || b.counts[n].faced > 0 || b.counts[n].fails > 0);
const label = (name) => tEn(`brain.names.${name}`);

// Reads HackerBrain.getState() and the score from the Level scene.
export function readGame(level) {
  if (!level || !level.brain) return null;
  const state = level.brain.getState();
  const step = level.director && level.director.step;
  return {
    levelName: tEn(level.levelData.nameKey),
    step: step ? (step.type === 'wave' ? `wave ${step.n}` : step.type) : 'finished',
    stats: { ...level.stats },
    brain: {
      mode: state.mode,
      plans: state.plans,
      weights: { ...state.weights },
      weakness: { ...state.weakness },
      counts: JSON.parse(JSON.stringify(state.stats)),
      // English lines of the AI's log, newest first
      log: state.log.slice(0, 5).map((e) => {
        const vars = { ...e.vars };
        if (vars.name) vars.name = label(vars.name);
        return tEn(e.key, vars);
      }),
    },
  };
}

// Level.js calls this when the game ends or the scene closes.
export function saveSnapshot(game, level) {
  const snap = readGame(level);
  if (snap) game.registry.set('lastGame', snap);
}

// The text added to the system prompt of the AI model.
export function contextToText(snap) {
  if (!snap) return 'LIVE GAME DATA: the player has not played a round yet, so the AI has learned nothing yet.';
  const b = snap.brain;
  const lines = [];
  lines.push(`LIVE GAME DATA (use these real numbers when asked about the player or the AI):`);
  lines.push(`- Level: ${snap.levelName}. Now: ${snap.step}.`);
  lines.push(
    `- Score: caught ${snap.stats.caught}, got in ${snap.stats.sneaked}, gifts opened ${snap.stats.giftsOpened}, gifts checked with lantern ${snap.stats.giftsRevealed}, coins earned ${snap.stats.earned}.`,
  );
  lines.push(`- The AI has made ${b.plans} plan(s). Its last decision was: ${b.mode}.`);
  namesOf(b).forEach((n) => {
    const c = b.counts[n];
    lines.push(`- ${label(n)}: sent ${c.faced} times, player failed ${c.fails} times, weakness score ${b.weakness[n].toFixed(2)}, share in next plan ${Math.round((b.weights[n] || 0) * 100)}%.`);
  });
  if (b.log.length) lines.push(`- What the AI wrote in its log: ${b.log.join(' | ')}`);
  return lines.join('\n');
}

// An answer to "What has the AI learned about me?" built from the real numbers (offline mode).
export function describeLearning(snap) {
  if (!snap) return 'We have not played a round yet, so the AI has not learned anything about you. Play Level 1 and ask me again!';
  const b = snap.brain;
  const failed = namesOf(b).filter((n) => b.counts[n].fails > 0).sort((x, y) => b.weakness[y] - b.weakness[x]);
  const parts = [];
  if (failed.length) {
    const top = failed
      .slice(0, 2)
      .map((n) => `${label(n)} ${b.counts[n].fails} out of ${b.counts[n].faced} times (score ${b.weakness[n].toFixed(2)})`)
      .join(' and ');
    parts.push(`The AI saw you fail against ${top}.`);
  } else {
    parts.push('So far you have not failed against anything, so all weakness scores are low. Keep checking before you trust!');
  }
  const best = namesOf(b).reduce((a, c) => ((b.weights[c] || 0) > (b.weights[a] || 0) ? c : a));
  parts.push(`Its latest plan was to ${b.mode === 'explore' ? 'explore something new' : 'exploit your weak spots'}, with ${label(best)} at ${Math.round((b.weights[best] || 0) * 100)}%.`);
  parts.push(`So far you caught ${snap.stats.caught} and ${snap.stats.sneaked} got in.`);
  return parts.join(' ');
}
