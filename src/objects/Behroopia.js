import Phaser from 'phaser';
import Villager from './Villager.js';
import { playSfx } from '../fx/sound.js';
import { settings } from '../data/settings.js';

const FLEE_SPEED = 215;

// Behroopia Qasid: a purple blob monster that looks almost exactly like a villager.
// Each disguise has ONE small tell:
//   chacha -> his badge is a slightly wrong colour (violet, not green)
//   amma   -> a tiny purple tail flicks out under her dress every few seconds
//   bacha  -> his eyes glow for a moment
// If it reaches the middle it steals coins, laughs and runs away.
// If the lantern shines on it for long enough, the disguise pops off (phishing is revealed!).
export default class Behroopia extends Villager {
  constructor(scene, world) {
    super(scene, world);
    this.impostor = true;
    this.revealed = false;
    this.tellTimer = 2;
    this.thrown = false;

    const add = scene.add;
    this.blobImage = add.image(0, 0, 'behroopia-blob').setOrigin(0.5, 1);
    this.blobEyeL = add.image(-13, -36, 'behroopia-eye').setScale(0.8);
    this.blobEyeR = add.image(11, -36, 'behroopia-eye').setScale(0.8);
    this.blobMouth = add.image(0, -22, 'behroopia-mouth').setScale(0.9);
    this.blobTail = add.image(-34, -22, 'npc-tail').setOrigin(0.5, 0).setScale(1.2);
    this.windupBlob = add.image(0, -88, 'spam-blob').setVisible(false);
    this.blobParts = add.container(0, 0, [this.blobTail, this.blobImage, this.blobEyeL, this.blobEyeR, this.blobMouth]);
    this.blobForm = add.container(0, 0, [this.blobParts, this.windupBlob]).setVisible(false);
    this.add(this.blobForm);
  }

  activate(kind, x, y, path) {
    super.activate(kind, x, y, path);
    this.impostor = true;
    this.revealed = false;
    this.thrown = false;
    this.tellTimer = Phaser.Math.FloatBetween(1.5, 3);
    this.facing.setVisible(true);
    this.blobForm.setVisible(false);
    this.shadow.setVisible(true);
    // the tell
    if (kind === 'chacha') this.badge.setTint(0x6c4cc0);
    if (kind === 'amma') this.tailTell.setVisible(true).setAngle(0);
  }

  deactivate() {
    super.deactivate();
    if (this.blobForm) this.blobForm.setVisible(false);
  }

  // ---------- Disguise tells ----------

  runTell() {
    if (this.kind === 'amma') {
      this.scene.tweens.add({ targets: this.tailTell, angle: { from: -30, to: 30 }, duration: 110, yoyo: true, repeat: 2 });
    } else if (this.kind === 'bacha') {
      this.eyeGlow.setVisible(true);
      this.eyeGlow2.setVisible(true);
      this.scene.time.delayedCall(90, () => {
        this.eyeGlow.setVisible(false);
        this.eyeGlow2.setVisible(false);
      });
    }
  }

  // ---------- Lantern ----------

  // the lantern has shone long enough: the disguise falls off
  onScanned() {
    this.reveal();
  }

  reveal() {
    if (this.revealed || !this.active) return;
    this.revealed = true;
    this.state = 'revealed';
    this.timer = 0.55;
    this.unshineAll();
    this.showBlob();
    this.scene.smoke(this.x, this.y - 40);
    this.scene.impact(70, 0.004);
    playSfx(this.scene, 'sfx-reveal');
    this.scene.events.emit('caught', this);
  }

  unshineAll() {
    this.squint.setVisible(false);
    this.headImage.setScale(1, 1);
  }

  showBlob() {
    this.facing.setVisible(false);
    this.blobForm.setVisible(true).setScale(0.3);
    this.blobParts.setScale(0.95);
    this.scene.tweens.add({ targets: this.blobForm, scale: 1, duration: 380, ease: 'Back.Out' });
  }

  // ---------- Reaching the middle ----------

  arrive() {
    this.state = 'steal';
    this.timer = 1.7;
    this.showBlob();
    this.scene.smoke(this.x, this.y - 40);
    playSfx(this.scene, 'sfx-laugh');
    this.scene.tweens.add({ targets: this.blobForm, y: -16, duration: 170, yoyo: true, repeat: 3, ease: 'Sine.Out' });
    this.scene.events.emit('stolen', this);
  }

  startFlee() {
    const g = this.world.gate;
    this.state = 'flee';
    this.leaving = true;
    this.speed = FLEE_SPEED;
    this.path = [{ x: this.x + Phaser.Math.Between(-90, 90), y: this.y - 140 }, { x: g.x, y: g.y - 10 }];
    this.pathIndex = 0;
  }

  // ---------- Update ----------

  update(dt) {
    if (!this.active) return;
    this.time += dt;
    this.updateTells(dt);

    if (this.state === 'steal') {
      this.timer -= dt;
      this.blobSquish(dt, 1.8);
      if (this.timer <= 0) this.startFlee();
    } else if (this.state === 'revealed') {
      this.timer -= dt;
      this.blobSquish(dt, 4);
      if (this.timer <= 0) this.afterReveal();
    } else if (this.state === 'windup') {
      this.timer -= dt;
      this.blobSquish(dt, 6);
      const t = 1 - Math.max(0, this.timer) / 0.55;
      this.windupBlob.setScale(t * 1.1).setPosition(0, -90 - Math.sin(this.time * 14) * 2);
      if (this.timer <= 0) this.throwBlob();
    } else if (this.state === 'flee') {
      this.move(dt);
      this.blobSquish(dt, 11);
    } else {
      super.update(dt);
      return;
    }
    this.setDepth(this.y);
  }

  updateTells(dt) {
    if (this.revealed || this.state === 'steal') return;
    this.tellTimer -= dt;
    if (this.tellTimer <= 0) {
      this.tellTimer = Phaser.Math.FloatBetween(2.6, 4.4);
      this.runTell();
    }
  }

  // squishy wobble of the blob body
  blobSquish(dt, speed) {
    this.phase += dt * speed;
    const wob = settings.reduced ? 0.04 : 0.11;
    const sy = 1 + Math.sin(this.phase) * wob;
    this.blobParts.setScale(0.95 / sy, 0.95 * sy);
    this.blobEyeL.y = this.blobEyeR.y = -36 + Math.sin(this.phase + 1) * 1.2;
    this.blobTail.rotation = Math.sin(this.phase * 0.8) * 0.5;
    if (this.state === 'flee') this.blobForm.y = -Math.abs(Math.sin(this.phase)) * 8;
    if (this.state === 'flee' && Math.abs(this.dir.x) > 0.2) this.blobParts.scaleX *= this.dir.x > 0 ? 1 : -1;
  }

  // after the disguise is off: sometimes throw a spam blob, then run
  afterReveal() {
    const p = this.scene.player;
    const d = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
    if (!this.thrown && d > 190 && d < 640 && Math.random() < this.world.throwChance) {
      this.thrown = true;
      this.state = 'windup';
      this.timer = 0.55;
      this.windupBlob.setVisible(true).setScale(0);
    } else {
      this.startFlee();
    }
  }

  throwBlob() {
    this.windupBlob.setVisible(false);
    this.scene.throwSpam(this.x, this.y, this.scene.player);
    playSfx(this.scene, 'sfx-throw');
    this.scene.tweens.add({ targets: this.blobParts, scaleX: 1.15, scaleY: 0.8, duration: 90, yoyo: true });
    this.startFlee();
  }
}
