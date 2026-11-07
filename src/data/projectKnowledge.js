// Everything Mithu knows about the project. English only.
// 1. KNOWLEDGE_TEXT goes into the system prompt of the AI model (Ollama).
// 2. FAQ is used by the offline question finder (src/ai/faqBot.js).
// Keep the two in line with each other. Only write facts that are true.

export const KNOWLEDGE_TEXT = `
STORY
- Ranikot Fort is in Jamshoro, Sindh. Its wall is about 31 km long, so it is called the "Great Wall of Sindh".
- Ranikot has four gates: Sann Gate, Amri Gate, Shah-Pere Gate and Mohan Gate. Miri Fort is a smaller fort inside Ranikot.
- In the game, the fort is your phone or network, and the wall is the firewall.
- A learning AI Hacker (the Jadugar) sends cyber attacks that look like cartoon monsters. The player defends the fort by using the correct cyber safety action, not just by running away.

CHARACTERS
- Dodo is the boy hero. He wears a Sindhi topi and an Ajrak cape. Marvi is the girl hero (planned, selectable later).
- Mithu is a friendly green parrot guide. He gives hints and answers questions. He is not a robot.
- Jadugar Hacker is the funny wizard villain. He is the AI. He stands on the fort wall near the gate with a crystal ball and sends the monsters.

MONSTERS AND LESSONS
- Behroopia Qasid = phishing. It walks to the gate disguised as a villager (Chacha, Amma or Bacha). If it gets in, it steals coins. Shine the Sach ki Lalten (lantern) on it to reveal it. Each disguise has one small tell: Chacha's badge is the wrong colour (violet, not green), Amma has a tiny purple tail that flicks, Bacha's eyes glow for a moment. Lesson: check before you trust.
- Trojan Ghoda = malware hidden in free things. A wooden horse drops shiny FREE gifts. If you open one, bugs come out and nibble your coins. Check the gift with the lantern, or ignore it. Sweep bugs with the Antivirus Jharoo (press E). Lesson: free gifts from strangers can be traps.
- Hathoda Dev = brute force password guessing (planned for level 2). Lesson: long, mixed passwords are strong.
- Taala Bhoot = ransomware (planned for level 2). Lesson: keep backups.
- Nakal Jadugar = deepfake boss (planned for level 3). He copies Mithu. Lesson: use a secret family code word to check who is real.

LEVELS
- Level 1 is Sann Gate: villagers, Behroopia Qasid and Trojan Ghoda. It has an intro, a prepare time and three waves. After waves 1 and 2 the AI re-plans.
- Level 2 is Amri Gate (planned). Level 3 is the boss at Miri Fort (planned).

CONTROLS
- Move with arrow keys or WASD. Jump with Space. Hold Q to raise the lantern, then use the arrow keys or WASD to aim the light beam. Press E to greet a real villager or to sweep bugs. Esc pauses the game.

HOW THE AI HACKER WORKS (HackerBrain)
- It follows three steps: data, learning, decision.
- Data: it counts how many times it sent each disguise (Chacha, Amma, Bacha) and each attack (phishing, trojan), and how many times the player failed.
- Learning: weakness score = (fails + 1) / (times sent + 2). A high score means the player is weak against it.
- Decision: before each wave it plans. 85 percent of the time it exploits: it sends more of what the player is weak against. 15 percent of the time it explores: it tries something random so it keeps learning.
- The numbers it uses are real. The results screen shows the biggest weakness and a tip.

TOOLS USED
- Phaser (game engine), JavaScript, Vite (build tool), Gemini (for pictures), Photopea (picture editing), Kenney and Pixabay (free assets), zxcvbn (password strength), Ollama (runs the Mithu chatbot on the computer), Claude Code (helped write the code).

CYBER SAFETY WORDS
- Phishing: a trick message or person that pretends to be a friend to steal your information. Check before you trust.
- Password: a secret word that protects an account. Use a long one with letters, numbers and symbols, and do not reuse it.
- Brute force: a hacker tries thousands of passwords until one works. Long passwords take much longer to guess.
- Malware: bad software, like viruses, that harms a device.
- Trojan: malware hidden inside something that looks useful or free.
- Ransomware: malware that locks your files and asks for money. A backup lets you restore them.
- Backup: a spare copy of your files, kept in a safe place.
- Firewall: a wall that blocks bad traffic from entering your network.
- OTP: a one-time code sent to you. Never share it with anyone.
- Deepfake: a fake voice, photo or video made by AI to look real.
- Code word: a secret word that only you and your family know, used to check who is real.
- AI: a computer program that learns from data to make decisions.
`.trim();

