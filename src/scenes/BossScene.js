import Phaser from 'phaser';
import Player from '../objects/Player.js';
import Mithu from '../objects/Mithu.js';
import Jadugar from '../objects/Jadugar.js';
import Lantern from '../objects/Lantern.js';
import GroundFx from '../fx/GroundFx.js';
import SpeechBubble from '../ui/SpeechBubble.js';
import KeyHint from '../ui/KeyHint.js';
import HackerBrain from '../ai/HackerBrain.js';
import BossBrain, { ROUND_ATTACKS } from '../ai/BossBrain.js';
import { loadRun, saveBoss } from '../ai/runMemory.js';
import { saveSnapshot } from '../ai/chatContext.js';
import { buildBossArena, ARENA } from '../level/bossArena.js';
import { LetterRain, SlamWave, GiftThrow } from '../boss/BossAttacks.js';
import Deepfake from '../boss/Deepfake.js';
import Celebration from '../boss/Celebration.js';
import { openCodeWordPicker } from '../boss/CodeWordPicker.js';
import { LEVELS } from '../data/levels.js';
import { saveResult, getStars } from '../data/progress.js';
import { settings } from '../data/settings.js';
import { t } from '../i18n/index.js';
import { playSfx } from '../fx/sound.js';

// ---- the numbers of the fight (all in one place) ----
const DODO_MAX = 100; // Dodo's health
const BOSS_MAX = 360; // the Jadugar's health: three rounds of 120
const HEAL = 30; // health Dodo gets back between rounds
const BEAM_DPS = 20; // lantern beam damage per second
const SHIELD_TIME = 1.5;
const SHIELD_COOLDOWN = 4;
const HURT_PROTECTION = 1.0; // seconds without damage after a hit
const DEEPFAKE_COOLDOWN = 16;
const HOVER = 70; // how high the Jadugar floats
const BEAM_RANGE = 410;
const BEAM_HALF = 0.65;
const BUG_SECONDS = 3; // the bugs of a Trojan gift bite for this long (4 damage each second)

// Boss: Miri Fort. A fighting-game style battle in a top-down arena (Tekken feel, cyber moves).
//   pick  -> choose the secret code word (4 picture cards)
//   intro -> "ROUND n - FIGHT!"
//   fight -> Dodo: lantern beam (hold Q), Firewall Shield (E), jump (Space). The Jadugar attacks.
//   roundEnd -> short break, Dodo gets some health back
//   ko / won / lose
// The Jadugar chooses his attacks with BossBrain (the same learning idea as HackerBrain).
export default class BossScene extends Phaser.Scene {
  constructor() {
    super('Boss');
  }

