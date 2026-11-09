import { audio } from '../audio/AudioManager.js';

// Plays a sound slot: 'sfx-jump', 'sfx-land', 'sfx-click' ...
// The sound comes from src/audio/AudioManager.js (a file with that key if there is one, else a
// small WebAudio recipe). It never throws.
export function playSfx(scene, key) {
  try {
    if (!audio.game && scene && scene.game) audio.init(scene.game);
    audio.sfx(key);
  } catch (e) {
    // sound must never break the game
  }
}
