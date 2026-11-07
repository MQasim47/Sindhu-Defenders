import Button from './Button.js';
import { addText } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';
import { LEVELS, LEVEL_ORDER } from '../data/levels.js';
import { getStars } from '../data/progress.js';
import { COLORS, CSS, FONT } from '../data/colors.js';
import { playSfx } from '../fx/sound.js';

// A level is open when it is the first one, or the one before it was finished with at least 1 star.
export function isLevelOpen(id) {
  const i = LEVEL_ORDER.indexOf(id);
  return i <= 0 || getStars(LEVEL_ORDER[i - 1]) >= 1;
}

// A simple level chooser (until the World Map exists): one card per level with its stars.
// onPick(sceneKey) is called when an open level is chosen.
export function openLevelSelect(scene, onPick) {
  const depth = 500;
  const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x0b0d1a, 0.7).setInteractive().setDepth(depth);
  const card = scene.add.container(640, 360).setDepth(depth + 1);
  const w = 820;
  const h = 600;

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
  card.add(addText(scene, 0, -h / 2 + 42, 'levels.title', { fontFamily: FONT, fontSize: '42px', fontStyle: '700', color: CSS.cream, stroke: '#10143a', strokeThickness: 6 }).setOrigin(0.5));

  LEVEL_ORDER.forEach((id, i) => {
    const level = LEVELS[id];
    const open = isLevelOpen(id);
    const x = (i - (LEVEL_ORDER.length - 1) / 2) * 370;
    const c = scene.add.container(x, 12);

    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.3);
    bg.fillRoundedRect(-160, -150 + 8, 320, 330, 24);
    bg.fillStyle(open ? 0x8e1b2b : 0x7a7280, 1);
    bg.fillRoundedRect(-160, -150, 320, 330, 24);
    bg.fillStyle(open ? 0xf3e9d2 : 0xd9d2dc, 1);
    bg.fillRoundedRect(-150, -140, 300, 310, 18);
    bg.fillStyle(open ? 0x1c2457 : 0x8a8294, 1);
    bg.fillCircle(0, -78, 44);
    bg.lineStyle(4, 0xe8b84a, 1);
    bg.strokeCircle(0, -78, 44);
    c.add(bg);
    c.add(scene.add.text(0, -80, String(i + 1), { fontFamily: FONT, fontSize: '54px', fontStyle: '700', color: '#F3E9D2', resolution: 2 }).setOrigin(0.5));
    c.add(addText(scene, 0, -6, level.nameKey, { fontFamily: FONT, fontSize: '32px', fontStyle: '700', color: open ? CSS.indigo : '#5A5262' }).setOrigin(0.5));

    const stars = getStars(id);
    for (let s = 0; s < 3; s++) {
      c.add(scene.add.image(-58 + s * 58, 62, s < stars ? 'ui-star' : 'ui-star-off').setScale(0.62));
    }
    if (!open) {
      const prev = LEVELS[LEVEL_ORDER[i - 1]];
      c.add(scene.add.image(0, 128, 'icon-lock').setScale(0.6));
      c.add(
        addText(scene, 0, 160, () => t('levels.lock', { name: t(prev.nameKey) }), { fontFamily: FONT, fontSize: '18px', fontStyle: '600', color: '#5A5262', align: 'center', wordWrap: { width: 270 } }).setOrigin(0.5),
      );
    }
    c.setSize(320, 330);
    if (open) {
      c.setInteractive({ useHandCursor: true });
      c.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.05, duration: 120, ease: 'Back.Out' }));
      c.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 120 }));
      c.on('pointerup', () => {
        playSfx(scene, 'sfx-click');
        onPick(level.sceneKey);
      });
    }
    card.add(c);
  });

  const close = () => {
    scene.tweens.add({ targets: card, scale: 0.7, alpha: 0, duration: 160, ease: 'Cubic.In', onComplete: () => {
      card.destroy();
      blocker.destroy();
    } });
    scene.tweens.add({ targets: blocker, alpha: 0, duration: 160 });
  };
  card.add(new Button(scene, 0, h / 2 - 44, 'common.close', close, { width: 220, height: 60, fontSize: 26 }));

  card.setScale(0.6).setAlpha(0);
  scene.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out' });
}