  create() {
    this.cameras.main.fadeIn(500, 11, 13, 26);
    this.cameras.main.setZoom(1);
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.levelData = LEVELS.miri;
    this.state = 'pick';
    this.round = 1;
    this.slow = 1;
    this.slowTimer = 0;
    this.hitStopLeft = 0;
    this.cutscene = true; // Esc is off while the code word is chosen
    this.said = {};
    this.codeWord = null;
    this.dodoHp = DODO_MAX;
    this.bossHp = BOSS_MAX;
    this.combo = 0;
    this.comboTimer = 0;
    this.beamTick = 0;
    this.nextAttackIn = 1.5;
    this.teleportIn = 6;
    this.deepfakeCd = 6;
    this.tauntCd = 0;
    this.bugsLeft = 0;
    this.bugTick = 0;
    this.stunLeft = 0;
    this.jadBusy = false;
    this.hitLog = { phishing: 0, hathoda: 0, trojan: 0, deepfake: 0 }; // what really hit Dodo in THIS fight
    this.stats = { caught: 0, sneaked: 0, giftsOpened: 0, giftsRevealed: 0, earned: 0 };

    // what the AI learned in the earlier levels
    const run = loadRun();
    this.brain = new HackerBrain(); // only for the chat (live game data)
    this.brain.loadStats(run.stats);
    this.bossBrain = new BossBrain();
    this.bossBrain.seedFrom(run.stats);

    this.arena = buildBossArena(this);
    this.fx = new GroundFx(this);

    const bounds = { minY: ARENA.minY, maxY: ARENA.maxY, minXAt: () => ARENA.minX, maxXAt: () => ARENA.maxX };
    this.player = new Player(this, 640, 620, bounds, { colliders: [] }, this.fx);
    this.player.inputLocked = true;
    this.lantern = new Lantern(this, this.player);
    this.mithu = new Mithu(this, this.player);
    this.bubble = new SpeechBubble(this);
    this.eHint = new KeyHint(this, 'E');
    this.buildJadugar();
    this.buildShield();
    this.buildBugs();
    this.buildSwirls();

    this.letters = new LetterRain(this);
    this.slam = new SlamWave(this);
    this.gifts = new GiftThrow(this);
    this.attacks = { phishing: this.letters, hathoda: this.slam, trojan: this.gifts };
    this.deepfake = new Deepfake(this);
    this.party = new Celebration(this);

    this.scene.stop('BossUI');
    this.scene.launch('BossUI', { level: this });

    this.useKey = this.player.keys.use;
    if (import.meta.env.DEV) this.setupDebug();
    this.events.once('shutdown', () => {
      this.time.timeScale = 1;
      this.tweens.timeScale = 1;
      saveSnapshot(this.game, this);
    });

    // Mithu whispers, then the cards come
    this.time.delayedCall(900, () => this.say('mithu.boss.whisper'));
    this.time.delayedCall(1500, () =>
      openCodeWordPicker(this, (name) => {
        this.codeWord = name;
        this.cutscene = false;
        this.startRound(1);
      }),
    );
  }

  // ---------- Building ----------

  buildJadugar() {
    this.jadGround = { x: 640, y: 470 };
    this.jadHover = HOVER;
    this.jadHoverTarget = HOVER;
    this.jadMove = { x: 640, y: 470, wait: 1.5 };
    this.jad = new Jadugar(this, 640, 470 - HOVER);
    this.jad.setScale(1.5);
    this.jad.shadow.setVisible(false);
    this.jadShadow = this.add.image(640, 470, 'shadow').setScale(3.2, 1.5).setAlpha(0.5);
    // his purple shield: the lantern must shine on it for a moment to break it
    this.jadShield = { on: false, hp: 1 };
    this.shieldGlow = this.add.image(0, 0, 'fx-glow').setTint(0xb48cff).setBlendMode(Phaser.BlendModes.ADD).setScale(5, 5.5).setAlpha(0).setVisible(false);
    this.shieldRing = this.add.image(0, 0, 'fx-ring').setTint(0xd8b8ff).setBlendMode(Phaser.BlendModes.ADD).setScale(5.5, 6).setAlpha(0).setVisible(false);
  }

  // Dodo's Firewall Shield (E)
  buildShield() {
    this.shield = { on: false, t: 0, cd: 0 };
    this.shieldImage = this.add.image(0, 0, 'boss-shield').setOrigin(0.5, 1).setVisible(false);
    this.shieldFlash = this.add.image(0, 0, 'fx-glow').setTint(0xffd27a).setBlendMode(Phaser.BlendModes.ADD).setScale(2.4, 3).setAlpha(0).setVisible(false);
  }

  // the bugs that bite Dodo after a Trojan gift
  buildBugs() {
    this.bugs = [0, 1, 2].map(() => this.add.image(0, 0, 'bug').setVisible(false));
  }

  buildSwirls() {
    this.swirls = [];
    for (let i = 0; i < 4; i++) this.swirls.push(this.add.image(0, 0, 'fx-swirl').setBlendMode(Phaser.BlendModes.ADD).setTint(0xb48cff).setVisible(false));
  }

  swirl(x, y) {
    const s = this.swirls.find((sw) => !sw.visible);
    if (!s) return;
    s.setPosition(x, y).setVisible(true).setScale(0.2).setAlpha(1).setAngle(0).setDepth(900);
    this.tweens.add({ targets: s, scale: 1, angle: 280, duration: 520, ease: 'Sine.Out' });
    this.tweens.add({ targets: s, alpha: 0, delay: 300, duration: 330, onComplete: () => s.setVisible(false) });
    playSfx(this, 'sfx-teleport');
  }

