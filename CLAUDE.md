# Sindhu Defenders — Project Brief

A 2D browser game for the **Sindh STREAM Journey 2026-27** competition (District Shaheed Benazirabad), **Theme 2: AI, Gamification, Cyber Security**. School students (class 7-9) will present it and must be able to explain how it works. The game has exactly **3 levels** (Sann Gate, Amri Gate, Miri Fort). Quality bar: this must look and feel like a polished commercial mobile game. No placeholder-looking graphics in the final build, no stutter, no jank.

## Story
Ranikot Fort (Jamshoro, Sindh) is called the "Great Wall of Sindh" — its wall is about 31 km long and it has four gates: **Sann Gate, Amri Gate, Shah-Pere Gate, Mohan Gate**, with **Miri Fort** inside. In the game, Ranikot = the player's phone/network, and its wall = the firewall. A learning **AI Hacker** sends cyber attacks shaped as cartoon monsters. The player defends the fort by using the *correct* cyber-security action against each attack, not just by dodging.

## Characters (original designs — never copy existing cartoon characters)
- **Dodo** (boy hero) / **Marvi** (girl hero, selectable) — chibi style, big round head, big expressive eyes, colourful **Sindhi topi**, red-and-indigo **Ajrak cape** that flows when running. Names come from Sindhi folk heroes.
- **Mithu** — a cute green parrot (tota), the player's AI guide. Flies beside the hero, gives hints in short, simple lines ("Wait, Dodo! This link is fake!"). Not a robot.
- **Villain: Jadugar Hacker** — the AI. Sits on a hill outside the fort with a glowing crystal ball, watches the player, and sends monsters. The crystal ball glows in the Jadugar portrait of the HUD while he plans.
- **Monsters** — round, squishy, funny-scary cartoon blobs. No robots.

## Core rule: cyber security is a game MECHANIC, never a reading quiz
No screens of links or messages to read under time pressure. Every attack is a monster whose *behaviour* is the attack, and every defence is a hero *power* or action. Text appears only as short Mithu hints and the end report.

| Monster | Real attack | What it does in the game | How the player beats it (the lesson) |
|---|---|---|---|
| **Behroopia Qasid** | Phishing | Walks to the gate disguised as a friendly villager/messenger among real villagers. Let in, it steals coins. | Shine the **Sach ki Lalten** (lantern) on it: the disguise falls and a tiny tell (wrong badge colour, hidden tail) is revealed. Lesson: check before you trust. |
| **Hathoda Dev** | Brute-force password guessing | Big brutes hammer the wall; weak wall sections crack fast. | Collect letter / number / symbol **bricks** around the courtyard and slot them into the wall. Longer + mixed = stronger glow and real crack time from zxcvbn. Lesson: long, mixed passwords. |
| **Trojan Ghoda** | Malware in "free" stuff | A wooden horse cart rolls in dropping shiny "FREE" gifts that look like coins/power-ups. Pick one up and a bug swarm bursts out. | Ignore or kick away the gifts; sweep bugs with the **Antivirus Jharoo**. Lesson: free gifts from strangers are traps. |
| **Taala Bhoot** | Ransomware | Lock ghosts chain up buildings. | Instantly unlock a building that was **backed up** earlier (hold E next to it; a scroll flies to the Kutubkhana shelf). No backup = a long 8 s unlock bar. Lesson: keep backups. |
| **Boss: Nakal Jadugar** | Deepfake / voice clone | Level 3 showdown: he throws a fake letter, a FREE gift, a hammer, a chain and a Mithu-voice bubble; in the finale he becomes a fake Mithu face to face and asks for the gate key. | Pick the right defence (1 Lantern, 2 Password Shield, 3 Backup Scroll, 4 Code Word). The **secret code word** the player chose at the start reveals the fake Mithu. Lesson: verify with a family code word. |

## Core loop (per level; every level has 2 waves so the AI can re-plan between them)
1. **Tayyari (prep, 15-25 s):** collect bricks, back up buildings, upgrade the wall.
2. **Hamla (attack wave, ~90 s):** monsters arrive from gates; use powers.
3. **Natija (result):** stars, coins, and what the AI learned about you.

