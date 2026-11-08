# Sindhu Defenders — Project Brief

A 2D browser game for the **Sindh STREAM Journey 2026-27** competition (District Shaheed Benazirabad), **Theme 2: AI, Gamification, Cyber Security**. School students (class 7-9) will present it and must be able to explain how it works. Quality bar: this must look and feel like a polished commercial mobile game. No placeholder-looking graphics in the final build, no stutter, no jank.

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
| **Boss: Nakal Jadugar** | Deepfake / voice clone | Clones Mithu (3 identical Mithus appear, same voice) and asks for the gate key. | Ask each one the **secret code word** the player chose at game start; only the real Mithu knows it. Lesson: verify with a family code word. |

## Core loop (per level; every level has 2 waves so the AI can re-plan between them)
1. **Tayyari (prep, 15-25 s):** collect bricks, back up buildings, upgrade the wall.
2. **Hamla (attack wave, ~90 s):** monsters arrive from gates; use powers.
3. **Natija (result):** stars, coins, and what the AI learned about you.

## Controls (simple enough for a class-7 student)
Arrow keys / WASD = move · **Space** = jump · hold **Q** = Sach ki Lalten (Dodo stands still and the arrow keys / WASD turn the light beam; soft aim help bends it a little towards a person) · **E** = use: greet a friend, sweep bugs with the Antivirus Jharoo, pick up / place a brick, unlock a building. In Level 2, **hold E for 1 s** next to a building to back it up. In the boss fight **E** = Firewall Shield (and asks the code word / gives the key near a Mithu clone) · **Esc** = pause menu (Resume, Ask Mithu, Quit) · World Map: arrow keys walk, Enter / E plays · On-screen buttons for touch.

## Ask Mithu (local AI chatbot, English only) - knowledge base + RAG
- Opened from the title screen ("Ask Mithu") or the pause menu (Esc). Opening it pauses the game; closing resumes. It is a normal HTML panel (`src/ui/chat/`) so typing, Enter and Esc work like a web page. History is kept in memory only (max 20 messages, "Clear" button).
- **Knowledge base** (`src/data/projectKnowledge.js`, text in `src/data/knowledge/`): about 50 small titled **chunks** (100-180 words each: project, story and design choices, every level, every monster, the AI in depth, the chatbot, every technology and why, glossary, safety tips for kids and parents, presentation help and judge questions) plus about 120 FAQ pairs (`faq.js`, several phrasings each). **When the game changes, update the chunks and the FAQ too** (and `npm run test:chat`).
- **Retrieval (RAG)**: `src/ai/retriever.js` = TF-IDF + cosine similarity + a small synonym list ("js" -> javascript, "zxcvbn/zxc" -> password checker, "lvl" -> level, "bot" -> chatbot ...). `src/ai/knowledgeSearch.js` finds the best 3-4 chunks for a question (a very short follow-up like "why?" borrows the question before it).
- **Engine A (main): Ollama** on the same computer. One-time setup: install Ollama, then `ollama pull qwen2.5:1.5b`. Settings in `src/data/chatConfig.js` (model, temperature 0.3, num_ctx 4096). The browser calls `/ollama/...`; `vite.config.js` proxies it to `http://localhost:11434` for BOTH `npm run dev` and `npm run preview`. The reply is streamed into the bubble. The system prompt (`src/ai/chatEngine.js`) is short: Mithu's rules (only this project and cyber safety, simple English for 12-year-olds, up to 6 short sentences, real details, one follow-up suggestion, redirect other topics) + ONLY the retrieved chunks + the LIVE game data (`HackerBrain.getState()` and the score, `src/ai/chatContext.js`).
- **Engine B (fallback, always works offline): `src/ai/faqBot.js`**: exact question -> FAQ pair, else the best FAQ pair by TF-IDF (score >= 0.3), else the first 2-3 sentences of the best knowledge chunk (score >= 0.1), else Mithu says what he can talk about. "What has the AI learned about me" is built from `getState()`. The player never sees a raw error.
- Used automatically if Ollama does not answer a quick check within 2 seconds, or if it errors. The status dot in the chat header is green "AI model" (Ollama) or amber "Offline mode" (FAQ). If Ollama is not running, the proxy answers with a harmless JSON message (no 404/500 in the browser console).
- **`npm run test:chat`** (`scripts/chat-test.mjs`) asks about 40 sample questions in offline mode and writes the answers to `chat-test-results.md` for review.

