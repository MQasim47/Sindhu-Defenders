# Sindhu Defenders

A 2D cyber-safety game about **Ranikot Fort** (the Great Wall of Sindh) for the *Science in Sindh STREAM Journey 2026-27*,
District Shaheed Benazirabad, **Theme 2: AI, Gamification and Cyber Security**.
Dodo defends the fort from a learning **AI Hacker** (the Jadugar) in **3 levels**: Sann Gate, Amri Gate and the Miri Fort showdown.
Mithu the parrot is a local AI chatbot that can answer any question about the project.

English and Urdu. Runs fully offline after the build.

## Install (once)

1. **Git** - https://git-scm.com
2. **Node.js** (version 20 or newer) - https://nodejs.org
3. **Ollama** (for Mithu's AI model; optional, Mithu also works offline without it) - https://ollama.com
   then, in a terminal: `ollama pull qwen2.5:1.5b`
4. Get the game and its files:

   ```
   git clone https://github.com/MQasim47/Sindhu-Defenders.git
   cd Sindhu-Defenders
   npm install
   ```

## Run

**Windows, one click:** double-click **`start-game.bat`**. It starts Ollama if needed, builds the game only if it
changed, starts the game server and opens Chrome full screen (kiosk). Close the window (Alt+F4) to stop.

By hand:

```
npm run dev       # development server with hot reload (also http://localhost:5173)
npm run build     # make the offline version in dist/
npm run preview   # serve dist/ (also passes the chat to Ollama), http://localhost:4173
```

## Update (when the team has pushed a new version)

```
git pull
npm install
```

Then start the game again. `start-game.bat` rebuilds automatically when the code is newer than `dist/`.

## Exhibition / judge mode

| Keys | What it does |
|---|---|
| **Ctrl+Shift+J** | **Judge mode** on/off: all 3 levels open, intros can be skipped (Enter / Space / click), a small "JUDGE MODE" tag shows. Not saved: a reload starts normally. |
| **Ctrl+Shift+R** | **Next visitor**: clears the stars, the AI's memory and the player name (keeps the overall Humans vs AI score) and goes back to the title. |
| 60 s idle on the title | **Attract mode**: a looping showcase of the 3 levels, the monsters and their lessons, and "Can you beat our AI Hacker?". Any key or click ends it. |

The title screen shows the big **Humans vs AI Hacker** scoreboard.

## Controls

Level 1 and 2: arrow keys / WASD move, **Space** jumps, hold **Q** = lantern, **E** = use (hold **E** near a building = backup).
Level 3: nobody walks. Press **1** Lantern, **2** Password Shield, **3** Backup Scroll, **4** Code Word (or click the big buttons).
**Esc** = pause. World Map: arrow keys walk, Enter / E plays.

## Tests

```
npm run test:chat   # Mithu offline: every cyber-security term asked 3 ways + 38 sample questions -> chat-test-results.md
npm run test:e2e    # scripted full pass title -> map -> Level 1 -> 2 -> 3 -> certificate, English + Urdu, low graphics on/off
npm run optimize    # shrink new big pictures to WebP (originals go to art-src/)
```

A human playtest checklist is in [TESTING.md](TESTING.md). Project notes for developers are in [CLAUDE.md](CLAUDE.md).

## Where things are

`src/` code (scenes, objects, ai, boss, audio, ui, i18n, data) - `public/assets/` pictures, music, fonts - `art-src/` original big pictures (not served) -
`scripts/` test and tool scripts - `start-game.bat` one-click launch.
Names of the school, teacher and students for the Credits screen: `src/data/credits.js`.
