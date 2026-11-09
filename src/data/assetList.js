// Files the game loads. A missing file never breaks the game: the scenes fall back to art
// that is drawn in code (and a missing sound is made by a small WebAudio recipe).
//
// vite.config.js gives us the list of files that really exist in public/assets, so optional files
// are only requested when they are there (no 404 in the console).
// A picture can be .webp, .png or .jpg: the first one found is used. Big pictures are WebP
// (run "npm run optimize"); the originals are kept in art-src/ (not served, not in the build).
const FILES = typeof __ASSET_FILES__ !== 'undefined' ? __ASSET_FILES__ : [];
const EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'];

function find(base, extensions) {
  for (const ext of extensions) if (FILES.includes(`${base}.${ext}`)) return `${base}.${ext}`;
  return null;
}

// What each part of the game needs. Only the title screen's files are loaded at the start (fast cold
// start); the heavy art of a level is loaded by the Loading scene right before that level opens.
//   images: key -> path without extension.   audio: key -> path without extension (.mp3 / .ogg).
const GROUP_DEFS = {
  boot: {
    images: { 'title-bg': 'assets/backgrounds/title-bg', 'dodo-full-raw': 'assets/characters/dodo-full', 'emblem-png': 'assets/ui/emblem' },
    audio: {},
  },
  // the title music is big (7 MB): it is loaded AFTER the title screen is shown
  menuMusic: { images: {}, audio: { 'music-menu': 'assets/audio/music-menu' } },
  map: { images: { 'ranikot-map': 'assets/backgrounds/ranikot-map' }, audio: {} },
  level1: { images: { 'courtyard-bg': 'assets/backgrounds/courtyard-bg' }, audio: { 'music-level': 'assets/audio/music-level' } },
  level2: {
    images: { 'amri-gate-bg': 'assets/backgrounds/amri-gate-bg', 'courtyard-bg': 'assets/backgrounds/courtyard-bg' },
    audio: { 'music-level': 'assets/audio/music-level' },
  },
  boss: { images: { 'miri-fort-bg': 'assets/backgrounds/miri-fort-bg' }, audio: { 'music-boss': 'assets/audio/music-boss' } },
};

// which group a scene needs before it opens
export const SCENE_GROUP = { WorldMap: 'map', Level: 'level1', Level2: 'level2', Boss: 'boss' };

// The files of a group that exist: [{ type: 'image' | 'audio', key, path }]
export function groupFiles(name) {
  const def = GROUP_DEFS[name];
  const list = [];
  if (!def) return list;
  Object.entries(def.images).forEach(([key, base]) => {
    const path = find(base, EXTENSIONS);
    if (path) list.push({ type: 'image', key, path });
  });
  Object.entries(def.audio).forEach(([key, base]) => {
    const path = find(base, ['mp3', 'ogg', 'wav']);
    if (path) list.push({ type: 'audio', key, path });
  });
  return list;
}

// Optional Urdu font (Noto Nastaliq Urdu). If it is not there, a system Urdu font is used.
export const URDU_FONT_FILE = FILES.find((f) => /\/NotoNastaliqUrdu[^/]*\.(ttf|otf|woff2?)$/i.test(f)) || null;
