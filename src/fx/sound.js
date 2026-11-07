// Sound slots: 'sfx-jump', 'sfx-land', 'sfx-click', 'sfx-step' ...
// If no audio file with that key was loaded, nothing happens.
export function playSfx(scene, key, config) {
  try {
    if (scene.cache.audio.exists(key)) scene.sound.play(key, config);
  } catch (e) {
    // sound must never break the game
  }
}
