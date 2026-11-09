import { t } from '../i18n/index.js';

// Errors per scene: if a scene breaks while it is created or updated, the player sees a friendly
// "Back to menu" panel instead of a frozen game. (The error is still written to the console.)
//   protectScene(SceneClass)  - call it for every scene class before the game starts
let panel = null;
let lastGame = null;

function showError(game, key, error) {
  console.error(`Scene ${key} failed:`, error);
  lastGame = game;
  if (panel) return; // one panel is enough
  // stop the broken scenes, so the error does not repeat 60 times per second
  game.scene.getScenes(true).forEach((s) => game.scene.pause(s.scene.key));
  panel = document.createElement('div');
  panel.style.cssText =
    'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(11,13,26,0.86);z-index:50;font-family:Fredoka,Arial,sans-serif;';
  panel.innerHTML = `
    <div style="background:#F3E9D2;border:6px solid #5A0F1D;border-radius:28px;padding:32px 44px;text-align:center;max-width:520px;box-shadow:0 14px 40px rgba(0,0,0,.5)">
      <div style="font-size:34px;font-weight:700;color:#1C2457;margin-bottom:22px"></div>
      <button type="button" style="font:700 28px Fredoka,Arial,sans-serif;color:#F3E9D2;background:#8E1B2B;border:4px solid #5A0F1D;border-radius:40px;padding:12px 38px;cursor:pointer"></button>
    </div>`;
  panel.querySelector('div > div').textContent = t('error.title');
  const button = panel.querySelector('button');
  button.textContent = t('error.back');
  button.addEventListener('click', () => {
    panel.remove();
    panel = null;
    const g = lastGame;
    g.scene.getScenes(false).forEach((s) => g.scene.stop(s.scene.key));
    g.scene.start('Menu');
  });
  document.body.appendChild(panel);
  button.focus();
}

export function protectScene(SceneClass) {
  ['create', 'update'].forEach((name) => {
    const original = SceneClass.prototype[name];
    if (!original) return;
    SceneClass.prototype[name] = function protectedMethod(...args) {
      try {
        return original.apply(this, args);
      } catch (error) {
        showError(this.game, this.scene.key, error);
        return undefined;
      }
    };
  });
}
