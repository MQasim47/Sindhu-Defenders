import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import LoadingScene from './scenes/LoadingScene.js';
import MenuScene from './scenes/MenuScene.js';
import WorldMapScene from './scenes/WorldMapScene.js';
import LevelScene from './scenes/LevelScene.js';
import Level2Scene from './scenes/Level2Scene.js';
import BossScene from './scenes/BossScene.js';
import BossUIScene from './scenes/BossUIScene.js';
import UIScene from './scenes/UIScene.js';
import ReportScene from './scenes/ReportScene.js';
import { setupFpsMeter } from './ui/FpsMeter.js';
import { ajrakDataUrl } from './fx/ajrakPattern.js';
import { loadUrduFont } from './i18n/index.js';
import { protectScene } from './systems/safeScenes.js';
import { watchPerformance, mark } from './systems/perfWatch.js';
import { setupExhibition } from './systems/exhibition.js';
import { audio } from './audio/AudioManager.js';

// Pattern for the page around the game (see index.html)
document.documentElement.style.setProperty('--ajrak-tile', `url(${ajrakDataUrl(128)})`);

const config = {
  type: Phaser.WEBGL,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#0b0d1a',
  pixelArt: false,
  antialias: true,
  dom: { createContainer: true }, // for the name box of the certificate
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    PreloadScene,
    LoadingScene,
    MenuScene,
    WorldMapScene,
    LevelScene,
    Level2Scene,
    BossScene,
    UIScene,
    BossUIScene,
    ReportScene,
  ],
};

// Wait for the Fredoka font before the game makes any text (max 3 s, then use the fallback font).
async function start() {
  mark('main');
  try {
    await Promise.race([
      Promise.all([...['400', '500', '600', '700'].map((w) => document.fonts.load(`${w} 24px Fredoka`)), loadUrduFont()]),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch (e) {
    // fallback font is fine
  }
  mark('fonts ready');
  config.scene.forEach(protectScene); // a broken scene shows a friendly panel instead of freezing
  const game = new Phaser.Game(config);
  audio.init(game);
  setupExhibition(game);
  watchPerformance(game);
  if (import.meta.env.DEV) {
    setupFpsMeter(game);
    window.__game = game; // for testing in the browser console
  }
}
start();

