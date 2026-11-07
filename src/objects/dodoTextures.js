import { makeCanvasTexture, celShape, outline, INK, radialBlob } from '../fx/canvasUtil.js';
import { AJRAK, fillAjrak, drawAjrakBand } from '../fx/ajrakPattern.js';

// Dodo, drawn in code as separate parts (cartoon style: soft brown outline,
// 2-tone cel shading, a highlight on every part).
// Every key below can be replaced later by a real PNG with the same name.
//
//   dodo-head  dodo-ear  dodo-hair  dodo-eye  dodo-brow  dodo-blush
//   dodo-nose  dodo-mouth  dodo-mouth-wide
//   dodo-topi  dodo-topi-mirror
//   dodo-body (kurta)  dodo-arm  dodo-leg (shalwar)  dodo-foot (khussa)
//   dodo-shawl  dodo-cape-0 .. dodo-cape-7

const SKIN = { base: '#F5BE92', shade: '#DE9568', light: '#FFE3CA' };
const CREAM = { base: '#F8EDCB', shade: '#D9C7A0', light: '#FFFBEA' };
const INDIGO = { base: '#2B3580', shade: '#1C2457', light: '#4A59B5' };
const LEATHER = { base: '#9A5630', shade: '#643420', light: '#C98450' };

export const CAPE_SEGMENTS = 8;
export const CAPE_SEG_HEIGHT = 8;
export const CAPE_WIDTH = 70;

// Where things sit inside dodo-topi (used to place the glinting mirrors).
export const TOPI_ANCHOR = { x: 36, y: 41.5 };
export const TOPI_MIRRORS = [
  [36, 12.5],
  [21, 19],
  [51, 19],
  [11, 25],
  [61, 25],
];

export function createDodoTextures(scene) {
  makeHead(scene);
  makeFace(scene);
  makeTopi(scene);
  makeClothes(scene);
  makeCape(scene);
}

function ellipsePath(ctx, cx, cy, rx, ry, rot = 0) {
  return () => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  };
}

