import { makeCanvasTexture } from '../fx/canvasUtil.js';

// Helpers for the real Dodo picture (dodo-full). The picture is prepared in PreloadScene:
// its white background is cut away and the result is stored as the texture "dodo-full".
// The numbers below are places in the ORIGINAL (full size) picture.
export const DODO_ART = {
  eyes: [
    [1229, 489],
    [1493, 492],
  ],
  noseBridge: [1356, 470], // plain skin between the eyes (to match the eyelid colour)
  shoulder: [1150, 872], // the shoulder on the side Dodo faces (the cape is on the other side)
  mirrors: [
    [1197, 204],
    [1525, 204],
    [1090, 256],
    [1646, 256],
  ],
};

export function dodoArtAvailable(scene) {
  return scene.textures.exists('dodo-full') && !!scene.registry.get('dodoFullCrop');
}

// Where a place of the original picture is, in pixels from the feet (bottom centre)
// of a "dodo-full" sprite that is drawn with the scale s.
export function artToSprite(scene, rx, ry, s) {
  const crop = scene.registry.get('dodoFullCrop');
  const tex = scene.textures.get('dodo-full').getSourceImage();
  const tx = (rx - crop.x) * crop.scale;
  const ty = (ry - crop.y) * crop.scale;
  return { x: (tx - tex.width / 2) * s, y: -(tex.height - ty) * s };
}

// A skin coloured eyelid (with a closed-eye line) that is shown for a moment to make Dodo blink.
export function ensureLidTexture(scene) {
  const crop = scene.registry.get('dodoFullCrop');
  const tex = scene.textures.get('dodo-full').getSourceImage();
  let skin = '#F2B98A';
  try {
    const [nx, ny] = DODO_ART.noseBridge;
    const p = tex.getContext('2d').getImageData(Math.round((nx - crop.x) * crop.scale), Math.round((ny - crop.y) * crop.scale), 1, 1).data;
    skin = `rgb(${p[0]},${p[1]},${p[2]})`;
  } catch (e) {
    // keep the default skin colour
  }
  makeCanvasTexture(scene, 'dodo-lid', 84, 84, (ctx) => {
    ctx.beginPath();
    ctx.ellipse(42, 42, 38, 40, 0, 0, Math.PI * 2);
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(14, 44);
    ctx.quadraticCurveTo(42, 62, 70, 44);
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3A1C16';
    ctx.stroke();
  });
}
