import Button from './Button.js';
import { openChat } from './chat/ChatPanel.js';
import { readGame } from '../ai/chatContext.js';
import { addText } from '../i18n/i18nText.js';
import { COLORS, CSS, FONT } from '../data/colors.js';

// The pause menu (Esc): Resume, Ask Mithu, Quit to menu. The Level scene is paused while it is open.
// It lives in the UI scene, which keeps running while the Level is paused.
export default class PauseMenu {
  constructor(uiScene, level, onQuit) {
    this.ui = uiScene;
    this.level = level;
    this.onQuit = onQuit;
    this.items = [];
    this.isOpen = false;
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    const s = this.ui;
    this.level.scene.pause();

    const blocker = s.add.rectangle(640, 360, 1280, 720, 0x0b0d1a, 0.7).setInteractive().setDepth(300);
    const card = s.add.container(640, 360).setDepth(301);
    const w = 520;
    const h = 470;
    const g = s.add.graphics();
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(-w / 2, -h / 2 + 10, w, h, 30);
    g.fillStyle(0x5a0f1d, 1);
    g.fillRoundedRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 32);
    g.fillStyle(COLORS.cream, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 28);
    g.fillStyle(COLORS.indigo, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, 84, { tl: 28, tr: 28, bl: 0, br: 0 });
    g.fillStyle(COLORS.red, 1);
    g.fillRect(-w / 2, -h / 2 + 78, w, 6);
    card.add(g);
    card.add(addText(s, 0, -h / 2 + 42, 'pause.title', { fontFamily: FONT, fontSize: '46px', fontStyle: '700', color: CSS.cream, stroke: '#10143a', strokeThickness: 7 }).setOrigin(0.5));

    card.add(new Button(s, 0, -40, 'pause.resume', () => this.close(), { width: 340, height: 78, fontSize: 36, pulse: true }));
    card.add(
      new Button(s, 0, 68, 'pause.askMithu', () => this.askMithu(), { width: 340, height: 70, fontSize: 30, style: 'indigo' }),
    );
    card.add(new Button(s, 0, 166, 'pause.quit', () => this.quit(), { width: 340, height: 64, fontSize: 26, style: 'locked' }));

    card.setScale(0.7).setAlpha(0);
    s.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 220, ease: 'Back.Out' });
    this.items = [blocker, card];
  }

  askMithu() {
    openChat(this.ui, { getSnapshot: () => readGame(this.level) });
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.items.forEach((o) => o.destroy());
    this.items = [];
    this.level.scene.resume();
    // keys that were held when the game paused could be stuck: reset them
    this.level.input.keyboard.resetKeys();
  }

  quit() {
    this.isOpen = false;
    this.items.forEach((o) => o.destroy());
    this.items = [];
    this.onQuit();
  }
}
