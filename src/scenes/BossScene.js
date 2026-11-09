import { ensureLateTextures } from '../objects/placeholderTextures.js';
import Phaser from 'phaser';
import Mithu from '../objects/Mithu.js';
import Jadugar from '../objects/Jadugar.js';
import GroundFx from '../fx/GroundFx.js';
import SpeechBubble from '../ui/SpeechBubble.js';
import HackerBrain from '../ai/HackerBrain.js';
import BossBrain, { BOSS_ATTACKS, ATTACK_IDS } from '../ai/BossBrain.js';
import { loadRun, saveBoss } from '../ai/runMemory.js';
import { saveSnapshot } from '../ai/chatContext.js';
import { buildBossArena } from '../level/bossArena.js';
import DodoFigure from '../boss/DodoFigure.js';
import { FlyingAttack } from '../boss/showdownParts.js';
import Celebration from '../boss/Celebration.js';
import { openCodeWordPicker } from '../boss/CodeWordPicker.js';
import { LEVELS } from '../data/levels.js';
import { saveResult } from '../data/progress.js';
import { settings } from '../data/settings.js';
import { addText, setSource } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';
import { CSS, FONT } from '../data/colors.js';
import { playSfx } from '../fx/sound.js';
import { audio } from '../audio/AudioManager.js';

// ---- the numbers of the showdown (all in one place) ----
const HEARTS = 5; // Dodo's hearts
const TOTAL_HITS = 15; // the Jadugar's health: 15 attacks that Dodo sends back
const ROUND_END_HITS = { 1: 5, 2: 10 }; // round 1 ends after 5 hits, round 2 after 10 hits
const FINALE_HITS = 14; // after 14 hits the Jadugar changes into a fake Mithu: the last question
const SECONDS = { 1: 5, 2: 3.5, 3: 2.5 }; // time to answer one attack
const GAP = { 1: 1.5, 2: 1.2, 3: 1.0 }; // pause before the next attack
const MAX_AIR = { 1: 1, 2: 1, 3: 2 }; // attacks in the air at the same time
const FINALE_SECONDS = 8;

const FEET_Y = 565;
const DODO_X = 290;
const JAD_X = 1000;

// Level 3: Miri Fort, the Face-to-Face Showdown. Side view, like a fighting game.
// Dodo (left) and the Jadugar (right) stand face to face. The Jadugar throws ONE attack at a time:
// a big picture that flies towards Dodo with a timer ring. Dodo answers with the right defence button
// (keys 1-4): 1 Lantern, 2 Password Shield, 3 Backup Scroll, 4 Code Word. A right answer sends the attack
// back and hurts the Jadugar. A wrong or late answer costs Dodo a heart and Mithu says the right defence.
//   states: pick -> intro -> fight -> roundEnd -> ... -> finale -> ko -> won      (or lose)
export default class BossScene extends Phaser.Scene {
  constructor() {
    super('Boss');
  }

  // data = { startRound, codeWord } (a retry starts at the round where Dodo lost)
  init(data) {
    this.firstRound = (data && data.startRound) || 1;
    this.codeWord = (data && data.codeWord) || null;
  }

