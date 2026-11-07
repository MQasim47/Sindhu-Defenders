// Level 2 picture: public/assets/backgrounds/amri-gate-bg.(png|jpg|webp), if it exists.
// The picture is scaled to cover the world (2752 x 1536, like the Level 1 courtyard).
// We cannot measure an unknown picture, so the walking area is a simple rectangle (the numbers
// below are fractions of the picture: change them to match your art).
// If the file is missing this returns null and the level uses the Level 1 courtyard (tinted red).
const WORLD = { width: 2752, height: 1536 };
const AREA = { left: 0.1, right: 0.9, top: 0.3, bottom: 0.93 };
const GATE = { x: 0.5, y: 0.22 };
const JADUGAR = { x: 0.72, y: 0.17 };

export function buildAmriBackground(scene) {
  if (!scene.textures.exists('amri-gate-bg')) return null;
  const source = scene.textures.get('amri-gate-bg').getSourceImage();
  if (!source || !source.width) return null;

  const { width: W, height: H } = WORLD;
  const scale = Math.max(W / source.width, H / source.height);
  scene.add.image(W / 2, H / 2, 'amri-gate-bg').setScale(scale).setDepth(-10);

  return {
    world: { ...WORLD },
    k: 0, // (0 = no torches and banners of the Level 1 picture)
    colliders: [],
    start: { x: W / 2, y: H * 0.7 },
    gate: { x: W * GATE.x, y: H * GATE.y },
    center: { x: W / 2, y: H * 0.6 },
    jadugar: { x: W * JADUGAR.x, y: H * JADUGAR.y },
    bounds: {
      minY: H * AREA.top,
      maxY: H * AREA.bottom,
      minXAt: () => W * AREA.left,
      maxXAt: () => W * AREA.right,
    },
  };
}
