import Phaser from 'phaser';
import { openCard } from './CardFrame.js';
import { makeLanguageDropdown } from './LanguageMenu.js';
import { addText, setSource } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';
import { CSS, FONT_TITLE } from '../data/colors.js';
import { settings, saveSettings } from '../data/settings.js';
import { audio, audioSettings } from '../audio/AudioManager.js';
import { playSfx } from '../fx/sound.js';

const ROW = 56;

// ON/OFF switch. get() says if it is on, set(value) changes it.
function makeToggle(scene, x, y, get, set) {
  const box = scene.add.container(x, y);
  const bg = scene.add.graphics();
  const label = addText(scene, 0, 0, () => (get() ? t('settings.on') : t('settings.off')), { fontFamily: FONT_TITLE, fontSize: '22px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
  const redraw = () => {
    bg.clear();
    bg.fillStyle(get() ? 0x2e8b57 : 0x7a6a5a, 1);
    bg.fillRoundedRect(-50, -20, 100, 40, 20);
    bg.lineStyle(3, 0x3a1c16, 1);
    bg.strokeRoundedRect(-50, -20, 100, 40, 20);
    setSource(label, label.i18n.source);
  };
  redraw();
  box.add([bg, label]);
  box.setSize(100, 40).setInteractive({ useHandCursor: true });
  box.on('pointerup', () => {
    set(!get());
    redraw();
    playSfx(scene, 'sfx-click');
    scene.tweens.add({ targets: box, scaleX: 1.12, scaleY: 0.9, duration: 90, yoyo: true, ease: 'Sine.Out' });
  });
  box.redraw = redraw;
  return box;
}

// A volume slider (0..1). Click or drag on the bar. onChange(value) is called while it moves.
function makeSlider(scene, x, y, value, onChange, onRelease) {
  const w = 250;
  const c = scene.add.container(x, y);
  const track = scene.add.graphics();
  const knob = scene.add.graphics();
  const draw = (v) => {
    track.clear();
    track.fillStyle(0x3a1c16, 1);
    track.fillRoundedRect(-w / 2 - 3, -9, w + 6, 18, 9);
    track.fillStyle(0xc9b89a, 1);
    track.fillRoundedRect(-w / 2, -6, w, 12, 6);
    track.fillStyle(0x2e8b57, 1);
    track.fillRoundedRect(-w / 2, -6, Math.max(8, w * v), 12, 6);
    knob.clear();
    knob.fillStyle(0xf3e9d2, 1);
    knob.fillCircle(-w / 2 + w * v, 0, 17);
    knob.lineStyle(4, 0x5a0f1d, 1);
    knob.strokeCircle(-w / 2 + w * v, 0, 17);
  };
  draw(value);
  c.add([track, knob]);
  const zone = scene.add.rectangle(0, 0, w + 40, 46, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
  c.add(zone);
  let down = false;
  const set = (pointer) => {
    const v = Phaser.Math.Clamp((pointer.x - c.parentContainer.x - c.x + w / 2) / w, 0, 1);
    draw(v);
    onChange(v);
  };
  zone.on('pointerdown', (p) => {
    down = true;
    set(p);
  });
  zone.on('pointermove', (p) => down && set(p));
  const up = () => {
    if (!down) return;
    down = false;
    if (onRelease) onRelease();
  };
  zone.on('pointerup', up);
  zone.on('pointerout', up);
  return c;
}

// Settings: language, music, sounds, mute, low graphics, less motion, full screen.
export function openSettings(scene) {
  const rows = 7;
  const w = 780;
  const h = 200 + rows * ROW;
  const cy = 360;
  const { card, close } = openCard(scene, { w, h, titleKey: 'settings.title', y: cy, depth: 500 });
  const style = { fontFamily: FONT_TITLE, fontSize: '28px', color: CSS.indigo };
  let y = -h / 2 + 130;
  const control = w / 2 - 190;
  const row = (labelKey) => {
    card.add(addText(scene, -w / 2 + 50, y, labelKey, style).setOrigin(0, 0.5));
    return y;
  };

  // language: a drop-down that lives on the screen (not inside the card), so its list opens in the right place
  row('settings.language');
  const dropdown = makeLanguageDropdown(scene, 640 + w / 2 - 170, cy + y, 520).setDepth(503);
  card.attach(dropdown);
  y += ROW;

  row('settings.music');
  card.add(makeSlider(scene, control, y, audioSettings.music, (v) => audio.setMusic(v)));
  y += ROW;
  row('settings.sfx');
  card.add(makeSlider(scene, control, y, audioSettings.sfx, (v) => audio.setSfx(v), () => playSfx(scene, 'sfx-coin')));
  y += ROW;

  row('settings.mute');
  card.add(makeToggle(scene, w / 2 - 110, y, () => audioSettings.mute, (v) => audio.setMute(v)));
  y += ROW;
  row('settings.low');
  card.add(makeToggle(scene, w / 2 - 110, y, () => settings.low, (v) => {
    settings.low = v;
    saveSettings();
  }));
  y += ROW;
  row('settings.reduced');
  card.add(makeToggle(scene, w / 2 - 110, y, () => settings.reduced, (v) => {
    settings.reduced = v;
    saveSettings();
  }));
  y += ROW;
  row('settings.fullscreen');
  card.add(makeToggle(scene, w / 2 - 110, y, () => scene.scale.isFullscreen, () => scene.scale.toggleFullscreen()));
  scene.scale.on('enterfullscreen', () => card.active && card.list.forEach((o) => o.redraw && o.redraw()));
  scene.scale.on('leavefullscreen', () => card.active && card.list.forEach((o) => o.redraw && o.redraw()));

  dropdown.setAlpha(0);
  scene.tweens.add({ targets: dropdown, alpha: 1, duration: 260, delay: 120 });
  return close;
}
