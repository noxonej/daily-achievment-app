import { describe, expect, it } from 'vitest';
import { Animator, CLIPS, FRAMES, LOOPS } from './anim';

describe('character animator', () => {
  it('loops idle with breathing', () => {
    const a = new Animator(0);
    expect(a.sample(100).frame).toBe('stand');
    expect(a.sample(1400).frame).toBe('inhale');
  });

  it('settles for a moment after walking, then stands', () => {
    const a = new Animator(0);
    a.setBase('walk', 0);
    expect(a.sample(10).frame).toBe('walk1');
    a.setBase('idle', 500);
    expect(a.sample(520).frame).toBe('settle');
    expect(a.sample(700).frame).toBe('stand');
  });

  it('keeps the stride phase between walk and run', () => {
    const a = new Animator(0);
    a.setBase('walk', 0);
    a.setBase('run', 260); // halfway through the walk cycle
    expect(a.sample(261).frame).toBe('run3');
  });

  it('never stacks clips: a weaker clip cannot cut into a stronger one', () => {
    const a = new Animator(0);
    expect(a.play('celebrate', 0)).toBe(true);
    expect(a.play('wave', 100)).toBe(false);
    expect(a.playing).toBe('celebrate');
  });

  it('moving cancels gestures but jumps are allowed while walking', () => {
    const a = new Animator(0);
    a.play('wave', 0);
    a.setBase('walk', 50);
    expect(a.playing).toBe(null);
    expect(a.play('wave', 60)).toBe(false);
    expect(a.play('jump', 60)).toBe(true);
    // The legs keep walking during the jump.
    expect(a.sample(70).frame.startsWith('walk')).toBe(true);
  });

  it('a jump lifts the sprite in an arc and lands back on the floor', () => {
    const a = new Animator(0);
    a.play('jump', 0);
    const lifts = Array.from({ length: 80 }, (_, i) => a.sample(i * 10).lift);
    expect(Math.max(...lifts)).toBe(8);
    expect(lifts[0]).toBe(0);
    expect(a.sample(2000).lift).toBe(0);
    expect(a.playing).toBe(null);
  });

  it('clips finish once and report it', () => {
    const a = new Animator(0);
    const ended: string[] = [];
    a.onEnd = (n) => ended.push(n);
    a.play('nod', 0);
    a.sample(5000);
    a.sample(6000);
    expect(ended).toEqual(['nod']);
  });

  it('sitting only allows seated gestures; sleeping allows none', () => {
    const a = new Animator(0);
    a.setBase('sit', 0);
    expect(a.play('jump', 10)).toBe(false);
    expect(a.play('wave', 10)).toBe(true);
    a.setBase('sleep', 20);
    expect(a.playing).toBe(null);
    expect(a.play('wave', 30)).toBe(false);
  });

  it('reduced motion: no arcs or bobbing', () => {
    const a = new Animator(0, true);
    a.play('celebrate', 0);
    for (let t = 0; t < 3000; t += 20) expect(a.sample(t).lift).toBe(0);
    expect(a.sample(5000).frame).toBe('stand');
  });

  it('every step points at a real frame', () => {
    const steps = [...Object.values(LOOPS).flat(), ...Object.values(CLIPS).flatMap((c) => c.steps)];
    for (const s of steps) expect(FRAMES[s.f]).toBeDefined();
  });
});
