import Phaser from 'phaser';
import { playSfx } from '../fx/sound.js';
import { addText } from '../i18n/i18nText.js';
import { FONT } from '../data/colors.js';

const UNLOCK_SECONDS = 8; // unlocking a building that was NOT backed up takes this long
const NEAR = 175; // how close Dodo must be to unlock

// A building of the fort: Kutubkhana (library), Anaaj Ghar (granary) or Ghar (house).
//   backedUp  - Dodo held E near it and a scroll flew to the Kutubkhana shelf (a "Backed up" badge shows)
//   locked    - a Taala Bhoot (ghost) chained it with a big padlock. A locked building slowly costs coins.
// Unlock with E: backed up = instant restore (scroll magic); not backed up = a long 8 second bar.
export default class Building extends Phaser.GameObjects.Container {
  constructor(scene, id, textureKey, x, y) {
    super(scene, x, y);
    this.id = id;
    this.backedUp = false;
    this.locked = false;
    this.unlocking = false;
    this.progress = 0;
    this.ghost = null;
    this.drain = 0;
    this.lockedAt = 0;

    const add = scene.add;
    this.shadow = add.image(0, 6, 'shadow').setScale(2.4, 1.1).setAlpha(0.85);
    this.house = add.image(0, 0, textureKey).setOrigin(0.5, 1).setScale(1.12);
    this.chains = add.image(0, -96, 'chain-lock').setScale(1.1).setVisible(false);
    this.badge = add.image(54, -150, 'badge-backup').setScale(0).setVisible(false);
    this.barBack = add.rectangle(0, -210, 120, 18, 0x2a1408).setStrokeStyle(3, 0x1e1008).setVisible(false);
    this.barFill = add.rectangle(-58, -210, 2, 12, 0xffd24a).setOrigin(0, 0.5).setVisible(false);
    this.badgeText = addText(scene, 54, -112, 'level2.backedUp', { fontFamily: FONT, fontSize: '20px', fontStyle: '700', color: '#DFF3FF', stroke: '#10143a', strokeThickness: 5 }).setOrigin(0.5).setVisible(false);
    this.ring = add.graphics(); // the ring that fills while Dodo holds E to back up
    this.add([this.shadow, this.house, this.chains, this.badge, this.badgeText, this.barBack, this.barFill, this.ring]);
    this.setDepth(y);
    scene.add.existing(this);
  }

  // a solid footprint on the ground (for Dodo and the monsters)
  get collider() {
    return { x: this.x, y: this.y - 20, rx: 78, ry: 30, h: 0, low: false };
  }

  get topPoint() {
    return { x: this.x, y: this.y - 190 };
  }

  isNear(player) {
    return Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y + 20) < NEAR;
  }

  // ---------- backup ----------

  setBackedUp() {
    if (this.backedUp) return;
    this.backedUp = true;
    this.badge.setVisible(true);
    this.badgeText.setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this.badgeText, alpha: 1, duration: 400, delay: 200 });
    this.setBackupProgress(0);
    this.scene.tweens.add({ targets: this.badge, scale: 1, duration: 420, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: this.house, scaleY: { from: 1.0, to: 1.12 }, scaleX: 1.12, duration: 200, ease: 'Back.Out' });
  }

  // the ring above the building: p = 0..1 (0 hides it)
  setBackupProgress(p) {
    const g = this.ring;
    g.clear();
    if (p <= 0) return;
    g.fillStyle(0x2a0e14, 0.7);
    g.fillCircle(0, -215, 30);
    g.lineStyle(9, 0x9bdcff, 1);
    g.beginPath();
    g.arc(0, -215, 22, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2, false);
    g.strokePath();
  }

  // ---------- Taala Bhoot ----------

  lock(ghost) {
    this.locked = true;
    this.ghost = ghost;
    this.progress = 0;
    this.unlocking = false;
    this.drain = 0;
    this.chains.setVisible(true).setAlpha(1).setScale(0.2);
    this.scene.tweens.add({ targets: this.chains, scale: 1.1, duration: 380, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: this.house, x: { from: -5, to: 5 }, duration: 55, yoyo: true, repeat: 3, onComplete: () => this.house.setX(0) });
    playSfx(this.scene, 'sfx-chain-lock');
    this.scene.events.emit('building-locked', this);
  }

  // E near a locked building
  beginUnlock() {
    if (!this.locked || this.unlocking) return;
    if (this.backedUp) {
      this.unlocking = true;
      this.scene.playRestore(this);
    } else {
      this.unlocking = true;
      this.progress = 0;
      this.barBack.setVisible(true);
      this.barFill.setVisible(true);
      this.scene.events.emit('no-backup', this);
    }
  }

  // chains break, the ghost poofs
  finishUnlock(restored) {
    this.locked = false;
    this.unlocking = false;
    this.barBack.setVisible(false);
    this.barFill.setVisible(false);
    const scene = this.scene;
    scene.tweens.add({ targets: this.chains, alpha: 0, scale: 1.5, duration: 320, onComplete: () => this.chains.setVisible(false) });
    for (let i = 0; i < 7; i++) scene.time.delayedCall(i * 40, () => scene.fx.sparkle(this.x + (Math.random() - 0.5) * 120, this.y - 40 - Math.random() * 110));
    scene.smoke(this.x, this.y - 70);
    if (this.ghost) this.ghost.poof();
    this.ghost = null;
    scene.events.emit('building-unlocked', this, restored);
  }

  update(dt, player) {
    if (this.locked && this.unlocking && !this.backedUp) {
      // the long unlock bar: it only moves while Dodo stays close
      if (this.isNear(player)) this.progress += dt / UNLOCK_SECONDS;
      this.barFill.width = Math.max(2, 116 * Math.min(1, this.progress));
      if (this.progress >= 1) this.finishUnlock(false);
    }
    if (this.locked) this.chains.rotation = Math.sin(this.scene.time.now / 260) * 0.02;
  }
}
