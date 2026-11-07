import Phaser from 'phaser';
import Player from '../objects/Player.js';
import Mithu from '../objects/Mithu.js';
import Jadugar from '../objects/Jadugar.js';
import Building from '../objects/Building.js';
import WallSection from '../objects/WallSection.js';
import BrickSystem from '../objects/BrickSystem.js';
import CarryStack from '../objects/CarryStack.js';
import { ensureBrickTexture } from '../objects/amriTextures.js';
import GroundFx from '../fx/GroundFx.js';
import Atmosphere from '../level/Atmosphere.js';
import AmriSpawner from '../systems/AmriSpawner.js';
import LevelDirector from '../systems/LevelDirector.js';
import HackerBrain, { WALLS, BUILDINGS } from '../ai/HackerBrain.js';
import { ratePassword } from '../ai/passwordAI.js';
import SpeechBubble from '../ui/SpeechBubble.js';
import KeyHint from '../ui/KeyHint.js';
import { buildCourtyardArt } from '../level/CourtyardArt.js';
import { buildFallbackCourtyard } from '../level/fallbackCourtyard.js';
import { buildAmriBackground } from '../level/amriArt.js';
import { LEVELS } from '../data/levels.js';
import { saveResult } from '../data/progress.js';
import { saveSnapshot } from '../ai/chatContext.js';
import { settings } from '../data/settings.js';
import { CSS, FONT } from '../data/colors.js';
import { addText } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';
import { playSfx } from '../fx/sound.js';

const EVENTS = [
  'send', 'first-hathoda', 'first-ghost', 'wall-broken', 'wall-levelup', 'hathoda-steal', 'hathoda-gave-up', 'hathoda-arrived',
  'building-locked', 'building-unlocked', 'no-backup', 'level-end',
];
const FOLLOW_OFFSET_Y = 70;
const PICK_SCROLL = 92;

// Level 2: Amri Gate. Hathoda Dev hammers the wall sections, Taala Bhoot locks the buildings.
// Dodo builds strong passwords with bricks (zxcvbn rates them) and stores Backup Scrolls in the Kutubkhana.
//
//      gate (Hathoda and the ghosts come in here)
//   ========= wall: LEFT | CENTER | RIGHT (each with a password plaque) =========
//      Dodo's yard: bricks, Anaaj Ghar, Kutubkhana, Ghar
export default class Level2Scene extends Phaser.Scene {
  constructor() {
    super('Level2');
  }

