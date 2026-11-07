import Phaser from 'phaser';
import { settings } from '../data/settings.js';

const FOLLOW_STIFFNESS = 38; // how strongly Mithu is pulled towards Dodo
const FOLLOW_DAMPING = 9;
const SIDE_DISTANCE = 78; // Mithu stays behind Dodo by this much
const SHOULDER_HEIGHT = 108; // pixels above Dodo's feet

// Mithu, the green parrot guide. Built from separate parts:
//   facing -> flips to look the same way as Dodo
//     tail, far wing, body, cheek, eye, beak, near wing
// He follows Dodo with a soft spring, floats up and down, flaps his wings,
// and does a happy loop when Dodo lands a jump.
export default class Mithu extends Phaser.GameObjects.Container {
  constructor(scene, player) {
    super(scene, player.x - SIDE_DISTANCE, player.y - SHOULDER_HEIGHT);
    this.player = player;
    this.vx = 0;
    this.vy = 0;
    this.time = 0;
    this.faceDir = 1;
    this.looping = false;

    const add = scene.add;
    this.shadow = add.image(0, 0, 'shadow').setScale(0.55).setAlpha(0.5);
    this.tail = add.image(-14, 14, 'mithu-tail').setOrigin(0.5, 0).setAngle(28);
    this.wingFar = add.image(-6, 0, 'mithu-wing').setOrigin(0.15, 0.2).setTint(0xb8d8b0);
    this.body = add.image(0, 0, 'mithu-body');
    this.cheek = add.image(10, -5, 'mithu-cheek');
    this.eye = add.image(8, -13, 'mithu-eye');
    this.beak = add.image(21, -8, 'mithu-beak').setOrigin(0.1, 0.5);
    this.wingNear = add.image(-6, 3, 'mithu-wing').setOrigin(0.15, 0.2);

    this.facing = add.container(0, 0, [this.tail, this.wingFar, this.body, this.cheek, this.eye, this.beak, this.wingNear]);
    this.loopHolder = add.container(0, 0, [this.facing]);
    this.add([this.shadow, this.loopHolder]);
    this.setScale(1.25);
    this.setSize(60, 60);
    scene.add.existing(this);

    this.flap(this.wingNear, 0);
    this.flap(this.wingFar, 60);
    scene.tweens.add({ targets: this.tail, angle: 38, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.scheduleBlink();

    // happy loop whenever Dodo lands
    this.onLanded = () => this.happyLoop();
    player.on('landed', this.onLanded);
    this.once('destroy', () => player.off('landed', this.onLanded));
  }

  flap(wing, delay) {
    this.scene.tweens.add({
      targets: wing,
      angle: { from: -55, to: 25 },
      duration: 110,
      delay,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  scheduleBlink() {
    this.scene.time.delayedCall(Phaser.Math.Between(1800, 4200), () => {
      if (!this.scene || !this.active) return;
      this.scene.tweens.add({
        targets: this.eye,
        scaleY: 0.1,
        duration: 70,
        yoyo: true,
        onComplete: () => this.scheduleBlink(),
      });
    });
  }

  // a small loop-the-loop in the air
  happyLoop() {
    if (this.looping) return;
    this.looping = true;
    this.scene.tweens.add({
      targets: this.loopHolder,
      angle: this.faceDir * 360,
      duration: settings.reduced ? 1 : 650,
      ease: 'Cubic.InOut',
      onComplete: () => {
        this.loopHolder.setAngle(0);
        this.looping = false;
      },
    });
    this.scene.tweens.add({ targets: this.loopHolder, y: -26, duration: 325, yoyo: true, ease: 'Sine.Out' });
    this.emit('happy');
  }

  update(dt) {
    this.time += dt;
    const p = this.player;
    // stay behind Dodo (opposite to the way he faces), at shoulder height
    const wantX = p.x - p.facingDir * SIDE_DISTANCE;
    const wantY = p.y - SHOULDER_HEIGHT - p.z * 0.6 + Math.sin(this.time * 2.6) * 7;
    this.vx += ((wantX - this.x) * FOLLOW_STIFFNESS - this.vx * FOLLOW_DAMPING) * dt;
    this.vy += ((wantY - this.y) * FOLLOW_STIFFNESS - this.vy * FOLLOW_DAMPING) * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (p.facingDir !== this.faceDir) {
      this.faceDir = p.facingDir;
      this.scene.tweens.add({ targets: this.facing, scaleX: this.faceDir, duration: 180, ease: 'Back.Out' });
    }
    // lean a little into the flying direction
    this.facing.rotation += (Phaser.Math.Clamp(this.vx / 900, -0.25, 0.25) * this.faceDir - this.facing.rotation) * Math.min(1, dt * 8);

    this.shadow.setPosition(0, (p.y - this.y) / this.scaleY + 6);
    this.setDepth(Math.max(this.y, p.y) + 2);
  }
}
