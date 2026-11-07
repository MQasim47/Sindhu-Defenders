import { newCanvas } from '../fx/canvasUtil.js';

const W = 2200;
const H = 1300;
const WALL_TOP = 230; // height of the back wall (front face + top face)
const SIDE = 130;
const BOTTOM = 110;

// Used only when courtyard-bg is missing: sand floor + simple standing walls
// (lit top, darker front face) drawn in code. Same return shape as buildCourtyardArt.
export function buildFallbackCourtyard(scene) {
  if (!scene.textures.exists('fallback-walls')) {
    const canvas = newCanvas(W, H);
    const ctx = canvas.getContext('2d');
    drawWalls(ctx);
    scene.textures.addCanvas('fallback-walls', canvas);
  }
  scene.add.tileSprite(0, 0, W, H, 'sand-tile').setOrigin(0).setDepth(-10);
  scene.add.image(0, 0, 'fallback-walls').setOrigin(0).setDepth(-9);

  const minX = SIDE + 40;
  const maxX = W - SIDE - 40;
  return {
    world: { width: W, height: H },
    k: 0,
    colliders: [],
    start: { x: W / 2, y: H / 2 + 120 },
    gate: { x: W / 2, y: WALL_TOP + 40 },
    center: { x: W / 2, y: H / 2 + 60 },
    jadugar: { x: W / 2 + 420, y: WALL_TOP - 30 },
    bounds: {
      minY: WALL_TOP + 40,
      maxY: H - BOTTOM - 10,
      minXAt: () => minX,
      maxXAt: () => maxX,
    },
  };
}

function bricks(ctx, x, y, w, h, light, dark) {
  ctx.fillStyle = dark;
  ctx.fillRect(x, y, w, h);
  for (let row = 0, by = y; by < y + h; row++, by += 34) {
    for (let bx = x - (row % 2) * 40; bx < x + w; bx += 80) {
      const shade = Math.abs(Math.sin(row * 7.1 + bx * 0.13));
      ctx.fillStyle = shade > 0.5 ? light : dark;
      ctx.fillRect(Math.max(bx, x) + 2, by + 2, Math.min(78, x + w - Math.max(bx, x)) - 2, Math.min(30, y + h - by - 2));
    }
  }
}

function drawWalls(ctx) {
  // back wall: tall dark front face with a lit top face above it
  bricks(ctx, 0, 70, W, WALL_TOP - 70, '#b09a7c', '#8d7a62');
  ctx.fillStyle = '#d8c09a';
  ctx.fillRect(0, 20, W, 50);
  // side walls and front wall
  bricks(ctx, 0, 0, SIDE, H, '#b09a7c', '#8d7a62');
  bricks(ctx, W - SIDE, 0, SIDE, H, '#b09a7c', '#8d7a62');
  ctx.fillStyle = '#d8c09a';
  ctx.fillRect(SIDE - 18, WALL_TOP, 18, H - WALL_TOP);
  ctx.fillRect(W - SIDE, WALL_TOP, 18, H - WALL_TOP);
  bricks(ctx, 0, H - BOTTOM, W, BOTTOM, '#b09a7c', '#8d7a62');
  // dark contact shadow on the sand along the walls
  const g = ctx.createLinearGradient(0, WALL_TOP, 0, WALL_TOP + 40);
  g.addColorStop(0, 'rgba(40,20,10,0.4)');
  g.addColorStop(1, 'rgba(40,20,10,0)');
  ctx.fillStyle = g;
  ctx.fillRect(SIDE, WALL_TOP, W - SIDE * 2, 40);
}
