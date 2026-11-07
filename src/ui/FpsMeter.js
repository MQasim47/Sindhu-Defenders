// Dev-only FPS meter. Press F to show or hide it.
export function setupFpsMeter(game) {
  const box = document.createElement('div');
  box.style.cssText =
    'position:fixed;top:8px;left:8px;padding:4px 8px;display:none;' +
    'background:rgba(0,0,0,0.65);color:#7CFC9A;font:14px monospace;' +
    'z-index:10;pointer-events:none;border-radius:4px;';
  document.body.appendChild(box);

  let timer = null;

  function show() {
    box.style.display = 'block';
    timer = setInterval(() => {
      box.textContent = Math.round(game.loop.actualFps) + ' FPS';
    }, 250);
  }

  function hide() {
    box.style.display = 'none';
    clearInterval(timer);
  }

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'f' && event.key !== 'F') return;
    if (event.repeat) return;
    // Do not react while the player is typing in a text box.
    const tag = event.target && event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (box.style.display === 'none') show();
    else hide();
  });
}
