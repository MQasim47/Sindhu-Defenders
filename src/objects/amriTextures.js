import { makeCanvasTexture, celShape, outline, INK, roundRectPath } from '../fx/canvasUtil.js';
import { drawAjrakBand } from '../fx/ajrakPattern.js';

// Pictures for Level 2 (Amri Gate), all drawn in code:
//   wall-seg  wall-crack-1..3  wall-glow  wall-rubble  plaque
//   building-kutubkhana  building-anaaj  building-ghar  prop-shelf  chain-lock  badge-backup  backup-scroll
//   taala-ghost
//   hathoda-body  hathoda-arm  hathoda-hammer  hathoda-eye  hathoda-brow  hathoda-mouth
//   brick-<character> (made when needed, see ensureBrickTexture)

export const WALL_W = 470;
export const WALL_H = 116;

const ellipse = (ctx, cx, cy, rx, ry, rot = 0) => () => {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
};

// a repeatable "random" number, so the stones look the same every time
const rnd = (i) => Math.abs(Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1;

export function createAmriTextures(scene) {
  makeWall(scene);
  makeBuildings(scene);
  makeGhost(scene);
  makeHathoda(scene);
}

// ---------- Wall sections ----------

function makeWall(scene) {
  // a standing wall seen from the front and a little from above:
  // a lit top face, then a darker front face with courses of stone
  makeCanvasTexture(scene, 'wall-seg', WALL_W, WALL_H, (ctx) => {
    const TOP = 30;
    const slab = () => {
      ctx.beginPath();
      ctx.moveTo(14, 6);
      ctx.lineTo(WALL_W - 14, 6);
      ctx.lineTo(WALL_W - 4, TOP);
      ctx.lineTo(WALL_W - 4, WALL_H - 6);
      ctx.quadraticCurveTo(WALL_W - 4, WALL_H - 2, WALL_W - 10, WALL_H - 2);
      ctx.lineTo(10, WALL_H - 2);
      ctx.quadraticCurveTo(4, WALL_H - 2, 4, WALL_H - 6);
      ctx.lineTo(4, TOP);
      ctx.closePath();
    };
    celShape(ctx, slab, { base: '#B08E60', shade: '#7A5C36', shadeShift: 4, lineWidth: 3.4 });
    ctx.save();
    slab();
    ctx.clip();
    // top face
    ctx.fillStyle = '#E2C896';
    ctx.fillRect(0, 0, WALL_W, TOP);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(0, 4, WALL_W, 6);
    ctx.strokeStyle = 'rgba(94,69,40,0.6)';
    ctx.lineWidth = 2;
    for (let x = 30; x < WALL_W; x += 62) {
      ctx.beginPath();
      ctx.moveTo(x, 6);
      ctx.lineTo(x - 4, TOP);
      ctx.stroke();
    }
    // front face courses
    const tones = ['#A9895C', '#B8966A', '#9A7A52', '#C2A070'];
    for (let row = 0; row < 3; row++) {
      const y = TOP + row * 28;
      let x = 4 - (row % 2) * 30;
      let i = row * 20;
      while (x < WALL_W) {
        const w = 52 + rnd(i) * 40;
        ctx.fillStyle = tones[Math.floor(rnd(i + 7) * tones.length)];
        ctx.fillRect(x + 2, y + 2, w - 4, 24);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(x + 2, y + 2, w - 4, 5);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 2, y + 21, w - 4, 5);
        x += w;
        i++;
      }
    }
    ctx.strokeStyle = '#5E4528';
    ctx.lineWidth = 2.6;
    [TOP, TOP + 28, TOP + 56].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WALL_W, y);
      ctx.stroke();
    });
    // dark soot at the foot
    const g = ctx.createLinearGradient(0, WALL_H - 22, 0, WALL_H);
    g.addColorStop(0, 'rgba(60,40,20,0)');
    g.addColorStop(1, 'rgba(60,40,20,0.4)');
    ctx.fillStyle = g;
    ctx.fillRect(0, WALL_H - 22, WALL_W, 22);
    ctx.restore();
    slab();
    outline(ctx, INK, 3.4);
  });

  // cracks: 3 pictures, more and more
  [1, 2, 3].forEach((level) =>
    makeCanvasTexture(scene, `wall-crack-${level}`, WALL_W, WALL_H, (ctx) => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const count = level * 3;
      for (let i = 0; i < count; i++) {
        let x = 30 + rnd(i * 3 + level) * (WALL_W - 60);
        let y = 14 + rnd(i * 5 + 2) * 20;
        ctx.beginPath();
        ctx.moveTo(x, y);
        const steps = 4 + level;
        for (let s = 0; s < steps; s++) {
          x += (rnd(i * 11 + s) - 0.5) * 34;
          y += 12 + rnd(i * 13 + s) * 8;
          ctx.lineTo(x, Math.min(y, WALL_H - 6));
        }
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(30,16,8,0.55)';
        ctx.stroke();
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#1E1008';
        ctx.stroke();
      }
    }),
  );

  // golden edge for a strong wall
  makeCanvasTexture(scene, 'wall-glow', WALL_W + 40, WALL_H + 40, (ctx) => {
    ctx.translate(20, 20);
    ctx.filter = 'blur(6px)';
    ctx.strokeStyle = 'rgba(255,214,90,0.95)';
    ctx.lineWidth = 9;
    roundRectPath(ctx, 6, 6, WALL_W - 12, WALL_H - 8, 10);
    ctx.stroke();
    ctx.filter = 'none';
    ctx.strokeStyle = '#FFE690';
    ctx.lineWidth = 3;
    roundRectPath(ctx, 6, 6, WALL_W - 12, WALL_H - 8, 10);
    ctx.stroke();
  });

  makeCanvasTexture(scene, 'wall-rubble', WALL_W, 56, (ctx) => {
    for (let i = 0; i < 46; i++) {
      const x = 20 + rnd(i) * (WALL_W - 40);
      const y = 16 + rnd(i + 90) * 30;
      const r = 8 + rnd(i + 30) * 14;
      celShape(ctx, ellipse(ctx, x, y, r, r * 0.72, rnd(i) * 3), {
        base: ['#A9895C', '#8A6C48', '#C2A070'][i % 3],
        shade: '#5E4528',
        shadeShift: 2,
        lineWidth: 2.2,
      });
    }
  });

  // stone plaque that shows the password
  makeCanvasTexture(scene, 'plaque', 262, 138, (ctx) => {
    celShape(ctx, () => roundRectPath(ctx, 6, 6, 250, 124, 22), { base: '#CDB78A', shade: '#8F7A52', shadeShift: 4, lineWidth: 4 });
    ctx.strokeStyle = 'rgba(94,69,40,0.7)';
    ctx.lineWidth = 3;
    roundRectPath(ctx, 16, 16, 230, 104, 14);
    ctx.stroke();
    ctx.fillStyle = '#6A5636';
    [[22, 22], [240, 22], [22, 114], [240, 114]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

// ---------- Buildings ----------

function makeBuildings(scene) {
  // Kutubkhana (library): stone building with an arched door, a dome and an Ajrak band
  makeCanvasTexture(scene, 'building-kutubkhana', 190, 190, (ctx) => {
    celShape(ctx, () => roundRectPath(ctx, 24, 70, 142, 112, 8), { base: '#E6D3A6', shade: '#B79E6C', shadeShift: 5, lineWidth: 3.4 });
    // dome
    celShape(ctx, () => {
      ctx.beginPath();
      ctx.ellipse(95, 70, 46, 44, 0, Math.PI, 0);
      ctx.closePath();
    }, { base: '#3FA58C', shade: '#237562', light: '#8EE8CF', lightShape: ellipse(ctx, 76, 44, 12, 5, -0.5), shadeShift: 4, lineWidth: 3.4 });
    ctx.fillStyle = '#E8B84A';
    ctx.beginPath();
    ctx.arc(95, 22, 5, 0, Math.PI * 2);
    ctx.fill();
    outline(ctx, INK, 2);
    // Ajrak band under the roof
    ctx.save();
    roundRectPath(ctx, 24, 70, 142, 112, 8);
    ctx.clip();
    drawAjrakBand(ctx, 24, 78, 142, 14);
    ctx.restore();
    // arched door with a warm inside
    ctx.beginPath();
    ctx.moveTo(72, 182);
    ctx.lineTo(72, 130);
    ctx.arc(95, 130, 23, Math.PI, 0);
    ctx.lineTo(118, 182);
    ctx.closePath();
    ctx.fillStyle = '#5A2E16';
    ctx.fill();
    outline(ctx, INK, 3);
    ctx.fillStyle = '#F2B84A';
    ctx.beginPath();
    ctx.moveTo(80, 182);
    ctx.lineTo(80, 132);
    ctx.arc(95, 132, 15, Math.PI, 0);
    ctx.lineTo(110, 182);
    ctx.fill();
    // two book windows
    [[44, 116], [118, 116]].forEach(([x, y]) => {
      celShape(ctx, () => roundRectPath(ctx, x, y, 28, 32, 6), { base: '#7A4A26', shade: '#4A2A12', shadeShift: 2, lineWidth: 2.6 });
      ['#D5413A', '#3A7BD5', '#2FA36B', '#F5C518'].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(x + 4 + i * 6, y + 6, 5, 20);
      });
    });
  });

  // a wooden shelf where the backup scrolls are stored (next to the Kutubkhana)
  makeCanvasTexture(scene, 'prop-shelf', 84, 100, (ctx) => {
    celShape(ctx, () => roundRectPath(ctx, 6, 4, 72, 92, 8), { base: '#9A6A3A', shade: '#6A4422', light: '#C58E58', lightShape: ellipse(ctx, 20, 20, 8, 3), shadeShift: 3, lineWidth: 3.2 });
    ctx.fillStyle = '#3A2010';
    [[14, 14], [14, 40], [14, 66]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.rect(x, y, 56, 20);
      ctx.fill();
    });
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    [[14, 14], [14, 40], [14, 66]].forEach(([x, y]) => ctx.strokeRect(x, y, 56, 20));
  });

  // Anaaj Ghar (granary): round clay store with a straw cone roof
  makeCanvasTexture(scene, 'building-anaaj', 190, 190, (ctx) => {
    celShape(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(40, 176);
      ctx.lineTo(40, 98);
      ctx.quadraticCurveTo(95, 86, 150, 98);
      ctx.lineTo(150, 176);
      ctx.quadraticCurveTo(95, 188, 40, 176);
      ctx.closePath();
    }, { base: '#CC8E56', shade: '#9A6234', light: '#EBB886', lightShape: ellipse(ctx, 58, 130, 7, 28), shadeShift: 5, lineWidth: 3.4 });
    ctx.strokeStyle = 'rgba(94,52,20,0.45)';
    ctx.lineWidth = 2;
    [116, 140, 160].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(42, y);
      ctx.quadraticCurveTo(95, y + 10, 148, y);
      ctx.stroke();
    });
    // roof
    celShape(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(22, 104);
      ctx.lineTo(95, 20);
      ctx.lineTo(168, 104);
      ctx.quadraticCurveTo(95, 118, 22, 104);
      ctx.closePath();
    }, { base: '#E3C262', shade: '#B08E34', light: '#FFEFA8', lightShape: ellipse(ctx, 78, 62, 5, 26, 0.5), shadeShift: 5, lineWidth: 3.4 });
    ctx.strokeStyle = 'rgba(120,80,20,0.55)';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(95, 24);
      ctx.lineTo(30 + i * 16, 106);
      ctx.stroke();
    }
    // door
    ctx.beginPath();
    ctx.moveTo(78, 180);
    ctx.lineTo(78, 142);
    ctx.arc(95, 142, 17, Math.PI, 0);
    ctx.lineTo(112, 180);
    ctx.closePath();
    ctx.fillStyle = '#4A2410';
    ctx.fill();
    outline(ctx, INK, 3);
    // grain sack
    celShape(ctx, ellipse(ctx, 138, 170, 14, 12), { base: '#E8D8A8', shade: '#B8A470', shadeShift: 2.5, lineWidth: 2.6 });
  });

  // Ghar (house): mud-brick house with a flat roof, a door and a window
  makeCanvasTexture(scene, 'building-ghar', 190, 190, (ctx) => {
    celShape(ctx, () => roundRectPath(ctx, 22, 84, 146, 98, 8), { base: '#D8B488', shade: '#A98458', light: '#F0D4AC', lightShape: ellipse(ctx, 40, 120, 6, 24), shadeShift: 5, lineWidth: 3.4 });
    // flat roof with a parapet
    celShape(ctx, () => roundRectPath(ctx, 14, 66, 162, 28, 6), { base: '#C09468', shade: '#8F6A44', shadeShift: 3, lineWidth: 3.4 });
    ctx.fillStyle = '#E8D2A8';
    for (let i = 0; i < 7; i++) ctx.fillRect(20 + i * 23, 56, 15, 14);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 7; i++) ctx.strokeRect(20 + i * 23, 56, 15, 14);
    // door
    celShape(ctx, () => roundRectPath(ctx, 40, 116, 44, 66, 6), { base: '#8A5226', shade: '#5A3014', shadeShift: 3, lineWidth: 3 });
    ctx.fillStyle = '#E8B84A';
    ctx.beginPath();
    ctx.arc(76, 150, 3, 0, Math.PI * 2);
    ctx.fill();
    // window with a blue shutter
    celShape(ctx, () => roundRectPath(ctx, 108, 112, 40, 40, 6), { base: '#FFE8A8', shade: '#E8B84A', shadeShift: 3, lineWidth: 3 });
    celShape(ctx, () => roundRectPath(ctx, 100, 112, 16, 40, 4), { base: '#3A7BD5', shade: '#235C9C', shadeShift: 2, lineWidth: 2.6 });
    celShape(ctx, () => roundRectPath(ctx, 140, 112, 16, 40, 4), { base: '#3A7BD5', shade: '#235C9C', shadeShift: 2, lineWidth: 2.6 });
  });

  // big chains and a padlock (shown over a locked building)
  makeCanvasTexture(scene, 'chain-lock', 200, 190, (ctx) => {
    const link = (x, y, a) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 6.5, 0, 0, Math.PI * 2);
      ctx.lineWidth = 6;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = '#C9CED6';
      ctx.stroke();
      ctx.restore();
    };
    [[1, 1], [1, -1]].forEach(([dx, dy]) => {
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        link(24 + t * 152, dy > 0 ? 40 + t * 120 : 160 - t * 120, dy > 0 ? 0.7 : -0.7);
      }
      void dx;
    });
    // padlock
    ctx.beginPath();
    ctx.arc(100, 78, 20, Math.PI, 0);
    ctx.lineWidth = 11;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#C9CED6';
    ctx.stroke();
    celShape(ctx, () => roundRectPath(ctx, 66, 76, 68, 58, 12), { base: '#F2C13A', shade: '#C0901A', light: '#FFE98A', lightShape: ellipse(ctx, 82, 90, 8, 4), shadeShift: 4, lineWidth: 3.6 });
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(100, 100, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(97, 102, 6, 18);
  });

  makeCanvasTexture(scene, 'badge-backup', 44, 44, (ctx) => {
    celShape(ctx, ellipse(ctx, 22, 22, 18, 18), { base: '#3FA9E8', shade: '#1E6FB5', light: '#9BDCFF', lightShape: ellipse(ctx, 15, 14, 6, 3), shadeShift: 3, lineWidth: 3 });
    ctx.beginPath();
    ctx.moveTo(12, 23);
    ctx.lineTo(19, 30);
    ctx.lineTo(32, 15);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
  });

  // Backup Scroll
  makeCanvasTexture(scene, 'backup-scroll', 40, 46, (ctx) => {
    celShape(ctx, () => roundRectPath(ctx, 8, 4, 24, 38, 8), { base: '#F6E6B8', shade: '#D8C084', light: '#FFF8DA', lightShape: ellipse(ctx, 14, 16, 3, 10), shadeShift: 3, lineWidth: 2.8 });
    ctx.strokeStyle = '#9A7A3A';
    ctx.lineWidth = 1.6;
    [14, 20, 26].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(13, y);
      ctx.lineTo(27, y);
      ctx.stroke();
    });
    celShape(ctx, () => roundRectPath(ctx, 5, 21, 30, 7, 3), { base: '#D5413A', shade: '#9A2A2A', shadeShift: 1.5, lineWidth: 2.2 });
    ctx.fillStyle = '#3FA9E8';
    ctx.beginPath();
    ctx.arc(20, 25, 3.4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ---------- Taala Bhoot ----------

function makeGhost(scene) {
  // a cute ghost holding a padlock
  makeCanvasTexture(scene, 'taala-ghost', 96, 118, (ctx) => {
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(10, 100);
      ctx.quadraticCurveTo(2, 30, 48, 12);
      ctx.quadraticCurveTo(94, 30, 86, 100);
      ctx.quadraticCurveTo(76, 90, 70, 108);
      ctx.quadraticCurveTo(60, 94, 48, 112);
      ctx.quadraticCurveTo(36, 94, 26, 108);
      ctx.quadraticCurveTo(20, 90, 10, 100);
      ctx.closePath();
    };
    celShape(ctx, body, { base: '#E6EEFF', shade: '#A9B8E8', light: '#FFFFFF', lightShape: ellipse(ctx, 28, 34, 9, 14, 0.3), shadeShift: 5, lineWidth: 3.2 });
    // arms
    [[8, 66, -0.5], [88, 66, 0.5]].forEach(([x, y, r]) => {
      celShape(ctx, ellipse(ctx, x, y, 8, 16, r), { base: '#E6EEFF', shade: '#A9B8E8', shadeShift: 2, lineWidth: 2.6 });
    });
    // eyes and smile
    [[34, 46], [60, 46]].forEach(([x, y]) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(x, y, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      outline(ctx, INK, 2);
      ctx.fillStyle = '#2A0E40';
      ctx.beginPath();
      ctx.ellipse(x + 1, y + 1.5, 4.6, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x - 1, y - 1.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.beginPath();
    ctx.arc(47, 62, 7, 0.2, Math.PI - 0.2);
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // the padlock on its tummy
    ctx.beginPath();
    ctx.arc(47, 80, 7, Math.PI, 0);
    ctx.lineWidth = 4.4;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#C9CED6';
    ctx.stroke();
    celShape(ctx, () => roundRectPath(ctx, 36, 80, 22, 18, 5), { base: '#F2C13A', shade: '#C0901A', shadeShift: 2, lineWidth: 2.4 });
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(47, 88, 2.4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ---------- Hathoda Dev ----------

function makeHathoda(scene) {
  // big round strongman blob
  makeCanvasTexture(scene, 'hathoda-body', 128, 124, (ctx) => {
    // feet
    [[38, 114], [90, 114]].forEach(([x, y]) => celShape(ctx, ellipse(ctx, x, y, 17, 8), { base: '#7A4A26', shade: '#4A2A12', shadeShift: 2, lineWidth: 2.8 }));
    const blob = () => {
      ctx.beginPath();
      ctx.moveTo(10, 98);
      ctx.quadraticCurveTo(0, 40, 36, 16);
      ctx.quadraticCurveTo(64, 2, 92, 16);
      ctx.quadraticCurveTo(128, 40, 118, 98);
      ctx.quadraticCurveTo(64, 126, 10, 98);
      ctx.closePath();
    };
    celShape(ctx, blob, { base: '#DE8A34', shade: '#A85A18', light: '#FFC27A', lightShape: ellipse(ctx, 36, 36, 14, 7, -0.5), shadeShift: 6, lineWidth: 3.6 });
    ctx.save();
    blob();
    ctx.clip();
    ctx.fillStyle = '#F4B568';
    ellipse(ctx, 64, 84, 34, 26)();
    ctx.fill();
    // a belt with the Ajrak pattern
    drawAjrakBand(ctx, 0, 74, 128, 14);
    ctx.restore();
    blob();
    outline(ctx, INK, 3.6);
    // small ears
    [[12, 40], [116, 40]].forEach(([x, y]) => celShape(ctx, ellipse(ctx, x, y, 8, 11), { base: '#DE8A34', shade: '#A85A18', shadeShift: 2, lineWidth: 2.6 }));
  });
  makeCanvasTexture(scene, 'hathoda-arm', 40, 70, (ctx) => {
    celShape(ctx, () => roundRectPath(ctx, 6, 2, 28, 48, 14), { base: '#DE8A34', shade: '#A85A18', light: '#FFC27A', lightShape: ellipse(ctx, 14, 16, 3, 10), shadeShift: 3, lineWidth: 3 });
    celShape(ctx, ellipse(ctx, 20, 54, 14, 13), { base: '#F0A04A', shade: '#B8681E', shadeShift: 2.5, lineWidth: 3 });
    ctx.strokeStyle = 'rgba(120,60,10,0.7)';
    ctx.lineWidth = 1.6;
    [12, 20, 28].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 50);
      ctx.lineTo(x, 60);
      ctx.stroke();
    });
  });
  // big wooden hammer: the handle is at the bottom (origin: the grip)
  makeCanvasTexture(scene, 'hathoda-hammer', 76, 150, (ctx) => {
    celShape(ctx, () => roundRectPath(ctx, 31, 40, 14, 106, 5), { base: '#A8723A', shade: '#6E4420', light: '#D49C60', lightShape: ellipse(ctx, 35, 90, 2, 40), shadeShift: 2.5, lineWidth: 3 });
    celShape(ctx, () => roundRectPath(ctx, 4, 4, 68, 50, 12), { base: '#B98046', shade: '#7A4A22', light: '#E0AE72', lightShape: ellipse(ctx, 20, 16, 14, 4), shadeShift: 4, lineWidth: 3.6 });
    ctx.fillStyle = '#4A3A30';
    ctx.fillRect(4, 14, 68, 6);
    ctx.fillRect(4, 38, 68, 6);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 14, 68, 6);
    ctx.strokeRect(4, 38, 68, 6);
  });
  makeCanvasTexture(scene, 'hathoda-eye', 24, 24, (ctx) => {
    ellipse(ctx, 12, 12, 10, 10)();
    ctx.fillStyle = '#FFFBE0';
    ctx.fill();
    outline(ctx, INK, 2.4);
    ctx.fillStyle = '#2A0E10';
    ctx.beginPath();
    ctx.arc(13, 14, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(11, 11, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  makeCanvasTexture(scene, 'hathoda-brow', 40, 16, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(2, 14);
    ctx.lineTo(38, 3);
    ctx.lineTo(36, 12);
    ctx.lineTo(4, 16);
    ctx.closePath();
    ctx.fillStyle = '#3A2010';
    ctx.fill();
    outline(ctx, INK, 2);
  });
  makeCanvasTexture(scene, 'hathoda-mouth', 44, 26, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(3, 6);
    ctx.quadraticCurveTo(22, -2, 41, 6);
    ctx.quadraticCurveTo(38, 24, 22, 24);
    ctx.quadraticCurveTo(6, 24, 3, 6);
    ctx.closePath();
    ctx.fillStyle = '#4A0E18';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(6, 4, 8, 7);
    ctx.fillRect(30, 4, 8, 7);
    ctx.fillStyle = '#E8627A';
    ctx.beginPath();
    ctx.ellipse(22, 24, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    outline(ctx, INK, 2.4);
  });
}

// ---------- Password bricks ----------

const BRICK_COLORS = {
  lower: { top: '#C98550', bottom: '#8F5A2E', text: '#FFFFFF' },
  upper: { top: '#E0454F', bottom: '#9E1E2E', text: '#FFFFFF' },
  number: { top: '#4C8BE0', bottom: '#2A5AA8', text: '#FFFFFF' },
  symbol: { top: '#F5C842', bottom: '#C7931A', text: '#3A1C16' },
};

export function brickKind(ch) {
  if (/[a-z]/.test(ch)) return 'lower';
  if (/[A-Z]/.test(ch)) return 'upper';
  if (/[0-9]/.test(ch)) return 'number';
  return 'symbol';
}

// Makes (once) the picture of a brick that shows the character ch. Returns its texture key.
export function ensureBrickTexture(scene, ch) {
  const key = `brick-${ch.charCodeAt(0)}`;
  const c = BRICK_COLORS[brickKind(ch)];
  makeCanvasTexture(scene, key, 56, 46, (ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    roundRectPath(ctx, 6, 9, 46, 34, 9);
    ctx.fill();
    const g = ctx.createLinearGradient(0, 4, 0, 40);
    g.addColorStop(0, c.top);
    g.addColorStop(1, c.bottom);
    roundRectPath(ctx, 4, 4, 48, 36, 9);
    ctx.fillStyle = g;
    ctx.fill();
    outline(ctx, INK, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    roundRectPath(ctx, 9, 8, 38, 8, 4);
    ctx.fill();
    ctx.font = '700 28px Fredoka, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = c.text === '#FFFFFF' ? 'rgba(40,20,10,0.55)' : 'rgba(255,255,255,0.35)';
    ctx.strokeText(ch, 28, 24);
    ctx.fillStyle = c.text;
    ctx.fillText(ch, 28, 24);
  });
  return key;
}
