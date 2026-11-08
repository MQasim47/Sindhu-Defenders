import { addText } from '../i18n/i18nText.js';
import { CODE_PICTURES } from '../objects/bossTextures.js';
import { CSS, FONT } from '../data/colors.js';
import { playSfx } from '../fx/sound.js';

// Before Round 1: "Let's choose a secret code word only we know."
// The player picks one of four picture cards (Mango, Matka, Ajrak, Camel). Mouse click, or the
// arrow keys + Enter / E. The chosen card turns over and a padlock closes on it.
// onPick(name) is called when the lock animation is finished.
export function openCodeWordPicker(scene, onPick) {
  const depth = 5000; // above everything of the arena
  const objects = [];
  const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x0b0d1a, 0.82).setDepth(depth).setInteractive();
  const title = addText(scene, 640, 150, 'boss.codeTitle', {
    fontFamily: FONT,
    fontSize: '46px',
    fontStyle: '700',
    color: CSS.cream,
    stroke: '#10143a',
    strokeThickness: 8,
  })
    .setOrigin(0.5)
    .setDepth(depth + 1);
  objects.push(blocker, title);

  let chosen = false;
  let focus = 0;
  const cards = CODE_PICTURES.map((name, i) => {
    const x = 640 + (i - 1.5) * 200;
    const face = scene.add.graphics();
    face.fillStyle(0x000000, 0.35);
    face.fillRoundedRect(-75, -90, 150, 190, 18);
    face.fillStyle(0x5a0f1d, 1);
    face.fillRoundedRect(-79, -100, 158, 198, 20);
    face.fillStyle(0xf3e9d2, 1);
    face.fillRoundedRect(-75, -96, 150, 190, 18);
    const pic = scene.add.image(0, -22, `boss-pic-${name}`).setScale(1.0);
    const label = addText(scene, 0, 60, `boss.cards.${name}`, { fontFamily: FONT, fontSize: '28px', fontStyle: '700', color: CSS.indigo }).setOrigin(0.5);
    const card = scene.add.container(x, 400, [face, pic, label]).setDepth(depth + 2).setSize(150, 190);
    card.setScale(0);
    scene.tweens.add({ targets: card, scale: 1, duration: 380, delay: 200 + i * 110, ease: 'Back.Out' });
    card.setInteractive({ useHandCursor: true });
    card.on('pointerover', () => !chosen && setFocus(i));
    card.on('pointerup', () => pick(i));
    card.face = face;
    card.pic = pic;
    card.label = label;
    objects.push(card);
    return { card, name };
  });

  const ring = scene.add.graphics().setDepth(depth + 3);
  objects.push(ring);
  function setFocus(i) {
    focus = i;
    ring.clear();
    ring.lineStyle(6, 0xffd24a, 1);
    const c = cards[i].card;
    ring.strokeRoundedRect(c.x - 84, c.y - 104, 168, 206, 22);
    cards.forEach((entry, k) => scene.tweens.add({ targets: entry.card, scale: k === i ? 1.08 : 1, duration: 120 }));
  }
  scene.time.delayedCall(900, () => !chosen && setFocus(0));

  function pick(i) {
    if (chosen) return;
    chosen = true;
    scene.input.keyboard.off('keydown', onKey);
    ring.clear();
    const { card, name } = cards[i];
    cards.forEach((entry, k) => {
      if (k !== i) scene.tweens.add({ targets: entry.card, alpha: 0, scale: 0.6, duration: 300 });
    });
    scene.tweens.add({ targets: card, x: 640, y: 390, scale: 1.3, duration: 450, ease: 'Back.Out' });
    // the card turns over (the picture is hidden) ...
    scene.tweens.add({
      targets: card,
      scaleX: 0,
      duration: 220,
      delay: 600,
      onComplete: () => {
        card.face.setVisible(false);
        card.pic.setVisible(false);
        card.label.setVisible(false);
        card.add(scene.add.image(0, 0, 'boss-card-back'));
        scene.tweens.add({ targets: card, scaleX: 1.3, duration: 220 });
      },
    });
    // ... and a padlock falls on it and closes
    const lock = scene.add.image(640, 120, 'icon-lock').setScale(3).setDepth(depth + 5).setAlpha(0);
    objects.push(lock);
    scene.tweens.add({ targets: lock, alpha: 1, y: 395, duration: 420, delay: 1000, ease: 'Bounce.Out' });
    scene.time.delayedCall(1500, () => {
      playSfx(scene, 'sfx-codeword-lock');
      scene.cameras.main.shake(100, 0.004);
      scene.say('mithu.boss.locked');
    });
    scene.time.delayedCall(2700, () => {
      scene.tweens.add({
        targets: objects,
        alpha: 0,
        duration: 350,
        onComplete: () => {
          objects.forEach((o) => o.destroy());
          onPick(name);
        },
      });
    });
  }

  function onKey(event) {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') setFocus((focus + 3) % 4);
    else if (event.code === 'ArrowRight' || event.code === 'KeyD') setFocus((focus + 1) % 4);
    else if (event.code === 'Enter' || event.code === 'KeyE' || event.code === 'Space') pick(focus);
  }
  scene.input.keyboard.on('keydown', onKey);
}
