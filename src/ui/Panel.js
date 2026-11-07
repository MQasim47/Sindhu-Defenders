import Button from './Button.js';
import { makeLanguageDropdown } from './LanguageMenu.js';
import { addText, setSource } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';
import { COLORS, CSS, FONT_TITLE } from '../data/colors.js';
import { settings, saveSettings } from '../data/settings.js';

// A pop-up card (how to play, settings). Clicks behind it are blocked.
// All text comes from src/i18n (pass text keys, not words):
//   options: { titleKey, lineKeys: [key], language: true, toggles: [{ labelKey, key }] }
export function openPanel(scene, options) {
  const { titleKey, lineKeys = [], toggles = [], language = false } = options;
  const depth = 500;
  const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x0b0d1a, 0.62).setInteractive().setDepth(depth);

  const w = 700;
  const rows = lineKeys.length + toggles.length + (language ? 1 : 0);
  const h = 230 + rows * 64;
  const cy = 360;
  const card = scene.add.container(640, cy).setDepth(depth + 1);

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

  card.add(
    addText(scene, 0, -h / 2 + 42, titleKey, {
      fontFamily: FONT_TITLE,
      fontSize: '42px',
      fontStyle: 'bold',
      color: CSS.cream,
      stroke: '#10143a',
      strokeThickness: 6,
    }).setOrigin(0.5),
  );

  let y = -h / 2 + 135;
  const rowStyle = { fontFamily: FONT_TITLE, fontSize: '28px', color: CSS.indigo };
  let dropdown = null;
  if (language) {
    card.add(addText(scene, -w / 2 + 50, y, 'settings.language', rowStyle).setOrigin(0, 0.5));
    // the drop-down lives on the screen (not inside the card), so its list opens in the right place
    dropdown = makeLanguageDropdown(scene, 640 + w / 2 - 170, cy + y, depth + 10).setDepth(depth + 2);
    y += 64;
  }
  lineKeys.forEach((key) => {
    card.add(addText(scene, 0, y, key, rowStyle).setOrigin(0.5));
    y += 64;
  });
  toggles.forEach((tg) => {
    card.add(addText(scene, -w / 2 + 50, y, tg.labelKey, rowStyle).setOrigin(0, 0.5));
    card.add(makeToggle(scene, w / 2 - 110, y, tg.key));
    y += 64;
  });

  const closePanel = () => {
    scene.tweens.add({
      targets: [card, dropdown].filter(Boolean),
      scale: 0.7,
      alpha: 0,
      duration: 160,
      ease: 'Cubic.In',
      onComplete: () => {
        card.destroy();
        if (dropdown) dropdown.destroy();
        blocker.destroy();
      },
    });
    scene.tweens.add({ targets: blocker, alpha: 0, duration: 160 });
  };
  card.add(new Button(scene, 0, h / 2 - 56, 'common.close', closePanel, { width: 230, height: 64, fontSize: 28 }));

  card.setScale(0.6).setAlpha(0);
  if (dropdown) dropdown.setAlpha(0);
  scene.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out' });
  if (dropdown) scene.tweens.add({ targets: dropdown, alpha: 1, duration: 260, delay: 120 });
}

// ON/OFF switch for a setting in settings.js
function makeToggle(scene, x, y, key) {
  const box = scene.add.container(x, y);
  const bg = scene.add.graphics();
  const label = addText(scene, 0, 0, () => (settings[key] ? t('settings.on') : t('settings.off')), {
    fontFamily: FONT_TITLE,
    fontSize: '22px',
    fontStyle: 'bold',
    color: '#ffffff',
  }).setOrigin(0.5);
  const redraw = () => {
    const on = !!settings[key];
    bg.clear();
    bg.fillStyle(on ? 0x2e8b57 : 0x7a6a5a, 1);
    bg.fillRoundedRect(-50, -20, 100, 40, 20);
    bg.lineStyle(3, 0x3a1c16, 1);
    bg.strokeRoundedRect(-50, -20, 100, 40, 20);
    setSource(label, label.i18n.source);
  };
  redraw();
  box.add([bg, label]);
  box.setSize(100, 40).setInteractive({ useHandCursor: true });
  box.on('pointerup', () => {
    settings[key] = !settings[key];
    saveSettings();
    redraw();
    scene.tweens.add({ targets: box, scaleX: 1.12, scaleY: 0.9, duration: 90, yoyo: true, ease: 'Sine.Out' });
  });
  return box;
}
