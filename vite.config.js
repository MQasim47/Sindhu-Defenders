import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// List every file in public/assets, so the game only asks for files that really exist
// (a missing optional file then never causes a 404 error in the browser console).
function listAssets(dir, base = 'assets') {
  const full = path.resolve('public', base);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const rel = `${base}/${entry.name}`;
    return entry.isDirectory() ? listAssets(dir, rel) : [rel];
  });
}

export default defineConfig({
  define: {
    __ASSET_FILES__: JSON.stringify(listAssets()),
  },
});
