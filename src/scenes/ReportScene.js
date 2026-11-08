import Phaser from 'phaser';
import Button from '../ui/Button.js';
import HackerBrain from '../ai/HackerBrain.js';
import { loadRun } from '../ai/runMemory.js';
import { LEVEL_ORDER } from '../data/levels.js';
import { getStars, progress } from '../data/progress.js';
import { COLORS, CSS, FONT } from '../data/colors.js';
import { addText } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';
import { playSfx } from '../fx/sound.js';

const NAME_KEY = 'sindhu-defenders-player-name';

function savedName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch (e) {
    return '';
  }
}

// The "Cyber Rakshak" certificate after the boss: the player types a name, and the card shows
// the total stars, the 5 lessons, the final AI report (also what the boss learned in the fight)
// and the Humans vs AI score.
export default class ReportScene extends Phaser.Scene {
  constructor() {
    super('Report');
  }

  create() {
    this.cameras.main.fadeIn(600, 11, 13, 26);
    this.leaving = false;
    this.add.rectangle(640, 360, 1280, 720, COLORS.dark);
    this.add.tileSprite(640, 360, 1280, 720, 'ajrak-tile').setAlpha(0.08);
    this.add.image(640, 360, 'fx-glow').setScale(14, 8).setTint(0x2b3580).setAlpha(0.45);

    this.run = loadRun();
    this.drawCard();
    this.buildName();
    this.buildStars();
    this.buildLessons();
    this.buildReport();
    this.buildButtons();
    playSfx(this, 'sfx-win');
  }

  drawCard() {
    const w = 1160;
    const h = 664;
    const x = 640 - w / 2;
    const y = 28;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(x, y + 10, w, h, 34);
    g.fillStyle(0x5a0f1d, 1);
    g.fillRoundedRect(x - 6, y - 6, w + 12, h + 12, 38);
    g.fillStyle(COLORS.gold, 1);
    g.fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 35);
    g.fillStyle(COLORS.cream, 1);
    g.fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 32);
    g.fillStyle(COLORS.indigo, 1);
    g.fillRoundedRect(x + 4, y + 4, w - 8, 110, { tl: 32, tr: 32, bl: 0, br: 0 });
    g.fillStyle(COLORS.red, 1);
    g.fillRect(x + 4, y + 108, w - 8, 8);
    // the two boxes
    g.fillStyle(0xe9dcc0, 1);
    g.fillRoundedRect(x + 36, y + 292, 520, 270, 20);
    g.fillRoundedRect(x + 596, y + 292, 528, 270, 20);
    g.lineStyle(3, COLORS.red, 0.6);
    g.strokeRoundedRect(x + 36, y + 292, 520, 270, 20);
    g.strokeRoundedRect(x + 596, y + 292, 528, 270, 20);

    addText(this, 640, 66, 'cert.title', { fontFamily: FONT, fontSize: '62px', fontStyle: '700', color: CSS.cream, stroke: '#10143a', strokeThickness: 9 }).setOrigin(0.5);
    addText(this, 640, 116, 'cert.sub', { fontFamily: FONT, fontSize: '26px', fontStyle: '600', color: CSS.gold }).setOrigin(0.5);
    addText(this, 640, 172, 'cert.given', { fontFamily: FONT, fontSize: '26px', fontStyle: '600', color: CSS.ink }).setOrigin(0.5);
  }

  // the player's name: a real HTML text box (so typing works like on a web page)
  buildName() {
    const style = `width:560px;height:60px;font:700 38px Fredoka, sans-serif;text-align:center;background:transparent;border:none;border-bottom:4px solid #8E1B2B;color:#8E1B2B;outline:none;`;
    const input = this.add.dom(640, 226, 'input', style);
    const node = input.node;
    node.type = 'text';
    node.maxLength = 22;
    node.value = savedName();
    node.placeholder = t('cert.placeholder');
    node.autocomplete = 'off';
    // the game listens to the keyboard on the whole window: typed keys must not reach it
    node.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') node.blur();
    });
    node.addEventListener('keyup', (e) => e.stopPropagation());
    node.addEventListener('input', () => {
      try {
        localStorage.setItem(NAME_KEY, node.value);
      } catch (e) {
        // not saved: fine
      }
    });
    this.nameInput = input;
    this.time.delayedCall(700, () => node.focus());
  }

  buildStars() {
    const total = LEVEL_ORDER.reduce((sum, id) => sum + getStars(id), 0);
    for (let i = 0; i < 3; i++) {
      const filled = i < getStars('miri');
      const star = this.add.image(560 + i * 60, 296, filled ? 'ui-star' : 'ui-star-off').setScale(0);
      this.tweens.add({ targets: star, scale: 0.7, angle: { from: -20, to: 0 }, duration: 420, delay: 500 + i * 250, ease: 'Back.Out' });
    }
    addText(this, 720, 296, 'cert.stars', { fontFamily: FONT, fontSize: '34px', fontStyle: '700', color: CSS.red }, { n: total }).setOrigin(0, 0.5);
  }

  buildLessons() {
    addText(this, 400, 345, 'cert.lessons', { fontFamily: FONT, fontSize: '30px', fontStyle: '700', color: CSS.red }).setOrigin(0.5);
    for (let i = 1; i <= 5; i++) {
      const y = 392 + (i - 1) * 46;
      this.add.image(124, y, 'ui-star').setScale(0.38);
      addText(this, 150, y, `cert.lesson${i}`, { fontFamily: FONT, fontSize: '23px', fontStyle: '600', color: CSS.indigo, wordWrap: { width: 450 } }).setOrigin(0, 0.5);
    }
  }

  // the final AI report: biggest weakness + tip (from all the levels), what the boss learned, and the score
  buildReport() {
    const brain = new HackerBrain();
    brain.loadStats(this.run.stats);
    const weak = brain.biggestWeakness();
    const boss = this.run.boss;
    const x = 680;
    addText(this, 880, 345, 'cert.ai', { fontFamily: FONT, fontSize: '30px', fontStyle: '700', color: CSS.red }).setOrigin(0.5);
    const line = { fontFamily: FONT, fontSize: '22px', fontStyle: '600', color: CSS.indigo, wordWrap: { width: 470 } };
    addText(this, x, 392, weak ? () => t('results.weakness', { name: t(`brain.names.${weak}`) }) : 'results.noWeakness', line).setOrigin(0, 0.5);
    if (weak) addText(this, x, 440, () => t(`results.tip.${weak}`), { ...line, fontStyle: '500', color: '#4A3A30', fontSize: '20px' }).setOrigin(0, 0.5);
    const bossLine = boss && boss.top ? () => t('cert.aiBoss', { name: t(`boss.attack.${boss.top}`), n: boss.hits, m: boss.total }) : 'cert.aiBossNone';
    addText(this, x, 506, bossLine, line).setOrigin(0, 0.5);
    addText(this, x, 570, () => t('results.tally', { h: progress.tally.human, a: progress.tally.ai }), { ...line, fontStyle: '700', color: '#2E8B57', fontSize: '25px' }).setOrigin(0, 0.5);
  }

  buildButtons() {
    new Button(this, 440, 650, 'cert.again', () => this.leave('WorldMap'), { width: 300, height: 64, fontSize: 30, pulse: true });
    new Button(this, 840, 650, 'cert.menu', () => this.leave('Menu'), { width: 240, height: 64, fontSize: 30, style: 'indigo' });
  }

  leave(sceneKey) {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(500, 11, 13, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneKey));
  }
}
