import { ensureLateTextures } from '../objects/placeholderTextures.js';
import Phaser from 'phaser';
import Player from '../objects/Player.js';
import Mithu from '../objects/Mithu.js';
import Jadugar from '../objects/Jadugar.js';
import Lantern from '../objects/Lantern.js';
import SpamBlobs from '../objects/SpamBlob.js';
import GroundFx from '../fx/GroundFx.js';
import Atmosphere from '../level/Atmosphere.js';
import WaveSpawner from '../systems/WaveSpawner.js';
import LevelDirector from '../systems/LevelDirector.js';
import HackerBrain from '../ai/HackerBrain.js';
import { resetRun, saveBrain } from '../ai/runMemory.js';
import SpeechBubble from '../ui/SpeechBubble.js';
import KeyHint from '../ui/KeyHint.js';
import { buildCourtyardArt } from '../level/CourtyardArt.js';
import { buildFallbackCourtyard } from '../level/fallbackCourtyard.js';
import { LEVELS, FIRST_LEVEL } from '../data/levels.js';
import { saveResult } from '../data/progress.js';
import { saveSnapshot } from '../ai/chatContext.js';
import { settings } from '../data/settings.js';
import { judge } from '../data/judge.js';
import { audio } from '../audio/AudioManager.js';
import { CSS, FONT } from '../data/colors.js';
import { addText } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';

const EVENTS = [
  'send', 'first-monster', 'first-horse', 'caught', 'stolen', 'safe', 'greeted', 'verified', 'slimed', 'dodged',
  'gift-opened', 'gift-revealed', 'gift-ignored', 'bug-bite', 'wave-start', 'level-end',
];
const GREET_DISTANCE = 190;
const FOLLOW_OFFSET_Y = 70; // Dodo sits a little below the middle, so Mithu's speech bubble has room above

