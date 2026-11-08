# Mithu chat test (offline mode)

41 questions. "source" says where the answer came from: faq, chunk (best knowledge chunk) or none.

## 1. why javascript

**Mithu** (faq, score 1.00): JavaScript runs in every browser, so nothing needs installing. It is easy to read, which matters because we must explain our code, and Phaser is made for it.

_Top chunks for the AI model:_ Why JavaScript (0.27) | i18n: English and Urdu, and localStorage (0.12) | RAG, TF-IDF and cosine similarity in simple words (0.11)

## 2. what is zxcvbn

**Mithu** (faq, score 1.00): zxcvbn is a free password strength estimator by Dropbox. It knows common passwords, names, words, keyboard patterns and number runs, estimates how many guesses an attacker needs and turns that into a crack time like "3 seconds" or "400 years".

_Top chunks for the AI model:_ Why zxcvbn: the password strength library (0.50) | The password AI: zxcvbn and crack time (0.46) | Level 2: Amri Gate (passwords and backups) (0.24)

## 3. what happens in level 1

**Mithu** (faq, score 1.00): Level 1 is Sann Gate. Villagers walk to the gate and some are disguised Behroopia Qasid monsters. You hold Q and shine the lantern to reveal them. In wave 2 the Trojan Ghoda drops FREE gifts. You start with 10 coins.

_Top chunks for the AI model:_ How the AI remembers across levels for the boss (0.09) | Level 1: Sann Gate (phishing and Trojan Ghoda) (0.09) | Why Level 2 exists and what it teaches (0.09)

## 4. why is there a level 2

**Mithu** (faq, score 1.00): Level 1 is about spotting danger. Level 2 is about being strong BEFORE the attack: strong passwords stop brute force and backups stop ransomware.

_Top chunks for the AI model:_ Why Level 2 exists and what it teaches (0.23) | The game loop: Tayyari, Hamla, Natija (0.17) | Level 2: Amri Gate (passwords and backups) (0.17)

## 5. how does the AI learn

**Mithu** (faq, score 1.00): HackerBrain has three steps: data (it counts what it sent and what you failed), learning (a weakness score) and decision (it plans the next wave, aiming at your weak spots).

_Top chunks for the AI model:_ The goal and what the player learns (0.22) | The boss AI: how the Jadugar learns in the fight (0.19) | The competition and Theme 2 (0.18)

## 6. what is TF-IDF

**Mithu** (faq, score 1.00): TF is how often a word appears in a text. IDF gives more value to rare words and less to common ones. So "zxcvbn" counts a lot and "game" counts little.

_Top chunks for the AI model:_ RAG, TF-IDF and cosine similarity in simple words (0.37) | Presentation help: likely judge questions and answers (0.17) | The offline FAQ fallback (0.17)

## 7. who is Mithu

**Mithu** (faq, score 1.00): I am Mithu, the green parrot guide of Dodo. I give hints in the game and answer questions about the project. I am not a robot, I am a tota!

_Top chunks for the AI model:_ Mithu the chatbot: Ollama and the local model (0.19) | Characters: Dodo, Marvi, Mithu and the Jadugar (0.18) | Boss fight: the Deepfake Chaal and the code word (0.15)

## 8. why Ranikot

**Mithu** (faq, score 1.00): Ranikot Fort in Jamshoro is called the Great Wall of Sindh. Its wall is about 31 km long. A fort protects people like a firewall protects a computer, so it fits our idea and it makes us proud of Sindh.

_Top chunks for the AI model:_ Why Ranikot? The story (0.25) | Boss level: Miri Fort and the Nakal Jadugar (0.20) | The World Map (0.17)

## 9. what is the weakness formula

**Mithu** (faq, score 1.00): Weakness = (fails + 1) / (faced + 2). Nothing known gives 0.5. Failing 3 out of 3 gives 0.8. Never failing in 6 tries gives 0.125. A higher score means you are weaker there, so the AI sends more of it.

_Top chunks for the AI model:_ The weakness formula (fails+1)/(faced+2) with an example (0.25) | The competition and Theme 2 (0.16) | The boss AI: how the Jadugar learns in the fight (0.14)

## 10. why 85% exploit and 15% explore

**Mithu** (faq, score 0.69): 85 percent of the time the AI exploits: it attacks your known weak spots. 15 percent of the time it explores: it tries something random. Exploring lets it find new weak spots and keeps the game from being predictable.

_Top chunks for the AI model:_ Exploit 85% and explore 15% and why exploring matters (0.49) | The boss AI: how the Jadugar learns in the fight (0.27) | Presentation help: likely judge questions and answers (0.19)

