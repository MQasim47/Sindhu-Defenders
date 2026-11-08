// Files the game tries to load. A missing file never breaks the game:
// the scenes fall back to art that is drawn in code.
//
// vite.config.js gives us the list of files that really exist in public/assets,
// so optional files are only requested when they are there (no 404 in the console).
// A picture can be .png, .webp or .jpg: the first one found is used.
const FILES = typeof __ASSET_FILES__ !== 'undefined' ? __ASSET_FILES__ : [];
const EXTENSIONS = ['png', 'webp', 'jpg', 'jpeg'];

function find(base) {
  for (const ext of EXTENSIONS) if (FILES.includes(`${base}.${ext}`)) return `${base}.${ext}`;
  return null;
}

// key -> path inside public/. Keys stay the same when real art is swapped in.
const WANTED = {
  'title-bg': 'assets/backgrounds/title-bg',
  'courtyard-bg': 'assets/backgrounds/courtyard-bg',
  'dodo-full-raw': 'assets/characters/dodo-full',
  'amri-gate-bg': 'assets/backgrounds/amri-gate-bg', // optional: the picture for Level 2
  'miri-fort-bg': 'assets/backgrounds/miri-fort-bg', // optional: the boss arena picture
  'ranikot-map': 'assets/backgrounds/ranikot-map', // optional: the World Map picture
  'emblem-png': 'assets/ui/emblem', // optional: replaces the emblem drawn in code
};

export const IMAGES = {};
Object.entries(WANTED).forEach(([key, base]) => {
  const file = find(base);
  if (file) IMAGES[key] = file;
});

// Sound slots. Add real files here when they exist, e.g.  'sfx-jump': 'assets/audio/jump.ogg'
// Slots used by the game (nothing plays until a file is added): sfx-click sfx-jump sfx-land sfx-hit sfx-coin sfx-win
//   sfx-lantern sfx-brick-pick sfx-brick-place sfx-chain-lock sfx-scroll-restore sfx-ball-hum sfx-jadugar-laugh
//   Level 2 backup: sfx-backup-hold sfx-backup-done
//   World Map: sfx-map-step sfx-map-locked
//   Boss: sfx-round sfx-fight sfx-ko sfx-teleport sfx-beam-hit sfx-shield sfx-letter-land sfx-shockwave sfx-gift-throw
//         sfx-gift-pop sfx-bugs sfx-deepfake sfx-codeword-lock sfx-key-right sfx-key-wrong sfx-confetti sfx-combo
export const AUDIO = {};

// Optional Urdu font (Noto Nastaliq Urdu). If it is not there, a system Urdu font is used.
export const URDU_FONT_FILE = FILES.find((f) => /\/NotoNastaliqUrdu[^/]*\.(ttf|otf|woff2?)$/i.test(f)) || null;
