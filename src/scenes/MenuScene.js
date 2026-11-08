import Phaser from 'phaser';
import Button from '../ui/Button.js';
import { createLogoTitle, createRibbon } from '../ui/LogoText.js';
import { openPanel } from '../ui/Panel.js';
import { openLevelSelect } from '../ui/LevelSelect.js';
import { openChat } from '../ui/chat/ChatPanel.js';
import { t } from '../i18n/index.js';
import Player from '../objects/Player.js';
import { makeCanvasTexture } from '../fx/canvasUtil.js';
import { playSfx } from '../fx/sound.js';
import { settings } from '../data/settings.js';
import { CSS, FONT_TITLE } from '../data/colors.js';
import { addText } from '../i18n/i18nText.js';
import { makeGlobeButton } from '../ui/LanguageMenu.js';

// Where Dodo's eyes are in the original dodo-full picture (full size pixels).
const EYES = [
  [1229, 489],
  [1493, 492],
];
const NOSE_BRIDGE = [1356, 470]; // plain skin between the eyes, used to match the colour

// Menu: painted title picture with slow drift, birds, floating light,
// the big title, Dodo, and three buttons.
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  init(data) {
    this.openLevelsAtStart = !!(data && data.openLevels); // the World Map could not open: show the Levels list
  }

  create() {
    this.cameras.main.fadeIn(500, 11, 13, 26);
    this.time_ = 0;
    this.leaving = false;
    this.lidSync = null;

    this.buildBackground();
    this.buildBirds();
    this.buildMotes();
    this.buildDodo();
    this.buildTitle();
    this.buildButtons();
    this.buildClickToStart();
    this.globe = makeGlobeButton(this, 1226, 52).setDepth(40);
    if (this.openLevelsAtStart) this.time.delayedCall(600, () => this.showLevels());
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.time_ += dt;
    const t = this.time_;
    if (this.lidSync) this.lidSync();
    for (const bird of this.birds) {
      bird.x += bird.speed * dt;
      bird.y += Math.sin(t * 0.8 + bird.phase) * 8 * dt;
      bird.setScale(bird.size, bird.size * (0.55 + 0.45 * Math.abs(Math.sin(t * 8 + bird.phase))));
      if (bird.x > 1340) {
        bird.x = -40;
        bird.y = Phaser.Math.Between(50, 250);
      }
    }
    for (const m of this.motes) {
      m.y -= m.speed * dt;
      m.x += Math.sin(t * 0.6 + m.phase) * 10 * dt;
      if (m.y < -10) {
        m.y = 730;
        m.x = Phaser.Math.Between(0, 1280);
      }
    }
  }

  // ---------- Background ----------

  buildBackground() {
    if (this.textures.exists('title-bg')) {
      // cover-fit (no stretching) with 10% extra, so the slow drift never shows an edge
      const img = this.textures.get('title-bg').getSourceImage();
      const cover = Math.max(1280 / img.width, 720 / img.height) * 1.1;
      const bg = this.add.image(640, 360, 'title-bg').setScale(cover);
      if (!settings.reduced) {
        this.tweens.add({ targets: bg, x: 640 - 38, y: 360 - 8, duration: 15000, ease: 'Sine.InOut', yoyo: true, repeat: -1 });
      }
    } else {
      this.buildFallbackBackground();
    }
    // warm shade at the bottom so buttons are readable
    makeCanvasTexture(this, 'menu-shade', 1280, 720, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 720);
      g.addColorStop(0, 'rgba(20,6,30,0.25)');
      g.addColorStop(0.45, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(25,8,20,0.5)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1280, 720);
    });
    this.add.image(0, 0, 'menu-shade').setOrigin(0).setDepth(5);
  }

  // Used when title-bg is missing: sunset colours and a moving Ajrak pattern.
  buildFallbackBackground() {
    makeCanvasTexture(this, 'menu-fallback-bg', 1280, 720, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 720);
      g.addColorStop(0, '#5b3a6e');
      g.addColorStop(0.5, '#e0805a');
      g.addColorStop(1, '#2a1830');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = '#3a2440';
      ctx.beginPath();
      ctx.moveTo(0, 520);
      for (let x = 0; x <= 1280; x += 80) ctx.lineTo(x, 470 + Math.sin(x * 0.011) * 60);
      ctx.lineTo(1280, 720);
      ctx.lineTo(0, 720);
      ctx.fill();
    });
    this.add.image(0, 0, 'menu-fallback-bg').setOrigin(0);
    const pattern = this.add.tileSprite(640, 360, 1280, 720, 'ajrak-tile').setAlpha(0.14);
    this.tweens.add({ targets: pattern, tilePositionX: 64, tilePositionY: 64, duration: 8000, repeat: -1 });
  }

  buildBirds() {
    this.birds = [];
    const count = settings.low ? 3 : 5;
    for (let i = 0; i < count; i++) {
      const bird = this.add.image(Phaser.Math.Between(-100, 1200), Phaser.Math.Between(50, 250), 'fx-bird').setDepth(6);
      bird.speed = Phaser.Math.Between(30, 65);
      bird.phase = Math.random() * 6;
      bird.size = Phaser.Math.FloatBetween(0.6, 1.1);
      this.birds.push(bird);
    }
  }

  buildMotes() {
    this.motes = [];
    const count = settings.low ? 10 : 30;
    for (let i = 0; i < count; i++) {
      const m = this.add
        .image(Phaser.Math.Between(0, 1280), Phaser.Math.Between(0, 720), 'fx-mote')
        .setDepth(6)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(Phaser.Math.FloatBetween(0.4, 1.2))
        .setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
      m.speed = Phaser.Math.Between(6, 20);
      m.phase = Math.random() * 6;
      this.motes.push(m);
    }
  }

  // ---------- Dodo ----------

  buildDodo() {
    const x = 285;
    const feetY = 705;
    if (this.textures.exists('dodo-full')) {
      const tex = this.textures.get('dodo-full').getSourceImage();
      const s = 560 / tex.height;
      const dodo = this.add.image(x, feetY, 'dodo-full').setOrigin(0.5, 1).setScale(s).setDepth(10);
      this.add
        .image(x, feetY + 4, 'shadow')
        .setScale(4.2, 2)
        .setAlpha(0.8)
        .setDepth(9);
      this.addBlink(dodo, tex, s);
      this.tweens.add({ targets: dodo, y: feetY - 7, duration: 1300, ease: 'Sine.InOut', yoyo: true, repeat: -1 });
      this.tweens.add({ targets: dodo, scaleY: s * 1.012, scaleX: s * 0.994, duration: 1300, ease: 'Sine.InOut', yoyo: true, repeat: -1 });
      this.tweens.add({ targets: dodo, angle: 0.9, duration: 2100, ease: 'Sine.InOut', yoyo: true, repeat: -1 });
      this.dodo = dodo;
    } else {
      // fallback: the in-game Dodo, drawn big and standing still
      const bounds = { minY: 0, maxY: 1000, minXAt: () => 0, maxXAt: () => 1280 };
      this.dodo = new Player(this, x, feetY, bounds).setScale(3.6).setDepth(10);
    }
    // little entrance
    this.dodo.setAlpha(0);
    this.tweens.add({ targets: this.dodo, alpha: 1, duration: 600, delay: 200 });
  }

  // Eyelids (skin coloured) that flash over the eyes now and then.
  addBlink(dodo, tex, s) {
    const crop = this.registry.get('dodoFullCrop');
    if (!crop) return;
    let skin = '#F2B98A';
    try {
      const ctx = tex.getContext('2d');
      const p = ctx.getImageData(Math.round((NOSE_BRIDGE[0] - crop.x) * crop.scale), Math.round((NOSE_BRIDGE[1] - crop.y) * crop.scale), 1, 1).data;
      skin = `rgb(${p[0]},${p[1]},${p[2]})`;
    } catch (e) {
      // keep the default skin colour
    }
    makeCanvasTexture(this, 'dodo-lid', 84, 84, (ctx) => {
      ctx.beginPath();
      ctx.ellipse(42, 42, 38, 40, 0, 0, Math.PI * 2);
      ctx.fillStyle = skin;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(14, 44);
      ctx.quadraticCurveTo(42, 62, 70, 44);
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#3A1C16';
      ctx.stroke();
    });
    const lids = EYES.map(([ex, ey]) => {
      const tx = (ex - crop.x) * crop.scale;
      const ty = (ey - crop.y) * crop.scale;
      return this.add.image(0, 0, 'dodo-lid').setScale(s).setDepth(11).setVisible(false).setData('tex', [tx, ty]);
    });
    const place = () => {
      lids.forEach((lid) => {
        const [tx, ty] = lid.getData('tex');
        lid.setPosition(dodo.x + (tx - tex.width / 2) * dodo.scaleX, dodo.y - (tex.height - ty) * dodo.scaleY);
        lid.setAngle(dodo.angle);
      });
    };
    const blink = () => {
      place();
      lids.forEach((l) => l.setVisible(true));
      this.time.delayedCall(120, () => lids.forEach((l) => l.setVisible(false)));
      this.time.delayedCall(Phaser.Math.Between(2200, 4800), blink);
    };
    this.time.delayedCall(1500, blink);
    // keep the lids glued to the bobbing picture while they are visible
    this.lidSync = () => lids[0].visible && place();
  }

  // ---------- Title and buttons ----------

  buildTitle() {
    this.logo = createLogoTitle(this, 'title-logo', t('game.title'), 88);
    createRibbon(this, 'ribbon', t('game.subtitle'), 600, 38);

    const title = this.add.image(640, 112, 'title-logo').setDepth(20);
    const ribbon = this.add.image(640, 214, 'ribbon').setDepth(20);
    title.setScale(0.5).setAlpha(0);
    ribbon.setAlpha(0).setScale(0.6, 0.6);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 650, ease: 'Back.Out', delay: 200 });
    this.tweens.add({ targets: ribbon, scaleX: 1, scaleY: 1, alpha: 1, duration: 500, ease: 'Back.Out', delay: 600 });
    if (!settings.reduced) {
      this.tweens.add({ targets: title, y: 106, duration: 2000, ease: 'Sine.InOut', yoyo: true, repeat: -1, delay: 1000 });
    }
    // shine sweep every few seconds
    this.time.addEvent({ delay: 4600, loop: true, startAt: 3200, callback: () => this.logo.sweep(900) });
  }

  buildButtons() {
    const x = 940;
    const defs = [
      { label: 'menu.play', x, y: 330, opts: { width: 380, height: 104, fontSize: 52, pulse: true }, action: () => this.startGame() },
      { label: 'menu.levels', x, y: 430, opts: { width: 330, height: 66, fontSize: 30, style: 'indigo' }, action: () => this.showLevels() },
      { label: 'menu.howTo', x: x - 85, y: 518, opts: { width: 165, height: 62, fontSize: 22, style: 'indigo' }, action: () => this.showHowTo() },
      { label: 'menu.settings', x: x + 85, y: 518, opts: { width: 165, height: 62, fontSize: 22, style: 'indigo' }, action: () => this.showSettings() },
      { label: 'menu.askMithu', x, y: 604, opts: { width: 330, height: 66, fontSize: 28, style: 'indigo' }, action: () => this.askMithu() },
    ];
    this.buttons = defs.map((d, i) => {
      const button = new Button(this, d.x, d.y, d.label, d.action, d.opts).setDepth(20);
      button.setScale(0);
      this.tweens.add({ targets: button, scale: 1, duration: 450, delay: 700 + i * 130, ease: 'Back.Out' });
      return button;
    });
  }

  buildClickToStart() {
    if (!this.sound || !this.sound.locked) return;
    const text = addText(this, 640, 676, 'menu.clickToStart', {
      fontFamily: FONT_TITLE,
      fontSize: '30px',
      fontStyle: 'bold',
      color: CSS.cream,
      stroke: '#2A0E14',
      strokeThickness: 6,
    })
      .setOrigin(0.5)
      .setDepth(30);
    const pulse = this.tweens.add({ targets: text, alpha: 0.35, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.sound.once('unlocked', () => {
      pulse.stop();
      this.tweens.add({ targets: text, alpha: 0, duration: 300, onComplete: () => text.destroy() });
    });
  }

  // choose a level (the simple list, also the fallback of the World Map)
  showLevels() {
    openLevelSelect(this, (sceneKey) => this.startLevel(sceneKey));
  }

  startLevel(sceneKey) {
    if (this.leaving) return;
    this.leaving = true;
    playSfx(this, 'sfx-click');
    this.cameras.main.fadeOut(500, 11, 13, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneKey));
  }

  // the chat with Mithu (the last game, if there was one, gives him real numbers to talk about)
  askMithu() {
    openChat(this, { getSnapshot: () => this.registry.get('lastGame') || null });
  }

  showHowTo() {
    openPanel(this, { titleKey: 'howto.title', lineKeys: ['howto.line1', 'howto.line2', 'howto.line3', 'howto.line4', 'howto.line5'] });
  }

  showSettings() {
    openPanel(this, {
      titleKey: 'settings.title',
      language: true,
      toggles: [
        { labelKey: 'settings.low', key: 'low' },
        { labelKey: 'settings.reduced', key: 'reduced' },
      ],
    });
  }

  startGame() {
    if (this.leaving) return;
    this.leaving = true;
    playSfx(this, 'sfx-click');
    this.cameras.main.fadeOut(500, 11, 13, 26);
    // the World Map (it opens the Levels list by itself if the map cannot load)
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('WorldMap'));
  }
}