## 11. what is RAG

**Mithu** (faq, score 1.00): RAG means Retrieval-Augmented Generation. First retrieve the 3 or 4 most useful knowledge chunks for the question, then generate the answer from only those chunks. It keeps the small model focused.

_Top chunks for the AI model:_ RAG, TF-IDF and cosine similarity in simple words (0.20) | What an LLM is, and why a small local model (0.10) | Presentation help: likely judge questions and answers (0.10)

## 12. why a small local model

**Mithu** (faq, score 0.52): We use qwen2.5:1.5b, a small model. It runs on a normal school laptop, works offline, is free and keeps questions private. We help it with RAG so it does not have to guess.

_Top chunks for the AI model:_ What an LLM is, and why a small local model (0.40) | Mithu the chatbot: Ollama and the local model (0.29) | Presentation help: likely judge questions and answers (0.16)

## 13. what is ollama

**Mithu** (faq, score 1.00): I use Ollama, a free program that runs a small AI model on this computer. For each question I first find the best pieces of the project notes, then the model writes an answer from them. If Ollama is off, my offline FAQ answers.

_Top chunks for the AI model:_ Mithu the chatbot: Ollama and the local model (0.25) | Why Vite (0.18) | The offline FAQ fallback (0.16)

## 14. why phaser

**Mithu** (faq, score 1.00): Phaser 4 is a free 2D game engine for the web. It gives scenes, input, sprites, tweens, cameras and a fast WebGL renderer, so we could spend our time on the idea.

_Top chunks for the AI model:_ Why Phaser 4, WebGL and the GPU (0.26) | Why JavaScript (0.19) | The offline FAQ fallback (0.18)

## 15. what is vite

**Mithu** (faq, score 1.00): Vite starts the game in a second and refreshes when we save a file. "npm run build" packs the finished game into a small dist folder that works offline. It also proxies the chatbot to Ollama.

_Top chunks for the AI model:_ Why Vite (0.34) | Mithu the chatbot: Ollama and the local model (0.10)

## 16. what is webgl

**Mithu** (faq, score 1.00): WebGL lets the browser use the GPU, the chip made for drawing. It can draw thousands of images in parallel, so glowing lights and many characters run at 60 frames per second.

_Top chunks for the AI model:_ Why Phaser 4, WebGL and the GPU (0.32) | Game techniques: tweens, squash and stretch, y-sorting, pooling, atlas, FPS (0.08)

## 17. why is 1234 a weak password

**Mithu** (faq, score 0.67): 1234, abc and "password" are the first things attackers try, so zxcvbn says they crack in less than a second. Adding one letter does not help much.

_Top chunks for the AI model:_ The password AI: zxcvbn and crack time (0.24) | Level 2: Amri Gate (passwords and backups) (0.22) | Why zxcvbn: the password strength library (0.19)

## 18. what does the boss do in round 3

**Mithu** (faq, score 0.54): Round 1 has Phishing Barish and Hathoda Lehar. Round 2 adds Trojan Tohfa and the boss AI learns. Round 3 adds the Deepfake Chaal and the AI is fully adaptive.

_Top chunks for the AI model:_ The boss AI: how the Jadugar learns in the fight (0.34) | Boss level: Miri Fort and the Nakal Jadugar (0.31) | Boss fight: the Deepfake Chaal and the code word (0.28)

## 19. how does the deepfake trick work

**Mithu** (faq, score 1.00): Before the fight you choose a picture card: Mango, Matka, Ajrak or Camel. In Round 3 three identical Mithus ask for the gate key. Press E near one to ask the code word. Only the real Mithu shows your picture. Then press E again to give the key.

_Top chunks for the AI model:_ Boss fight: the Deepfake Chaal and the code word (0.15) | Presentation help: likely judge questions and answers (0.12) | Glossary: password, backup, firewall, OTP, 2FA, deepfake, code word, AI (0.12)

## 20. what is the secret code word

**Mithu** (faq, score 1.00): Before the fight you choose a picture card: Mango, Matka, Ajrak or Camel. In Round 3 three identical Mithus ask for the gate key. Press E near one to ask the code word. Only the real Mithu shows your picture. Then press E again to give the key.

_Top chunks for the AI model:_ Boss fight: the Deepfake Chaal and the code word (0.25) | Glossary: password, backup, firewall, OTP, 2FA, deepfake, code word, AI (0.24) | Monster: Nakal Jadugar (deepfake and voice clone boss) (0.20)

