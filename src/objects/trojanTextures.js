import { makeCanvasTexture, celShape, outline, INK } from '../fx/canvasUtil.js';
import { drawAjrakBand } from '../fx/ajrakPattern.js';

// Trojan Ghoda (wooden horse on wheels), the FREE gifts, the bugs and the Antivirus Jharoo.
//   trojan-horse  trojan-hatch  trojan-wheel  gift-box  gift-ghost  bug  prop-broom  fx-swirl
const WOOD = { base: '#B9824A', shade: '#8A5A2E', light: '#DDA866' };

const ellipse = (ctx, cx, cy, rx, ry, rot = 0) => () => {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
};

export function createTrojanTextures(scene) {
  makeCanvasTexture(scene, 'trojan-wheel', 40, 40, (ctx) => {
    celShape(ctx, ellipse(ctx, 20, 20, 17, 17), { base: '#8A5A2E', shade: '#5E3A1A', light: '#C28A52', lightShape: ellipse(ctx, 14, 12, 6, 3), shadeShift: 2.5, lineWidth: 3 });
    ctx.strokeStyle = '#4A2C12';
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(20 - Math.cos(a) * 15, 20 - Math.sin(a) * 15);
      ctx.lineTo(20 + Math.cos(a) * 15, 20 + Math.sin(a) * 15);
      ctx.stroke();
    }
    celShape(ctx, ellipse(ctx, 20, 20, 5, 5), { base: '#E8B84A', shade: '#B88A1E', shadeShift: 1.5, lineWidth: 2 });
  });

  // the wooden horse, side view, facing right. The belly has a dark opening for the hatch.
  makeCanvasTexture(scene, 'trojan-horse', 176, 150, (ctx) => {
    // legs
    [[34, 12], [56, 12], [104, 12], [126, 12]].forEach(([x, w]) => {
      celShape(ctx, () => {
        ctx.beginPath();
        ctx.moveTo(x, 80);
        ctx.lineTo(x + w, 80);
        ctx.lineTo(x + w - 1, 126);
        ctx.lineTo(x + 1, 126);
        ctx.closePath();
      }, { ...WOOD, shadeShift: 2, lineWidth: 2.6 });
    });
    // platform
    celShape(ctx, () => {
      ctx.beginPath();
      ctx.rect(14, 124, 148, 16);
    }, { ...WOOD, lightShape: ellipse(ctx, 70, 128, 50, 2), shadeShift: 3, lineWidth: 3 });
    // tail
    ctx.beginPath();
    ctx.moveTo(34, 50);
    ctx.quadraticCurveTo(10, 56, 14, 92);
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 5.4;
    ctx.strokeStyle = '#8E1B2B';
    ctx.stroke();
    // body
    const body = () => {
      ctx.beginPath();
      ctx.ellipse(86, 62, 56, 36, 0, 0, Math.PI * 2);
    };
    celShape(ctx, body, { ...WOOD, lightShape: ellipse(ctx, 62, 40, 30, 5, -0.2), shadeShift: 5, lineWidth: 3.2 });
    ctx.save();
    body();
    ctx.clip();
    ctx.strokeStyle = 'rgba(70,40,15,0.55)';
    ctx.lineWidth = 2;
    [38, 52, 66, 80].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(160, y);
      ctx.stroke();
    });
    // Ajrak blanket on the back
    drawAjrakBand(ctx, 40, 28, 90, 16);
    // dark belly opening (the hatch covers it)
    ctx.fillStyle = '#2A1408';
    ctx.fillRect(64, 82, 48, 20);
    ctx.restore();
    body();
    outline(ctx, INK, 3.2);
    // neck and head
    const head = () => {
      ctx.beginPath();
      ctx.moveTo(110, 48);
      ctx.quadraticCurveTo(122, 18, 134, 6);
      ctx.quadraticCurveTo(150, 2, 160, 14);
      ctx.quadraticCurveTo(172, 30, 170, 44);
      ctx.quadraticCurveTo(162, 52, 152, 46);
      ctx.quadraticCurveTo(144, 36, 138, 40);
      ctx.quadraticCurveTo(138, 60, 122, 74);
      ctx.closePath();
    };
    celShape(ctx, head, { ...WOOD, lightShape: ellipse(ctx, 144, 14, 12, 3.5, 0.4), shadeShift: 4, lineWidth: 3.2 });
    // mane (Ajrak colours)
    ctx.beginPath();
    ctx.moveTo(114, 48);
    ctx.quadraticCurveTo(122, 22, 134, 8);
    ctx.lineWidth = 9;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 5.6;
    ctx.strokeStyle = '#1C2457';
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    // ear, eye, nostril
    celShape(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(138, 8);
      ctx.lineTo(142, -2);
      ctx.lineTo(148, 8);
      ctx.closePath();
    }, { ...WOOD, shadeShift: 1.5, lineWidth: 2.4 });
    ctx.fillStyle = '#FFFBE0';
    ctx.beginPath();
    ctx.arc(150, 20, 5.4, 0, Math.PI * 2);
    ctx.fill();
    outline(ctx, INK, 1.8);
    ctx.fillStyle = '#2A0E40';
    ctx.beginPath();
    ctx.arc(151.5, 20.5, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4A2C12';
    ctx.beginPath();
    ctx.arc(166, 36, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // the belly door (hinge on the left)
  makeCanvasTexture(scene, 'trojan-hatch', 52, 24, (ctx) => {
    celShape(ctx, () => {
      ctx.beginPath();
      ctx.rect(2, 3, 48, 18);
    }, { ...WOOD, lightShape: ellipse(ctx, 26, 6, 20, 1.6), shadeShift: 2, lineWidth: 2.6 });
    ctx.strokeStyle = 'rgba(70,40,15,0.6)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(2, 12);
    ctx.lineTo(50, 12);
    ctx.stroke();
    ctx.fillStyle = '#4A3A30';
    [[6, 6], [6, 18]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // a shiny FREE gift: gold box, crimson ribbon, tag
  makeCanvasTexture(scene, 'gift-box', 66, 62, (ctx) => {
    celShape(ctx, () => {
      ctx.beginPath();
      ctx.rect(6, 22, 36, 32);
    }, { base: '#FFD24A', shade: '#E39A1E', light: '#FFF2B0', lightShape: ellipse(ctx, 14, 30, 3, 8), shadeShift: 3, lineWidth: 3 });
    celShape(ctx, () => {
      ctx.beginPath();
      ctx.rect(3, 15, 42, 11);
    }, { base: '#FFE066', shade: '#E8A21E', shadeShift: 2, lineWidth: 2.8 });
    ctx.fillStyle = '#D12F3A';
    ctx.fillRect(21, 15, 6, 39);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(21, 15, 6, 39);
    // bow
    [[-1], [1]].forEach(([d]) => {
      celShape(ctx, () => {
        ctx.beginPath();
        ctx.ellipse(24 + d * 8, 11, 8, 5.4, d * -0.4, 0, Math.PI * 2);
      }, { base: '#E23B4A', shade: '#A01E2E', shadeShift: 1.5, lineWidth: 2.2 });
    });
    celShape(ctx, ellipse(ctx, 24, 13, 3.6, 3.6), { base: '#E23B4A', shade: '#A01E2E', shadeShift: 1, lineWidth: 2 });
    // FREE tag
    ctx.save();
    ctx.translate(40, 32);
    ctx.rotate(0.2);
    celShape(ctx, () => {
      ctx.beginPath();
      ctx.rect(0, 0, 24, 14);
    }, { base: '#FFFFFF', shade: '#E0D8C8', shadeShift: 1, lineWidth: 2 });
    ctx.fillStyle = '#D12F3A';
    ctx.font = '700 10px Fredoka, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FREE', 12, 8);
    ctx.restore();
  });

  // the same gift, but the wrapping is see-through and bugs are inside
  makeCanvasTexture(scene, 'gift-ghost', 66, 62, (ctx) => {
    ctx.setLineDash([5, 3]);
    ctx.fillStyle = 'rgba(190,230,255,0.28)';
    ctx.fillRect(6, 22, 36, 32);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.4;
    ctx.strokeRect(6, 22, 36, 32);
    ctx.fillRect(3, 15, 42, 11);
    ctx.strokeRect(3, 15, 42, 11);
    ctx.setLineDash([]);
    [[16, 40], [30, 36], [24, 47]].forEach(([x, y], i) => {
      ctx.beginPath();
      ctx.ellipse(x, y, 5.4, 4.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = i === 1 ? '#8E52D6' : '#6CC04A';
      ctx.fill();
      outline(ctx, INK, 1.5);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x - 1.8, y - 1, 1.2, 0, Math.PI * 2);
      ctx.arc(x + 1.8, y - 1, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // a cartoon bug (a computer bug that is cute but annoying)
  makeCanvasTexture(scene, 'bug', 34, 28, (ctx) => {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    [[8, 20, 2, 26], [17, 22, 17, 27], [26, 20, 32, 26], [8, 14, 1, 14], [26, 14, 33, 14]].forEach(([a, b, c, d]) => {
      ctx.beginPath();
      ctx.moveTo(a, b);
      ctx.lineTo(c, d);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(12, 6);
    ctx.quadraticCurveTo(8, 0, 4, 1);
    ctx.moveTo(22, 6);
    ctx.quadraticCurveTo(26, 0, 30, 1);
    ctx.stroke();
    celShape(ctx, ellipse(ctx, 17, 15, 12, 9), { base: '#6CC04A', shade: '#3F8A2A', light: '#B4F08A', lightShape: ellipse(ctx, 12, 11, 4, 2), shadeShift: 2.5, lineWidth: 2.6 });
    ctx.fillStyle = '#8E52D6';
    [[14, 17], [21, 18], [18, 13]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(12, 9, 3.4, 0, Math.PI * 2);
    ctx.arc(22, 9, 3.4, 0, Math.PI * 2);
    ctx.fill();
    outline(ctx, INK, 1.6);
    ctx.fillStyle = '#2A0E40';
    ctx.beginPath();
    ctx.arc(12.8, 9.4, 1.6, 0, Math.PI * 2);
    ctx.arc(22.8, 9.4, 1.6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Antivirus Jharoo (broom). Origin: the handle top.
  makeCanvasTexture(scene, 'prop-broom', 30, 86, (ctx) => {
    celShape(ctx, () => {
      ctx.beginPath();
      ctx.rect(12, 2, 6, 52);
    }, { base: '#B9824A', shade: '#8A5A2E', shadeShift: 1.5, lineWidth: 2.4 });
    celShape(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(10, 48);
      ctx.lineTo(20, 48);
      ctx.lineTo(28, 84);
      ctx.lineTo(2, 84);
      ctx.closePath();
    }, { base: '#E8C86A', shade: '#C9A03A', light: '#FFF0A8', lightShape: ellipse(ctx, 10, 62, 2, 12), shadeShift: 3, lineWidth: 2.6 });
    ctx.strokeStyle = 'rgba(120,80,20,0.6)';
    ctx.lineWidth = 1.2;
    [[8, 54, 6, 84], [15, 54, 15, 84], [22, 54, 24, 84]].forEach(([a, b, c, d]) => {
      ctx.beginPath();
      ctx.moveTo(a, b);
      ctx.lineTo(c, d);
      ctx.stroke();
    });
    ctx.fillStyle = '#3A7BD5';
    ctx.fillRect(9, 46, 12, 7);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(9, 46, 12, 7);
  });

  // magic swirl for the gate (additive)
  makeCanvasTexture(scene, 'fx-swirl', 160, 160, (ctx) => {
    const g = ctx.createRadialGradient(80, 80, 4, 80, 80, 78);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.3, 'rgba(190,120,255,0.8)');
    g.addColorStop(1, 'rgba(110,40,200,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 160, 160);
    ctx.lineCap = 'round';
    for (let arm = 0; arm < 3; arm++) {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const a = arm * 2.094 + t * 5.2;
        const r = 6 + t * 68;
        const x = 80 + Math.cos(a) * r;
        const y = 80 + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = 7;
      ctx.strokeStyle = 'rgba(255,230,255,0.85)';
      ctx.stroke();
    }
  });
}
