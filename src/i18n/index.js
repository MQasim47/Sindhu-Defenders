import en from './en.js';
import ur from './ur.js';
import { URDU_FONT_FILE } from '../data/assetList.js';
import { FONT } from '../data/colors.js';

// The language system. Use t('menu.play') to get a word in the chosen language.
// English is the default. The choice is remembered in the browser.
const STORAGE_KEY = 'sindhu-defenders-language';
const RLE = '\u202B'; // "start right-to-left" mark, so Urdu lines get the right direction

export const LANGS = {
  en: { code: 'en', name: 'English', dict: en, rtl: false },
  ur: { code: 'ur', name: 'اردو', dict: ur, rtl: true },
};

// Noto Nastaliq Urdu if the file is in public/assets/fonts, else a system Urdu font.
export const URDU_FAMILY =
  '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", "Noto Naskh Arabic", "Segoe UI", Tahoma, sans-serif';

let current = 'en';
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (LANGS[saved]) current = saved;
} catch (e) {
  // storage can be blocked: English is fine
}

const listeners = new Set();

function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node && node[part] !== undefined ? node[part] : undefined), dict);
}

// t('results.mithu', { line: '...' })  ->  text in the current language
export function t(key, vars) {
  let text = lookup(LANGS[current].dict, key);
  if (typeof text !== 'string') text = lookup(en, key); // missing Urdu word: show English
  if (typeof text !== 'string') return key;
  if (vars) text = text.replace(/\{(\w+)\}/g, (m, name) => (vars[name] !== undefined ? vars[name] : m));
  return text;
}

export const getLang = () => current;
export const isRtl = () => LANGS[current].rtl;

export function setLang(code) {
  if (!LANGS[code] || code === current) return;
  current = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch (e) {
    // ignore
  }
  listeners.forEach((fn) => fn(code));
}

// Call fn(code) whenever the language changes. Returns a function that stops listening.
export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Adds the Urdu font file to the page (only if it exists). Never throws.
export async function loadUrduFont() {
  if (!URDU_FONT_FILE) return;
  try {
    const face = new FontFace('Noto Nastaliq Urdu', `url(/${URDU_FONT_FILE})`);
    await face.load();
    document.fonts.add(face);
  } catch (e) {
    // the system Urdu font is used instead
  }
}

// Turns a normal text style into one for the current language.
// Urdu: Nastaliq font, a bit smaller, extra room above and below (Nastaliq letters are tall).
export function styleFor(base) {
  const style = { ...base };
  if (!isRtl()) {
    style.fontFamily = base.fontFamily || FONT;
    return style;
  }
  const size = Math.round(parseFloat(base.fontSize || '24') * 0.88);
  style.fontFamily = URDU_FAMILY;
  style.fontSize = `${size}px`;
  style.fontStyle = 'normal';
  style.padding = { x: base.padding ? base.padding.x || 0 : 0, top: Math.ceil(size * 0.42), bottom: Math.ceil(size * 0.42) };
  style.lineSpacing = Math.round(size * 0.35);
  if (base.align === 'left') style.align = 'right';
  return style;
}

let measureContext = null;

// For Urdu we wrap the lines ourselves and mark each line as right-to-left.
// (English is wrapped by Phaser, so it is returned as it is.)
export function prepare(text, base) {
  if (!isRtl()) return text;
  const style = styleFor(base);
  const maxWidth = base.wordWrap && base.wordWrap.width;
  if (!maxWidth) return text.split('\n').map((line) => RLE + line).join('\n');

  if (!measureContext) measureContext = document.createElement('canvas').getContext('2d');
  measureContext.font = `${style.fontSize} ${style.fontFamily}`;
  const lines = [];
  text.split('\n').forEach((paragraph) => {
    let line = '';
    paragraph.split(' ').forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (line && measureContext.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    lines.push(line);
  });
  return lines.map((line) => RLE + line).join('\n');
}

// Text in English only (used by the chatbot, which always speaks English)
export function tEn(key, vars) {
  let text = lookup(en, key);
  if (typeof text !== 'string') return key;
  if (vars) text = text.replace(/\{(\w+)\}/g, (m, name) => (vars[name] !== undefined ? vars[name] : m));
  return text;
}