## Controls (simple enough for a class-7 student)
Levels 1-2: arrow keys / WASD = move · **Space** = jump · hold **Q** = Sach ki Lalten (Dodo stands still and the arrow keys / WASD turn the light beam; soft aim help) · **E** = use: greet a friend, sweep bugs, pick up / place a brick, unlock a building; **hold E for 1 s** next to a building = backup.
Level 3: nobody walks. Keys **1-4** (or click the 4 big buttons): 1 Lantern, 2 Password Shield, 3 Backup Scroll, 4 Code Word.
**Esc** = pause menu (Resume, Ask Mithu, Quit) · World Map: arrow keys walk, Enter / E plays · Title: arrow keys + Enter move a gold focus ring over the buttons.

## Ask Mithu (local AI chatbot, English only) - knowledge base + RAG
- Opened from the title screen ("Ask Mithu") or the pause menu (Esc). Opening it pauses the game; closing resumes. It is a normal HTML panel (`src/ui/chat/`) so typing, Enter and Esc work like a web page. History is kept in memory only (max 20 messages, "Clear" button).
- **Knowledge base** (`src/data/projectKnowledge.js`, text in `src/data/knowledge/`): about 50 small titled **chunks** (100-180 words each: project, story and design choices, every level, every monster, the AI in depth, the chatbot, every technology and why, glossary, safety tips for kids and parents, presentation help and judge questions) plus about 120 FAQ pairs (`faq.js`, several phrasings each). **When the game changes, update the chunks and the FAQ too** (and `npm run test:chat`).
- **Glossary (deterministic)**: every cyber-security / AI term has its OWN chunk in `src/data/knowledge/glossary.js` (phishing, password, brute force, malware, virus, trojan, ransomware, backup, firewall, OTP, 2FA, deepfake, voice clone, code word, hacker, AI, TF-IDF, LLM, RAG): definition, real-life example, the monster / level of our game, how to defend. `src/ai/termRouter.js` is a keyword router that runs BEFORE TF-IDF (regular expressions incl. synonyms such as "ransom", "locked files", "fake link", "code on my phone"): the chunk of a term in the question is ALWAYS the first chunk sent to Ollama, and offline Mithu answers directly from it. "Which cyber security terms are used in this game?" returns the list (every term, one line) without the model. The FAQ pairs for the terms are made from the glossary. **When you add a term, add its words and check-words in glossary.js and a 3-question row in `scripts/chat-test.mjs`.**
- **Retrieval (RAG)**: `src/ai/retriever.js` = TF-IDF + cosine similarity + a small synonym list ("js" -> javascript, "zxcvbn/zxc" -> password checker, "lvl" -> level, "bot" -> chatbot ...). `src/ai/knowledgeSearch.js` finds the best 3-4 chunks for a question (a very short follow-up like "why?" borrows the question before it).
- **Engine A (main): Ollama** on the same computer. One-time setup: install Ollama, then `ollama pull qwen2.5:1.5b`. Settings in `src/data/chatConfig.js` (model, temperature 0.3, num_ctx 4096). The browser calls `/ollama/...`; `vite.config.js` proxies it to `http://localhost:11434` for BOTH `npm run dev` and `npm run preview`. The reply is streamed into the bubble. The system prompt (`src/ai/chatEngine.js`) is short: Mithu's rules (only this project and cyber safety, simple English for 12-year-olds, up to 6 short sentences, real details, one follow-up suggestion, redirect other topics) + ONLY the retrieved chunks + the LIVE game data (`HackerBrain.getState()` and the score, `src/ai/chatContext.js`).
- **Engine B (fallback, always works offline): `src/ai/faqBot.js`**: glossary router (term / list) first, then exact question -> FAQ pair, else the best FAQ pair by TF-IDF (score >= 0.3), else the first 2-3 sentences of the best knowledge chunk (score >= 0.1), else Mithu says what he can talk about. "What has the AI learned about me" is built from `getState()`. The player never sees a raw error.
- Used automatically if Ollama does not answer a quick check within 2 seconds, or if it errors. The status dot in the chat header is green "AI model" (Ollama) or amber "Offline mode" (FAQ). If Ollama is not running, the proxy answers with a harmless JSON message (no 404/500 in the browser console).
- **`npm run test:chat`** (`scripts/chat-test.mjs`): every glossary term asked 3 different ways with an assertion that the answer contains the term's key words, the list question, and 38 sample questions, all in offline mode. Prints a pass/fail summary (exit code 1 on a failure) and writes `chat-test-results.md`. All must pass.
- Music gets 40% quieter while the chat is open.