// Short question and answer pairs for the offline finder. Each answer is at most 3 short sentences.
export const FAQ = [
  {
    q: ['what is this game about', 'what is sindhu defenders', 'tell me about the game', 'explain the game', 'game story'],
    a: 'Sindhu Defenders is a game about Ranikot Fort in Sindh. You are Dodo, and you protect the fort from cyber attacks that look like cartoon monsters. Each monster teaches one cyber safety lesson.',
  },
  {
    q: ['what is ranikot', 'tell me about ranikot fort', 'how long is the wall', 'great wall of sindh', 'where is ranikot'],
    a: 'Ranikot Fort is in Jamshoro, Sindh. Its wall is about 31 km long, so people call it the Great Wall of Sindh.',
  },
  {
    q: ['how many gates does ranikot have', 'what are the gates', 'names of the gates', 'sann amri shah-pere mohan'],
    a: 'Ranikot has four gates: Sann, Amri, Shah-Pere and Mohan. Level 1 of the game is at Sann Gate.',
  },
  {
    q: ['what is miri fort', 'tell me about miri fort'],
    a: 'Miri Fort is a smaller fort inside Ranikot. In our game the final boss level happens there.',
  },
  {
    q: ['why is the fort a phone', 'what does the fort mean', 'what is the wall in the game', 'what is the firewall in the game', 'fort represents'],
    a: 'In the game, the fort is your phone or network, and the wall is the firewall. The monsters are attacks that try to get inside.',
  },
  {
    q: ['who is dodo', 'tell me about dodo', 'who is the hero', 'who do i play'],
    a: 'Dodo is the boy hero you play. He wears a Sindhi topi and an Ajrak cape. A girl hero called Marvi is planned too.',
  },
  {
    q: ['who is mithu', 'who are you', 'what are you', 'tell me about yourself', 'are you a robot'],
    a: 'I am Mithu, a friendly green parrot and your guide in Sindhu Defenders. I give hints and answer your questions. I am not a robot!',
  },
  {
    q: ['who is the jadugar', 'who is the villain', 'who is the wizard', 'who is the hacker', 'tell me about the jadugar hacker'],
    a: 'The Jadugar Hacker is the funny wizard villain and he is the AI of the game. He stands on the wall near the gate with a crystal ball and sends the monsters.',
  },
  {
    q: ['where is the ai', 'where is the ai in the game', 'which part is ai', 'how is ai used in this game', 'what ai does the game use'],
    a: 'The AI is the Jadugar Hacker on the wall near the gate. His brain is called HackerBrain: it watches what fools you and then sends more of that. You can see his plan in the results report.',
  },
  {
    q: ['how does the ai work', 'how does hackerbrain work', 'how does the jadugar decide', 'how does the ai learn', 'explain the ai brain'],
    a: 'HackerBrain has three steps: data, learning and decision. It counts how often you fail against each disguise and attack, turns that into a weakness score, and plans the next wave from it.',
  },
  {
    q: ['what is the weakness score', 'how is weakness calculated', 'formula', 'weakness score formula'],
    a: 'The weakness score is (fails + 1) divided by (times sent + 2). A high score means you are weak against that attack, so the AI sends more of it.',
  },
  {
    q: ['what is exploit and explore', 'what is exploit', 'what is explore', '85 percent 15 percent', 'why does the ai try random things'],
    a: 'The AI exploits 85 percent of the time: it sends more of what you are weak against. It explores 15 percent of the time: it tries something random so it can keep learning.',
  },
  {
    q: ['what is phishing', 'explain phishing', 'phishing meaning', 'what is a phishing attack'],
    a: 'Phishing is a trick where someone pretends to be a friend or a trusted company to steal your information. In the game, Behroopia Qasid does this by wearing a villager disguise. Always check before you trust!',
  },
  {
    q: ['what is behroopia qasid', 'what is behroopia', 'how do i beat behroopia', 'how do i catch behroopia', 'how to reveal the disguise'],
    a: 'Behroopia Qasid is a monster that disguises itself as a villager. Hold Q and shine the lantern on it for a moment to reveal it. Each disguise also has a small tell, like a wrong badge colour.',
  },
  {
    q: ['what are the tells', 'how do i know who is fake', 'how to spot behroopia', 'what is the tell of chacha amma bacha'],
    a: "Chacha's badge is violet instead of green. Amma has a tiny purple tail that flicks. Bacha's eyes glow for a moment.",
  },
  {
    q: ['what is a password', 'how to make a strong password', 'good password', 'strong password tips'],
    a: 'A password is a secret word that protects your account. A strong one is long and mixes letters, numbers and symbols, and you should never reuse it.',
  },
  {
    q: ['what is brute force', 'what is a brute force attack', 'how do hackers guess passwords'],
    a: 'Brute force means a hacker tries thousands of passwords until one works. Long and mixed passwords take much longer to guess, so they are safer.',
  },
  {
    q: ['what is malware', 'what is a virus', 'what is a computer virus', 'explain malware'],
    a: 'Malware is bad software, like a virus, that harms your device or steals information. Only install apps from places you trust.',
  },
  {
    q: ['what is a trojan', 'what is trojan ghoda', 'what is the wooden horse', 'what are the free gifts', 'explain trojan'],
    a: 'A trojan is malware hidden inside something that looks free or useful, like the wooden horse of the story. In the game the Trojan Ghoda drops shiny FREE gifts, and opening one lets bugs out. Check a gift with the lantern first!',
  },
  {
    q: ['how do i stop the bugs', 'what is the antivirus jharoo', 'what is the broom', 'how do i sweep bugs', 'what does e do'],
    a: 'Press E to sweep the bugs with the Antivirus Jharoo, our broom. It zaps the bugs in front of Dodo. Press E near a real villager to greet them instead.',
  },
  {
    q: ['what is ransomware', 'explain ransomware', 'what is taala bhoot'],
    a: 'Ransomware locks your files and asks for money to unlock them. A backup lets you restore your files without paying. Taala Bhoot, the lock ghost, will teach this in level 2.',
  },
  {
    q: ['what is a backup', 'why make a backup', 'why are backups important'],
    a: 'A backup is a spare copy of your files kept in a safe place. If your phone is lost or locked by ransomware, you can still get your files back.',
  },
  {
    q: ['what is a firewall', 'explain firewall', 'what does a firewall do'],
    a: 'A firewall is like a strong wall that blocks bad traffic from entering your network. In our game, the Ranikot wall is the firewall.',
  },
  {
    q: ['what is an otp', 'what is a one time password', 'should i share my otp', 'otp safety'],
    a: 'An OTP is a one-time code sent to you to prove it is really you. Never share it with anyone, even if they say they are from a bank.',
  },
  {
    q: ['what is a deepfake', 'explain deepfake', 'what is a fake voice', 'what is nakal jadugar'],
    a: 'A deepfake is a fake voice, photo or video made by AI to look real. The boss Nakal Jadugar will copy my voice in level 3, and you will use a secret code word to find the real Mithu.',
  },
  {
    q: ['what is a code word', 'why use a family code word', 'secret code word'],
    a: 'A code word is a secret word that only you and your family know. If someone calls and sounds like a relative, ask for the code word to check who is real.',
  },
  {
    q: ['what is ai', 'what is artificial intelligence', 'explain ai', 'how does ai learn'],
    a: 'AI is a computer program that learns from data to make decisions. Our Jadugar learns from how you play, and uses that to choose the next attack.',
  },
  {
    q: ['what is a spam', 'what is spam', 'what is the spam blob'],
    a: 'Spam is unwanted junk messages. In the game, a revealed Behroopia can throw a sticky spam blob. Jump over it with Space to avoid it.',
  },
  {
    q: ['how do i play', 'what are the controls', 'which keys do i press', 'how to move', 'controls'],
    a: 'Move with the arrow keys or WASD, and jump with Space. Hold Q to raise the lantern and aim it with the arrow keys. Press E to greet friends or sweep bugs.',
  },
  {
    q: ['how do i use the lantern', 'what is sach ki lalten', 'how do i aim the lantern', 'how do i check someone'],
    a: 'Hold Q to raise the Sach ki Lalten, then use the arrow keys or WASD to aim the light. Keep the light on a person for a moment to check them. A real villager smiles, but Behroopia loses its disguise.',
  },
  {
    q: ['how do i win', 'how do i get stars', 'how are stars given', 'how do i get three stars', 'what is the goal'],
    a: 'Stop the dangers before they get in. Check people and gifts with the lantern, and you will earn more stars. Get 3 stars by letting nothing through.',
  },
  {
    q: ['what are the levels', 'how many levels', 'what is level 1', 'what comes next', 'level list'],
    a: 'Level 1 is Sann Gate with Behroopia Qasid and the Trojan Ghoda. Level 2 at Amri Gate and a boss level at Miri Fort are planned next.',
  },
  {
    q: ['what tools were used', 'how was the game made', 'what technology did you use', 'which software', 'how was it built', 'what is phaser', 'what is vite'],
    a: 'The game is made with Phaser (a game engine), JavaScript and Vite. We also used Gemini, Photopea, Kenney, Pixabay, zxcvbn, Ollama and Claude Code.',
  },
  {
    q: ['what is ollama', 'how do you answer', 'are you a real ai', 'what model are you', 'how does the chatbot work'],
    a: 'When Ollama is running on this computer, I answer with a small AI model. If not, I use a built-in question finder, so I can still help offline.',
  },
  {
    q: ['why did you make this game', 'what is the purpose', 'what is stream', 'why cyber security'],
    a: 'It was made for the Sindh STREAM Journey 2026-27 competition, about AI, gamification and cyber security. It teaches cyber safety by playing, not by reading.',
  },
  {
    q: ['hello', 'hi', 'hey', 'salaam', 'assalam o alaikum'],
    a: 'Hello! I am Mithu. Ask me about the game, cyber safety or our AI.',
  },
];

// Shown when nothing matches.
export const NOT_SURE =
  'I can answer questions about Sindhu Defenders, cyber safety and our AI. Try one of the questions below!';
