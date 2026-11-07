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

// "Ask Mithu" talks to Ollama (a small AI model on this computer, port 11434).
// The browser calls /ollama/... and Vite passes it on. This works for "npm run dev" AND "npm run preview".
// If Ollama is not running, we answer with a small harmless message (not an error), and the
// chat uses its offline question finder instead.
const ollamaProxy = {
  '/ollama': {
    target: 'http://localhost:11434',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/ollama/, ''),
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        // Ollama only accepts known origins, so we hide the browser's one
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
      });
      proxy.on('error', (err, req, res) => {
        if (res && typeof res.writeHead === 'function' && !res.headersSent) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{"offline":true}');
        }
      });
    },
  },
};

export default defineConfig({
  define: {
    __ASSET_FILES__: JSON.stringify(listAssets()),
  },
  server: { proxy: ollamaProxy },
  preview: { proxy: ollamaProxy },
});