## Levels
Exactly **3 levels** (Shah-Pere Gate and Mohan Gate exist only as real gates of Ranikot in the story and in the map picture, NOT as levels or nodes). The title screen "Play" opens the **World Map**; "Levels" is a simple list that is also the fallback if the map fails to load. Stars are saved in localStorage (`src/data/progress.js`).
1. **Sann Gate** (scene `Level`) - Behroopia Qasid (phishing) + Trojan Ghoda. Steps: intro, Tayyari (15 s), wave 1 (40 s, villagers + Behroopias), AI re-plan, wave 2 (55 s, adds the Trojan Ghoda, driven by HackerBrain's plan), results. 1+ star unlocks Amri Gate. Starting this level begins a NEW RUN (the AI forgets the old one).
2. **Amri Gate** (scene `Level2`) - Hathoda Dev (passwords) + Taala Bhoot (ransomware + backup). Steps: intro, Tayyari (25 s), wave 1 (Hathoda only, 45 s), AI re-plan, wave 2 (Hathoda + Taala, 50 s), results. 1+ star unlocks Miri Fort.
   - Three wall sections (LEFT, CENTER, RIGHT), each with a password plaque. Password **bricks** (lowercase clay brown, UPPERCASE red, numbers blue, symbols gold) lie around the yard. **E** picks up a brick (up to **5** on Dodo's head) and places the top one on a wall section's password. Strength comes from **zxcvbn** (`src/ai/passwordAI.js`): password, strength bar, crack time in words.
   - **Hathoda Dev** hammers the wall section HackerBrain chooses; damage goes down with the crack time. Each hit sends a shockwave ring: jump over it (Space) or Dodo is knocked back and drops his bricks. A broken wall can be rebuilt.
   - **Backup**: next to a building that is not backed up the prompt "Hold E: Backup" shows; holding E for 1 s fills a ring, then a scroll flies by itself (arc + sparkle trail) to the Kutubkhana shelf and the building gets a "Backed up" badge. **Taala Bhoot** chains a building (buildings without a backup first) and it slowly drains coins. A LOCKED building cannot be backed up. E at a locked building: backed up = instant restore, not backed up = an 8 s unlock bar.
   - **E priority** (ONE prompt at a time): wall section + carrying bricks -> place; brick nearby -> pick up; building not backed up (and not locked) -> hold to back up; locked building -> unlock (`findInteraction()` in `Level2Scene.js`; prompt = `src/ui/KeyHint.js`).
   - Background: `amri-gate-bg` if present (area in `src/level/amriArt.js`), else the Level 1 courtyard with a reddish tint.
3. **Miri Fort - the Face-to-Face Showdown** (scene `Boss` + HUD scene `BossUI`; files: `src/scenes/BossScene.js`, `BossUIScene.js`, `src/boss/`, `src/ai/BossBrain.js`). Side-view fighting-game stage, 1280x720, fixed camera. Background `miri-fort-bg.*` if present, else the arena drawn in `src/level/bossArena.js`. **No movement, no reading**: one clear action per attack.
   - Stage: Dodo LEFT (big, the real Dodo art with idle breathing, defend / hit / celebrate tweens, `src/boss/DodoFigure.js`), the Jadugar RIGHT (large, floating crystal ball, taunt / hit / angry animations), Mithu flies near Dodo. HUD: two big bars with portraits (Dodo's bar = 5 hearts, Jadugar's bar = 15 hits) with a delayed ghost part, round counter, combo counter, "ROUND n - FIGHT!" with camera zoom, hit sparks, hit-stop, screen shake, "K.O.!" in slow motion.
   - Start: Mithu whispers, the player picks a code word card (Mango, Matka, Ajrak, Camel) with a lock animation (`CodeWordPicker.js`).
   - Core mechanic: the Jadugar throws ONE attack at a time (a big picture along an arc with a timer ring, `FlyingAttack` in `showdownParts.js`). Under the stage 4 big buttons (also keys 1-4): **1 Lantern (Check), 2 Password Shield, 3 Backup Scroll, 4 Code Word**. Fake letter -> 1, FREE gift -> 1, giant hammer (brute force) -> 2, padlock chain (ransomware) -> 3, Mithu-voice bubble (deepfake) -> 4. Right defence: flashy animation (lantern beam burns it / glowing Ajrak wall / scroll shatters the chain / code word lock stamps FAKE), the attack bounces back, hurts the Jadugar, combo +1. Wrong or late: the attack hits Dodo (-1 of 5 hearts) and Mithu says the right defence and why in one line. A button with nothing in the air does nothing.
   - Rounds (numbers at the top of `BossScene.js`): Round 1 (tutorial) letters, gifts, hammer, 5 s, Mithu hints the button the first time and it glows; Round 2 + padlock chains, 3.5 s, no hints; Round 3 + the Mithu voice, 2.5 s, up to 2 in the air. 5 right answers end rounds 1 and 2; after 14 hits the **finale**: the Jadugar becomes a fake Mithu face to face and asks for the key, button 4 -> K.O. (a wrong button costs a heart and he asks again). +1 heart between rounds.
   - Lose = retry card with one tip for the most-missed attack; **Try again starts at the current round** (same code word). Win: K.O., ball cracks, the Jadugar shrinks into a puff, confetti + Ajrak banners (`Celebration.js`), then the Cyber Rakshak certificate. Stars: 4-5 hearts left 3 stars, 2-3 hearts 2, else 1.
4. **World Map** (scene `WorldMap`): `ranikot-map.*` if present, else a parchment map drawn in code. Only 3 nodes: Sann Gate, Amri Gate, Miri Fort (positions = fractions of the picture at the top of the file). Dodo walks along the paths (arrow keys or click, Enter / E plays), nodes show stars and locks, a bottom card shows name, monster icons and lesson.
5. **Certificate** (scene `Report`): "Cyber Rakshak": the player types a name (HTML input via Phaser DOM), total stars (of 9), 5 lessons, final AI report incl. what the boss learned (the attack missed most), Humans vs AI tally. Play again / Menu.

## AI systems (must be real, visible and explainable to a 13-year-old)
1. **Adaptive AI Hacker (Jadugar)** - tracks, per attack type and per variant, how often the player fails (`(fails+1)/(faced+2)`). It adapts three things: which monster types to send, which disguises the phishers use, and which wall side the brutes attack (the weakest one). Exploit ~85%, explore ~15%. Keep the logic in one small readable module: `src/ai/HackerBrain.js`. Level 2 adds the items `wall_left`, `wall_center`, `wall_right` (fail = section broken) and `building_kutubkhana`, `building_anaaj`, `building_ghar` (fail = locked without a backup); the same formula and rule are used.
2. **Run memory** (`src/ai/runMemory.js`, localStorage): Level 1 starts a new run, every level saves HackerBrain's counts when it ends, Level 2 and the boss load them (`HackerBrain.loadStats`). The boss also saves what it learned in the fight (for the certificate). Ctrl+Shift+R clears it.
3. **Boss AI** (`src/ai/BossBrain.js`, same formula and 85/15 rule): per attack type (phishing, trojan, hammer, ransom, deepfake) it counts `used` and `wrong` (answered wrong or too late); score `(wrong+1)/(used+2)`. `choose()`: 85% exploit (weights = score squared), 15% explore (random); never the same attack 3 times in a row. It STARTS with the weaknesses of Levels 1 and 2 (`seedFrom`: phishing, opened gifts, broken walls, buildings locked without a backup). When he exploits a known weak spot (`isExploiting`) he taunts in a speech bubble ("You never check gifts! Take this!", "Your passwords are weak!") - the taunt keys are `boss.taunt.*`.
4. **Jadugar portrait** (top-right of the HUD, round frame with an Ajrak border): smirks when idle, laughs when something gets in, looks angry when Dodo catches one, and its crystal ball glows while the AI re-plans.
5. **Password AI** (`src/ai/passwordAI.js`) - zxcvbn estimates the crack time of every wall password; it also sets how hard Hathoda's hammer hits.
6. **End report** - "AI Hacker ki report": biggest weakness + one tip, a running "Insaan vs AI Hacker" tally, and (after the boss) what the boss learned in the fight.

## Tech
- **Phaser 4** (latest stable) + **Vite**, plain JavaScript (ES modules). No TypeScript.
- Scenes: `Boot`, `Preload` (title screen files only), `Loading` (the heavy art of one level, with the styled loading bar), `Menu`, `WorldMap`, `Level` (Level 1), `Level2` (Level 2), `UI` (HUD of the levels, in parallel), `Boss` + `BossUI` (Level 3 and its HUD), `Report` (the certificate). Every scene class is wrapped by `protectScene` (`src/systems/safeScenes.js`): an error shows a friendly "Back to menu" panel instead of freezing.
- Folder layout:
  ```
  src/
    main.js            game config
    scenes/            one file per scene
    objects/           Player, Mithu, monsters (one class each)
    ai/                HackerBrain.js, BossBrain.js, runMemory.js, chatEngine.js, retriever.js, termRouter.js, knowledgeSearch.js, faqBot.js, chatContext.js, passwordAI.js
    boss/              showdownParts.js (defences, FlyingAttack), DodoFigure.js, CodeWordPicker.js, Celebration.js
    audio/             AudioManager.js (music + procedural sound effects)
    systems/           sceneFlow.js (goToScene + Loading), safeScenes.js, perfWatch.js (auto low graphics), exhibition.js (judge mode / next visitor), visitorReset.js
    data/              levels.js, settings.js, assetList.js, progress.js, projectKnowledge.js + knowledge/ (chunks, faq)
    i18n/              en.js, ur.js, index.js (all game text, English + Urdu)
    ui/                reusable buttons, panels, dialogue box, chat/ (Ask Mithu)
  scripts/             chat-test.mjs (test:chat), e2e.mjs (test:e2e), optimize-assets.mjs (optimize)
  art-src/             original big pictures (NOT served, not in the build)
  start-game.bat, README.md, TESTING.md
  public/assets/
    characters/  monsters/  ui/  fx/  audio/  fonts/  backgrounds/
  ```
- Target resolution 1280×720, `Scale.FIT`, centred. Must also work on a 1366×768 school laptop.
- Must run **fully offline** after `npm run build` (fonts, audio, images all local, no CDN).

## Audio (`src/audio/AudioManager.js`)
- Music files in `public/assets/audio`: **music-menu.mp3** (title, map, certificate; loaded in the background after the title shows), **music-level.mp3** (Levels 1-2), **music-boss.mp3** (Level 3). Level music is loaded by the Loading scene. `audio.playMusic(key)` crossfades about 1 s. The chat ducks it by 40%.
- Volumes (music, sounds) and **mute** are saved in localStorage (try/catch). Sound unlocks on the first click / key (Phaser).
- **There are no sound-effect files.** Every sound slot used by `playSfx(scene, 'sfx-...')` has a small procedural WebAudio recipe (`SFX` table in `AudioManager.js`), so no action is silent. If a real file is later added with the same key in `GROUP_DEFS`/audio (e.g. 'sfx-jump'), the file is played instead. Mapping slot -> recipe, by action:
  - UI: click, defence-press · Dodo: jump, land, hit, lantern, greet, coin, win
  - Level 1: reveal, throw, horse, gift-open, gift-sparkle, bugs, bug-buzz, broom, laugh, jadugar-laugh, ball-hum
  - Level 2: brick-pick, brick-place, wall-up, wall-break, hammer-hit, shockwave, ghost-whoosh, chain-lock, backup-hold, backup-done, scroll-restore
  - World Map: map-step, map-locked
  - Level 3: round, fight, ko, teleport, attack-fly, defend-lantern, defend-shield, defend-scroll, defend-code, bounce, heart-lost, beam-hit, combo, deepfake, codeword-lock, key-right, key-wrong, confetti

## Assets and loading
- Big pictures are **WebP, at most 1920 px wide** (`npm run optimize`; originals are in `art-src/`). Only the title screen files load at start (cold start under 4 s); each level's art and music load in the `Loading` scene (`GROUP_DEFS` in `src/data/assetList.js`, `goToScene()`). Dodo's eye / shoulder positions are measured in the ORIGINAL 2752 px picture (the crop in the registry is converted in `PreloadScene`); the courtyard is always 2752 px wide in the game (`CourtyardArt.js`). Nothing loads from the internet. The fonts are Fredoka (4 weights) and optionally Noto Nastaliq Urdu.
- **Auto low graphics**: under 40 FPS for 5 s -> Low graphics on (saved) and a toast (`src/systems/perfWatch.js`).

## Exhibition / judge mode (`src/systems/exhibition.js`)
- **Ctrl+Shift+J** judge mode (not saved): all 3 levels open, intros skippable (Enter / Space / click), "JUDGE MODE" tag. **Ctrl+Shift+R** next visitor: clears stars, AI memory and player name, keeps the Humans vs AI tally, back to the title. 60 s idle on the title = **attract mode** (`src/ui/AttractMode.js`). The title shows the big Humans vs AI scoreboard. Dev keys (C, I, F, J, K) only exist in dev builds.

## Launch, tests, docs
- `start-game.bat` (Windows one click: Ollama if installed, build only when dist is missing or older than the code, `vite preview` with the /ollama proxy, Chrome kiosk), `README.md` (install, run, update, judge keys), `TESTING.md` (manual playtest checklist), `npm run test:chat`, `npm run test:e2e` (full scripted pass title -> map -> L1 -> L2 -> L3 -> certificate, English + Urdu, low graphics on/off, fails on any console error).
- Credits screen reads `src/data/credits.js` (school, teacher and students are placeholders to fill in).

## Performance rules (no hangs, ever)
- Pack images into texture atlases; preload everything in `Preload` with a styled progress bar.
- Object pooling for monsters, projectiles and particles. No `new` inside `update()`.
- Cap particle emitters; destroy or pool off-screen objects.
- Dev-only FPS meter (toggle with `F`). Target steady 60 FPS.
- Provide a "Low graphics" toggle (fewer particles, no screen shake/blur).

## Animation and feel rules
- Characters are built from separate parts (head, body, arms, cape, eyes) and animated with tweens: idle breathing, blinking, cape sway, squash-and-stretch on jump/land/hit, bob while walking, flip on direction change.
- Every action gets juice: easing (`Back`, `Sine`, `Cubic`), hit-stop, small screen shake, particles, sound.
- Scene changes use fades/wipes, never hard cuts. Buttons scale on hover/press.
- Respect a "reduced motion" setting.
- Until real art exists, use clean temporary shapes with the same sizes/anchors as the final art, and keep asset keys stable so art can be swapped without code changes.

## Text and language
- **English is the default language.** Urdu (real Urdu script, Noto Nastaliq Urdu font) is the second option. Both live in `src/i18n/` (`en.js`, `ur.js`). A missing Urdu key shows the English text.
- **No player-facing text in scenes.** Every word is a key in `src/i18n/en.js` + `ur.js`; scenes use `t('menu.play')` or `addText(scene, x, y, 'menu.play', style)` (from `src/i18n/i18nText.js`), so all visible text changes the moment the language is switched. Keep the keys in both files in the same order.
- Game names stay in English letters in every language: Sindhu Defenders, Ranikot, Dodo, Mithu, Behroopia Qasid, Sach ki Lalten.
- English text is simple and natural for a class-7 student. Mithu's lines stay short.
- The player switches language in Settings (drop-down) or with the globe button on the title screen. The choice is saved in localStorage (inside try/catch).
- Urdu needs extra line height (Nastaliq letters are tall) and right-to-left lines; `src/i18n/index.js` handles this (`styleFor`, `prepare`). Put `NotoNastaliqUrdu-*.ttf` in `public/assets/fonts` to use the real font; without it a system Urdu font is used.
- Use fictional bank/app names only (e.g. "Mehran Bank"). Never real brand names in scam examples.

## Working style for this project
- Build step by step; after each step the game must run with `npm run dev`.
- Code is read by school students: small files, clear names, short comments in simple English.
- After every step, finish with a short section **"Bachon ke liye"** in Roman Urdu: 3-5 lines explaining what was built and how it works, in words a class-8 student can repeat to a judge.