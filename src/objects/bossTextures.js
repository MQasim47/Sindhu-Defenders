import { makeCanvasTexture, roundRectPath, INK } from '../fx/canvasUtil.js';
import { fillAjrak } from '../fx/ajrakPattern.js';

// Pictures for the boss fight, drawn in code (keys stay the same when real art is added):
//   boss-letter  boss-shield  boss-card-back  boss-pic-mango/matka/ajrak/camel  boss-confetti  boss-banner
export const CODE_PICTURES = ['mango', 'matka', 'ajrak', 'camel'];

const SIZE = 120; // the picture of a code word card

function ink(ctx, width = 3) {
  ctx.lineWidth = width;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function drawMango(ctx) {
  ctx.save();
  ctx.translate(60, 64);
  ctx.rotate(-0.35);
  const g = ctx.createLinearGradient(-30, -40, 30, 40);
  g.addColorStop(0, '#FFD93B');
  g.addColorStop(0.6, '#F7A21B');
  g.addColorStop(1, '#E4572E');
  ctx.beginPath();
  ctx.ellipse(0, 0, 33, 44, 0, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ink(ctx);
  ctx.beginPath();
  ctx.ellipse(-12, -14, 7, 16, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();
  ctx.restore();
  // stem and leaf
  ctx.beginPath();
  ctx.moveTo(72, 18);
  ctx.quadraticCurveTo(80, 8, 84, 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#5A3A1A';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(82, 6);
  ctx.quadraticCurveTo(108, -2, 112, 22);
  ctx.quadraticCurveTo(92, 26, 82, 6);
  ctx.fillStyle = '#3FA34D';
  ctx.fill();
  ink(ctx, 2.5);
}

function drawMatka(ctx) {
  ctx.beginPath();
  ctx.moveTo(40, 22);
  ctx.bezierCurveTo(30, 30, 8, 50, 14, 82);
  ctx.bezierCurveTo(20, 108, 100, 108, 106, 82);
  ctx.bezierCurveTo(112, 50, 90, 30, 80, 22);
  ctx.closePath();
  const g = ctx.createLinearGradient(10, 20, 110, 100);
  g.addColorStop(0, '#E58A4E');
  g.addColorStop(1, '#A94E26');
  ctx.fillStyle = g;
  ctx.fill();
  ink(ctx);
  // rim
  roundRectPath(ctx, 36, 10, 48, 16, 7);
  ctx.fillStyle = '#C9663A';
  ctx.fill();
  ink(ctx, 2.8);
  // painted band
  ctx.save();
  ctx.beginPath();
  ctx.rect(10, 56, 100, 16);
  ctx.clip();
  ctx.fillStyle = '#F3E9D2';
  ctx.fillRect(0, 56, 120, 16);
  ctx.fillStyle = '#8E1B2B';
  for (let x = 14; x < 110; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 64);
    ctx.lineTo(x + 6, 58);
    ctx.lineTo(x + 12, 64);
    ctx.lineTo(x + 6, 70);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(34, 48, 6, 16, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawAjrak(ctx) {
  roundRectPath(ctx, 12, 12, 96, 96, 12);
  fillAjrak(ctx, 48);
  roundRectPath(ctx, 12, 12, 96, 96, 12);
  ink(ctx, 3.5);
}

function drawCamel(ctx) {
  ctx.fillStyle = '#D9A55B';
  const part = (draw) => {
    ctx.beginPath();
    draw();
    ctx.fill();
    ink(ctx, 2.8);
  };
  // legs
  [30, 42, 78, 90].forEach((x) => part(() => ctx.rect(x, 74, 8, 32)));
  // body and humps
  part(() => ctx.ellipse(60, 66, 38, 20, 0, 0, Math.PI * 2));
  part(() => ctx.ellipse(50, 42, 14, 16, 0, 0, Math.PI * 2));
  part(() => ctx.ellipse(74, 44, 12, 14, 0, 0, Math.PI * 2));
  // neck and head
  part(() => {
    ctx.moveTo(86, 66);
    ctx.quadraticCurveTo(100, 50, 100, 26);
    ctx.lineTo(112, 26);
    ctx.quadraticCurveTo(110, 56, 98, 76);
  });
  part(() => ctx.ellipse(112, 24, 11, 8, -0.2, 0, Math.PI * 2));
  // blanket and eye
  ctx.fillStyle = '#8E1B2B';
  ctx.fillRect(40, 56, 40, 10);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(114, 22, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

export function createBossTextures(scene) {
  // a fake letter (envelope) with a red wax seal
  makeCanvasTexture(scene, 'boss-letter', 60, 46, (ctx) => {
    roundRectPath(ctx, 4, 6, 52, 34, 4);
    ctx.fillStyle = '#F6EAD0';
    ctx.fill();
    ink(ctx, 3);
    ctx.beginPath();
    ctx.moveTo(5, 8);
    ctx.lineTo(30, 26);
    ctx.lineTo(55, 8);
    ink(ctx, 2.5);
    ctx.beginPath();
    ctx.arc(30, 27, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#B3261E';
    ctx.fill();
    ink(ctx, 2);
    ctx.fillStyle = '#F6EAD0';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 30, 31);
  });

  // the Firewall Shield: a tall glowing wall with the Ajrak pattern
  makeCanvasTexture(scene, 'boss-shield', 84, 180, (ctx) => {
    roundRectPath(ctx, 8, 8, 68, 164, 16);
    ctx.fillStyle = 'rgba(255,214,120,0.35)';
    ctx.fill();
    roundRectPath(ctx, 14, 14, 56, 152, 12);
    fillAjrak(ctx, 40);
    roundRectPath(ctx, 14, 14, 56, 152, 12);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#FFD24A';
    ctx.stroke();
    roundRectPath(ctx, 8, 8, 68, 164, 16);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,240,180,0.8)';
    ctx.stroke();
  });

  // code word cards: the back (locked) and four pictures
  makeCanvasTexture(scene, 'boss-card-back', 150, 190, (ctx) => {
    roundRectPath(ctx, 6, 6, 138, 178, 18);
    ctx.fillStyle = '#1C2457';
    ctx.fill();
    ink(ctx, 4);
    roundRectPath(ctx, 16, 16, 118, 158, 12);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#E8B84A';
    ctx.stroke();
    ctx.fillStyle = '#E8B84A';
    ctx.beginPath();
    ctx.moveTo(75, 62);
    ctx.lineTo(105, 95);
    ctx.lineTo(75, 128);
    ctx.lineTo(45, 95);
    ctx.fill();
  });
  const draws = { mango: drawMango, matka: drawMatka, ajrak: drawAjrak, camel: drawCamel };
  CODE_PICTURES.forEach((name) => {
    makeCanvasTexture(scene, `boss-pic-${name}`, SIZE, SIZE, (ctx) => draws[name](ctx));
  });

  makeCanvasTexture(scene, 'boss-confetti', 14, 8, (ctx) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 14, 8);
  });

  // an Ajrak banner that hangs from the top of the screen (swallow-tail bottom)
  makeCanvasTexture(scene, 'boss-banner', 150, 330, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(144, 0);
    ctx.lineTo(144, 310);
    ctx.lineTo(75, 270);
    ctx.lineTo(6, 310);
    ctx.closePath();
    fillAjrak(ctx, 56);
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(144, 0);
    ctx.lineTo(144, 310);
    ctx.lineTo(75, 270);
    ctx.lineTo(6, 310);
    ctx.closePath();
    ink(ctx, 4);
    ctx.fillStyle = '#E8B84A';
    ctx.fillRect(0, 0, 150, 12);
  });
}