// Level: the fort courtyard. The Jadugar Hacker (an AI) sends villagers, Behroopias and the
// Trojan Ghoda. Dodo checks them with the lantern (hold Q), greets friends and sweeps bugs (E),
// and Mithu helps with hints. The LevelDirector plays the steps of the level.
export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('Level');
  }

  create() {
    ensureLateTextures(this);
    this.cameras.main.fadeIn(500, 11, 13, 26);
    this.hitStopLeft = 0;
    this.stats = { caught: 0, sneaked: 0, giftsOpened: 0, giftsRevealed: 0, giftsIgnored: 0, bugsZapped: 0, earned: 0 };
    this.said = {}; // lines that were already said once
    this.sweepCooldown = 0;
    this.sweepLearned = false;
    this.jadugarCooldown = 0;
    this.levelData = LEVELS[FIRST_LEVEL];
    const lv = this.levelData;

    // Painted courtyard if the picture is there, otherwise simple generated walls.
    const art = buildCourtyardArt(this) || buildFallbackCourtyard(this);
    this.art = art;

    this.fx = new GroundFx(this);
    this.atmosphere = new Atmosphere(this, art.k);
    this.player = new Player(this, art.start.x, art.start.y, art.bounds, { colliders: art.colliders }, this.fx);
    this.mithu = new Mithu(this, this.player);
    this.bubble = new SpeechBubble(this);
    this.lantern = new Lantern(this, this.player);
    this.spam = new SpamBlobs(this);
    this.qHint = new KeyHint(this, 'Q');
    this.eHint = new KeyHint(this, 'E');
    this.lantern.onFirstUse = () => this.qHint.hide();

    // the AI Hacker: his brain, and the wizard who stands on the wall
    this.brain = new HackerBrain();
    resetRun(); // Level 1 starts a new run: the AI forgets the old one
    this.buildJadugar();
    this.buildGateSwirls();

    const world = {
      colliders: art.colliders,
      bounds: art.bounds,
      gate: art.gate,
      center: art.center,
      speedFactor: 0.8,
      throwChance: lv.throwChance,
    };
    this.spawner = new WaveSpawner(this, world, lv, this.brain);
    this.director = new LevelDirector(this, lv, this.spawner, this.brain);

    this.cameras.main.setBounds(0, 0, art.world.width, art.world.height);
    this.cameras.main.setDeadzone(120, 80);

    // HUD runs in its own scene, next to this one
    this.scene.stop('UI');
    this.scene.launch('UI', { level: this, config: lv });

    this.wireEvents();
    audio.playMusic('music-level');
    this.introSkipped = false;
    ['keydown-ENTER', 'keydown-SPACE'].forEach((e) => this.input.keyboard.on(e, () => this.skipIntro()));
    this.input.on('pointerdown', () => this.skipIntro());
    this.showHint();
    if (import.meta.env.DEV) this.setupDebug();

    // the intro starts with the camera on the Jadugar (it then moves to Dodo)
    this.time.delayedCall(700, () => this.director.start());

    // (Esc opens the pause menu, which lives in the UI scene)
    this.events.once('shutdown', () => {
      EVENTS.forEach((name) => this.events.off(name));
      saveSnapshot(this.game, this); // so "Ask Mithu" on the title screen knows the last game
    });
  }

  buildJadugar() {
    const spot = this.art.jadugar;
    this.add.image(spot.x, spot.y + 6, 'prop-ledge').setScale(0.95).setDepth(spot.y - 1);
    this.jadugar = new Jadugar(this, spot.x, spot.y);
  }

  // the magic swirl at the gate that the monsters step out of
  buildGateSwirls() {
    this.swirls = [];
    for (let i = 0; i < 3; i++) {
      this.swirls.push(this.add.image(0, 0, 'fx-swirl').setBlendMode(Phaser.BlendModes.ADD).setVisible(false));
    }
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

  // the camera shows the Jadugar, he laughs, then the camera flies to Dodo
  playIntro(seconds) {
    this.introTimers = [];
    const cam = this.cameras.main;
    this.player.inputLocked = true;
    cam.stopFollow();
    cam.centerOn(this.jadugar.x + 290, this.jadugar.y + 140);
    this.later(900, () => this.jadugar.laugh());
    this.later(1100, () => this.say('mithu.intro1'));
    this.later((seconds - 3.2) * 1000, () => {
      cam.pan(this.player.x, this.player.y - FOLLOW_OFFSET_Y, 2300, 'Sine.easeInOut', true, (c, progress) => {
        if (progress < 1) return;
        cam.startFollow(this.player, true, 0.08, 0.08, 0, FOLLOW_OFFSET_Y);
        this.player.inputLocked = false;
      });
    });
    this.later((seconds - 1.8) * 1000, () => this.say('mithu.intro2'));
  }

  // a timer of the intro (so that judge mode can skip the intro)
  later(ms, fn) {
    const timer = this.time.delayedCall(ms, fn);
    this.introTimers.push(timer);
    return timer;
  }

  // Judge mode: Enter, Space or a click skips the intro at once
  skipIntro() {
    const step = this.director && this.director.step;
    if (!judge.on || !step || step.type !== 'intro' || this.introSkipped) return;
    this.introSkipped = true;
    this.introTimers.forEach((timer) => timer.remove(false));
    const cam = this.cameras.main;
    cam.panEffect.reset();
    cam.centerOn(this.player.x, this.player.y - FOLLOW_OFFSET_Y);
    cam.startFollow(this.player, true, 0.08, 0.08, 0, FOLLOW_OFFSET_Y);
    this.player.inputLocked = false;
    this.director.next();
  }

  // While the Jadugar thinks (between two waves) the camera shows him, then goes back to Dodo.
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

  playPrep() {
    this.time.delayedCall(300, () => this.say('mithu.prep1'));
    this.time.delayedCall(7000, () => this.say('mithu.prep2'));
  }

  // ---------- Events from villagers, monsters and gifts ----------

  wireEvents() {
    const ev = this.events;
    const lv = this.levelData;

    ev.on('send', (x, y) => {
      this.jadugar.point(x, y);
      this.gateSwirl(x, y);
    });
    ev.on('first-monster', () => {
      this.say('mithu.firstBehroopia');
      this.time.delayedCall(1200, () => !this.lantern.used && this.qHint.show());
    });
    ev.on('first-horse', () => this.sayOnce('firstHorse', 'mithu.firstHorse'));
    ev.on('caught', () => {
      this.stats.caught++;
      this.hud('setCaught', this.stats.caught);
      this.sayOnce('firstReveal', 'mithu.firstReveal');
      this.jadugarReacts(false);
    });
    ev.on('stolen', (m) => {
      this.stats.sneaked++;
      this.brain.recordFail('phishing', m.kind);
      this.hud('setSneaked', this.stats.sneaked);
      this.hud('stealCoins', lv.stealAmount, () => this.toScreen(m.x, m.y - 50));
      this.sayOnce('firstSteal', 'mithu.firstSteal');
      this.jadugarReacts(true);
    });
    ev.on('safe', (v) => {
      this.stats.earned += lv.safeCoins;
      const p = this.toScreen(v.x, v.topPoint.y);
      this.hud('addCoins', lv.safeCoins, p.x, p.y + 30);
    });
    ev.on('greeted', (v) => {
      this.stats.earned += lv.greetBonus;
      this.fx.heart(v.x, v.topPoint.y);
      this.fx.heart(v.x + 18, v.topPoint.y + 6);
      const p = this.toScreen(v.x, v.topPoint.y);
      this.hud('addCoins', lv.greetBonus, p.x, p.y + 30);
    });
    ev.on('verified', () => this.sayOnce('verified', 'mithu.verified'));
    ev.on('slimed', () => this.sayOnce('slimed', 'mithu.slimed'));
    ev.on('dodged', () => this.sayOnce('dodged', 'mithu.dodged'));

    // Trojan Ghoda
    ev.on('gift-opened', () => {
      this.stats.giftsOpened++;
      this.brain.recordFail('trojan');
      this.sayOnce('giftOpened', 'mithu.giftOpened');
      this.jadugarReacts(true);
    });
    ev.on('gift-revealed', (g) => {
      this.stats.giftsRevealed++;
      this.stats.earned += lv.giftBonus;
      const p = this.toScreen(g.x, g.y - 40);
      this.hud('addCoins', lv.giftBonus, p.x, p.y);
      this.sayOnce('giftRevealed', 'mithu.giftRevealed');
      this.jadugarReacts(false);
    });
    ev.on('gift-ignored', () => this.stats.giftsIgnored++);
    ev.on('bug-bite', (bug) => this.hud('stealCoins', 1, () => this.toScreen(bug.x, bug.y - 10)));

    ev.on('wave-start', (wave) => {
      if (wave.n === 2) this.say('mithu.waveTwo');
    });
    ev.on('level-end', () => this.finishLevel());
  }

  // The Jadugar laughs when the player fails, and stamps his foot when the player wins.
  jadugarReacts(playerFailed) {
    if (this.jadugarCooldown > 0) return;
    this.jadugarCooldown = 4;
    this.hud('setJadugarMood', playerFailed ? 'laugh' : 'angry');
    if (playerFailed) this.jadugar.laugh();
    else this.jadugar.beaten();
  }

  // 1 to 3 stars: how many dangers were stopped compared with how many got through
  computeStars() {
    const s = this.stats;
    const bad = s.sneaked + s.giftsOpened;
    const good = s.caught + s.giftsRevealed + s.giftsIgnored;
    if (bad === 0) return 3;
    return good / (good + bad) >= 0.65 ? 2 : 1;
  }

  finishLevel() {
    const stars = this.computeStars();
    const tally = saveResult(this.levelData.id, stars);
    saveBrain(this.brain);
    saveSnapshot(this.game, this);
    this.hud('showResults', {
      stars,
      caught: this.stats.caught + this.stats.giftsRevealed,
      sneaked: this.stats.sneaked,
      giftsOpened: this.stats.giftsOpened,
      earned: this.stats.earned,
      weakness: this.brain.biggestWeakness(),
      tally: { ...tally },
      nextNameKey: this.levelData.nextNameKey,
      nextLocked: stars < 1, // Amri Gate opens with at least 1 star
      nextSceneKey: 'Level2',
    });
  }

  // call a method of the HUD scene (if it is ready)
  hud(method, ...args) {
    const ui = this.scene.get('UI');
    if (ui && ui.ready) ui[method](...args);
  }

  // Mithu says a line. Pass a text key from src/i18n (for example 'mithu.intro').
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

  // ---------- Effects used by the monsters ----------

  smoke(x, y) {
    this.fx.smoke(x, y);
  }

  // hit-stop (a very short freeze) and a small screen shake
  impact(ms, shake) {
    this.hitStopLeft = ms / 1000;
    if (!settings.low && !settings.reduced) this.cameras.main.shake(140, shake);
  }

  throwSpam(x, y, target) {
    this.spam.launch(x, y, target);
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
    if (this.sweepCooldown > 0) this.sweepCooldown -= dt;

    this.player.update(time, step);
    this.lantern.update(dt, this.spawner.all);
    this.spawner.update(dt);
    this.director.update(dt);
    this.spam.update(dt, this.player, this.fx);
    this.mithu.update(dt);
    this.jadugar.update(dt);
    this.fx.update(dt);
    this.atmosphere.update(dt);
    this.updateHints();

    // bubble follows Mithu's head
    const s = this.toScreen(this.mithu.x, this.mithu.y - 52);
    this.bubble.follow(s.x, s.y);

    const pr = this.director.progress();
    this.hud('setPhase', pr.labelKey, pr.vars);
    this.hud('setTime', pr.elapsed, pr.total);
  }

  // E: greet a real friend, or sweep the bugs with the Antivirus Jharoo.
  // The "E" sign shows above a friend who can be greeted, and (the first time) above Dodo when bugs come.
  updateHints() {
    const p = this.player;
    if (this.qHint.shown) this.qHint.place(p.x, p.y - 250);
    const pressed = Phaser.Input.Keyboard.JustDown(p.keys.use);
    const trojan = this.spawner.trojan;

    let near = null;
    let best = GREET_DISTANCE;
    for (const n of this.spawner.all) {
      if (!n.canGreet) continue;
      const d = Phaser.Math.Distance.Between(p.x, p.y, n.x, n.y);
      if (d < best) {
        best = d;
        near = n;
      }
    }

    if (near) {
      this.eHint.show();
      this.eHint.place(near.x, near.topPoint.y - 34);
      if (pressed) {
        near.greet();
        this.eHint.hide();
      }
    } else if (trojan.bugCount > 0) {
      if (!this.sweepLearned) {
        this.eHint.show();
        this.eHint.place(p.x, p.y - 250);
      }
      if (pressed && this.sweepCooldown <= 0) {
        this.stats.bugsZapped += trojan.sweep(p);
        this.sweepCooldown = 0.55;
        this.sweepLearned = true;
        this.eHint.hide();
      }
    } else {
      this.eHint.hide();
    }
  }

  showHint() {
    const hint = addText(this, 640, 676, 'hud.controls', {
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

    this.tweens.add({
      targets: hint,
      alpha: 0,
      delay: 9000,
      duration: 800,
      onComplete: () => hint.destroy(),
    });
  }

  // Developers only: C = walking limits and solid objects, I = what the AI knows (console table).
  setupDebug() {
    window.__level = this; // for tests and the browser console
    const g = this.add.graphics().setDepth(99500).setVisible(false);
    const b = this.art.bounds;
    g.lineStyle(2, 0x00ff88, 1);
    g.beginPath();
    for (let y = b.minY; y <= b.maxY; y += 20) g.lineTo(b.minXAt(y), y);
    for (let y = b.maxY; y >= b.minY; y -= 20) g.lineTo(b.maxXAt(y), y);
    g.closePath();
    g.strokePath();
    this.art.colliders.forEach((c) => {
      g.lineStyle(2, c.low ? 0xffcc00 : 0xff3366, 1);
      g.strokeEllipse(c.x, c.y, c.rx * 2, c.ry * 2);
    });
    this.input.keyboard.on('keydown-C', () => g.setVisible(!g.visible));
    this.input.keyboard.on('keydown-I', () => this.brain.printTable());
  }
}
