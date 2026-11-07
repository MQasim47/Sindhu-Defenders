import { createDodoTextures } from './dodoTextures.js';
import { createFxTextures } from '../fx/fxTextures.js';
import { createGameTextures } from '../fx/uiTextures.js';
import { createMithuTextures } from './mithuTextures.js';
import { createNpcTextures } from './npcTextures.js';
import { createJadugarTextures } from './jadugarTextures.js';
import { createTrojanTextures } from './trojanTextures.js';
import { makeCanvasTexture } from '../fx/canvasUtil.js';

// Generated art. Each texture uses the key the final PNG will use,
// so later we only load a PNG with the same key and nothing else changes.
// A texture that was already loaded from a file is never replaced.
export function createPlaceholderTextures(scene) {
  createFxTextures(scene);
  createDodoTextures(scene);
  createGameTextures(scene);
  createMithuTextures(scene);
  createNpcTextures(scene);
  createJadugarTextures(scene);
  createTrojanTextures(scene);

  // Sand floor tile (only used when courtyard-bg is missing)
  makeCanvasTexture(scene, 'sand-tile', 256, 256, (ctx) => {
    ctx.fillStyle = '#e2c48a';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 260; i++) {
      const x = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1) * 256;
      const y = Math.abs((Math.sin(i * 78.233) * 12345.6789) % 1) * 256;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(241,217,168,0.35)' : 'rgba(201,164,104,0.35)';
      ctx.beginPath();
      ctx.arc(x, y, 1 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
