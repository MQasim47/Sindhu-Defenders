// AudioManager: music (files in public/assets/audio) and sound effects.
//
// MUSIC  music-menu (title, map, certificate), music-level (Level 1 and 2), music-boss (Level 3).
//        Changing the music crossfades for about 1 second. While the chat is open it is 40% quieter.
// SFX    Every sound slot ('sfx-jump', 'sfx-hit' ...) is made by a small WebAudio recipe (see SFX below),
//        so no action is ever silent and no sound file is needed. If you later add a real file to
//        GROUP_DEFS in src/data/assetList.js with the same key (e.g. 'sfx-jump'), that file is played instead.
// Volumes and mute are saved in localStorage (inside try/catch). The browser unlocks sound on the
// first click or key press (Phaser does that for us).
const KEY = 'sindhu-defenders-audio';
const FADE_MS = 1000;
const DUCK = 0.6; // music volume while the chat is open

export const audioSettings = { music: 0.6, sfx: 0.8, mute: false };
try {
  Object.assign(audioSettings, JSON.parse(localStorage.getItem(KEY) || '{}'));
} catch (e) {
  // defaults are fine
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(audioSettings));
  } catch (e) {
    // ignore
  }
}

// ---------- the sound recipes ----------
// A recipe is a list of layers. Layer: { n: 'tone' | 'noise', t: wave, f: [from, to] Hz, d: seconds, v: volume, at: delay }
//   tone  = an oscillator whose pitch glides from f[0] to f[1]
//   noise = filtered white noise (t = 'lowpass' | 'highpass' | 'bandpass', f = filter pitch glide)
const tone = (t, f0, f1, d, v = 0.3, at = 0) => ({ n: 'tone', t, f: [f0, f1], d, v, at });
const noise = (t, f0, f1, d, v = 0.3, at = 0) => ({ n: 'noise', t, f: [f0, f1], d, v, at });
const notes = (list, t = 'triangle', step = 0.09, d = 0.18, v = 0.28) => list.map((f, i) => tone(t, f, f, d, v, i * step));

