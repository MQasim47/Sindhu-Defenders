import { makeCanvasTexture, celShape, outline, INK } from '../fx/canvasUtil.js';

// Villagers (Chacha, Amma, Bacha) and the purple Behroopia blob, drawn in code.
//   npc-<kind>-head / -body / -hat / -prop   for kind = chacha | amma | bacha
//   npc-foot  npc-hand  npc-badge  npc-tail
//   behroopia-blob  behroopia-eye  behroopia-mouth
// Every key can be replaced later by a real PNG with the same name.

const ellipse = (ctx, cx, cy, rx, ry, rot = 0) => () => {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
};

const SKIN = {
  chacha: { base: '#D9A070', shade: '#B97C50', light: '#F0C79A' },
  amma: { base: '#E3B188', shade: '#C28A62', light: '#F6D3B2' },
  bacha: { base: '#F2BA8C', shade: '#DC9468', light: '#FFE0C6' },
};

export function createNpcTextures(scene) {
  makeCanvasTexture(scene, 'npc-foot', 18, 10, (ctx) => {
    celShape(ctx, ellipse(ctx, 9, 6, 7.5, 4), { base: '#8A5230', shade: '#5E3420', light: '#C98450', lightShape: ellipse(ctx, 7, 4.5, 3, 1), shadeShift: 1.5, lineWidth: 2 });
  });
  makeCanvasTexture(scene, 'npc-hand', 14, 14, (ctx) => {
    celShape(ctx, ellipse(ctx, 7, 7, 5.5, 5.5), { ...SKIN.chacha, lightShape: ellipse(ctx, 5, 5, 2, 1.5), shadeShift: 1.5, lineWidth: 2 });
  });
  // happy squinting eyes (^ ^), shown while the lantern shines on a villager
  makeCanvasTexture(scene, 'npc-squint', 40, 10, (ctx) => {
    ctx.strokeStyle = '#2A150F';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    [[8, 16], [24, 32]].forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(a - 1, 8);
      ctx.quadraticCurveTo((a + b) / 2 - 1, -1, b - 1, 8);
      ctx.stroke();
    });
  });
  makeCanvasTexture(scene, 'npc-badge', 14, 14, (ctx) => {
    ctx.beginPath();
    ctx.arc(7, 7, 5.6, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    outline(ctx, INK, 1.6);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.arc(7, 7, 2.4, 0, Math.PI * 2);
    ctx.fill();
  });
  // the small purple tail that gives Behroopia away
  makeCanvasTexture(scene, 'npc-tail', 16, 24, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(4, 2);
    ctx.quadraticCurveTo(14, 8, 8, 14);
    ctx.quadraticCurveTo(4, 18, 10, 22);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#8A4FD0';
    ctx.stroke();
  });

  makeChacha(scene);
  makeAmma(scene);
  makeBacha(scene);
  makeBlob(scene);
}

