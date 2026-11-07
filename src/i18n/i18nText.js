import { t, styleFor, prepare, isRtl, onLangChange } from './index.js';

// Text that changes language by itself.
//   addText(scene, x, y, 'menu.play', { fontSize: '30px', ... })
//   addText(scene, x, y, () => `${t('hud.wave')} 3`, style)    <- for text that is built from several parts
// When the player picks another language, every text made this way is redrawn at once.

function bind(scene) {
  if (scene.i18nTexts) return;
  scene.i18nTexts = new Set();
  const off = onLangChange(() => scene.i18nTexts.forEach((obj) => refresh(obj)));
  scene.events.once('shutdown', () => {
    off();
    scene.i18nTexts.clear();
    scene.i18nTexts = null;
  });
}

function resolve(info) {
  return typeof info.source === 'function' ? info.source() : t(info.source, info.vars);
}

function refresh(obj) {
  if (!obj.scene || !obj.i18n) return;
  const info = obj.i18n;
  obj.setStyle(styleFor(info.base));
  // Phaser wraps English text. For Urdu we wrap the lines ourselves (see prepare()).
  const wrap = info.base.wordWrap && info.base.wordWrap.width;
  obj.setWordWrapWidth(isRtl() ? null : wrap || null);
  obj.setText(prepare(resolve(info), info.base));
}

export function addText(scene, x, y, source, style = {}, vars) {
  bind(scene);
  const base = { resolution: 2, ...style };
  const obj = scene.add.text(x, y, '', base);
  obj.i18n = { source, vars, base };
  scene.i18nTexts.add(obj);
  obj.once('destroy', () => scene.i18nTexts && scene.i18nTexts.delete(obj));
  refresh(obj);
  return obj;
}

// Change what an existing text says (same style, current language)
export function setSource(obj, source, vars) {
  obj.i18n.source = source;
  obj.i18n.vars = vars;
  refresh(obj);
}
