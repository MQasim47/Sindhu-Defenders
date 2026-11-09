import { newCanvas } from '../fx/canvasUtil.js';
import { WALK, START, GATE, CENTER, JADUGAR_SPOT, OBJECTS, PALMS } from './courtyardData.js';

const WORLD_WIDTH = 2752; // the courtyard is always this wide in the game, whatever size the picture file has
let SCALE = 1; // world pixels per pixel of the picture file (set in buildCourtyardArt)
const PIC = 2000; // width of the "measuring copy" used in courtyardData.js
const pieceKeys = []; // textures of the cut-out pieces

// Builds the courtyard from the painted picture "courtyard-bg":
//  - the picture itself is the floor and the walls,
//  - the measurements in courtyardData.js give walking limits and solid objects,
//  - tall things (palms, pots, well...) are cut out of the picture again as
//    separate pieces. Each piece is drawn at depth = its base y, so Dodo walks
//    in FRONT of them when he is below the base and BEHIND them when above.
// Returns null when the picture is missing (the level then uses the fallback art).
export function buildCourtyardArt(scene) {
  // the level can be entered again: remove the pieces of the last visit
  pieceKeys.forEach((key) => scene.textures.exists(key) && scene.textures.remove(key));
  pieceKeys.length = 0;

  if (!scene.textures.exists('courtyard-bg')) return null;
  const source = scene.textures.get('courtyard-bg').getSourceImage();
  if (!source || !source.width) return null;

  SCALE = WORLD_WIDTH / source.width;
  const k = (source.width * SCALE) / PIC; // measuring copy -> world
  const world = { width: Math.round(source.width * SCALE), height: Math.round(source.height * SCALE) };

  scene.add.image(0, 0, 'courtyard-bg').setOrigin(0).setScale(SCALE).setDepth(-10);

  const colliders = OBJECTS.map(([x, y, rx, ry, h, low]) => ({
    x: x * k,
    y: y * k,
    rx: rx * k,
    ry: ry * k,
    h: h * k,
    low: !!low,
  }));

  // cut-out pieces that can hide Dodo
  colliders.forEach((c) => {
    if (c.h <= 0) return;
    const cy = c.y - c.h / 2 + c.ry * 0.2;
    addPiece(scene, source, world, c.y, [{ ellipse: [c.x, cy, c.rx * 0.92, c.h / 2 + c.ry * 0.3] }]);
  });
  PALMS.forEach((p) => {
    const [cx, cy, rx, ry] = p.crown;
    addPiece(scene, source, world, p.base * k, [
      { ellipse: [cx * k, cy * k, rx * k, ry * k] },
      { poly: p.trunk.map(([x, y]) => [x * k, y * k]) },
    ]);
  });

  return {
    world,
    k,
    colliders,
    start: { x: START.x * k, y: START.y * k },
    gate: { x: GATE.x * k, y: GATE.y * k },
    center: { x: CENTER.x * k, y: CENTER.y * k },
    jadugar: { x: JADUGAR_SPOT.x * k, y: JADUGAR_SPOT.y * k },
    bounds: makeBounds(k),
  };
}

function makeBounds(k) {
  const edge = (points, y) => {
    for (let i = 1; i < points.length; i++) {
      if (y <= points[i][0] || i === points.length - 1) {
        const [y0, x0] = points[i - 1];
        const [y1, x1] = points[i];
        const t = Math.min(1, Math.max(0, (y - y0) / (y1 - y0)));
        return x0 + (x1 - x0) * t;
      }
    }
    return points[0][1];
  };
  return {
    minY: WALK.minY * k,
    maxY: WALK.maxY * k,
    minXAt: (y) => edge(WALK.left, y / k) * k,
    maxXAt: (y) => edge(WALK.right, y / k) * k,
  };
}

// Copies the shapes (ellipses / polygons) out of the picture into a small
// texture with transparent corners and shows it on top of the picture.
function addPiece(scene, source, world, baseY, shapes) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  shapes.forEach((s) => {
    if (s.ellipse) {
      const [cx, cy, rx, ry] = s.ellipse;
      minX = Math.min(minX, cx - rx);
      maxX = Math.max(maxX, cx + rx);
      minY = Math.min(minY, cy - ry);
      maxY = Math.max(maxY, cy + ry);
    } else {
      s.poly.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });
    }
  });
  minX = Math.max(0, Math.floor(minX) - 2);
  minY = Math.max(0, Math.floor(minY) - 2);
  maxX = Math.min(world.width, Math.ceil(maxX) + 2);
  maxY = Math.min(world.height, Math.ceil(maxY) + 2);
  const w = maxX - minX;
  const h = maxY - minY;
  if (w < 4 || h < 4) return;

  const canvas = newCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  shapes.forEach((s) => {
    if (s.ellipse) {
      const [cx, cy, rx, ry] = s.ellipse;
      ctx.moveTo(cx - minX + rx, cy - minY);
      ctx.ellipse(cx - minX, cy - minY, rx, ry, 0, 0, Math.PI * 2);
    } else {
      s.poly.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x - minX, y - minY) : ctx.lineTo(x - minX, y - minY)));
      ctx.closePath();
    }
  });
  ctx.clip();
  ctx.drawImage(source, minX / SCALE, minY / SCALE, w / SCALE, h / SCALE, 0, 0, w, h);

  const key = `piece-${pieceKeys.length}`;
  pieceKeys.push(key);
  scene.textures.addCanvas(key, canvas);
  scene.add.image(minX, minY, key).setOrigin(0).setDepth(baseY);
}
