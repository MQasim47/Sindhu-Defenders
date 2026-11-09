// Makes the big pictures small: WebP, at most 1920 px wide, quality 82.
// The originals are MOVED to art-src/ (not served by the game, not in the build).
// Run it after adding a new big picture:   npm run optimize
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const FOLDERS = ['public/assets/backgrounds', 'public/assets/characters'];
const MAX_WIDTH = 1920;
fs.mkdirSync('art-src', { recursive: true });

for (const folder of FOLDERS) {
  for (const file of fs.readdirSync(folder)) {
    if (!/\.(png|jpe?g)$/i.test(file)) continue;
    const from = path.join(folder, file);
    const base = path.basename(file, path.extname(file));
    const to = path.join(folder, `${base}.webp`);
    const before = fs.statSync(from).size;
    await sharp(from).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 82 }).toFile(to);
    fs.renameSync(from, path.join('art-src', file));
    console.log(`${file}: ${(before / 1e6).toFixed(2)} MB -> ${base}.webp ${(fs.statSync(to).size / 1e6).toFixed(2)} MB`);
  }
}
