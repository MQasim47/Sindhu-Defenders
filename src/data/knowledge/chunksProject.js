// Mithu's knowledge, part 1: the project, the story, the levels and the boss.
// Each chunk is a small titled piece (about 150-250 words). The chatbot finds the 3-4 best
// chunks for a question (see src/ai/retriever.js) and gives only those to the AI model.
// Only write facts that are true. English only.
export const CHUNKS_PROJECT = [
  {
    id: 'project-overview',
    title: 'The project: Sindhu Defenders',
    text: `Sindhu Defenders is a 2D browser game made for the Science in Sindh STREAM Journey 2026-27 competition in District Shaheed Benazirabad. It belongs to Theme 2: AI, Gamification and Cyber Security. It was made by school students (class 7 to 9), who present it and explain how it works. The game teaches cyber safety by letting the player DO the right thing, not by making them read. Every attack is a cartoon monster, and every defence is a power or an action of the hero Dodo. The game has three parts: Level 1 Sann Gate, Level 2 Amri Gate and the Boss fight at Miri Fort, plus a World Map to move between them. It works fully offline after the build, in English and Urdu, on a normal school laptop. The game also has a real AI inside: the AI Hacker (the Jadugar) learns how you play and attacks your weak spots.`,
  },
  {
    id: 'project-problem',
    title: 'The problem the game solves',
    text: `In Sindh, many people and children now use phones and the internet, but few were taught cyber safety. Scammers send fake links, fake prize messages, fake bank calls and fake voice messages. People lose money, accounts and photos. Common problems are phishing (fake messages and links), weak passwords such as 1234, free apps and files that hide viruses, ransomware that locks files, and now AI voice clones and deepfakes that sound like a family member. Reading a poster about this is boring and children forget it. Our goal is that a child learns by playing: the same habits that win the game (check before you trust, use a long mixed password, keep a backup, ask a secret code word) protect real phones, real families and real money. The game also shows children that AI can be used by bad people, so it is good to understand how it learns.`,
  },
  {
    id: 'project-goal',
    title: 'The goal and what the player learns',
    text: `The goal of Sindhu Defenders is to teach five cyber safety lessons that a 12-year-old can remember and repeat to parents. Lesson 1: check before you trust (phishing). Lesson 2: free gifts from strangers can be traps (malware, trojans). Lesson 3: long, mixed passwords are strong (brute force). Lesson 4: keep a backup, so ransomware cannot win. Lesson 5: use a secret family code word to check a voice (deepfakes and voice clones). Each lesson is one level or one move in the game, so the lessons are never separate from the fun. At the end the player gets the "Cyber Rakshak" certificate with the five lessons and the report of the AI Hacker. A second goal is to explain AI: students should understand data, learning and decision, and see that the AI in the game is not magic but a small formula.`,
  },
  {
    id: 'project-competition',
    title: 'The competition and Theme 2',
    text: `The competition is Science in Sindh STREAM Journey 2026-27 for District Shaheed Benazirabad. Our game uses Technology (code), Engineering (systems), Art (the Ajrak style) and Maths (the weakness formula). We chose Theme 2: Artificial Intelligence, Gamification and Cyber Security. Artificial Intelligence: the AI Hacker that learns, the password checker and the chatbot. Gamification: levels, stars, coins, a boss and a score of Humans against the AI. Cyber Security: phishing, passwords, malware, ransomware and deepfakes. Judges can ask the students how the AI works, why we chose each tool, and what the player learns. Mithu, the chatbot, can answer all of this.`,
  },
  {
    id: 'story-ranikot',
    title: 'Why Ranikot? The story',
    text: `We chose Ranikot Fort because it is a real treasure of Sindh. It is in Jamshoro district and is called the "Great Wall of Sindh". Its wall is about 31 km long, which makes it one of the longest fort walls in the world. It has four gates: Sann Gate, Amri Gate, Shah-Pere Gate and Mohan Gate, and a smaller fort inside called Miri Fort. A fort protects people from attackers, and a firewall protects a computer from attackers, so the idea fits perfectly. In the game, the fort is your phone or your network, and the wall is the firewall. A learning AI Hacker, the Jadugar, sends cyber attacks that look like monsters. The player must defend each gate with the correct cyber safety action. Using a Sindhi place also makes children proud of their own heritage, and it is not a copy of any other game.`,
  },
  {
    id: 'story-design',
    title: 'Design choices: monsters, no quizzes, no robots',
    text: `Why monsters and not quizzes? A quiz on a screen is read quickly and forgotten. In our game the attack is the monster's behaviour, and the defence is an action, so the child feels the lesson. For example, a fake visitor must be checked with a lantern, a brute must be stopped with a strong password. Text appears only as short hints from Mithu and in the end report. Why no robots? Cyber attackers are not metal robots, they are tricky people and programs, and we wanted friendly, funny-scary cartoon characters that suit a 12-year-old. The monsters are round and squishy, and the villain is a funny wizard (Jadugar). Why Ajrak and the Sindhi topi? Ajrak and topi are the pride of Sindh, so Dodo's cape is a red and indigo Ajrak, his hat is a topi, and the Ajrak pattern is used for frames, banners and shields.`,
  },
  {
    id: 'story-characters',
    title: 'Characters: Dodo, Marvi, Mithu and the Jadugar',
    text: `Dodo is the boy hero, a chibi character with a big round head, a colourful Sindhi topi and a flowing Ajrak cape. Marvi is the girl hero (planned as a choice). Why these names? Dodo and Marvi come from Sindhi folk heroes, so the heroes feel like part of our culture. Mithu is a green parrot (tota), the player's AI guide. Why a parrot? Parrots talk and repeat, so a parrot is a natural guide who speaks hints, and a parrot is a friendly, familiar bird in Sindh. Mithu is not a robot. The villain is the Jadugar Hacker, a funny wizard with a crystal ball. He is the AI: he sits on a ledge of the wall, watches the player and sends monsters. His crystal ball glows in the portrait in the top-right corner while he plans. In the boss fight he floats and teleports, and he is bigger.`,
  },
  {
    id: 'level-loop',
    title: 'The game loop: Tayyari, Hamla, Natija',
    text: `Every level follows the same loop in Urdu-style names. Tayyari means preparation: a short time (15 to 25 seconds) to get ready, for example to collect bricks in Level 2. Hamla means attack: the monsters arrive in waves and the player uses powers. Natija means result: stars, coins and the AI Hacker's report about what the AI learned. Why does each level have 2 waves? Because the AI needs a chance to learn. Wave 1 is easier and shows only the first monster type. Then the AI re-plans (the Jadugar thinks, his crystal ball glows) using what it saw, and wave 2 is different: it adds the second monster and aims at what you were weak against. So the player can see the AI adapting inside one level. Between the waves the game waits until the courtyard is empty, so it stays fair. A level takes about 2 to 3 minutes.`,
  },
  {
    id: 'controls',
    title: 'Controls',
    text: `Move with the Arrow keys or WASD. Jump with Space. Hold Q for the Sach ki Lalten (lantern): Dodo stands still and the arrow keys or WASD turn the light beam; a soft aim help bends the beam a little towards a person. Press E to use things: greet a friend, sweep bugs with the Antivirus Jharoo, pick up bricks, place a brick on a wall, unlock a building, and in Level 2 HOLD E near a building for one second to back it up. In the boss fight E raises the Firewall Shield, and in the deepfake trick E asks the code word and then gives the key. Esc opens the pause menu with Resume, Ask Mithu and Quit. On the World Map use the arrow keys to walk between places and Enter or E to start a level. There are also on-screen buttons for touch.`,
  },
  {
    id: 'level1',
    title: 'Level 1: Sann Gate (phishing and Trojan Ghoda)',
    text: `Level 1 is Sann Gate, and it teaches "check before you trust". Steps: intro (the camera shows the Jadugar), Tayyari (15 seconds), wave 1 (40 seconds), AI re-plan, wave 2 (55 seconds), results. In wave 1, villagers walk to the gate: real ones (Chacha, Amma, Bacha) and some Behroopia Qasid monsters disguised as villagers. The player holds Q and shines the Sach ki Lalten on a person for a moment; a fake loses its disguise and a tiny tell shows, a real villager smiles and can be greeted with E for a coin. If a fake is let in, it steals 3 coins. In wave 2 the Trojan Ghoda (a wooden horse) rolls in and drops shiny FREE gifts; opening one releases bugs. The player checks gifts with the lantern, ignores them, or sweeps bugs with the Jharoo. The player starts with 10 coins. With at least 1 star the player unlocks Amri Gate.`,
  },
  {
    id: 'level2',
    title: 'Level 2: Amri Gate (passwords and backups)',
    text: `Level 2 is Amri Gate and teaches strong passwords and backups. Steps: intro, Tayyari (25 seconds), wave 1 (45 seconds, Hathoda Dev only), AI re-plan, wave 2 (50 seconds, Hathoda Dev plus Taala Bhoot), results. The wall has three sections (left, center, right), each with a weak password at the start: abc, password and 1234. Password bricks lie in the yard: lowercase are clay brown, UPPERCASE red, numbers blue and symbols gold. Dodo picks up to 5 bricks on his head (E) and places them on a wall's password. The password checker zxcvbn rates it and shows the crack time. Hathoda Dev hammers the wall section the AI chooses; weak walls break, strong walls barely chip. Near each building (Kutubkhana, Anaaj Ghar, Ghar) the player holds E for one second to back it up: a scroll flies to the shelf and a "Backed up" badge appears. In wave 2 the Taala Bhoot ghosts lock buildings.`,
  },
  {
    id: 'level2-backup',
    title: 'Level 2 backups and Taala Bhoot in detail',
    text: `Backups work like this: stand next to a building that is not backed up, a prompt "Hold E: Backup" appears, hold E for 1 second while a ring fills, and a scroll flies by itself in an arc with a sparkle trail from the building to the Kutubkhana shelf. The shelf glows and the building gets a "Backed up" badge. Dodo's hands stay free, so he can keep carrying bricks. Taala Bhoot is a ghost with a padlock that chains a building, and a locked building slowly drains coins (one coin every 2.6 seconds). If the building was backed up, pressing E restores it at once with scroll magic. If there was no backup, Dodo must stand near it for a long 8-second unlock bar. A building that is already locked cannot be backed up, because its files are already locked; this is exactly how real ransomware works. The AI chooses buildings without a backup first. The lesson: make the backup BEFORE the attack.`,
  },
  {
    id: 'level2-why',
    title: 'Why Level 2 exists and what it teaches',
    text: `Level 1 teaches how to look at people and files you should not trust. Level 2 teaches what to do to be strong BEFORE an attack, because that is the other half of cyber safety. A strong password stops brute force guessing, and a backup stops ransomware from hurting you. That is why Level 2 has a Tayyari phase where you prepare, and why preparation really changes the result: strong walls make Hathoda give up, and backed-up buildings are restored in a second. The two ideas also use two different skills, building and planning, so the game is not the same lantern again and again. Amri Gate is also the second gate in the real Ranikot story, so the game moves through the fort. Finishing Level 2 with at least 1 star unlocks Miri Fort and the boss fight.`,
  },
  {
    id: 'boss-overview',
    title: 'Boss level: Miri Fort and the Nakal Jadugar',
    text: `The boss level is Miri Fort, the smaller fort inside Ranikot. It is a fighting-game style battle in a top-down arena, like a Tekken match with cyber moves. Two big health bars are at the top: Dodo on the left and the Jadugar on the right, each with a portrait, and a round counter. Before Round 1 Mithu whispers "Let's choose a secret code word only we know", and the player picks one of four picture cards: Mango, Matka, Ajrak or Camel. A lock animation closes. There are three rounds, but it is not best-of-3: the Jadugar has one health bar (360 points) split into three rounds of 120, and Dodo wins by emptying it. Dodo has 100 health and gets 30 back between rounds. When the Jadugar is empty the game shows K.O. in slow motion, the crystal ball cracks, he shrinks into a tiny puff, the fort lights up with confetti and Ajrak banners, and the Cyber Rakshak certificate appears.`,
  },
  {
    id: 'boss-moves',
    title: 'Boss fight: Dodo\'s moves',
    text: `Dodo has three moves. Lantern beam: hold Q and aim with the arrow keys or WASD as in Level 1. While the beam is on the Jadugar it deals steady damage (about 20 points per second) and it also breaks his purple shield and burns fake letters and FREE gifts. Firewall Shield: press E to raise a short glowing Ajrak-patterned wall in front of Dodo for 1.5 seconds; it blocks letters and gifts. After use it has a 4-second cooldown shown as a ring icon. Jump: press Space to jump over ground shockwaves. A combo counter counts consecutive beam hits. The health bars drain with a delayed ghost bar, hits give sparks and a small screen shake, and a strong hit gives a short hit-stop (a tiny freeze). The Jadugar is bigger, floats, holds a crystal ball and teleports with a purple swirl between attacks.`,
  },
  {
    id: 'boss-attacks',
    title: 'Boss fight: the Jadugar\'s attacks',
    text: `Every attack is a cyber trick from the earlier levels, and every attack shows a red warning marker for about 0.6 seconds first, so it is always fair. At most two attacks run at the same time. Phishing Barish: fake letters rain down on marked spots on the floor; burn them with the lantern or step away; a hit does small damage (6). Hathoda Lehar: he slams the ground (the brute hammer from Level 2) and a shockwave ring expands; jump over it with Space (14 damage if it hits). Trojan Tohfa: he throws three FREE gifts that slide towards Dodo; touching one releases bugs that hurt over time (about 16 in total); burn them with the lantern or block them with the shield. Deepfake Chaal appears only in Round 3: he vanishes and three identical Mithus say "Dodo, quick! Give me the gate key!". Dodo walks to one and presses E to ask the code word.`,
  },
  {
    id: 'boss-deepfake',
    title: 'Boss fight: the Deepfake Chaal and the code word',
    text: `The Deepfake Chaal teaches lesson 5: verify a voice with a secret code word. At the start Mithu and the player secretly choose a picture card (Mango, Matka, Ajrak or Camel). In Round 3 the Jadugar disappears and three Mithus appear that look and sound exactly the same. The player walks next to one and presses E to ask the code word. That Mithu answers with a picture bubble. Only the REAL Mithu shows the picture the player chose; the fakes show a different picture. Pressing E again gives the gate key. If the player gave it to the real Mithu, the fakes melt, the Jadugar is stunned and takes big damage (60 points). If the key goes to a fake, Dodo takes big damage (30). This trick can come again in Round 3, chosen by the boss AI. In real life: if someone calls with the voice of your uncle and asks for money or a password, ask the family code word first. AI can clone a voice, but it cannot know a secret you never said online.`,
  },
  {
    id: 'boss-ai',
    title: 'The boss AI: how the Jadugar learns in the fight',
    text: `The boss uses the same formula as the AI Hacker, in a small file called BossBrain. For each attack it counts how many times it used it and how many times it actually hit Dodo. The weakness score is (hits+1)/(used+2). Then it chooses the next attack with 85% exploit (the attack with the best score is most likely) and 15% explore (a random attack, to keep testing). At the start of Round 1 the boss does NOT start empty: it reads what HackerBrain learned in Levels 1 and 2 from the run memory kept in the browser (localStorage). For example if you opened many FREE gifts in Level 1, Trojan Tohfa starts with a high score and is used more (from Round 2, because Round 1 has only Phishing Barish and Hathoda Lehar). When the boss's favourite changes, the Jadugar portrait taunts and Mithu says something like "He noticed you keep getting hit by the Hathoda Lehar!". Round 1: Phishing and Hathoda. Round 2: all three normal attacks, learning on. Round 3: adds the Deepfake Chaal, fully adaptive.`,
  },
  {
    id: 'boss-end',
    title: 'Winning, losing and the Cyber Rakshak certificate',
    text: `If Dodo's health reaches zero, a retry screen gives one tip based on the attack that hit him most, for example "The Hathoda Lehar hit you most. Jump when the ring reaches you." and the Humans vs AI score gives a point to the AI. If the Jadugar's health reaches zero, the player wins: K.O., slow motion, the crystal ball cracks, the Jadugar shrinks into a tiny harmless puff, the fort lights up, confetti and Ajrak banners appear. Stars for the boss depend on how much health Dodo has left. Then the "Cyber Rakshak" certificate screen opens. The player types their name, and the certificate shows the total stars (out of 9), the five lessons learned, the final AI report including what the boss learned in the fight, and the Humans vs AI tally. Buttons: Play again (starts a new run from the World Map) and Menu.`,
  },
  {
    id: 'worldmap',
    title: 'The World Map',
    text: `The World Map is a parchment map of Ranikot with the long wall, the gates and Miri Fort. Pressing Play on the title screen opens it. The nodes are Sann Gate (Level 1), Amri Gate (Level 2), Miri Fort (the boss), and Shah-Pere Gate and Mohan Gate, which are greyed out as "Coming soon" for future levels. Paths join the nodes. A small Dodo stands on the current node; the arrow keys or a click on a node make him walk along the path. Enter or E starts the level. Each node shows the stars earned and a lock if it is not unlocked yet: Amri Gate opens after Sann Gate with 1 star, and Miri Fort opens after Amri Gate with 1 star. When a node is selected a small card shows its name, its monsters and its lesson. If the map cannot load, the game falls back to the simple Levels list.`,
  },
  {
    id: 'ai-report',
    title: 'The AI report and Humans vs AI',
    text: `At the end of every level the results card shows the AI Hacker's report. It names the player's biggest weakness (the item with the highest weakness score that really failed, for example "Left wall" or "Chacha") and gives one tip to fix it. Under it is a running "Humans vs AI Hacker" score. After each level one point goes to the Humans if the player got 2 or 3 stars, or to the AI Hacker if the player got only 1 star (or lost the boss). The idea is that the AI is a sparring partner: the report tells you honestly what it learned about you so you can improve. The boss certificate repeats the final report and adds what the boss learned during the fight. Stars: Level 1 gives 3 stars if nothing bad happened, 2 if at least 65% of the checks were good, otherwise 1. Level 2 is similar but counts walls broken and buildings locked without a backup.`,
  },
];
