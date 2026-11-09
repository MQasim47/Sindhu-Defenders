import { FAQ, NOT_SURE } from '../data/projectKnowledge.js';
import { buildIndex, tokenize } from './retriever.js';
import { findChunks, firstSentences } from './knowledgeSearch.js';
import { describeLearning } from './chatContext.js';
import { findTerms, isListQuestion, answerForTerms } from './termRouter.js';
import { GLOSSARY_LIST } from '../data/knowledge/glossary.js';

// Engine B of Mithu: an offline question finder. No internet and no AI model needed.
//   0. The keyword router (termRouter.js) answers any cyber-security term from its own chunk.
//   1. The FAQ pairs are matched with TF-IDF + cosine similarity (see retriever.js).
//      All the ways to ask a question count double, the answer words count once.
//   2. If the best pair is not similar enough, the best knowledge chunk answers (its first 3 sentences).
//   3. If even that is weak, Mithu says what he can talk about.
const FAQ_THRESHOLD = 0.3;
const CHUNK_THRESHOLD = 0.1;

// every way to ask a question, written as plain words: a question that is exactly one of them wins at once
const exact = new Map();
FAQ.forEach((entry) => entry.q.forEach((q) => exact.set(tokenize(q).join(' '), entry)));

const index = buildIndex(
  FAQ.map((entry) => {
    const q = tokenize(entry.q.join(' '));
    return { item: entry, words: [...q, ...q, ...tokenize(entry.a)] };
  }),
);

// Returns { text, matched, source: 'live' | 'list' | 'term' | 'faq' | 'chunk' | 'none', score }.
// snapshot = live game data (for "what has the AI learned about me").
export function answerFromFaq(question, snapshot) {
  const q = question.toLowerCase();

  // questions about the player's own game use the real numbers
  if (/(learned|learnt|knows?|found).*\b(me|my|dodo)\b|\bmy (weakness|score|stats|mistakes)\b|how am i doing|what is my weakness/.test(q)) {
    return { text: describeLearning(snapshot), matched: true, source: 'live', score: 1 };
  }

  // the glossary comes first: a question with a cyber-security term is answered from that term's chunk
  if (isListQuestion(q)) return { text: GLOSSARY_LIST.text, matched: true, source: 'list', score: 1 };
  const terms = findTerms(q);
  if (terms.length) return { text: answerForTerms(terms), matched: true, source: 'term', score: 1 };

  const same = exact.get(tokenize(question).join(' '));
  if (same) return { text: same.a, matched: true, source: 'faq', score: 1 };

  const best = index.search(question, 1)[0];
  if (best && best.score >= FAQ_THRESHOLD) return { text: best.item.a, matched: true, source: 'faq', score: best.score };

  const chunk = findChunks(question, 1)[0];
  if (chunk && chunk.score >= CHUNK_THRESHOLD) {
    return { text: firstSentences(chunk.item.text, 3), matched: true, source: 'chunk', score: chunk.score };
  }
  return { text: NOT_SURE, matched: false, source: 'none', score: best ? best.score : 0 };
}
