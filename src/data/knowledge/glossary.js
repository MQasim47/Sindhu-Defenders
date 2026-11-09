// The glossary: ONE knowledge chunk for every cyber-security / AI term of the game.
// Each text has the same four parts: a simple definition, a real-life example, where the game shows it
// (monster / level), and how the player defends against it.
//   id       - the name of the term
//   name     - how it is written in questions and in the list answer
//   words    - the keyword router (src/ai/termRouter.js): if a question contains one of these (a regular
//              expression, lower case), this chunk is ALWAYS used first
//   line     - one line for the list answer and the FAQ
//   check    - words that a good answer must contain (npm run test:chat checks them)
export const GLOSSARY = [
  {
    id: 'phishing',
    name: 'Phishing',
    words: ['phish', 'fake links?', 'scam', 'fake (message|email|sms|bank|website)s?', 'suspicious links?', 'behroopia'],
    line: 'Phishing is a fake message, call or person that tricks you into giving away secrets or money.',
    check: ['phishing', 'fake', 'behroopia'],
    text: `Phishing is a trick where a fake message, email, call or person pretends to be someone you trust, so that you give away a password, an OTP or money. Real-life example: an SMS says "Mehran Bank: your account is blocked, click this link" and the link is fake. In our game this is the Behroopia Qasid in Level 1 (Sann Gate): he walks to the gate disguised as a villager, and in Level 3 he comes back as the Fake Letter. How to defend: check before you trust. In the game you shine the Sach ki Lalten (hold Q in Level 1, or press 1 Lantern in Level 3). In real life look at who sent it, never click a link you did not expect, and ask a parent.`,
  },
  {
    id: 'password',
    name: 'Password',
    words: ['passwords?', 'pass ?words?', 'passcodes?', 'passphrases?', 'zxcvbn', '\\b1234\\b'],
    line: 'A password is a secret that protects an account. Long and mixed is strong, 1234 is weak.',
    check: ['password', 'long', '1234'],
    text: `A password is a secret word or phrase that protects an account. A strong password is long and mixed: lowercase and UPPERCASE letters, numbers and symbols. A weak one like 1234, abc or "password" is guessed in less than a second. Real-life example: using your name and birth year for every account, so one leak opens everything. In our game, passwords are the heart of Level 2 (Amri Gate): you build them from bricks on the wall, and the zxcvbn checker shows the crack time ("3 seconds" or "400 years"). Hathoda Dev hammers the wall, and in Level 3 the Giant Hammer attack. How to defend: use a long, mixed, different password for every account (press 2 Password Shield in Level 3), never share it, and add 2FA.`,
  },
  {
    id: 'bruteforce',
    name: 'Brute force',
    words: ['brute', 'password guess(ing)?', 'guess(ing)? passwords?', 'crack(ing)? (a )?passwords?', 'hathoda', 'hammer'],
    line: 'Brute force means a hacker tries thousands of passwords until one works.',
    check: ['brute force', 'passwords', 'hathoda'],
    text: `Brute force is when a hacker (or a program) tries thousands or millions of passwords, one after another, until one works. Real-life example: a program tries 1234, 1111, qwerty, password and every name in a list on someone's account. In our game this is Hathoda Dev, the big brute who hammers your wall in Level 2 (Amri Gate), and the Giant Hammer in Level 3. Weak passwords break in a few hits, strong ones barely get a scratch. How to defend: make the password long and mixed so that guessing takes years, never use common words or number runs, and turn on 2FA. In the game: place long, mixed bricks in Level 2, and press 2 (Password Shield) in Level 3.`,
  },
  {
    id: 'malware',
    name: 'Malware',
    words: ['malware', 'malicious (software|programs?|apps?)', 'spyware', 'adware', 'bad software'],
    line: 'Malware is any bad software made to harm a device or steal data.',
    check: ['malware', 'software', 'virus'],
    text: `Malware means "bad software": any program made to harm a device, spy on you or steal data. Viruses, trojans, spyware and ransomware are all kinds of malware. Real-life example: a "free" game from a strange website that secretly steals your photos. In our game malware is shown by the Trojan Ghoda and its FREE gifts in Level 1 (Sann Gate): opening a gift releases a swarm of bugs, and in Level 3 it is the FREE Gift attack. How to defend: only install apps from trusted stores, never open files from strangers, keep your phone updated, and check a gift before you open it (hold Q, or press 1 Lantern in Level 3). Sweep the bugs with the Antivirus Jharoo (E).`,
  },
  {
    id: 'virus',
    name: 'Virus',
    words: ['virus(es)?', 'worms?', 'computer virus'],
    line: 'A virus is malware that copies itself from file to file and spreads.',
    check: ['virus', 'copies', 'malware'],
    text: `A virus is a kind of malware that copies itself from file to file and from computer to computer, a little like a cold that spreads between people. It needs you to open an infected file or program to start. Real-life example: a file shared on a USB stick that infects every computer it is plugged into. In our game the bugs that swarm out of an opened FREE gift in Level 1 (Sann Gate) show what malware like a virus does: they eat your coins. How to defend: do not open files or plug in USB sticks from strangers, install updates, use an antivirus, and in the game sweep the bugs with the Antivirus Jharoo (press E) or check gifts first with the lantern.`,
  },
  {
    id: 'trojan',
    name: 'Trojan',
    words: ['trojans?', 'trojan horse', 'wooden horse', 'free gifts?', 'free (apps?|games?)', 'cracked (apps?|games?)', 'ghoda'],
    line: 'A trojan is malware hidden inside something that looks free or useful.',
    check: ['trojan', 'free', 'gift'],
    text: `A trojan is malware that hides inside something that looks useful or free, like the wooden horse in the old story. You open it yourself because you think it is a gift. Real-life example: a "free" cracked game or a "photo editor" that secretly installs a spy program. In our game this is the Trojan Ghoda, a wooden horse cart that drops shiny FREE gifts in Level 1 (Sann Gate); opening one releases bugs that eat your coins. In Level 3 it is the FREE Gift attack. How to defend: free gifts from strangers can be traps. Check a gift with the lantern (hold Q, or press 1 in Level 3) or ignore it, and in real life only download from trusted places.`,
  },
  {
    id: 'ransomware',
    name: 'Ransomware',
    words: ['ransom', 'locked files', 'lock(s|ed)? (my |your |the )?files', 'files? (are |is |got |were |was )?(locked|encrypted)', 'encrypt', 'taala', 'padlock', 'pay (money )?to unlock'],
    line: 'Ransomware locks your files and demands money to open them. A backup beats it.',
    check: ['ransomware', 'lock', 'backup'],
    text: `Ransomware is malware that locks (encrypts) your files and then demands money, a "ransom", to unlock them. Real-life example: all the photos and school files on a computer suddenly cannot be opened, and a message asks for payment. In our game this is the Taala Bhoot, the lock ghost with a padlock, in Level 2 (Amri Gate): he chains a building and coins drain away. In Level 3 it is the Padlock Chain attack. How to defend: keep a backup, a spare copy of your files in another place. In the game hold E next to a building to back it up, then a locked building is restored at once; in Level 3 press 3 (Backup Scroll). Never pay: with a backup you do not need to.`,
  },
  {
    id: 'backup',
    name: 'Backup',
    words: ['back ?-?ups?', 'spare cop(y|ies)', 'restore (my )?files', 'scroll'],
    line: 'A backup is a spare copy of your files in another safe place.',
    check: ['backup', 'copy', 'ransomware'],
    text: `A backup is a spare copy of your files kept in another safe place, so you can get them back if the phone is lost, broken or locked by ransomware. Real-life example: copying family photos and school work to a second device or a memory card every month. In our game, backups are made in Level 2 (Amri Gate): stand next to a building and hold E for one second, then a Backup Scroll flies to the Kutubkhana shelf and the building gets a "Backed up" badge. A backed-up building is restored instantly when Taala Bhoot locks it. In Level 3 the Backup Scroll is button 3, the answer to the Padlock Chain. How to defend: make the backup BEFORE the attack, not after.`,
  },
  {
    id: 'firewall',
    name: 'Firewall',
    words: ['fire ?walls?', 'great wall', 'ranikot.?s wall', 'wall of ranikot', 'ranikot wall'],
    line: 'A firewall is a wall that checks traffic and blocks bad connections.',
    check: ['firewall', 'wall', 'ranikot'],
    text: `A firewall is a wall between your device or network and the outside world. It checks the traffic and blocks bad connections, like the guards at a fort gate. Real-life example: the firewall in your Wi-Fi router or in your computer blocks a stranger who tries to connect without permission. In our game the whole story is a firewall: Ranikot Fort, the Great Wall of Sindh, is your phone or network, and its wall is the firewall. The Jadugar Hacker sends monsters against the gates: Sann Gate in Level 1, Amri Gate in Level 2 and Miri Fort in Level 3. How to defend: keep the firewall on, keep software updated, and do not open doors for strangers. A firewall helps, but you must still check before you trust.`,
  },
  {
    id: 'otp',
    name: 'OTP',
    words: ['\\botps?\\b', 'one[- ]time (password|code|pin)s?', 'codes? on (my |the )?phone', '(sms|verification|text) codes?'],
    line: 'An OTP is a one-time code sent to your phone. Never share it with anyone.',
    check: ['otp', 'code', 'never'],
    text: `An OTP (one-time password) is a short code, often 4 to 6 numbers, that is sent to your phone for one login or payment and works only once. Real-life example: a caller says "I am from the bank, tell me the code that just came on your phone". That is a scam: whoever has the OTP can take your money. In our game the same idea is the secret code word in Level 3 (Miri Fort): a secret you only give to the real person. How to defend: never tell an OTP to anyone, not even a friend or someone who says they are from the bank. A real bank never asks for it. If a code arrives that you did not ask for, someone may be trying to log in: change your password.`,
  },
  {
    id: '2fa',
    name: '2FA',
    words: ['\\b2 ?fa\\b', 'two[- ]?(factor|step)', '2[- ]step', 'two factor authentication', 'multi[- ]?factor'],
    line: '2FA means you need two proofs to log in, for example a password and an OTP.',
    check: ['2fa', 'two', 'password'],
    text: `2FA (two-factor authentication) means you need two proofs to log in, for example something you know (a password) and something you have (an OTP sent to your phone). So even if a hacker steals your password, the door is still locked. Real-life example: logging in to your email needs the password and then a code from your phone. In our game 2FA is like a wall with a second lock: Level 2 (Amri Gate) teaches strong passwords, the first lock, and brute force Hathoda Dev cannot get past a strong password plus a second check. How to defend: turn on 2FA for email, social media and mobile wallets, and never share the OTP codes.`,
  },
  {
    id: 'deepfake',
    name: 'Deepfake',
    words: ['deep ?fakes?', 'fake (videos?|photos?|images?|pictures?)', 'ai (fake|video)s?', 'nakal'],
    line: 'A deepfake is a fake photo, video or voice made by AI that looks real.',
    check: ['deepfake', 'ai', 'real'],
    text: `A deepfake is a fake photo, video or voice that was made by AI to look and sound real, for example a video of a person saying something they never said. Real-life example: a scammer shows a "video call" of a relative asking for money, but the face and voice are made by AI. In our game this is the boss of Level 3 (Miri Fort), the Nakal Jadugar ("copycat wizard"): in the finale he changes into a fake Mithu face to face and asks for the gate key, and the Fake Mithu attack sends a Mithu-voice bubble. How to defend: do not trust a face or voice alone. Ask the secret family code word (press 4 Code Word in Level 3), or call the person back on a number you already know.`,
  },
  {
    id: 'voiceclone',
    name: 'Voice clone',
    words: ['voice clon(e|es|ing)', 'clon(e|ed|ing) (my |a |the )?voices?', 'copy (my |a )?voices?', 'fake voices?', 'mithu.?voice'],
    line: 'A voice clone is an AI copy of a real person\'s voice, used by scammers.',
    check: ['voice', 'clone', 'code word'],
    text: `A voice clone is a copy of a real person's voice made by AI from just a few seconds of recording. A scammer can use it to phone you and sound exactly like your uncle, your teacher or a friend. Real-life example: "Beta, I am in trouble, send money now!" in a voice that sounds like a family member. In our game this is the Fake Mithu: in Level 3 (Miri Fort) a bubble says "Dodo, quick! Give me the gate key!" in Mithu's voice, but it is a fake. How to defend: agree on a secret family code word and ask for it. AI can copy a voice, but it cannot know a secret you never said online. In the game press 4 (Code Word) to reveal the fake.`,
  },
  {
    id: 'codeword',
    name: 'Code word',
    words: ['code ?words?', 'secret words?', 'family words?', 'secret codes?', 'mango', 'matka', 'camel'],
    line: 'A code word is a secret word only you and your family know, used to check who is real.',
    check: ['code word', 'secret', 'family'],
    text: `A code word is a secret word that only you and your family (or you and a very close friend) know, used to check that a person is really who they say they are. Real-life example: a caller who sounds like your cousin asks for money, and you say "What is our code word?". A fake cannot answer. In our game, before the boss fight in Level 3 (Miri Fort), Mithu and you choose a code word by picking a picture card: Mango, Matka, Ajrak or Camel. The Fake Mithu and the Nakal Jadugar cannot know it. How to defend: choose a code word together with your family, never post it online, and use it whenever someone asks for money or secrets by phone or message. In the game press 4 (Code Word).`,
  },
  {
    id: 'hacker',
    name: 'Hacker',
    words: ['hackers?', 'hacking', 'hacked', 'black ?hat', 'white ?hat', 'jadugar hacker'],
    line: 'A hacker is a person who breaks into computers. Bad ones steal, good ones help fix problems.',
    check: ['hacker', 'computer', 'jadugar'],
    text: `A hacker is a person who finds ways into computers, phones and accounts. A "black hat" hacker breaks in to steal or harm; a "white hat" hacker finds the weak spots to help fix them. Real-life example: a criminal who guesses a weak password and takes over an account, or a student who reports a bug to a company. In our game the Jadugar Hacker is a funny wizard with a crystal ball, a friendly training partner: he is an AI that learns how you play and sends monsters at your weak spots (phishing, trojans, brute force, ransomware and deepfakes). How to defend: use strong passwords, turn on 2FA, check before you trust, keep backups and a family code word.`,
  },
  {
    id: 'ai',
    name: 'AI',
    words: ['artificial intelligence', 'what (is|are) (an? )?ai\\b', 'define ai\\b', 'meaning of ai\\b', '^ai\\??$', 'machine learning'],
    line: 'AI (artificial intelligence) is a computer program that learns from data to make decisions.',
    check: ['ai', 'learns', 'data'],
    text: `AI (artificial intelligence) is a computer program that learns from data to make decisions, instead of only following fixed rules. Real-life example: the video app that suggests what to watch next, a map app that finds the fastest road, or a chatbot that answers questions. In our game there are three AIs. The AI Hacker (the Jadugar) counts what you fail at, calculates a weakness score and attacks your weak spots (85 percent exploit, 15 percent explore). The zxcvbn checker estimates how fast a password can be cracked. And Mithu is a chatbot that runs on a small local model. AI can also be used by bad people, for example for deepfakes and voice clones, so it is important to understand it. How to defend: stay curious, check before you trust and use a code word.`,
  },
  {
    id: 'tfidf',
    name: 'TF-IDF',
    words: ['tf[- ]?idf', 'term frequency', 'inverse document'],
    line: 'TF-IDF scores how important a word is: common words count little, rare words count a lot.',
    check: ['tf-idf', 'word', 'cosine'],
    text: `TF-IDF is a way to give every word a score for how important it is in a text. TF (term frequency) is how often the word appears in that text. IDF (inverse document frequency) lowers the score of words that appear in every text, like "the" or "game", and raises the score of rare words like "zxcvbn". Then a question and every text become lists of numbers, and cosine similarity finds the text whose list points in the most similar direction. Real-life example: a search box that finds the best page for your words. In our game this is how Mithu, the chatbot, finds the right pieces of knowledge for your question (the retrieval part of RAG), also when Ollama is off. It is a search tool, not a defence.`,
  },
  {
    id: 'llm',
    name: 'LLM',
    words: ['\\bllms?\\b', 'large language models?', 'language models?', 'qwen', 'ollama'],
    line: 'An LLM (large language model) is an AI trained on lots of text that writes answers word by word.',
    check: ['llm', 'language', 'model'],
    text: `An LLM (large language model) is an AI that was trained on a huge amount of text. It writes an answer by predicting the next word again and again. It does not really "know" facts, so it can sound sure and still be wrong (this is called hallucination). Real-life example: the big chatbots that write emails and stories. In our game Mithu uses a small LLM, qwen2.5:1.5b, that runs on this computer through Ollama, a free program. Small and local means it works offline, is free and keeps your questions private. To keep it correct we give it only the right pieces of our own notes (RAG). How to stay safe: do not believe everything a chatbot says, and never type passwords or secrets into one.`,
  },
  {
    id: 'rag',
    name: 'RAG',
    words: ['\\brag\\b', 'retrieval[- ]augmented', 'retrieval'],
    line: 'RAG means the AI first retrieves the right notes, then writes its answer from them.',
    check: ['rag', 'retrieval', 'chunks'],
    text: `RAG (Retrieval-Augmented Generation) means: first RETRIEVE the most useful pieces of information for the question, then GENERATE the answer from only those pieces. This keeps a small AI model focused and honest, because it reads the facts instead of guessing. Real-life example: a student who looks up the right page in the book before answering. In our game, Mithu's notes are split into small titled chunks. For every question TF-IDF and cosine similarity pick the best 3 or 4 chunks, a glossary router puts the chunk of any cyber-security term first, and only those chunks plus the live game data are sent to the Ollama model. If Ollama is off, Mithu answers straight from the best chunk or FAQ pair.`,
  },
];

// the list answer: every term with one line each
export const GLOSSARY_LIST = {
  id: 'glossary-list',
  title: 'List of all cyber security terms in the game',
  text: `The cyber security terms of Sindhu Defenders:\n${GLOSSARY.map((g) => `- ${g.name}: ${g.line}`).join('\n')}`,
};

// FAQ pairs made from the glossary (3+ phrasings for each term)
export const GLOSSARY_FAQ = GLOSSARY.map((g) => {
  const n = g.name.toLowerCase();
  return {
    q: [`what is ${n}`, `explain ${n}`, `define ${n}`, `tell me about ${n}`, `${n} meaning`, `what does ${n} mean`],
    a: g.text,
  };
}).concat([
  {
    q: ['which cyber security terms are used in this game', 'list the cyber security terms', 'what terms are in the game', 'cyber security glossary', 'list all terms', 'what words will i learn'],
    a: GLOSSARY_LIST.text,
  },
]);
