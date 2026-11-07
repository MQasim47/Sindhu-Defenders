import Phaser from 'phaser';
import { playSfx } from '../fx/sound.js';
import { addText } from '../i18n/i18nText.js';
import { FONT } from '../data/colors.js';
import { settings } from '../data/settings.js';

const MOTE_COUNT = 10;

// Jadugar Hacker: a short, round, funny wizard who sends the monsters.
// Built from separate parts (robe, head, hat, moustache, eyes, hands, crystal ball).
// He stands on a ledge of the wall, near the gate, and reacts to the game:
//   idle      -> the crystal ball floats, his fingers tap, he smirks
//   think()   -> the ball glows and swirls, he rubs his hands, then laughs
//   point()   -> he points at the gate when he sends a monster
//   beaten()  -> he stamps his foot and pulls his hat (funny, not scary)
export default class Jadugar extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.time = 0;
    this.thinking = false;
    this.tapTimer = 0;

    const add = scene.add;
    this.shadow = add.image(0, 3, 'shadow').setScale(1.3).setAlpha(0.5);
    this.robe = add.image(0, 0, 'jadugar-robe').setOrigin(0.5, 1);
    this.handLeft = add.image(-40, -38, 'jadugar-hand').setFlipX(true);
    this.handRight = add.image(40, -38, 'jadugar-hand');
    this.head = add.image(0, -96, 'jadugar-head');
    this.eyeLeft = add.image(-11, -98, 'jadugar-eye');
    this.eyeRight = add.image(11, -98, 'jadugar-eye');
    this.browLeft = add.image(-12, -108, 'jadugar-brow').setAngle(14);
    this.browRight = add.image(12, -108, 'jadugar-brow').setAngle(-14).setFlipX(true);
    this.mouth = add.image(2, -73, 'jadugar-smirk');
    this.moustache = add.image(0, -81, 'jadugar-moustache');
    this.hat = add.image(0, -112, 'jadugar-hat').setOrigin(0.5, 0.9).setAngle(4);

    // crystal ball with a glow
    this.ballGlow = add.image(0, 0, 'fx-glow').setTint(0x8fe0ff).setBlendMode(Phaser.BlendModes.ADD).setScale(1.6).setAlpha(0.35);
    this.ball = add.image(0, 0, 'jadugar-ball').setScale(0.85);
    this.ballHolder = add.container(0, -64, [this.ballGlow, this.ball]);

    // swirl lights that circle the ball while he thinks
    this.motes = [];
    for (let i = 0; i < MOTE_COUNT; i++) {
      this.motes.push(add.image(0, 0, 'fx-mote').setBlendMode(Phaser.BlendModes.ADD).setTint(0xc79bff).setScale(0.9).setVisible(false));
    }
    this.ballHolder.add(this.motes);

    // "thinking..." with dots above the hat
    this.thought = add.container(215, -120).setVisible(false);
    const dotsBg = add.graphics();
    dotsBg.fillStyle(0xfff6dc, 1);
    dotsBg.fillRoundedRect(-92, -26, 184, 52, 24);
    dotsBg.lineStyle(4, 0x3a1c16, 1);
    dotsBg.strokeRoundedRect(-92, -26, 184, 52, 24);
    this.thoughtText = addText(scene, 0, 0, 'jadugar.thinking', { fontFamily: FONT, fontSize: '28px', fontStyle: '600', color: '#3A1C16' }).setOrigin(0.5);
    this.thought.add([dotsBg, this.thoughtText]);

    this.bodyGroup = add.container(0, 0, [this.robe, this.handLeft, this.handRight, this.ballHolder]);
    this.headGroup = add.container(0, 0, [this.head, this.eyeLeft, this.eyeRight, this.browLeft, this.browRight, this.mouth, this.moustache, this.hat]);
    this.add([this.shadow, this.bodyGroup, this.headGroup, this.thought]);
    this.setScale(0.8);
    scene.add.existing(this);

    scene.tweens.add({ targets: this.robe, scaleY: 1.02, scaleX: 0.99, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.scheduleBlink();
  }

  scheduleBlink() {
    this.scene.time.delayedCall(Phaser.Math.Between(1800, 4000), () => {
      if (!this.active) return;
      this.scene.tweens.add({ targets: [this.eyeLeft, this.eyeRight], scaleY: 0.1, duration: 80, yoyo: true, onComplete: () => this.scheduleBlink() });
    });
  }

  // ---------- Things he does ----------

  // Re-planning: the ball glows, lights swirl, he rubs his hands, then he laughs.
  think(ms = 1600) {
    this.thinking = true;
    this.thought.setVisible(true).setScale(0);
    this.scene.tweens.add({ targets: this.thought, scale: 1.2, duration: 300, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: this.ball, scale: 1.15, duration: ms * 0.6, yoyo: true, ease: 'Sine.InOut' });
    this.ballGlow.setAlpha(0.9);
    this.motes.forEach((m) => m.setVisible(!settings.low || m === this.motes[0]));
    playSfx(this.scene, 'sfx-ball-hum');
    // rubbing hands
    this.scene.tweens.add({ targets: this.handLeft, x: -10, y: -46, duration: 140, yoyo: true, repeat: Math.floor(ms / 280), ease: 'Sine.InOut' });
    this.scene.tweens.add({ targets: this.handRight, x: 10, y: -46, duration: 140, yoyo: true, repeat: Math.floor(ms / 280), ease: 'Sine.InOut' });
    this.scene.time.delayedCall(ms, () => {
      this.thinking = false;
      this.thought.setVisible(false);
      this.ballGlow.setAlpha(0.35);
      this.motes.forEach((m) => m.setVisible(false));
      this.handLeft.setPosition(-40, -38);
      this.handRight.setPosition(40, -38);
      this.laugh();
    });
  }

  laugh() {
    this.mouth.setTexture('jadugar-laugh').setPosition(2, -69);
    playSfx(this.scene, 'sfx-jadugar-laugh');
    this.scene.tweens.add({ targets: this.bodyGroup, y: -10, duration: 110, yoyo: true, repeat: 3, ease: 'Sine.Out' });
    this.scene.tweens.add({ targets: this.headGroup, y: -10, angle: 3, duration: 110, yoyo: true, repeat: 3, ease: 'Sine.Out' });
    this.scene.time.delayedCall(950, () => {
      this.mouth.setTexture('jadugar-smirk').setPosition(2, -73);
      this.headGroup.setAngle(0);
    });
  }

  // Points at (x, y) in the world (the gate) when he sends something.
  point(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    const len = Math.hypot(dx, dy) || 1;
    const sx = this.scaleX || 1;
    this.scene.tweens.add({
      targets: this.handRight,
      x: 40 + (dx / len) * 46 / sx,
      y: -52 + (dy / len) * 30 / sx,
      duration: 160,
      yoyo: true,
      hold: 380,
      ease: 'Back.Out',
    });
    this.scene.tweens.add({ targets: this.ball, scale: 1.2, duration: 200, yoyo: true });
    playSfx(this.scene, 'sfx-ball-hum');
  }

  // The player beat his plan: he stamps his foot and pulls his hat.
  beaten() {
    this.scene.tweens.add({ targets: this.bodyGroup, scaleY: 0.9, scaleX: 1.06, duration: 90, yoyo: true, repeat: 3 });
    this.scene.tweens.add({ targets: this.hat, y: -122, angle: 14, duration: 180, yoyo: true, hold: 300, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: [this.browLeft, this.browRight], y: -112, duration: 120, yoyo: true, repeat: 2 });
  }

  // ---------- Update ----------

  update(dt) {
    this.time += dt;
    const t = this.time;
    // the ball floats
    this.ballHolder.y = -64 + Math.sin(t * 2.2) * 5;
    this.ball.rotation = Math.sin(t * 1.3) * 0.12;
    this.ballGlow.setAlpha(this.thinking ? 0.8 + Math.sin(t * 14) * 0.15 : 0.32 + Math.sin(t * 2.2) * 0.08);

    // idle: tap the fingers
    if (!this.thinking) {
      this.tapTimer += dt;
      const tap = Math.max(0, Math.sin(this.tapTimer * 11)) * (Math.sin(this.tapTimer * 1.7) > 0 ? 1 : 0);
      this.handRight.y = -38 - tap * 4;
      this.handLeft.y = -38 + Math.sin(t * 1.4) * 1.2;
    }

    if (this.thinking) {
      this.motes.forEach((m, i) => {
        if (!m.visible) return;
        const a = t * 6 + (i / MOTE_COUNT) * Math.PI * 2;
        const r = 30 + Math.sin(t * 3 + i) * 6;
        m.setPosition(Math.cos(a) * r, Math.sin(a) * r * 0.7).setAlpha(0.6 + Math.sin(t * 9 + i) * 0.3);
      });
    }
    this.setDepth(this.y);
  }
}
