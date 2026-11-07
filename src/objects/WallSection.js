import Phaser from 'phaser';
import { ratePassword, crackTimeWords, hammerDamage, TIERS } from '../ai/passwordAI.js';
import { addText, setSource } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';
import { playSfx } from '../fx/sound.js';
import { WALL_W, WALL_H } from './amriTextures.js';
import { settings } from '../data/settings.js';

export const MAX_PASSWORD = 14;
const PLAQUE_BAR = 176;
const TIER_TINT = { weak: 0xb8a088, medium: 0xffffff, strong: 0xfff0c0 };
const TIER_BAR = { weak: 0xe0453a, medium: 0xf0a030, strong: 0x45c46a };
const HEAL_PER_BRICK = 12;

// One section of the wall (LEFT, CENTER or RIGHT) with its password.
// Its strength comes from zxcvbn (see passwordAI.js):
//   weak   = cracked, dull stones      medium = solid stones      strong = a glowing gold edge and a shine
// A stone plaque above it shows the password, a strength bar and the crack time in words.
// Hathoda Dev hammers it: damage depends on the crack time. At 0 health the section breaks.
export default class WallSection extends Phaser.GameObjects.Container {
  constructor(scene, id, x, wallY, password) {
    super(scene, x, wallY);
    this.id = id;
    this.wallY = wallY;
    this.password = password;
    this.health = 100;
    this.broken = false;
    this.tier = null;
    this.time = Math.random() * 6;
    this.rating = ratePassword(password);
    this.span = WALL_W; // the width of the section on the screen (the level scales it to fit)

    const add = scene.add;
    this.rubble = add.image(0, 0, 'wall-rubble').setOrigin(0.5, 1).setVisible(false);
    this.body_ = add.image(0, 0, 'wall-seg').setOrigin(0.5, 1);
    this.cracks = [1, 2, 3].map((n) => add.image(0, 0, `wall-crack-${n}`).setOrigin(0.5, 1).setAlpha(0));
    this.glow = add.image(0, 4, 'wall-glow').setOrigin(0.5, 1).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.shine = add.image(0, -WALL_H + 14, 'fx-glint').setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setScale(1.4);
    this.add([this.rubble, this.body_, ...this.cracks, this.glow, this.shine]);
    this.setDepth(wallY);
    scene.add.existing(this);

    this.buildPlaque(scene);
    this.refresh(false);
  }

  // ---------- plaque ----------

  buildPlaque(scene) {
    // the plaque hangs on the front of the wall, so it is easy to read from Dodo's side
    const y = this.wallY - 50;
    this.plaque = scene.add.container(this.x, y).setDepth(this.wallY + 0.5).setScale(0.92);
    const bg = scene.add.image(0, 0, 'plaque');
    this.pwText = scene.add
      .text(0, -26, '', { fontFamily: 'Fredoka, Arial, sans-serif', fontSize: '32px', fontStyle: '700', color: '#3A1C16', resolution: 2 })
      .setOrigin(0.5);
    this.barBack = scene.add.rectangle(0, 8, PLAQUE_BAR, 16, 0x3a2810).setStrokeStyle(2, 0x1e1008);
    this.barFill = scene.add.rectangle(-PLAQUE_BAR / 2 + 2, 8, 4, 11, TIER_BAR.weak).setOrigin(0, 0.5);
    this.timeText = addText(scene, 0, 40, () => this.timeString(), { fontFamily: 'Fredoka, Arial, sans-serif', fontSize: '22px', fontStyle: '600', color: '#4A2A10' }).setOrigin(0.5);
    this.plaque.add([bg, this.pwText, this.barBack, this.barFill, this.timeText]);
    this.barWidth = 4;
    this.barTarget = 4;
  }

  timeString() {
    if (this.broken) return t('pw.broken');
    const w = crackTimeWords(this.rating.seconds);
    return t('pw.cracked', { time: t(w.key, { n: w.n }) });
  }

  // ---------- strength ----------

  get crackSeconds() {
    return this.rating.seconds;
  }

  // the strength of the password changed: update the look (smoothly)
  refresh(animate = true) {
    const scene = this.scene;
    this.rating = ratePassword(this.broken ? '' : this.password);
    const old = this.tier;
    this.tier = this.broken ? TIERS.weak : this.rating.tier;

    this.pwText.setText(this.broken ? '- - -' : this.password);
    this.pwText.setScale(Math.min(1, 232 / Math.max(1, this.pwText.width)));
    this.barTarget = Math.max(4, (PLAQUE_BAR - 4) * (this.broken ? 0 : this.rating.strength));
    this.barFill.setFillStyle(TIER_BAR[this.tier]);
    setSource(this.timeText, () => this.timeString()); // the crack time in words

    // look of the stones
    const tint = TIER_TINT[this.tier];
    scene.tweens.killTweensOf(this.glow);
    scene.tweens.add({ targets: this.glow, alpha: this.tier === TIERS.strong && !this.broken ? 0.85 : 0, duration: animate ? 500 : 0 });
    this.body_.setTint(tint);
    this.rubble.setVisible(this.broken);
    this.body_.setVisible(!this.broken);
    this.updateCracks();

    const rank = { weak: 0, medium: 1, strong: 2 };
    if (animate && old && rank[this.tier] > rank[old] && !this.broken) this.levelUp();
    else if (animate) this.scene.tweens.add({ targets: this.pwText, scale: this.pwText.scale * 1.25, duration: 120, yoyo: true });
  }

