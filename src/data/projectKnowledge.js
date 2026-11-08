// Everything Mithu knows about the project (English only).
//   CHUNKS - small titled pieces of knowledge (about 150-250 words each). The retriever picks the best
//            3-4 for a question and the AI model (Ollama) gets only those. See src/ai/retriever.js.
//   FAQ    - question/answer pairs for the offline finder (src/ai/faqBot.js).
// The text lives in src/data/knowledge/. Only write facts that are true.
import { CHUNKS_PROJECT } from './knowledge/chunksProject.js';
import { CHUNKS_MONSTERS_AI } from './knowledge/chunksMonstersAi.js';
import { CHUNKS_TECH } from './knowledge/chunksTech.js';

export const CHUNKS = [...CHUNKS_PROJECT, ...CHUNKS_MONSTERS_AI, ...CHUNKS_TECH];
export { FAQ, NOT_SURE } from './knowledge/faq.js';
