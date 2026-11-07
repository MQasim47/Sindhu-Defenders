import Phaser from 'phaser';
import { addText, setSource } from '../i18n/i18nText.js';
import { t } from '../i18n/index.js';
import { makeCanvasTexture, roundRectPath } from '../fx/canvasUtil.js';
import { CSS, FONT } from '../data/colors.js';

const X = 930;
const Y = 14;
const W = 336;
const HEADER = 70;
const BODY = 404;
const BAR_W = 128;

// The "AI ka Dimagh" panel (crystal ball): shows what the Jadugar's brain plans to send next.
// What is drawn here is exactly what HackerBrain uses: the bars are its weights.
//   bars:  Chacha / Amma / Bacha (disguises) and Phishing / Trojan (attacks)
//   chip:  Exploit (it attacks a weak spot) or Explore (it tries something new)
//   log:   the last 3 things the AI learned, newest on top (typed in letter by letter)
// Open and close with the button or the Tab key. All words come from src/i18n.
export default class BrainPanel {
  constructor(scene) {
    this.scene = scene;
    this.open = true;
    this.thinking = false;
    this.state = null;
    this.rows = [];
    this.logCount = 0;
    this.lastLogId = '';
    this.typed = 99999;

    this.buildBackgrounds();
    this.buildHeader();
    this.buildBody();
  }

