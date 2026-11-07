import { newCanvas, outline, INK, roundRectPath } from '../fx/canvasUtil.js';
import { makeAjrakTile, drawAjrakBand } from '../fx/ajrakPattern.js';
import { FONT_TITLE } from '../data/colors.js';
import ShineTexture from './ShineTexture.js';

// Big chunky title text: thick outline, drop shadow, shine sweep.
// Returns a ShineTexture; show it with scene.add.image(x, y, key).
export function createLogoTitle(scene, key, text, fontSize = 92) {
  const w = Math.ceil(text.length * fontSize * 0.74) + 80;
  const h = Math.ceil(fontSize * 1.7);
  const canvas = newCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.font = `900 ${fontSize}px ${FONT_TITLE}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const x = w / 2;
  const y = h / 2 - 6;

  // drop shadow
  ctx.fillStyle = 'rgba(20,6,12,0.45)';
  ctx.strokeStyle = 'rgba(20,6,12,0.45)';
  ctx.lineWidth = 24;
  ctx.strokeText(text, x, y + 12);
  // thick dark outline, then a crimson ring, then the fill
  ctx.strokeStyle = '#2A0E14';
  ctx.lineWidth = 24;
  ctx.strokeText(text, x, y);
  ctx.strokeStyle = '#B3263C';
  ctx.lineWidth = 12;
  ctx.strokeText(text, x, y);
  const g = ctx.createLinearGradient(0, y - fontSize / 2, 0, y + fontSize / 2);
  g.addColorStop(0, '#FFF7DC');
  g.addColorStop(0.55, '#FBD76B');
  g.addColorStop(1, '#F0A53A');
  ctx.fillStyle = g;
  ctx.fillText(text, x, y);
  // small highlight on the top edge of the letters
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(0, y - fontSize / 2, w, fontSize * 0.14);
  ctx.restore();

  return new ShineTexture(scene, key, canvas);
}

// A real Ajrak ribbon: the same Ajrak pattern as the cape, black outlines, border bands,
// swallow-tail ends and folded corners, with the text on a dark plaque.
export function createRibbon(scene, key, text, width = 600, fontSize = 38) {
  if (scene.textures.exists(key)) return;
  const h = 118;
  const canvas = newCanvas(width, h);
  const ctx = canvas.getContext('2d');
  ctx.lineJoin = 'round';
  const tail = 78; // width of each folded end
  const top = 16;
  const bottom = 80;
  const drop = 18; // the folded ends hang lower than the middle band

  const pattern = ctx.createPattern(makeAjrakTile(50), 'repeat');
  const fillPattern = (shade) => {
    ctx.fillStyle = pattern;
    ctx.fill();
    ctx.fillStyle = `rgba(20,6,14,${shade})`;
    ctx.fill();
  };

  // shadow under the whole ribbon
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(tail * 0.5, bottom + drop - 4, width - tail, 10);

  // the two folded ends behind the band (darker, with a V-cut at the end)
  [true, false].forEach((left) => {
    const x0 = left ? 0 : width;
    const dir = left ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x0 + dir * (tail + 14), top + drop);
    ctx.lineTo(x0, top + drop);
    ctx.lineTo(x0 + dir * 24, (top + bottom) / 2 + drop);
    ctx.lineTo(x0, bottom + drop);
    ctx.lineTo(x0 + dir * (tail + 14), bottom + drop);
    ctx.closePath();
    fillPattern(0.38);
    outline(ctx, INK, 3.4);
    // border lines on the end pieces
    ctx.save();
    ctx.clip();
    drawAjrakBand(ctx, Math.min(x0, x0 + dir * (tail + 14)), top + drop, tail + 14, 8);
    drawAjrakBand(ctx, Math.min(x0, x0 + dir * (tail + 14)), bottom + drop - 8, tail + 14, 8);
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(x0 + dir * (tail + 14), top + drop);
    ctx.lineTo(x0, top + drop);
    ctx.lineTo(x0 + dir * 24, (top + bottom) / 2 + drop);
    ctx.lineTo(x0, bottom + drop);
    ctx.lineTo(x0 + dir * (tail + 14), bottom + drop);
    ctx.closePath();
    outline(ctx, INK, 3.4);

    // the fold: a dark triangle where the band turns back
    ctx.beginPath();
    ctx.moveTo(x0 + dir * tail, bottom);
    ctx.lineTo(x0 + dir * (tail + 16), bottom);
    ctx.lineTo(x0 + dir * tail, bottom + drop);
    ctx.closePath();
    ctx.fillStyle = '#3A0A16';
    ctx.fill();
    outline(ctx, INK, 3);
  });

  // the main band
  const band = () => {
    ctx.beginPath();
    ctx.rect(tail, top, width - tail * 2, bottom - top);
  };
  band();
  fillPattern(0.0);
  ctx.save();
  band();
  ctx.clip();
  drawAjrakBand(ctx, tail, top, width - tail * 2, 14);
  drawAjrakBand(ctx, tail, bottom - 14, width - tail * 2, 14);
  const gloss = ctx.createLinearGradient(0, top, 0, bottom);
  gloss.addColorStop(0, 'rgba(255,255,255,0.22)');
  gloss.addColorStop(0.5, 'rgba(255,255,255,0)');
  gloss.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = gloss;
  ctx.fillRect(tail, top, width - tail * 2, bottom - top);
  ctx.restore();
  band();
  outline(ctx, INK, 3.6);

  // dark plaque with a gold line, so the text is easy to read
  const px = tail + 30;
  const pw = width - (tail + 30) * 2;
  roundRectPath(ctx, px, top + 14, pw, bottom - top - 28, 12);
  ctx.fillStyle = 'rgba(28,8,20,0.78)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#E8B84A';
  ctx.stroke();

  ctx.font = `700 ${fontSize}px ${FONT_TITLE}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cy = (top + bottom) / 2 + 2;
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#120508';
  ctx.strokeText(text, width / 2, cy);
  ctx.fillStyle = '#FBE9B5';
  ctx.fillText(text, width / 2, cy);

  scene.textures.addCanvas(key, canvas);
}
