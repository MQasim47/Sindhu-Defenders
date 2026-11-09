import { resetProgress } from '../data/progress.js';
import { resetRun } from '../ai/runMemory.js';
import { clearPlayerName } from '../data/playerName.js';
import { judge } from '../data/judge.js';

// "Next visitor" (Ctrl+Shift+R): clears the stars, the AI's memory and the player's name,
// but keeps the overall Humans vs AI Hacker tally. Then the game goes back to the title screen.
export function nextVisitor(game) {
  resetProgress();
  resetRun();
  clearPlayerName();
  judge.on = false;
  game.registry.remove('lastGame');
  game.registry.remove('mapNode');
  game.scene.getScenes(true).forEach((s) => game.scene.stop(s.scene.key));
  game.scene.start('Menu');
}