// Face drawn on a 40x38 canvas. opts: { moustache, wrinkles, blush, hair, bigEyes }
function drawHead(ctx, kind, opts = {}) {
  celShape(ctx, ellipse(ctx, 20, 20, 17, 16), { ...SKIN[kind], lightShape: ellipse(ctx, 13, 11, 6, 2.5, -0.5), lineWidth: 2.6 });
  [[-1, 12], [1, 28]].forEach(([, x]) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(x, 20, opts.bigEyes ? 4.6 : 3.6, opts.bigEyes ? 5.4 : 4.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2A150F';
    ctx.beginPath();
    ctx.ellipse(x + 0.6, 20.8, opts.bigEyes ? 3.2 : 2.6, opts.bigEyes ? 4 : 3.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - 0.4, 19, 1.1, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.strokeStyle = opts.browColor || '#3A2418';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  [[8, 15.5], [24, 15.5]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + 1);
    ctx.quadraticCurveTo(x + 4, y - 2, x + 8, y + 1);
    ctx.stroke();
  });
  ctx.fillStyle = '#D68A66';
  ctx.beginPath();
  ctx.ellipse(20, 24.5, 2.2, 1.7, 0, 0, Math.PI * 2);
  ctx.fill();
  if (opts.blush) {
    ctx.fillStyle = 'rgba(240,110,110,0.5)';
    ctx.beginPath();
    ctx.ellipse(8, 26, 4, 2.4, 0, 0, Math.PI * 2);
    ctx.ellipse(32, 26, 4, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#7A3A2A';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(15.5, 29.5);
  ctx.quadraticCurveTo(20, 33.5, 24.5, 29.5);
  ctx.stroke();
  if (opts.moustache) {
    ctx.beginPath();
    ctx.moveTo(8, 28);
    ctx.quadraticCurveTo(14, 23.5, 20, 27);
    ctx.quadraticCurveTo(26, 23.5, 32, 28);
    ctx.quadraticCurveTo(26, 30, 20, 28.6);
    ctx.quadraticCurveTo(14, 30, 8, 28);
    ctx.fillStyle = opts.moustache;
    ctx.fill();
    outline(ctx, INK, 1.4);
  }
  if (opts.wrinkles) {
    ctx.strokeStyle = 'rgba(120,70,50,0.55)';
    ctx.lineWidth = 1.1;
    [[9, 22], [31, 22]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x - 3, y + 6);
      ctx.quadraticCurveTo(x, y + 8, x + 3, y + 6);
      ctx.moveTo(x - 3, y + 8.5);
      ctx.quadraticCurveTo(x, y + 10.5, x + 3, y + 8.5);
      ctx.stroke();
    });
  }
}

function arms(ctx, w, h, sleeve, shade, skin) {
  [[5, -1], [w - 5, 1]].forEach(([x]) => {
    celShape(ctx, ellipse(ctx, x, h * 0.45, 4.6, h * 0.34), { base: sleeve, shade, shadeShift: 1.5, lineWidth: 2 });
    celShape(ctx, ellipse(ctx, x, h * 0.45 + h * 0.3, 3.8, 3.8), { base: skin, shade: '#C28A62', shadeShift: 1.2, lineWidth: 1.8 });
  });
}

function makeChacha(scene) {
  makeCanvasTexture(scene, 'npc-chacha-head', 40, 38, (ctx) => drawHead(ctx, 'chacha', { moustache: '#4A4A4F' }));
  makeCanvasTexture(scene, 'npc-chacha-body', 46, 50, (ctx) => {
    const kameez = () => {
      ctx.beginPath();
      ctx.moveTo(9, 3);
      ctx.quadraticCurveTo(23, 0, 37, 3);
      ctx.lineTo(41, 46);
      ctx.quadraticCurveTo(23, 50, 5, 46);
      ctx.closePath();
    };
    celShape(ctx, kameez, { base: '#EBE0C2', shade: '#C9B98F', light: '#FFF8E2', lightShape: ellipse(ctx, 13, 18, 3, 9), shadeShift: 3.5 });
    // brown waistcoat
    ctx.save();
    kameez();
    ctx.clip();
    ctx.fillStyle = '#7A4B2A';
    ctx.beginPath();
    ctx.moveTo(9, 3);
    ctx.lineTo(18, 3);
    ctx.lineTo(23, 22);
    ctx.lineTo(28, 3);
    ctx.lineTo(37, 3);
    ctx.lineTo(37, 38);
    ctx.lineTo(9, 38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5A3418';
    ctx.fillRect(9, 36, 28, 3);
    ctx.restore();
    kameez();
    outline(ctx, INK, 2.5);
    arms(ctx, 46, 40, '#EBE0C2', '#C9B98F', SKIN.chacha.base);
  });
  // white turban with wraps
  makeCanvasTexture(scene, 'npc-chacha-hat', 56, 34, (ctx) => {
    celShape(ctx, ellipse(ctx, 26, 20, 23, 13), { base: '#F7F4EA', shade: '#CFC9B6', light: '#FFFFFF', lightShape: ellipse(ctx, 17, 12, 8, 3, -0.3), shadeShift: 3 });
    ctx.strokeStyle = 'rgba(120,110,90,0.7)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(6 + i * 2, 16 + i * 4);
      ctx.quadraticCurveTo(26, 8 + i * 4, 46 - i * 2, 16 + i * 4);
      ctx.stroke();
    }
    // loose end of the turban cloth
    celShape(ctx, ellipse(ctx, 49, 25, 6, 8, 0.4), { base: '#F7F4EA', shade: '#CFC9B6', shadeShift: 1.5, lineWidth: 2 });
  });
  // basket with fruit, carried on the head
  makeCanvasTexture(scene, 'npc-chacha-prop', 46, 30, (ctx) => {
    ['#E8541E', '#F5C518', '#D12F3A'].forEach((c, i) => {
      celShape(ctx, ellipse(ctx, 12 + i * 11, 8, 7, 7), { base: c, shade: 'rgba(0,0,0,0.3)', shadeShift: 1.5, lineWidth: 1.8 });
    });
    const basket = () => {
      ctx.beginPath();
      ctx.moveTo(2, 10);
      ctx.lineTo(44, 10);
      ctx.lineTo(38, 28);
      ctx.lineTo(8, 28);
      ctx.closePath();
    };
    celShape(ctx, basket, { base: '#C99552', shade: '#8F6531', light: '#E8BC7A', lightShape: ellipse(ctx, 14, 14, 8, 1.6), shadeShift: 2.5 });
    ctx.save();
    basket();
    ctx.clip();
    ctx.strokeStyle = 'rgba(90,55,20,0.6)';
    ctx.lineWidth = 1.2;
    for (let x = -10; x < 50; x += 7) {
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x + 14, 28);
      ctx.moveTo(x + 14, 10);
      ctx.lineTo(x, 28);
      ctx.stroke();
    }
    ctx.restore();
    basket();
    outline(ctx, INK, 2.2);
  });
}