  create() {
    ensureLateTextures(this);
    this.cameras.main.fadeIn(500, 11, 13, 26);
    this.cameras.main.setZoom(1);
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.levelData = LEVELS.miri;
    this.state = 'pick';
    this.round = this.firstRound;
    this.slow = 1;
    this.slowTimer = 0;
    this.hitStopLeft = 0;
    this.cutscene = true; // Esc is off while the code word is chosen
    this.said = {};
    this.hints = {};
    this.hearts = HEARTS;
    this.hits = ROUND_END_HITS[this.firstRound - 1] || 0; // a retry starts where the round began
    this.combo = 0;
    this.comboTimer = 0;
    this.spawnIn = 1;
    this.tauntCd = 0;
    this.wrongLog = {}; // attack id -> how many times Dodo missed it in THIS fight
    this.stats = { caught: 0, sneaked: 0, giftsOpened: 0, giftsRevealed: 0, earned: 0 }; // for the chat

    // what the AI learned in the earlier levels
    const run = loadRun();
    this.brain = new HackerBrain(); // only for the chat (live game data)
    this.brain.loadStats(run.stats);
    this.bossBrain = new BossBrain();
    this.bossBrain.seedFrom(run.stats);

    this.arena = buildBossArena(this);
    this.fx = new GroundFx(this);
    audio.playMusic('music-boss');

    this.dodo = new DodoFigure(this, DODO_X, FEET_Y, 400);
    this.buildJadugar();
    this.buildMithu();
    this.buildEffects();
    this.keys = this.input.keyboard.addKeys({ one: 'ONE', two: 'TWO', three: 'THREE', four: 'FOUR', n1: 'NUMPAD_ONE', n2: 'NUMPAD_TWO', n3: 'NUMPAD_THREE', n4: 'NUMPAD_FOUR' });

    this.air = [0, 1, 2].map(() => new FlyingAttack(this));
    this.party = new Celebration(this);

    this.scene.stop('BossUI');
    this.scene.launch('BossUI', { level: this });

    if (import.meta.env.DEV) this.setupDebug();
    this.events.once('shutdown', () => {
      this.time.timeScale = 1;
      this.tweens.timeScale = 1;
      saveSnapshot(this.game, this);
    });

    if (this.codeWord) {
      // a retry: the secret code word is already chosen
      this.time.delayedCall(600, () => this.startRound(this.round));
    } else {
      this.time.delayedCall(900, () => this.say('mithu.boss.whisper'));
      this.time.delayedCall(1500, () =>
        openCodeWordPicker(this, (name) => {
          this.codeWord = name;
          this.startRound(1);
        }),
      );
    }
  }

  // ---------- Building ----------

  buildJadugar() {
    this.jad = new Jadugar(this, JAD_X, FEET_Y);
    this.jad.setScale(2.2);
    this.jadHome = { x: JAD_X, y: FEET_Y };
    this.jadFloat = 0;
    // the Jadugar's speech bubble (taunts)
    const box = this.add.container(JAD_X - 120, 215).setDepth(900).setVisible(false);
    const bg = this.add.graphics();
    bg.fillStyle(0xfff6dc, 1);
    bg.fillRoundedRect(-200, -40, 400, 80, 22);
    bg.lineStyle(5, 0x3a1c16, 1);
    bg.strokeRoundedRect(-200, -40, 400, 80, 22);
    bg.fillStyle(0xfff6dc, 1);
    bg.fillTriangle(60, 38, 110, 38, 120, 76);
    this.tauntText = addText(this, 0, 0, 'boss.taunt.phishing', { fontFamily: FONT, fontSize: '26px', fontStyle: '700', color: CSS.ink, align: 'center', wordWrap: { width: 370 } }).setOrigin(0.5);
    box.add([bg, this.tauntText]);
    this.tauntBox = box;
  }

  // Mithu flies near Dodo (he follows a small invisible anchor, so the Mithu class can be reused)
  buildMithu() {
    this.anchor = new Phaser.Events.EventEmitter();
    Object.assign(this.anchor, { x: DODO_X - 60, y: FEET_Y - 250, z: 0, facingDir: 1, vx: 0, vy: 0 });
    this.mithu = new Mithu(this, this.anchor);
    this.mithu.setScale(1.7);
    this.bubble = new SpeechBubble(this);
  }

