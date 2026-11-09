import { fit } from '../boss/showdownParts.js';
import { ensureLateTextures } from '../objects/placeholderTextures.js';
import { addText } from '../i18n/i18nText.js';
import { COLORS, CSS, FONT } from '../data/colors.js';
import { progress } from '../data/progress.js';
import { t } from '../i18n/index.js';

const SLIDE_SECONDS = 6;
// the slides: level name key, monsters (textures), lesson key
const SLIDES = [
  { id: 'sann', number: '1', pictures: ['npc-chacha-head', 'behroopia-blob', 'trojan-horse', 'gift-box'] },
  { id: 'amri', number: '2', pictures: ['hathoda-body', 'taala-ghost', 'building-kutubkhana', 'backup-scroll'] },
  { id: 'miri', number: '3', pictures: ['jadugar-head', 'boss-letter', 'hathoda-hammer', 'chain-lock'] },
];

// Attract mode: after 60 seconds without anyone touching the title screen, a looping showcase of the
// 3 levels (with their monsters and lessons) and "Can you beat our AI Hacker?". Any key or click ends it.
// It only uses pictures that are always loaded, so it never needs to load anything.
export default class AttractMode {
  constructor(scene, onExit) {
    ensureLateTextures(scene); // the monster pictures
    this.scene = scene;
    this.onExit = onExit;
    this.index = -1;
    this.timer = 0;
    this.active = true;
    this.items = [];
    const depth = 900;
    this.root = scene.add.container(0, 0).setDepth(depth);
    const bg = scene.add.rectangle(640, 360, 1280, 720, COLORS.dark, 0.93).setInteractive();
    const pattern = scene.add.tileSprite(640, 360, 1280, 720, 'ajrak-tile').setAlpha(0.1);
    scene.tweens.add({ targets: pattern, tilePositionX: 128, tilePositionY: 128, duration: 9000, repeat: -1 });
    this.content = scene.add.container(0, 0);
    this.tap = addText(scene, 640, 680, 'attract.tap', { fontFamily: FONT, fontSize: '28px', fontStyle: '700', color: CSS.gold, stroke: '#10143a', strokeThickness: 6 }).setOrigin(0.5);
    scene.tweens.add({ targets: this.tap, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });
    this.root.add([bg, pattern, this.content, this.tap]);

    this.exit = () => this.stop();
    bg.on('pointerdown', this.exit);
    scene.input.keyboard.once('keydown', this.exit);
    this.next();
  }

  next() {
    this.index = (this.index + 1) % (SLIDES.length + 1);
    this.timer = 0;
    this.content.removeAll(true);
    const s = this.scene;
    const c = this.content;
    if (this.index < SLIDES.length) {
      const slide = SLIDES[this.index];
      const medal = s.add.graphics();
      medal.fillStyle(0x3a1c16, 1);
      medal.fillCircle(640, 130, 62);
      medal.fillStyle(COLORS.red, 1);
      medal.fillCircle(640, 130, 54);
      medal.lineStyle(5, COLORS.gold, 1);
      medal.strokeCircle(640, 130, 54);
      c.add(medal);
      c.add(s.add.text(640, 128, slide.number, { fontFamily: FONT, fontSize: '66px', fontStyle: '700', color: CSS.cream, resolution: 2 }).setOrigin(0.5));
      c.add(addText(s, 640, 235, `level.${slide.id}`, { fontFamily: FONT, fontSize: '66px', fontStyle: '700', color: CSS.cream, stroke: '#8E1B2B', strokeThickness: 12 }).setOrigin(0.5));
      slide.pictures.forEach((tex, i) => {
        const img = fit(s.add.image((i - (slide.pictures.length - 1) / 2) * 210 + 640, 410, tex), 150);
        c.add(img);
        s.tweens.add({ targets: img, y: img.y - 14, duration: 700 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      });
      c.add(addText(s, 640, 530, `map.${slide.id}.monsters`, { fontFamily: FONT, fontSize: '34px', fontStyle: '700', color: CSS.gold, stroke: '#10143a', strokeThickness: 7 }).setOrigin(0.5));
      c.add(addText(s, 640, 600, `map.${slide.id}.lesson`, { fontFamily: FONT, fontSize: '34px', fontStyle: '600', color: CSS.cream, stroke: '#10143a', strokeThickness: 6, align: 'center', wordWrap: { width: 1000 } }).setOrigin(0.5));
    } else {
      c.add(addText(s, 640, 190, 'attract.title', { fontFamily: FONT, fontSize: '74px', fontStyle: '700', color: CSS.cream, stroke: '#8E1B2B', strokeThickness: 14, align: 'center', wordWrap: { width: 1100 } }).setOrigin(0.5));
      c.add(fit(s.add.image(640, 400, 'jadugar-head'), 190));
      c.add(addText(s, 640, 560, () => t('results.tally', { h: progress.tally.human, a: progress.tally.ai }), { fontFamily: FONT, fontSize: '46px', fontStyle: '700', color: '#7CFC9A', stroke: '#10143a', strokeThickness: 8 }).setOrigin(0.5));
    }
    this.content.setAlpha(0);
    s.tweens.add({ targets: this.content, alpha: 1, duration: 450 });
  }

  update(dt) {
    if (!this.active) return;
    this.timer += dt;
    if (this.timer >= SLIDE_SECONDS) {
      this.timer = 0;
      this.scene.tweens.add({ targets: this.content, alpha: 0, duration: 300, onComplete: () => this.active && this.next() });
    }
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    this.scene.input.keyboard.off('keydown', this.exit);
    this.root.destroy();
    if (this.onExit) this.onExit();
  }
}