  create() {
    this.cameras.main.fadeIn(500, 11, 13, 26);
    this.hitStopLeft = 0;
    this.stats = {
      caught: 0, sneaked: 0, giftsOpened: 0, giftsRevealed: 0, giftsIgnored: 0, bugsZapped: 0, earned: 0,
      bricksPlaced: 0, wallsBroken: 0, buildingsLocked: 0, restored: 0,
    };
    this.said = {};
    this.jadugarCooldown = 0;
    this.drainTimer = 0;
    this.levelData = LEVELS.amri;
    const lv = this.levelData;
    ratePassword('warm-up'); // zxcvbn needs a moment the first time

    // ----- the courtyard picture -----
    const art = buildAmriBackground(this) || buildCourtyardArt(this) || buildFallbackCourtyard(this);
    this.art = art;
    this.tintScene(0xe9b9b0); // a cooler, reddish look than Level 1

    const b = art.bounds;
    this.wallY = Math.round(b.minY + (b.maxY - b.minY) * 0.2);
    const yard = { minY: this.wallY + 62, maxY: b.maxY, minXAt: b.minXAt, maxXAt: b.maxXAt };

    this.fx = new GroundFx(this);
    this.atmosphere = new Atmosphere(this, art.k);
    this.buildWalls(art, lv);
    this.buildBuildings(yard);

    // solid things in Dodo's yard
    const colliders = this.buildings.map((bd) => bd.collider);
    art.colliders.filter((c) => c.y > this.wallY + 40).forEach((c) => colliders.push(c));
    this.player = new Player(this, (yard.minXAt(this.wallY + 250) + yard.maxXAt(this.wallY + 250)) / 2, this.wallY + 250, yard, { colliders }, this.fx);
    this.mithu = new Mithu(this, this.player);
    this.bubble = new SpeechBubble(this);
    this.eHint = new KeyHint(this, 'E');
    this.carry = new CarryStack(this, this.player);

    this.bricks = new BrickSystem(this, { ...yard, colliders });
    this.buildScrolls();
    this.buildFliers();
    this.buildShockRings();

    // the AI Hacker
    this.brain = new HackerBrain();
    this.buildJadugar();
    this.buildGateSwirls();
    const world = { colliders: buildingOnly(this.buildings), gate: art.gate, buildings: this.buildings };
    this.spawner = new AmriSpawner(this, world, lv, this.brain, this.sections, this.buildings);
    this.director = new LevelDirector(this, lv, this.spawner, this.brain);

    this.cameras.main.setBounds(0, 0, art.world.width, art.world.height);
    this.cameras.main.setDeadzone(120, 80);
    this.cameras.main.centerOn(this.player.x, this.player.y - 40);

    this.scene.stop('UI');
    this.scene.launch('UI', { level: this, config: lv });

    this.wireEvents();
    this.showHint();
    if (import.meta.env.DEV) this.setupDebug();

    this.time.delayedCall(700, () => this.director.start());
    this.events.once('shutdown', () => {
      EVENTS.forEach((name) => this.events.off(name));
      saveSnapshot(this.game, this);
    });
  }

  // all the pictures of the background (and the pieces cut out of it) get the same tint
  tintScene(color) {
    this.children.list.forEach((o) => {
      if (o.type === 'Image' && o.texture && (o.texture.key === 'courtyard-bg' || o.texture.key === 'amri-gate-bg' || o.texture.key.startsWith('piece-'))) o.setTint(color);
    });
  }

  // ---------- Building the level ----------

  buildWalls(art, lv) {
    const b = art.bounds;
    const gap = 12;
    const left = b.minXAt(this.wallY) - 18;
    const right = b.maxXAt(this.wallY) + 18;
    const width = (right - left - gap * 2) / 3;
    this.sections = WALLS.map((id, i) => {
      const x = left + width * (i + 0.5) + gap * i;
      const s = new WallSection(this, id, x, this.wallY, lv.startPasswords[id]);
      s.span = width;
      s.setScale(width / 470, 1);
      return s;
    });
    this.sectionById = Object.fromEntries(this.sections.map((s) => [s.id, s]));
  }

  buildBuildings(yard) {
    const mid = (yard.minXAt(this.wallY + 300) + yard.maxXAt(this.wallY + 300)) / 2;
    const spread = (yard.maxXAt(this.wallY + 300) - yard.minXAt(this.wallY + 300)) * 0.31;
    const yEnd = this.wallY + (yard.maxY - this.wallY) * 0.4;
    const yMid = this.wallY + (yard.maxY - this.wallY) * 0.58;
    const defs = [
      ['building_anaaj', 'building-anaaj', mid - spread, yEnd],
      ['building_kutubkhana', 'building-kutubkhana', mid, yMid],
      ['building_ghar', 'building-ghar', mid + spread, yEnd],
    ];
    this.buildings = defs.map(([id, tex, x, y]) => new Building(this, id, tex, x, y));
    this.kutub = this.buildings[1];

    // the backup shelf next to the Kutubkhana
    this.shelf = this.add.image(this.kutub.x - 140, this.kutub.y, 'prop-shelf').setOrigin(0.5, 1).setScale(1.1).setDepth(this.kutub.y);
    this.shelfGlow = this.add.image(this.shelf.x, this.shelf.y - 60, 'fx-glow').setTint(0x9bdcff).setBlendMode(Phaser.BlendModes.ADD).setScale(1.4).setAlpha(0).setDepth(this.kutub.y + 1);
    this.shelfPoint = { x: this.shelf.x, y: this.shelf.y };
  }

