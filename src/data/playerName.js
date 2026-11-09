// The name the player types on the certificate (kept in localStorage, inside try/catch).
const KEY = 'sindhu-defenders-player-name';

export function getPlayerName() {
  try {
    return localStorage.getItem(KEY) || '';
  } catch (e) {
    return '';
  }
}

export function setPlayerName(name) {
  try {
    localStorage.setItem(KEY, name);
  } catch (e) {
    // not saved: fine
  }
}

export function clearPlayerName() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    // ignore
  }
}
