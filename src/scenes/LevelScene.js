import Phaser from 'phaser';
import Player from '../objects/Player.js';
import Mithu from '../objects/Mithu.js';
import Lantern from '../objects/Lantern.js';
import SpamBlobs from '../objects/SpamBlob.js';
import GroundFx from '../fx/GroundFx.js';
import Atmosphere from '../level/Atmosphere.js';
import WaveSpawner from '../systems/WaveSpawner.js';
import SpeechBubble from '../ui/SpeechBubble.js';
import KeyHint from '../ui/KeyHint.js';
import { buildCourtyardArt } from '../level/CourtyardArt.js';
import { buildFallbackCourtyard } from '../level/fallbackCourtyard.js';
import { LEVELS } from '../data/levels.js';
import { settings } from '../data/settings.js';
import { CSS, FONT } from '../data/colors.js';
import { addText } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';

const EVENTS = ['first-monster', 'caught', 'stolen', 'safe', 'greeted', 'verified', 'slimed', 'dodged', 'wave-end'];
const GREET_DISTANCE = 190;

// Level: the fort courtyard. Villagers and Behroopias come through the gate,
// Dodo checks them with the Sach ki Lalten (hold Q), Mithu helps with hints.
export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('Level');
  }

  create() {
    this.cameras.main.fadeIn(500, 11, 13, 26);
    this.hitStopLeft = 0;
    this.stats = { caught: 0, sneaked: 0, earned: 0 };
    this.said = {}; // lines that were already said once
    this.levelData = LEVELS.test;

    // Painted courtyard if the picture is there, otherwise simple generated walls.
    const art = buildCourtyardArt(this) || buildFallbackCourtyard(this);
    this.art = art;

    this.fx = new GroundFx(this);
    this.atmosphere = new Atmosphere(this, art.k);
    this.player = new Player(this, art.start.x, art.start.y, art.bounds, { colliders: art.colliders }, this.fx);
    this.mithu = new Mithu(this, this.player);
    this.bubble = new SpeechBubble(this);
    this.lantern = new Lantern(this, this.player);
    this.spam = new SpamBlobs(this);
    this.qHint = new KeyHint(this, 'Q');
    this.eHint = new KeyHint(this, 'E');
    this.lantern.onFirstUse = () => this.qHint.hide();

    const world = {
      colliders: art.colliders,
      gate: art.gate,
      center: art.center,
      speedFactor: 0.8,
      throwChance: this.levelData.throwChance,
    };
    this.spawner = new WaveSpawner(this, world, this.levelData);

    this.cameras.main.setBounds(0, 0, art.world.width, art.world.height);
    // Dodo sits a little below the middle, so Mithu's speech bubble has room above
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08, 0, 70);
    this.cameras.main.setDeadzone(120, 80);
    this.cameras.main.centerOn(art.start.x, art.start.y - 20);

    // HUD runs in its own scene, next to this one
    this.scene.stop('UI');
    this.scene.launch('UI', { level: this, config: this.levelData });

    this.wireEvents();
    this.showHint();
    if (import.meta.env.DEV) this.setupDebug();

    this.time.delayedCall(900, () => this.say('mithu.intro'));
    this.time.delayedCall(2200, () => this.spawner.start());

    this.input.keyboard.once('keydown-ESC', () => {
      this.cameras.main.fadeOut(400, 11, 13, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('UI');
        this.scene.start('Menu');
      });
    });
    this.events.once('shutdown', () => EVENTS.forEach((name) => this.events.off(name)));
  }

  // ---------- Events from villagers and monsters ----------

  wireEvents() {
    const ev = this.events;
    const lv = this.levelData;

    ev.on('first-monster', () => {
      this.say('mithu.firstBehroopia', true);
      this.time.delayedCall(1200, () => !this.lantern.used && this.qHint.show());
    });
    ev.on('caught', () => {
      this.stats.caught++;
      this.hud('setCaught', this.stats.caught);
      this.sayOnce('firstReveal', 'mithu.firstReveal');
    });
    ev.on('stolen', (m) => {
      this.stats.sneaked++;
      this.hud('setSneaked', this.stats.sneaked);
      this.hud('stealCoins', lv.stealAmount, () => this.toScreen(m.x, m.y - 50));
      this.sayOnce('firstSteal', 'mithu.firstSteal');
    });
    ev.on('safe', (v) => {
      this.stats.earned += lv.safeCoins;
      const p = this.toScreen(v.x, v.topPoint.y);
      this.hud('addCoins', lv.safeCoins, p.x, p.y + 30);
    });
    ev.on('greeted', (v) => {
      this.stats.earned += lv.greetBonus;
      this.fx.heart(v.x, v.topPoint.y);
      this.fx.heart(v.x + 18, v.topPoint.y + 6);
      const p = this.toScreen(v.x, v.topPoint.y);
      this.hud('addCoins', lv.greetBonus, p.x, p.y + 30);
    });
    ev.on('verified', () => this.sayOnce('verified', 'mithu.verified'));
    ev.on('slimed', () => this.sayOnce('slimed', 'mithu.slimed'));
    ev.on('dodged', () => this.sayOnce('dodged', 'mithu.dodged'));
    ev.on('wave-end', () => this.hud('showResults', { ...this.stats }));
  }

  // call a method of the HUD scene (if it is ready)
  hud(method, ...args) {
    const ui = this.scene.get('UI');
    if (ui && ui.ready) ui[method](...args);
  }

  // Mithu says a line. Pass a text key from src/i18n (for example 'mithu.intro').
  say(key) {
    this.bubble.say(t(key));
  }

  sayOnce(id, key) {
    if (this.said[id]) return;
    this.said[id] = true;
    this.say(key);
  }

  toScreen(x, y) {
    const cam = this.cameras.main;
    return { x: x - cam.scrollX, y: y - cam.scrollY };
  }

  // ---------- Effects used by the monsters ----------

  smoke(x, y) {
    this.fx.smoke(x, y);
  }

  // hit-stop (a very short freeze) and a small screen shake
  impact(ms, shake) {
    this.hitStopLeft = ms / 1000;
    if (!settings.low && !settings.reduced) this.cameras.main.shake(140, shake);
  }

  throwSpam(x, y, target) {
    this.spam.launch(x, y, target);
  }

  // ---------- Update ----------

  update(time, delta) {
    let dt = Math.min(delta, 50) / 1000;
    let step = delta;
    if (this.hitStopLeft > 0) {
      this.hitStopLeft -= dt;
      dt = 0;
      step = 0;
    }

    this.player.update(time, step);
    this.lantern.update(dt, this.spawner.all);
    this.spawner.update(dt);
    this.spam.update(dt, this.player, this.fx);
    this.mithu.update(dt);
    this.fx.update(dt);
    this.atmosphere.update(dt);
    this.updateHints();

    // bubble follows Mithu's head
    const s = this.toScreen(this.mithu.x, this.mithu.y - 52);
    this.bubble.follow(s.x, s.y);

    this.hud('setTime', Math.min(this.spawner.time, this.levelData.duration), this.levelData.duration);
  }

  // "Q" hint above Dodo, "E" prompt above a villager who can be greeted
  updateHints() {
    const p = this.player;
    if (this.qHint.shown) this.qHint.place(p.x, p.y - 250);

    let near = null;
    let best = GREET_DISTANCE;
    for (const n of this.spawner.all) {
      if (!n.canGreet) continue;
      const d = Phaser.Math.Distance.Between(p.x, p.y, n.x, n.y);
      if (d < best) {
        best = d;
        near = n;
      }
    }
    if (near) {
      this.eHint.show();
      this.eHint.place(near.x, near.topPoint.y - 34);
      if (Phaser.Input.Keyboard.JustDown(p.keys.use)) {
        near.greet();
        this.eHint.hide();
      }
    } else {
      this.eHint.hide();
    }
  }

  showHint() {
    const hint = addText(this, 640, 676, 'hud.controls', {
      fontFamily: FONT,
      fontSize: '24px',
      fontStyle: '500',
      color: CSS.cream,
      backgroundColor: 'rgba(11,13,26,0.6)',
      padding: { x: 16, y: 6 },
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100000);

    this.tweens.add({
      targets: hint,
      alpha: 0,
      delay: 6500,
      duration: 800,
      onComplete: () => hint.destroy(),
    });
  }

  // Developers only: press C to see the walking limits and solid objects.
  setupDebug() {
    const g = this.add.graphics().setDepth(99500).setVisible(false);
    const b = this.art.bounds;
    g.lineStyle(2, 0x00ff88, 1);
    g.beginPath();
    for (let y = b.minY; y <= b.maxY; y += 20) g.lineTo(b.minXAt(y), y);
    for (let y = b.maxY; y >= b.minY; y -= 20) g.lineTo(b.maxXAt(y), y);
    g.closePath();
    g.strokePath();
    this.art.colliders.forEach((c) => {
      g.lineStyle(2, c.low ? 0xffcc00 : 0xff3366, 1);
      g.strokeEllipse(c.x, c.y, c.rx * 2, c.ry * 2);
    });
    this.input.keyboard.on('keydown-C', () => g.setVisible(!g.visible));
  }
}
