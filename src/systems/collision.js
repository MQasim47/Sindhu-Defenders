// Pushes something (anything with x and y) out of the solid objects of the level.
// colliders: [{ x, y, rx, ry }] ellipses on the ground. extraX/extraY = size of the walker's feet.
export function pushOut(entity, colliders, extraX = 10, extraY = 6) {
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    const rx = c.rx + extraX;
    const ry = c.ry + extraY;
    const nx = (entity.x - c.x) / rx;
    const ny = (entity.y - c.y) / ry;
    const d = Math.sqrt(nx * nx + ny * ny);
    if (d >= 1) continue;
    const ux = d === 0 ? 0 : nx / d;
    const uy = d === 0 ? 1 : ny / d;
    entity.x = c.x + ux * rx;
    entity.y = c.y + uy * ry;
  }
}