  // ---------- Small helpers used by the attacks ----------

  say(key) {
    this.bubble.say(t(key));
  }

  sayOnce(id, key) {
    if (this.said[id]) return;
    this.said[id] = true;
    this.say(key);
  }

  ui() {
    if (!this.scene.isActive('BossUI')) return null;
    const ui = this.scene.get('BossUI');
    return ui && ui.ready ? ui : null;
  }

  // call a method of the HUD (if it is ready)
  hud(method, ...args) {
    const ui = this.ui();
    if (ui) ui[method](...args);
  }

  impact(ms, shake) {
    this.hitStopLeft = Math.max(this.hitStopLeft, ms / 1000);
    if (!settings.low && !settings.reduced) this.cameras.main.shake(130, shake);
  }

  // is the point (x, y) inside the lantern light? pad = extra size of the thing (pixels)
  inBeam(x, y, pad = 0) {
    const L = this.lantern;
    if (!L.on || L.amount < 0.6) return false;
    const dx = x - L.origin.x;
    const dy = y - L.origin.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > BEAM_RANGE + pad) return false;
    if (d < 20) return true;
    const a = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - L.beam));
    return a < BEAM_HALF + 0.12 * (1 - d / BEAM_RANGE) + pad / Math.max(d, 60);
  }

  shieldBlocks(x, y) {
    const s = this.shield;
    if (!s.on) return false;
    return Math.abs(x - this.shieldImage.x) < 52 && y > this.player.y - 200 && y < this.player.y + 30;
  }

  // a letter or a gift was burned by the lantern: a small hit for the combo
  burned(x, y) {
    this.comboHit();
    this.fx.sparkle(x, y);
    playSfx(this, 'sfx-beam-hit');
  }

  // where the Jadugar's body is (for the beam and the sparks)
  get jadBody() {
    return { x: this.jad.x, y: this.jad.y - 110 };
  }

  // Jadugar poses for the attacks
  jadSlamPrep(on) {
    this.jadHoverTarget = on ? 0 : HOVER;
    this.jadBusy = on;
    if (on) this.tweens.add({ targets: this.jad.bodyGroup, scaleY: 1.12, duration: 560, ease: 'Sine.Out' });
  }

  jadSlam() {
    this.tweens.add({ targets: this.jad.bodyGroup, scaleY: 0.85, scaleX: 1.12, duration: 90, yoyo: true, onComplete: () => this.jad.bodyGroup.setScale(1) });
    this.fx.ring(this.jadGround.x, this.jadGround.y);
  }

  jadWindup() {
    this.jad.point(this.player.x, this.player.y - 40);
    this.tweens.add({ targets: this.jad.ball, scale: 1.4, duration: 300, yoyo: true });
  }

  // ---------- The fight ----------

  startRound(n) {
    this.round = n;
    this.state = 'intro';
    this.player.inputLocked = false;
    this.hud('setRound', n);
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
      this.nextAttackIn = 1.2;
      this.say(`mithu.boss.round${n}`);
      if (n === 1) this.time.delayedCall(4200, () => this.seedLine());
      if (n === 2) this.time.delayedCall(4200, () => this.sayOnce('shieldHelp', 'mithu.boss.shieldHelp'));
    });
  }

  // Mithu tells what the boss remembers from the earlier levels
  seedLine() {
    const b = this.bossBrain;
    const best = ['trojan', 'phishing', 'hathoda'].filter((n) => b.seeded.includes(n)).sort((x, y) => b.score(y) - b.score(x))[0];
    if (best) this.say(`mithu.boss.seed${best[0].toUpperCase()}${best.slice(1)}`);
  }

  activeAttacks() {
    return Object.values(this.attacks).filter((a) => a.active).length;
  }

  // the Jadugar picks and starts the next attack (never more than 2 at once)
  pickAttack() {
    const b = this.bossBrain;
    const exclude = [];
    Object.entries(this.attacks).forEach(([name, a]) => a.active && exclude.push(name));
    if (this.deepfakeCd > 0 || this.activeAttacks() > 0 || this.jadBusy) exclude.push('deepfake');
    const options = ROUND_ATTACKS[this.round].filter((n) => !exclude.includes(n));
    if (!options.length) return null;
    const name = b.choose(this.round, exclude);
    b.recordUsed(name);
    return name;
  }

  startAttack(name) {
    if (name === 'deepfake') {
      this.startDeepfake();
      return;
    }
    if (name === 'phishing') this.letters.start(this.round);
    else this.attacks[name].start();
    this.hud('setJadugarMood', 'laugh');
  }

  startDeepfake() {
    this.deepfakeCd = DEEPFAKE_COOLDOWN;
    this.jadBusy = true;
    this.clearJadShield();
    this.swirl(this.jad.x, this.jad.y - 80);
    this.jad.setVisible(false);
    this.jadShadow.setVisible(false);
    this.mithu.setVisible(false); // the real Mithu is hiding among the three
    this.hud('taunt', 'boss.taunt.deepfake');
    this.deepfake.start();
  }

  // The Deepfake Chaal ended. result: true = key to the real Mithu, false = to a fake, null = time ran out
  deepfakeDone(result) {
    this.time.delayedCall(560, () => {
      this.mithu.setVisible(true);
      this.jad.setVisible(true);
      this.jadShadow.setVisible(true);
      this.jadBusy = false;
      this.swirl(this.jad.x, this.jad.y - 80);
      this.nextAttackIn = 2.2;
    });
    if (result === true) {
      this.say('mithu.boss.rightKey');
      playSfx(this, 'sfx-key-right');
      this.stunLeft = 3;
      this.jad.beaten();
      this.hud('setJadugarMood', 'angry');
      this.impact(160, 0.01);
      this.damageBoss(60);
    } else if (result === false) {
      this.bossBrain.recordHit('deepfake');
      this.hitLog.deepfake++;
      this.say('mithu.boss.wrongKey');
      playSfx(this, 'sfx-key-wrong');
      this.player.hurtTimer = 0;
      this.hurtDodo(30, 'deepfake', 0, true);
      this.hud('setJadugarMood', 'laugh');
    }
  }

  // ---------- Health ----------

  // amount of damage from an attack. attack = 'phishing' | 'hathoda' | 'trojan' | 'deepfake'
  // dir = knock back to the left (-1) or right (1). countOnly = it is already counted by the caller
  hurtDodo(amount, attack, dir = 0, countOnly = false) {
    if (this.state !== 'fight') return;
    const p = this.player;
    if (p.hurtTimer > 0) return;
    p.hurtTimer = HURT_PROTECTION;
    this.dodoHp = Math.max(0, this.dodoHp - amount);
    if (!countOnly) {
      this.bossBrain.recordHit(attack);
      this.hitLog[attack]++;
    }
    if (dir) p.knockback(dir);
    else p.pulse(1.25, 0.8);
    this.impact(70, 0.005);
    if (!settings.low && !settings.reduced) this.cameras.main.flash(90, 255, 70, 70);
    playSfx(this, 'sfx-hit');
    this.hud('setDodoHp', this.dodoHp / DODO_MAX);
    this.hud('setJadugarMood', 'laugh');
    this.combo = 0;
    this.hud('setCombo', 0);
    if (this.dodoHp <= 0) {
      this.lose();
      return;
    }
    this.checkNewFocus();
  }

  // the AI noticed which attack works best on this player
  checkNewFocus() {
    const now = this.bossBrain.checkFocus(this.round);
    if (!now || this.tauntCd > 0) return;
    this.tauntCd = 10;
    this.hud('taunt', `boss.taunt.${now}`);
    this.time.delayedCall(900, () => this.say(`mithu.boss.noticed.${now}`));
  }

  // bugs bite for a few seconds (the touch of the gift itself was counted as a hit)
  igniteBugs() {
    this.bugsLeft = BUG_SECONDS;
    this.bugTick = 1;
    playSfx(this, 'sfx-bugs');
  }

  damageBoss(amount) {
    if (this.state !== 'fight' || amount <= 0) return;
    const floor = (BOSS_MAX * (3 - this.round)) / 3; // the end of this round
    this.bossHp = Math.max(floor, this.bossHp - amount);
    this.hud('setBossHp', this.bossHp / BOSS_MAX);
    if (this.bossHp <= floor) {
      if (this.round < 3) this.endRound();
      else this.ko();
    }
  }

  // one beam hit for the combo counter
  comboHit() {
    this.combo++;
    this.comboTimer = 1.3;
    this.hud('setCombo', this.combo);
    if (this.combo > 0 && this.combo % 5 === 0) playSfx(this, 'sfx-combo');
  }

  endRound() {
    this.state = 'roundEnd';
    this.cutscene = true;
    this.clearAttacks();
    this.clearJadShield();
    this.deepfake.clear();
    this.mithu.setVisible(true);
    this.jad.setVisible(true);
    this.jadShadow.setVisible(true);
    this.jadBusy = false;
    this.hud('showBanner', ['boss.roundClear', { n: this.round }], null, 1100, '#FFD24A');
    this.jad.beaten();
    this.hud('setJadugarMood', 'angry');
    this.dodoHp = Math.min(DODO_MAX, this.dodoHp + HEAL);
    this.hud('setDodoHp', this.dodoHp / DODO_MAX);
    this.combo = 0;
    this.hud('setCombo', 0);
    this.jadMove.x = 640;
    this.jadMove.y = 470;
    this.time.delayedCall(2800, () => this.startRound(this.round + 1));
  }

  clearAttacks() {
    Object.values(this.attacks).forEach((a) => a.clear());
    this.bugsLeft = 0;
    this.bugs.forEach((b) => b.setVisible(false));
    this.shield.on = false;
    this.shieldImage.setVisible(false);
    this.shieldFlash.setVisible(false);
    this.jad.bodyGroup.setScale(1);
  }

  // ---------- Finish ----------

  lose() {
    this.state = 'lose';
    this.cutscene = true;
    this.clearAttacks();
    this.deepfake.clear();
    this.player.inputLocked = true;
    const top = this.topHit();
    this.hud('showLose', top ? `boss.tip.${top}` : 'boss.tip.none');
    saveResult('miri', 0); // one point for the AI Hacker in "Humans vs AI"
    this.saveFightMemory();
  }

  // the attack that hit Dodo most in this fight
  topHit() {
    let best = null;
    Object.keys(this.hitLog).forEach((n) => {
      if (this.hitLog[n] > 0 && (!best || this.hitLog[n] > this.hitLog[best])) best = n;
    });
    return best;
  }

  // what the boss learned: kept for the certificate
  saveFightMemory() {
    const top = this.topHit();
    const total = Object.values(this.hitLog).reduce((a, b) => a + b, 0);
    saveBoss({ attacks: JSON.parse(JSON.stringify(this.bossBrain.stats)), top, hits: top ? this.hitLog[top] : 0, total });
  }

  // K.O.: slow motion, then the win party
  ko() {
    this.state = 'ko';
    this.cutscene = true;
    this.clearAttacks();
    this.deepfake.clear();
    this.player.inputLocked = true;
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
    this.jadHoverTarget = 0;
    this.say('mithu.boss.ko');
    this.tweens.add({ targets: jad, scale: 0.28, duration: 1100, ease: 'Back.In' });
    this.tweens.add({ targets: this.jadShadow, scaleX: 0.7, scaleY: 0.3, duration: 1100 });
    for (let i = 0; i < 6; i++) this.time.delayedCall(i * 160, () => this.fx.smoke(jad.x + Phaser.Math.Between(-50, 50), jad.y - 60));
    this.time.delayedCall(1100, () => {
      this.fx.smoke(jad.x, jad.y - 20);
      jad.setAlpha(0.9);
    });
    // the fort lights up
    this.tweens.add({ targets: this.arenaShade, alpha: 0, duration: 1200 });
    this.arenaGlow.setVisible(true);
    this.tweens.add({ targets: this.arenaGlow, alpha: 0.55, duration: 1400 });
    this.arena.torches.forEach((g) => g.setScale(2.6));
    if (!settings.low) this.cameras.main.flash(500, 255, 235, 170);
    this.time.delayedCall(700, () => this.party.start());
    this.time.delayedCall(5600, () => this.finishWin());
  }

  // 3 stars: Dodo has most health left. 2 stars: some. 1 star: he barely won.
  computeStars() {
    const left = this.dodoHp / DODO_MAX;
    return left >= 0.6 ? 3 : left >= 0.3 ? 2 : 1;
  }

  finishWin() {
    const stars = this.computeStars();
    saveResult('miri', stars);
    this.saveFightMemory();
    saveSnapshot(this.game, this);
    this.scene.stop('BossUI');
    this.cameras.main.fadeOut(600, 11, 13, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Report', { stars, bossStars: Math.max(stars, getStars('miri')) }));
  }

  // ---------- Update ----------

  update(time, delta) {
    const raw = Math.min(delta, 50) / 1000;
    if (this.slowTimer > 0) {
      this.slowTimer -= raw;
      if (this.slowTimer <= 0) this.endSlowMotion();
    }
    let dt = raw * this.slow;
    let step = delta * this.slow;
    if (this.hitStopLeft > 0) {
      this.hitStopLeft -= raw;
      dt = 0;
      step = 0;
    }
    const p = this.player;

    if (p.hurtTimer > 0) p.hurtTimer -= dt;
    p.update(time, step);
    p.setAlpha(p.hurtTimer > 0 && Math.sin(time / 45) > 0 ? 0.45 : 1);
    this.lantern.update(dt, []);
    if (this.mithu.visible) this.mithu.update(dt);
    this.fx.update(dt);
    this.arena.update(time);
    this.party.update(dt);
    this.updateJadugar(dt);
    this.updateShield(dt);

    if (this.state === 'fight') {
      this.updateBeam(dt);
      this.updateAttacks(dt);
      this.updateBugs(dt);
      if (this.tauntCd > 0) this.tauntCd -= dt;
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.combo = 0;
          this.hud('setCombo', 0);
        }
      }
    }
    this.deepfake.update(dt);
    this.updatePrompt();

    // Mithu hides during the deepfake trick: his words then come from above Dodo
    if (this.mithu.visible) this.bubble.follow(this.mithu.x, this.mithu.y - 52);
    else this.bubble.follow(p.x, p.y - 230);
  }

  // The Jadugar floats around the arena and teleports with a purple swirl.
  updateJadugar(dt) {
    const jad = this.jad;
    const m = this.jadMove;
    const g = this.jadGround;
    if (this.stunLeft > 0) this.stunLeft -= dt;
    const free = this.state === 'fight' && !this.jadBusy && this.stunLeft <= 0 && !this.deepfake.active;
    if (free) {
      m.wait -= dt;
      if (m.wait <= 0) {
        m.wait = Phaser.Math.FloatBetween(1.4, 2.6);
        m.x = Phaser.Math.Between(ARENA.jadMinX, ARENA.jadMaxX);
        m.y = Phaser.Math.Between(ARENA.jadMinY, ARENA.jadMaxY);
      }
      this.teleportIn -= dt;
      if (this.teleportIn <= 0 && !this.slam.active && !this.gifts.active) {
        this.teleportIn = Phaser.Math.FloatBetween(5, 8);
        this.teleport();
      }
    }
    // drift towards the wanted spot (slower while attacking)
    const speed = this.slam.active || this.gifts.active ? 0 : 2.2;
    g.x += (m.x - g.x) * Math.min(1, dt * speed);
    g.y += (m.y - g.y) * Math.min(1, dt * speed);
    this.jadHover += (this.jadHoverTarget - this.jadHover) * Math.min(1, dt * 8);
    const bob = this.jadHoverTarget > 0 ? Math.sin(this.time.now / 380) * 7 : 0;
    jad.setPosition(g.x, g.y - this.jadHover - bob);
    jad.update(dt);
    jad.setDepth(g.y + 2);
    this.jadShadow.setPosition(g.x, g.y + 6).setDepth(g.y - 1).setAlpha(0.55 - Math.min(0.3, this.jadHover / 220));
    if (this.jadShield.on) {
      const pulse = 0.55 + Math.sin(this.time.now / 90) * 0.12;
      this.shieldGlow.setPosition(jad.x, jad.y - 110).setAlpha(pulse * 0.7).setDepth(g.y + 3);
      this.shieldRing.setPosition(jad.x, jad.y - 110).setAlpha(pulse).setDepth(g.y + 3);
    }
  }

  teleport() {
    const g = this.jadGround;
    const p = this.player;
    this.jadBusy = true;
    this.swirl(g.x, g.y - this.jadHover - 40);
    this.tweens.add({ targets: this.jad, alpha: 0, duration: 220 });
    this.time.delayedCall(260, () => {
      if (this.state !== 'fight') {
        this.jad.setAlpha(1);
        this.jadBusy = false;
        return;
      }
      let x = Phaser.Math.Between(ARENA.jadMinX, ARENA.jadMaxX);
      let y = Phaser.Math.Between(ARENA.jadMinY, ARENA.jadMaxY);
      if (Phaser.Math.Distance.Between(x, y, p.x, p.y) < 220) x = x < 640 ? ARENA.jadMaxX : ARENA.jadMinX;
      g.x = x;
      g.y = y;
      this.jadMove.x = x;
      this.jadMove.y = y;
      this.swirl(x, y - this.jadHover - 40);
      this.tweens.add({ targets: this.jad, alpha: 1, duration: 260 });
      this.time.delayedCall(280, () => {
        this.jadBusy = false;
        // sometimes he comes back with a purple shield (the lantern breaks it)
        if (!this.deepfake.active && Math.random() < (this.round === 1 ? 0.25 : 0.45)) this.raiseJadShield();
      });
    });
  }

  raiseJadShield() {
    this.jadShield.on = true;
    this.jadShield.hp = 1;
    this.shieldGlow.setVisible(true);
    this.shieldRing.setVisible(true);
  }

  clearJadShield() {
    this.jadShield.on = false;
    this.shieldGlow.setVisible(false);
    this.shieldRing.setVisible(false);
  }

  // the lantern beam on the Jadugar: breaks his shield, then deals steady damage
  updateBeam(dt) {
    if (this.jadBusy && !this.slam.active) return; // teleporting: cannot be hit
    if (!this.jad.visible || this.deepfake.active) return;
    const body = this.jadBody;
    if (!this.inBeam(body.x, body.y, 62)) {
      this.beamTick = 0;
      return;
    }
    if (this.jadShield.on) {
      this.jadShield.hp -= dt / 0.9;
      this.fx.sparkle(body.x + Phaser.Math.Between(-50, 50), body.y + Phaser.Math.Between(-60, 60));
      if (this.jadShield.hp <= 0) {
        this.clearJadShield();
        this.jad.beaten();
        this.hud('setJadugarMood', 'angry');
        this.impact(80, 0.006);
        playSfx(this, 'sfx-shield');
        for (let i = 0; i < 4; i++) this.fx.sparkle(body.x + Phaser.Math.Between(-60, 60), body.y + Phaser.Math.Between(-60, 60));
      }
      return;
    }
    if (this.stunLeft > 0 && this.stunLeft < 0.1) return;
    this.damageBoss(BEAM_DPS * dt);
    this.beamTick += dt;
    if (this.beamTick >= 0.25) {
      this.beamTick = 0;
      this.comboHit();
      this.fx.sparkle(body.x + Phaser.Math.Between(-40, 40), body.y + Phaser.Math.Between(-50, 30));
      playSfx(this, 'sfx-beam-hit');
      this.jad.beaten();
    }
  }

  // the Jadugar's attacks: telegraphed, and never more than two at once
  updateAttacks(dt) {
    this.letters.update(dt);
    this.slam.update(dt);
    this.gifts.update(dt);
    if (this.deepfakeCd > 0) this.deepfakeCd -= dt;
    if (this.jadBusy || this.stunLeft > 0 || this.deepfake.active) return;
    this.nextAttackIn -= dt;
    if (this.nextAttackIn > 0) return;
    if (this.activeAttacks() >= 2) {
      this.nextAttackIn = 0.3;
      return;
    }
    const name = this.pickAttack();
    if (!name) {
      this.nextAttackIn = 0.4;
      return;
    }
    this.startAttack(name);
    const base = [0, 2.3, 1.9, 1.5][this.round];
    this.nextAttackIn = base + Math.random() * 0.8;
  }

  updateBugs(dt) {
    const p = this.player;
    if (this.bugsLeft <= 0) {
      this.bugs.forEach((b) => b.setVisible(false));
      return;
    }
    this.bugsLeft -= dt;
    this.bugTick -= dt;
    if (this.bugTick <= 0) {
      this.bugTick = 1;
      this.dodoHp = Math.max(0, this.dodoHp - 4);
      this.hud('setDodoHp', this.dodoHp / DODO_MAX);
      p.pulse(1.1, 0.92);
      if (this.dodoHp <= 0) {
        this.lose();
        return;
      }
    }
    this.bugs.forEach((b, i) => {
      const a = this.time.now / 160 + (i * Math.PI * 2) / 3;
      b.setVisible(true).setPosition(p.x + Math.cos(a) * 46, p.y - 60 - Math.sin(a) * 30).setDepth(p.y + 5);
    });
  }

  // ---------- Firewall Shield (E) ----------

  updateShield(dt) {
    const s = this.shield;
    const p = this.player;
    if (s.cd > 0) s.cd = Math.max(0, s.cd - dt);
    this.hud('setShield', s.on ? 0 : 1 - s.cd / SHIELD_COOLDOWN);
    if (s.on) {
      s.t -= dt;
      const x = p.x + p.facingDir * 78;
      this.shieldImage.setPosition(x, p.y + 8).setDepth(p.y + 4).setAlpha(Math.min(1, s.t / 0.25 + 0.2));
      this.shieldFlash.setPosition(x, p.y - 80).setDepth(p.y + 3.9).setAlpha(0.55 + Math.sin(this.time.now / 60) * 0.12);
      if (s.t <= 0) {
        s.on = false;
        s.cd = SHIELD_COOLDOWN; // the 4 second cooldown starts when the shield ends
        this.shieldImage.setVisible(false);
        this.shieldFlash.setVisible(false);
      }
    }
  }

  raiseShield() {
    const s = this.shield;
    if (s.on || s.cd > 0 || this.state !== 'fight' || this.player.inputLocked) return;
    s.on = true;
    s.t = SHIELD_TIME;
    this.shieldImage.setVisible(true).setScale(0.4, 1);
    this.tweens.add({ targets: this.shieldImage, scaleX: 1, duration: 180, ease: 'Back.Out' });
    this.shieldFlash.setVisible(true);
    this.player.pulse(1.1, 0.92);
    playSfx(this, 'sfx-shield');
  }

  // E: the code word question (deepfake trick) comes first, otherwise the shield
  updatePrompt() {
    const pressed = Phaser.Input.Keyboard.JustDown(this.useKey);
    const label = this.deepfake.prompt();
    if (label) {
      const c = this.deepfake.near;
      this.eHint.show();
      this.eHint.place(c.x, c.y - 300);
      this.eHint.setAction(label);
      if (pressed) this.deepfake.interact();
      return;
    }
    this.eHint.hide();
    if (pressed && this.state === 'fight') this.raiseShield();
  }

  // ---------- Developers only ----------
  // K = hit the boss for 40   J = hurt Dodo for 30   N = next round   (console: window.__boss)
  setupDebug() {
    window.__boss = this;
    this.input.keyboard.on('keydown-K', () => this.damageBoss(40));
    this.input.keyboard.on('keydown-J', () => {
      this.player.hurtTimer = 0;
      this.hurtDodo(30, 'hathoda');
    });
    this.input.keyboard.on('keydown-I', () => console.table(this.bossBrain.stats));
  }
}
