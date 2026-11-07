import './chat.css';
import { askMithu, isOllamaUp, warmUp } from '../../ai/chatEngine.js';
import { MAX_MESSAGES } from '../../data/chatConfig.js';
import { t } from '../../i18n/index.js';

const CHIPS = ['chat.chip1', 'chat.chip2', 'chat.chip3', 'chat.chip4'];

// The "Ask Mithu" chat window. It is made of normal HTML on top of the game, so typing,
// Enter, copy and paste work like in any web page. The answers come from src/ai/chatEngine.js.
// The history is kept in memory only (at most MAX_MESSAGES messages).
export default class ChatPanel {
  constructor(game) {
    this.game = game;
    this.history = []; // { role: 'user' | 'assistant', text }
    this.busy = false;
    this.isOpen = false;
    this.avatarUrl = null;
    this.build();
  }

  // a small picture of Mithu's face (made from the generated Mithu parts)
  makeAvatar() {
    if (this.avatarUrl) return this.avatarUrl;
    const tx = this.game.textures;
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    try {
      const draw = (key, x, y, s = 1.35) => {
        const img = tx.get(key).getSourceImage();
        ctx.drawImage(img, x, y, img.width * s, img.height * s);
      };
      draw('mithu-body', 8, 8, 1.4);
      draw('mithu-cheek', 41, 33, 1.4);
      draw('mithu-eye', 49, 17, 1.4);
      draw('mithu-beak', 64, 24, 1.3);
    } catch (e) {
      // no avatar picture: the round frame stays empty
    }
    this.avatarUrl = canvas.toDataURL();
    return this.avatarUrl;
  }

  build() {
    const root = document.createElement('div');
    root.id = 'mithu-chat';
    root.innerHTML = `
      <div class="mc-card" role="dialog" aria-label="Ask Mithu">
        <div class="mc-head">
          <img class="mc-avatar" alt="Mithu" />
          <div>
            <div class="mc-title"></div>
            <div class="mc-status"><span class="mc-dot"></span><span class="mc-status-text"></span></div>
          </div>
          <div class="mc-spacer"></div>
          <button class="mc-btn mc-clear" type="button"></button>
          <button class="mc-btn mc-close" type="button" aria-label="Close">✕</button>
        </div>
        <div class="mc-messages" aria-live="polite"></div>
        <div class="mc-chips"></div>
        <div class="mc-input-row">
          <input class="mc-input" type="text" maxlength="300" autocomplete="off" />
          <button class="mc-send" type="button"></button>
        </div>
      </div>`;
    document.body.appendChild(root);
    this.root = root;
    this.messagesEl = root.querySelector('.mc-messages');
    this.input = root.querySelector('.mc-input');
    this.sendBtn = root.querySelector('.mc-send');
    this.dot = root.querySelector('.mc-dot');
    this.statusText = root.querySelector('.mc-status-text');
    root.querySelector('.mc-title').textContent = t('chat.title');
    root.querySelector('.mc-clear').textContent = t('chat.clear');
    this.sendBtn.textContent = t('chat.send');
    this.input.placeholder = t('chat.placeholder');

    // chips
    const chips = root.querySelector('.mc-chips');
    CHIPS.forEach((key) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mc-chip';
      b.textContent = t(key);
      b.addEventListener('click', () => this.send(t(key)));
      chips.appendChild(b);
    });

    root.querySelector('.mc-close').addEventListener('click', () => this.close());
    root.querySelector('.mc-clear').addEventListener('click', () => this.clear());
    this.sendBtn.addEventListener('click', () => this.send(this.input.value));
    // click on the dark area outside the card closes the chat
    root.addEventListener('mousedown', (e) => e.target === root && this.close());

