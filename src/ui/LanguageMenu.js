import { COLORS, CSS, FONT } from '../data/colors.js';
import { LANGS, URDU_FAMILY, getLang, setLang, onLangChange } from '../i18n/index.js';
import { playSfx } from '../fx/sound.js';

// The language choice: a popup list ("English" / "اردو"), a drop-down button for the
// Settings panel and a small globe button for the title screen.

function labelStyle(code, color) {
  return code === 'ur'
    ? { fontFamily: URDU_FAMILY, fontSize: '30px', color, padding: { top: 12, bottom: 12 } }
    : { fontFamily: FONT, fontSize: '32px', fontStyle: '600', color };
}

// Opens the list with its top-centre at (x, y).
export function openLanguageMenu(scene, x, y, depth = 800) {
  const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.001).setInteractive().setDepth(depth);
  const box = scene.add.container(x, y).setDepth(depth + 1);
  const codes = Object.keys(LANGS);
  const w = 250;
  const rowH = 70;
  const h = rowH * codes.length + 16;

  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.35);
  g.fillRoundedRect(-w / 2 + 3, 9, w, h, 20);
  g.fillStyle(0x3a1c16, 1);
  g.fillRoundedRect(-w / 2 - 3, 0, w + 6, h + 6, 22);
  g.fillStyle(COLORS.cream, 1);
  g.fillRoundedRect(-w / 2, 3, w, h, 19);
  box.add(g);

  const close = () => {
    scene.tweens.add({ targets: box, alpha: 0, scaleY: 0.7, duration: 120, onComplete: () => box.destroy() });
    blocker.destroy();
  };
  blocker.on('pointerup', close);

  codes.forEach((code, i) => {
    const row = scene.add.container(0, 11 + i * rowH + rowH / 2);
    const bg = scene.add.graphics();
    const active = code === getLang();
    bg.fillStyle(active ? 0xf3d98a : 0xf3e9d2, 1);
    bg.fillRoundedRect(-w / 2 + 8, -rowH / 2 + 4, w - 16, rowH - 8, 14);
    const label = scene.add.text(0, 0, LANGS[code].name, { ...labelStyle(code, CSS.indigo), resolution: 2 }).setOrigin(0.5);
    row.add([bg, label]);
    if (active) {
      row.add(scene.add.text(-w / 2 + 28, 0, '✓', { fontFamily: FONT, fontSize: '30px', fontStyle: '700', color: '#2E8B57', resolution: 2 }).setOrigin(0.5));
    }
    row.setSize(w - 16, rowH - 8).setInteractive({ useHandCursor: true });
    row.on('pointerover', () => scene.tweens.add({ targets: row, scale: 1.05, duration: 100 }));
    row.on('pointerout', () => scene.tweens.add({ targets: row, scale: 1, duration: 100 }));
    row.on('pointerup', () => {
      playSfx(scene, 'sfx-click');
      setLang(code);
      close();
    });
    box.add(row);
  });

  box.setAlpha(0).setScale(1, 0.7);
  scene.tweens.add({ targets: box, alpha: 1, scaleY: 1, duration: 160, ease: 'Back.Out' });
}

// A drop-down button: shows the current language, opens the list when clicked.
// (x, y) is where it sits on the screen (it must not be inside a moving container).
export function makeLanguageDropdown(scene, x, y, depth = 800) {
  const w = 230;
  const h = 56;
  const box = scene.add.container(x, y);
  const bg = scene.add.graphics();
  bg.fillStyle(0x3a1c16, 1);
  bg.fillRoundedRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 18);
  bg.fillStyle(0xfff6dc, 1);
  bg.fillRoundedRect(-w / 2, -h / 2, w, h, 15);
  bg.fillStyle(COLORS.indigo, 1);
  bg.fillTriangle(w / 2 - 38, -5, w / 2 - 16, -5, w / 2 - 27, 8);
  const label = scene.add.text(-12, 0, '', { fontFamily: FONT, fontSize: '28px', color: CSS.indigo, resolution: 2 }).setOrigin(0.5);
  box.add([bg, label]);
  const refresh = () => {
    const code = getLang();
    label.setStyle({ ...labelStyle(code, CSS.indigo), fontSize: '28px' });
    label.setText(LANGS[code].name);
  };
  refresh();
  const off = onLangChange(refresh);
  box.once('destroy', off);
  box.setSize(w, h).setInteractive({ useHandCursor: true });
  box.on('pointerover', () => scene.tweens.add({ targets: box, scale: 1.05, duration: 100 }));
  box.on('pointerout', () => scene.tweens.add({ targets: box, scale: 1, duration: 100 }));
  box.on('pointerup', () => {
    const m = box.getWorldTransformMatrix();
    openLanguageMenu(scene, m.tx, m.ty + h / 2 + 6, depth);
  });
  return box;
}

// Small globe in the corner of the title screen.
export function makeGlobeButton(scene, x, y) {
  const globe = scene.add.container(x, y);
  const img = scene.add.image(0, 0, 'ui-globe');
  const code = scene.add
    .text(0, 46, '', { fontFamily: FONT, fontSize: '20px', fontStyle: '700', color: CSS.cream, stroke: '#2A0E14', strokeThickness: 5, resolution: 2 })
    .setOrigin(0.5);
  globe.add([img, code]);
  const refresh = () => code.setText(getLang() === 'ur' ? 'UR' : 'EN');
  refresh();
  const off = onLangChange(refresh);
  globe.once('destroy', off);
  globe.setSize(72, 72).setInteractive({ useHandCursor: true });
  globe.on('pointerover', () => scene.tweens.add({ targets: globe, scale: 1.12, angle: 8, duration: 140, ease: 'Back.Out' }));
  globe.on('pointerout', () => scene.tweens.add({ targets: globe, scale: 1, angle: 0, duration: 140 }));
  globe.on('pointerup', () => openLanguageMenu(scene, Math.min(x - 40, 1280 - 135), y + 66));
  return globe;
}