  // one Backup Scroll lies next to each building (during Tayyari)
  buildScrolls() {
    this.scrolls = this.buildings.map((bd) => {
      const spot = bd.scrollSpot;
      const image = this.add.image(spot.x, spot.y, 'backup-scroll').setOrigin(0.5, 1).setScale(1.3).setDepth(spot.y).setVisible(false);
      const glow = this.add.image(spot.x, spot.y - 24, 'fx-glow').setTint(0xffe08a).setBlendMode(Phaser.BlendModes.ADD).setScale(0.8).setAlpha(0.5).setDepth(spot.y - 1).setVisible(false);
      return { building: bd, image, glow, active: false, x: spot.x, y: spot.y, time: Math.random() * 6 };
    });
  }

  showScrolls() {
    this.scrolls.forEach((s, i) => {
      if (s.building.backedUp) return;
      s.active = true;
      s.image.setVisible(true).setScale(0);
      s.glow.setVisible(true);
      this.tweens.add({ targets: s.image, scale: 1.3, duration: 420, delay: i * 160, ease: 'Back.Out' });
    });
  }

  // little pictures that fly (a brick to a wall, a scroll to the shelf or to a locked building)
  buildFliers() {
    this.fliers = [];
    for (let i = 0; i < 4; i++) this.fliers.push(this.add.image(0, 0, 'fx-print').setVisible(false).setDepth(95000).setOrigin(0.5, 1));
  }

