// The level director plays the steps of a level one after another (see src/data/levels.js):
//   intro -> prep -> wave 1 -> replan -> wave 2 -> replan -> wave 3 -> end
// It also asks the AI Hacker (HackerBrain) to make a new plan between the waves.
const REPLAN_THINK = 1.6; // seconds the Jadugar "thinks"
const REPLAN_AFTER = 1.8; // pause after the new plan, before the next wave

const CLEAR_WAIT = 10; // wait this long (at most) for the courtyard to empty

export default class LevelDirector {
  constructor(scene, level, spawner, brain) {
    this.scene = scene;
    this.level = level;
    this.spawner = spawner;
    this.brain = brain;
    this.index = -1;
    this.step = null;
    this.timer = 0;
    this.phase = 'none'; // for 'replan': clear | think | pause
    this.finished = false;

    scene.events.on('wave-done', this.onWaveDone, this);
    scene.events.once('shutdown', () => scene.events.off('wave-done', this.onWaveDone, this));
  }

  start() {
    this.brain.plan(this.level.firstPlan || { allowTrojan: false }); // the first plan: nothing known yet
    this.next();
  }

  next() {
    this.index++;
    this.step = this.level.steps[this.index];
    this.timer = 0;
    if (!this.step) {
      this.finished = true;
      this.scene.events.emit('level-end');
      return;
    }
    switch (this.step.type) {
      case 'intro':
        this.scene.playIntro(this.step.duration);
        break;
      case 'prep':
        this.scene.playPrep(this.step.duration);
        break;
      case 'wave':
        this.spawner.beginWave(this.step);
        this.scene.events.emit('wave-start', this.step);
        break;
      case 'replan':
        this.phase = 'clear';
        break;
      default:
        break;
    }
  }

  onWaveDone() {
    if (this.step && this.step.type === 'wave') this.next();
  }

  update(dt) {
    if (!this.step || this.finished) return;
    const type = this.step.type;
    if (type === 'intro' || type === 'prep') {
      this.timer += dt;
      if (this.timer >= this.step.duration) this.next();
    } else if (type === 'replan') {
      this.updateReplan(dt);
    }
  }

  // Between two waves: wait until the courtyard is empty, the Jadugar thinks,
  // the plan is made, the panel shows it, then the next wave starts.
  updateReplan(dt) {
    this.timer += dt;
    if (this.phase === 'clear') {
      if (this.spawner.activeCount() === 0 || this.timer > CLEAR_WAIT) {
        this.phase = 'think';
        this.timer = 0;
        this.scene.lookAtJadugar(true);
        this.scene.jadugar.think(REPLAN_THINK * 1000);
        this.scene.sayOnce('replan' + this.index, 'mithu.replan');
        this.scene.hud('setJadugarThinking', true);
      }
    } else if (this.phase === 'think') {
      if (this.timer >= REPLAN_THINK) {
        this.brain.plan(this.step.plan || { allowTrojan: this.step.allowTrojan });
        this.scene.hud('setJadugarThinking', false);
        this.phase = 'pause';
        this.timer = 0;
      }
    } else {
      if (this.timer >= 1.0 && !this.cameraBack) {
        this.cameraBack = true;
        this.scene.lookAtJadugar(false);
      }
      if (this.timer >= REPLAN_AFTER + 0.4) {
        this.cameraBack = false;
        this.next();
      }
    }
  }

  // for the HUD timer: { labelKey, vars, elapsed, total }
  progress() {
    const s = this.step;
    if (!s) return { labelKey: 'hud.phase.done', vars: {}, elapsed: 0, total: 1 };
    if (s.type === 'wave') return { labelKey: 'hud.phase.wave', vars: { n: s.n }, elapsed: Math.min(this.spawner.time, s.duration), total: s.duration };
    if (s.type === 'replan') return { labelKey: 'hud.phase.replan', vars: {}, elapsed: 0, total: 1 };
    return { labelKey: `hud.phase.${s.type}`, vars: {}, elapsed: Math.min(this.timer, s.duration), total: s.duration };
  }
}
