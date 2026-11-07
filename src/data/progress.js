// Saved progress: stars for each level, and the "Humans vs AI Hacker" score.
// Stored in localStorage (inside try/catch, so a blocked storage never breaks the game).
const KEY = 'sindhu-defenders-progress';

const data = { stars: {}, tally: { human: 0, ai: 0 } };

try {
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  if (saved.stars) data.stars = saved.stars;
  if (saved.tally) data.tally = { human: saved.tally.human || 0, ai: saved.tally.ai || 0 };
} catch (e) {
  // defaults are fine
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
}

export const progress = data;

export function getStars(levelId) {
  return data.stars[levelId] || 0;
}

// Keeps the best star count. Also counts one point for the winner of this game:
// the player (2 or 3 stars) or the AI Hacker (1 star).
export function saveResult(levelId, stars) {
  if (stars > getStars(levelId)) data.stars[levelId] = stars;
  if (stars >= 2) data.tally.human++;
  else data.tally.ai++;
  save();
  return data.tally;
}
