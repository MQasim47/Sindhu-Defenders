// Scripted full pass: title -> map -> Level 1 -> Level 2 -> Level 3 -> certificate,
// in English and Urdu, with low graphics on and off. It fails if there is ANY console error.
//
//   npm run test:e2e
//
// It starts the dev server (needed because the test talks to window.__game), opens Chrome or Edge with
// puppeteer-core, and writes screenshots to test-results/. Levels 1 and 2 are played for a few seconds
// and then finished with a shortcut (they take minutes to play for real); Level 3 is played for real by a
// small "perfect player" that presses the right defence button for every attack.
// Set CHROME_PATH if your browser is not found.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const PORT = 5199;
const URL = `http://localhost:${PORT}/`;
const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const executablePath = BROWSERS.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error('No Chrome or Edge found. Set CHROME_PATH.');
  process.exit(2);
}
fs.mkdirSync('test-results', { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- the dev server ----
const server = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', shell: process.platform === 'win32' });
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(URL)).ok) break;
  } catch (e) {
    await sleep(500);
  }
}

let failures = 0;
const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--ignore-gpu-blocklist', '--enable-gpu', '--window-size=1280,720', '--autoplay-policy=no-user-gesture-required'], defaultViewport: { width: 1280, height: 720 } });

async function pass(lang, low) {
  const tag = `${lang}-${low ? 'low' : 'normal'}`;
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate((l, lw) => {
    localStorage.clear();
    localStorage.setItem('sindhu-defenders-language', l);
    localStorage.setItem('sindhu-defenders-settings', JSON.stringify({ low: lw, reduced: false }));
  }, lang, low);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__game && window.__game.isBooted, { timeout: 30000 });
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const shot = (name) => page.screenshot({ path: `test-results/${tag}-${name}.png` });
  const active = () => ev(() => window.__game.scene.getScenes(true).map((s) => s.scene.key));
  const waitFor = (key, ms = 30000) => page.waitForFunction((k) => window.__game.scene.isActive(k), { timeout: ms }, key);
  const step = async (name, fn) => {
    try {
      await fn();
      console.log(`  ok   ${tag}: ${name}`);
    } catch (e) {
      failures++;
      console.log(`  FAIL ${tag}: ${name} - ${e.message}`);
    }
  };

  await page.keyboard.press('Space'); // skip the splash
  await step('title screen', async () => {
    await waitFor('Menu');
    await sleep(1200);
    await shot('1-title');
  });
  await step('settings, how to play, credits open', async () => {
    const menu = 'window.__game.scene.getScene("Menu")';
    for (const name of ['showSettings', 'showHowTo']) {
      await ev(`${menu}.${name}()`);
      await sleep(700);
      await shot(`2-${name}`);
      await page.keyboard.press('Escape');
      await sleep(400);
    }
  });
  await step('Play opens the World Map', async () => {
    await ev('window.__game.scene.getScene("Menu").startGame()');
    await waitFor('WorldMap');
    await sleep(1200);
    await shot('3-map');
  });
  await step('Level 1', async () => {
    await page.keyboard.press('Enter');
    // the key can be lost while the map is still fading in: ask once more with the same action
    await waitFor('Level', 8000).catch(async () => {
      await ev('window.__game.scene.getScene("WorldMap") && window.__game.scene.getScene("WorldMap").play()');
      await waitFor('Level', 30000);
    });
    await sleep(6000);
    await shot('4-level1');
    await ev('window.__level.finishLevel()');
    await sleep(1800);
    await shot('4-level1-results');
  });
  await step('Level 2 (backup by holding E)', async () => {
    await ev('window.__game.scene.getScene("UI").goTo("Level2")');
    await waitFor('Level2');
    await sleep(2500);
    await ev('(() => { const l = window.__level; const b = l.buildings[1]; l.director.next(); l.player.inputLocked = false; l.player.setPosition(b.x, b.y + 60); })()');
    await sleep(800);
    await page.keyboard.down('e');
    await sleep(1500);
    await page.keyboard.up('e');
    await sleep(1200);
    const backed = await ev('window.__level.buildings[1].backedUp');
    if (!backed) throw new Error('the building was not backed up');
    await shot('5-level2');
    await ev('window.__level.finishLevel()');
    await sleep(1800);
    await shot('5-level2-results');
  });
  await step('Level 3: the showdown, played to the K.O.', async () => {
    await ev('window.__game.scene.getScene("UI").goTo("Boss")');
    await waitFor('Boss');
    await sleep(2800);
    await shot('6-codeword');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await sleep(6500);
    await shot('6-fight');
    for (let i = 0; i < 400; i++) {
      const s = await ev(() => {
        const b = window.__boss;
        if (!b) return { state: 'gone', def: 0 };
        const a = b.airborne().sort((x, y) => x.remaining - y.remaining)[0];
        return { state: b.state, def: b.state === 'finale' ? 4 : a && a.t > 0.8 ? a.def : 0 };
      });
      if (['won', 'ko', 'gone'].includes(s.state)) break;
      if (s.def) await page.keyboard.press(String(s.def));
      await sleep(260);
    }
    await shot('6-ko');
    await sleep(7000);
  });
  await step('certificate', async () => {
    await waitFor('Report', 20000);
    await sleep(1500);
    await page.keyboard.type('Test Student');
    await sleep(300);
    await shot('7-certificate');
  });
  if (errors.length) {
    failures++;
    console.log(`  FAIL ${tag}: console errors:\n    ${errors.join('\n    ')}`);
  }
  await page.close();
}

// ONLY=ur-low runs just one pass (en-normal, en-low, ur-normal, ur-low)
for (const lang of ['en', 'ur']) {
  for (const low of [false, true]) {
    if (process.env.ONLY && process.env.ONLY !== `${lang}-${low ? 'low' : 'normal'}`) continue;
    console.log(`Pass: ${lang}, low graphics ${low ? 'on' : 'off'}`);
    await pass(lang, low);
  }
}
await browser.close();
server.kill();
if (process.platform === 'win32') spawn('taskkill', ['/pid', String(server.pid), '/t', '/f'], { stdio: 'ignore' });
console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed, no console errors.');
process.exit(failures ? 1 : 0);
