import { openCard } from './CardFrame.js';
import { addText } from '../i18n/i18nText.js';
import { CSS, FONT } from '../data/colors.js';
import { CREDITS } from '../data/credits.js';

// The Credits screen. The names and the tools come from src/data/credits.js.
export function openCredits(scene) {
  const w = 1000;
  const h = 640;
  const { card, close } = openCard(scene, { w, h, titleKey: 'credits.title', y: 366 });
  const head = { fontFamily: FONT, fontSize: '26px', fontStyle: '700', color: CSS.red };
  const line = { fontFamily: FONT, fontSize: '24px', fontStyle: '600', color: CSS.indigo };
  const small = { fontFamily: FONT, fontSize: '19px', fontStyle: '500', color: '#5A4A40' };
  const top = -h / 2 + 118;

  card.add(addText(scene, 0, top, 'credits.competition', { ...small, fontSize: '21px', fontStyle: '600' }).setOrigin(0.5));
  // left: school, teacher, team
  const left = -w / 2 + 50;
  card.add(addText(scene, left, top + 48, 'credits.school', head).setOrigin(0, 0.5));
  card.add(scene.add.text(left, top + 82, CREDITS.school, { ...line, resolution: 2 }).setOrigin(0, 0.5));
  card.add(addText(scene, left, top + 134, 'credits.teacher', head).setOrigin(0, 0.5));
  card.add(scene.add.text(left, top + 168, CREDITS.teacher, { ...line, resolution: 2 }).setOrigin(0, 0.5));
  card.add(addText(scene, left, top + 220, 'credits.team', head).setOrigin(0, 0.5));
  CREDITS.team.forEach((name, i) => card.add(scene.add.text(left, top + 254 + i * 34, name, { ...line, resolution: 2 }).setOrigin(0, 0.5)));
  // right: tools and licences
  const right = 20;
  card.add(addText(scene, right, top + 48, 'credits.tools', head).setOrigin(0, 0.5));
  CREDITS.tools.forEach(([name, licence], i) => {
    const y = top + 88 + i * 44;
    card.add(scene.add.text(right, y, name, { ...line, fontSize: '21px', resolution: 2 }).setOrigin(0, 0.5));
    card.add(scene.add.text(right, y + 20, licence, { ...small, resolution: 2 }).setOrigin(0, 0.5));
  });
  return close;
}
