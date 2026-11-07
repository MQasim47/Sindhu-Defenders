import { makeCanvasTexture, celShape, outline, INK } from '../fx/canvasUtil.js';

// Mithu the parrot, drawn in code as separate parts (same outline + cel style as Dodo).
//   mithu-body  mithu-wing  mithu-beak  mithu-eye  mithu-cheek  mithu-tail
const GREEN = { base: '#4FBF4A', shade: '#2E8F3C', light: '#9BEA80' };

const ellipse = (ctx, cx, cy, rx, ry, rot = 0) => () => {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
};

export function createMithuTextures(scene) {
  // body + head in one picture. The head circle is centred at (28,20), the body at (28,42).
  makeCanvasTexture(scene, 'mithu-body', 56, 62, (ctx) => {
    celShape(ctx, ellipse(ctx, 28, 43, 17, 16), { ...GREEN, lineWidth: 2.6 });
    ctx.save();
    ellipse(ctx, 28, 43, 17, 16)();
    ctx.clip();
    ctx.fillStyle = '#CFF08C';
    ellipse(ctx, 32, 47, 10, 11)();
    ctx.fill();
    ctx.restore();
    celShape(ctx, ellipse(ctx, 28, 20, 18, 17), {
      ...GREEN,
      lightShape: ellipse(ctx, 20, 11, 7, 3.5, -0.5),
      lineWidth: 2.8,
    });
    // little crest feathers
    ['#E04A3A', '#F5C518'].forEach((c, i) => {
      ctx.beginPath();
      ctx.ellipse(24 + i * 6, 4, 2.6, 5.5, -0.4 + i * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
      outline(ctx, INK, 1.6);
    });
  });

  makeCanvasTexture(scene, 'mithu-eye', 16, 18, (ctx) => {
    ctx.beginPath();
    ctx.ellipse(8, 9, 7, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.fillStyle = '#1B0F0D';
    ctx.beginPath();
    ctx.ellipse(9, 10, 4.6, 5.6, 0, 0, Math.PI * 2);
    ctx.fill();
    outline(ctx, INK, 1.6);
    ctx.ellipse(8, 9, 7, 8, 0, 0, Math.PI * 2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(7.2, 7, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10.6, 12.2, 1.1, 0, Math.PI * 2);
    ctx.fill();
  });

  makeCanvasTexture(scene, 'mithu-beak', 20, 18, (ctx) => {
    const beak = () => {
      ctx.beginPath();
      ctx.moveTo(2, 3);
      ctx.quadraticCurveTo(14, 0, 18, 9);
      ctx.quadraticCurveTo(17, 16, 10, 16);
      ctx.quadraticCurveTo(13, 10, 2, 10);
      ctx.closePath();
    };
    celShape(ctx, beak, { base: '#FF7A35', shade: '#D9501E', light: '#FFB070', lightShape: ellipse(ctx, 8, 4, 4, 1.4), shadeShift: 2, lineWidth: 2.2 });
  });

  makeCanvasTexture(scene, 'mithu-cheek', 14, 10, (ctx) => {
    ellipse(ctx, 7, 5, 5.5, 3.6)();
    ctx.fillStyle = '#FFD84A';
    ctx.fill();
    outline(ctx, '#C99A1E', 1.2);
  });

  makeCanvasTexture(scene, 'mithu-wing', 34, 30, (ctx) => {
    const wing = () => {
      ctx.beginPath();
      ctx.moveTo(3, 5);
      ctx.quadraticCurveTo(20, -3, 32, 13);
      ctx.quadraticCurveTo(27, 28, 9, 26);
      ctx.quadraticCurveTo(0, 18, 3, 5);
      ctx.closePath();
    };
    celShape(ctx, wing, { base: '#2F9E3F', shade: '#1F7430', light: '#7FE070', lightShape: ellipse(ctx, 12, 8, 7, 2.2, -0.3), lineWidth: 2.4 });
    ctx.save();
    wing();
    ctx.clip();
    ctx.fillStyle = '#3A7BD5';
    ctx.beginPath();
    ctx.moveTo(18, 30);
    ctx.quadraticCurveTo(24, 16, 34, 12);
    ctx.lineTo(34, 30);
    ctx.fill();
    ctx.restore();
    wing();
    outline(ctx, INK, 2.4);
  });

  // three long tail feathers, hanging from the top centre
  makeCanvasTexture(scene, 'mithu-tail', 30, 46, (ctx) => {
    [
      [-0.5, '#3A7BD5'],
      [0.5, '#F5C518'],
      [0, '#E04A3A'],
    ].forEach(([rot, color]) => {
      ctx.save();
      ctx.translate(15, 2);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 20, 5.4, 20, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      outline(ctx, INK, 2);
      ctx.restore();
    });
  });
}