## 21. how does the boss AI learn

**Mithu** (faq, score 0.45): BossBrain counts how many times each attack was used and how many times it hit Dodo. It uses the same (hits+1)/(used+2) formula and chooses 85 percent exploit, 15 percent explore.

_Top chunks for the AI model:_ The boss AI: how the Jadugar learns in the fight (0.33) | How the AI remembers across levels for the boss (0.22) | The competition and Theme 2 (0.21)

## 22. what is hathoda dev

**Mithu** (faq, score 1.00): Hathoda Dev is the brute force monster. He hammers a wall section; weak passwords break quickly and strong ones barely chip. His hammer makes a shockwave that you jump over with Space.

_Top chunks for the AI model:_ Monster: Hathoda Dev (brute force passwords) (0.29) | Level 2: Amri Gate (passwords and backups) (0.22) | How the AI picks disguises, walls and buildings (0.14)

## 23. what is taala bhoot

**Mithu** (faq, score 1.00): Taala Bhoot is a ghost with a padlock that locks a building, like ransomware. A backed-up building is restored instantly with E. Without a backup you wait for an 8 second unlock bar while coins drain.

_Top chunks for the AI model:_ Monster: Taala Bhoot (ransomware) (0.32) | Level 2 backups and Taala Bhoot in detail (0.30) | Level 2: Amri Gate (passwords and backups) (0.21)

## 24. how do I back up a building

**Mithu** (faq, score 1.00): Stand next to a building that has no backup and hold E for one second while a ring fills. A scroll then flies by itself to the Kutubkhana shelf and the building gets a "Backed up" badge. Your hands stay free.

_Top chunks for the AI model:_ Monster: Taala Bhoot (ransomware) (0.23) | Level 2 backups and Taala Bhoot in detail (0.21) | Controls (0.19)

## 25. why a parrot

**Mithu** (faq, score 1.00): Parrots talk and repeat words, so a parrot is a natural guide who gives hints. A tota is also a friendly, familiar bird in Sindh.

_Top chunks for the AI model:_ Characters: Dodo, Marvi, Mithu and the Jadugar (0.42) | Presentation help: a 1-minute summary (0.19) | Mithu the chatbot: Ollama and the local model (0.07)

## 26. why ajrak and topi

**Mithu** (faq, score 1.00): Ajrak and the Sindhi topi are the pride of Sindh. Dodo wears them, and we use the Ajrak pattern in frames, banners and the Firewall Shield.

_Top chunks for the AI model:_ Design choices: monsters, no quizzes, no robots (0.29) | Characters: Dodo, Marvi, Mithu and the Jadugar (0.12) | Boss level: Miri Fort and the Nakal Jadugar (0.07)

## 27. why no robots

**Mithu** (faq, score 1.00): I am Mithu, the green parrot guide of Dodo. I give hints in the game and answer questions about the project. I am not a robot, I am a tota!

_Top chunks for the AI model:_ Design choices: monsters, no quizzes, no robots (0.26) | Characters: Dodo, Marvi, Mithu and the Jadugar (0.09) | Exploit 85% and explore 15% and why exploring matters (0.09)

## 28. why monsters and not quizzes

**Mithu** (faq, score 0.48): A quiz is read fast and forgotten. In the game the attack is the monster's behaviour and the defence is something you do, so you feel the lesson and remember it.

_Top chunks for the AI model:_ Design choices: monsters, no quizzes, no robots (0.34) | Monster: Taala Bhoot (ransomware) (0.07) | Monster: Hathoda Dev (brute force passwords) (0.07)

## 29. what is phishing

**Mithu** (faq, score 1.00): Phishing is a trick message, call or person that pretends to be someone you trust, to steal your password, money or information. Check before you trust: look at who sent it and ask if you expected it.

_Top chunks for the AI model:_ Monster: Behroopia Qasid (phishing) (0.16) | Glossary: phishing, malware, virus, trojan, ransomware (0.16) | Level 1: Sann Gate (phishing and Trojan Ghoda) (0.14)

## 30. what is ransomware

**Mithu** (faq, score 1.00): Ransomware locks your files and asks for money to open them. A backup lets you restore everything without paying.

_Top chunks for the AI model:_ Monster: Taala Bhoot (ransomware) (0.23) | Glossary: phishing, malware, virus, trojan, ransomware (0.19) | The goal and what the player learns (0.09)

## 31. what is a deepfake

