import { ensureLateTextures } from '../objects/placeholderTextures.js';
import Phaser from 'phaser';
import Button from '../ui/Button.js';
import { isLevelOpen } from '../ui/LevelSelect.js';
import { LEVELS } from '../data/levels.js';
import { getStars } from '../data/progress.js';
import { COLORS, CSS, FONT } from '../data/colors.js';
import { makeCanvasTexture } from '../fx/canvasUtil.js';
import { addText, setSource } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';
import { playSfx } from '../fx/sound.js';
import { goToScene } from '../systems/sceneFlow.js';
import { audio } from '../audio/AudioManager.js';

// Where things are on the map picture, as fractions of the picture (0..1).
// If you paint a new map, only these numbers need to change.
const NODES = {
  sann: { x: 0.235, y: 0.735 },
  amri: { x: 0.805, y: 0.753 },
  miri: { x: 0.375, y: 0.35 },
};
// the paths between the nodes (a few points each, they are smoothed)
const PATHS = [
  ['sann', 'amri', [[0.31, 0.68], [0.42, 0.7], [0.52, 0.66], [0.62, 0.7], [0.72, 0.72]]],
  ['amri', 'miri', [[0.74, 0.6], [0.66, 0.5], [0.56, 0.43], [0.46, 0.4]]],
];
const ICONS = {
  sann: ['behroopia-blob', 'trojan-horse'],
  amri: ['hathoda-body', 'taala-ghost'],
  miri: ['jadugar-head'],
};
const WALK_SPEED = 360; // pixels per second
const DODO_SIDE = 56; // Dodo stands next to a node, so its stars stay visible

// The World Map of Ranikot. Dodo stands on a node and walks along the paths (arrow keys or a click).
// Enter / E starts the level. Background: public/assets/backgrounds/ranikot-map.* if present,
// else a parchment map drawn in code. If anything goes wrong the Levels list opens instead.
export default class WorldMapScene extends Phaser.Scene {
  constructor() {
    super('WorldMap');
  }

  create() {
    try {
      this.build();
    } catch (e) {
      console.warn('World Map failed, using the Levels list', e);
      this.scene.start('Menu', { openLevels: true });
    }
  }

