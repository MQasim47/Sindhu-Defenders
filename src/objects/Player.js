import Phaser from 'phaser';
import { settings } from '../data/settings.js';
import { playSfx } from '../fx/sound.js';
import { dodoArtAvailable, artToSprite, ensureLidTexture, DODO_ART } from './dodoSprite.js';
import { CAPE_SEGMENTS, CAPE_SEG_HEIGHT, TOPI_ANCHOR, TOPI_MIRRORS } from './dodoTextures.js';

const MAX_SPEED = 340;
const ACCELERATION = 1800; // pixels/second gained while a key is held
const DECELERATION = 2200; // pixels/second lost after keys are released
const AIR_CONTROL = 0.65; // less control while in the air

const JUMP_SPEED = 640; // upward speed at take-off
const GRAVITY = 1900;
const CROUCH_TIME = 0.09; // squash before take-off
const LAND_TIME = 0.1;
const LOW_OBJECT_HEIGHT = 30; // above this height Dodo flies over low objects

const BODY_SCALE = 1.3;
const STEP_DISTANCE = 52; // pixels between footprints
const SPRITE_HEIGHT = 144; // height of the real Dodo picture (before BODY_SCALE)

// Dodo. If the real picture (dodo-full) exists he is ONE animated sprite;
// if not, he is built from separate drawn parts (the fallback).
// The container sits at Dodo's feet.
// Layers, from outside to inside:
//   root     -> lifted by z while jumping (the shadow stays on the ground)
//   squash   -> squash-and-stretch (crouch, stretch, landing)
//   bobber   -> up/down bob while walking
//   facing   -> flips left/right
//   torso    -> breathing + lean (kurta, arms, shawl, head)
// The cape (4 strips on a chain) and the legs are inside "facing" but outside "torso".
export default class Player extends Phaser.GameObjects.Container {
  // bounds: { minY, maxY, minXAt(y), maxXAt(y) }  limits for the feet
  // world:  { colliders: [{ x, y, rx, ry, low }] }  things Dodo cannot walk through
  constructor(scene, x, y, bounds, world = {}, fx = null) {
    super(scene, x, y);

    this.bounds = bounds;
    this.colliders = world.colliders || [];
    this.fx = fx;

    this.vx = 0;
    this.vy = 0;
    this.z = 0; // fake height above the ground
    this.vz = 0;
    this.state = 'ground'; // ground | crouch | air | land
    this.stateTime = 0;
    this.facingDir = 1;
    this.wasPressing = false;
    this.phase = 0; // walk cycle
    this.walkAmt = 0; // 0 = standing, 1 = running
    this.stepDistance = 0;
    this.stepSide = 1;
    this.mouthWide = false;
    this.time = 0;
    this.inputLocked = false; // true during the level intro
    this.lanternUp = false; // set by Lantern.js while Q is held
    this.aim = 0; // direction the lantern points (radians)
    this.slowTimer = 0; // seconds left of being slowed by a spam blob

    // squash/stretch is a small spring, so it overshoots like rubber
    this.sq = { x: 1, y: 1, vx: 0, vy: 0, tx: 1, ty: 1 };
    this.capeAngle = new Array(CAPE_SEGMENTS).fill(0.045);
    this.capeSpeed = new Array(CAPE_SEGMENTS).fill(0);

    this.keys = scene.input.keyboard.addKeys({
      left: 'LEFT',
      right: 'RIGHT',
      up: 'UP',
      down: 'DOWN',
      a: 'A',
      d: 'D',
      w: 'W',
      s: 'S',
      jump: 'SPACE',
      lantern: 'Q', // hold: Sach ki Lalten (built in a later step)
      use: 'E', // pick up / place / use (later step)
    });

    this.spriteMode = dodoArtAvailable(scene);
    this.flipSign = this.spriteMode ? -1 : 1; // the real picture has its cape on the right
    this.lanternHand = { x: 60, y: 98 }; // where the lantern light starts (pixels from the feet)
    this.wobble = 0; // shake after a spam hit
    this.buildParts(scene);
    if (this.spriteMode) this.buildSprite(scene);
    this.setScale(BODY_SCALE);
    scene.add.existing(this);

    this.startBreathing();
    this.scheduleBlink();
    this.scheduleGlint();

    this.once('destroy', () => this.stopAllTweens());
  }

