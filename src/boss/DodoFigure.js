import Player from '../objects/Player.js';
import { settings } from '../data/settings.js';

// A big Dodo for the showdown (he stands on the left, face to face with the Jadugar).
// Uses the real painted Dodo (texture "dodo-full"); if it is missing, the drawn Dodo is used, big.
// Animations (all tweens): idle breathing, defend (a lunge), hit (shake + red flash), celebrate (hops), slump.
export default class DodoFigure {
  constructor(scene, x, feetY, height = 400) {
    this.scene = scene;
    this.x = x;
    this.feetY = feetY;
    this.time = 0;
    this.busy = false; // an action animation is playing
    this.real = scene.textures.exists('dodo-full');
    this.shadow = scene.add.image(x, feetY + 4, 'shadow').setScale(5, 2.2).setAlpha(0.7).setDepth(feetY - 1);
    if (this.real) {
      const tex = scene.textures.get('dodo-full').getSourceImage();
      this.base = height / tex.height;
      // the painted Dodo looks to the left, he must look to the right (at the Jadugar)
      this.node = scene.add.image(x, feetY, 'dodo-full').setOrigin(0.5, 1).setScale(this.base).setFlipX(true);
    } else {
      this.base = 3.1;
      const bounds = { minY: 0, maxY: 2000, minXAt: () => 0, maxXAt: () => 1280 };
      this.node = new Player(scene, x, feetY, bounds, { colliders: [] }, null);
      this.node.inputLocked = true;
      this.node.setScale(this.base);
    }
    this.node.setDepth(feetY);
  }

  // called every frame
  update(dt) {
    this.time += dt;
    if (!this.real) {
      this.node.update(this.scene.time.now, dt * 1000); // the drawn Dodo animates himself
      return;
    }
    if (this.busy) return;
    if (this.real) {
      const b = Math.sin(this.time * 2.4) * 0.012;
      this.node.setScale(this.base * (1 - b * 0.5), this.base * (1 + b));
    }
  }

  // run an animation without the breathing fighting it
  play(config) {
    if (settings.reduced && config.skipIfReduced) return;
    this.busy = true;
    const target = this.node;
    this.scene.tweens.killTweensOf(target);
    this.scene.tweens.add({
      targets: target,
      ...config.tween,
      onComplete: () => {
        target.setPosition(this.x, this.feetY).setAngle(0);
        target.setScale(this.base);
        if (this.real) target.setFlipX(true);
        target.clearTint && target.clearTint();
        this.busy = false;
        if (config.after) config.after();
      },
    });
  }

  // Dodo lunges forward and back when he defends
  defend() {
    this.play({ tween: { x: this.x + 36, scaleX: this.base * 1.05, scaleY: this.base * 0.96, duration: 120, yoyo: true, ease: 'Back.Out' } });
  }

  // the attack hit him: a shake, a red flash, a squash
  hit() {
    if (this.real) {
      this.node.setTint(0xff6a6a);
    }
    this.play({ tween: { x: this.x - 34, angle: -5, scaleX: this.base * 1.1, scaleY: this.base * 0.9, duration: 130, yoyo: true, ease: 'Sine.Out' } });
  }

  // the win: happy hops
  celebrate() {
    this.play({ tween: { y: this.feetY - 70, scaleY: this.base * 1.06, scaleX: this.base * 0.96, duration: 260, yoyo: true, repeat: 5, ease: 'Sine.Out' } });
  }

  // all hearts gone: he sinks a little
  slump() {
    this.busy = true;
    this.scene.tweens.add({ targets: this.node, scaleY: this.base * 0.9, angle: -3, duration: 400, ease: 'Sine.Out' });
  }

  get hand() {
    // where the lantern light starts (about the height of his raised hand)
    return { x: this.x + 100, y: this.feetY - 230 };
  }

  get chest() {
    return { x: this.x + 40, y: this.feetY - 210 };
  }
}