  flyer(texture, from, to, duration, onArrive, scale = 1) {
    const f = this.fliers.find((img) => !img.visible);
    if (!f) {
      onArrive();
      return;
    }
    f.setTexture(texture).setVisible(true).setScale(scale).setAngle(0);
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: 'Sine.InOut',
      onUpdate: (tw) => {
        const p = tw.getValue();
        f.setPosition(from.x + (to.x - from.x) * p, from.y + (to.y - from.y) * p - Math.sin(p * Math.PI) * 70);
        f.setAngle(p * 360);
      },
      onComplete: () => {
        f.setVisible(false);
        onArrive();
      },
    });
  }

  // the shockwave rings of Hathoda's hammer
  buildShockRings() {
    this.rings = [];
    for (let i = 0; i < 4; i++) {
      const image = this.add.image(0, 0, 'fx-ring').setVisible(false).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffe6a0);
      this.rings.push({ image, active: false, t: 0, x: 0, y: 0 });
    }
  }

  shock(x, y) {
    const r = this.rings.find((s) => !s.active);
    if (!r) return;
    Object.assign(r, { active: true, t: 0, x, y });
    r.image.setVisible(true).setPosition(x, y).setDepth(y + 1);
  }

  buildJadugar() {
    const spot = this.art.jadugar;
    this.add.image(spot.x, spot.y + 6, 'prop-ledge').setScale(0.95).setDepth(spot.y - 1).setTint(0xe9b9b0);
    this.jadugar = new Jadugar(this, spot.x, spot.y);
  }

  buildGateSwirls() {
    this.swirls = [];
    for (let i = 0; i < 3; i++) this.swirls.push(this.add.image(0, 0, 'fx-swirl').setBlendMode(Phaser.BlendModes.ADD).setVisible(false));
  }

  gateSwirl(x, y) {
    const swirl = this.swirls.find((s) => !s.visible);
    if (!swirl) return;
    swirl.setPosition(x, y - 30).setVisible(true).setScale(0.2).setAlpha(1).setAngle(0).setDepth(y - 1);
    this.tweens.add({ targets: swirl, scale: 0.9, duration: 320, ease: 'Back.Out' });
    this.tweens.add({ targets: swirl, angle: 300, duration: 1100, ease: 'Sine.Out' });
    this.tweens.add({ targets: swirl, alpha: 0, scale: 0.4, delay: 700, duration: 400, onComplete: () => swirl.setVisible(false) });
  }

  // ---------- Level steps (called by the LevelDirector) ----------

  playIntro(seconds) {
    const cam = this.cameras.main;
    this.player.inputLocked = true;
    cam.stopFollow();
    cam.centerOn(this.jadugar.x + 290, this.jadugar.y + 140);
    this.time.delayedCall(900, () => this.jadugar.laugh());
    this.time.delayedCall(1100, () => this.say('mithu.l2.intro1'));
    this.time.delayedCall((seconds - 3.2) * 1000, () => {
      cam.pan(this.player.x, this.player.y - FOLLOW_OFFSET_Y, 2300, 'Sine.easeInOut', true, (c, progress) => {
        if (progress < 1) return;
        cam.startFollow(this.player, true, 0.08, 0.08, 0, FOLLOW_OFFSET_Y);
        this.player.inputLocked = false;
      });
    });
    this.time.delayedCall((seconds - 1.8) * 1000, () => this.say('mithu.l2.intro2'));
  }

  // Tayyari: bricks to collect, scrolls to store
  playPrep() {
    this.prepping = true;
    this.showScrolls();
    this.bricks.timer = 0.2;
    this.time.delayedCall(300, () => this.say('mithu.l2.prep1'));
    this.time.delayedCall(8500, () => this.say('mithu.l2.prep2'));
    this.time.delayedCall(16500, () => this.say('mithu.l2.prep3'));
  }

  lookAtJadugar(on) {
    const cam = this.cameras.main;
    if (on) {
      this.player.inputLocked = true;
      cam.stopFollow();
      cam.pan(this.jadugar.x + 290, this.jadugar.y + 140, 700, 'Sine.easeInOut');
    } else {
      cam.pan(this.player.x, this.player.y - FOLLOW_OFFSET_Y, 700, 'Sine.easeInOut', true, (c, progress) => {
        if (progress < 1) return;
        cam.startFollow(this.player, true, 0.08, 0.08, 0, FOLLOW_OFFSET_Y);
        this.player.inputLocked = false;
      });
    }
  }

  // ---------- Events ----------

  wireEvents() {
    const ev = this.events;
    const lv = this.levelData;

    ev.on('send', (x, y) => {
      this.jadugar.point(x, y);
      this.gateSwirl(x, y);
    });
    ev.on('first-hathoda', () => this.sayOnce('firstHathoda', 'mithu.l2.firstHathoda'));
    ev.on('first-ghost', () => this.sayOnce('firstGhost', 'mithu.l2.firstGhost'));

    ev.on('wall-broken', (section) => {
      this.stats.sneaked++;
      this.stats.wallsBroken++;
      this.brain.recordBroke('hathoda', section.id);
      this.hud('setSneaked', this.stats.sneaked);
      this.sayOnce('wallBroken', 'mithu.l2.wallBroken');
      this.jadugarReacts(true);
    });
    ev.on('wall-levelup', () => this.sayOnce('wallStrong', 'mithu.l2.wallStrong'));
    ev.on('hathoda-steal', (h) => {
      this.hud('stealCoins', lv.stealAmount, () => this.toScreen(h.x, h.y - 70));
      playSfx(this, 'sfx-laugh');
    });
    ev.on('hathoda-gave-up', () => {
      this.stats.caught++;
      this.hud('setCaught', this.stats.caught);
      this.sayOnce('hathodaTired', 'mithu.l2.hathodaTired');
      this.jadugarReacts(false);
    });

    ev.on('building-locked', (b) => {
      this.stats.buildingsLocked++;
      if (!b.backedUp) {
        this.stats.sneaked++;
        this.brain.recordBroke('taala', b.id);
        this.hud('setSneaked', this.stats.sneaked);
        this.jadugarReacts(true);
      }
    });
    ev.on('building-unlocked', (b, restored) => {
      if (restored) {
        this.stats.caught++;
        this.stats.restored++;
        this.hud('setCaught', this.stats.caught);
        this.stats.earned += 2;
        const p = this.toScreen(b.x, b.y - 120);
        this.hud('addCoins', 2, p.x, p.y);
        this.sayOnce('restored', 'mithu.l2.restored');
        this.jadugarReacts(false);
      }
    });
    ev.on('no-backup', () => this.sayOnce('noBackup', 'mithu.l2.noBackup'));
    ev.on('level-end', () => this.finishLevel());
  }

  jadugarReacts(playerFailed) {
    if (this.jadugarCooldown > 0) return;
    this.jadugarCooldown = 4;
    this.hud('setJadugarMood', playerFailed ? 'laugh' : 'angry');
    if (playerFailed) this.jadugar.laugh();
    else this.jadugar.beaten();
  }

  // 1 to 3 stars: how many attacks were stopped compared with the damage done
  computeStars() {
    const { caught, sneaked } = this.stats;
    if (sneaked === 0) return 3;
    return caught / (caught + sneaked) >= 0.65 ? 2 : 1;
  }

  finishLevel() {
    const stars = this.computeStars();
    const tally = saveResult(this.levelData.id, stars);
    saveSnapshot(this.game, this);
    const s = this.stats;
    this.hud('showResults', {
      stars,
      rows: [
        ['results.stopped', s.caught, 'icon-caught'],
        ['results.damage', s.sneaked, 'icon-sneaked'],
        ['results.bricks', s.bricksPlaced, ensureBrickTexture(this, 'A')],
        ['results.coins', `+${s.earned}`, 'ui-coin'],
      ],
      weakness: this.brain.biggestWeakness(),
      tally: { ...tally },
      nextNameKey: this.levelData.nextNameKey,
      nextLocked: true,
    });
  }

  hud(method, ...args) {
    const ui = this.scene.get('UI');
    if (ui && ui.ready) ui[method](...args);
  }

  say(key) {
    this.bubble.say(t(key));
  }

  sayOnce(id, key) {
    if (this.said[id]) return;
    this.said[id] = true;
    this.say(key);
  }

  toScreen(x, y) {
    const cam = this.cameras.main;
    return { x: x - cam.scrollX, y: y - cam.scrollY };
  }

  smoke(x, y) {
    this.fx.smoke(x, y);
  }

  impact(ms, shake) {
    this.hitStopLeft = Math.max(this.hitStopLeft, ms / 1000);
    if (!settings.low && !settings.reduced) this.cameras.main.shake(120, shake);
  }

  // ---------- Things Dodo can do with E ----------

  // What can Dodo do right now? (the first one that fits is the answer)
  findInteraction() {
    const p = this.player;
    if (this.player.inputLocked) return null;

    // unlock a locked building
    for (const b of this.buildings) {
      if (b.locked && !b.unlocking && b.isNear(p)) return { type: 'unlock', building: b, at: b.topPoint };
    }
    // store a scroll on the shelf
    if (this.carry.scroll && Phaser.Math.Distance.Between(p.x, p.y, this.shelfPoint.x, this.shelfPoint.y) < 150) {
      return { type: 'store', at: { x: this.shelfPoint.x, y: this.shelfPoint.y - 120 } };
    }
    // place a brick on a wall section
    if (this.carry.count > 0) {
      const s = this.sections.find((sec) => sec.isNear(p) && !sec.isFull);
      if (s) return { type: 'place', section: s, at: { x: p.x, y: p.y - 250 } };
    }
    // pick up a scroll
    if (this.carry.canTakeScroll) {
      const s = this.scrolls.find((sc) => sc.active && Phaser.Math.Distance.Between(p.x, p.y, sc.x, sc.y) < PICK_SCROLL);
      if (s) return { type: 'scroll', scroll: s, at: { x: s.x, y: s.y - 70 } };
    }
    // pick up a brick
    if (this.carry.canTakeBrick) {
      const b = this.bricks.nearest(p);
      if (b) return { type: 'brick', brick: b, at: { x: b.x, y: b.y - 70 } };
    }
    return null;
  }

  doInteraction(act) {
    const p = this.player;
    switch (act.type) {
      case 'unlock':
        act.building.beginUnlock();
        break;
      case 'store': {
        const item = this.carry.popScroll();
        playSfx(this, 'sfx-scroll-store');
        this.flyer('backup-scroll', { x: item.x, y: item.y }, { x: this.shelfPoint.x, y: this.shelfPoint.y - 50 }, 520, () => {
          item.building.setBackedUp();
          this.tweens.add({ targets: this.shelfGlow, alpha: { from: 0.9, to: 0.25 }, duration: 800 });
          this.fx.sparkle(this.shelfPoint.x, this.shelfPoint.y - 60);
          this.sayOnce('stored', 'mithu.l2.stored');
        });
        break;
      }
      case 'place': {
        const brick = this.carry.popBrick();
        if (!brick) break;
        const section = act.section;
        const target = { x: section.plaque.x, y: section.plaque.y - 20 };
        this.flyer(ensureBrickTexture(this, brick.ch), { x: brick.x, y: brick.y }, target, 420, () => {
          if (section.addChar(brick.ch)) {
            this.stats.bricksPlaced++;
            playSfx(this, 'sfx-brick-place');
            this.sayOnce('firstPlace', 'mithu.l2.firstPlace');
          } else {
            this.bricks.place(brick.ch, p.x, p.y + 30, p.x, p.y - 100);
          }
        });
        break;
      }
      case 'scroll': {
        act.scroll.active = false;
        act.scroll.image.setVisible(false);
        act.scroll.glow.setVisible(false);
        this.carry.pushScroll(act.scroll.building, act.scroll.x, act.scroll.y - 20);
        playSfx(this, 'sfx-brick-pick');
        break;
      }
      case 'brick': {
        const ch = this.bricks.take(act.brick);
        this.carry.pushBrick(ch, act.brick.x, act.brick.y - 20);
        break;
      }
      default:
        break;
    }
  }

  // scroll magic: the backup flies from the shelf to the locked building and the chains shatter
  playRestore(building) {
    playSfx(this, 'sfx-scroll-restore');
    this.tweens.add({ targets: this.shelfGlow, alpha: { from: 1, to: 0.2 }, duration: 900 });
    this.flyer('backup-scroll', { x: this.shelfPoint.x, y: this.shelfPoint.y - 60 }, { x: building.x, y: building.y - 100 }, 700, () => {
      for (let i = 0; i < 5; i++) this.fx.sparkle(building.x + (Math.random() - 0.5) * 100, building.y - 60 - Math.random() * 100);
      building.finishUnlock(true);
    }, 1.6);
  }

  // ---------- Update ----------

  update(time, delta) {
    let dt = Math.min(delta, 50) / 1000;
    let step = delta;
    if (this.hitStopLeft > 0) {
      this.hitStopLeft -= dt;
      dt = 0;
      step = 0;
    }
    if (this.jadugarCooldown > 0) this.jadugarCooldown -= dt;

    this.player.update(time, step);
    this.sections.forEach((s) => s.update(dt));
    this.buildings.forEach((b) => b.update(dt, this.player));
    this.bricks.update(dt, this.director.step && (this.director.step.type === 'prep' || this.director.step.type === 'wave'));
    this.spawner.update(dt);
    this.director.update(dt);
    this.carry.update(dt);
    this.updateScrolls(dt);
    this.updateRings(dt);
    this.updateDrain(dt);
    this.mithu.update(dt);
    this.jadugar.update(dt);
    this.fx.update(dt);
    this.atmosphere.update(dt);
    this.updateInteraction();

    const s = this.toScreen(this.mithu.x, this.mithu.y - 52);
    this.bubble.follow(s.x, s.y);
    const pr = this.director.progress();
    this.hud('setPhase', pr.labelKey, pr.vars);
    this.hud('setTime', pr.elapsed, pr.total);
  }

  updateScrolls(dt) {
    for (const s of this.scrolls) {
      if (!s.active) continue;
      s.time += dt;
      s.image.y = s.y + Math.sin(s.time * 3) * 3;
      s.glow.setAlpha(0.4 + Math.sin(s.time * 4) * 0.15);
    }
  }

  // a locked building slowly costs coins
  updateDrain(dt) {
    if (!this.buildings.some((b) => b.locked)) return;
    this.drainTimer += dt;
    if (this.drainTimer < this.levelData.drainEvery) return;
    this.drainTimer = 0;
    for (const b of this.buildings) {
      if (!b.locked) continue;
      this.hud('stealCoins', 1, () => this.toScreen(b.x, b.y - 110));
    }
  }

  // shockwave rings: jump over them (Space) or Dodo is knocked back and drops what he carries
  updateRings(dt) {
    const p = this.player;
    for (const r of this.rings) {
      if (!r.active) continue;
      r.t += dt / 0.75;
      if (r.t >= 1) {
        r.active = false;
        r.image.setVisible(false);
        continue;
      }
      const radius = 30 + 230 * r.t;
      r.image.setScale(radius / 36).setAlpha(1 - r.t * 0.85);
      if (r.t > 0.08 && p.z < 28 && !(p.hurtTimer > 0)) {
        const dx = (p.x - r.x) / radius;
        const dy = (p.y - r.y) / (radius * 0.375);
        const d = Math.hypot(dx, dy);
        if (Math.abs(d - 1) < 0.14) this.hitDodo(r);
      }
    }
    if (p.hurtTimer > 0) p.hurtTimer -= dt;
  }

  hitDodo(ring) {
    const p = this.player;
    p.hurtTimer = 1.4;
    const dir = p.x >= ring.x ? 1 : -1;
    p.knockback(dir);
    this.impact(60, 0.004);
    playSfx(this, 'sfx-hit');
    const lost = this.carry.dropAll();
    lost.chars.forEach((ch, i) => {
      this.bricks.place(ch, p.x + dir * (60 + i * 46), Phaser.Math.Clamp(p.y + 24 + i * 12, this.wallY + 80, this.art.bounds.maxY - 10), p.x, p.y - 140);
    });
    if (lost.scroll) {
      const sc = this.scrolls.find((s) => s.building === lost.scroll);
      if (sc) {
        sc.active = true;
        sc.image.setVisible(true).setScale(1.3);
        sc.glow.setVisible(true);
      }
    }
    this.sayOnce('shock', 'mithu.l2.shock');
  }

  // E: show a sign, and do the action when the key is pressed
  updateInteraction() {
    const pressed = Phaser.Input.Keyboard.JustDown(this.player.keys.use);
    const act = this.findInteraction();
    if (act) {
      this.eHint.show();
      this.eHint.place(act.at.x, act.at.y);
      if (pressed) this.doInteraction(act);
    } else {
      this.eHint.hide();
    }
  }

  showHint() {
    const hint = addText(this, 640, 676, 'hud.controls2', {
      fontFamily: FONT,
      fontSize: '24px',
      fontStyle: '500',
      color: CSS.cream,
      backgroundColor: 'rgba(11,13,26,0.6)',
      padding: { x: 16, y: 6 },
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100000);
    this.tweens.add({ targets: hint, alpha: 0, delay: 9000, duration: 800, onComplete: () => hint.destroy() });
  }

  // Developers only: I = what the AI knows (console table).
  setupDebug() {
    this.input.keyboard.on('keydown-I', () => this.brain.printTable());
    window.__level = this;
  }
}

// the buildings are the only solid things for the monsters (they walk round them)
function buildingOnly(buildings) {
  return buildings.map((b) => b.collider);
}

void BUILDINGS;