  buildParts(scene) {
    const add = scene.add;
    this.shadow = add.image(0, 3, 'shadow').setScale(1.15);
    this.goo = add.image(0, 2, 'fx-goo').setAlpha(0);

    // cape: a chain of 4 strips, each hanging from the end of the one above
    this.capeParts = [];
    let parent = null;
    for (let i = 0; i < CAPE_SEGMENTS; i++) {
      const image = add.image(0, 0, `dodo-cape-${i}`).setOrigin(0.5, 0);
      const holder = add.container(0, i === 0 ? 0 : CAPE_SEG_HEIGHT, [image]);
      if (parent) parent.add(holder);
      this.capeParts.push(holder);
      parent = holder;
    }
    this.capeRoot = this.capeParts[0];
    this.capeRoot.setPosition(-1, -63);

    this.legLeft = add.image(-10, -27, 'dodo-leg').setOrigin(0.5, 0);
    this.legRight = add.image(10, -27, 'dodo-leg').setOrigin(0.5, 0);
    this.footLeft = add.image(-11, 1, 'dodo-foot').setOrigin(0.5, 1);
    this.footRight = add.image(11, 1, 'dodo-foot').setOrigin(0.5, 1);

    this.bodyImage = add.image(0, -36, 'dodo-body').setOrigin(0.5, 0).setScale(1, 0.84);
    this.armLeft = add.image(-24, -33, 'dodo-arm').setOrigin(0.5, 0.08);
    this.armRight = add.image(24, -33, 'dodo-arm').setOrigin(0.5, 0.08);
    this.lanternProp = add.image(46, -49, 'prop-lantern').setOrigin(0.5, 0.15).setVisible(false);
    this.lanternGlow = add.image(46, -40, 'fx-glow').setScale(0.7).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.shawl = add.image(0, -41, 'dodo-shawl').setOrigin(0.5, 0).setScale(1, 0.68);

    // head (all face parts live in one container so they nod together)
    this.earLeft = add.image(-33, 5, 'dodo-ear');
    this.earRight = add.image(33, 5, 'dodo-ear').setFlipX(true);
    this.headImage = add.image(0, 0, 'dodo-head');
    this.hair = add.image(0, -15, 'dodo-hair');
    this.browLeft = add.image(-15, -7, 'dodo-brow').setScale(0.8);
    this.browRight = add.image(15, -7, 'dodo-brow').setScale(0.8).setFlipX(true);
    this.eyeLeft = add.image(-15, 0, 'dodo-eye').setScale(0.82);
    this.eyeRight = add.image(15, 0, 'dodo-eye').setScale(0.82);
    this.eyes = add.container(0, 6, [this.eyeLeft, this.eyeRight]);
    this.blushLeft = add.image(-23, 16, 'dodo-blush');
    this.blushRight = add.image(23, 16, 'dodo-blush');
    this.nose = add.image(0, 13, 'dodo-nose');
    this.mouth = add.image(0, 19, 'dodo-mouth').setOrigin(0.5, 0);

    this.topiImage = add.image(-TOPI_ANCHOR.x, -TOPI_ANCHOR.y, 'dodo-topi').setOrigin(0, 0);
    this.mirrors = TOPI_MIRRORS.map(([mx, my]) =>
      add.image(mx - TOPI_ANCHOR.x, my - TOPI_ANCHOR.y, 'dodo-topi-mirror'),
    );
    this.glint = add.image(0, 0, 'fx-glint').setScale(0).setBlendMode(Phaser.BlendModes.ADD);
    this.topi = add.container(0, -11, [this.topiImage, ...this.mirrors, this.glint]);

    this.head = add.container(0, -59, [
      this.earLeft,
      this.earRight,
      this.headImage,
      this.hair,
      this.eyes,
      this.browLeft,
      this.browRight,
      this.blushLeft,
      this.blushRight,
      this.nose,
      this.mouth,
      this.topi,
    ]);

    this.torso = add.container(0, -26, [this.bodyImage, this.armLeft, this.armRight, this.shawl, this.head, this.lanternProp, this.lanternGlow]);
    this.partsRoot = add.container(0, 0, [
      this.capeRoot,
      this.legLeft,
      this.legRight,
      this.footLeft,
      this.footRight,
      this.torso,
    ]);
    this.facing = add.container(0, 0, [this.partsRoot]);
    this.bobber = add.container(0, 0, [this.facing]);
    this.squash = add.container(0, 0, [this.bobber]);
    this.root = add.container(0, 0, [this.squash]);

    this.add([this.shadow, this.goo, this.root]);
  }

