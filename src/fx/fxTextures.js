import { makeCanvasTexture, radialBlob, outline, INK } from './canvasUtil.js';
import { fillAjrak, createAjrakTexture } from './ajrakPattern.js';

// Small effect and prop textures, all drawn in code.
export function createFxTextures(scene) {
  createAjrakTexture(scene, 'ajrak-tile', 64);

  // Soft ground shadow (blob shadow under every character and prop)
  makeCanvasTexture(scene, 'shadow', 96, 32, (ctx) => {
    ctx.save();
    ctx.scale(1, 1 / 3);
    radialBlob(ctx, 48, 48, 48, '40,20,10', 0.5);
    ctx.restore();
  });

  makeCanvasTexture(scene, 'fx-dust', 32, 32, (ctx) => radialBlob(ctx, 16, 16, 16, '236,214,170', 0.9));

  makeCanvasTexture(scene, 'fx-ring', 80, 30, (ctx) => {
    ctx.beginPath();
    ctx.ellipse(40, 15, 36, 11, 0, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(244,226,186,0.9)';
    ctx.stroke();
  });

  makeCanvasTexture(scene, 'fx-print', 14, 8, (ctx) => {
    ctx.fillStyle = 'rgba(120,78,40,0.9)';
    ctx.beginPath();
    ctx.ellipse(7, 4, 6, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  makeCanvasTexture(scene, 'fx-mote', 16, 16, (ctx) => radialBlob(ctx, 8, 8, 8, '255,230,170', 1));
  makeCanvasTexture(scene, 'fx-glow', 128, 128, (ctx) => radialBlob(ctx, 64, 64, 64, '255,170,70', 0.9));

  makeCanvasTexture(scene, 'fx-glint', 24, 24, (ctx) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.quadraticCurveTo(12, 12, 24, 12);
    ctx.quadraticCurveTo(12, 12, 12, 24);
    ctx.quadraticCurveTo(12, 12, 0, 12);
    ctx.quadraticCurveTo(12, 12, 12, 0);
    ctx.fill();
  });

  makeCanvasTexture(scene, 'fx-bird', 30, 14, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(1, 10);
    ctx.quadraticCurveTo(8, 0, 15, 9);
    ctx.quadraticCurveTo(22, 0, 29, 10);
    outline(ctx, 'rgba(40,20,40,0.85)', 2.4);
  });

  // Wall torch: iron cup on a stick, and a flame that is animated by the level.
  makeCanvasTexture(scene, 'prop-torch', 20, 44, (ctx) => {
    ctx.fillStyle = '#4a3a30';
    ctx.fillRect(8, 14, 4, 30);
    ctx.beginPath();
    ctx.moveTo(2, 4);
    ctx.lineTo(18, 4);
    ctx.lineTo(14, 16);
    ctx.lineTo(6, 16);
    ctx.closePath();
    ctx.fillStyle = '#2f2724';
    ctx.fill();
    outline(ctx, INK, 1.6);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(4, 5, 4, 3);
  });

  makeCanvasTexture(scene, 'prop-flame', 20, 32, (ctx) => {
    const flame = (cx, bottom, w, h, color) => {
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, bottom);
      ctx.quadraticCurveTo(cx - w / 2, bottom - h * 0.5, cx, bottom - h);
      ctx.quadraticCurveTo(cx + w / 2, bottom - h * 0.5, cx + w / 2, bottom);
      ctx.quadraticCurveTo(cx, bottom + 3, cx - w / 2, bottom);
      ctx.fillStyle = color;
      ctx.fill();
    };
    flame(10, 28, 18, 28, '#E8541E');
    flame(10, 28, 12, 20, '#FFA21F');
    flame(10, 28, 6, 11, '#FFE680');
  });

  // Hanging Ajrak banner with a swallow-tail end. Origin: top centre.
  makeCanvasTexture(scene, 'prop-banner', 48, 120, (ctx) => {
    const cloth = () => {
      ctx.beginPath();
      ctx.moveTo(5, 8);
      ctx.lineTo(43, 8);
      ctx.lineTo(43, 112);
      ctx.lineTo(24, 98);
      ctx.lineTo(5, 112);
      ctx.closePath();
    };
    cloth();
    fillAjrak(ctx, 30);
    ctx.save();
    cloth();
    ctx.clip();
    const g = ctx.createLinearGradient(0, 0, 48, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 48, 120);
    ctx.restore();
    cloth();
    outline(ctx, INK, 2.4);
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(0, 2, 48, 8);
    outline(ctx, INK, 1.6);
    ctx.strokeRect(0, 2, 48, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(2, 3, 44, 2);
  });
}
