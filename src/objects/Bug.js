import Phaser from 'phaser';
import { playSfx } from '../fx/sound.js';

const BITE_DISTANCE = 34;
const SAFE_HEIGHT = 28; // Dodo can jump over bugs
const LIFE = 13;

// A small cartoon bug that comes out of an opened gift. It chases Dodo in a swarm and
// nibbles one coin from the HUD when it touches him. Sweep it away with E (Antivirus Jharoo).
// Pooled: bugs are reused.
export default class Bug extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    this.time = Math.random() * 6;
    this.state = 'off';
    this.shadow = scene.add.image(0, 2, 'shadow').setScale(0.3).setAlpha(0.6);
    this.bugImage = scene.add.image(0, -6, 'bug').setOrigin(0.5, 0.8);
    this.add([this.shadow, this.bugImage]);
    scene.add.existing(this);
    this.setActive(false).setVisible(false);
  }

  activate(x, y) {
    this.setPosition(x, y).setActive(true).setVisible(true).setAlpha(1).setScale(0.2);
    this.scene.tweens.add({ targets: this, scale: 1, duration: 260, ease: 'Back.Out' });
    this.state = 'chase';
    this.life = LIFE + Math.random() * 3;
    this.cooldown = 0.8;
    this.orbit = Math.random() * Math.PI * 2;
    this.orbitRadius = 14 + Math.random() * 26;
    this.speed = 95 + Math.random() * 45;
    playSfx(this.scene, 'sfx-bug-buzz');
  }

  deactivate() {
    this.state = 'off';
    this.setActive(false).setVisible(false);
    this.scene.tweens.killTweensOf(this);
  }

  // swept away by the broom: a little star and gone
  zap() {
    if (this.state !== 'chase') return false;
    this.state = 'zapped';
    this.scene.tweens.add({
      targets: this,
      scale: 1.7,
      alpha: 0,
      angle: 180,
      duration: 260,
      onComplete: () => this.deactivate(),
    });
    this.scene.fx.sparkle(this.x, this.y - 16);
    return true;
  }

  update(dt) {
    if (!this.active || this.state === 'zapped') return;
    this.time += dt;
    const p = this.scene.player;

    this.life -= dt;
    if (this.life <= 0) {
      // the bug loses interest and fades away
      this.state = 'zapped';
      this.scene.tweens.add({ targets: this, alpha: 0, duration: 400, onComplete: () => this.deactivate() });
      return;
    }

    // swarm around Dodo: move towards a spot that circles him
    this.orbit += dt * 1.6;
    const tx = p.x + Math.cos(this.orbit) * this.orbitRadius;
    const ty = p.y + Math.sin(this.orbit) * this.orbitRadius * 0.6;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const step = Math.min(d, this.speed * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    this.bugImage.y = -6 - Math.abs(Math.sin(this.time * 14)) * 3;
    this.bugImage.angle = Math.sin(this.time * 18) * 8;
    this.bugImage.setFlipX(dx < 0);

    // nibble a coin
    this.cooldown -= dt;
    const pd = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
    // only one bite at a time, so the coins do not vanish all at once (fair!)
    const now = this.scene.time.now;
    if (this.cooldown <= 0 && pd < BITE_DISTANCE && p.z < SAFE_HEIGHT && now - (this.scene.lastBiteTime || 0) > 800) {
      this.scene.lastBiteTime = now;
      this.cooldown = 1.8;
      this.scene.tweens.add({ targets: this.bugImage, scaleX: 1.4, scaleY: 0.7, duration: 80, yoyo: true });
      this.scene.events.emit('bug-bite', this);
    }
    this.setDepth(this.y);
  }
}