function makeAmma(scene) {
  makeCanvasTexture(scene, 'npc-amma-head', 40, 38, (ctx) => drawHead(ctx, 'amma', { wrinkles: true, blush: true, browColor: '#9A9A9A' }));
  makeCanvasTexture(scene, 'npc-amma-body', 46, 58, (ctx) => {
    const dress = () => {
      ctx.beginPath();
      ctx.moveTo(9, 3);
      ctx.quadraticCurveTo(23, 0, 37, 3);
      ctx.lineTo(43, 52);
      ctx.quadraticCurveTo(23, 58, 3, 52);
      ctx.closePath();
    };
    celShape(ctx, dress, { base: '#2F8A74', shade: '#1D5E50', light: '#5CC2A8', lightShape: ellipse(ctx, 12, 20, 3, 11), shadeShift: 3.5 });
    ctx.save();
    dress();
    ctx.clip();
    ctx.fillStyle = '#F4EBDD';
    for (let x = 8; x < 44; x += 7) {
      ctx.beginPath();
      ctx.arc(x, 49, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#E8B84A';
    ctx.fillRect(3, 45, 40, 2);
    ctx.restore();
    dress();
    outline(ctx, INK, 2.5);
    arms(ctx, 46, 44, '#2F8A74', '#1D5E50', SKIN.amma.base);
  });
  // headscarf / shawl over the head, with a hole for the face
  makeCanvasTexture(scene, 'npc-amma-hat', 56, 48, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(4, 36);
    ctx.quadraticCurveTo(0, 6, 28, 3);
    ctx.quadraticCurveTo(56, 6, 52, 36);
    ctx.quadraticCurveTo(44, 46, 28, 44);
    ctx.quadraticCurveTo(12, 46, 4, 36);
    ctx.closePath();
    ctx.fillStyle = '#9B3A4B';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(50, 30, 14, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F4EBDD';
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(8 + (i % 6) * 8, 10 + Math.floor(i / 6) * 8, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.ellipse(28, 27, 16, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.ellipse(28, 27, 16, 15, 0, 0, Math.PI * 2);
    outline(ctx, INK, 2.2);
  });
  // walking stick with a curved handle
  makeCanvasTexture(scene, 'npc-amma-prop', 18, 64, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(12, 62);
    ctx.lineTo(12, 10);
    ctx.quadraticCurveTo(12, 3, 6, 3);
    ctx.quadraticCurveTo(2, 3, 2, 8);
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = '#9A6B3A';
    ctx.stroke();
  });
}

function makeBacha(scene) {
  makeCanvasTexture(scene, 'npc-bacha-head', 40, 38, (ctx) => drawHead(ctx, 'bacha', { blush: true, bigEyes: true }));
  makeCanvasTexture(scene, 'npc-bacha-body', 36, 38, (ctx) => {
    const shirt = () => {
      ctx.beginPath();
      ctx.moveTo(7, 3);
      ctx.quadraticCurveTo(18, 0, 29, 3);
      ctx.lineTo(31, 34);
      ctx.quadraticCurveTo(18, 38, 5, 34);
      ctx.closePath();
    };
    celShape(ctx, shirt, { base: '#3B86D0', shade: '#235C9C', light: '#7DB8F0', lightShape: ellipse(ctx, 11, 12, 2.6, 7), shadeShift: 3 });
    ctx.save();
    shirt();
    ctx.clip();
    ctx.fillStyle = '#6B5238';
    ctx.fillRect(0, 26, 36, 14);
    ctx.fillStyle = '#F4EBDD';
    ctx.fillRect(0, 14, 36, 3);
    ctx.restore();
    shirt();
    outline(ctx, INK, 2.4);
    arms(ctx, 36, 32, '#3B86D0', '#235C9C', SKIN.bacha.base);
  });
  // diamond kite with a tail
  makeCanvasTexture(scene, 'npc-bacha-prop', 40, 58, (ctx) => {
    const kite = () => {
      ctx.beginPath();
      ctx.moveTo(20, 2);
      ctx.lineTo(37, 22);
      ctx.lineTo(20, 46);
      ctx.lineTo(3, 22);
      ctx.closePath();
    };
    ctx.save();
    kite();
    ctx.clip();
    ctx.fillStyle = '#E8541E';
    ctx.fillRect(0, 0, 40, 60);
    ctx.fillStyle = '#F5C518';
    ctx.beginPath();
    ctx.moveTo(20, 2);
    ctx.lineTo(37, 22);
    ctx.lineTo(20, 22);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(3, 22);
    ctx.lineTo(20, 22);
    ctx.lineTo(20, 46);
    ctx.fill();
    ctx.restore();
    kite();
    outline(ctx, INK, 2.2);
    ctx.beginPath();
    ctx.moveTo(20, 2);
    ctx.lineTo(20, 46);
    ctx.moveTo(3, 22);
    ctx.lineTo(37, 22);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(58,28,22,0.7)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(20, 46);
    ctx.quadraticCurveTo(10, 50, 20, 53);
    ctx.quadraticCurveTo(30, 56, 22, 58);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#D12F3A';
    ctx.stroke();
  });
}

// The purple squishy blob that Behroopia turns into when the disguise falls off.
function makeBlob(scene) {
  makeCanvasTexture(scene, 'behroopia-blob', 84, 70, (ctx) => {
    const blob = () => {
      ctx.beginPath();
      ctx.moveTo(10, 56);
      ctx.quadraticCurveTo(0, 32, 20, 16);
      ctx.quadraticCurveTo(42, 2, 64, 16);
      ctx.quadraticCurveTo(84, 32, 74, 56);
      ctx.quadraticCurveTo(42, 70, 10, 56);
      ctx.closePath();
    };
    // little horns and feet first (behind the body)
    [[22, 14, -0.5], [62, 14, 0.5]].forEach(([x, y, r]) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r);
      ctx.beginPath();
      ctx.moveTo(-5, 4);
      ctx.lineTo(0, -10);
      ctx.lineTo(5, 4);
      ctx.closePath();
      ctx.fillStyle = '#F0C44A';
      ctx.fill();
      outline(ctx, INK, 2);
      ctx.restore();
    });
    [[26, 63], [58, 63]].forEach(([x, y]) => {
      celShape(ctx, ellipse(ctx, x, y, 10, 5), { base: '#6E3DB5', shade: '#4A2585', shadeShift: 1.5, lineWidth: 2.2 });
    });
    celShape(ctx, blob, { base: '#8E52D6', shade: '#5E2FA0', light: '#C09AF5', lightShape: ellipse(ctx, 26, 20, 11, 5, -0.5), shadeShift: 5, lineWidth: 3 });
    ctx.save();
    blob();
    ctx.clip();
    ctx.fillStyle = '#B58AEB';
    ellipse(ctx, 44, 52, 20, 12)();
    ctx.fill();
    ctx.restore();
  });
  makeCanvasTexture(scene, 'behroopia-eye', 22, 24, (ctx) => {
    ellipse(ctx, 11, 12, 9.5, 10.5)();
    ctx.fillStyle = '#FFFBE0';
    ctx.fill();
    outline(ctx, INK, 2);
    ctx.fillStyle = '#2A0E40';
    ellipse(ctx, 12, 13, 4.6, 6)();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(10, 10, 1.9, 0, Math.PI * 2);
    ctx.fill();
  });
  makeCanvasTexture(scene, 'behroopia-mouth', 36, 20, (ctx) => {
    const grin = () => {
      ctx.beginPath();
      ctx.moveTo(2, 4);
      ctx.quadraticCurveTo(18, 26, 34, 4);
      ctx.quadraticCurveTo(18, 8, 2, 4);
      ctx.closePath();
    };
    grin();
    ctx.fillStyle = '#3A0F40';
    ctx.fill();
    ctx.save();
    grin();
    ctx.clip();
    ctx.fillStyle = '#FFFFFF';
    [[9, 6], [18, 8], [27, 6]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x - 3, y - 4);
      ctx.lineTo(x + 3, y - 4);
      ctx.lineTo(x, y + 3);
      ctx.fill();
    });
    ctx.restore();
    grin();
    outline(ctx, INK, 2.2);
  });
}