  build() {
    ensureLateTextures(this);
    this.cameras.main.fadeIn(500, 11, 13, 26);
    this.leaving = false;
    audio.playMusic('music-menu');
    this.hover = null;
    this.walk = null;
    this.queue = [];
    this.time_ = 0;

    this.buildBackground();
    this.layoutNodes();
    this.buildPaths();
    this.buildNodes();
    this.buildDodo();
    this.buildCard();
    this.buildHeader();

    const savedNode = this.registry.get('mapNode');
    this.current = savedNode && NODES[savedNode] ? savedNode : this.furthestOpen();
    const p = this.pos[this.current];
    this.dodo.setPosition(p.x + DODO_SIDE, p.y - 4);
    this.showCard(this.current);

    this.keys = this.input.keyboard.addKeys({ left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', a: 'A', d: 'D', w: 'W', s: 'S', enter: 'ENTER', use: 'E', space: 'SPACE', esc: 'ESC' });
  }

  furthestOpen() {
    return ['miri', 'amri', 'sann'].find((id) => isLevelOpen(id)) || 'sann';
  }

  // ---------- Pictures ----------

  buildBackground() {
    if (this.textures.exists('ranikot-map')) {
      const img = this.textures.get('ranikot-map').getSourceImage();
      this.mapScale = Math.max(1280 / img.width, 720 / img.height);
      this.mapSize = { w: img.width * this.mapScale, h: img.height * this.mapScale };
      this.add.image(640, 360, 'ranikot-map').setScale(this.mapScale).setDepth(-10);
    } else {
      this.mapSize = { w: 1280, h: 720 };
      this.buildParchment();
    }
    // a soft shade at the edges so the cards and names can be read
    makeCanvasTexture(this, 'map-shade', 1280, 720, (ctx) => {
      const g = ctx.createRadialGradient(640, 360, 250, 640, 360, 780);
      g.addColorStop(0, 'rgba(20,6,30,0)');
      g.addColorStop(1, 'rgba(20,6,30,0.55)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1280, 720);
    });
    this.add.image(0, 0, 'map-shade').setOrigin(0).setDepth(-9);
  }

  // A parchment map drawn in code (used when ranikot-map is missing): paper, the wavy wall, a river, Miri Fort.
  buildParchment() {
    makeCanvasTexture(this, 'map-parchment', 1280, 720, (ctx) => {
      const paper = ctx.createRadialGradient(640, 360, 120, 640, 360, 800);
      paper.addColorStop(0, '#F0DEB0');
      paper.addColorStop(1, '#C49A5C');
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.strokeStyle = 'rgba(90,50,20,0.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        ctx.ellipse(640, 380, 150 + i * 36, 80 + i * 22, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // the wall: a wavy ring
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.05) {
        const r = 1 + 0.06 * Math.sin(a * 5) + 0.04 * Math.sin(a * 3 + 1);
        const x = 640 + Math.cos(a) * 520 * r;
        const y = 390 + Math.sin(a) * 270 * r;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.lineWidth = 16;
      ctx.strokeStyle = '#7A5230';
      ctx.stroke();
      ctx.lineWidth = 6;
      ctx.setLineDash([12, 10]);
      ctx.strokeStyle = '#E2C48A';
      ctx.stroke();
      ctx.setLineDash([]);
      // a river
      ctx.beginPath();
      ctx.moveTo(1010, 160);
      ctx.bezierCurveTo(900, 300, 1100, 380, 760, 520);
      ctx.bezierCurveTo(660, 560, 640, 620, 580, 700);
      ctx.lineWidth = 14;
      ctx.strokeStyle = 'rgba(90,150,190,0.8)';
      ctx.stroke();
    });
    this.add.image(0, 0, 'map-parchment').setOrigin(0).setDepth(-10);
  }

  // node position on the screen
  layoutNodes() {
    this.pos = {};
    Object.entries(NODES).forEach(([id, n]) => {
      this.pos[id] = this.toScreen(n.x, n.y);
    });
  }

  toScreen(fx, fy) {
    return { x: 640 + (fx - 0.5) * this.mapSize.w, y: 360 + (fy - 0.5) * this.mapSize.h };
  }

  // ---------- Paths ----------

  // smooth a list of points (Catmull-Rom) into many small steps
  smooth(points) {
    const out = [];
    const pts = [points[0], ...points, points[points.length - 1]];
    for (let i = 1; i < pts.length - 2; i++) {
      const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
      for (let k = 0; k < 12; k++) {
        const u = k / 12;
        const u2 = u * u;
        const u3 = u2 * u;
        out.push({
          x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
          y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
        });
      }
    }
    out.push(points[points.length - 1]);
    return out;
  }

  buildPaths() {
    this.edges = {}; // 'a>b' -> list of points from a to b
    this.neighbours = {};
    const g = this.add.graphics().setDepth(1);
    PATHS.forEach(([a, b, mid]) => {
      const pts = this.smooth([this.pos[a], ...mid.map(([x, y]) => this.toScreen(x, y)), this.pos[b]]);
      this.edges[`${a}>${b}`] = pts;
      this.edges[`${b}>${a}`] = [...pts].reverse();
      (this.neighbours[a] = this.neighbours[a] || []).push(b);
      (this.neighbours[b] = this.neighbours[b] || []).push(a);
      // a dotted gold line with a dark edge
      let carry = 0;
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x;
        const dy = pts[i].y - pts[i - 1].y;
        carry += Math.hypot(dx, dy);
        if (carry < 18) continue;
        carry = 0;
        g.fillStyle(0x2a0e14, 0.85);
        g.fillCircle(pts[i].x, pts[i].y, 7.5);
        g.fillStyle(0xffd24a, 1);
        g.fillCircle(pts[i].x, pts[i].y, 5);
      }
    });
  }

  // ---------- Nodes ----------

  buildNodes() {
    this.nodes = {};
    Object.entries(NODES).forEach(([id, n]) => {
      const p = this.pos[id];
      const open = isLevelOpen(id);
      const c = this.add.container(p.x, p.y).setDepth(5);
      const g = this.add.graphics();
      // a round medallion with a gold ring and an Ajrak-red / indigo / grey middle
      g.fillStyle(0x000000, 0.4);
      g.fillCircle(0, 6, 40);
      g.fillStyle(0x3a1c16, 1);
      g.fillCircle(0, 0, 40);
      g.fillStyle(open ? (id === 'miri' ? COLORS.indigo : COLORS.red) : 0x7a7280, 1);
      g.fillCircle(0, 0, 34);
      g.lineStyle(4, open ? COLORS.gold : 0xb8b0c0, 1);
      g.strokeCircle(0, 0, 34);
      c.add(g);
      // number / boss hat / lock
      if (id === 'miri') c.add(this.add.image(0, 2, 'jadugar-hat').setScale(0.75));
      else c.add(this.add.text(0, -2, id === 'sann' ? '1' : '2', { fontFamily: FONT, fontSize: '40px', fontStyle: '700', color: CSS.cream, resolution: 2 }).setOrigin(0.5));
      if (!open) c.add(this.add.image(24, 24, 'icon-lock').setScale(0.55));
      c.setSize(90, 90);
      c.setInteractive({ useHandCursor: true });
      c.on('pointerover', () => this.setHover(id));
      c.on('pointerout', () => this.setHover(null));
      c.on('pointerup', () => this.clickNode(id));

      // name and stars under the node
      addText(this, p.x, p.y + 54, `level.${id}`, { fontFamily: FONT, fontSize: '24px', fontStyle: '700', color: CSS.cream, stroke: '#2a0e14', strokeThickness: 6 }).setOrigin(0.5).setDepth(6);
      const stars = [];
      if (open) {
        for (let i = 0; i < 3; i++) stars.push(this.add.image(p.x + (i - 1) * 30, p.y - 62, i < getStars(id) ? 'ui-star' : 'ui-star-off').setScale(0.42).setDepth(6));
      } else {
        addText(this, p.x, p.y + 80, 'map.locked', { fontFamily: FONT, fontSize: '19px', fontStyle: '600', color: '#E7DDF0', stroke: '#2a0e14', strokeThickness: 5 }).setOrigin(0.5).setDepth(6);
      }
      // the current level pulses
      if (open && getStars(id) === 0) this.tweens.add({ targets: c, scale: 1.1, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.nodes[id] = { container: c, open };
    });
  }

  buildDodo() {
    if (this.textures.exists('dodo-full')) {
      const tex = this.textures.get('dodo-full').getSourceImage();
      this.dodoImage = this.add.image(0, 0, 'dodo-full').setOrigin(0.5, 1).setScale(96 / tex.height);
    } else {
      this.dodoImage = this.add.image(0, 0, 'dodo-head').setOrigin(0.5, 1).setScale(0.9);
    }
    this.dodoShadow = this.add.image(0, 0, 'shadow').setScale(0.9, 0.45).setAlpha(0.7);
    this.dodo = this.add.container(0, 0, [this.dodoShadow, this.dodoImage]).setDepth(8);
    this.dodoFacing = 1;
  }

  // ---------- The info card (bottom) ----------

  buildCard() {
    const w = 980;
    const h = 92;
    const card = this.add.container(640, 670).setDepth(20);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(-w / 2, -h / 2 + 8, w, h, 24);
    g.fillStyle(0x5a0f1d, 1);
    g.fillRoundedRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 26);
    g.fillStyle(COLORS.cream, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 22);
    g.fillStyle(COLORS.indigo, 1);
    g.fillRoundedRect(-w / 2, -h / 2, 250, h, { tl: 22, tr: 0, bl: 22, br: 0 });
    card.add(g);
    this.cardName = addText(this, -w / 2 + 125, -14, 'level.sann', { fontFamily: FONT, fontSize: '30px', fontStyle: '700', color: CSS.cream, align: 'center', wordWrap: { width: 230 } }).setOrigin(0.5);
    this.cardStars = [0, 1, 2].map((i) => this.add.image(-w / 2 + 125 + (i - 1) * 40, 24, 'ui-star-off').setScale(0.42));
    this.cardIcons = [0, 1, 2].map((i) => this.add.image(-w / 2 + 300 + i * 50, -27, 'shadow').setVisible(false));
    this.cardMonsters = addText(this, -w / 2 + 280, -27, 'map.sann.monsters', { fontFamily: FONT, fontSize: '22px', fontStyle: '700', color: CSS.red }).setOrigin(0, 0.5);
    this.cardLesson = addText(this, -w / 2 + 280, 7, 'map.sann.lesson', { fontFamily: FONT, fontSize: '22px', fontStyle: '600', color: CSS.indigo, wordWrap: { width: 670 } }).setOrigin(0, 0.5);
    this.cardHint = addText(this, -w / 2 + 280, 33, 'map.hint', { fontFamily: FONT, fontSize: '18px', fontStyle: '600', color: '#7A6A5A' }).setOrigin(0, 0.5);
    card.add([this.cardName, ...this.cardStars, ...this.cardIcons, this.cardMonsters, this.cardLesson, this.cardHint]);
    this.card = card;
  }

  buildHeader() {
    addText(this, 640, 38, 'map.title', { fontFamily: FONT, fontSize: '50px', fontStyle: '700', color: CSS.cream, stroke: '#2a0e14', strokeThickness: 9 }).setOrigin(0.5).setDepth(20);
    new Button(this, 1150, 44, 'map.menu', () => this.leave('Menu'), { width: 180, height: 56, fontSize: 24, style: 'indigo' }).setDepth(20);
  }

  // what the card says for a node
  showCard(id) {
    const n = NODES[id];
    this.cardId = id;
    setSource(this.cardName, `level.${id}`);
    setSource(this.cardMonsters, `map.${id}.monsters`);
    setSource(this.cardLesson, `map.${id}.lesson`);
    const open = isLevelOpen(id);
    const stars = getStars(id);
    this.cardStars.forEach((s, i) => s.setTexture(i < stars ? 'ui-star' : 'ui-star-off').setVisible(open));
    const list = ICONS[id] || [];
    this.cardIcons.forEach((img, i) => {
      if (!list[i] || !this.textures.exists(list[i])) {
        img.setVisible(false);
        return;
      }
      const frame = this.textures.getFrame(list[i]);
      img.setTexture(list[i]).setVisible(true).setScale(Math.min(1, 40 / Math.max(frame.width, frame.height)));
    });
    // icons sit left of the monsters line: move the texts right of them
    const shift = list.length ? list.length * 50 + 6 : 0;
    this.cardMonsters.setX(-490 + 280 + shift);
    if (!open) setSource(this.cardHint, () => t('map.needStar', { name: t(LEVELS[this.previousLevel(id)].nameKey) }));
    else setSource(this.cardHint, 'map.hint');
  }

  previousLevel(id) {
    return id === 'amri' ? 'sann' : 'amri';
  }

  setHover(id) {
    this.hover = id;
    this.showCard(id || this.current);
    if (id) this.tweens.add({ targets: this.nodes[id].container, scale: 1.12, duration: 120, ease: 'Back.Out' });
  }

  // ---------- Moving ----------

  // the shortest way (a list of node names) from one node to another (breadth-first search)
  route(from, to) {
    const prev = { [from]: null };
    const todo = [from];
    while (todo.length) {
      const id = todo.shift();
      if (id === to) break;
      (this.neighbours[id] || []).forEach((nb) => {
        if (!(nb in prev)) {
          prev[nb] = id;
          todo.push(nb);
        }
      });
    }
    if (!(to in prev)) return [];
    const path = [];
    for (let id = to; id !== from; id = prev[id]) path.unshift(id);
    return path;
  }

  clickNode(id) {
    if (this.walk || this.leaving) return;
    if (id === this.current) this.play();
    else this.goTo(id);
  }

  goTo(id) {
    this.queue = this.route(this.current, id);
    this.nextStep();
  }

  nextStep() {
    const to = this.queue.shift();
    if (!to) {
      this.walk = null;
      this.showCard(this.hover || this.current);
      return;
    }
    const points = this.edges[`${this.current}>${to}`];
    const lens = [0];
    for (let i = 1; i < points.length; i++) lens.push(lens[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
    this.walk = { points, lens, total: lens[lens.length - 1], dist: 0, to };
    playSfx(this, 'sfx-map-step');
  }

  // arrow keys: walk to the neighbour in that direction
  press(dx, dy) {
    if (this.walk) return;
    const here = this.pos[this.current];
    let best = null;
    let bestDot = 0.35;
    (this.neighbours[this.current] || []).forEach((id) => {
      const p = this.edges[`${this.current}>${id}`][4] || this.pos[id]; // the first part of the path shows the direction
      const vx = p.x - here.x;
      const vy = p.y - here.y;
      const len = Math.hypot(vx, vy) || 1;
      const dot = (vx / len) * dx + (vy / len) * dy;
      if (dot > bestDot) {
        bestDot = dot;
        best = id;
      }
    });
    if (best) this.goTo(best);
  }

  play() {
    if (this.leaving || this.walk) return;
    const n = NODES[this.current];
    if (!isLevelOpen(this.current)) {
      playSfx(this, 'sfx-map-locked');
      const c = this.nodes[this.current].container;
      this.tweens.add({ targets: c, x: c.x + 8, duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    this.leaving = true;
    this.registry.set('mapNode', this.current);
    playSfx(this, 'sfx-click');
    const sceneKey = LEVELS[this.current].sceneKey;
    this.cameras.main.fadeOut(500, 11, 13, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => goToScene(this, sceneKey));
  }

  leave(sceneKey) {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(400, 11, 13, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneKey));
  }

  update(time, delta) {
    if (!this.keys) return;
    const dt = Math.min(delta, 50) / 1000;
    this.time_ += dt;
    const k = this.keys;
    const J = Phaser.Input.Keyboard.JustDown;
    if (J(k.esc)) this.leave('Menu');
    if (J(k.enter) || J(k.use) || J(k.space)) this.play();
    if (J(k.left) || J(k.a)) this.press(-1, 0);
    if (J(k.right) || J(k.d)) this.press(1, 0);
    if (J(k.up) || J(k.w)) this.press(0, -1);
    if (J(k.down) || J(k.s)) this.press(0, 1);

    let bob = Math.sin(this.time_ * 3) * 2;
    if (this.walk) {
      const w = this.walk;
      w.dist = Math.min(w.total, w.dist + WALK_SPEED * dt);
      let i = 1;
      while (i < w.lens.length - 1 && w.lens[i] < w.dist) i++;
      const a = w.points[i - 1];
      const b = w.points[i];
      const seg = w.lens[i] - w.lens[i - 1] || 1;
      const u = Phaser.Math.Clamp((w.dist - w.lens[i - 1]) / seg, 0, 1);
      const x = a.x + (b.x - a.x) * u;
      const y = a.y + (b.y - a.y) * u;
      if (Math.abs(b.x - a.x) > 0.5) this.dodoFacing = b.x > a.x ? 1 : -1;
      this.dodo.setPosition(x + DODO_SIDE, y - 4);
      bob = -Math.abs(Math.sin(this.time_ * 14)) * 10;
      if (w.dist >= w.total) {
        this.current = w.to;
        this.nextStep();
      }
    }
    this.dodoImage.y = bob;
    this.dodoImage.scaleX = Math.abs(this.dodoImage.scaleX) * this.dodoFacing * (this.textures.exists('dodo-full') ? -1 : 1);
  }
}
