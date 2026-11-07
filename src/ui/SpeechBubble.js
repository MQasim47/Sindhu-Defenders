import Phaser from 'phaser';
import { CSS, FONT } from '../data/colors.js';
import { settings } from '../data/settings.js';
import { styleFor, prepare, isRtl } from '../i18n/index.js';

const WIDTH = 440;
const TYPE_DELAY = 28; // ms per letter

// Mithu's speech bubble: rounded, with a tail that points at him. It pops in,
// types the text out letter by letter, and hides by itself.
// It lives in screen space (scroll factor 0) and is moved each frame by follow().
export default class SpeechBubble extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    this.setScrollFactor(0).setDepth(99500).setVisible(false);
    this.queue = [];
    this.busy = false;
    this.tailX = 0;

    this.bg = scene.add.graphics();
    this.baseStyle = {
      fontFamily: FONT,
      fontSize: '26px',
      fontStyle: '500',
      color: CSS.ink,
      wordWrap: { width: WIDTH - 40 },
      lineSpacing: 4,
      align: 'left',
      resolution: 2,
    };
    this.text = scene.add.text(0, 0, '', this.baseStyle);
    this.add([this.bg, this.text]);
    scene.add.existing(this);
  }

  // Add a line. Lines wait in a queue so they never cut each other off.
  say(line) {
    if (this.queue.includes(line) || line === this.current) return;
    this.queue.push(line);
    if (!this.busy) this.next();
  }

  next() {
    const line = this.queue.shift();
    if (!line) {
      this.busy = false;
      return;
    }
    this.busy = true;
    this.current = line;

    // measure the full text first so the bubble has its final size from the start
    // (the language can have changed since the last line, so the style is set again)
    this.text.setStyle(styleFor(this.baseStyle));
    this.text.setWordWrapWidth(isRtl() ? null : WIDTH - 40);
    const full = prepare(line, this.baseStyle);
    this.text.setText(full);
    const w = Math.min(WIDTH, this.text.width + 40);
    const h = this.text.height + 30;
    this.text.setPosition(-w / 2 + 20, -h - 26 + 15);
    this.drawBubble(w, h);
    this.text.setText('');

    this.setVisible(true).setScale(0).setAlpha(1);
    this.scene.tweens.add({ targets: this, scale: 1, duration: settings.reduced ? 1 : 260, ease: 'Back.Out' });

    let n = 0;
    this.typer = this.scene.time.addEvent({
      delay: TYPE_DELAY,
      repeat: full.length - 1,
      callback: () => {
        n++;
        this.text.setText(full.slice(0, n));
        if (n >= full.length) this.hideLater(1400 + full.length * 38);
      },
    });
  }

  hideLater(ms) {
    this.scene.time.delayedCall(ms, () => {
      this.scene.tweens.add({
        targets: this,
        scale: 0.6,
        alpha: 0,
        duration: 180,
        ease: 'Cubic.In',
        onComplete: () => {
          this.setVisible(false);
          this.current = null;
          this.next();
        },
      });
    });
  }

  // Bubble above the origin (0,0) = the tip of the tail.
  drawBubble(w, h) {
    const g = this.bg;
    g.clear();
    const x = -w / 2;
    const y = -h - 26;
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(x + 3, y + 6, w, h, 20);
    g.fillStyle(0x3a1c16, 1);
    g.fillRoundedRect(x - 3, y - 3, w + 6, h + 6, 22);
    g.fillTriangle(-16, y + h - 2, 16, y + h - 2, 0, 2);
    g.fillStyle(0xfff6dc, 1);
    g.fillRoundedRect(x, y, w, h, 19);
    g.fillTriangle(-12, y + h - 2, 12, y + h - 2, 0, -4);
    g.fillStyle(0xffffff, 0.5);
    g.fillRoundedRect(x + 10, y + 6, w - 20, 8, 4);
  }

  // Put the tail tip at (sx, sy) on the screen, kept inside the screen.
  follow(sx, sy) {
    const half = WIDTH / 2 + 10;
    const x = Phaser.Math.Clamp(sx, half, 1280 - half);
    this.setPosition(x, Phaser.Math.Clamp(sy, 292, 700));
  }
}
