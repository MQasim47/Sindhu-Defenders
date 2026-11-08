// Mithu's knowledge, part 2: every monster and the AI in depth. See chunksProject.js.
export const CHUNKS_MONSTERS_AI = [
  {
    id: 'monster-behroopia',
    title: 'Monster: Behroopia Qasid (phishing)',
    text: `Behroopia Qasid ("the shape-shifting messenger") is the phishing monster. Real attack: phishing, where a fake message or person pretends to be a friend to steal your information. Behaviour in the game: it walks to the gate disguised as a villager (Chacha, Amma or Bacha) among real villagers. If it is let in, it steals 3 coins. Sometimes a revealed Behroopia throws a spam blob that slows Dodo, and Space jumps over it. How to beat it: hold Q and shine the Sach ki Lalten on a visitor for about 0.6 seconds; the disguise falls off and a tiny tell shows. The tells are: Chacha's badge is violet instead of green, Amma has a tiny purple tail that flicks, and Bacha's eyes glow for a moment. Real villagers smile and give a coin when greeted with E. Lesson: check before you trust. Real life: look at the sender's address, the spelling, and ask yourself "was I expecting this?" before you click.`,
  },
  {
    id: 'monster-trojan',
    title: 'Monster: Trojan Ghoda (malware in free gifts)',
    text: `Trojan Ghoda is a wooden horse cart. It is named after the Trojan horse story, and a trojan in computers is malware hidden inside something that looks useful or free. Behaviour: in wave 2 of Level 1 the horse rolls in and drops shiny gifts marked FREE that look like coins or power-ups. If Dodo opens one, a swarm of bugs bursts out and nibbles his coins. How to beat it: hold the lantern on a gift to check it (it turns see-through and shows the bugs, you get 2 coins), or simply ignore it, and sweep any bugs with the Antivirus Jharoo by pressing E. The AI sends more gifts when you open many. Lesson: free gifts from strangers can be traps. Real life: do not download "free" games, cracked apps or files from unknown people, and do not plug in a strange USB stick.`,
  },
  {
    id: 'monster-hathoda',
    title: 'Monster: Hathoda Dev (brute force passwords)',
    text: `Hathoda Dev ("hammer giant") is the brute force monster. Real attack: brute force means a hacker tries thousands or millions of passwords until one works. Behaviour: a big brute walks to the wall section that HackerBrain picked and hammers it. The damage of each hit goes down with the crack time of that wall's password (on a log scale): a weak password like 1234 breaks in a few hits, a strong one is barely chipped and Hathoda gets tired and gives up. Each hammer hit sends a shockwave ring on the ground; Dodo must jump over it with Space or he is knocked back and drops his bricks. A broken wall can be rebuilt with new bricks. How to beat it: place bricks to make the password long and mixed (lowercase, UPPERCASE, numbers and symbols). Lesson: long, mixed passwords are strong. In the boss fight his slam comes back as the Hathoda Lehar.`,
  },
  {
    id: 'monster-taala',
    title: 'Monster: Taala Bhoot (ransomware)',
    text: `Taala Bhoot ("lock ghost") is the ransomware monster. Real attack: ransomware locks your files and asks for money to open them. Behaviour: in wave 2 of Level 2 a ghost with a padlock floats to a building chosen by HackerBrain (buildings without a backup first), chains it and the locked building slowly drains coins, about one coin every 2.6 seconds. How to beat it: the best defence is to back up the building BEFORE the ghost comes (stand near it and hold E for one second). If the building was backed up, press E near it and a scroll flies from the shelf, the chains shatter and everything is restored at once. If there was no backup, Dodo must stay near it for an 8-second unlock bar while coins keep draining. Lesson: keep a backup, so ransomware cannot win. Real life: keep a copy of photos and school files on another device or drive.`,
  },
  {
    id: 'monster-jadugar',
    title: 'Monster: Nakal Jadugar (deepfake and voice clone boss)',
    text: `Nakal Jadugar ("the copycat wizard") is the boss at Miri Fort and he is also the AI Hacker himself. Real attack: deepfakes and voice cloning, where AI makes a fake voice, photo or video that looks like a real person, for example a "relative" calling for money. Behaviour: in the fight he floats, teleports and uses Phishing Barish, Hathoda Lehar, Trojan Tohfa and, in Round 3, the Deepfake Chaal where three identical Mithus ask for the gate key. How to beat him: burn his shield and take his health with the lantern, use the Firewall Shield and jump, and for the Mithu copies ask each one the secret code word and give the key only to the one that shows the picture you chose. Lesson: use a secret family code word to check who is real. When he is beaten he shrinks into a tiny harmless puff.`,
  },
  {
    id: 'ai-hackerbrain',
    title: 'The AI in depth: HackerBrain, data, learning, decision',
    text: `The AI Hacker is a small program called HackerBrain (src/ai/HackerBrain.js). It is a real learning system, kept small so students can explain it. It has three steps. Data: it counts, for every disguise (Chacha, Amma, Bacha), attack (phishing, trojan, hathoda, taala), wall section (left, center, right) and building (library, granary, house), how many times it was faced and how many times the player failed. Learning: it turns the counts into a weakness score. Decision: before each wave it plans what to send, which disguise to use, which wall section to hammer and which building to lock. The player can see it working: the Jadugar thinks between waves with his crystal ball glowing, the new wave aims at your mistakes, and the end report shows what the AI learned. No internet and no hidden cheating: the AI only sees what a normal player does in the game.`,
  },
  {
    id: 'ai-formula',
    title: 'The weakness formula (fails+1)/(faced+2) with an example',
    text: `The weakness score is (fails + 1) / (faced + 2). "Faced" is how many times the AI tried something and "fails" is how many times the player failed against it. The +1 and +2 mean the AI does not decide too early. If nothing is known yet: (0+1)/(0+2) = 0.5, which means "maybe". If the player failed 3 times out of 3: (3+1)/(3+2) = 0.8, a strong weakness. If the player never failed in 6 tries: (0+1)/(6+2) = 0.125, so the AI sends less of it. Worked example: Chacha 0.8, Amma 0.125, Bacha 0.5. The AI squares the scores so the weak spot counts more: 0.64, 0.016 and 0.25. Add them (0.906) and divide: Chacha 71 percent, Amma 2 percent, Bacha 28 percent of the next phishers. So the AI sends mostly Chacha disguises because Dodo failed against Chacha. This is the same idea as a real recommender or a game AI: more data gives a more confident score.`,
  },
  {
    id: 'ai-explore',
    title: 'Exploit 85% and explore 15% and why exploring matters',
    text: `Before each plan the AI flips a weighted coin. 85 percent of the time it EXPLOITS: it uses what it knows and sends more of what the player is weak against. 15 percent of the time it EXPLORES: it chooses random numbers and tries something different. Why explore? If the AI only did what worked before, it could get stuck. Maybe the player was weak against Amma in the past but has now learned the purple tail, and the AI would never find out. Maybe a wall section it never attacked is actually the weakest. Exploring is how it keeps learning and keeps the player on their toes. This is a famous idea in AI called the exploration-exploitation trade-off, also used in games, ads and robots. Too much exploring wastes attacks; too little makes the AI predictable. 15 percent is a small, fair amount for a 12-year-old player.`,
  },
  {
    id: 'ai-choices',
    title: 'How the AI picks disguises, walls and buildings',
    text: `Disguises: for phishers it picks the disguise using weights from the weakness scores of Chacha, Amma and Bacha; if the player never checks old ladies, more phishers come as Amma. Attack types: from wave 2 it chooses between phishing and trojan, then between hathoda and taala in Level 2, again by weakness. Wall sections: Hathoda Dev goes to the section with the highest weakness score; a section that broke before is hammered again. A tie goes to the weakest password by crack time. Buildings: Taala Bhoot chooses the building with the highest score, and buildings without a backup first. In explore mode a target is chosen at random. A limit keeps the game fair: never more than 5 or 6 dangers at the same time. The choices are written in a short log in plain words, for example "Dodo did not check Chacha 3 times, sending more Chacha disguises", and Mithu can read that log to answer "what has the AI learned about me?".`,
  },
  {
    id: 'ai-memory',
    title: 'How the AI remembers across levels for the boss',
    text: `When Level 1 starts, a new run begins and the AI's memory is cleared. At the end of each level HackerBrain saves its counts (faced and fails for every item) in the browser's localStorage under the run memory (src/ai/runMemory.js). Level 2 loads Level 1's counts, so the AI remembers you. In the boss fight the BossBrain reads this memory to start Round 1 with real weaknesses: if you failed against phishers it uses Phishing Barish more, if walls broke it uses Hathoda Lehar more, and if you opened FREE gifts Trojan Tohfa starts with a high score. After the fight the boss saves what it learned (which attack hit most) so the Cyber Rakshak certificate can print it in the final AI report. localStorage keeps this data only on your own computer and nothing is sent to the internet. Playing Level 1 again starts a fresh run.`,
  },
  {
    id: 'ai-password',
    title: 'The password AI: zxcvbn and crack time',
    text: `The password checker uses zxcvbn, a free library made by Dropbox. It does not just count letters like "has 8 characters". It guesses how a real attacker would crack the password. It knows lists of common passwords, first names, English words, keyboard patterns like qwerty, repeated letters like aaaa, dates and number runs like 1234, and tricks like p@ssw0rd. It adds up how many guesses an attacker would need and divides by a guess speed to give a crack time such as "3 seconds" or "400 years". That is why 1234 and "password" are weak even when you add one letter: they are the first things attackers try. Long and mixed passwords with random letters, numbers and symbols take many more guesses. The wall in Level 2 shows the password, a strength bar and the crack time in words, and Hathoda's hammer damage gets smaller as the crack time grows.`,
  },
];