  // The real Dodo picture as one sprite, plus eyelids, a lantern arm and sparkles.
  buildSprite(scene) {
    const add = scene.add;
    const tex = scene.textures.get('dodo-full').getSourceImage();
    const s = SPRITE_HEIGHT / tex.height;
    this.spriteScale = s;
    this.partsRoot.setVisible(false); // the drawn parts stay hidden (they are the fallback)

    this.sprite = add.image(0, 2, 'dodo-full').setOrigin(0.5, 1).setScale(s);

    // eyelids placed on his eyes
    ensureLidTexture(scene);
    this.lids = DODO_ART.eyes.map(([ex, ey]) => {
      const p = artToSprite(scene, ex, ey, s);
      return add.image(p.x, p.y + 2, 'dodo-lid').setScale(s).setVisible(false);
    });

    // sparkles on the topi mirrors
    this.spriteMirrors = DODO_ART.mirrors.map(([mx, my]) => artToSprite(scene, mx, my, s));
    this.spriteGlint = add.image(0, 0, 'fx-glint').setScale(0).setBlendMode(Phaser.BlendModes.ADD);

    // lantern: a round cream sleeve and a small mitten hand holding the lantern ring.
    // The lantern hangs below the hand and swings like a pendulum.
    const shoulder = artToSprite(scene, DODO_ART.shoulder[0], DODO_ART.shoulder[1], s);
    this.armAngle = 2.25;
    const reach = 60 * 0.8 * 0.86; // length of the sleeve up to the wrist
    const wrist = { x: shoulder.x - Math.sin(this.armAngle) * reach, y: shoulder.y + Math.cos(this.armAngle) * reach };
    this.spriteSleeve = add.image(shoulder.x, shoulder.y, 'dodo-sleeve').setOrigin(0.5, 0.1).setScale(0.8).setRotation(this.armAngle).setVisible(false);
    this.spriteSwing = add.container(wrist.x, wrist.y + 4).setVisible(false);
    this.spriteLantern = add.image(0, 0, 'prop-lantern').setOrigin(0.5, 0.1).setScale(1.1);
    this.spriteGlow = add.image(0, 20, 'fx-glow').setScale(0.7).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD);
    this.spriteSwing.add([this.spriteLantern, this.spriteGlow]);
    this.spriteMitten = add.image(wrist.x, wrist.y + 1, 'dodo-mitten').setOrigin(0.5, 0.2).setScale(0.95).setRotation(this.armAngle - 3.14).setVisible(false);
    this.swingAngle = 0;
    this.swingSpeed = 0;
    // the lantern light starts at the glass of the lantern (mirrored by facingDir in Lantern.js)
    this.lanternHand = { x: Math.abs(wrist.x) * BODY_SCALE, y: -(wrist.y + 26) * BODY_SCALE };