  // the pictures of the defences (made once, shown when needed)
  buildEffects() {
    this.beam = this.add.image(0, 0, 'fx-cone').setOrigin(0, 0.5).setBlendMode(Phaser.BlendModes.ADD).setVisible(false).setDepth(850);
    this.wall = this.add.image(0, 0, 'boss-shield').setOrigin(0.5, 1).setVisible(false).setDepth(840);
    this.wallGlow = this.add.image(0, 0, 'fx-glow').setTint(0xffd27a).setBlendMode(Phaser.BlendModes.ADD).setScale(4, 5).setVisible(false).setDepth(839);
    this.scrollFx = this.add.image(0, 0, 'backup-scroll').setVisible(false).setDepth(850);
    this.lockFx = this.add.image(0, 0, 'icon-lock').setVisible(false).setDepth(860);
    this.stamp = addText(this, 0, 0, 'boss.fake', { fontFamily: FONT, fontSize: '54px', fontStyle: '700', color: '#FF4A3A', stroke: '#2a0e14', strokeThickness: 9 }).setOrigin(0.5).setVisible(false).setDepth(870);
    this.swirls = [0, 1].map(() => this.add.image(0, 0, 'fx-swirl').setBlendMode(Phaser.BlendModes.ADD).setTint(0xb48cff).setVisible(false).setDepth(870));
  }

  swirl(x, y) {
    const s = this.swirls.find((sw) => !sw.visible);
    if (!s) return;
    s.setPosition(x, y).setVisible(true).setScale(0.3).setAlpha(1).setAngle(0);
    this.tweens.add({ targets: s, scale: 1.8, angle: 280, duration: 520, ease: 'Sine.Out' });
    this.tweens.add({ targets: s, alpha: 0, delay: 300, duration: 330, onComplete: () => s.setVisible(false) });
    playSfx(this, 'sfx-teleport');
  }

  // ---------- Small helpers ----------

  say(key) {
    this.bubble.say(t(key));
  }

  sayOnce(id, key) {
    if (this.said[id]) return;
    this.said[id] = true;
    this.say(key);
  }

  hud(method, ...args) {
    if (!this.scene.isActive('BossUI')) return;
    const ui = this.scene.get('BossUI');
    if (ui && ui.ready) ui[method](...args);
  }

  impact(ms, shake) {
    this.hitStopLeft = Math.max(this.hitStopLeft, ms / 1000);
    if (!settings.low && !settings.reduced) this.cameras.main.shake(130, shake);
  }

  get jadBody() {
    return { x: this.jad.x - 10, y: this.jad.y - 230 };
  }

  get dodoChest() {
    return { x: DODO_X + 90, y: FEET_Y - 220 };
  }

  // ---------- Rounds ----------

  startRound(n) {
    this.round = n;
    this.state = 'intro';
    this.cutscene = true;
    this.hud('setRound', n);
    this.hud('setBossHp', (TOTAL_HITS - this.hits) / TOTAL_HITS);
    this.hud('setHearts', this.hearts);
    this.hud('showBanner', ['boss.round', { n }], ['boss.fight'], 900);
    playSfx(this, 'sfx-round');
    if (!settings.reduced) {
      this.cameras.main.zoomTo(1.07, 300, 'Sine.easeOut');
      this.time.delayedCall(900, () => this.cameras.main.zoomTo(1, 500, 'Sine.easeInOut'));
    }
    this.time.delayedCall(1700, () => {
      playSfx(this, 'sfx-fight');
      this.state = 'fight';
      this.cutscene = false;
      this.spawnIn = 1.2;
      this.say(`mithu.boss.round${n}`);
      if (n === 1 && this.firstRound === 1) this.time.delayedCall(4500, () => this.seedLine());
    });
  }

  // Mithu tells what the Jadugar remembers from the earlier levels
  seedLine() {
    const b = this.bossBrain;
    const best = b.seeded.slice().sort((x, y) => b.score(y) - b.score(x))[0];
    if (best) this.say(`mithu.boss.seed.${best}`);
  }

  endRound() {
    this.state = 'roundEnd';
    this.cutscene = true;
    this.clearAir();
    this.hud('showBanner', ['boss.roundClear', { n: this.round }], null, 1100, '#FFD24A');
    this.jad.beaten();
    this.hud('setJadugarMood', 'angry');
    if (this.hearts < HEARTS) {
      this.hearts++; // one heart back between the rounds
      this.hud('setHearts', this.hearts);
    }
    this.combo = 0;
    this.hud('setCombo', 0);
    this.time.delayedCall(2600, () => this.startRound(this.round + 1));
  }

