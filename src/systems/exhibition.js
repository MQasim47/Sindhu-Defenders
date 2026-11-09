import { judge } from '../data/judge.js';
import { nextVisitor } from './visitorReset.js';
import { toast } from './perfWatch.js';
import { t, onLangChange } from '../i18n/index.js';

// Exhibition shortcuts (work in every scene):
//   Ctrl+Shift+J  judge mode: all 3 levels open, intros can be skipped, a small "JUDGE MODE" tag shows
//   Ctrl+Shift+R  next visitor: clears stars, AI memory and the player's name (keeps the Humans vs AI tally), back to the title
export function setupExhibition(game) {
  const tag = document.createElement('div');
  tag.style.cssText =
    'position:fixed;top:8px;right:8px;display:none;background:#8E1B2B;color:#F3E9D2;border:2px solid #E8B84A;' +
    'border-radius:12px;padding:3px 12px;font:700 16px Fredoka,Arial,sans-serif;z-index:30;pointer-events:none;letter-spacing:1px;';
  document.body.appendChild(tag);
  const refresh = () => {
    tag.textContent = t('judge.tag');
    tag.style.display = judge.on ? 'block' : 'none';
  };
  onLangChange(refresh);

  window.addEventListener(
    'keydown',
    (e) => {
      if (!(e.ctrlKey && e.shiftKey)) return;
      if (e.code === 'KeyJ') {
        e.preventDefault();
        e.stopPropagation();
        judge.on = !judge.on;
        refresh();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        e.stopPropagation();
        nextVisitor(game);
        refresh();
        toast('OK: next visitor');
      }
    },
    true,
  );
  refresh();
}
