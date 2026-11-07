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
| **Taala Bhoot** | Ransomware | Lock ghosts chain up buildings. | Instantly unlock with **Backup Scrolls** the player stored in the Miri Fort library earlier. No backup = building stays locked. Lesson: keep backups. |
| **Boss: Nakal Jadugar** | Deepfake / voice clone | Clones Mithu (3 identical Mithus appear, same voice) and asks for the gate key. | Ask each one the **secret code word** the player chose at game start; only the real Mithu knows it. Lesson: verify with a family code word. |

## Core loop (per level)
1. **Tayyari (prep, ~30 s):** collect bricks, store backup scrolls, upgrade wall.
2. **Hamla (attack wave, ~90 s):** monsters arrive from gates; use powers.
3. **Natija (result):** stars, coins, and what the AI learned about you.

## Controls (simple enough for a class-7 student)
Arrow keys / WASD to move · **Space** = jump · hold **Q** = Sach ki Lalten (Dodo stands still and the arrow keys / WASD turn the light beam; soft aim help bends it a little towards a person) · **E** = greet a friend / sweep bugs with the Antivirus Jharoo · **Esc** = pause menu (Resume, Ask Mithu, Quit) · On-screen buttons for touch.

## Ask Mithu (local AI chatbot, English only)
- Opened from the title screen ("Ask Mithu") or the pause menu (Esc). Opening it pauses the game; closing resumes. It is a normal HTML panel (`src/ui/chat/`) so typing, Enter and Esc work like a web page. History is kept in memory only (max 20 messages, "Clear" button).
- **Engine A (main): Ollama** running on the same computer. One-time setup: install Ollama, then `ollama pull qwen2.5:1.5b`. The model name is `OLLAMA_MODEL` in `src/data/chatConfig.js`. The browser calls `/ollama/...`; `vite.config.js` proxies it to `http://localhost:11434` for BOTH `npm run dev` and `npm run preview`. The reply is streamed into the bubble.
- The system prompt (`src/ai/chatEngine.js`) = Mithu's rules (only this game, cyber safety and AI basics; simple English; max 3 short sentences; never invent facts) + `KNOWLEDGE_TEXT` from `src/data/projectKnowledge.js` + the LIVE game data: `HackerBrain.getState()` (weakness scores, log, counts) and the current score (`src/ai/chatContext.js`). So "What has the AI learned about me?" uses real numbers.
- **Engine B (fallback, always works offline): `src/ai/faqBot.js`** - about 35 question/answer pairs from `projectKnowledge.js`, matched with TF-IDF + cosine similarity. "What has the AI learned about me" is built from `getState()`. If nothing matches well, Mithu says what he can talk about and the 4 suggestion chips stay visible. The player never sees a raw error.
- Used automatically if Ollama does not answer a quick check within 2 seconds, or if it errors. The status dot in the chat header is green "AI model" (Ollama) or amber "Offline mode" (FAQ).
- If Ollama is not running, the proxy answers with a harmless JSON message (no 404/500 in the browser console).

## Levels (scope for 5 days)
1. Sann Gate — Behroopia Qasid (phishing) + Trojan Ghoda
2. Amri Gate — Hathoda Dev (passwords) + Taala Bhoot (backup)
3. Boss at Miri Fort — Nakal Jadugar (deepfake)
Shah-Pere and Mohan gates shown as "Coming soon" on the map. Two perfect levels + boss beat four rough ones.

## AI systems (must be real, visible and explainable to a 13-year-old)
1. **Adaptive AI Hacker (Jadugar)** — tracks, per attack type and per variant, how often the player fails (`(fails+1)/(faced+2)`). It adapts three things: which monster types to send, which disguises the phishers use (e.g. if the player never scans "old lady" villagers, more phishers disguise as old ladies), and which wall side the brutes attack (the weakest one). Exploit ~85%, explore ~15%. Keep the logic in one small readable module: `src/ai/HackerBrain.js`.
2. **Jadugar portrait** (top-right of the HUD, round frame with an Ajrak border): the live "AI ka Dimagh" panel was removed. The portrait smirks when idle, laughs when something gets in, looks angry when Dodo catches one, and its crystal ball glows while the AI re-plans. HackerBrain is unchanged: it still drives the waves and the results report.
3. **Password AI** — zxcvbn estimates crack time ("3 second" vs "400 saal").
4. **End report** — "AI Hacker ki report": biggest weakness + one tip, plus a running "Insaan vs AI Hacker" tally.

## Tech
- **Phaser 4** (latest stable) + **Vite**, plain JavaScript (ES modules). No TypeScript.
- Scenes: `Boot`, `Preload`, `Menu`, `CharacterSelect`, `WorldMap`, `Level`, `UI` (HUD runs in parallel scene), `Report`.
- Folder layout:
  ```
  src/
    main.js            game config
    scenes/            one file per scene
    objects/           Player, Mithu, monsters (one class each)
    ai/                HackerBrain.js, chatEngine.js, faqBot.js, chatContext.js, passwordAI.js
    data/              levels.js, settings.js, assetList.js
    i18n/              en.js, ur.js, index.js (all game text, English + Urdu)
    ui/                reusable buttons, panels, dialogue box, chat/ (Ask Mithu)
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