  clearAir() {
    this.air.forEach((a) => {
      this.tweens.killTweensOf(a);
      a.free();
    });
    this.beam.setVisible(false);
    this.wall.setVisible(false);
    this.wallGlow.setVisible(false);
    this.scrollFx.setVisible(false);
    this.lockFx.setVisible(false);
    this.stamp.setVisible(false);
    this.hud('setGlow', 0);
  }

  // ---------- Attacks ----------

  airborne() {
    return this.air.filter((a) => a.state === 'flying');
  }

  busy() {
    return this.air.filter((a) => a.state !== 'idle').length;
  }

  // the Jadugar chooses and throws the next attack (BossBrain: 85% exploit, 15% explore)
  throwAttack() {
    const free = this.air.find((a) => a.state === 'idle');
    if (!free) return;
    const b = this.bossBrain;
    const inAir = this.air.filter((a) => a.state !== 'idle').map((a) => a.id);
    const id = b.choose(this.round, inAir);
    b.recordThrown(id);
    // when he uses a weak spot of the player he says so
    if (b.isExploiting(id) && this.tauntCd <= 0) this.taunt(id);
    const hand = { x: this.jad.x - 120, y: this.jad.y - 270 };
    free.launch(id, hand, this.dodoChest, SECONDS[this.round]);
    this.jad.point(this.dodo.x, this.dodo.feetY - 200);
    playSfx(this, 'sfx-attack-fly');
    // round 1 teaches: the first time an attack comes, Mithu says the button and it glows
    if (this.round === 1 && !this.hints[id]) {
      this.hints[id] = true;
      this.say(`mithu.boss.hint.${id}`);
    }
    if (this.round === 1) this.hud('setGlow', BOSS_ATTACKS[id]);
  }

  taunt(id) {
    this.tauntCd = 9;
    setSource(this.tauntText, `boss.taunt.${id}`);
    this.tauntBox.setVisible(true).setScale(0).setAlpha(1);
    this.tweens.add({ targets: this.tauntBox, scale: 1, duration: 260, ease: 'Back.Out' });
    this.tweens.add({ targets: this.tauntBox, alpha: 0, delay: 2400, duration: 300, onComplete: () => this.tauntBox.setVisible(false) });
    this.jad.laugh();
    this.hud('setJadugarMood', 'laugh');
  }

  // ---------- Dodo's answer (keys 1-4 or the buttons) ----------

  defend(n) {
    if (this.state !== 'fight' && this.state !== 'finale') return;
    this.hud('pressFlash', n);
    playSfx(this, 'sfx-defence-press');
    if (this.state === 'finale') {
      this.finaleAnswer(n);
      return;
    }
    // the attack that lands first is answered first
    const air = this.airborne().sort((a, b) => a.remaining - b.remaining);
    if (!air.length) return; // nothing to answer: no penalty
    const match = air.find((a) => a.def === n);
    if (match) this.defended(match, n);
    else this.hurtDodo(air[0], 'wrong', n);
  }

  // the right defence: a flashy animation, then the attack flies back and hurts the Jadugar
  defended(a, n) {
    a.state = 'defending';
    a.hideRing();
    this.dodo.defend();
    this.hud('setGlow', 0);
    playSfx(this, n === 1 ? 'sfx-defend-lantern' : n === 2 ? 'sfx-defend-shield' : n === 3 ? 'sfx-defend-scroll' : 'sfx-defend-code');
    const done = () => this.bounceBack(a);
    if (n === 1) this.fxLantern(a, done);
    else if (n === 2) this.fxPassword(a, done);
    else if (n === 3) this.fxBackup(a, done);
    else this.fxCode(a, done);
  }

