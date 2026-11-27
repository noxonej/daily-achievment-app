import type { ArmPose, Rig } from '../../components/PixelAvatar';

/**
 * The character's animation system (2026-11-27 overhaul).
 *
 * One state machine decides what the character is doing. There is always a *base* loop
 * (idle, walk, run, sit, sleep) and at most one *clip* on top of it (a jump, a wave, a
 * celebration...). Clips can't stack, a stronger clip can cut in, and moving cancels a gesture,
 * so two animations never fight over the sprite. Every frame has a fixed length in ms and the
 * time comes from one clock, so the timing is the same on a fast or slow phone.
 *
 * Frames are poses of the pixel rig (see Rig in PixelAvatar.tsx); jumps add an arc that lifts the
 * whole sprite by whole pixels.
 */

export type Base = 'idle' | 'walk' | 'run' | 'sit' | 'sleep';
export type ClipName = 'jump' | 'celebrate' | 'cheer' | 'wave' | 'look' | 'stretch' | 'yawn' | 'nod' | 'hop' | 'reach' | 'none';

const D: [ArmPose, ArmPose] = ['down', 'down'];

/** Every pose the character can hold. */
export const FRAMES = {
  stand: {},
  inhale: { body: -1 },
  settle: { body: 1, arms: ['fwd', 'fwd'] },
  // Walk: contact (front foot down, back heel up), passing (swinging boot lifted, body up).
  walk1: { legs: [{ dx: -1 }, { dx: 1, lift: 1 }], arms: ['fwd', 'back'] },
  walk2: { body: -1, legs: [{}, { lift: 2 }], arms: D },
  walk3: { legs: [{ dx: -1, lift: 1 }, { dx: 1 }], arms: ['back', 'fwd'] },
  walk4: { body: -1, legs: [{ lift: 2 }, {}], arms: D },
  // Run: longer strides, bent arms, the head leans forward, a moment with both feet off the floor.
  run1: { headX: 1, legs: [{ dx: -1 }, { dx: 2, lift: 2 }], arms: ['bentF', 'bentB'] },
  run2: { headX: 1, body: -1, legs: [{ lift: 1 }, { lift: 3 }], arms: ['bentF', 'bentB'] },
  run3: { headX: 1, legs: [{ dx: -2, lift: 2 }, { dx: 1 }], arms: ['bentB', 'bentF'] },
  run4: { headX: 1, body: -1, legs: [{ lift: 3 }, { lift: 1 }], arms: ['bentB', 'bentF'] },
  // Jumps
  crouch: { body: 1, arms: ['back', 'back'] },
  crouch2: { body: 2, arms: ['back', 'back'] },
  launch: { body: -1, legs: [{ lift: 1 }, { lift: 1 }], arms: ['up', 'up'] },
  air: { legs: [{ lift: 2 }, { lift: 1 }], arms: ['up', 'up'] },
  airOut: { legs: [{ lift: 1 }, { lift: 2 }], arms: ['out', 'out'] },
  land: { body: 2, arms: ['out', 'out'] },
  land1: { body: 1, arms: ['fwd', 'fwd'] },
  // Gestures
  armsUp: { body: -1, arms: ['up', 'up'] },
  armsWave: { body: -1, arms: ['wave', 'up'] },
  armsWave2: { body: -1, arms: ['up', 'wave'] },
  pump: { arms: ['down', 'up'] },
  pumpLow: { body: 1, arms: ['down', 'fwd'] },
  wave1: { arms: ['down', 'up'] },
  wave2: { arms: ['down', 'wave'] },
  lookR: { headX: 1, eyes: 'side' },
  lookL: { headX: -1, eyes: 'side' },
  stretch: { body: -1, legs: [{ dx: -1 }, { dx: 1 }], arms: ['up', 'up'] },
  yawn: { body: -1, arms: ['down', 'up'] },
  nod: { head: 1 },
  reach: { headX: 1, arms: ['down', 'out'] },
} satisfies Record<string, Rig>;

export type FrameId = keyof typeof FRAMES;

export interface Step {
  f: FrameId;
  ms: number;
  /** Mirror the sprite for this step (looking the other way). */
  flip?: boolean;
  /** A face for this step only. */
  face?: string;
}

interface Clip {
  steps: Step[];
  /** Arcs that lift the whole sprite: start (ms from clip start), length, height in pixels. */
  air?: Array<[number, number, number]>;
  /** Face for the whole clip (a step's own face wins). */
  face?: string;
  /** Higher can cut into lower. */
  priority: number;
  /** Plays while sitting (arms and head only). */
  seated?: boolean;
}

