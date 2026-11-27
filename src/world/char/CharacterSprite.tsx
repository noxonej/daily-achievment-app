import { useEffect, useRef } from 'react';
import type { Character } from '../../lib/types';
import { canBlink, petPixels, riggedPixels, type Pose } from '../../components/PixelAvatar';
import { useTodayMood } from '../../store/AppContext';
import { Animator, FRAMES, petStepFor, type Base, type ClipName, type FrameId } from './anim';
import { isReduced } from '../room/life';

/**
 * The animated character (2026-11-27). Instead of re-rendering hundreds of SVG squares each
 * step, every pose is drawn once into a tiny 32×32 canvas and kept; the animation loop only
 * copies the right one onto the screen when the frame changes. One loop per character, paused
 * when the app is in the background or the character is scrolled out of view.
 */

/** Sprite pixels of empty space above the head, so jumps and raised arms stay inside the canvas. */
export const HEADROOM = 10;
export const SPRITE_W = 32;
export const SPRITE_H = 32 + HEADROOM;

const cache = new Map<string, HTMLCanvasElement>();

function frameCanvas(key: string, px: (string | null)[][]): HTMLCanvasElement {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = px[0]?.length ?? 32;
  c.height = px.length;
  const ctx = c.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(c.width, c.height);
    px.forEach((row, y) =>
      row.forEach((col, x) => {
        if (!col) return;
        const n = parseInt(col.slice(1, 7), 16);
        const i = (y * c.width + x) * 4;
        img.data[i] = (n >> 16) & 255;
        img.data[i + 1] = (n >> 8) & 255;
        img.data[i + 2] = n & 255;
        img.data[i + 3] = col.length > 7 ? parseInt(col.slice(7, 9), 16) : 255;
      }),
    );
    ctx.putImageData(img, 0, 0);
  }
  // A few characters × ~40 poses each; start over if it ever grows past that.
  if (cache.size > 600) cache.clear();
  cache.set(key, c);
  return c;
}

export interface CharacterSpriteProps {
  look: Partial<Character> | undefined;
  mood?: number;
  base: Base;
  /** A one-off animation; a new `key` plays it again. */
  clip?: { name: ClipName; key: number } | null;
  /** A face shown on top (a reaction from the room's daily life). */
  face?: string;
  /** Duvet colour while asleep. */
  blanket?: string;
  /** Draw the floor shadow and the pet (standing or walking on the floor). */
  ground?: boolean;
  className?: string;
  onClipEnd?: (name: ClipName) => void;
  title?: string;
}

export function CharacterSprite({ look, mood: moodProp, base, clip, face, blanket, ground = true, className = '', onClipEnd, title }: CharacterSpriteProps) {
  const todayMood = useTodayMood();
  const mood = moodProp ?? todayMood;
  const canvas = useRef<HTMLCanvasElement>(null);
  const anim = useRef<Animator | null>(null);
  if (!anim.current) anim.current = new Animator(performance.now(), isReduced());
  // Everything the loop needs, read through a ref so the loop itself never restarts.
  const live = useRef({ look, mood, face, blanket, ground, base, dirty: true });
  live.current = { ...live.current, look, mood, face, blanket, ground, base, dirty: true };
  const endRef = useRef(onClipEnd);
  endRef.current = onClipEnd;

  useEffect(() => {
    anim.current!.setBase(base, performance.now());
  }, [base]);
  const clipKey = clip ? `${clip.name}:${clip.key}` : '';
  useEffect(() => {
    if (clip) anim.current!.play(clip.name, performance.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipKey]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    const a = anim.current!;
    a.onEnd = (n) => endRef.current?.(n);
    let raf = 0;
    let last = '';
    let onScreen = true;
    // Blinks come at random, now and then twice in a row.
    let blinkAt = performance.now() + 1500 + Math.random() * 3000;
    let blinkEnd = 0;
    const tick = (now: number) => {
      raf = 0;
      const L = live.current;
      const s = a.sample(now);
      if (now >= blinkAt) {
        blinkEnd = now + 110;
        blinkAt = now + (Math.random() < 0.2 ? 260 : 2400 + Math.random() * 3600);
      }
      const pose: Pose['pose'] = L.base === 'sit' ? 'sit' : L.base === 'sleep' ? 'sleep' : 'stand';
      const showFace = s.face ?? L.face;
      const frameRig = FRAMES[s.frame as FrameId] as { eyes?: string };
      const blink = now < blinkEnd && pose !== 'sleep' && !frameRig.eyes && canBlink(L.look, L.mood, showFace);
      const key = `${s.frame}|${s.lift}|${s.flip}|${showFace ?? ''}|${blink}|${pose}`;
      if (key !== last || L.dirty) {
        last = key;
        L.dirty = false;
        const lookKey = JSON.stringify(L.look ?? {});
        const fkey = `${lookKey}|${L.mood}|${pose}|${L.blanket ?? ''}|${s.frame}|${showFace ?? ''}|${blink}`;
        const rig = { ...FRAMES[s.frame as FrameId], ...(blink ? { eyes: 'closed' } : {}) };
        const img = frameCanvas(fkey, riggedPixels(L.look, L.mood, { pose, face: showFace, blanket: L.blanket }, rig));
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, SPRITE_W, SPRITE_H);
        const onFloor = L.ground && pose === 'stand';
        if (onFloor) {
          // A pixel shadow that shrinks while the character is in the air.
          const w = Math.max(6, 14 - Math.round(s.lift * 0.9));
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(16 - w / 2, HEADROOM + 30, w, 1);
          ctx.fillRect(16 - w / 2 + 1, HEADROOM + 31, w - 2, 1);
        }
        if (s.flip) ctx.setTransform(-1, 0, 0, 1, SPRITE_W, 0);
        ctx.drawImage(img, 0, HEADROOM - s.lift);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const petId = L.look?.pet;
        if (onFloor && petId && petId !== 'pet-none') {
          const step = petStepFor(s.frame as FrameId);
          const px = petPixels(petId, step);
          if (px) ctx.drawImage(frameCanvas(`pet|${petId}|${step}`, px), 22, HEADROOM + 21);
        }
      }
      if (onScreen && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => ((onScreen = e.isIntersecting), start())) : null;
    io?.observe(el);
    document.addEventListener('visibilitychange', start);
    start();
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      document.removeEventListener('visibilitychange', start);
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      width={SPRITE_W}
      height={SPRITE_H}
      className={`px-art block w-full h-auto ${className}`}
      style={{ aspectRatio: `${SPRITE_W} / ${SPRITE_H}` }}
      role="img"
      aria-label={title ?? 'Your character'}
    />
  );
}