  // 1: the lantern beam reveals the attack and burns it
  fxLantern(a, done) {
    const from = this.dodo.hand;
    const dx = a.x - from.x;
    const dy = a.y - from.y;
    this.beam.setPosition(from.x, from.y).setRotation(Math.atan2(dy, dx)).setScale(Math.hypot(dx, dy) / 420, 1.5).setAlpha(0).setVisible(true);
    this.tweens.add({ targets: this.beam, alpha: 0.95, duration: 120, yoyo: true, hold: 260, onComplete: () => this.beam.setVisible(false) });
    const pic = a.pictures[a.id];
    if (pic.setTint) {
      pic.setTint(0xfff0a0);
      this.time.delayedCall(220, () => pic.setTint(0xff8a3a));
    }
    if (a.id === 'trojan') this.time.delayedCall(200, () => pic.setTexture('gift-ghost'));
    for (let i = 0; i < 4; i++) this.time.delayedCall(i * 90, () => this.fx.sparkle(a.x + Phaser.Math.Between(-50, 50), a.y + Phaser.Math.Between(-40, 40)));
    this.time.delayedCall(620, done);
  }

  // 2: a glowing Ajrak password wall stops the hammer
  fxPassword(a, done) {
    const x = this.dodo.x + 220;
    this.wall.setPosition(x, FEET_Y + 14).setScale(0.3, 2.6).setAlpha(1).setVisible(true);
    this.wallGlow.setPosition(x, FEET_Y - 190).setAlpha(0.8).setVisible(true);
    this.tweens.add({ targets: this.wall, scaleX: 2.4, duration: 220, ease: 'Back.Out' });
    this.tweens.add({ targets: a, x: x + 36, y: FEET_Y - 200, duration: 230, ease: 'Cubic.In' });
    this.time.delayedCall(240, () => {
      this.impact(60, 0.004);
      for (let i = 0; i < 5; i++) this.fx.sparkle(x + Phaser.Math.Between(-30, 50), FEET_Y - 200 + Phaser.Math.Between(-70, 70));
      this.tweens.add({ targets: this.wallGlow, alpha: 1.2, scale: 1.4, duration: 120, yoyo: true });
    });
    this.time.delayedCall(560, () => {
      this.tweens.add({ targets: [this.wall, this.wallGlow], alpha: 0, duration: 200, onComplete: () => {
        this.wall.setVisible(false);
        this.wallGlow.setVisible(false);
      } });
      done();
    });
  }

  // 3: the Backup Scroll flies to the chain, the chain shatters
  fxBackup(a, done) {
    const from = this.dodo.hand;
    this.scrollFx.setPosition(from.x, from.y).setScale(3).setAlpha(1).setVisible(true).setAngle(0);
    this.tweens.add({ targets: this.scrollFx, x: a.x, y: a.y, angle: 360, duration: 320, ease: 'Sine.InOut', onComplete: () => {
      this.scrollFx.setVisible(false);
      for (let i = 0; i < 7; i++) this.fx.sparkle(a.x + Phaser.Math.Between(-60, 60), a.y + Phaser.Math.Between(-60, 60));
      this.tweens.add({ targets: a, scaleX: a.scaleX * 1.25, scaleY: a.scaleY * 1.25, duration: 120, yoyo: true });
      playSfx(this, 'sfx-chain-lock');
    } });
    this.time.delayedCall(700, done);
  }

  // 4: the code word lock opens and shows that the Mithu is FAKE
  fxCode(a, done) {
    this.lockFx.setPosition(a.x, a.y - 10).setScale(0.5).setAlpha(1).setVisible(true);
    this.tweens.add({ targets: this.lockFx, scale: 4, duration: 260, ease: 'Back.Out' });
    this.time.delayedCall(300, () => {
      this.stamp.setPosition(a.x, a.y + 10).setAngle(-12).setScale(2).setAlpha(1).setVisible(true);
      this.tweens.add({ targets: this.stamp, scale: 1, duration: 220, ease: 'Back.Out' });
      a.pictures.deepfake.fakeBird.setScale(1.2 * 0.7);
      this.impact(60, 0.004);
    });
    this.time.delayedCall(850, () => {
      this.lockFx.setVisible(false);
      this.stamp.setVisible(false);
      done();
    });
  }

  // the attack flies back to the Jadugar (a bounce)
  bounceBack(a) {
    a.state = 'returning';
    playSfx(this, 'sfx-bounce');
    const target = this.jadBody;
    this.tweens.add({
      targets: a,
      x: target.x,
      y: target.y,
      scaleX: 0.6,
      scaleY: 0.6,
      angle: a.angle + 360,
      duration: 460,
      ease: 'Cubic.In',
      onComplete: () => {
        a.free();
        this.hitJadugar();
      },
    });
  }