    this.facing.add([this.sprite, ...this.lids, this.spriteGlint, this.spriteSleeve, this.spriteSwing, this.spriteMitten]);
    this.facing.setScale(this.facingDir * this.flipSign, 1);
  }

  // ---------- Idle animations (tweens) ----------

  startBreathing() {
    // the real picture breathes by a small stretch up from his feet
    const s = this.spriteScale;
    this.breathTween = this.scene.tweens.add({
      targets: this.spriteMode ? this.sprite : this.torso,
      scaleY: this.spriteMode ? s * 1.03 : 1.035,
      scaleX: this.spriteMode ? s * 0.99 : 0.988,
      duration: 1100,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });
  }

  scheduleBlink() {
    const wait = Phaser.Math.Between(2000, 4500);
    this.blinkTimer = this.scene.time.delayedCall(wait, () => {
      if (this.spriteMode) {
        // eyelids on for a moment
        this.lids.forEach((l) => l.setVisible(true));
        this.scene.time.delayedCall(110, () => {
          this.lids.forEach((l) => l.setVisible(false));
          this.scheduleBlink();
        });
        return;
      }
      this.scene.tweens.add({
        targets: this.eyes,
        scaleY: 0.08,
        duration: 80,
        yoyo: true,
        onComplete: () => this.scheduleBlink(),
      });
    });
  }

  // Every few seconds a topi mirror catches the light.
  scheduleGlint() {
    this.glintTimer = this.scene.time.delayedCall(Phaser.Math.Between(2600, 4200), () => {
      const spot = this.spriteMode ? Phaser.Utils.Array.GetRandom(this.spriteMirrors) : Phaser.Utils.Array.GetRandom(this.mirrors);
      const glint = this.spriteMode ? this.spriteGlint : this.glint;
      glint.setPosition(spot.x, spot.y).setAngle(0);
      this.scene.tweens.add({
        targets: glint,
        scale: { from: 0, to: 1.1 },
        angle: 80,
        duration: 260,
        ease: 'Sine.Out',
        yoyo: true,
        onComplete: () => this.scheduleGlint(),
      });
    });
  }

  // ---------- Squash and stretch spring ----------

  // Sets the rubber shape right now; the spring then settles back to its target.
  pulse(x, y) {
    const k = settings.reduced ? 0.5 : 1;
    this.sq.x = 1 + (x - 1) * k;
    this.sq.y = 1 + (y - 1) * k;
  }

  updateSquash(dt) {
    const s = this.sq;
    const K = 330;
    const C = 17;
    s.vx += ((s.tx - s.x) * K - s.vx * C) * dt;
    s.vy += ((s.ty - s.y) * K - s.vy * C) * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    this.squash.setScale(s.x, s.y);
  }

  turn(direction) {
    this.facingDir = direction;
    if (this.spriteMode && this.swingSpeed !== undefined) this.swingSpeed -= 5 * direction * this.flipSign;
    this.scene.tweens.killTweensOf(this.facing);
    this.scene.tweens.add({
      targets: this.facing,
      scaleX: direction * this.flipSign,
      duration: 160,
      ease: 'Back.Out',
    });
  }

  // ---------- Jump ----------

  startJump() {
    this.state = 'crouch';
    this.stateTime = 0;
    this.sq.tx = 1.16;
    this.sq.ty = 0.78;
  }

  takeOff() {
    this.state = 'air';
    this.vz = JUMP_SPEED;
    this.sq.tx = 0.92;
    this.sq.ty = 1.14;
    this.pulse(0.86, 1.2);
    if (this.fx) this.fx.puff(this.x, this.y, this.facingDir);
    playSfx(this.scene, 'sfx-jump');
  }

  land() {
    this.state = 'land';
    this.stateTime = 0;
    this.z = 0;
    this.vz = 0;
    this.sq.tx = 1;
    this.sq.ty = 1;
    this.pulse(1.3, 0.72);
    if (this.fx) this.fx.ring(this.x, this.y);
    // the cape flutters when Dodo lands
    for (let i = 0; i < CAPE_SEGMENTS; i++) this.capeSpeed[i] += (i % 2 ? 1 : -1) * (1.2 + i * 0.6);
    playSfx(this.scene, 'sfx-land');
    this.emit('landed');
  }

  // A spam blob hit Dodo: slower for 2 seconds.
  getSlimed() {
    this.slowTimer = 2;
    this.wobble = 1;
    this.pulse(1.25, 0.78);
    this.scene.tweens.add({ targets: this.goo, alpha: { from: 0.9, to: 0 }, duration: 2000, ease: 'Sine.In' });
  }

  get airborne() {
    return this.state === 'air';
  }

  // ---------- Update ----------

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.time += dt;
    const k = this.keys;

    // while the lantern is up, the arrow keys turn the beam (see Lantern.js), so Dodo stands still
    const free = !this.inputLocked && !this.lanternUp;
    let inputX = free ? (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0) : 0;
    let inputY = free ? (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0) : 0;
    const pressing = inputX !== 0 || inputY !== 0;
    if (inputX !== 0 && inputY !== 0) {
      inputX *= Math.SQRT1_2;
      inputY *= Math.SQRT1_2;
    }

    if (this.slowTimer > 0) this.slowTimer -= dt;
    this.updateJumpState(dt);

    // Move the speed towards the wanted speed (smooth, not instant).
    const grip = this.state === 'air' ? AIR_CONTROL : 1;
    const speedCap = MAX_SPEED * (this.lanternUp ? 0.65 : 1) * (this.slowTimer > 0 ? 0.5 : 1);
    const crouchSlow = this.state === 'crouch' ? 0.4 : 1;
    this.vx = this.approach(this.vx, inputX * speedCap * crouchSlow, (inputX !== 0 ? ACCELERATION : DECELERATION * grip) * grip * dt);
    this.vy = this.approach(this.vy, inputY * speedCap * crouchSlow, (inputY !== 0 ? ACCELERATION : DECELERATION * grip) * grip * dt);

    this.moveAndCollide(dt);

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const speedRatio = Math.min(1, speed / MAX_SPEED);
    const onGround = this.state !== 'air';

    // Start / stop / sharp-turn feelings
    if (onGround) {
      if (pressing && !this.wasPressing) {
        this.pulse(0.9, 1.1);
        if (this.fx) this.fx.puff(this.x, this.y, inputX || this.facingDir);
      }
      if (!pressing && this.wasPressing && speed > 150) this.pulse(1.12, 0.9);
      if (pressing && Math.abs(this.vx) > 140 && Math.sign(inputX) === -Math.sign(this.vx) && this.fx) {
        this.fx.puff(this.x, this.y, Math.sign(this.vx));
      }
    }
    this.wasPressing = pressing;

    if (this.vx > 25 && this.facingDir !== 1) this.turn(1);
    else if (this.vx < -25 && this.facingDir !== -1) this.turn(-1);

    this.animateBody(dt, speed, speedRatio, onGround);
    this.updateCape(dt, speedRatio);
    this.updateFootprints(dt, speed, onGround);
    this.updateSquash(dt);

    // Fake height: the body goes up, the shadow stays on the ground.
    this.root.y = -this.z;
    const lift = Math.min(1, this.z / 110);
    this.shadow.setScale(1.15 * (1 - lift * 0.5)).setAlpha(1 - lift * 0.6);

    // y-sort: characters lower on screen are drawn in front.
    this.setDepth(this.y);
  }

  updateJumpState(dt) {
    this.stateTime += dt;
    const wantsJump = Phaser.Input.Keyboard.JustDown(this.keys.jump) && !this.inputLocked;

    if (this.state === 'ground' || this.state === 'land') {
      if (wantsJump) this.startJump();
      else if (this.state === 'land' && this.stateTime > LAND_TIME) this.state = 'ground';
    } else if (this.state === 'crouch') {
      if (this.stateTime >= CROUCH_TIME) this.takeOff();
    } else if (this.state === 'air') {
      // short "hang" at the top: gravity is weaker when the speed is small
      const hang = Math.abs(this.vz) < 150 ? 0.55 : 1;
      this.vz -= GRAVITY * hang * dt;
      this.z += this.vz * dt;
      if (this.vz > 0) {
        this.sq.tx = 0.92;
        this.sq.ty = 1.12;
      } else {
        this.sq.tx = 0.97;
        this.sq.ty = 1.05;
      }
      if (this.z <= 0) this.land();
    }
    if (this.state === 'ground') {
      this.sq.tx = 1;
      this.sq.ty = 1;
    }
  }

  moveAndCollide(dt) {
    const b = this.bounds;
    this.x += this.vx * dt;
    this.y = Phaser.Math.Clamp(this.y + this.vy * dt, b.minY, b.maxY);
    if (this.y === b.minY || this.y === b.maxY) this.vy = 0;

    const minX = b.minXAt(this.y);
    const maxX = b.maxXAt(this.y);
    if (this.x < minX) {
      this.x = minX;
      this.vx = Math.max(0, this.vx);
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = Math.min(0, this.vx);
    }

    // Solid objects: low ones can be jumped over.
    const flying = this.z > LOW_OBJECT_HEIGHT;
    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      if (c.low && flying) continue;
      const rx = c.rx + 12;
      const ry = c.ry + 7;
      const nx = (this.x - c.x) / rx;
      const ny = (this.y - c.y) / ry;
      const d = Math.sqrt(nx * nx + ny * ny);
      if (d >= 1) continue;
      const ux = d === 0 ? 0 : nx / d;
      const uy = d === 0 ? 1 : ny / d;
      this.x = c.x + ux * rx;
      this.y = c.y + uy * ry;
      // remove the speed that points into the object, so Dodo slides along it
      const into = this.vx * -ux + this.vy * -uy;
      if (into > 0) {
        this.vx += ux * into;
        this.vy += uy * into;
      }
    }
  }

  animateBody(dt, speed, speedRatio, onGround) {
    // walk cycle
    const target = onGround && speed > 40 ? Math.min(1, speed / (MAX_SPEED * 0.6)) : 0;
    this.walkAmt += (target - this.walkAmt) * Math.min(1, dt * 12);
    if (onGround) this.phase += speed * dt * 0.046;
    const s = Math.sin(this.phase);
    const w = this.walkAmt;

    this.bobber.y = -Math.abs(s) * 5.5 * w;
    this.footLeft.y = 1 - Math.max(0, s) * 8 * w;
    this.footRight.y = 1 - Math.max(0, -s) * 8 * w;
    this.footLeft.x = -11 + s * 3 * w;
    this.footRight.x = 11 - s * 3 * w;
    this.legLeft.rotation = s * 0.18 * w;
    this.legRight.rotation = -s * 0.18 * w;

    // arms swing; in the air they go up a little
    const armUp = this.state === 'air' ? (this.vz > 0 ? -0.9 : -0.5) : 0;
    this.armLeft.rotation = s * 0.75 * w + 0.06 + armUp;
    this.armRight.rotation = this.lanternUp ? -2.25 + Math.sin(this.time * 3) * 0.04 : -s * 0.75 * w - 0.06 - armUp;
    this.lanternProp.setVisible(this.lanternUp);
    this.lanternGlow.setVisible(this.lanternUp);

    // lean forward when running, head nods and follows a little late
    this.torso.rotation += (0.07 * speedRatio - this.torso.rotation) * Math.min(1, dt * 10);
    this.head.rotation = Math.sin(this.phase * 0.5) * 0.05 * w - 0.03 * speedRatio;
    this.head.y = -59 - Math.abs(s) * 1.5 * w;

    // face: eyes look where we move, smile widens when running or flying
    const lookX = Phaser.Math.Clamp(this.vx / MAX_SPEED, -1, 1) * this.facingDir * 2;
    const lookY = Math.abs(this.vy) > 40 ? Math.sign(this.vy) * 2 : 0;
    this.eyes.setPosition(lookX, 6 + lookY);
    if (this.spriteMode) this.animateSprite(dt, speedRatio, w);
    const wide = speedRatio > 0.45 || this.state === 'air';
    if (wide !== this.mouthWide) {
      this.mouthWide = wide;
      this.mouth.setTexture(wide ? 'dodo-mouth-wide' : 'dodo-mouth');
      this.mouth.y = wide ? 18 : 19;
    }
  }

  // The real Dodo picture: lean into the movement, a little sway, wobble after a spam hit.
  animateSprite(dt, speedRatio, walk) {
    this.wobble = Math.max(0, this.wobble - dt * 0.55);
    // the picture faces front: "forward" is always towards -x inside the flipped container
    const lean = -(0.09 * speedRatio) * (this.state === 'air' ? 1.3 : 1);
    const sway = Math.sin(this.time * 2.1) * 0.012 + Math.sin(this.phase) * 0.03 * walk;
    const shake = Math.sin(this.time * 32) * 0.16 * this.wobble;
    this.sprite.rotation += (lean + sway + shake - this.sprite.rotation) * Math.min(1, dt * 16);

    const up = this.lanternUp;
    this.spriteSleeve.setVisible(up);
    this.spriteSwing.setVisible(up);
    this.spriteMitten.setVisible(up);
    if (!up) return;

    this.spriteSleeve.rotation = this.armAngle + Math.sin(this.time * 3) * 0.03;
    // pendulum: the lantern lags behind when Dodo moves or turns
    const side = Math.sign(this.facing.scaleX) || 1;
    const target = Phaser.Math.Clamp((this.vx / MAX_SPEED) * 0.6 * side, -0.75, 0.75) + Math.sin(this.time * 2.6) * 0.05;
    this.swingSpeed += ((target - this.swingAngle) * 75 - this.swingSpeed * 4.2) * dt;
    this.swingAngle += this.swingSpeed * dt;
    this.spriteSwing.rotation = this.swingAngle;
  }

  // The cape is 4 strips. Each one is pulled towards its own target angle by a
  // spring, so the tail follows the top with a delay and wobbles.
  updateCape(dt, speedRatio) {
    const side = Math.min(1, Math.abs(this.vx) / MAX_SPEED);
    const flow = Math.min(1, side + Math.abs(this.vy) / MAX_SPEED * 0.45);
    const t = this.time;
    const calm = settings.reduced ? 0.5 : 1;

    for (let i = 0; i < CAPE_SEGMENTS; i++) {
      // every strip leans a little more than the one above, so the cape bends smoothly
      let target = 0.045 + flow * 0.13;
      target += Math.sin(t * (2 + flow * 9) - i * 0.6) * (0.012 + 0.03 * flow) * calm;
      if (this.state === 'air') target += this.vz > 0 ? 0.06 : -0.03;
      const stiffness = 210 - i * 14;
      const damping = 2 * Math.sqrt(stiffness) * 0.4;
      this.capeSpeed[i] += ((target - this.capeAngle[i]) * stiffness - this.capeSpeed[i] * damping) * dt;
      this.capeAngle[i] += this.capeSpeed[i] * dt;
      this.capeParts[i].rotation = this.capeAngle[i];
    }
  }

  updateFootprints(dt, speed, onGround) {
    if (!this.fx || !onGround || speed < 60) return;
    this.stepDistance += speed * dt;
    if (this.stepDistance < STEP_DISTANCE) return;
    this.stepDistance = 0;
    this.stepSide = -this.stepSide;
    const angle = Phaser.Math.RadToDeg(Math.atan2(this.vy, this.vx));
    this.fx.print(this.x, this.y + this.stepSide * 5, angle);
  }

  approach(value, target, step) {
    if (value < target) return Math.min(value + step, target);
    return Math.max(value - step, target);
  }

  stopAllTweens() {
    this.scene.tweens.killTweensOf([this.torso, this.facing, this.eyes, this.glint]);
    if (this.blinkTimer) this.blinkTimer.remove(false);
    if (this.glintTimer) this.glintTimer.remove(false);
  }
}
