import Button from './Button.js';
import { addText } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';
import { COLORS, CSS, FONT } from '../data/colors.js';
import { playSfx } from '../fx/sound.js';

// The results card at the end of a level: stars, numbers, the "AI Hacker's Report",
// and the buttons. data = {
//   stars, caught, sneaked, giftsOpened, earned,
//   weakness (item name or null), tally: { human, ai },
//   nextNameKey, onRetry, onMenu }
export function openResults(scene, data) {
  const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x0b0d1a, 0.72).setInteractive().setDepth(100);
  const card = scene.add.container(640, 362).setDepth(101);
  const w = 820;
  const h = 676;
  const top = -h / 2;

  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.4);
  g.fillRoundedRect(-w / 2, top + 10, w, h, 34);
  g.fillStyle(0x5a0f1d, 1);
  g.fillRoundedRect(-w / 2 - 5, top - 5, w + 10, h + 10, 36);
  g.fillStyle(COLORS.cream, 1);
  g.fillRoundedRect(-w / 2, top, w, h, 32);
  g.fillStyle(COLORS.indigo, 1);
  g.fillRoundedRect(-w / 2, top, w, 84, { tl: 32, tr: 32, bl: 0, br: 0 });
  g.fillStyle(COLORS.red, 1);
  g.fillRect(-w / 2, top + 78, w, 7);
  // the report box
  g.fillStyle(0xe9dcc0, 1);
  g.fillRoundedRect(-w / 2 + 28, top + 330, w - 56, 214, 22);
  g.lineStyle(3, 0x8e1b2b, 0.7);
  g.strokeRoundedRect(-w / 2 + 28, top + 330, w - 56, 214, 22);
  card.add(g);

  card.add(addText(scene, 0, top + 42, 'results.title', { fontFamily: FONT, fontSize: '50px', fontStyle: '700', color: CSS.cream, stroke: '#10143a', strokeThickness: 8 }).setOrigin(0.5));

  // stars pop in one by one
  for (let i = 0; i < 3; i++) {
    const star = scene.add.image(-110 + i * 110, top + 138, i < data.stars ? 'ui-star' : 'ui-star-off').setScale(0).setAngle(-20);
    card.add(star);
    scene.tweens.add({ targets: star, scale: i === 1 ? 1.35 : 1.1, angle: 0, duration: 420, delay: 500 + i * 300, ease: 'Back.Out' });
  }

  // numbers in two columns
  const rows = [
    ['results.caught', data.caught, 'icon-caught'],
    ['results.sneaked', data.sneaked, 'icon-sneaked'],
    ['results.gifts', data.giftsOpened, 'gift-box'],
    ['results.coins', `+${data.earned}`, 'ui-coin'],
  ];
  rows.forEach(([label, value, icon], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x0 = -w / 2 + 50 + col * 380;
    const y = top + 232 + row * 62;
    const img = scene.add.image(x0 + 22, y, icon);
    img.setScale(icon === 'gift-box' ? 0.55 : 0.8);
    card.add(img);
    card.add(addText(scene, x0 + 54, y, label, { fontFamily: FONT, fontSize: '26px', fontStyle: '600', color: CSS.indigo }).setOrigin(0, 0.5));
    card.add(scene.add.text(x0 + 330, y, String(value), { fontFamily: FONT, fontSize: '38px', fontStyle: '700', color: CSS.red, resolution: 2 }).setOrigin(1, 0.5));
  });

  // AI Hacker's Report: the biggest weakness, one tip, and the Humans vs AI score
  card.add(addText(scene, 0, top + 356, 'results.report', { fontFamily: FONT, fontSize: '30px', fontStyle: '700', color: CSS.red }).setOrigin(0.5));
  const weaknessSource = data.weakness
    ? () => t('results.weakness', { name: t(`brain.names.${data.weakness}`) })
    : () => t('results.noWeakness');
  card.add(addText(scene, 0, top + 400, weaknessSource, { fontFamily: FONT, fontSize: '26px', fontStyle: '600', color: CSS.indigo }).setOrigin(0.5));
  const tipSource = () => (data.weakness ? t(`results.tip.${data.weakness}`) : '');
  card.add(
    addText(scene, 0, top + 452, tipSource, { fontFamily: FONT, fontSize: '23px', fontStyle: '500', color: '#4A3A30', align: 'center', wordWrap: { width: w - 120 } }).setOrigin(0.5),
  );
  card.add(addText(scene, 0, top + 514, () => t('results.tally', { h: data.tally.human, a: data.tally.ai }), { fontFamily: FONT, fontSize: '25px', fontStyle: '700', color: '#2E8B57' }).setOrigin(0.5));

  // buttons
  const by = h / 2 - 66;
  const retry = new Button(scene, -270, by, 'results.retry', data.onRetry, { width: 240, height: 70, fontSize: 28 });
  const next = new Button(scene, 0, by, () => t('results.next', { name: t(data.nextNameKey) }), () => {}, { width: 300, height: 70, fontSize: 22, style: 'locked' });
  next.enabled = false;
  const menu = new Button(scene, 270, by, 'results.menu', data.onMenu, { width: 200, height: 70, fontSize: 28, style: 'indigo' });
  const lock = scene.add.image(-122, by - 4, 'icon-lock').setScale(0.7);
  const soon = addText(scene, 0, by + 44, 'results.locked', { fontFamily: FONT, fontSize: '18px', fontStyle: '600', color: '#8A7A6A' }).setOrigin(0.5);
  card.add([retry, next, menu, lock, soon]);

  card.setScale(0.6).setAlpha(0);
  scene.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 340, ease: 'Back.Out' });
  playSfx(scene, 'sfx-win');
  return [blocker, card];
}