  hitJadugar() {
    if (this.state !== 'fight') return;
    this.hits++;
    this.hud('setBossHp', (TOTAL_HITS - this.hits) / TOTAL_HITS);
    this.jad.beaten();
    this.hud('setJadugarMood', 'angry');
    this.impact(90, 0.007);
    playSfx(this, 'sfx-hit');
    const body = this.jadBody;
    for (let i = 0; i < 6; i++) this.fx.sparkle(body.x + Phaser.Math.Between(-80, 80), body.y + Phaser.Math.Between(-90, 70));
    this.tweens.add({ targets: this.jad, x: JAD_X + 24, duration: 90, yoyo: true, ease: 'Sine.Out' });
    this.combo++;
    this.comboTimer = 6;
    this.hud('setCombo', this.combo);
    if (this.combo % 3 === 0) playSfx(this, 'sfx-combo');
    this.spawnIn = GAP[this.round];
    if (this.round < 3 && this.hits >= ROUND_END_HITS[this.round]) this.endRound();
    else if (this.round === 3 && this.hits >= FINALE_HITS) this.startFinale();
  }

  // a wrong answer (reason 'wrong') or no answer in time (reason 'late'): the attack hits Dodo
  hurtDodo(a, reason, pressed = 0) {
    if (a.state !== 'flying') return;
    a.state = 'returning';
    a.hideRing();
    this.hud('setGlow', 0);
    if (pressed) this.hud('markWrong', pressed);
    this.bossBrain.recordWrong(a.id);
    this.wrongLog[a.id] = (this.wrongLog[a.id] || 0) + 1;
    const hit = this.dodoChest;
    this.tweens.add({
      targets: a,
      x: hit.x,
      y: hit.y,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 160,
      ease: 'Quad.In',
      onComplete: () => {
        a.free();
        this.dodoHit(a.id);
      },
    });
  }

  dodoHit(id) {
    if (this.state !== 'fight' && this.state !== 'finale') return;
    this.hearts--;
    this.hud('setHearts', this.hearts);
    this.dodo.hit();
    this.impact(80, 0.007);
    if (!settings.low && !settings.reduced) this.cameras.main.flash(90, 255, 70, 70);
    playSfx(this, 'sfx-heart-lost');
    this.fx.puff(this.dodo.x + 80, FEET_Y - 180, 1);
    this.hud('setJadugarMood', 'laugh');
    this.jad.laugh();
    this.combo = 0;
    this.hud('setCombo', 0);
    this.spawnIn = GAP[this.round] + 0.8;
    // Mithu says, in one short line, what the right defence was and why
    this.say(`mithu.boss.fix.${id}`);
    if (this.hearts <= 0) this.lose();
  }

  // ---------- The finale: the Jadugar becomes a fake Mithu and asks for the key ----------

  startFinale() {
    this.state = 'finale';
    this.cutscene = true;
    this.clearAir();
    this.hud('showBanner', ['boss.finale'], null, 1100, '#B48CFF');
    const body = this.jadBody;
    this.swirl(body.x, body.y);
    this.tweens.add({ targets: this.jad, alpha: 0, duration: 260 });
    this.time.delayedCall(420, () => {
      this.face = this.air[0];
      this.face.launch('deepfake', { x: JAD_X - 60, y: 330 }, { x: JAD_X - 60, y: 330 }, FINALE_SECONDS);
      this.face.setPosition(JAD_X - 60, 330).setScale(1.5);
      this.face.state = 'finale';
      this.faceTime = 0;
      this.cutscene = false;
      this.say('mithu.boss.finale');
      this.hud('setGlow', 4);
      playSfx(this, 'sfx-deepfake');
    });
  }

