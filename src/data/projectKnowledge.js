// Everything Mithu knows about the project (English only).
//   CHUNKS - small titled pieces of knowledge (100-180 words each). The retriever picks the best
//            3-4 for a question and the AI model (Ollama) gets only those. See src/ai/retriever.js.
//            Every cyber-security term has its OWN chunk (knowledge/glossary.js).
//   FAQ    - question/answer pairs for the offline finder (src/ai/faqBot.js).
// The text lives in src/data/knowledge/. Only write facts that are true.
import { CHUNKS_PROJECT } from './knowledge/chunksProject.js';
import { CHUNKS_MONSTERS_AI } from './knowledge/chunksMonstersAi.js';
import { CHUNKS_TECH } from './knowledge/chunksTech.js';
import { GLOSSARY, GLOSSARY_FAQ, GLOSSARY_LIST } from './knowledge/glossary.js';
import { FAQ_BASE, NOT_SURE } from './knowledge/faq.js';

const GLOSSARY_CHUNKS = GLOSSARY.map((g) => ({ id: `term-${g.id}`, title: `Glossary: ${g.name}`, text: g.text }));

export const CHUNKS = [...CHUNKS_PROJECT, ...CHUNKS_MONSTERS_AI, ...CHUNKS_TECH, ...GLOSSARY_CHUNKS, GLOSSARY_LIST];
export const FAQ = [...FAQ_BASE, ...GLOSSARY_FAQ];
export { NOT_SURE };