  updateCracks() {
    const damage = 100 - this.health;
    const weakLook = this.tier === TIERS.weak && !this.broken ? 0.55 : 0;
    this.cracks[0].setAlpha(Math.max(weakLook, Phaser.Math.Clamp(damage / 30, 0, 1)));
    this.cracks[1].setAlpha(Phaser.Math.Clamp((damage - 30) / 25, 0, 1));
    this.cracks[2].setAlpha(Phaser.Math.Clamp((damage - 60) / 25, 0, 1));
    this.cracks.forEach((c) => c.setVisible(!this.broken));
  }

  // a little "level up": sparkles along the top and a happy bounce
  levelUp() {
    playSfx(this.scene, 'sfx-wall-up');
    this.scene.tweens.add({ targets: this, scaleY: 1.07, duration: 140, yoyo: true, ease: 'Back.Out' });
    for (let i = 0; i < 6; i++) {
      this.scene.time.delayedCall(i * 70, () => this.scene.fx.sparkle(this.x + (Math.random() - 0.5) * (this.span - 60), this.wallY - WALL_H + 10));
    }
    this.scene.events.emit('wall-levelup', this);
  }

  // ---------- bricks ----------

  get isFull() {
    return !this.broken && this.password.length >= MAX_PASSWORD;
  }

  // a brick (one character) is added at the end of the password
  addChar(ch) {
    if (this.isFull) return false;
    if (this.broken) {
      // rebuilding: the new brick starts a fresh password
      this.broken = false;
      this.password = '';
      this.health = 0;
      this.scene.tweens.add({ targets: this, scaleY: { from: 0.4, to: 1 }, duration: 320, ease: 'Back.Out' });
    }
    this.password += ch;
    this.health = Math.min(100, this.health + HEAL_PER_BRICK + (this.password.length === 1 ? 28 : 0));
    this.refresh(true);
    return true;
  }

  // ---------- Hathoda Dev ----------

  // damage of one hammer hit (log scale of the crack time)
  get hitDamage() {
    return hammerDamage(this.rating.seconds);
  }

  // returns true if the section broke
  takeHit(amount) {
    if (this.broken) return false;
    this.health = Math.max(0, this.health - amount);
    const scene = this.scene;
    scene.tweens.add({ targets: this.body_, y: { from: 3, to: 0 }, duration: 120 });
    // a white flash when the hammer lands
    this.body_.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    scene.time.delayedCall(70, () => this.body_.setTint(TIER_TINT[this.tier]).setTintMode(Phaser.TintModes.MULTIPLY));
    this.updateCracks();
    if (this.health <= 0) {
      this.breakDown();
      return true;
    }
    return false;
  }

  breakDown() {
    this.broken = true;
    this.password = '';
    playSfx(this.scene, 'sfx-wall-break');
    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 40, () => this.scene.fx.puff(this.x + (Math.random() - 0.5) * (this.span - 40), this.wallY, Math.random() < 0.5 ? -1 : 1));
    }
    this.scene.impact(90, 0.007);
    this.refresh(true);
    this.scene.events.emit('wall-broken', this);
  }

  // where Dodo must stand (south of the wall) to place bricks here
  isNear(player) {
    return Math.abs(player.x - this.x) < this.span / 2 + 30 && player.y - this.wallY < 210 && player.y > this.wallY;
  }

  update(dt) {
    this.time += dt;
    // the strength bar slides smoothly
    this.barWidth += (this.barTarget - this.barWidth) * Math.min(1, dt * 8);
    this.barFill.width = this.barWidth;
    // strong wall: a shine runs along the gold edge
    if (this.tier === TIERS.strong && !this.broken && !settings.low) {
      const p = (this.time * 0.45) % 1.6;
      this.shine.setAlpha(p < 1 ? Math.sin(p * Math.PI) : 0);
      this.shine.setX(-WALL_W / 2 + 30 + p * (WALL_W - 60));
      this.shine.rotation = this.time * 2;
    } else {
      this.shine.setAlpha(0);
    }
  }
}