**Mithu** (faq, score 1.00): A deepfake is a fake photo, video or voice made by AI that looks real. A voice clone copies someone's voice, so a scammer can pretend to be your uncle. Ask for the family code word.

_Top chunks for the AI model:_ Monster: Nakal Jadugar (deepfake and voice clone boss) (0.19) | Boss fight: the Deepfake Chaal and the code word (0.17) | Glossary: password, backup, firewall, OTP, 2FA, deepfake, code word, AI (0.16)

## 32. safety tips for parents

**Mithu** (faq, score 1.00): Choose a family code word, turn on 2FA, never give an OTP to a caller, keep a backup of photos, use different passwords and talk calmly with children so they come to you first.

_Top chunks for the AI model:_ Real-life safety tips for parents (0.37) | Real-life safety tips for kids (0.31) | The goal and what the player learns (0.12)

## 33. give me a one minute summary

**Mithu** (faq, score 1.00): Our game Sindhu Defenders teaches cyber safety through play. Ranikot is the phone and its wall the firewall. A learning AI Hacker sends monsters for phishing, free gifts, weak passwords, ransomware and deepfakes, and Dodo defends with real safe actions. The AI counts your mistakes, scores weaknesses, and attacks them 85 percent of the time.

_Top chunks for the AI model:_ Presentation help: a 1-minute summary (0.37) | The game loop: Tayyari, Hamla, Natija (0.08) | The AI report and Humans vs AI (0.05)

## 34. what will the judges ask

**Mithu** (faq, score 1.00): Likely questions: Is the AI real? Why a small local model? What do players learn? What is original? What did you learn? Ask me each one and I will answer.

_Top chunks for the AI model:_ Presentation help: likely judge questions and answers (0.17) | The competition and Theme 2 (0.14) | Presentation help: a 1-minute summary (0.08)

## 35. how do stars work

**Mithu** (faq, score 1.00): You get 3 stars when nothing bad gets through, 2 stars when at least 65 percent of the checks are good, otherwise 1. One star unlocks the next level: Amri Gate after Sann Gate, and Miri Fort after Amri Gate.

_Top chunks for the AI model:_ The AI report and Humans vs AI (0.15) | The World Map (0.13) | The competition and Theme 2 (0.11)

## 36. what is the world map

**Mithu** (faq, score 1.00): The World Map shows Ranikot. You walk Dodo between Sann Gate, Amri Gate and Miri Fort with the arrow keys and press Enter or E to play. Shah-Pere Gate and Mohan Gate are greyed out as "Coming soon".

_Top chunks for the AI model:_ The World Map (0.30) | The project: Sindhu Defenders (0.12) | Controls (0.12)

## 37. what is cosine similarity

**Mithu** (faq, score 1.00): Each text becomes a list of numbers (a vector). Cosine similarity measures the angle between two lists: if they point the same way, the texts talk about the same thing. The best score wins.

_Top chunks for the AI model:_ RAG, TF-IDF and cosine similarity in simple words (0.34) | The offline FAQ fallback (0.15)

## 38. what is localstorage

**Mithu** (faq, score 1.00): localStorage is a small storage in the browser. We save the language, settings, stars, the Humans vs AI score and the AI's run memory. It never leaves your computer.

_Top chunks for the AI model:_ i18n: English and Urdu, and localStorage (0.25) | How the AI remembers across levels for the boss (0.17) | Why Vite (0.11)

## 39. who made the pictures (gemini)

**Mithu** (faq, score 0.64): The painted pictures were made with Gemini, an AI image generator, and cleaned in Photopea, a free online image editor. We use free asset sites like Kenney and Pixabay for sounds and small images. Many effects are drawn in code.

_Top chunks for the AI model:_ Art, fonts and assets: Gemini, Photopea, Kenney, Pixabay (0.41) | The competition and Theme 2 (0.17) | Presentation help: likely judge questions and answers (0.15)

## 40. lvl 2 lesson

**Mithu** (faq, score 0.41): Level 1 is about spotting danger. Level 2 is about being strong BEFORE the attack: strong passwords stop brute force and backups stop ransomware.

_Top chunks for the AI model:_ The goal and what the player learns (0.15) | Why Level 2 exists and what it teaches (0.10) | RAG, TF-IDF and cosine similarity in simple words (0.10)

## 41. what is the capital of france

**Mithu** (none, score 0.00): Hmm, I am not sure about that one. I can talk about the game and its levels, the monsters, how the AI learns, the tools we used, how I work, and cyber safety. Try asking "how does the AI learn?" or "why JavaScript?".

_Top chunks for the AI model:_ none