/** Base loops. Walk/run cadence matches the walking speed in the room (see Room.tsx). */
export const LOOPS: Record<Base, Step[]> = {
  idle: [
    { f: 'stand', ms: 1300 },
    { f: 'inhale', ms: 1100 },
  ],
  walk: [
    { f: 'walk1', ms: 130 },
    { f: 'walk2', ms: 130 },
    { f: 'walk3', ms: 130 },
    { f: 'walk4', ms: 130 },
  ],
  run: [
    { f: 'run1', ms: 90 },
    { f: 'run2', ms: 90 },
    { f: 'run3', ms: 90 },
    { f: 'run4', ms: 90 },
  ],
  sit: [
    { f: 'stand', ms: 1500 },
    { f: 'inhale', ms: 1200 },
  ],
  sleep: [
    { f: 'stand', ms: 1800 },
    { f: 'inhale', ms: 1800 },
  ],
};

const rep = (n: number, steps: Step[]) => Array.from({ length: n }, () => steps).flat();

export const CLIPS: Record<ClipName, Clip> = {
  // Wind up, push off, hang in the air, land with a squash and stand back up.
  jump: {
    priority: 3,
    steps: [
      { f: 'crouch', ms: 70 },
      { f: 'crouch2', ms: 60 },
      { f: 'launch', ms: 90 },
      { f: 'air', ms: 220 },
      { f: 'airOut', ms: 110 },
      { f: 'land', ms: 80 },
      { f: 'land1', ms: 90 },
    ],
    air: [[130, 420, 8]],
  },
  // Finished something big (level up, a reward): a big jump with both arms up, then fist pumps.
  celebrate: {
    priority: 5,
    face: 'starstruck',
    steps: [
      { f: 'crouch', ms: 80 },
      { f: 'crouch2', ms: 70 },
      { f: 'launch', ms: 90 },
      { f: 'armsUp', ms: 200 },
      { f: 'armsWave', ms: 120 },
      { f: 'airOut', ms: 90 },
      { f: 'land', ms: 80 },
      { f: 'land1', ms: 80 },
      ...rep(2, [
        { f: 'pumpLow', ms: 110, face: 'grin' },
        { f: 'pump', ms: 210, face: 'grin' },
      ]),
      { f: 'armsWave', ms: 150, face: 'laugh' },
      { f: 'armsWave2', ms: 150, face: 'laugh' },
      { f: 'armsWave', ms: 150, face: 'laugh' },
      { f: 'settle', ms: 100, face: 'grin' },
    ],
    air: [[150, 500, 9]],
  },
  // A quest done: two happy hops with both arms up.
  cheer: {
    priority: 4,
    face: 'starstruck',
    steps: rep(2, [
      { f: 'crouch', ms: 80 },
      { f: 'armsUp', ms: 300 },
      { f: 'land', ms: 70 },
      { f: 'land1', ms: 70 },
    ]),
    air: [
      [80, 300, 5],
      [600, 300, 5],
    ],
  },
  hop: {
    priority: 2,
    steps: [
      { f: 'crouch', ms: 70 },
      { f: 'airOut', ms: 260 },
      { f: 'land', ms: 70 },
      { f: 'land1', ms: 70 },
    ],
    air: [[70, 260, 4]],
  },
  wave: {
    priority: 1,
    seated: true,
    steps: [{ f: 'wave1', ms: 110 }, ...rep(3, [{ f: 'wave2', ms: 150 }, { f: 'wave1', ms: 150 }]), { f: 'stand', ms: 80 }],
  },
  look: {
    priority: 1,
    seated: true,
    steps: [
      { f: 'lookR', ms: 650 },
      { f: 'stand', ms: 220 },
      { f: 'lookR', ms: 650, flip: true },
      { f: 'stand', ms: 300 },
    ],
  },
  stretch: {
    priority: 1,
    face: 'calm',
    steps: [
      { f: 'inhale', ms: 160 },
      { f: 'stretch', ms: 900 },
      { f: 'settle', ms: 160 },
      { f: 'stand', ms: 200 },
    ],
  },
  yawn: {
    priority: 1,
    seated: true,
    face: 'sleepy',
    steps: [
      { f: 'inhale', ms: 200 },
      { f: 'yawn', ms: 1100 },
      { f: 'settle', ms: 160 },
      { f: 'stand', ms: 200 },
    ],
  },
  nod: {
    priority: 1,
    seated: true,
    steps: rep(3, [
      { f: 'nod', ms: 160 },
      { f: 'stand', ms: 180 },
    ]),
  },
  reach: {
    priority: 2,
    face: 'grin',
    steps: [
      { f: 'settle', ms: 90 },
      { f: 'reach', ms: 700 },
      { f: 'stand', ms: 150 },
    ],
  },
  none: { priority: 0, seated: true, steps: [{ f: 'stand', ms: 1200 }] },
};

