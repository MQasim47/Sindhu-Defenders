// Settings for the "Ask Mithu" chatbot.
//
// Engine A (main): Ollama on this computer. One time setup:
//     ollama pull qwen2.5:1.5b
// (Ollama listens on http://localhost:11434. The game talks to it through the Vite
//  proxy "/ollama", see vite.config.js, so the browser never needs special permissions.)
//
// Engine B (always works, even offline): a small question-and-answer finder, src/ai/faqBot.js.
export const OLLAMA_MODEL = 'qwen2.5:1.5b';
export const OLLAMA_URL = '/ollama';
export const OLLAMA_CHECK_MS = 2000; // Ollama must answer a quick "are you there?" within 2 seconds
export const OLLAMA_FIRST_TOKEN_MS = 40000; // the first run can be slow while the model loads
export const MAX_MESSAGES = 20; // the chat remembers this many messages (in memory only)
export const HISTORY_FOR_MODEL = 8; // how many of them are sent to the model
