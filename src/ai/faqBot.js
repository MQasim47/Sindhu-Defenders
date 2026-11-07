import { FAQ, NOT_SURE } from '../data/projectKnowledge.js';
import { describeLearning } from './chatContext.js';

// Engine B of Mithu: an offline question finder. No internet and no AI model needed.
//
// How it works (TF-IDF + cosine similarity):
//   1. Every question/answer pair of the FAQ becomes a "document" made of words.
//   2. A word that appears in only a few documents is important (high IDF). A word that
//      appears in many (like "game") is less important.
//   3. Your question becomes a list of numbers too (a vector).
//   4. The pair whose numbers point in the most similar direction (cosine) wins.
//   5. If even the best one is not similar enough, Mithu says what he can talk about.

const STOP = new Set(
  'a an the is are was were be do does did i you me my we our your it its this that these those of to in on at for with and or but how what who why where when which can could would should will shall about tell explain please mean means into from as by if so than then there here have has had not no yes any some more most very just also'.split(' '),
);
const MATCH_THRESHOLD = 0.2;

// words in lower case, small words removed, a plural "s" removed
export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w && !STOP.has(w))
    .map((w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w));
}

function countWords(words) {
  const counts = new Map();
  words.forEach((w) => counts.set(w, (counts.get(w) || 0) + 1));
  return counts;
}

// ---- build the index once ----
const docs = FAQ.map((entry) => {
  // question words count double, answer words count once
  const words = [...tokenize(entry.q.join(' ')), ...tokenize(entry.q.join(' ')), ...tokenize(entry.a)];
  return { entry, tf: countWords(words) };
});
const docFrequency = new Map();
docs.forEach((d) => d.tf.forEach((_, w) => docFrequency.set(w, (docFrequency.get(w) || 0) + 1)));
const idf = (w) => Math.log((docs.length + 1) / ((docFrequency.get(w) || 0) + 1)) + 1;

function vectorize(tf) {
  const vec = new Map();
  let norm = 0;
  tf.forEach((count, w) => {
    const v = (1 + Math.log(count)) * idf(w);
    vec.set(w, v);
    norm += v * v;
  });
  return { vec, norm: Math.sqrt(norm) || 1 };
}
docs.forEach((d) => Object.assign(d, vectorize(d.tf)));

function cosine(a, b) {
  let dot = 0;
  a.vec.forEach((v, w) => {
    const other = b.vec.get(w);
    if (other) dot += v * other;
  });
  return dot / (a.norm * b.norm);
}

// Returns { text, matched }. snapshot = live game data (for "what has the AI learned").
export function answerFromFaq(question, snapshot) {
  const q = question.toLowerCase();

  // questions about the player's own game use the real numbers
  if (/(learned|learnt|knows?|found).*\b(me|my|dodo)\b|\bmy (weakness|score|stats|mistakes)\b|how am i doing|what is my weakness/.test(q)) {
    return { text: describeLearning(snapshot), matched: true };
  }

  const query = vectorize(countWords(tokenize(question)));
  if (!query.vec.size) return { text: NOT_SURE, matched: false };
  let best = null;
  let bestScore = 0;
  docs.forEach((d) => {
    const score = cosine(query, d);
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  });
  if (best && bestScore >= MATCH_THRESHOLD) return { text: best.entry.a, matched: true };
  return { text: NOT_SURE, matched: false };
}
