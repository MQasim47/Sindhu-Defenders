// Measurements for courtyard-bg (the painted fort picture).
// All numbers are in "picture pixels" of a 2000-wide copy of the picture.
// CourtyardArt.js converts them to world pixels.

// Walkable ground for the feet: top edge, bottom edge and the two slanted side walls.
export const WALK = {
  minY: 250,
  maxY: 975,
  // [y, x] points; x between them is interpolated
  left: [[250, 360], [380, 335], [560, 238], [700, 212], [975, 130]],
  right: [[250, 1680], [450, 1752], [600, 1792], [850, 1838], [975, 1862]],
};

// Where people come in (below the gate) and where they walk to (the fort centre).
export const GATE = { x: 1000, y: 236 };
export const CENTER = { x: 1000, y: 640 };

export const START = { x: 1000, y: 540 };

// Solid objects. [x, y, rx, ry, height, low]
//   x, y   = centre of the base on the ground
//   rx, ry = size of the base
//   height = how tall the object looks (used for "walk behind it")
//   low    = true: Dodo can jump over it
export const OBJECTS = [
  // clay pots, top left
  [642, 222, 26, 16, 50, 1],
  [688, 232, 24, 15, 55, 1],
  [720, 250, 27, 16, 58, 1],
  [765, 272, 29, 17, 60, 1],
  [783, 312, 25, 15, 50, 1],
  [815, 280, 19, 13, 38, 1],
  [852, 250, 20, 13, 42, 1],
  // palm trunks, top
  [438, 298, 16, 8, 0, 0],
  [498, 280, 15, 8, 0, 0],
  [1578, 272, 15, 8, 0, 0],
  [1612, 300, 14, 8, 0, 0],
  // barrels, crates, bench, well, hay: top right
  [1240, 268, 28, 15, 62, 1],
  [1297, 262, 27, 15, 66, 1],
  [1222, 312, 25, 16, 55, 1],
  [1383, 232, 27, 15, 52, 1],
  [1335, 302, 30, 14, 36, 1],
  [1400, 312, 38, 14, 36, 1],
  [1442, 328, 18, 12, 30, 1],
  [1470, 378, 27, 17, 52, 1],
  [1545, 412, 52, 30, 95, 0],
  [1625, 445, 42, 24, 40, 1],
  // right wall plants and barrel
  [1712, 390, 24, 13, 60, 1],
  [1735, 478, 28, 17, 70, 1],
  [1790, 650, 22, 14, 70, 1],
  [1835, 790, 34, 20, 70, 1],
  [1862, 930, 30, 15, 75, 1],
  // pots and charpai, left
  [318, 368, 24, 15, 50, 1],
  [308, 410, 24, 15, 52, 1],
  [282, 450, 22, 14, 48, 1],
  [268, 492, 24, 16, 58, 1],
  [375, 388, 28, 17, 55, 1],
  [442, 380, 24, 15, 50, 1],
  [545, 388, 62, 22, 38, 1],
  // pot pile, bottom left
  [210, 684, 38, 26, 70, 1],
  [178, 740, 34, 24, 66, 1],
  [256, 750, 30, 22, 58, 1],
  [262, 802, 32, 22, 56, 1],
  [168, 808, 26, 18, 48, 1],
  [210, 845, 28, 18, 48, 1],
  [133, 880, 34, 22, 60, 1],
  [256, 884, 22, 14, 46, 1],
  [104, 930, 30, 18, 48, 1],
  [200, 908, 18, 12, 32, 1],
  [340, 752, 28, 18, 46, 1],
  // bottom edge
  [590, 968, 100, 20, 40, 1],
  [428, 966, 34, 16, 70, 1],
  [742, 968, 33, 16, 68, 1],
  [1313, 962, 38, 18, 50, 1],
  [1402, 950, 34, 16, 70, 1],
  // palm trunks, bottom right
  [1538, 968, 15, 8, 0, 0],
  [1608, 968, 14, 8, 0, 0],
];

// Palms are tall: Dodo walks behind the leaves when he is "above" the trunk base.
// crown = [cx, cy, rx, ry] ellipse, trunk = polygon, base = y of the trunk bottom.
export const PALMS = [
  { crown: [388, 112, 108, 86], trunk: [[398, 165], [432, 160], [458, 300], [425, 302]], base: 300 },
  { crown: [558, 92, 98, 76], trunk: [[535, 130], [565, 130], [520, 285], [488, 285]], base: 282 },
  { crown: [1568, 62, 110, 80], trunk: [[1560, 120], [1596, 120], [1590, 272], [1566, 272]], base: 272 },
  { crown: [1652, 168, 82, 60], trunk: [[1636, 200], [1662, 200], [1625, 302], [1600, 302]], base: 302 },
  { crown: [1485, 780, 118, 105], trunk: [[1500, 860], [1540, 860], [1560, 975], [1530, 975]], base: 975 },
  { crown: [1655, 735, 118, 105], trunk: [[1615, 820], [1650, 820], [1620, 975], [1595, 975]], base: 975 },
];

// Wall torches (on the gate towers) and hanging banners (on the back wall).
export const TORCHES = [
  [792, 190],
  [1220, 192],
];
export const BANNERS = [
  [1350, 40],
  [1430, 40],
];
