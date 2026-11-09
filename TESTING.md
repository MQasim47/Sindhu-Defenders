# Manual playtest checklist

Do this on the real exhibition computer, with a class-7 student if possible. Tick every box.
Use **both languages** (Settings -> Language) and try **Low graphics** once.

## 0. Start
- [ ] Double-click `start-game.bat`: the game opens full screen, no error window.
- [ ] The title screen shows in under 4 seconds. Title music starts after a moment (after the first click if the browser waits).
- [ ] The big **Humans vs AI Hacker** scoreboard is visible.
- [ ] `Alt+F4` closes the game and the black server window.

## 1. Title, menus, settings
- [ ] Play, Levels, How to Play, Settings, Ask Mithu, Credits all open and close (button and Esc). Arrow keys + Enter also work.
- [ ] **How to Play**: 3 pages (Level 1, 2, 3) with pictures; Next / Back and arrow keys turn the page.
- [ ] **Settings**: music slider, sounds slider (you hear a coin), Mute all, Low graphics, Less motion, Full screen, Language. Reload the page: the values are remembered.
- [ ] **Credits**: school, teacher and student names are real (not the [brackets]); the tools and licences are listed.
- [ ] Urdu: no text overlaps or is cut off on the title, settings, how to play, map, Level 3 buttons, certificate.

## 2. World Map
- [ ] Only 3 places (Sann Gate, Amri Gate, Miri Fort). No "Coming soon".
- [ ] Arrow keys and clicking walk Dodo along the path. Enter / E starts the level. Locked places shake and say what is needed.
- [ ] Stars and locks are right. Amri opens after Sann with 1 star, Miri after Amri with 1 star.

## 3. Level 1 - Sann Gate
- [ ] Intro, Tayyari, wave 1, "AI is thinking", wave 2, results (about 2 minutes). Music plays.
- [ ] Hold Q: the lantern reveals a Behroopia; a real villager can be greeted with E.
- [ ] The Trojan Ghoda drops FREE gifts: check with the lantern, or open one and sweep the bugs with E.
- [ ] Results: stars, the AI Hacker's report, Humans vs AI score. "Next" opens Level 2.

## 4. Level 2 - Amri Gate
- [ ] Pick up bricks (E), carry up to 5, place them on a wall: the password and crack time change.
- [ ] Hold E for 1 second next to a building: a ring fills, a scroll flies to the shelf, the building says "Backed up". Release early = nothing happens.
- [ ] Only ONE prompt shows at a time (place brick > pick up > hold to backup > unlock).
- [ ] Hathoda hammers a weak wall (it breaks) and a strong wall (barely a scratch). Jump over the shockwave.
- [ ] Taala Bhoot locks a building: a backed-up one is restored at once, one without a backup needs the 8-second bar.

## 5. Level 3 - Miri Fort (the showdown)
- [ ] Mithu whispers, you pick a card (mouse or arrows + Enter), the lock closes.
- [ ] "ROUND 1 - FIGHT!" with a camera zoom. Dodo on the left, the Jadugar on the right.
- [ ] Round 1: one attack at a time, about 5 s; Mithu names the right button the first time and it glows.
- [ ] Right defence (keys 1-4 and mouse): flashy animation, the attack bounces back, the Jadugar's bar drops, the combo counter grows.
- [ ] Wrong defence or too late: Dodo loses a heart, Mithu says the right defence in one line.
- [ ] Round 2 is faster, with padlock chains. Round 3 is fastest, up to 2 attacks in the air, with the Mithu voice.
- [ ] The Jadugar taunts when he uses your weak spot ("You never check gifts!").
- [ ] Finale: the Jadugar becomes a fake Mithu; button 4 gives K.O. in slow motion, the ball cracks, he shrinks into a puff, confetti and banners.
- [ ] Lose all hearts: the retry card has one tip; "Try again" starts at the same round with the same code word.
- [ ] Esc pauses (not while choosing the card).

## 6. Certificate
- [ ] Type a name. Stars (x / 9), 5 lessons, AI report incl. what the boss learned, Humans vs AI score.
- [ ] "Play again" opens the map, "Menu" goes to the title.

## 7. Ask Mithu (chat)
- [ ] With **Ollama running** (green "AI model"): ask "what is ransomware", "which cyber security terms are used in this game?", "why Ranikot", "how does the boss AI learn".
- [ ] With **Ollama stopped** (amber "Offline mode"): the same questions are answered.
- [ ] Every term answers with a definition, an example, the monster / level and the defence: phishing, password, brute force, malware, virus, trojan, ransomware, backup, firewall, OTP, 2FA, deepfake, voice clone, code word, hacker, AI, TF-IDF, LLM, RAG. (`npm run test:chat` must say 0 failed.)
- [ ] An unrelated question ("capital of France") is politely turned back to the project.
- [ ] Music gets quieter while the chat is open.
- [ ] "What has the AI learned about me?" uses real numbers after a game.

## 8. Audio
- [ ] Menu / map music, Level 1-2 music and Level 3 music change with a short crossfade.
- [ ] Every action makes a sound (jump, hit, coin, backup, defences, K.O., ...). Mute all silences everything.

## 9. Exhibition
- [ ] **Ctrl+Shift+J**: "JUDGE MODE" tag, all levels open, Enter skips an intro. Press again to turn it off.
- [ ] **Ctrl+Shift+R**: stars, AI memory and name are cleared, the Humans vs AI score stays, back on the title.
- [ ] Leave the title alone for 60 seconds: attract mode starts; a key press ends it.
- [ ] If the game runs slowly for 5 seconds, a toast says Low graphics was turned on.
- [ ] Break something on purpose (dev console: `throw`) is not needed: an error in a scene shows "Back to menu".

## 10. Before the competition
- [ ] `npm run test:chat` -> 0 failed. `npm run test:e2e` -> all checks passed.
- [ ] `src/data/credits.js` has the real names.
- [ ] Unplug the internet: everything still works.