const SFX = {
  'sfx-click': [tone('sine', 900, 600, 0.07, 0.25)],
  'sfx-jump': [tone('square', 280, 620, 0.14, 0.14)],
  'sfx-land': [noise('lowpass', 500, 120, 0.1, 0.4), tone('sine', 130, 60, 0.1, 0.3)],
  'sfx-hit': [noise('bandpass', 900, 200, 0.16, 0.45), tone('sawtooth', 220, 70, 0.16, 0.25)],
  'sfx-coin': [tone('sine', 1250, 1250, 0.07, 0.25), tone('sine', 1700, 1700, 0.16, 0.25, 0.07)],
  'sfx-win': notes([523, 659, 784, 1047, 1319], 'triangle', 0.12, 0.3),
  'sfx-lantern': [tone('sine', 300, 900, 0.25, 0.18), noise('highpass', 3000, 6000, 0.2, 0.08)],
  'sfx-brick-pick': [tone('triangle', 500, 800, 0.08, 0.25)],
  'sfx-brick-place': [noise('lowpass', 800, 200, 0.1, 0.4), tone('triangle', 330, 220, 0.1, 0.25)],
  'sfx-chain-lock': [noise('highpass', 2000, 800, 0.18, 0.35), tone('square', 180, 120, 0.12, 0.2, 0.05), tone('sine', 90, 70, 0.2, 0.3, 0.1)],
  'sfx-scroll-restore': [tone('sine', 400, 1200, 0.4, 0.2), ...notes([784, 988, 1175], 'sine', 0.1, 0.25, 0.2)],
  'sfx-ball-hum': [tone('sine', 220, 330, 0.5, 0.18), tone('sine', 224, 336, 0.5, 0.14)],
  'sfx-jadugar-laugh': [tone('square', 300, 260, 0.1, 0.14), tone('square', 340, 280, 0.1, 0.14, 0.14), tone('square', 320, 240, 0.14, 0.14, 0.28)],
  'sfx-laugh': [tone('square', 300, 260, 0.1, 0.12), tone('square', 330, 270, 0.1, 0.12, 0.13), tone('square', 310, 230, 0.12, 0.12, 0.26)],
  'sfx-backup-hold': [tone('sine', 300, 700, 1, 0.1)],
  'sfx-backup-done': [...notes([660, 880, 1320], 'sine', 0.08, 0.3, 0.25), noise('highpass', 4000, 8000, 0.3, 0.06)],
  'sfx-map-step': [tone('triangle', 400, 500, 0.05, 0.15), tone('triangle', 500, 400, 0.05, 0.12, 0.1)],
  'sfx-map-locked': [tone('square', 200, 150, 0.15, 0.2), tone('square', 180, 130, 0.15, 0.2, 0.17)],
  'sfx-round': [tone('sawtooth', 220, 440, 0.3, 0.22), tone('sine', 110, 110, 0.4, 0.3)],
  'sfx-fight': [tone('square', 440, 880, 0.15, 0.2), noise('highpass', 1000, 3000, 0.2, 0.15)],
  'sfx-ko': [tone('sawtooth', 600, 60, 1.1, 0.3), noise('lowpass', 1200, 80, 0.9, 0.35)],
  'sfx-teleport': [tone('sine', 1500, 200, 0.3, 0.2), noise('bandpass', 2000, 300, 0.3, 0.15)],
  'sfx-beam-hit': [noise('highpass', 3000, 6000, 0.08, 0.2), tone('sine', 1200, 1800, 0.08, 0.15)],
  'sfx-shield': [tone('sine', 300, 700, 0.25, 0.25), noise('bandpass', 1500, 1500, 0.2, 0.15)],
  'sfx-letter-land': [noise('highpass', 2500, 1500, 0.08, 0.2)],
  'sfx-shockwave': [tone('sine', 140, 40, 0.5, 0.45), noise('lowpass', 600, 80, 0.4, 0.3)],
  'sfx-gift-throw': [noise('bandpass', 800, 1800, 0.2, 0.2)],
  'sfx-gift-pop': [tone('sine', 600, 1500, 0.1, 0.25), noise('highpass', 3000, 5000, 0.1, 0.15)],
  'sfx-gift-open': [tone('sine', 500, 1100, 0.12, 0.22), noise('bandpass', 2000, 900, 0.25, 0.2, 0.06)],
  'sfx-gift-sparkle': notes([1500, 2000, 2600], 'sine', 0.05, 0.12, 0.15),
  'sfx-bugs': [noise('bandpass', 3000, 3000, 0.5, 0.2), tone('sawtooth', 180, 160, 0.5, 0.08)],
  'sfx-bug-buzz': [tone('sawtooth', 200, 180, 0.3, 0.06)],
  'sfx-deepfake': [tone('sawtooth', 500, 250, 0.4, 0.18), tone('sawtooth', 507, 253, 0.4, 0.18)],
  'sfx-codeword-lock': [tone('square', 800, 800, 0.05, 0.2), tone('square', 400, 400, 0.12, 0.25, 0.07)],
  'sfx-key-right': notes([784, 1047, 1568], 'triangle', 0.08, 0.2),
  'sfx-key-wrong': [tone('sawtooth', 220, 110, 0.35, 0.3)],
  'sfx-confetti': [noise('highpass', 4000, 9000, 0.5, 0.18), ...notes([1047, 1319, 1568], 'sine', 0.06, 0.2, 0.05)],
  'sfx-combo': [tone('square', 700, 1400, 0.1, 0.18)],
  'sfx-broom': [noise('bandpass', 1500, 600, 0.18, 0.25)],
  'sfx-greet': [tone('sine', 700, 900, 0.1, 0.2), tone('sine', 900, 1100, 0.12, 0.2, 0.1)],
  'sfx-reveal': [tone('sine', 400, 1000, 0.18, 0.22), noise('highpass', 3500, 7000, 0.12, 0.12)],
  'sfx-ghost-whoosh': [noise('bandpass', 400, 1600, 0.45, 0.22), tone('sine', 300, 180, 0.45, 0.1)],
  'sfx-hammer-hit': [noise('lowpass', 900, 100, 0.22, 0.5), tone('sine', 160, 50, 0.22, 0.4)],
  'sfx-horse': [tone('square', 140, 120, 0.06, 0.2), tone('square', 130, 110, 0.06, 0.2, 0.14), tone('square', 140, 120, 0.06, 0.2, 0.28)],
  'sfx-throw': [noise('bandpass', 700, 1500, 0.15, 0.2)],
  'sfx-wall-break': [noise('lowpass', 1200, 100, 0.55, 0.5), tone('sine', 120, 40, 0.5, 0.4)],
  'sfx-wall-up': [tone('triangle', 330, 660, 0.18, 0.25), tone('triangle', 660, 990, 0.18, 0.2, 0.12)],
  // the Face-to-Face Showdown (Level 3)
  'sfx-attack-fly': [noise('bandpass', 500, 1500, 0.45, 0.15)],
  'sfx-defend-lantern': [tone('sine', 400, 1400, 0.35, 0.22), noise('highpass', 4000, 8000, 0.25, 0.12)],
  'sfx-defend-shield': [tone('sine', 250, 600, 0.3, 0.3), tone('triangle', 500, 900, 0.3, 0.2, 0.05)],
  'sfx-defend-scroll': [tone('sine', 500, 1100, 0.3, 0.2), ...notes([880, 1320], 'sine', 0.1, 0.2, 0.25)],
  'sfx-defend-code': [tone('square', 900, 900, 0.05, 0.2), tone('sine', 1200, 1800, 0.3, 0.2, 0.08)],
  'sfx-bounce': [tone('sine', 300, 900, 0.2, 0.25), noise('highpass', 2000, 4000, 0.1, 0.12, 0.15)],
  'sfx-heart-lost': [tone('sawtooth', 400, 100, 0.4, 0.3), noise('lowpass', 800, 100, 0.3, 0.3)],
  'sfx-defence-press': [tone('sine', 700, 900, 0.05, 0.15)],
};

