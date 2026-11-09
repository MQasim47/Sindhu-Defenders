import { settings, saveSettings } from '../data/settings.js';
import { t } from '../i18n/index.js';

const CHECK_MS = 500;
const SECONDS_BELOW = 5; // FPS under this value for this long -> low graphics
const FPS_LIMIT = 40;

// Auto low graphics: if the game runs under 40 FPS for 5 seconds in a row, "Low graphics" is turned
// on (and saved), and a small toast says so. It does not count while the browser tab is hidden.
export function watchPerformance(game) {
  let slowFor = 0;
  setInterval(() => {
    if (settings.low || document.hidden) {
      slowFor = 0;
      return;
    }
    const active = game.scene.getScenes(true).map((s) => s.scene.key);
    const playing = active.some((k) => ['Level', 'Level2', 'Boss', 'WorldMap', 'Menu'].includes(k));
    if (!playing || game.loop.actualFps >= FPS_LIMIT || game.loop.frame < 120) {
      slowFor = 0;
      return;
    }
    slowFor += CHECK_MS / 1000;
    if (slowFor >= SECONDS_BELOW) {
      settings.low = true;
      saveSettings();
      toast(t('toast.lowGraphics'));
    }
  }, CHECK_MS);
}

// a small message at the bottom of the screen
export function toast(text) {
  const box = document.createElement('div');
  box.textContent = text;
  box.style.cssText =
    'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:rgba(28,36,87,0.96);color:#F3E9D2;' +
    'border:3px solid #E8B84A;border-radius:22px;padding:10px 22px;font:600 20px Fredoka,Arial,sans-serif;z-index:40;' +
    'box-shadow:0 8px 24px rgba(0,0,0,.4);transition:opacity .5s;';
  document.body.appendChild(box);
  setTimeout(() => (box.style.opacity = '0'), 4200);
  setTimeout(() => box.remove(), 4800);
}

// Start-up timing: mark('name') remembers the time (ms since the page started) in window.__marks.
// Used to find what makes the cold start slow (see scripts or the browser console).
export function mark(name) {
  (window.__marks = window.__marks || {})[name] = Math.round(performance.now());
}
