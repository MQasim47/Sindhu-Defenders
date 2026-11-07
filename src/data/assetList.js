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
  'emblem-png': 'assets/ui/emblem', // optional: replaces the emblem drawn in code
};

export const IMAGES = {};
Object.entries(WANTED).forEach(([key, base]) => {
  const file = find(base);
  if (file) IMAGES[key] = file;
});

// Sound slots. Add real files here when they exist, e.g.
//   'sfx-jump': 'assets/audio/jump.ogg'
export const AUDIO = {};

// Optional Urdu font (Noto Nastaliq Urdu). If it is not there, a system Urdu font is used.
export const URDU_FONT_FILE = FILES.find((f) => /\/NotoNastaliqUrdu[^/]*\.(ttf|otf|woff2?)$/i.test(f)) || null;