class AudioManager {
  constructor() {
    this.game = null;
    this.ctx = null;
    this.out = null; // master gain of all effects
    this.music = null; // the Phaser sound that plays now
    this.musicKey = null;
    this.fadeTimer = null;
    this.ducked = false;
    this.noiseBuffer = null;
  }

  // called once (by main.js, and by playSfx if it was forgotten)
  init(game) {
    if (this.game) return;
    this.game = game;
    try {
      const ctx = game.sound && game.sound.context;
      if (ctx) {
        this.ctx = ctx;
        this.out = ctx.createGain();
        this.out.connect(ctx.destination);
        this.applyVolumes();
      }
    } catch (e) {
      this.ctx = null;
    }
  }

  // ---------- volumes ----------

  musicLevel() {
    return audioSettings.mute ? 0 : audioSettings.music * (this.ducked ? DUCK : 1);
  }

  applyVolumes() {
    if (this.out) this.out.gain.value = audioSettings.mute ? 0 : audioSettings.sfx;
    if (this.music) this.music.setVolume(this.musicLevel());
  }

  setMusic(v) {
    audioSettings.music = Math.min(1, Math.max(0, v));
    save();
    this.applyVolumes();
  }

  setSfx(v) {
    audioSettings.sfx = Math.min(1, Math.max(0, v));
    save();
    this.applyVolumes();
  }

  setMute(on) {
    audioSettings.mute = !!on;
    save();
    this.applyVolumes();
  }

  // the chat is open: music 40% quieter
  duck(on) {
    this.ducked = on;
    this.applyVolumes();
  }

  // ---------- music ----------

  // Plays the music with this key (loop). The old music fades out while the new one fades in (about 1 s).
  playMusic(key) {
    const game = this.game;
    if (!game || key === this.musicKey) return;
    this.musicKey = key;
    clearInterval(this.fadeTimer);
    const old = this.music;
    let next = null;
    try {
      if (game.cache.audio.exists(key)) {
        next = game.sound.add(key, { loop: true, volume: 0 });
        next.play();
      }
    } catch (e) {
      next = null;
    }
    this.music = next;
    const start = performance.now();
    const oldStart = old ? old.volume : 0;
    this.fadeTimer = setInterval(() => {
      const k = Math.min(1, (performance.now() - start) / FADE_MS);
      try {
        if (next) next.setVolume(this.musicLevel() * k);
        if (old) old.setVolume(oldStart * (1 - k));
      } catch (e) {
        // a sound that was destroyed: ignore
      }
      if (k >= 1) {
        clearInterval(this.fadeTimer);
        try {
          if (old) old.destroy();
        } catch (e) {
          // ignore
        }
      }
    }, 40);
  }

  // Loads the music of a group in the background (the game keeps running), then plays it.
  // groupFiles = the list from src/data/assetList.js
  loadAndPlay(scene, key, files) {
    if (this.game.cache.audio.exists(key)) {
      this.playMusic(key);
      return;
    }
    const list = files.filter((f) => f.type === 'audio' && f.key === key);
    if (!list.length) return;
    list.forEach((f) => scene.load.audio(f.key, f.path));
    scene.load.once('complete', () => this.playMusic(key));
    scene.load.start();
  }

  // ---------- sound effects ----------

  sfx(key) {
    if (!this.game) return;
    if (audioSettings.mute || audioSettings.sfx <= 0) return;
    try {
      // a real file with this key wins over the recipe
      if (this.game.cache.audio.exists(key)) {
        this.game.sound.play(key, { volume: audioSettings.sfx });
        return;
      }
      const ctx = this.ctx;
      if (!ctx || ctx.state !== 'running') return;
      (SFX[key] || SFX['sfx-click']).forEach((layer) => this.play(ctx, layer));
    } catch (e) {
      // a sound must never break the game
    }
  }

  play(ctx, layer) {
    const t0 = ctx.currentTime + layer.at;
    const t1 = t0 + layer.d;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, layer.v), t0 + Math.min(0.01, layer.d / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);
    gain.connect(this.out);
    if (layer.n === 'tone') {
      const osc = ctx.createOscillator();
      osc.type = layer.t;
      osc.frequency.setValueAtTime(layer.f[0], t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, layer.f[1]), t1);
      osc.connect(gain);
      osc.start(t0);
      osc.stop(t1 + 0.02);
    } else {
      const src = ctx.createBufferSource();
      src.buffer = this.getNoise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = layer.t;
      filter.frequency.setValueAtTime(layer.f[0], t0);
      filter.frequency.exponentialRampToValueAtTime(Math.max(20, layer.f[1]), t1);
      src.connect(filter);
      filter.connect(gain);
      src.start(t0);
      src.stop(t1 + 0.02);
    }
  }

  getNoise(ctx) {
    if (!this.noiseBuffer) {
      const length = ctx.sampleRate; // one second of white noise, reused
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }
}

export const audio = new AudioManager();
export const SFX_NAMES = Object.keys(SFX);
