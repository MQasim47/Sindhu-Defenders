import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import WorldMapScene from './scenes/WorldMapScene.js';
import LevelScene from './scenes/LevelScene.js';
import UIScene from './scenes/UIScene.js';
import ReportScene from './scenes/ReportScene.js';
import { setupFpsMeter } from './ui/FpsMeter.js';
import { ajrakDataUrl } from './fx/ajrakPattern.js';
import { loadUrduFont } from './i18n/index.js';

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
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    CharacterSelectScene,
    WorldMapScene,
    LevelScene,
    UIScene,
    ReportScene,
  ],
};

// Wait for the Fredoka font before the game makes any text (max 3 s, then use the fallback font).
async function start() {
  try {
    await Promise.race([
      Promise.all([...['400', '500', '600', '700'].map((w) => document.fonts.load(`${w} 24px Fredoka`)), loadUrduFont()]),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch (e) {
    // fallback font is fine
  }
  const game = new Phaser.Game(config);
  if (import.meta.env.DEV) {
    setupFpsMeter(game);
    window.__game = game; // for testing in the browser console
  }
}
start();

