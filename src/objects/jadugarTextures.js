import { makeCanvasTexture, celShape, outline, INK } from '../fx/canvasUtil.js';
import { drawAjrakBand, AJRAK } from '../fx/ajrakPattern.js';

// Jadugar Hacker, drawn in code as separate parts (a short, round, funny wizard. Not a robot!).
//   jadugar-robe  jadugar-head  jadugar-hat  jadugar-moustache  jadugar-eye  jadugar-brow
//   jadugar-smirk  jadugar-laugh  jadugar-hand  jadugar-ball  prop-ledge
const PURPLE = { base: '#6B3FA0', shade: '#46276F', light: '#A47BDA' };
const SKIN = { base: '#E8B48A', shade: '#C98C62', light: '#FFD9B8' };

const ellipse = (ctx, cx, cy, rx, ry, rot = 0) => () => {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
};

export function createJadugarTextures(scene) {
  // round robe with an Ajrak hem, a gold belt and Ajrak cuffs
  makeCanvasTexture(scene, 'jadugar-robe', 116, 100, (ctx) => {
    const robe = () => {
      ctx.beginPath();
      ctx.moveTo(12, 94);
      ctx.quadraticCurveTo(0, 52, 24, 26);
      ctx.quadraticCurveTo(58, 2, 92, 26);
      ctx.quadraticCurveTo(116, 52, 104, 94);
      ctx.quadraticCurveTo(58, 102, 12, 94);
      ctx.closePath();
    };
    celShape(ctx, robe, { ...PURPLE, lightShape: ellipse(ctx, 34, 40, 8, 18, 0.3), shadeShift: 5, lineWidth: 3 });
    ctx.save();
    robe();
    ctx.clip();
    drawAjrakBand(ctx, 0, 76, 116, 20);
    ctx.fillStyle = '#E8B84A';
    ctx.fillRect(0, 54, 116, 7);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 61, 116, 3);
    // little stars on the robe
    ctx.fillStyle = '#F5C518';
    [[30, 40], [86, 36], [58, 28], [44, 68], [76, 66]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    robe();
    outline(ctx, INK, 3);
  });

  // head with a big funny nose
  makeCanvasTexture(scene, 'jadugar-head', 66, 58, (ctx) => {
    celShape(ctx, ellipse(ctx, 33, 29, 28, 25), { ...SKIN, lightShape: ellipse(ctx, 22, 16, 8, 3.5, -0.5), lineWidth: 2.8 });
    celShape(ctx, ellipse(ctx, 33, 34, 9, 8), { base: '#EE9C7C', shade: '#C97452', light: '#FFC9AE', lightShape: ellipse(ctx, 30, 31, 3, 2), shadeShift: 2, lineWidth: 2.2 });
    ctx.fillStyle = 'rgba(240,110,110,0.45)';
    ctx.beginPath();
    ctx.ellipse(12, 38, 6, 3.4, 0, 0, Math.PI * 2);
    ctx.ellipse(54, 38, 6, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  makeCanvasTexture(scene, 'jadugar-eye', 16, 16, (ctx) => {
    ellipse(ctx, 8, 8, 6.5, 6.5)();
    ctx.fillStyle = '#FFFBE0';
    ctx.fill();
    outline(ctx, INK, 1.8);
    ctx.fillStyle = '#2A0E40';
    ctx.beginPath();
    ctx.arc(9.5, 8.5, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(8.5, 7.2, 1.2, 0, Math.PI * 2);
    ctx.fill();
  });

  // bushy eyebrow (angled by the game)
  makeCanvasTexture(scene, 'jadugar-brow', 26, 10, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(2, 8);
    ctx.quadraticCurveTo(13, -1, 24, 6);
    ctx.quadraticCurveTo(13, 5, 2, 8);
    ctx.fillStyle = '#4A4458';
    ctx.fill();
    outline(ctx, INK, 1.6);
  });

  // curly moustache
  makeCanvasTexture(scene, 'jadugar-moustache', 76, 30, (ctx) => {
    const half = (dir) => {
      ctx.save();
      ctx.translate(38, 0);
      ctx.scale(dir, 1);
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.quadraticCurveTo(14, 2, 26, 8);
      ctx.quadraticCurveTo(36, 12, 34, 22);
      ctx.quadraticCurveTo(32, 28, 26, 24);
      ctx.quadraticCurveTo(30, 20, 26, 17);
      ctx.quadraticCurveTo(14, 16, 0, 18);
      ctx.closePath();
      ctx.fillStyle = '#4A4458';
      ctx.fill();
      outline(ctx, INK, 2);
      ctx.restore();
    };
    half(1);
    half(-1);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(10, 8, 18, 2);
  });

  const mouth = (key, w, h, open) =>
    makeCanvasTexture(scene, key, w, h, (ctx) => {
      ctx.beginPath();
      if (open) {
        ctx.moveTo(2, 3);
        ctx.quadraticCurveTo(w / 2, h * 1.5, w - 2, 3);
        ctx.quadraticCurveTo(w / 2, 6, 2, 3);
        ctx.fillStyle = '#4A0E40';
        ctx.fill();
        ctx.fillStyle = '#F4707F';
        ctx.beginPath();
        ctx.ellipse(w / 2, h - 5, 6, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(2, 3);
        ctx.quadraticCurveTo(w / 2, h * 1.5, w - 2, 3);
        ctx.quadraticCurveTo(w / 2, 6, 2, 3);
      } else {
        // a one-sided smirk
        ctx.moveTo(2, 7);
        ctx.quadraticCurveTo(w / 2, 11, w - 3, 2);
      }
      outline(ctx, INK, 2.2);
    });
  mouth('jadugar-smirk', 26, 14, false);
  mouth('jadugar-laugh', 30, 22, true);

  makeCanvasTexture(scene, 'jadugar-hand', 22, 22, (ctx) => {
    celShape(ctx, ellipse(ctx, 11, 11, 8, 8), { ...SKIN, lightShape: ellipse(ctx, 8, 8, 3, 2), shadeShift: 2, lineWidth: 2.2 });
    ctx.beginPath();
    ctx.ellipse(17, 8, 3.4, 4.6, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = SKIN.base;
    ctx.fill();
    outline(ctx, INK, 1.8);
  });

  // pointy hat with a bent tip, a gold star and an Ajrak band
  makeCanvasTexture(scene, 'jadugar-hat', 90, 100, (ctx) => {
    const cone = () => {
      ctx.beginPath();
      ctx.moveTo(10, 88);
      ctx.quadraticCurveTo(24, 62, 36, 42);
      ctx.quadraticCurveTo(46, 20, 72, 8);
      ctx.quadraticCurveTo(64, 26, 66, 44);
      ctx.quadraticCurveTo(72, 68, 80, 88);
      ctx.closePath();
    };
    celShape(ctx, cone, { ...PURPLE, lightShape: ellipse(ctx, 30, 62, 4, 14, 0.4), shadeShift: 5, lineWidth: 3 });
    ctx.save();
    cone();
    ctx.clip();
    drawAjrakBand(ctx, 0, 68, 90, 16);
    ctx.restore();
    cone();
    outline(ctx, INK, 3);
    // brim
    celShape(ctx, ellipse(ctx, 45, 88, 42, 9), { ...PURPLE, shadeShift: 3, lineWidth: 3 });
    // gold star
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 8 : 3.4;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(46 + Math.cos(a) * r, 52 + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = '#F5C518';
    ctx.fill();
    outline(ctx, INK, 1.6);
  });

  // the crystal ball
  makeCanvasTexture(scene, 'jadugar-ball', 64, 64, (ctx) => {
    const g = ctx.createRadialGradient(24, 22, 4, 32, 32, 30);
    g.addColorStop(0, '#E9FBFF');
    g.addColorStop(0.35, '#8FE0FF');
    g.addColorStop(0.75, '#9A6AE0');
    g.addColorStop(1, '#5A2FA0');
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    // swirl inside
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(34, 36, 12, 0.3, 4.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(34, 36, 6, 3.4, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    outline(ctx, INK, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(21, 18, 8, 4, -0.6, 0, Math.PI * 2);
    ctx.fill();
  });

  // a stone ledge on the wall for the Jadugar to stand on
  makeCanvasTexture(scene, 'prop-ledge', 150, 44, (ctx) => {
    const slab = () => {
      ctx.beginPath();
      ctx.moveTo(6, 8);
      ctx.lineTo(144, 8);
      ctx.lineTo(138, 38);
      ctx.lineTo(12, 38);
      ctx.closePath();
    };
    celShape(ctx, slab, { base: '#C9A878', shade: '#8F7248', light: '#E8CFA0', lightShape: ellipse(ctx, 60, 12, 50, 3), shadeShift: 3, lineWidth: 3 });
    ctx.strokeStyle = 'rgba(90,60,30,0.5)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    [[36, 16, 34, 38], [76, 16, 78, 38], [112, 16, 110, 38]].forEach(([a, b, c, d]) => {
      ctx.moveTo(a, b);
      ctx.lineTo(c, d);
    });
    ctx.stroke();
  });

  void AJRAK;
}
