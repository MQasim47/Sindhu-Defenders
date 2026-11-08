import Phaser from 'phaser';
import { addText } from '../i18n/i18nText.js';
import { CSS, FONT } from '../data/colors.js';
import { CODE_PICTURES } from '../objects/bossTextures.js';
import { playSfx } from '../fx/sound.js';

const SPOTS = [
  { x: 300, y: 520 },
  { x: 640, y: 480 },
  { x: 980, y: 520 },
];
const NEAR = 120; // how close Dodo must be to a Mithu to talk to it
const TIME_LIMIT = 28; // seconds before the trick gives up by itself

// One of the three identical Mithus. Same pictures as the real Mithu (src/objects/Mithu.js),
// but it stands still, bobs a little and can talk.
class CloneMithu extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    const add = scene.add;
    this.shadow = add.image(0, 54, 'shadow').setScale(0.7).setAlpha(0.5);
    const tail = add.image(-14, 14, 'mithu-tail').setOrigin(0.5, 0).setAngle(28);
    const wing = add.image(-6, 3, 'mithu-wing').setOrigin(0.15, 0.2);
    const body = add.image(0, 0, 'mithu-body');
    const cheek = add.image(10, -5, 'mithu-cheek');
    const eye = add.image(8, -13, 'mithu-eye');
    const beak = add.image(21, -8, 'mithu-beak').setOrigin(0.1, 0.5);
    this.bird = add.container(0, 0, [tail, body, cheek, eye, beak, wing]).setScale(1.7);
    scene.tweens.add({ targets: wing, angle: { from: -40, to: 20 }, duration: 160, yoyo: true, repeat: -1 });

    // the line they all say
    this.talk = add.container(0, -95);
    const bg = add.graphics();
    bg.fillStyle(0xfff6dc, 1);
    bg.fillRoundedRect(-120, -34, 240, 66, 18);
    bg.lineStyle(4, 0x3a1c16, 1);
    bg.strokeRoundedRect(-120, -34, 240, 66, 18);
    const line = addText(scene, 0, -1, 'boss.fakeLine', { fontFamily: FONT, fontSize: '20px', fontStyle: '600', color: CSS.ink, align: 'center', wordWrap: { width: 220 } }).setOrigin(0.5);
    this.talk.add([bg, line]);

    // the answer: a picture bubble (the code word)
    this.answer = add.container(0, -105).setVisible(false);
    const abg = add.graphics();
    abg.fillStyle(0xfff6dc, 1);
    abg.fillRoundedRect(-52, -52, 104, 104, 22);
    abg.lineStyle(4, 0x3a1c16, 1);
    abg.strokeRoundedRect(-52, -52, 104, 104, 22);
    this.picture = add.image(0, 0, 'boss-pic-mango').setScale(0.72);
    this.answer.add([abg, this.picture]);

    this.add([this.shadow, this.bird, this.talk, this.answer]);
    this.setVisible(false);
    scene.add.existing(this);
    this.real = false;
    this.asked = false;
    this.time = 0;
  }
}

// The Deepfake Chaal (Round 3). The Jadugar vanishes and three identical Mithus appear:
// "Dodo, quick! Give me the gate key!". Dodo walks to one and presses E to ask the code word.
// Only the REAL Mithu shows the picture the player chose. Press E again to give the key.
export default class Deepfake {
  constructor(boss) {
    this.boss = boss;
    this.active = false;
    this.clones = [0, 1, 2].map(() => new CloneMithu(boss));
    this.near = null;
    this.time = 0;
  }

  start() {
    const boss = this.boss;
    this.active = true;
    this.time = 0;
    const realIndex = Phaser.Math.Between(0, 2);
    this.clones.forEach((c, i) => {
      const spot = SPOTS[i];
      c.real = i === realIndex;
      c.asked = false;
      c.baseY = spot.y;
      c.setPosition(spot.x, spot.y).setVisible(true).setScale(0).setDepth(spot.y);
      c.answer.setVisible(false);
      c.talk.setVisible(true);
      boss.tweens.add({ targets: c, scale: 1, duration: 420, delay: i * 140, ease: 'Back.Out' });
      boss.time.delayedCall(i * 140, () => boss.swirl(spot.x, spot.y - 40));
    });
    playSfx(boss, 'sfx-deepfake');
    boss.say('mithu.boss.deepfake');
  }

  // the Mithu Dodo can talk to now (or null)
  findNear() {
    const p = this.boss.player;
    let best = null;
    let bestD = NEAR;
    this.clones.forEach((c) => {
      const d = Phaser.Math.Distance.Between(p.x, p.y, c.x, c.y);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    });
    return best;
  }

  update(dt) {
    if (!this.active) return;
    this.time += dt;
    this.clones.forEach((c, i) => {
      c.time += dt;
      c.bird.y = Math.sin(c.time * 3 + i) * 6 - 20;
      c.shadow.y = 56;
    });
    this.near = this.findNear();
    if (this.time > TIME_LIMIT) this.finish(null);
  }

  // what the E prompt should say: 'prompt.askCode', 'prompt.giveKey' or null
  prompt() {
    if (!this.active || !this.near) return null;
    return this.near.asked ? 'prompt.giveKey' : 'prompt.askCode';
  }

  // E was pressed
  interact() {
    const c = this.near;
    if (!this.active || !c) return;
    const boss = this.boss;
    if (!c.asked) {
      c.asked = true;
      c.talk.setVisible(false);
      // the real Mithu shows the chosen picture, a fake shows another one
      const others = CODE_PICTURES.filter((n) => n !== boss.codeWord);
      c.picture.setTexture(`boss-pic-${c.real ? boss.codeWord : Phaser.Utils.Array.GetRandom(others)}`);
      c.answer.setVisible(true).setScale(0);
      boss.tweens.add({ targets: c.answer, scale: 1, duration: 300, ease: 'Back.Out' });
      playSfx(boss, 'sfx-codeword-lock');
      boss.sayOnce('codeAsked', 'mithu.boss.asked');
    } else {
      this.finish(c.real);
    }
  }

  // result: true = Dodo gave the key to the real Mithu, false = to a fake, null = time ran out
  finish(result) {
    if (!this.active) return;
    this.active = false;
    const boss = this.boss;
    this.clones.forEach((c) => {
      // the fakes melt; the real Mithu just flies back to Dodo
      const melt = !c.real;
      boss.tweens.add({
        targets: c,
        scaleY: melt ? 0 : 1,
        scaleX: melt ? 1.3 : 1,
        alpha: 0,
        duration: 520,
        ease: 'Cubic.In',
        onComplete: () => c.setVisible(false).setAlpha(1).setScale(1),
      });
      if (melt) boss.fx.smoke(c.x, c.y);
      else boss.fx.sparkle(c.x, c.y - 30);
    });
    boss.deepfakeDone(result);
  }

  clear() {
    this.active = false;
    this.clones.forEach((c) => c.setVisible(false).setAlpha(1).setScale(1));
  }
}
