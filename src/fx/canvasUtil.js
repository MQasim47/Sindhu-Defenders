// Small helpers for drawing textures with the normal 2D canvas.
// All art that is generated in code goes through here, so one real PNG
// with the same key can replace it later.

export const INK = '#3A1C16'; // soft dark brown used for outlines

export function newCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// Draws into a new canvas and adds it as a texture. Never replaces an existing texture.
export function makeCanvasTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return;
  const canvas = newCanvas(width, height);
  draw(canvas.getContext('2d'), width, height);
  scene.textures.addCanvas(key, canvas);
}

export function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function outline(ctx, color = INK, width = 2.5) {
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

// Cartoon "cel" shading: base colour, a darker crescent on the lower right,
// an optional highlight, then a dark outline.
// path() must build the shape with ctx.beginPath() but not fill it.
export function celShape(ctx, path, { base, shade, light, lightShape, shadeShift = 3, ink = INK, lineWidth = 2.5 }) {
  ctx.save();
  path();
  ctx.clip();
  ctx.fillStyle = shade;
  ctx.fillRect(-200, -200, 600, 600);
  ctx.translate(-shadeShift, -shadeShift * 1.2);
  path();
  ctx.fillStyle = base;
  ctx.fill();
  ctx.restore();

  if (light && lightShape) {
    ctx.save();
    path();
    ctx.clip();
    ctx.fillStyle = light;
    lightShape();
    ctx.fill();
    ctx.restore();
  }

  path();
  outline(ctx, ink, lineWidth);
}

export function radialBlob(ctx, cx, cy, radius, rgb, alpha) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
}

// Turns the plain white background of a picture into transparency.
// It floods inwards from the borders, so white inside the drawing stays.
// Returns a new canvas, cropped to the drawing and scaled by "scale",
// and where the crop started so callers can find details again.
export function cutOutWhiteBackground(image, scale = 0.5) {
  const w = image.width;
  const h = image.height;
  const full = newCanvas(w, h);
  const ctx = full.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  const isWhite = (p) => px[p * 4] > 236 && px[p * 4 + 1] > 236 && px[p * 4 + 2] > 232;
  const seen = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const p = y * w + x;
    if (seen[p] || !isWhite(p)) return;
    seen[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const p = stack.pop();
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let p = 0; p < w * h; p++) {
    if (seen[p]) {
      px[p * 4 + 3] = 0;
    } else {
      const x = p % w;
      const y = (p - x) / w;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  ctx.putImageData(data, 0, 0);

  const pad = 6;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const out = newCanvas(Math.round(cw * scale), Math.round(ch * scale));
  const octx = out.getContext('2d');
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(full, minX, minY, cw, ch, 0, 0, out.width, out.height);
  return { canvas: out, cropX: minX, cropY: minY, scale };
}
