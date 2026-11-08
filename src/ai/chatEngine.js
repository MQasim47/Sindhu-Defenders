import { findChunks, chunksToText } from './knowledgeSearch.js';
import { OLLAMA_MODEL, OLLAMA_URL, OLLAMA_CHECK_MS, OLLAMA_FIRST_TOKEN_MS, HISTORY_FOR_MODEL, OLLAMA_TEMPERATURE, OLLAMA_NUM_CTX } from '../data/chatConfig.js';
import { contextToText } from './chatContext.js';
import { answerFromFaq } from './faqBot.js';

// The brain of the "Ask Mithu" chat. Two engines:
//   A) Ollama (a small AI model that runs on this computer), streamed word by word
//   B) the offline question finder in faqBot.js
// If Ollama is not reachable (or fails), B answers. The player never sees a raw error.

// Kept short on purpose: a small model stays focused when the prompt is short.
const PERSONA = `You are Mithu, a friendly green parrot guide in the game Sindhu Defenders.
- Answer only about this project (game, story, levels, monsters, AI, tools) and cyber safety. For anything else, politely bring the talk back to the project.
- Simple English for a 12-year-old. At most 6 short sentences.
- Give real details (names, numbers, reasons) from the KNOWLEDGE below. Never invent facts. If it is not there, say you are not sure.
- When useful, end with one short follow-up suggestion like "Want to know how the AI learns?".`;
const MAX_SENTENCES = 6;
const CHUNKS_FOR_MODEL = 4;

// The question used to find knowledge. A very short follow-up ("why?") borrows the question before it.
function retrievalQuery(history) {
  const users = history.filter((m) => m.role === 'user').map((m) => m.text);
  const last = users[users.length - 1] || '';
  if (last.split(/\s+/).length < 4 && users.length > 1) return `${users[users.length - 2]} ${last}`;
  return last;
}

let lastCheck = { time: 0, ok: false };

// Is Ollama there? (asks for its model list, must answer within 2 seconds)
export async function isOllamaUp() {
  const age = Date.now() - lastCheck.time;
  if (lastCheck.time && age < (lastCheck.ok ? 10000 : 4000)) return lastCheck.ok;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_CHECK_MS);
  let ok = false;
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    const data = res.ok ? await res.json() : null;
    ok = !!(data && Array.isArray(data.models));
  } catch (e) {
    ok = false;
  }
  clearTimeout(timer);
  lastCheck = { time: Date.now(), ok };
  return ok;
}

// Asks Ollama to load the model now, so the first answer is faster. Never throws.
export function warmUp() {
  isOllamaUp().then((up) => {
    if (!up) return;
    fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, keep_alive: '10m' }),
    }).catch(() => {});
  });
}

// keep the answer short: at most 6 sentences
function shorten(text) {
  const sentences = text.trim().split(/(?<=[.!?])\s+/);
  return sentences.slice(0, MAX_SENTENCES).join(' ');
}

// Streams the answer from Ollama. onText(fullTextSoFar) is called while words arrive.
async function askOllama(history, snapshot, onText, signal) {
  // RAG: only the best chunks for THIS question go to the model, plus the live game data
  const found = findChunks(retrievalQuery(history), CHUNKS_FOR_MODEL);
  const messages = [
    { role: 'system', content: `${PERSONA}\n\nKNOWLEDGE:\n${chunksToText(found)}\n\n${contextToText(snapshot)}` },
    ...history.slice(-HISTORY_FOR_MODEL).map((m) => ({ role: m.role, content: m.text.slice(0, 600) })),
  ];

  const controller = new AbortController();
  const stop = () => controller.abort();
  if (signal) signal.addEventListener('abort', stop);
  // the first word must arrive in a reasonable time (the model may need to load)
  const firstWordTimer = setTimeout(stop, OLLAMA_FIRST_TOKEN_MS);

  let text = '';
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: true,
        keep_alive: '10m',
        options: { temperature: OLLAMA_TEMPERATURE, num_ctx: OLLAMA_NUM_CTX, num_predict: 320 },
      }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) throw new Error('ollama error');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        const part = JSON.parse(line);
        if (part.error) throw new Error(part.error);
        if (part.message && part.message.content) {
          clearTimeout(firstWordTimer);
          text += part.message.content;
          onText(shorten(text));
        }
      }
    }
  } finally {
    clearTimeout(firstWordTimer);
    if (signal) signal.removeEventListener('abort', stop);
  }
  if (!text.trim()) throw new Error('empty answer');
  return shorten(text);
}

// Main function. history = [{ role: 'user' | 'assistant', text }], the last one is the question.
// Returns { source: 'ollama' | 'faq', text, matched }.
export async function askMithu({ history, snapshot, onText, signal }) {
  const question = history[history.length - 1].text;

  if (await isOllamaUp()) {
    try {
      const text = await askOllama(history, snapshot, onText, signal);
      return { source: 'ollama', text, matched: true };
    } catch (e) {
      if (signal && signal.aborted) throw e;
      lastCheck = { time: Date.now(), ok: false }; // use the offline finder for a while
    }
  }
  const answer = answerFromFaq(question, snapshot);
  return { source: 'faq', text: answer.text, matched: answer.matched };
}
