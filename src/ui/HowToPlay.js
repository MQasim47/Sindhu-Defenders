import { openCard } from './CardFrame.js';
import Button from './Button.js';
import { fit } from '../boss/showdownParts.js';
import { ensureLateTextures } from '../objects/placeholderTextures.js';
import { ensureBrickTexture } from '../objects/amriTextures.js';
import { addText } from '../i18n/i18nText.js';
import { CSS, FONT } from '../data/colors.js';

// The sprites shown on each page (real in-game pictures). [texture, size]
const SPRITES = {
  1: [['npc-chacha-head', 96], ['behroopia-blob', 96], ['trojan-horse', 110], ['gift-box', 80], ['prop-lantern', 84]],
  2: [['brick:A', 70], ['brick:7', 70], ['hathoda-body', 120], ['taala-ghost', 100], ['backup-scroll', 70]],
  3: [['jadugar-head', 110], ['boss-letter', 80], ['gift-box', 80], ['hathoda-hammer', 100], ['chain-lock', 90]],
};
// level 3 also shows the four defence buttons
const DEFENCE_ICONS = [['prop-lantern', '1'], ['boss-shield', '2'], ['backup-scroll', '3'], ['icon-lock', '4']];

// How to Play: one page per level (controls, monster, lesson) with real sprites. Left / right arrows or the buttons turn the page.
export function openHowTo(scene) {
  ensureLateTextures(scene); // the monster pictures
  const w = 1040;
  const h = 664;
  const { card, close } = openCard(scene, { w, h, titleKey: 'howto.title', y: 360 });
  let page = 1;
  const pageItems = [];

  const label = (key, y) => addText(scene, -w / 2 + 50, y, key, { fontFamily: FONT, fontSize: '24px', fontStyle: '700', color: CSS.red }).setOrigin(0, 0.5);
  const body = { fontFamily: FONT, fontSize: '25px', fontStyle: '600', color: CSS.indigo, wordWrap: { width: w - 100 } };

  const show = (n) => {
    pageItems.splice(0).forEach((o) => o.destroy());
    const key = `howto.l${n}`;
    const add = (o) => {
      card.add(o);
      pageItems.push(o);
      return o;
    };
    add(addText(scene, 0, -h / 2 + 120, `${key}.title`, { fontFamily: FONT, fontSize: '36px', fontStyle: '700', color: CSS.indigo }).setOrigin(0.5));
    // pictures
    const list = SPRITES[n];
    list.forEach(([tex, size], i) => {
      const x = (i - (list.length - 1) / 2) * 150;
      const texKey = tex.startsWith('brick:') ? ensureBrickTexture(scene, tex.slice(6)) : tex;
      add(fit(scene.add.image(x, -h / 2 + 195, texKey), Math.min(size, 96)));
    });
    if (n === 3) {
      DEFENCE_ICONS.forEach(([tex, num], i) => {
        const x = (i - 1.5) * 150;
        add(fit(scene.add.image(x - 22, -h / 2 + 275, tex), 46));
        add(scene.add.text(x + 28, -h / 2 + 275, num, { fontFamily: FONT, fontSize: '36px', fontStyle: '700', color: CSS.red, resolution: 2 }).setOrigin(0.5));
      });
    }
    const y0 = n === 3 ? -h / 2 + 318 : -h / 2 + 262;
    add(label('map.monsters', y0));
    add(addText(scene, -w / 2 + 50, y0 + 30, `${key}.monster`, body).setOrigin(0, 0));
    add(label('howto.controls', y0 + 98));
    add(addText(scene, -w / 2 + 50, y0 + 128, `${key}.controls`, { ...body, fontSize: '23px' }).setOrigin(0, 0));
    add(label('map.lesson', y0 + 206));
    add(addText(scene, -w / 2 + 50, y0 + 236, `${key}.lesson`, { ...body, color: '#2E8B57', fontStyle: '700' }).setOrigin(0, 0));
    pageText.setText(`‎${n} / 3‎`);
    prev.setVisible(n > 1);
    next.setVisible(n < 3);
  };

  // the page number sits in the header (plain digits, so Urdu does not flip them)
  const pageText = scene.add.text(w / 2 - 70, -h / 2 + 42, '1 / 3', { fontFamily: FONT, fontSize: '26px', fontStyle: '700', color: CSS.gold, resolution: 2 }).setOrigin(0.5);
  const prev = new Button(scene, -w / 2 + 130, h / 2 - 50, 'howto.prev', () => turn(-1), { width: 190, height: 62, fontSize: 26, style: 'indigo' });
  const next = new Button(scene, w / 2 - 130, h / 2 - 50, 'howto.next', () => turn(1), { width: 190, height: 62, fontSize: 26 });
  card.add([pageText, prev, next]);

  const turn = (d) => {
    const n = Math.min(3, Math.max(1, page + d));
    if (n === page) return;
    page = n;
    show(page);
  };
  const onKey = (e) => {
    if (e.code === 'ArrowRight') turn(1);
    if (e.code === 'ArrowLeft') turn(-1);
  };
  scene.input.keyboard.on('keydown', onKey);
  card.once('destroy', () => scene.input.keyboard.off('keydown', onKey));
  show(1);
  return close;
}
