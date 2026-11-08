import { CHUNKS } from '../data/projectKnowledge.js';
import { buildIndex, tokenize } from './retriever.js';

// The knowledge chunks as a searchable index. The title counts three times (it names the topic).
const index = buildIndex(
  CHUNKS.map((chunk) => {
    const title = tokenize(chunk.title);
    return { item: chunk, words: [...title, ...title, ...title, ...tokenize(chunk.text)] };
  }),
);

// The best chunks for a question: [{ item: chunk, score }]
export function findChunks(question, k = 3) {
  return index.search(question, k);
}

// First sentences of a chunk (for the offline answer when no FAQ pair fits)
export function firstSentences(text, n = 3) {
  return text.trim().split(/(?<=[.!?])\s+/).slice(0, n).join(' ');
}

// The chunks as text for the system prompt, limited to about maxWords words
export function chunksToText(found, maxWords = 750) {
  const parts = [];
  let words = 0;
  for (const { item } of found) {
    const w = item.text.split(/\s+/).length;
    if (parts.length && words + w > maxWords) break;
    parts.push(`[${item.title}]\n${item.text}`);
    words += w;
  }
  return parts.join('\n\n');
}
