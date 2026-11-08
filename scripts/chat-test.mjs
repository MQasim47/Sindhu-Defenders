// Asks Mithu about 40 sample questions in OFFLINE mode (no Ollama) and writes the answers to
// chat-test-results.md, so the answers can be reviewed. Run it with:  npm run test:chat
import { writeFileSync } from 'node:fs';
import { answerFromFaq } from '../src/ai/faqBot.js';
import { findChunks } from '../src/ai/knowledgeSearch.js';

const QUESTIONS = [
  'why javascript',
  'what is zxcvbn',
  'what happens in level 1',
  'why is there a level 2',
  'how does the AI learn',
  'what is TF-IDF',
  'who is Mithu',
  'why Ranikot',
  'what is the weakness formula',
  'why 85% exploit and 15% explore',
  'what is RAG',
  'why a small local model',
  'what is ollama',
  'why phaser',
  'what is vite',
  'what is webgl',
  'why is 1234 a weak password',
  'what does the boss do in round 3',
  'how does the deepfake trick work',
  'what is the secret code word',
  'how does the boss AI learn',
  'what is hathoda dev',
  'what is taala bhoot',
  'how do I back up a building',
  'why a parrot',
  'why ajrak and topi',
  'why no robots',
  'why monsters and not quizzes',
  'what is phishing',
  'what is ransomware',
  'what is a deepfake',
  'safety tips for parents',
  'give me a one minute summary',
  'what will the judges ask',
  'how do stars work',
  'what is the world map',
  'what is cosine similarity',
  'what is localstorage',
  'who made the pictures (gemini)',
  'lvl 2 lesson',
  'what is the capital of france',
];

const lines = ['# Mithu chat test (offline mode)', '', `${QUESTIONS.length} questions. "source" says where the answer came from: faq, chunk (best knowledge chunk) or none.`, ''];
let none = 0;
QUESTIONS.forEach((question, i) => {
  const a = answerFromFaq(question, null);
  if (a.source === 'none') none++;
  const top = findChunks(question, 3).map((c) => `${c.item.title} (${c.score.toFixed(2)})`);
  lines.push(`## ${i + 1}. ${question}`, '', `**Mithu** (${a.source}, score ${a.score.toFixed(2)}): ${a.text}`, '', `_Top chunks for the AI model:_ ${top.join(' | ') || 'none'}`, '');
});
writeFileSync(new URL('../chat-test-results.md', import.meta.url), lines.join('\n'));
console.log(`Wrote chat-test-results.md (${QUESTIONS.length} questions, ${none} without an answer).`);