function makeHead(scene) {
  makeCanvasTexture(scene, 'dodo-head', 72, 64, (ctx) => {
    celShape(ctx, ellipsePath(ctx, 36, 33, 33, 29), {
      ...SKIN,
      lightShape: () => {
        ctx.beginPath();
        ctx.ellipse(22, 17, 9, 4.5, -0.5, 0, Math.PI * 2);
      },
      lineWidth: 3,
    });
  });

  makeCanvasTexture(scene, 'dodo-ear', 16, 18, (ctx) => {
    celShape(ctx, ellipsePath(ctx, 8, 9, 6.5, 7.5), { ...SKIN, lineWidth: 2.4 });
    ctx.beginPath();
    ctx.ellipse(8.5, 9.5, 2.6, 3.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#E8957C';
    ctx.fill();
  });

  // Dark hair at the temples, below the topi. The middle is cut out.
  makeCanvasTexture(scene, 'dodo-hair', 74, 34, (ctx) => {
    ctx.beginPath();
    ctx.ellipse(37, 18, 35, 17, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#4A2A1E';
    ctx.fill();
    outline(ctx, INK, 2.4);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.ellipse(37, 24, 27, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.ellipse(12, 10, 5, 2.4, -0.6, 0, Math.PI * 2);
    ctx.fill();
  });
}

function makeFace(scene) {
  // Big eye: white, large dark pupil, two sparkles, thick upper lash.
  makeCanvasTexture(scene, 'dodo-eye', 24, 30, (ctx) => {
    ctx.beginPath();
    ctx.ellipse(12, 15, 10.5, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(12, 17, 8.8, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#6B3A26';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, 17.5, 6, 7.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1B0F0D';
    ctx.fill();
    // soft shadow of the lid on top of the eye
    ctx.fillStyle = 'rgba(60,30,20,0.18)';
    ctx.fillRect(0, 0, 24, 6);
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(12, 15, 10.5, 13, 0, 0, Math.PI * 2);
    outline(ctx, INK, 1.8);
    ctx.beginPath();
    ctx.ellipse(12, 15, 10.5, 13, 0, Math.PI * 1.08, Math.PI * 1.92);
    outline(ctx, INK, 3.4);
    // two sparkles
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(8.6, 12, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(15.8, 22, 1.7, 0, Math.PI * 2);
    ctx.fill();
  });

  makeCanvasTexture(scene, 'dodo-brow', 22, 9, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(3, 7);
    ctx.quadraticCurveTo(11, 0, 19, 6);
    outline(ctx, '#4A2A1E', 3.4);
  });

  makeCanvasTexture(scene, 'dodo-blush', 22, 14, (ctx) => {
    ctx.save();
    ctx.scale(1, 0.62);
    radialBlob(ctx, 11, 11, 11, '244,106,110', 0.75);
    ctx.restore();
    ctx.strokeStyle = 'rgba(214,80,86,0.7)';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    [[7, 4], [11, 4], [15, 4]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + 6);
      ctx.lineTo(x + 2, y + 1);
      ctx.stroke();
    });
  });

  makeCanvasTexture(scene, 'dodo-nose', 8, 6, (ctx) => {
    ctx.beginPath();
    ctx.ellipse(4, 3, 2.6, 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#E5997A';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, 3, 2.7, Math.PI * 0.1, Math.PI * 0.9);
    outline(ctx, '#9A5A40', 1.2);
  });

  // Smile (idle) and wide open laugh (running).
  const mouth = (key, w, h, depth) =>
    makeCanvasTexture(scene, key, w, h, (ctx) => {
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(2, 2.5);
        ctx.quadraticCurveTo(w / 2, depth, w - 2, 2.5);
        ctx.quadraticCurveTo(w / 2, 4, 2, 2.5);
        ctx.closePath();
      };
      path();
      ctx.fillStyle = '#7C2630';
      ctx.fill();
      ctx.save();
      path();
      ctx.clip();
      ctx.fillStyle = '#F4707F';
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 2.5, w * 0.28, h * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(3, 2, w - 6, 3.4);
      ctx.restore();
      path();
      outline(ctx, INK, 2);
    });
  mouth('dodo-mouth', 22, 14, 16);
  mouth('dodo-mouth-wide', 30, 20, 22);
}

function makeTopi(scene) {
  makeCanvasTexture(scene, 'dodo-topi-mirror', 10, 10, (ctx) => {
    ctx.beginPath();
    ctx.arc(5, 5, 3.9, 0, Math.PI * 2);
    ctx.fillStyle = '#9FD8EE';
    ctx.fill();
    outline(ctx, '#F7E6B8', 1.3);
    ctx.beginPath();
    ctx.arc(5, 5, 4.8, 0, Math.PI * 2);
    outline(ctx, INK, 1);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(3.8, 3.8, 1.3, 0, Math.PI * 2);
    ctx.fill();
  });

  makeCanvasTexture(scene, 'dodo-topi', 72, 46, paintTopi);
}

// The Sindhi topi: a short round cylinder with a flat top, an arch cut out at the front,
// rows of colourful embroidery. Drawn on a 72x46 grid (the emblem draws it bigger).
export function paintTopi(ctx) {
  const CX = 36;
  const BASE = 41; // y of the front edge in the middle
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(5, 9);
    ctx.ellipse(CX, 9, 31, 6, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(67, 38);
    ctx.quadraticCurveTo(CX, 45, 5, 38);
    ctx.closePath();
  };
  // short round cylinder: straight sides, flat top
  celShape(ctx, body, {
    base: '#A02234',
    shade: '#6E1220',
    light: '#C9404F',
    lightShape: () => {
      ctx.beginPath();
      ctx.ellipse(16, 20, 4, 9, 0.2, 0, Math.PI * 2);
    },
    lineWidth: 2.8,
  });

  // flat top face with small embroidery
  ctx.beginPath();
  ctx.ellipse(CX, 9, 28.5, 4.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#B9293D';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(58,28,22,0.6)';
  ctx.stroke();
  ctx.fillStyle = '#F5C518';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(CX + Math.cos(a) * 20, 9 + Math.sin(a) * 2.8, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // zigzag row (yellow / green / white triangles) above the band
  const zig = ['#F5C518', '#2FA36B', '#F4EBDD'];
  for (let x = 7, i = 0; x < 66; x += 5, i++) {
    if (x > 27 && x < 45) continue;
    ctx.beginPath();
    ctx.moveTo(x, 13);
    ctx.lineTo(x + 5, 13);
    ctx.lineTo(x + 2.5, 18.5);
    ctx.closePath();
    ctx.fillStyle = zig[i % 3];
    ctx.fill();
  }
  ctx.fillStyle = '#E23B3B';
  for (let x = 9; x < 64; x += 5) {
    if (x > 27 && x < 45) continue;
    ctx.fillRect(x, 12, 1.4, 1.4);
  }

  // embroidery band along the bottom edge and around the arch
  const band = () => {
    ctx.beginPath();
    ctx.moveTo(5, 35);
    ctx.lineTo(CX - 18, 35);
    ctx.lineTo(CX - 18, BASE);
    ctx.ellipse(CX, BASE, 18, 19, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(CX + 18, 35);
    ctx.lineTo(67, 35);
  };
  ctx.save();
  body();
  ctx.clip();
  band();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 9;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 7.4;
  ctx.strokeStyle = '#1F2A6B';
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(244,235,221,0.9)';
  ctx.setLineDash([2, 2]);
  ctx.stroke();
  ctx.setLineDash([]);
  const diamond = (x, y, i) => {
    ctx.fillStyle = ['#E23B3B', '#F5C518', '#2FA36B', '#F4EBDD'][i % 4];
    ctx.beginPath();
    ctx.moveTo(x, y - 2.4);
    ctx.lineTo(x + 2.4, y);
    ctx.lineTo(x, y + 2.4);
    ctx.lineTo(x - 2.4, y);
    ctx.closePath();
    ctx.fill();
  };
  let n = 0;
  [8.5, 13.5].forEach((x) => diamond(x, 35, n++));
  for (let k = 0; k < 9; k++) {
    const a = Math.PI + 0.22 + (k / 8) * (Math.PI - 0.44);
    diamond(CX + Math.cos(a) * 18, BASE + Math.sin(a) * 19, n++);
  }
  [58.5, 63.5].forEach((x) => diamond(x, 35, n++));
  ctx.restore();

  // rounded ARCH cut-out at the front, above the forehead
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(CX - 13, 46);
  ctx.lineTo(CX - 13, BASE);
  ctx.ellipse(CX, BASE, 13, 14, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(CX + 13, 46);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // arch edge and the rest of the outline (not across the opening)
  ctx.beginPath();
  ctx.ellipse(CX, BASE, 13, 14, 0, Math.PI, Math.PI * 2);
  outline(ctx, INK, 2.6);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 72, 46);
  ctx.moveTo(CX - 14, 46);
  ctx.lineTo(CX - 14, BASE);
  ctx.ellipse(CX, BASE, 14, 15, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(CX + 14, 46);
  ctx.closePath();
  ctx.clip('evenodd');
  body();
  outline(ctx, INK, 2.8);
  ctx.restore();
}

function makeClothes(scene) {
  // Cream kurta with an embroidered collar and a small slit.
  makeCanvasTexture(scene, 'dodo-body', 52, 44, (ctx) => {
    const kurta = () => {
      ctx.beginPath();
      ctx.moveTo(11, 3);
      ctx.quadraticCurveTo(26, -1, 41, 3);
      ctx.lineTo(48, 40);
      ctx.quadraticCurveTo(26, 44, 4, 40);
      ctx.closePath();
    };
    celShape(ctx, kurta, {
      ...CREAM,
      lightShape: () => {
        ctx.beginPath();
        ctx.ellipse(15, 14, 3.4, 9, 0.1, 0, Math.PI * 2);
      },
      shadeShift: 4,
    });
    ctx.save();
    kurta();
    ctx.clip();
    // soft fold lines
    ctx.strokeStyle = 'rgba(160,130,90,0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(14, 24);
    ctx.quadraticCurveTo(18, 30, 15, 38);
    ctx.moveTo(38, 22);
    ctx.quadraticCurveTo(34, 30, 37, 38);
    ctx.stroke();
    ctx.restore();
    // hem stitch line and slit
    ctx.strokeStyle = '#C9A24E';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(6, 36.5);
    ctx.quadraticCurveTo(26, 40.5, 46, 36.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(33, 40);
    ctx.lineTo(32.5, 34);
    outline(ctx, 'rgba(58,28,22,0.45)', 1.4);
    // collar: embroidered round neckline + placket with buttons
    ctx.beginPath();
    ctx.moveTo(15, 2);
    ctx.quadraticCurveTo(26, 14, 37, 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 4.4;
    ctx.strokeStyle = '#D5413A';
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#F5C518';
    ctx.setLineDash([2, 2]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(26, 10);
    ctx.lineTo(26, 20);
    outline(ctx, '#B9A06A', 1.4);
    [13, 17.5].forEach((y) => {
      ctx.beginPath();
      ctx.arc(26, y, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = '#E8B84A';
      ctx.fill();
    });
  });

  // Sleeve with embroidered cuff and a hand. Pivot is the shoulder (top).
  makeCanvasTexture(scene, 'dodo-arm', 16, 32, (ctx) => {
    ctx.beginPath();
    ctx.arc(8, 27, 5.2, 0, Math.PI * 2);
    ctx.fillStyle = SKIN.base;
    ctx.fill();
    outline(ctx, INK, 2.2);
    ctx.beginPath();
    ctx.arc(6.4, 25.2, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = SKIN.light;
    ctx.fill();
    const sleeve = () => {
      ctx.beginPath();
      ctx.moveTo(3, 2);
      ctx.quadraticCurveTo(8, -1, 13, 2);
      ctx.lineTo(14, 20);
      ctx.quadraticCurveTo(8, 23, 2, 20);
      ctx.closePath();
    };
    celShape(ctx, sleeve, { ...CREAM, shadeShift: 2.5, lineWidth: 2.2 });
    ctx.beginPath();
    ctx.moveTo(2.5, 18);
    ctx.quadraticCurveTo(8, 21, 13.5, 18);
    outline(ctx, '#D5413A', 2.4);
  });

  // Indigo shalwar leg (baggy), pivot at the top.
  makeCanvasTexture(scene, 'dodo-leg', 20, 22, (ctx) => {
    const leg = () => {
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(17, 0);
      ctx.quadraticCurveTo(20, 14, 18, 20);
      ctx.quadraticCurveTo(10, 23, 2, 20);
      ctx.quadraticCurveTo(0, 14, 3, 0);
      ctx.closePath();
    };
    celShape(ctx, leg, {
      ...INDIGO,
      lightShape: () => {
        ctx.beginPath();
        ctx.ellipse(6, 9, 1.8, 6, 0, 0, Math.PI * 2);
      },
      shadeShift: 3.5,
    });
    ctx.strokeStyle = 'rgba(10,14,50,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.quadraticCurveTo(11, 14, 9, 20);
    ctx.stroke();
  });

  // Brown khussa shoe with a curled toe (pointing right). Origin: bottom centre.
  makeCanvasTexture(scene, 'dodo-foot', 30, 15, (ctx) => {
    const shoe = () => {
      ctx.beginPath();
      ctx.moveTo(3, 13);
      ctx.lineTo(3, 7);
      ctx.quadraticCurveTo(8, 2.5, 16, 3.5);
      ctx.quadraticCurveTo(22, 4.5, 24, 7);
      ctx.quadraticCurveTo(28, 6, 28, 2.5);
      ctx.quadraticCurveTo(29.5, 8, 27, 12);
      ctx.quadraticCurveTo(16, 14.5, 3, 13);
      ctx.closePath();
    };
    celShape(ctx, shoe, {
      ...LEATHER,
      lightShape: () => {
        ctx.beginPath();
        ctx.ellipse(11, 5.5, 5, 1.6, -0.1, 0, Math.PI * 2);
      },
      shadeShift: 2.5,
      lineWidth: 2.3,
    });
    ctx.fillStyle = '#E8B84A';
    [8, 12, 16].forEach((x) => {
      ctx.beginPath();
      ctx.arc(x, 7.4, 0.9, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // Ajrak draped over the shoulders, in front of the kurta.
  makeCanvasTexture(scene, 'dodo-shawl', 64, 26, (ctx) => {
    const shawl = () => {
      ctx.beginPath();
      ctx.moveTo(3, 9);
      ctx.quadraticCurveTo(32, -6, 61, 9);
      ctx.quadraticCurveTo(64, 18, 59, 23);
      ctx.quadraticCurveTo(32, 14, 5, 23);
      ctx.quadraticCurveTo(0, 18, 3, 9);
      ctx.closePath();
    };
    shawl();
    fillAjrak(ctx, 22);
    ctx.save();
    shawl();
    ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(32, 26, 40, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.ellipse(24, 4, 14, 3, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    shawl();
    outline(ctx, INK, 2.6);
  });
}

// The big Ajrak cape is drawn once, then cut into 8 thin strips.
// The Player hangs the strips on a chain so they bend one after another.
function makeCape(scene) {
  if (scene.textures.exists('dodo-cape-0')) return;
  const W = CAPE_WIDTH;
  const SEG = CAPE_SEG_HEIGHT;
  const H = SEG * CAPE_SEGMENTS + 8;
  const master = document.createElement('canvas');
  master.width = W;
  master.height = H;
  const ctx = master.getContext('2d');

  const cape = () => {
    ctx.beginPath();
    ctx.moveTo(10, 1);
    ctx.lineTo(60, 1);
    ctx.quadraticCurveTo(66, 32, 69, 60);
    ctx.quadraticCurveTo(57.7, 70, 46.3, 62);
    ctx.quadraticCurveTo(35, 70, 23.7, 62);
    ctx.quadraticCurveTo(12.3, 70, 1, 60);
    ctx.quadraticCurveTo(4, 32, 10, 1);
    ctx.closePath();
  };
  cape();
  fillAjrak(ctx, 26);
  ctx.save();
  cape();
  ctx.clip();
  drawAjrakBand(ctx, 0, 47, W, 13);
  // lighter on the left, darker on the right, a fold line in the middle
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.14)');
  g.addColorStop(0.5, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.26)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(30, 2);
  ctx.quadraticCurveTo(28, 30, 31, 60);
  ctx.stroke();
  ctx.restore();
  cape();
  outline(ctx, INK, 2.8);

  for (let i = 0; i < CAPE_SEGMENTS; i++) {
    const last = i === CAPE_SEGMENTS - 1;
    const h = last ? H - SEG * i : SEG + 3;
    const slice = document.createElement('canvas');
    slice.width = W;
    slice.height = h;
    slice.getContext('2d').drawImage(master, 0, SEG * i, W, h, 0, 0, W, h);
    scene.textures.addCanvas(`dodo-cape-${i}`, slice);
  }
}
