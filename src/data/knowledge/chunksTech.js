// Mithu's knowledge, part 3: the chatbot, the tools we chose and why, the glossary, safety tips
// and presentation help. See chunksProject.js.
export const CHUNKS_TECH = [
  {
    id: 'chat-mithu',
    title: 'Mithu the chatbot: Ollama and the local model',
    text: `Ask Mithu is a chatbot inside the game. It is opened from the title screen or the pause menu (Esc). The main engine is Ollama, a free program that runs a small AI model on the same computer. We use the model qwen2.5:1.5b (set as OLLAMA_MODEL in src/data/chatConfig.js). The browser talks to a proxy path /ollama and the Vite server passes it to Ollama on port 11434, so no special browser permission is needed. The answer is streamed word by word into the chat bubble. The settings are temperature 0.3 (careful, not wild answers) and a context of 4096 tokens. Mithu is told to answer in simple English for 12-year-olds, in up to 6 short sentences, to use real names and numbers from the knowledge, and to politely redirect questions that are not about the project. The chat history is kept only in memory (20 messages) and can be cleared. The chat is English only on purpose.`,
  },
  {
    id: 'chat-llm',
    title: 'What an LLM is, and why a small local model',
    text: `LLM means Large Language Model. It is a program trained on a huge amount of text to predict the next word again and again, which makes it able to write answers. It does not "know" facts like a database, so a model can make up wrong things (called hallucination). A small model like qwen2.5:1.5b has 1.5 billion parameters (numbers learned in training). Why small and local? First, it runs on a normal school laptop without a graphics card. Second, it works offline, with no internet and no account. Third, it is free, with no cost per question. Fourth, privacy: the questions never leave the computer, which matters for children. The price is that a small model is less clever, so we help it with RAG: we give it the right pieces of our own knowledge so it does not have to guess.`,
  },
  {
    id: 'chat-rag',
    title: 'RAG, TF-IDF and cosine similarity in simple words',
    text: `RAG means Retrieval-Augmented Generation. Instead of giving the small model all our notes, we first RETRIEVE the 3 or 4 most useful chunks for the question, then let the model GENERATE the answer from only those chunks and the live game data. This keeps the prompt short and the model focused. How do we find the best chunks? With TF-IDF and cosine similarity. TF (term frequency) counts how often a word appears in a chunk. IDF (inverse document frequency) gives more value to rare words: "zxcvbn" tells us a lot, "game" tells us little. Each text becomes a list of numbers, a vector. Cosine similarity measures the angle between two vectors: if they point in the same direction the texts talk about the same thing, and the score goes towards 1. A small synonym list helps: "js" means javascript, "lvl" means level, "bot" means chatbot.`,
  },
  {
    id: 'chat-faq',
    title: 'The offline FAQ fallback',
    text: `Mithu has two engines. Engine A is Ollama. Engine B is the offline FAQ finder in src/ai/faqBot.js, and it always works. The game checks if Ollama answers within 2 seconds. If not, or if it fails, Engine B answers and the status dot in the chat header is amber with the words "Offline mode". When Ollama is working the dot is green with "AI model". The FAQ has about a hundred question and answer pairs with several ways to ask each one, and finds the best pair with the same TF-IDF and cosine similarity. If the best FAQ match is weak, Mithu does not give up: he takes the best matching knowledge chunk and answers with its first sentences. Questions about the player's own game, like "what has the AI learned about me?", are answered from the live numbers of HackerBrain. The player never sees a raw error.`,
  },
  {
    id: 'tech-javascript',
    title: 'Why JavaScript',
    text: `We wrote the game in plain JavaScript (ES modules). Why? JavaScript runs in every web browser, so the game works on any school laptop or phone browser with nothing to install. It is easy to read, which matters because students must explain their own code. The best 2D web game engine, Phaser, is written for JavaScript. We do not use TypeScript to keep the code simple for a class-7 student. The game is made of small files, one for each scene or object, with short comments in simple English. After "npm run build" the whole game is a folder of files that can run offline from a local web server.`,
  },
  {
    id: 'tech-phaser',
    title: 'Why Phaser 4, WebGL and the GPU',
    text: `Phaser is a free, popular 2D game engine for the web. We use Phaser 4. It gives scenes, a game loop, input, sprites, animation tweens, cameras, sound, and a fast renderer. It draws with WebGL, a browser technology that lets the GPU (graphics processing unit, the chip made for drawing) draw thousands of images in parallel, so we can have many characters, glowing light and particles at 60 frames per second on a school laptop. Without the GPU, the main processor would be too slow. A scene is one screen of the game (Boot, Preload, Menu, World Map, Level, Level 2, Boss, UI, Report). The game runs at 1280 by 720 and scales to fit any screen. Writing our own engine would take months, so a free engine lets us spend time on the idea.`,
  },
  {
    id: 'tech-vite',
    title: 'Why Vite',
    text: `Vite is a build tool and development server. With "npm run dev" it starts the game in a second and refreshes the page the moment we save a file, which makes making a game fast. With "npm run build" it packs everything into a small "dist" folder, so the finished game works offline and loads quickly. In our project Vite also does two special jobs in vite.config.js: it lists the real files in public/assets, so the game only asks for files that exist and the console has no 404 errors, and it proxies the path /ollama to Ollama on port 11434 for the chatbot, in both dev and preview mode. It is free and used by many professional developers.`,
  },
  {
    id: 'tech-zxcvbn',
    title: 'Why zxcvbn: the password strength library',
    text: `zxcvbn is a free password strength estimator created by Dropbox (the name comes from the bottom row of a keyboard). We chose it because it is realistic and it works fully offline in the browser. Old checkers say "must have 8 letters, a number and a symbol", which accepts Password1! even though it is easy to guess. zxcvbn compares the password with common passwords, names, words, keyboard patterns, repeats, dates and l33t tricks, and finds the cheapest way an attacker could guess it. It returns a score from 0 to 4 and an estimated number of guesses, which we turn into a crack time in words. 1234 is weak because it is one of the first number runs every attacker tries, so the crack time is less than a second. Its estimate also decides how hard Hathoda Dev's hammer hits.`,
  },
  {
    id: 'tech-art',
    title: 'Art, fonts and assets: Gemini, Photopea, Kenney, Pixabay',
    text: `The painted pictures, like the title screen, the courtyard, the Amri Gate and the Ranikot map, were made with the help of Gemini, an AI image generator, then edited and cleaned in Photopea, a free online image editor that works like Photoshop. For free sounds and small images we use free asset sites such as Kenney and Pixabay, which allow free use. The characters and many effects are drawn in code on canvas, so they are always available and keep the same asset keys; a real picture file with the same key can replace them later without changing the code. The fonts are Fredoka (a rounded, friendly font for English) and Noto Nastaliq Urdu (for Urdu). Both are free and stored locally, so no internet is needed. The Ajrak pattern in frames and banners is drawn by code.`,
  },
  {
    id: 'tech-i18n',
    title: 'i18n: English and Urdu, and localStorage',
    text: `i18n (internationalisation) means the game can speak many languages. All words are stored as keys in two files, src/i18n/en.js and src/i18n/ur.js, and the scenes ask for text by key, for example t('menu.play'). When the player changes language in Settings or with the globe button, every text changes at once. Urdu uses real Urdu script with the Noto Nastaliq Urdu font and right-to-left lines. Names like Dodo, Mithu and Ranikot stay in English letters. The chatbot is English only. localStorage is a small storage in the browser that remembers things without a server: the chosen language, the settings (low graphics, less motion), the stars of each level, the Humans vs AI score, and the AI's run memory. It is always used inside try/catch so a blocked storage never breaks the game.`,
  },
  {
    id: 'tech-techniques',
    title: 'Game techniques: tweens, squash and stretch, y-sorting, pooling, atlas, FPS',
    text: `Tweens move a value smoothly from one number to another over time, with easing like Back, Sine or Cubic, for example when a button grows or the cape sways. Squash and stretch is an animation rule from cartoons: Dodo is squashed before a jump and stretched in the air, which makes him feel soft and alive. Y-sorting means things lower on the screen are drawn in front, so Dodo can walk behind and in front of buildings in a top-down yard. Object pooling means we make monsters, letters, rings and particles once and reuse them instead of creating new ones every moment, which avoids lag. A texture atlas packs many small pictures into one big picture so the GPU switches textures less. Scenes separate the screens, and the HUD runs in a parallel scene. FPS means frames per second; we aim at a steady 60. Press F in development to see an FPS meter.`,
  },
  {
    id: 'tech-github',
    title: 'GitHub, Claude Code and how the game was built',
    text: `The code lives on GitHub in the repository Sindhu-Defenders, with a commit for every step, so we can see the history and go back. Git is the version control program and GitHub is the website that stores the repository. We built the game in steps: setup and polish, villagers and lantern, the Jadugar AI, the chatbot, Level 2, then the boss and the world map. Claude Code, an AI coding assistant from Anthropic, helped write the code under the students' direction, and the project notes in CLAUDE.md keep the rules of the game, the style and the plan. The code is written in small files with simple comments so that students can read and explain it. Everything runs locally and offline after the build.`,
  },
  {
    id: 'glossary-attacks',
    title: 'Glossary: phishing, malware, virus, trojan, ransomware',
    text: `Phishing is a trick message, email, call or person that pretends to be someone you trust to steal your information, like a fake bank SMS with a link. Malware is any bad software made to harm a device or steal data. A virus is malware that copies itself from file to file. A trojan is malware hidden inside something that looks useful or free, like a cracked game. Ransomware is malware that locks or encrypts your files and asks for money to open them; a backup is the best answer. Brute force is trying thousands of passwords one after another until one works. A hacker is a person who breaks into computers; a bad hacker is called a black hat and a good one who helps fix problems is a white hat. The "AI Hacker" in the game is a friendly training partner.`,
  },
  {
    id: 'glossary-defence',
    title: 'Glossary: password, backup, firewall, OTP, 2FA, deepfake, code word, AI',
    text: `A password is a secret that protects an account: make it long, mixed, different for each account, and never share it. A backup is a spare copy of your files kept in a safe place. A firewall is a wall that checks and blocks bad traffic into a network; in the game the wall of Ranikot is the firewall. An OTP (one-time password) is a code sent to your phone that works once; never tell it to anyone, even if they say they are from the bank. 2FA (two-factor authentication) means you need two proofs to log in, for example a password plus an OTP, so a stolen password alone is not enough. A deepfake is a fake photo, video or voice made by AI that looks real; a voice clone copies a person's voice. A code word is a secret word that only your family knows to check who is real. AI (artificial intelligence) is a computer program that learns from data to make decisions.`,
  },
  {
    id: 'safety-kids',
    title: 'Real-life safety tips for kids',
    text: `Do not click links from strangers, and do not trust a message just because it looks urgent or promises a prize. Never share passwords or OTP codes, even with a friend. Use a long password with different letters, numbers and symbols, and not your name or 1234. Do not download free games, cracked apps or files from unknown websites. Tell a parent or teacher if something online feels strange, scary or too good to be true; you will not be in trouble. Do not talk about your address, school or family money online. Keep photos and school work backed up. If a "friend" asks you for money or a code in a message, call them on the number you already know. Agree on a family code word to check phone calls.`,
  },
  {
    id: 'safety-parents',
    title: 'Real-life safety tips for parents',
    text: `Agree a secret family code word and teach everyone, including grandparents, to ask for it if someone calls asking for money, even if the voice sounds exactly like a relative: AI can clone voices. Never give an OTP or a PIN to a caller, a bank never asks for it. Turn on 2FA for email, social media and mobile wallets. Use a password manager or long passphrases and a different password for each account. Keep the phone and apps updated. Make a backup of family photos and documents to a second place. Be careful with unknown links in WhatsApp or SMS, even from a known contact whose account might be hacked. Talk to children calmly about online dangers, so they come to you first and not hide a mistake.`,
  },
  {
    id: 'present-summary',
    title: 'Presentation help: a 1-minute summary',
    text: `One-minute summary for the judges: "Our game Sindhu Defenders is a 2D browser game for Theme 2: AI, Gamification and Cyber Security. Ranikot, the Great Wall of Sindh, is the player's phone, and its wall is the firewall. A learning AI Hacker, the Jadugar, sends cyber attacks as cartoon monsters: phishing, free-gift trojans, brute force password hammers, ransomware ghosts and finally a deepfake boss. The player defends with the right action, not a quiz: a lantern to check visitors, strong password bricks, backups and a secret family code word. The AI is real: it counts what the player fails at, calculates a weakness score (fails plus 1) divided by (faced plus 2), and attacks the weak spots 85 percent of the time while exploring 15 percent. Mithu the parrot is a local chatbot using Ollama and our own knowledge. It works offline, in English and Urdu."`,
  },
  {
    id: 'present-questions',
    title: 'Presentation help: likely judge questions and answers',
    text: `Is the AI real? Yes: it records data, calculates a weakness score and decides what to send, and you can see its log; it is a small but real learning system. Why not a big AI like ChatGPT? A small local model is free, private and works offline on a school laptop. Is it only a game? The lessons are real: the same five habits protect real phones. What is original? The Sindhi setting, the adaptive hacker, the boss that remembers the earlier levels and the code word deepfake trick. What did you learn? How to use Phaser, JavaScript, git and AI ideas like exploit and explore, TF-IDF and RAG. What would you add? Shah-Pere Gate and Mohan Gate levels, Marvi as a playable hero, and sounds and music. Who helped? Teachers, free tools like Gemini, Photopea and Kenney, and Claude Code as a coding assistant.`,
  },
];
