// Player settings, remembered in the browser. Safe if storage is blocked.
const KEY = 'sindhu-defenders-settings';

export const settings = {
  low: false, // Low graphics: fewer particles, no footprints, no glow flicker
  reduced: false, // Reduced motion: no shake, calmer animation
};

try {
  Object.assign(settings, JSON.parse(localStorage.getItem(KEY) || '{}'));
} catch (e) {
  // ignore: defaults are fine
}

export function saveSettings() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch (e) {
    // ignore
  }
}
