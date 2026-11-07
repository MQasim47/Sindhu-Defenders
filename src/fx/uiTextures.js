import { makeCanvasTexture, celShape, outline, INK, newCanvas } from './canvasUtil.js';

const ellipse = (ctx, cx, cy, rx, ry) => () => {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
};

function starPath(ctx, cx, cy, outer, inner) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Textures for the lantern, coins, hearts, icons and the spam blob.
export function createGameTextures(scene) {
  makeCanvasTexture(scene, 'ui-coin', 40, 40, (ctx) => {
    celShape(ctx, ellipse(ctx, 20, 20, 16, 16), { base: '#FFD24A', shade: '#D99A1E', light: '#FFF0A8', lightShape: ellipse(ctx, 13, 12, 6, 3), shadeShift: 3, lineWidth: 3 });
    ctx.beginPath();
    ctx.arc(20, 20, 10.5, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#C98A1A';
    ctx.stroke();
    starPath(ctx, 20, 20.5, 6.5, 3);
    ctx.fillStyle = '#E8A21E';
    ctx.fill();
  });

  makeCanvasTexture(scene, 'fx-heart', 26, 24, (ctx) => {
    const heart = () => {
      ctx.beginPath();
      ctx.moveTo(13, 22);
      ctx.bezierCurveTo(-4, 11, 3, -2, 13, 6);
      ctx.bezierCurveTo(23, -2, 30, 11, 13, 22);
      ctx.closePath();
    };
    celShape(ctx, heart, { base: '#FF5A78', shade: '#D12F54', light: '#FFB0C0', lightShape: ellipse(ctx, 8, 8, 3, 2), shadeShift: 2, lineWidth: 2.2 });
  });

  makeCanvasTexture(scene, 'fx-check', 30, 30, (ctx) => {
    celShape(ctx, ellipse(ctx, 15, 15, 12, 12), { base: '#3DBE6B', shade: '#228A48', shadeShift: 2.5, lineWidth: 2.6 });
    ctx.beginPath();
    ctx.moveTo(8.5, 15.5);
    ctx.lineTo(13.5, 20);
    ctx.lineTo(22, 10);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.6;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
  });

  makeCanvasTexture(scene, 'ui-star', 68, 66, (ctx) => {
    celShape(ctx, () => starPath(ctx, 34, 35, 30, 14), { base: '#FFD24A', shade: '#E39A1E', light: '#FFF2B0', lightShape: ellipse(ctx, 26, 22, 8, 4), shadeShift: 3.5, lineWidth: 3.4 });
  });
  makeCanvasTexture(scene, 'ui-star-off', 68, 66, (ctx) => {
    celShape(ctx, () => starPath(ctx, 34, 35, 30, 14), { base: '#7C7480', shade: '#5A5460', shadeShift: 3, ink: '#2E2832', lineWidth: 3.4 });
  });

  // Globe for the language button
  makeCanvasTexture(scene, 'ui-globe', 72, 72, (ctx) => {
    celShape(ctx, ellipse(ctx, 36, 36, 29, 29), { base: '#3FA9E8', shade: '#1E6FB5', light: '#9BDCFF', lightShape: ellipse(ctx, 26, 22, 10, 5), shadeShift: 4, lineWidth: 3.4 });
    ctx.save();
    ellipse(ctx, 36, 36, 29, 29)();
    ctx.clip();
    ctx.fillStyle = '#4CC06A';
    [[22, 26, 9, 12], [48, 32, 8, 10], [38, 52, 10, 7]].forEach(([x, y, rx, ry]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(36, 36, 13, 29, 0, 0, Math.PI * 2);
    ctx.moveTo(7, 36);
    ctx.lineTo(65, 36);
    ctx.stroke();
    ctx.restore();
    ellipse(ctx, 36, 36, 29, 29)();
    outline(ctx, INK, 3.4);
  });

  // HUD icons
  makeCanvasTexture(scene, 'icon-caught', 48, 52, (ctx) => {
    const shield = () => {
      ctx.beginPath();
      ctx.moveTo(24, 3);
      ctx.lineTo(44, 10);
      ctx.lineTo(42, 28);
      ctx.quadraticCurveTo(38, 42, 24, 49);
      ctx.quadraticCurveTo(10, 42, 6, 28);
      ctx.lineTo(4, 10);
      ctx.closePath();
    };
    celShape(ctx, shield, { base: '#3DBE6B', shade: '#228A48', light: '#8CF0A8', lightShape: ellipse(ctx, 15, 14, 6, 3), shadeShift: 3, lineWidth: 3 });
    ctx.beginPath();
    ctx.moveTo(14, 25);
    ctx.lineTo(21, 32);
    ctx.lineTo(34, 17);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
  });
  makeCanvasTexture(scene, 'icon-sneaked', 48, 52, (ctx) => {
    celShape(ctx, ellipse(ctx, 24, 28, 19, 19), { base: '#8E52D6', shade: '#5E2FA0', light: '#C09AF5', lightShape: ellipse(ctx, 16, 18, 6, 3), shadeShift: 3, lineWidth: 3 });
    ctx.fillStyle = '#FFFBE0';
    ctx.beginPath();
    ctx.ellipse(16.5, 26, 4.5, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(31.5, 26, 4.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2A0E40';
    ctx.beginPath();
    ctx.arc(17.5, 27, 2.4, 0, Math.PI * 2);
    ctx.arc(30.5, 27, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, 20);
    ctx.lineTo(20, 23);
    ctx.moveTo(38, 20);
    ctx.lineTo(28, 23);
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(15, 37);
    ctx.quadraticCurveTo(24, 42, 33, 37);
    ctx.stroke();
    [[18, 8, -0.4], [30, 8, 0.4]].forEach(([x, y, r]) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r);
      ctx.beginPath();
      ctx.moveTo(-4, 4);
      ctx.lineTo(0, -6);
      ctx.lineTo(4, 4);
      ctx.fillStyle = '#F0C44A';
      ctx.fill();
      outline(ctx, INK, 1.8);
      ctx.restore();
    });
  });

  // Brass lantern held by Dodo. Origin: top (the handle).
  makeCanvasTexture(scene, 'prop-lantern', 24, 34, (ctx) => {
    ctx.beginPath();
    ctx.arc(12, 5, 5, Math.PI, 0);
    outline(ctx, '#7A5418', 2);
    celShape(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(5, 8);
      ctx.lineTo(19, 8);
      ctx.lineTo(17, 12);
      ctx.lineTo(7, 12);
      ctx.closePath();
    }, { base: '#D9A63A', shade: '#A0701C', shadeShift: 1.5, lineWidth: 2 });
    celShape(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(7, 12);
      ctx.lineTo(17, 12);
      ctx.lineTo(19, 26);
      ctx.lineTo(5, 26);
      ctx.closePath();
    }, { base: '#FFE9A0', shade: '#FFC94D', light: '#FFFFFF', lightShape: ellipse(ctx, 10, 17, 2, 4), shadeShift: 3, lineWidth: 2 });
    celShape(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(4, 26);
      ctx.lineTo(20, 26);
      ctx.lineTo(18, 31);
      ctx.lineTo(6, 31);
      ctx.closePath();
    }, { base: '#D9A63A', shade: '#A0701C', shadeShift: 1.5, lineWidth: 2 });
    ctx.strokeStyle = 'rgba(122,84,24,0.9)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(12, 12);
    ctx.lineTo(12, 26);
    ctx.stroke();
  });

  // The light cone. Apex at the left middle, 420 long.
  makeCanvasTexture(scene, 'fx-cone', 420, 450, (ctx) => {
    const c = newCanvas(420, 450);
    const k = c.getContext('2d');
    const half = Math.tan(0.5) * 420;
    k.beginPath();
    k.moveTo(0, 225);
    k.lineTo(420, 225 - half);
    k.lineTo(420, 225 + half);
    k.closePath();
    const g = k.createRadialGradient(0, 225, 10, 0, 225, 420);
    g.addColorStop(0, 'rgba(255,236,170,0.85)');
    g.addColorStop(0.5, 'rgba(255,205,110,0.4)');
    g.addColorStop(1, 'rgba(255,190,90,0)');
    k.fillStyle = g;
    k.fill();
    ctx.filter = 'blur(7px)';
    ctx.drawImage(c, 0, 0);
  });

  // Sticky spam blob (thrown at Dodo). Origin: centre.
  makeCanvasTexture(scene, 'spam-blob', 40, 32, (ctx) => {
    const blob = () => {
      ctx.beginPath();
      ctx.moveTo(4, 24);
      ctx.quadraticCurveTo(0, 10, 12, 6);
      ctx.quadraticCurveTo(22, 0, 31, 7);
      ctx.quadraticCurveTo(40, 14, 35, 25);
      ctx.quadraticCurveTo(20, 32, 4, 24);
      ctx.closePath();
    };
    celShape(ctx, blob, { base: '#9BD83A', shade: '#6AA11E', light: '#D4F580', lightShape: ellipse(ctx, 13, 11, 5, 2.4), shadeShift: 3, lineWidth: 2.6 });
    ctx.fillStyle = '#5A3A90';
    ctx.beginPath();
    ctx.arc(16, 17, 2.4, 0, Math.PI * 2);
    ctx.arc(26, 17, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(10, 9, 1.6, 0, Math.PI * 2);
    ctx.fill();
  });

  // "SPAM" goo stain on the ground (shown under Dodo while he is slowed)
  makeCanvasTexture(scene, 'fx-goo', 70, 26, (ctx) => {
    ctx.fillStyle = 'rgba(120,190,40,0.7)';
    ctx.beginPath();
    ctx.ellipse(35, 13, 33, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(190,240,110,0.6)';
    ctx.beginPath();
    ctx.ellipse(28, 10, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}