  // panel backgrounds are drawn once into pictures (fast)
  buildBackgrounds() {
    const s = this.scene;
    const draw = (key, h) =>
      makeCanvasTexture(s, key, W + 12, h + 16, (ctx) => {
        ctx.translate(6, 4);
        roundRectPath(ctx, 3, 7, W, h, 24);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();
        roundRectPath(ctx, -3, -3, W + 6, h + 6, 26);
        ctx.fillStyle = '#3A1C16';
        ctx.fill();
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, 'rgba(58,32,110,0.96)');
        g.addColorStop(1, 'rgba(24,16,64,0.96)');
        roundRectPath(ctx, 0, 0, W, h, 23);
        ctx.fillStyle = g;
        ctx.fill();
        roundRectPath(ctx, 4, 4, W - 8, h - 8, 20);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(160,120,255,0.85)';
        ctx.stroke();
      });
    draw('brain-bg-full', HEADER + BODY);
    draw('brain-bg-head', HEADER);
    this.bgFull = s.add.image(X - 6, Y - 4, 'brain-bg-full').setOrigin(0).setDepth(20);
    this.bgHead = s.add.image(X - 6, Y - 4, 'brain-bg-head').setOrigin(0).setDepth(20).setVisible(false);
  }

  buildHeader() {
    const s = this.scene;
    this.ballIcon = s.add.image(X + 38, Y + 36, 'icon-brain').setScale(0.95).setDepth(21);
    this.glow = s.add.image(X + 38, Y + 32, 'fx-glow').setTint(0x8fe0ff).setBlendMode(Phaser.BlendModes.ADD).setScale(0.8).setAlpha(0.4).setDepth(21);
    s.tweens.add({ targets: this.glow, alpha: 0.8, scale: 1, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    addText(s, X + 74, Y + 24, 'brain.title', { fontFamily: FONT, fontSize: '28px', fontStyle: '700', color: '#F5D77A', stroke: '#1a0f40', strokeThickness: 5 })
      .setOrigin(0, 0.5).setDepth(21);
    addText(s, X + 74, Y + 51, 'brain.tab', { fontFamily: FONT, fontSize: '17px', color: '#C9BDF0' }).setOrigin(0, 0.5).setDepth(21);

    // open / close button
    this.toggleBtn = s.add.container(X + W - 36, Y + 36).setDepth(22);
    const bg = s.add.graphics();
    bg.fillStyle(0x3a1c16, 1);
    bg.fillCircle(0, 0, 22);
    bg.fillStyle(0xf3e9d2, 1);
    bg.fillCircle(0, 0, 19);
    this.arrow = s.add.graphics();
    this.toggleBtn.add([bg, this.arrow]);
    this.drawArrow();
    this.toggleBtn.setSize(48, 48).setInteractive({ useHandCursor: true });
    this.toggleBtn.on('pointerup', () => this.toggle());
    this.toggleBtn.on('pointerover', () => s.tweens.add({ targets: this.toggleBtn, scale: 1.12, duration: 100 }));
    this.toggleBtn.on('pointerout', () => s.tweens.add({ targets: this.toggleBtn, scale: 1, duration: 100 }));
  }

  drawArrow() {
    const g = this.arrow;
    g.clear();
    g.fillStyle(0x1c2457, 1);
    if (this.open) g.fillTriangle(-9, 5, 9, 5, 0, -6);
    else g.fillTriangle(-9, -5, 9, -5, 0, 6);
  }

  buildBody() {
    const s = this.scene;
    this.body = s.add.container(X, Y + HEADER).setDepth(21);
    const label = (y, key) =>
      this.body.add(addText(s, 22, y, key, { fontFamily: FONT, fontSize: '19px', fontStyle: '600', color: '#BFB2F0' }).setOrigin(0, 0.5));

    label(10, 'brain.disguises');
    ['chacha', 'amma', 'bacha'].forEach((n, i) => this.addRow(n, 40 + i * 34, 0xe8b84a));
    label(150, 'brain.attacks');
    ['phishing', 'trojan'].forEach((n, i) => this.addRow(n, 180 + i * 34, n === 'phishing' ? 0x5ec2ff : 0xff7a5a));

    // Exploit / Explore chip
    this.chipBg = s.add.graphics();
    this.chipText = addText(s, W / 2, 262, () => this.chipLabel(), { fontFamily: FONT, fontSize: '24px', fontStyle: '700', color: '#ffffff' }).setOrigin(0.5);
    this.body.add([this.chipBg, this.chipText]);
    this.drawChip(0x7a6a9a, 120);

    // the last three log lines
    this.logTexts = [];
    for (let i = 0; i < 3; i++) {
      const y = 296 + i * 36;
      const text = addText(s, 20, y, () => this.logString(i), {
        fontFamily: FONT,
        fontSize: i === 0 ? '19px' : '17px',
        color: i === 0 ? '#FFFFFF' : '#B9ACE0',
        wordWrap: { width: W - 40 },
        lineSpacing: 0,
      }).setOrigin(0, 0);
      this.logTexts.push(text);
      this.body.add(text);
    }
  }

  addRow(name, y, color) {
    const s = this.scene;
    const label = addText(s, 22, y, `brain.names.${name}`, { fontFamily: FONT, fontSize: '22px', fontStyle: '500', color: '#FFFFFF' }).setOrigin(0, 0.5);
    const track = s.add.rectangle(120, y, BAR_W, 18, 0x120a30).setOrigin(0, 0.5).setStrokeStyle(2, 0x6a58a8);
    const fill = s.add.rectangle(121, y, 1, 14, color).setOrigin(0, 0.5);
    const pct = s.add.text(W - 22, y, '0%', { fontFamily: FONT, fontSize: '22px', fontStyle: '700', color: '#F5D77A', resolution: 2 }).setOrigin(1, 0.5);
    this.body.add([label, track, fill, pct]);
    this.rows.push({ name, fill, pct, target: 1, width: 1 });
  }

  drawChip(color, w) {
    const g = this.chipBg;
    g.clear();
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(W / 2 - w / 2, 250, w, 36, 18);
    g.fillStyle(color, 1);
    g.fillRoundedRect(W / 2 - w / 2, 246, w, 36, 18);
    g.lineStyle(2, 0xffffff, 0.6);
    g.strokeRoundedRect(W / 2 - w / 2 + 2, 248, w - 4, 32, 16);
  }

  chipLabel() {
    if (this.thinking) return t('brain.thinking');
    if (!this.state) return t('brain.thinking');
    return t(this.state.mode === 'explore' ? 'brain.explore' : 'brain.exploit');
  }

  // one log entry as text (in the current language)
  logString(i) {
    const entry = this.state && this.state.log[i];
    if (!entry) return '';
    const vars = { ...entry.vars };
    if (vars.name) vars.name = t(`brain.names.${vars.name}`);
    const text = t(entry.key, vars);
    return i === 0 ? text.slice(0, this.typed) : text;
  }

  // ---------- Called by the Level ----------

  setBrainThinking(on) {
    this.thinking = on;
    this.drawChip(on ? 0x7a6a9a : this.chipColor(), 150);
    setSource(this.chipText, () => this.chipLabel());
  }

  chipColor() {
    return this.state && this.state.mode === 'explore' ? 0x2e86d0 : 0xc0392b;
  }

  setBrain(state) {
    const first = !this.state;
    this.state = state;
    this.rows.forEach((row) => {
      const share = state.weights[row.name] || 0;
      row.target = Math.max(1, BAR_W * 0.94 * share);
      row.share = share;
      row.pct.setText(`${Math.round(share * 100)}%`);
      if (!first) this.scene.tweens.add({ targets: row.pct, scale: { from: 1.4, to: 1 }, duration: 320, ease: 'Back.Out' });
    });
    this.drawChip(this.thinking ? 0x7a6a9a : this.chipColor(), 150);
    setSource(this.chipText, () => this.chipLabel());
    if (!first) this.scene.tweens.add({ targets: this.chipText, scale: { from: 1.3, to: 1 }, duration: 300, ease: 'Back.Out' });

    // type in the newest log line
    const newest = state.log[0];
    const id = newest ? `${newest.key}${JSON.stringify(newest.vars)}${state.log.length}` : '';
    if (id !== this.lastLogId) {
      this.lastLogId = id;
      this.typeNewest();
    } else {
      this.logTexts.forEach((tx, i) => setSource(tx, () => this.logString(i)));
    }
  }

  typeNewest() {
    if (this.typer) this.typer.remove(false);
    this.typed = 0;
    const length = t(this.state.log[0].key, { name: 'xxxxxxx', n: 0 }).length + 12;
    this.typer = this.scene.time.addEvent({
      delay: 24,
      repeat: length,
      callback: () => {
        this.typed += 1;
        setSource(this.logTexts[0], () => this.logString(0));
      },
    });
    this.logTexts.forEach((tx, i) => i > 0 && setSource(tx, () => this.logString(i)));
  }

  // ---------- Open / close ----------

  toggle() {
    this.open = !this.open;
    const s = this.scene;
    this.drawArrow();
    if (this.open) {
      this.bgFull.setVisible(true);
      this.bgHead.setVisible(false);
      this.body.setVisible(true).setAlpha(0);
      s.tweens.add({ targets: this.body, alpha: 1, duration: 200 });
    } else {
      s.tweens.add({
        targets: this.body,
        alpha: 0,
        duration: 140,
        onComplete: () => {
          if (this.open) return;
          this.body.setVisible(false);
          this.bgFull.setVisible(false);
          this.bgHead.setVisible(true);
        },
      });
    }
  }

  update(dt) {
    if (!this.open) return;
    for (const row of this.rows) {
      row.width += (row.target - row.width) * Math.min(1, dt * 7);
      row.fill.width = row.width;
    }
  }
}