export interface Sample {
  frame: FrameId;
  /** Pixels the whole sprite is lifted (jumps). */
  lift: number;
  flip: boolean;
  face?: string;
  /** The clip playing now, if any. */
  clip: ClipName | null;
}

const total = (steps: Step[]) => steps.reduce((n, s) => n + s.ms, 0);

function at(steps: Step[], t: number): Step {
  let acc = 0;
  for (const s of steps) {
    acc += s.ms;
    if (t < acc) return s;
  }
  return steps[steps.length - 1];
}

/** The state machine. Pure (no timers): the caller passes the time, so it is easy to test. */
export class Animator {
  base: Base = 'idle';
  private baseT0 = 0;
  private settleUntil = 0;
  private clip: { name: ClipName; t0: number; length: number } | null = null;
  /** With reduced motion: no bobbing, bouncing or arcs, only faces and arm poses. */
  reduced: boolean;
  /** Called once when a clip finishes on its own (not when it's cut off). */
  onEnd?: (name: ClipName) => void;

  constructor(now = 0, reduced = false) {
    this.baseT0 = now;
    this.reduced = reduced;
  }

  get playing(): ClipName | null {
    return this.clip?.name ?? null;
  }

  get moving(): boolean {
    return this.base === 'walk' || this.base === 'run';
  }

  setBase(next: Base, now: number) {
    if (next === this.base) return;
    const prev = this.base;
    const loops = (b: Base) => b === 'walk' || b === 'run';
    if (loops(prev) && loops(next)) {
      // Walk ↔ run: carry on from the same point of the stride so the feet don't jump.
      const phase = ((now - this.baseT0) % total(LOOPS[prev])) / total(LOOPS[prev]);
      this.baseT0 = now - phase * total(LOOPS[next]);
    } else {
      this.baseT0 = now;
    }
    // Stopping: one frame where the weight settles, instead of snapping to a stand.
    if (loops(prev) && next === 'idle') this.settleUntil = now + (prev === 'run' ? 120 : 80);
    else this.settleUntil = 0;
    // Starting to move (or lying down) cuts off a gesture; a jump can carry on into a walk.
    if (this.clip && (next === 'sleep' || (loops(next) && this.clip.name !== 'jump') || (next === 'sit' && !CLIPS[this.clip.name].seated))) this.clip = null;
    this.base = next;
  }

  /** Starts a clip. Returns false if it can't play now (moving, sitting, or a stronger clip is on). */
  play(name: ClipName, now: number): boolean {
    const c = CLIPS[name];
    if (this.base === 'sleep' && name !== 'none') return false;
    if (this.base === 'sit' && !c.seated) return false;
    if (this.moving && name !== 'jump') return false;
    if (this.clip && now - this.clip.t0 < this.clip.length && CLIPS[this.clip.name].priority > c.priority) return false;
    this.clip = { name, t0: now, length: total(c.steps) };
    this.settleUntil = 0;
    return true;
  }

  stop() {
    this.clip = null;
  }

  sample(now: number): Sample {
    const clip = this.clip;
    if (clip) {
      const t = now - clip.t0;
      if (t >= clip.length) {
        this.clip = null;
        // The base loop picks up from its start so a breath doesn't begin halfway.
        this.baseT0 = now;
        this.onEnd?.(clip.name);
      } else {
        const def = CLIPS[clip.name];
        // While walking a jump keeps the stride; only the arc and arms come from the clip.
        const s = at(def.steps, t);
        let lift = 0;
        if (!this.reduced)
          for (const [start, len, h] of def.air ?? []) {
            const u = (t - start) / len;
            if (u > 0 && u < 1) lift = Math.max(lift, Math.round(4 * h * u * (1 - u)));
          }
        let frame = this.reduced && s.f !== 'lookR' ? ('stand' as FrameId) : s.f;
        if (this.moving) frame = at(LOOPS[this.base], (now - this.baseT0) % total(LOOPS[this.base])).f;
        return { frame, lift, flip: !!s.flip, face: s.face ?? def.face, clip: clip.name };
      }
    }
    if (now < this.settleUntil && !this.reduced) return { frame: 'settle', lift: 0, flip: false, clip: null };
    if (this.reduced && !this.moving) return { frame: 'stand', lift: 0, flip: false, clip: null };
    const loop = LOOPS[this.base];
    const t = (now - this.baseT0) % total(loop);
    return { frame: at(loop, t < 0 ? 0 : t).f, lift: 0, flip: false, clip: null };
  }
}

/** Which way the pet's feet are while it trots along (0 still, 1 / 2 the two steps). */
export function petStepFor(frame: FrameId): 0 | 1 | 2 {
  if (frame === 'walk1' || frame === 'run1' || frame === 'walk2' || frame === 'run2') return 1;
  if (frame === 'walk3' || frame === 'run3' || frame === 'walk4' || frame === 'run4') return 2;
  return 0;
}