  finaleAnswer(n) {
    const face = this.face;
    if (!face || face.state !== 'finale') return;
    if (n === 4) {
      face.state = 'defending';
      face.hideRing();
      this.hud('setGlow', 0);
      this.dodo.defend();
      playSfx(this, 'sfx-defend-code');
      this.fxCode(face, () => {
        // the fake melts, the real Jadugar is there again: the last hit
        this.tweens.add({ targets: face, scaleY: 0, alpha: 0, duration: 400, onComplete: () => face.free() });
        this.fx.smoke(face.x, face.y);
        this.jad.setAlpha(1);
        this.swirl(this.jadBody.x, this.jadBody.y);
        this.time.delayedCall(500, () => {
          this.hits = TOTAL_HITS;
          this.hud('setBossHp', 0);
          this.ko();
        });
      });
    } else {
      this.bossBrain.recordWrong('deepfake');
      this.wrongLog.deepfake = (this.wrongLog.deepfake || 0) + 1;
      this.hud('markWrong', n);
      this.faceTime = 0;
      this.dodoHit('deepfake');
    }
  }

  // ---------- Finish ----------

  lose() {
    if (this.state === 'lose') return;
    this.state = 'lose';
    this.cutscene = true;
    this.clearAir();
    if (this.face) this.face.free();
    this.dodo.slump();
    this.hud('setGlow', 0);
    const worst = this.bossBrain.worst(this.wrongLog);
    this.hud('showLose', worst ? `boss.tip.${worst}` : 'boss.tip.none');
    saveResult('miri', 0); // one point for the AI Hacker in "Humans vs AI"
    this.saveFightMemory();
  }

  // what the boss learned: kept for the certificate
  saveFightMemory() {
    const worst = this.bossBrain.worst(this.wrongLog);
    const total = ATTACK_IDS.reduce((sum, id) => sum + (this.wrongLog[id] || 0), 0);
    saveBoss({ attacks: JSON.parse(JSON.stringify(this.bossBrain.stats)), top: worst, hits: worst ? this.wrongLog[worst] : 0, total });
  }

  // K.O.: slow motion, then the win party
  ko() {
    this.state = 'ko';
    this.cutscene = true;
    this.clearAir();
    this.hud('showBanner', ['boss.ko'], null, 1500, '#FF5A4A');
    playSfx(this, 'sfx-ko');
    this.impact(260, 0.012);
    this.slow = 0.25;
    this.slowTimer = 1.4; // real seconds
    this.time.timeScale = 0.25;
    this.tweens.timeScale = 0.25;
    this.jad.beaten();
    this.crackBall();
    this.hud('setJadugarMood', 'angry');
  }

  crackBall() {
    const g = this.add.graphics();
    g.lineStyle(3, 0x2a0e14, 1);
    g.beginPath();
    g.moveTo(-6, -26);
    g.lineTo(2, -8);
    g.lineTo(-8, 2);
    g.lineTo(4, 14);
    g.lineTo(-2, 28);
    g.moveTo(2, -8);
    g.lineTo(16, -2);
    g.strokePath();
    this.jad.ballHolder.add(g);
    this.jad.ball.setTint(0xff7a6a);
    this.jad.ballGlow.setTint(0xff5a4a);
  }

  endSlowMotion() {
    this.slow = 1;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.winSequence();
  }

  // the ball is cracked: the Jadugar shrinks into a tiny harmless puff, the fort lights up
  winSequence() {
    this.state = 'won';
    const jad = this.jad;
    this.say('mithu.boss.ko');
    this.dodo.celebrate();
    this.tweens.add({ targets: jad, scale: 0.4, duration: 1100, ease: 'Back.In' });
    for (let i = 0; i < 6; i++) this.time.delayedCall(i * 160, () => this.fx.smoke(jad.x + Phaser.Math.Between(-90, 90), jad.y - 140));
    this.time.delayedCall(1100, () => {
      this.fx.smoke(jad.x, jad.y - 20);
      jad.setAlpha(0.9);
    });
    this.tweens.add({ targets: this.arenaShade, alpha: 0, duration: 1200 });
    this.arenaGlow.setVisible(true);
    this.tweens.add({ targets: this.arenaGlow, alpha: 0.55, duration: 1400 });
    this.arena.torches.forEach((g) => g.setScale(2.6));
    if (!settings.low) this.cameras.main.flash(500, 255, 235, 170);
    this.time.delayedCall(700, () => this.party.start());
    this.time.delayedCall(5600, () => this.finishWin());
  }

