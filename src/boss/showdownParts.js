import Phaser from 'phaser';
import { addText } from '../i18n/i18nText.js';
import { CSS, FONT } from '../data/colors.js';
import { BOSS_ATTACKS } from '../ai/BossBrain.js';

// Pictures and flying attacks of the Face-to-Face Showdown (Level 3).

// the four defence buttons (also keys 1-4)
export const DEFENCES = [
  { n: 1, icon: 'prop-lantern', label: 'boss.def.lantern', sfx: 'sfx-defend-lantern' },
  { n: 2, icon: 'boss-shield', label: 'boss.def.password', sfx: 'sfx-defend-shield' },
  { n: 3, icon: 'backup-scroll', label: 'boss.def.backup', sfx: 'sfx-defend-scroll' },
  { n: 4, icon: 'icon-lock', label: 'boss.def.code', sfx: 'sfx-defend-code' },
];

const TEXTURE = { phishing: 'boss-letter', trojan: 'gift-box', hammer: 'hathoda-hammer', ransom: 'chain-lock' };
const PICTURE_SIZE = 150; // the biggest side of an attack picture (pixels)

// scale an image so that its biggest side is "size" pixels
export function fit(image, size) {
  const frame = image.frame;
  image.setScale(size / Math.max(frame.width, frame.height));
  return image;
}

// a Mithu bird made of the Mithu parts (used by the fake Mithu attack and by the finale)
export function makeMithuBird(scene) {
  const add = scene.add;
  const tail = add.image(-14, 14, 'mithu-tail').setOrigin(0.5, 0).setAngle(28);
  const wing = add.image(-6, 3, 'mithu-wing').setOrigin(0.15, 0.2);
  const body = add.image(0, 0, 'mithu-body');
  const cheek = add.image(10, -5, 'mithu-cheek');
  const eye = add.image(8, -13, 'mithu-eye');
  const beak = add.image(21, -8, 'mithu-beak').setOrigin(0.1, 0.5);
  scene.tweens.add({ targets: wing, angle: { from: -40, to: 20 }, duration: 170, yoyo: true, repeat: -1 });
  return add.container(0, 0, [tail, body, cheek, eye, beak, wing]);
}

// ---------------------------------------------------------------------------------------------
// One attack in the air: a big picture with a timer ring around it. Pooled: made once, reused.
//   state: 'idle' | 'flying' | 'defending' | 'returning'
// ---------------------------------------------------------------------------------------------
export class FlyingAttack extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    this.ring = scene.add.graphics();
    this.pictures = {};
    Object.entries(TEXTURE).forEach(([id, key]) => {
      this.pictures[id] = fit(scene.add.image(0, 0, key), PICTURE_SIZE).setVisible(false);
    });
    this.pictures.deepfake = this.makeDeepfake(scene);
    this.add([this.ring, ...Object.values(this.pictures)]);
    this.setVisible(false).setDepth(800);
    scene.add.existing(this);
    this.state = 'idle';
    this.id = null;
    this.def = 0;
  }

  // the Mithu-voice bubble: a small Mithu and "Dodo, quick! Give me the gate key!"
  makeDeepfake(scene) {
    const bg = scene.add.graphics();
    bg.fillStyle(0xfff6dc, 1);
    bg.fillRoundedRect(-150, -62, 300, 112, 22);
    bg.lineStyle(5, 0x3a1c16, 1);
    bg.strokeRoundedRect(-150, -62, 300, 112, 22);
    bg.fillStyle(0xfff6dc, 1);
    bg.fillTriangle(-30, 48, 10, 48, -48, 82);
    bg.lineStyle(5, 0x3a1c16, 1);
    bg.beginPath();
    bg.moveTo(-30, 50);
    bg.lineTo(-48, 82);
    bg.lineTo(10, 50);
    bg.strokePath();
    const text = addText(scene, 28, -6, 'boss.fakeLine', { fontFamily: FONT, fontSize: '23px', fontStyle: '700', color: CSS.ink, align: 'center', wordWrap: { width: 190 } }).setOrigin(0.5);
    const bird = makeMithuBird(scene).setPosition(-100, -6).setScale(1.2);
    const group = scene.add.container(0, 0, [bg, text, bird]).setVisible(false);
    group.fakeBird = bird;
    return group;
  }

  // start flying. from / to = { x, y }, seconds = how long Dodo has to answer
  launch(id, from, to, seconds) {
    this.id = id;
    this.def = BOSS_ATTACKS[id];
    this.from = { ...from };
    this.to = { ...to };
    this.duration = seconds;
    this.t = 0;
    this.state = 'flying';
    this.revealed = false;
    Object.entries(this.pictures).forEach(([key, pic]) => {
      pic.setVisible(key === id);
      if (pic.setTint) pic.clearTint();
    });
    this.ringRadius = id === 'deepfake' ? 170 : 104;
    this.setVisible(true).setAlpha(1).setAngle(0).setScale(0.5).setPosition(from.x, from.y);
  }

  // seconds left to answer
  get remaining() {
    return Math.max(0, this.duration - this.t);
  }

  // moves along the arc and redraws the ring. Returns true when it arrives.
  step(dt, big = 1) {
    this.t += dt;
    const p = Math.min(1, this.t / this.duration);
    const x = this.from.x + (this.to.x - this.from.x) * p;
    const y = this.from.y + (this.to.y - this.from.y) * p - Math.sin(p * Math.PI) * 120;
    this.setPosition(x, y);
    this.setScale((0.55 + 0.5 * p) * big);
    if (this.id === 'hammer') this.setAngle(p * 540);
    else if (this.id !== 'deepfake') this.setAngle(Math.sin(p * 14) * 10);
    this.drawRing(1 - p);
    return p >= 1;
  }

  // the timer ring: full = lots of time (green), nearly empty = hurry (red)
  drawRing(left) {
    const g = this.ring;
    g.clear();
    const r = this.ringRadius;
    const color = left > 0.5 ? 0x4cd16a : left > 0.25 ? 0xffc83a : 0xff4a3a;
    g.lineStyle(10, 0x140a10, 0.55);
    g.strokeCircle(0, 0, r);
    g.lineStyle(8, color, 1);
    g.beginPath();
    g.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left, false);
    g.strokePath();
  }

  hideRing() {
    this.ring.clear();
  }

  free() {
    this.state = 'idle';
    this.setVisible(false);
  }
}
