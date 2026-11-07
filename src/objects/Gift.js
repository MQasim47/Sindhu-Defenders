import Phaser from 'phaser';
import { SCAN_TIME } from './Villager.js';
import { pushOut } from '../systems/collision.js';
import { playSfx } from '../fx/sound.js';

const SLIDE_SPEED = 26; // the gift slowly slides towards Dodo (temptation!)
const TOUCH_DISTANCE = 34;
const SAFE_HEIGHT = 28; // jumping over a gift does not open it
const LIFE = 16; // seconds before an ignored gift fizzles away

// A shiny "FREE" gift that the Trojan Ghoda drops. It looks like a reward, but it is a trap:
//   touch it       -> it opens and a swarm of bugs comes out
//   lantern 0.6 s  -> the wrapping turns see-through (the bugs are inside) and it pops harmlessly: +coins
//   ignore it      -> after a while it fizzles away
// It has the same "scan" properties as a villager, so the Lantern can check it too.
export default class Gift extends Phaser.GameObjects.Container {
  constructor(scene, world, system) {
    super(scene, 0, 0);
    this.world = world;
    this.system = system;
    this.impostor = true; // (for the Lantern: something that can be revealed)
    this.revealed = false;
    this.verified = false;
    this.canGreet = false;
    this.lit = 0;
    this.state = 'off';
    this.time = 0;

    this.shadow = scene.add.image(0, 2, 'shadow').setScale(0.55);
    this.box = scene.add.image(0, -4, 'gift-box').setOrigin(0.5, 1);
    this.glint = scene.add.image(8, -48, 'fx-glint').setScale(0).setBlendMode(Phaser.BlendModes.ADD);
    this.add([this.shadow, this.box, this.glint]);
    scene.add.existing(this);
    this.setActive(false).setVisible(false);
  }

  get scannable() {
    return this.active && this.state === 'idle';
  }

  get topPoint() {
    return { x: this.x, y: this.y - 74 };
  }

  // The gift falls out of the horse's belly at (x, y) and hops to (tx, ty).
  activate(x, y, tx, ty, delay) {
    this.setPosition(x, y).setActive(true).setVisible(false).setAlpha(1).setScale(1);
    this.box.setTexture('gift-box').setY(-4);
    this.state = 'drop';
    this.revealed = false;
    this.lit = 0;
    this.life = LIFE;
    this.sparkleTimer = 0.4;
    const from = { x, y };
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 650,
      delay,
      ease: 'Sine.Out',
      onStart: () => this.setVisible(true),
      onUpdate: (tween) => {
        const p = tween.getValue();
        this.x = from.x + (tx - from.x) * p;
        this.y = from.y + (ty - from.y) * p;
        this.box.y = -4 - Math.sin(p * Math.PI) * 70;
        this.shadow.setScale(0.55 * (1 - Math.sin(p * Math.PI) * 0.3));
      },
      onComplete: () => {
        this.state = 'idle';
        this.box.y = -4;
        this.scene.tweens.add({ targets: this.box, scaleY: 0.85, scaleX: 1.12, duration: 90, yoyo: true });
        playSfx(this.scene, 'sfx-gift-sparkle');
      },
    });
  }

  deactivate() {
    this.state = 'off';
    this.setActive(false).setVisible(false);
    this.scene.tweens.killTweensOf([this, this.box]);
  }

  // ----- the Lantern -----

  shine(dt) {
    if (this.state !== 'idle') return;
    this.lit += dt;
    if (this.lit >= SCAN_TIME) this.reveal();
  }

  cool(dt) {
    if (this.lit > 0) this.lit = Math.max(0, this.lit - dt * 1.5);
  }

  // The wrapping turns see-through: bugs inside! Then it pops harmlessly.
  reveal() {
    this.state = 'ghost';
    this.revealed = true;
    this.box.setTexture('gift-ghost');
    this.scene.tweens.add({ targets: this.box, angle: { from: -6, to: 6 }, duration: 70, yoyo: true, repeat: 7 });
    playSfx(this.scene, 'sfx-reveal');
    this.scene.time.delayedCall(850, () => {
      if (this.state !== 'ghost') return;
      this.scene.smoke(this.x, this.y - 30);
      this.deactivate();
      this.scene.events.emit('gift-revealed', this);
    });
  }

  // Touched: it opens and the bugs come out.
  open() {
    if (this.state !== 'idle') return;
    const { x, y } = this;
    this.deactivate();
    this.scene.smoke(x, y - 30);
    this.scene.impact(60, 0.003);
    playSfx(this.scene, 'sfx-gift-open');
    this.system.releaseBugs(x, y - 20, Phaser.Math.Between(6, 8));
    this.scene.events.emit('gift-opened', this);
  }

  update(dt) {
    if (!this.active) return;
    this.time += dt;
    const p = this.scene.player;

    if (this.state === 'idle') {
      this.life -= dt;
      // hover and sparkle
      this.box.y = -4 + Math.sin(this.time * 3 + this.x) * 2.5;
      this.sparkleTimer -= dt;
      if (this.sparkleTimer <= 0) {
        this.sparkleTimer = Phaser.Math.FloatBetween(0.7, 1.4);
        this.glint.setPosition(Phaser.Math.Between(-16, 16), Phaser.Math.Between(-52, -16)).setAngle(0);
        this.scene.tweens.add({ targets: this.glint, scale: { from: 0, to: 1.1 }, angle: 70, duration: 280, yoyo: true });
      }
      // slide towards Dodo
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > TOUCH_DISTANCE) {
        this.x += (dx / d) * SLIDE_SPEED * dt;
        this.y += (dy / d) * SLIDE_SPEED * dt;
        pushOut(this, this.world.colliders, 10, 6);
      }
      if (d < TOUCH_DISTANCE && p.z < SAFE_HEIGHT) this.open();
      if (this.life <= 0 && this.state === 'idle') this.fizzle();
    }
    this.setDepth(this.y);
  }

  // nobody opened it: it fades away (good!)
  fizzle() {
    this.state = 'ghost';
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.deactivate();
        this.scene.events.emit('gift-ignored', this);
      },
    });
  }
}