  // 3 stars: four or five hearts left. 2 stars: two or three. 1 star: he barely won.
  computeStars() {
    return this.hearts >= 4 ? 3 : this.hearts >= 2 ? 2 : 1;
  }

  finishWin() {
    const stars = this.computeStars();
    saveResult('miri', stars);
    this.saveFightMemory();
    saveSnapshot(this.game, this);
    this.scene.stop('BossUI');
    this.cameras.main.fadeOut(600, 11, 13, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Report', { stars }));
  }

  // ---------- Update ----------

  update(time, delta) {
    const raw = Math.min(delta, 50) / 1000;
    if (this.slowTimer > 0) {
      this.slowTimer -= raw;
      if (this.slowTimer <= 0) this.endSlowMotion();
    }
    let dt = raw * this.slow;
    if (this.hitStopLeft > 0) {
      this.hitStopLeft -= raw;
      dt = 0;
    }

    this.dodo.update(dt);
    this.jad.update(dt);
    this.jad.setDepth(FEET_Y);
    this.updateMithu(dt);
    this.fx.update(dt);
    this.arena.update(time);
    this.party.update(dt);

    if (this.state === 'fight') this.updateFight(dt);
    else if (this.state === 'finale') this.updateFinale(dt);
    this.updateKeys();
    if (this.tauntCd > 0) this.tauntCd -= dt;
  }

  updateMithu(dt) {
    this.anchor.y = FEET_Y - 250 + Math.sin(this.time.now / 700) * 6;
    this.mithu.update(dt);
    this.bubble.follow(this.mithu.x, this.mithu.y - 56);
  }

  updateFight(dt) {
    // the attacks in the air: they fly, and when the ring is empty they hit Dodo
    for (const a of this.air) {
      if (a.state === 'flying' && a.step(dt)) this.hurtDodo(a, 'late');
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.hud('setCombo', 0);
      }
    }
    // the next attack
    this.spawnIn -= dt;
    if (this.spawnIn > 0 || this.busy() >= MAX_AIR[this.round]) return;
    const air = this.airborne();
    // in round 3 a second attack waits until the first one has been in the air for a moment
    if (air.length && air[0].t < 1.2) return;
    this.throwAttack();
    this.spawnIn = GAP[this.round];
  }

  // the fake Mithu waits for the code word. Too late = a heart, and he asks again.
  updateFinale(dt) {
    const face = this.face;
    if (!face || face.state !== 'finale') return;
    this.faceTime += dt;
    face.t = this.faceTime;
    face.setY(330 + Math.sin(this.faceTime * 3) * 8);
    face.drawRing(Math.max(0, 1 - this.faceTime / FINALE_SECONDS));
    if (this.faceTime >= FINALE_SECONDS) {
      this.faceTime = 0;
      this.bossBrain.recordWrong('deepfake');
      this.wrongLog.deepfake = (this.wrongLog.deepfake || 0) + 1;
      this.dodoHit('deepfake');
    }
  }

  updateKeys() {
    const J = Phaser.Input.Keyboard.JustDown;
    const k = this.keys;
    if (J(k.one) || J(k.n1)) this.defend(1);
    if (J(k.two) || J(k.n2)) this.defend(2);
    if (J(k.three) || J(k.n3)) this.defend(3);
    if (J(k.four) || J(k.n4)) this.defend(4);
  }

  // ---------- Developers only ----------
  // K = hit the boss   J = hurt Dodo   (console: window.__boss)
  setupDebug() {
    window.__boss = this;
    this.input.keyboard.on('keydown-K', () => this.state === 'fight' && this.hitJadugar());
    this.input.keyboard.on('keydown-J', () => {
      const a = this.airborne()[0];
      if (a) this.hurtDodo(a, 'late');
    });
  }
}