## Levels
The title screen "Play" opens the **World Map**; "Levels" is a simple list that is also the fallback if the map fails to load. Stars are saved in localStorage (`src/data/progress.js`).
1. **Sann Gate** (scene `Level`) - Behroopia Qasid (phishing) + Trojan Ghoda. Steps: intro, Tayyari (15 s), wave 1 (40 s, villagers + Behroopias), AI re-plan, wave 2 (55 s, adds the Trojan Ghoda, driven by HackerBrain's plan), results. 1+ star unlocks Amri Gate. Starting this level begins a NEW RUN (the AI forgets the old one).
2. **Amri Gate** (scene `Level2`) - Hathoda Dev (passwords) + Taala Bhoot (ransomware + backup). Steps: intro, Tayyari (25 s), wave 1 (Hathoda only, 45 s), AI re-plan, wave 2 (Hathoda + Taala, 50 s), results. 1+ star unlocks Miri Fort.
   - Three wall sections (LEFT, CENTER, RIGHT), each with a password plaque. Password **bricks** (lowercase clay brown, UPPERCASE red, numbers blue, symbols gold) lie around the yard. **E** picks up a brick (Dodo carries up to **5** on his head, a wobbly but readable stack) and places the top one on a wall section's password. Strength comes from **zxcvbn** (`src/ai/passwordAI.js`): password, strength bar, crack time in words. Weak = cracked and dull, medium = solid, strong = glowing gold edge.
   - **Hathoda Dev** walks to the wall section HackerBrain chooses and hammers it; damage goes down with the crack time (log scale). Each hit sends a shockwave ring: jump over it (Space) or Dodo is knocked back and drops his bricks. A broken wall can be rebuilt with new bricks.
   - **Backup** (no scrolls to carry): next to a building that is not backed up the prompt "Hold E: Backup" shows; holding E for 1 s fills a ring, then a scroll flies by itself (arc + sparkle trail) from the building to the Kutubkhana shelf, the shelf glows and the building gets a "Backed up" badge. Dodo's hands stay free. **Taala Bhoot** (ghost with a padlock) chains a building chosen by HackerBrain (buildings without a backup first) and it slowly drains coins. A LOCKED building cannot be backed up. E at a locked building: backed up = instant restore, not backed up = an 8 second unlock bar.
   - **E priority** (only ONE prompt at a time, for the action that will happen): wall section + carrying bricks -> place; brick nearby -> pick up; building not backed up (and not locked) -> hold to back up; locked building -> unlock. See `findInteraction()` in `Level2Scene.js`; the prompt is `src/ui/KeyHint.js` (key + label + progress ring).
   - Background: `public/assets/backgrounds/amri-gate-bg.*` if present (walking area in `src/level/amriArt.js`), otherwise the Level 1 courtyard with a reddish tint.
3. **Boss: Miri Fort** (scene `Boss` + HUD scene `BossUI`) - Nakal Jadugar (deepfake). A fighting-game style battle (Tekken feel) in a top-down arena, 1280x720, fixed camera. Background `public/assets/backgrounds/miri-fort-bg.*` if present, else an arena drawn in code (`src/level/bossArena.js`; no errors if missing).
   - Flow: Mithu whispers "Let's choose a secret code word only we know" -> pick 1 of 4 picture cards (Mango, Matka, Ajrak, Camel; lock animation) -> "ROUND n - FIGHT!" (big text, camera zoom) -> fight -> K.O. in slow motion -> the crystal ball cracks, the Jadugar shrinks into a tiny puff, the fort lights up, confetti + Ajrak banners -> Cyber Rakshak certificate (`Report` scene). Lose = retry card with one tip based on what hit Dodo most.
   - Numbers (top of `BossScene.js`): Dodo 100 health (+30 between rounds), Jadugar 360 (3 rounds of 120, one bar; a round ends at 240 / 120 / 0), beam 20 damage/s, shield 1.5 s with 4 s cooldown, 1 s protection after a hit. Stars from Dodo's health left (>=60% 3 stars, >=30% 2, else 1).
   - Dodo's moves: **lantern beam** (hold Q, aim as in Level 1; damages the Jadugar, breaks his purple shield, burns letters and gifts), **Firewall Shield** (E, Ajrak-patterned wall in front of Dodo, blocks letters and gifts, cooldown ring icon in the HUD), **jump** (Space).
   - The Jadugar (bigger, floating, crystal ball) drifts around and teleports with a purple swirl; sometimes comes back with a shield. Attacks, each with a ~0.6 s red warning marker, never more than 2 at once (`src/boss/BossAttacks.js`): **Phishing Barish** (fake letters rain on marked spots, 6 damage), **Hathoda Lehar** (ground slam + shockwave ring, jump it, 14), **Trojan Tohfa** (3 FREE gifts slide at Dodo, touch = bugs, 4 damage + 4/s for 3 s), **Deepfake Chaal** (Round 3 only, `src/boss/Deepfake.js`): he vanishes, 3 identical Mithus say "Dodo, quick! Give me the gate key!", E near one asks the code word (a picture bubble: only the real one shows the chosen picture), E again gives the key: right = fakes melt, Jadugar stunned + 60 damage; wrong = 30 damage to Dodo.
   - Rounds: Round 1 = Phishing + Hathoda; Round 2 = + Trojan Tohfa; Round 3 = + Deepfake Chaal (can repeat, 16 s cooldown).
   - HUD (`BossUIScene.js`): two big health bars with a delayed ghost bar, portraits (Dodo, Jadugar), round counter, combo counter (consecutive beam hits), banners, the Jadugar's taunts.
4. **World Map** (scene `WorldMap`, `WorldMapScene.js`): background `public/assets/backgrounds/ranikot-map.*` if present, else a parchment map drawn in code. Node positions are fractions of the picture at the top of the file. Nodes: Sann Gate, Amri Gate, Miri Fort, Shah-Pere Gate and Mohan Gate ("Coming soon", greyed). Dodo walks along the paths (arrow keys or a click, Enter / E plays); each node shows its stars and a lock; a bottom card shows name, monster icons and lesson of the hovered / current node. If the map throws an error the Menu opens the Levels list.

## AI systems (must be real, visible and explainable to a 13-year-old)
1. **Adaptive AI Hacker (Jadugar)** - tracks, per attack type and per variant, how often the player fails (`(fails+1)/(faced+2)`). It adapts three things: which monster types to send, which disguises the phishers use, and which wall side the brutes attack (the weakest one). Exploit ~85%, explore ~15%. Keep the logic in one small readable module: `src/ai/HackerBrain.js`. Level 2 adds the items `wall_left`, `wall_center`, `wall_right` (fail = section broken) and `building_kutubkhana`, `building_anaaj`, `building_ghar` (fail = locked without a backup); the same formula and rule are used.
2. **Run memory** (`src/ai/runMemory.js`, localStorage): Level 1 starts a new run, every level saves HackerBrain's counts when it ends, Level 2 and the boss load them (`HackerBrain.loadStats`). The boss also saves what it learned in the fight, for the certificate.
3. **Boss AI** (`src/ai/BossBrain.js`, same formula): for each attack (phishing, hathoda, trojan, deepfake) it counts `used` and `hits` (how often it really hit Dodo); score `(hits+1)/(used+2)`. `choose()`: 85% exploit (weights = score squared), 15% explore (random); never the same attack 3 times in a row. It STARTS with the weaknesses of Levels 1 and 2 (`seedFrom`: Level 1 phishing -> Phishing Barish, opened gifts -> Trojan Tohfa, Level 2 broken walls -> Hathoda Lehar). When its favourite changes, the Jadugar portrait taunts and Mithu says e.g. "He noticed you keep getting hit by the Hathoda Lehar!".
4. **Jadugar portrait** (top-right of the HUD, round frame with an Ajrak border): smirks when idle, laughs when something gets in, looks angry when Dodo catches one, and its crystal ball glows while the AI re-plans.
5. **Password AI** (`src/ai/passwordAI.js`) - zxcvbn estimates the crack time of every wall password; it also sets how hard Hathoda's hammer hits.
6. **End report** - "AI Hacker ki report": biggest weakness + one tip, a running "Insaan vs AI Hacker" tally, and (after the boss) what the boss learned in the fight.

## Tech
- **Phaser 4** (latest stable) + **Vite**, plain JavaScript (ES modules). No TypeScript.
- Scenes: `Boot`, `Preload`, `Menu`, `WorldMap`, `Level` (Level 1), `Level2` (Level 2), `UI` (HUD of the levels, runs in parallel), `Boss` (boss fight) + `BossUI` (its HUD), `Report` (the Cyber Rakshak certificate).
- Folder layout:
  ```
  src/
    main.js            game config
    scenes/            one file per scene
    objects/           Player, Mithu, monsters (one class each)
    ai/                HackerBrain.js, BossBrain.js, runMemory.js, chatEngine.js, retriever.js, knowledgeSearch.js, faqBot.js, chatContext.js, passwordAI.js
    boss/              BossAttacks.js, Deepfake.js, CodeWordPicker.js, Celebration.js
    data/              levels.js, settings.js, assetList.js, progress.js, projectKnowledge.js + knowledge/ (chunks, faq)
    i18n/              en.js, ur.js, index.js (all game text, English + Urdu)
    ui/                reusable buttons, panels, dialogue box, chat/ (Ask Mithu)
  scripts/             chat-test.mjs (npm run test:chat)
  public/assets/
    characters/  monsters/  ui/  fx/  audio/  fonts/  backgrounds/
  ```
- Target resolution 1280×720, `Scale.FIT`, centred. Must also work on a 1366×768 school laptop.
- Must run **fully offline** after `npm run build` (fonts, audio, images all local, no CDN).

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