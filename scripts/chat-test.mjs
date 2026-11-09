// Tests Mithu in OFFLINE mode (no Ollama) and writes the answers to chat-test-results.md.
//   1. EVERY cyber-security term asked 3 different ways: the answer must contain the term's key words (pass/fail)
//   2. the list question: the answer must name every term
//   3. about 40 sample questions about the project (for a human to read)
// Run it with:  npm run test:chat       (exit code 1 if a check fails)
import { writeFileSync } from 'node:fs';
import { answerFromFaq } from '../src/ai/faqBot.js';
import { findChunks } from '../src/ai/knowledgeSearch.js';
import { findTerms } from '../src/ai/termRouter.js';
import { GLOSSARY } from '../src/data/knowledge/glossary.js';

const SAMPLE = [
  'why javascript', 'what is zxcvbn', 'what happens in level 1', 'why is there a level 2', 'how does the AI learn', 'who is Mithu',
  'why Ranikot', 'what is the weakness formula', 'why 85% exploit and 15% explore', 'why a small local model', 'what is ollama',
  'why phaser', 'what is vite', 'what is webgl', 'why is 1234 a weak password', 'what happens in level 3', 'how does the deepfake trick work',
  'what is the secret code word', 'how does the boss AI learn', 'what is hathoda dev', 'what is taala bhoot', 'how do I back up a building',
  'why a parrot', 'why ajrak and topi', 'why no robots', 'why monsters and not quizzes', 'safety tips for parents',
  'give me a one minute summary', 'what will the judges ask', 'how do stars work', 'what is the world map', 'what is localstorage',
  'who made the pictures (gemini)', 'what do the buttons 1 2 3 4 do', 'how many levels are there', 'what happens if I lose the boss fight',
  'what is cosine similarity', 'what is the capital of france',
];

// 3 ways to ask about each term
const ASK = {
  phishing: ['what is phishing', 'somebody sent me a fake link, what should I do', 'how do scam messages trick people'],
  password: ['what is a strong password', 'how long should my passwords be', 'why is 1234 a weak password'],
  bruteforce: ['what is brute force', 'how do hackers guess passwords', 'who is hathoda dev'],
  malware: ['what is malware', 'what does malicious software do', 'tell me about spyware'],
  virus: ['what is a virus', 'how does a computer virus spread', 'explain worms and viruses'],
  trojan: ['what is a trojan', 'why are free gifts dangerous', 'what is the wooden horse'],
  ransomware: ['what is ransomware', 'my files are locked and they want money', 'what is the lock ghost taala bhoot'],
  backup: ['what is a backup', 'how do I restore my files', 'how do I back up a building'],
  firewall: ['what is a firewall', 'what does the wall of ranikot mean', 'how does a fire wall work'],
  otp: ['what is an OTP', 'someone asks for the code on my phone', 'should I share a one time password'],
  '2fa': ['what is 2FA', 'explain two factor authentication', 'what is two-step verification'],
  deepfake: ['what is a deepfake', 'can AI make fake videos of me', 'explain deep fakes'],
  voiceclone: ['what is a voice clone', 'can scammers copy my voice', 'what is the fake voice of mithu'],
  codeword: ['what is a code word', 'why do we pick mango or camel', 'what is the secret word for family'],
  hacker: ['who is a hacker', 'what is a white hat', 'tell me about hacking'],
  ai: ['what is AI', 'what is artificial intelligence', 'what is machine learning'],
  tfidf: ['what is TF-IDF', 'explain term frequency', 'how does tfidf work'],
  llm: ['what is an LLM', 'what is a large language model', 'what is qwen'],
  rag: ['what is RAG', 'explain retrieval augmented generation', 'how does rag work'],
};

const lines = ['# Mithu chat test (offline mode)', ''];
let pass = 0;
let fail = 0;

// ---- the glossary ----
lines.push('## Glossary check (every term asked 3 ways)', '', '| Term | Question | Result | Answer starts with |', '|---|---|---|---|');
GLOSSARY.forEach((term) => {
  const questions = ASK[term.id];
  if (!questions || questions.length < 3) {
    fail++;
    lines.push(`| ${term.name} | (no 3 questions in the test!) | FAIL | |`);
    return;
  }
  questions.forEach((question) => {
    const a = answerFromFaq(question, null);
    const text = a.text.toLowerCase();
    const missing = term.check.filter((w) => !text.includes(w.toLowerCase()));
    const first = findTerms(question)[0];
    const ok = missing.length === 0 && a.source === 'term' && first && first.id === term.id;
    if (ok) pass++;
    else fail++;
    lines.push(`| ${term.name} | ${question} | ${ok ? 'PASS' : `FAIL (missing: ${missing.join(', ') || 'wrong chunk'})`} | ${a.text.slice(0, 70).replace(/\|/g, '/')}... |`);
  });
});
const list = answerFromFaq('which cyber security terms are used in this game?', null);
const missingTerms = GLOSSARY.filter((g) => !list.text.includes(g.name));
const listOk = missingTerms.length === 0 && list.source === 'list';
if (listOk) pass++;
else fail++;
lines.push('', `**List question:** ${listOk ? `PASS (all ${GLOSSARY.length} terms listed)` : `FAIL, missing: ${missingTerms.map((g) => g.name).join(', ')}`}`, '');

// ---- the sample questions ----
lines.push('## Sample questions', '', 'source: term (glossary), list, faq, chunk (best knowledge chunk) or none.', '');
let none = 0;
SAMPLE.forEach((question, i) => {
  const a = answerFromFaq(question, null);
  if (a.source === 'none') none++;
  const top = findChunks(question, 3).map((c) => `${c.item.title} (${c.score.toFixed(2)})`);
  lines.push(`### ${i + 1}. ${question}`, '', `**Mithu** (${a.source}, score ${a.score.toFixed(2)}): ${a.text}`, '', `_Top chunks for the AI model:_ ${top.join(' | ') || 'none'}`, '');
});

const summary = `Glossary checks: ${pass} passed, ${fail} failed. Sample questions: ${SAMPLE.length}, ${none} without an answer.`;
lines.splice(2, 0, `**${summary}**`, '');
writeFileSync(new URL('../chat-test-results.md', import.meta.url), lines.join('\n'));
console.log(summary);
if (fail) process.exit(1);
