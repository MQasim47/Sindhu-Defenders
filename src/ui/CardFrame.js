import Button from './Button.js';
import { addText } from '../i18n/i18nText.js';
import { COLORS, CSS, FONT_TITLE } from '../data/colors.js';

// The common pop-up card of the game: dark blocker, cream card with a red border, an indigo header
// with a title (a text key), and a "close" button. Clicks behind it are blocked. Esc closes it.
//   const { card, close } = openCard(scene, { w: 760, h: 600, titleKey: 'settings.title', closeKey: 'common.close' });
//   card.add(...)   // content, coordinates are from the centre of the card
export function openCard(scene, { w, h, titleKey, closeKey = 'common.close', depth = 500, y = 360, onClose }) {
  scene.modalOpen = (scene.modalOpen || 0) + 1; // the title screen ignores its own keys while a card is open
  const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x0b0d1a, 0.7).setInteractive().setDepth(depth);
  const card = scene.add.container(640, y).setDepth(depth + 1);
  const g = scene.add.graphics();
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
  card.add(addText(scene, 0, -h / 2 + 42, titleKey, { fontFamily: FONT_TITLE, fontSize: '42px', fontStyle: 'bold', color: CSS.cream, stroke: '#10143a', strokeThickness: 6 }).setOrigin(0.5));

  let closed = false;
  const extra = [];
  const close = () => {
    if (closed) return;
    closed = true;
    scene.modalOpen = Math.max(0, (scene.modalOpen || 1) - 1);
    scene.input.keyboard.off('keydown-ESC', close);
    scene.tweens.add({
      targets: [card, ...extra],
      scale: 0.7,
      alpha: 0,
      duration: 160,
      ease: 'Cubic.In',
      onComplete: () => {
        card.destroy();
        extra.forEach((o) => o.destroy());
        blocker.destroy();
        if (onClose) onClose();
      },
    });
    scene.tweens.add({ targets: blocker, alpha: 0, duration: 160 });
  };
  const button = new Button(scene, 0, h / 2 - 50, closeKey, close, { width: 230, height: 62, fontSize: 28 });
  card.add(button);
  scene.input.keyboard.on('keydown-ESC', close);

  card.setScale(0.6).setAlpha(0);
  scene.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out' });
  // objects that live on the screen (not inside the card) and must close with it: card.attach(obj)
  card.attach = (obj) => extra.push(obj);
  return { card, close, blocker };
}
