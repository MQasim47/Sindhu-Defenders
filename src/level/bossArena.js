import Phaser from 'phaser';
import { makeCanvasTexture } from '../fx/canvasUtil.js';
import { settings } from '../data/settings.js';

// The boss arena (1280 x 720, the camera never moves).
// public/assets/backgrounds/miri-fort-bg.(jpg|png|webp) is used if it exists (key 'miri-fort-bg').
// If it is missing, a night courtyard of Miri Fort is drawn in code: far wall with a gate,
// a stone floor and a glowing Ajrak ring in the middle. Nothing breaks when the picture is missing.
export const ARENA = {
  minY: 430, // Dodo's feet can go this far up and ...
  maxY: 660, // ... this far down
  minX: 110,
  maxX: 1170,
  // where the Jadugar's feet can be (he floats above them)
  jadMinX: 260,
  jadMaxX: 1020,
  jadMinY: 440,
  jadMaxY: 540,
};

function drawFallback(ctx) {
  // night sky
  const sky = ctx.createLinearGradient(0, 0, 0, 330);
  sky.addColorStop(0, '#120A2A');
  sky.addColorStop(1, '#4A2A5E');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, 340);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 70; i++) {
    const x = Math.abs(Math.sin(i * 91.7) * 1280);
    const y = Math.abs(Math.sin(i * 33.3) * 200);
    ctx.fillRect(x, y, 2, 2);
  }
  // far wall with battlements and a gate
  ctx.fillStyle = '#6E5A55';
  ctx.fillRect(0, 210, 1280, 150);
  for (let x = 0; x < 1280; x += 64) ctx.fillRect(x + 8, 180, 40, 34);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 226; y < 360; y += 22) ctx.fillRect(0, y, 1280, 3);
  // towers
  [[90, 130], [1190, 130]].forEach(([x, y]) => {
    ctx.fillStyle = '#7B6660';
    ctx.fillRect(x - 60, y, 120, 240);
    ctx.fillStyle = '#6E5A55';
    for (let k = 0; k < 4; k++) ctx.fillRect(x - 60 + k * 32, y - 24, 24, 28);
    ctx.fillStyle = '#2A1830';
    ctx.fillRect(x - 12, y + 60, 24, 46);
  });
  // gate
  ctx.fillStyle = '#1B0F26';
  ctx.beginPath();
  ctx.moveTo(570, 360);
  ctx.lineTo(570, 275);
  ctx.arc(640, 275, 70, Math.PI, 0);
  ctx.lineTo(710, 360);
  ctx.fill();
  ctx.strokeStyle = '#E8B84A';
  ctx.lineWidth = 6;
  ctx.stroke();
  // stone floor in perspective
  const floor = ctx.createLinearGradient(0, 355, 0, 720);
  floor.addColorStop(0, '#5B4A56');
  floor.addColorStop(1, '#2E2336');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 355, 1280, 365);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const y = 355 + Math.pow(i / 8, 1.7) * 365;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
    ctx.stroke();
  }
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(640 + i * 50, 355);
    ctx.lineTo(640 + i * 150, 720);
    ctx.stroke();
  }
  // the glowing Ajrak ring in the middle of the arena
  ctx.save();
  ctx.translate(640, 548);
  ctx.scale(1, 0.34);
  [[470, 'rgba(142,27,43,0.55)', 26], [440, 'rgba(232,184,74,0.7)', 5], [400, 'rgba(28,36,87,0.7)', 18]].forEach(([r, color, w]) => {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.lineWidth = w;
    ctx.strokeStyle = color;
    ctx.stroke();
  });
  ctx.fillStyle = 'rgba(244,235,221,0.75)';
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 440, Math.sin(a) * 440, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Builds the arena. Returns { torches: [...] } (flames that flicker) and fills scene.arenaGlow.
export function buildBossArena(scene) {
  if (scene.textures.exists('miri-fort-bg')) {
    const source = scene.textures.get('miri-fort-bg').getSourceImage();
    const cover = Math.max(1280 / source.width, 720 / source.height);
    scene.add.image(640, 360, 'miri-fort-bg').setScale(cover).setDepth(-10);
  } else {
    makeCanvasTexture(scene, 'boss-arena-bg', 1280, 720, drawFallback);
    scene.add.image(0, 0, 'boss-arena-bg').setOrigin(0).setDepth(-10);
  }

  // a dark purple shade that makes the fight feel tense (it lifts when the fort lights up)
  scene.arenaShade = scene.add.rectangle(640, 360, 1280, 720, 0x1a0a30, 0.28).setDepth(-9);
  // warm light that fills the fort after the win
  scene.arenaGlow = scene.add.image(640, 330, 'fx-glow').setScale(16, 9).setTint(0xffd27a).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(-8);

  const torches = [];
  [[220, 330], [1060, 330]].forEach(([x, y]) => {
    scene.add.image(x, y, 'prop-torch').setOrigin(0.5, 1).setDepth(-7);
    const glow = scene.add.image(x, y - 70, 'fx-glow').setTint(0xffa040).setBlendMode(Phaser.BlendModes.ADD).setScale(1.7).setAlpha(0.5).setDepth(-6);
    torches.push(glow);
  });
  return {
    torches,
    update(time) {
      if (settings.low || settings.reduced) return;
      torches.forEach((g, i) => g.setAlpha(0.45 + Math.sin(time / 120 + i * 2) * 0.08));
    },
  };
}