    // The game listens to the keyboard on the whole window. Keys typed in the chat must not reach it.
    root.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') this.close();
      else if (e.key === 'Enter' && e.target === this.input) {
        e.preventDefault();
        this.send(this.input.value);
      }
    });
    root.addEventListener('keyup', (e) => e.stopPropagation());
  }

  // ---------- open / close ----------

  // getSnapshot() gives the live game data (see chatContext.js). onClose() is called when it closes.
  open({ getSnapshot, onClose } = {}) {
    if (this.isOpen) return;
    this.isOpen = true;
    this.getSnapshot = getSnapshot || (() => null);
    this.onClose = onClose;
    this.root.querySelector('.mc-avatar').src = this.makeAvatar();
    this.root.classList.add('open');
    if (!this.history.length) this.say(t('chat.hello'));
    this.setStatus(null);
    warmUp();
    isOllamaUp().then((up) => this.isOpen && this.setStatus(up ? 'online' : 'offline'));
    setTimeout(() => this.input.focus(), 60);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.abort) this.abort.abort();
    this.root.classList.remove('open');
    if (this.onClose) this.onClose();
  }

  setStatus(kind) {
    this.dot.className = `mc-dot${kind ? ` ${kind}` : ''}`;
    this.statusText.textContent = kind === 'online' ? t('chat.online') : kind === 'offline' ? t('chat.offline') : t('chat.checking');
  }

  // ---------- messages ----------

  scrollDown() {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  addRow(role, text) {
    const row = document.createElement('div');
    row.className = `mc-row ${role === 'user' ? 'user' : 'mithu'}`;
    if (role !== 'user') {
      const mini = document.createElement('img');
      mini.className = 'mc-mini';
      mini.alt = '';
      mini.src = this.makeAvatar();
      row.appendChild(mini);
    }
    const bubble = document.createElement('div');
    bubble.className = 'mc-bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    this.messagesEl.appendChild(row);
    this.scrollDown();
    return { row, bubble };
  }

  remember(role, text) {
    this.history.push({ role, text });
    while (this.history.length > MAX_MESSAGES) this.history.shift();
  }

  // Mithu says something (no model needed)
  say(text) {
    this.addRow('assistant', text);
    this.remember('assistant', text);
  }

  clear() {
    if (this.abort) this.abort.abort();
    this.history = [];
    this.messagesEl.innerHTML = '';
    this.busy = false;
    this.sendBtn.disabled = false;
    this.say(t('chat.hello'));
  }

  // the "typing..." bubble (three bouncing dots)
  addTyping() {
    const { row, bubble } = this.addRow('assistant', '');
    bubble.innerHTML = '<div class="mc-typing"><i></i><i></i><i></i></div>';
    return { row, bubble };
  }

  async send(raw) {
    const text = (raw || '').trim();
    if (!text || this.busy) return;
    this.input.value = '';
    this.busy = true;
    this.sendBtn.disabled = true;

    this.addRow('user', text);
    this.remember('user', text);
    const typing = this.addTyping();
    this.abort = new AbortController();
    const myAbort = this.abort;
    let streamed = false;

    try {
      const result = await askMithu({
        history: this.history,
        snapshot: this.getSnapshot(),
        signal: myAbort.signal,
        // words arriving from the AI model: show them straight away
        onText: (partial) => {
          streamed = true;
          typing.bubble.textContent = partial;
          this.scrollDown();
        },
      });
      if (myAbort.signal.aborted) return;
      this.setStatus(result.source === 'ollama' ? 'online' : 'offline');
      if (result.source === 'faq') {
        await this.typeOut(typing.bubble, result.text, myAbort.signal);
      } else {
        typing.bubble.textContent = result.text;
      }
      this.remember('assistant', result.text);
    } catch (e) {
      if (myAbort.signal.aborted) return;
      // never show a raw error: Mithu just says something friendly
      typing.bubble.textContent = t('chat.sorry');
      this.remember('assistant', t('chat.sorry'));
    } finally {
      void streamed;
      if (this.abort === myAbort) {
        this.busy = false;
        this.sendBtn.disabled = false;
        if (this.isOpen) this.input.focus();
      }
    }
  }

  // shows the offline answer letter by letter, like typing (after a short "thinking" pause)
  async typeOut(bubble, text, signal) {
    await new Promise((r) => setTimeout(r, 450));
    bubble.textContent = '';
    for (let i = 1; i <= text.length; i++) {
      if (signal.aborted) return;
      bubble.textContent = text.slice(0, i);
      this.scrollDown();
      await new Promise((r) => setTimeout(r, 13));
    }
  }
}

// Opens the shared chat window (made the first time it is needed).
export function openChat(scene, options) {
  const game = scene.game;
  if (!game.chatPanel) game.chatPanel = new ChatPanel(game);
  game.chatPanel.open(options);
}
