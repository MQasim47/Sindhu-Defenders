import { newCanvas, makeCanvasTexture } from './canvasUtil.js';

// The Ajrak look: deep crimson and indigo, black outlines, white dots,
// a grid of star / flower medallions and a patterned border band.
export const AJRAK = {
  crimson: '#8E1B2B',
  crimsonDark: '#6E1220',
  indigo: '#1C2457',
  black: '#140A10',
  white: '#F4EBDD',
};

const TILE = 64; // the pattern is designed on a 64x64 grid, then scaled

function star(ctx, cx, cy, outer, inner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function dot(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function medallion(ctx, cx, cy) {
  // 8-point star with black outline
  star(ctx, cx, cy, 23, 12, 8);
  ctx.fillStyle = AJRAK.indigo;
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = AJRAK.black;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // flower ring inside the star
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fillStyle = AJRAK.crimson;
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    dot(ctx, cx + Math.cos(a) * 16.5, cy + Math.sin(a) * 16.5, 1.5, AJRAK.white);
    dot(ctx, cx + Math.cos(a + Math.PI / 8) * 5.2, cy + Math.sin(a + Math.PI / 8) * 5.2, 1.1, AJRAK.white);
  }
  dot(ctx, cx, cy, 2.6, AJRAK.white);
}

function cornerDiamond(ctx, cx, cy) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - 13);
  ctx.lineTo(cx + 13, cy);
  ctx.lineTo(cx, cy + 13);
  ctx.lineTo(cx - 13, cy);
  ctx.closePath();
  ctx.fillStyle = AJRAK.indigo;
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = AJRAK.black;
  ctx.stroke();
  dot(ctx, cx, cy, 2.4, AJRAK.white);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    dot(ctx, cx + Math.cos(a) * 6.5, cy + Math.sin(a) * 6.5, 1.1, AJRAK.white);
  }
}

// A seamless tile canvas, "size" pixels wide.
export function makeAjrakTile(size = 64) {
  const canvas = newCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.scale(size / TILE, size / TILE);

  ctx.fillStyle = AJRAK.crimson;
  ctx.fillRect(0, 0, TILE, TILE);

  // darker diamonds in the crimson gaps
  ctx.fillStyle = AJRAK.crimsonDark;
  [[16, 16], [48, 16], [16, 48], [48, 48]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x + 4, y);
    ctx.lineTo(x, y + 4);
    ctx.lineTo(x - 4, y);
    ctx.fill();
  });

  // Medallion grid. The corner pieces are drawn on all four corners,
  // so the tile repeats with no seam.
  medallion(ctx, 32, 32);
  [0, TILE].forEach((x) => [0, TILE].forEach((y) => cornerDiamond(ctx, x, y)));
  [[32, 0], [32, TILE], [0, 32], [TILE, 32]].forEach(([x, y]) => {
    dot(ctx, x, y, 2, AJRAK.white);
    dot(ctx, x + (x === 32 ? -5 : 0), y + (y === 32 ? -5 : 0), 1.2, AJRAK.white);
    dot(ctx, x + (x === 32 ? 5 : 0), y + (y === 32 ? 5 : 0), 1.2, AJRAK.white);
  });
  return canvas;
}

// A patterned border band: black lines, indigo strip, white diamonds.
export function drawAjrakBand(ctx, x, y, w, h) {
  ctx.fillStyle = AJRAK.crimson;
  ctx.fillRect(x, y, w, h);
  const stripe = Math.max(1, h * 0.14);
  ctx.fillStyle = AJRAK.black;
  ctx.fillRect(x, y, w, stripe);
  ctx.fillRect(x, y + h - stripe, w, stripe);
  ctx.fillStyle = AJRAK.indigo;
  ctx.fillRect(x, y + stripe * 1.6, w, h - stripe * 3.2);
  const step = h * 0.7;
  for (let px = x + step / 2; px < x + w; px += step) {
    ctx.beginPath();
    ctx.moveTo(px, y + h / 2 - h * 0.22);
    ctx.lineTo(px + step * 0.3, y + h / 2);
    ctx.lineTo(px, y + h / 2 + h * 0.22);
    ctx.lineTo(px - step * 0.3, y + h / 2);
    ctx.closePath();
    ctx.fillStyle = AJRAK.white;
    ctx.fill();
  }
}

// Fill the path that is already on the context with the Ajrak pattern.
export function fillAjrak(ctx, tileSize = 32) {
  ctx.fillStyle = ctx.createPattern(makeAjrakTile(tileSize), 'repeat');
  ctx.fill();
}

// Registers a texture "key" holding one Ajrak tile (used by tile sprites).
export function createAjrakTexture(scene, key, size = 64) {
  if (scene.textures.exists(key)) return;
  scene.textures.addCanvas(key, makeAjrakTile(size));
}

export function createAjrakBandTexture(scene, key, w, h) {
  makeCanvasTexture(scene, key, w, h, (ctx) => drawAjrakBand(ctx, 0, 0, w, h));
}

// CSS-ready picture of the tile (for the page background outside the game).
export function ajrakDataUrl(size = 128) {
  return makeAjrakTile(size).toDataURL('image/png');
}
