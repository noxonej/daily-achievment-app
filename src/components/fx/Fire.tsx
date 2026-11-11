import { useEffect, useRef } from 'react';

/**
 * A fire that really burns, drawn as a particle system on a canvas.
 *
 * Hundreds of tiny glowing blobs are born at the base, rise, get pulled to the middle (that gives
 * the teardrop shape), wobble, cool from white-yellow to orange to deep red, and fade. They are
 * blended additively, so where many overlap the fire gets hotter and brighter, like real flames.
 * Bigger streaks (intensity 2 and 3) burn bigger and throw sparks. `lit={false}` draws a cold
 * grey flame for a 0-day streak. Reduce motion shows one still frame.
 */

/** Smooth 1D value noise in [-1, 1]. */
const PERM = Array.from({ length: 256 }, (_, i) => Math.sin(i * 127.1 + 311.7) * 43758.5453 % 1);
function noise(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const a = PERM[i & 255];
  const b = PERM[(i + 1) & 255];
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  r: number;
  spark: boolean;
}

export interface FireOptions {
  /** 1 small, 2 medium, 3 big (also throws sparks). */
  intensity?: number;
  /** Seconds to grow from nothing to full (0 = already burning). */
  ignite?: number;
}

/** The three flame layers, outside to inside: size, tip height, colours (bottom to top) and noise phase. */
const LAYERS = [
  { w: 1, h: 1, c: ['#ef4444', '#f97316', '#fb923c'], ph: 0, a: 0.95 },
  { w: 0.72, h: 0.74, c: ['#f97316', '#fbbf24', '#fcd34d'], ph: 3.3, a: 1 },
  { w: 0.42, h: 0.45, c: ['#fff7ed', '#fef08a', '#fde68a'], ph: 7.1, a: 1 },
];

/**
 * Runs the fire on a canvas. The canvas is 1.6x as wide and 2x as tall as `size`; the fire's base
 * sits near its bottom middle. The flame is three layered shapes whose edges ripple with noise
 * that travels upward (so it licks and splits at the top), plus little flame bits that break off
 * the tip and rise, and sparks for big streaks.
 */
function runFire(canvas: HTMLCanvasElement, size: number, opts: FireOptions, still: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const W = size * 1.6;
  const H = size * 2.2;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.scale(dpr, dpr);
  const intensity = opts.intensity ?? 1;
  const cx = W / 2;
  const R = size * (0.34 + intensity * 0.02);
  const baseY = H - R - size * 0.2;
  const FH = size * (1.05 + intensity * 0.1);
  const bits: Bit[] = [];
  let t = Math.random() * 10;
  let born = 0;
  let last = performance.now();
  let raf = 0;
  let visible = true;
  const grads = LAYERS.map((L) => {
    const g = ctx.createLinearGradient(0, baseY + R, 0, baseY - FH * L.h);
    g.addColorStop(0, L.c[0]);
    g.addColorStop(0.45, L.c[1]);
    g.addColorStop(1, L.c[2]);
    return g;
  });

  /** One flame layer as a closed path: a round bottom that tapers into a rippling tip. */
  const flamePath = (L: (typeof LAYERS)[number], grow: number, tipFlick: number, ox = 0, sc = 1, ph = 0) => {
    const cx0 = cx + ox;
    const r = R * L.w * (0.5 + grow * 0.5) * sc;
    const fh = FH * L.h * grow * (1 + tipFlick * 0.18) * sc;
    const N = 18;
    const left: Array<[number, number]> = [];
    const right: Array<[number, number]> = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N; // 0 at the widest point, 1 at the tip
      const y = baseY - u * fh;
      // Teardrop width, a bit fuller low down.
      const width = r * Math.pow(1 - u, 1.25) * (1 + 0.15 * Math.sin(u * Math.PI));
      // The whole flame sways more toward the top; waves travel upward.
      const sway = Math.sin(t * 3.1 - u * 2.5 + (L.ph + ph) * 0.2) * size * 0.06 * u * u + (noise(t * 1.3 + (L.ph + ph)) - 0.5) * size * 0.08 * u;
      // Edge ripples: strongest in the middle, fading at the base and tip so the sides never cross.
      const amp = size * 0.2 * u * Math.pow(1 - u, 0.6);
      const nl = (noise(u * 4 - t * 6 + (L.ph + ph)) - 0.5) * amp;
      const nr = (noise(u * 4 - t * 6 + (L.ph + ph) + 40) - 0.5) * amp;
      const xl = cx0 + sway - width + nl;
      const xr = Math.max(xl + width * 0.4, cx0 + sway + width + nr);
      left.push([xl, y]);
      right.push([xr, y]);
    }
    ctx.beginPath();
    ctx.moveTo(cx0 + r, baseY);
    // Bottom half circle.
    ctx.arc(cx0, baseY, r, 0, Math.PI, false);
    const pts = [...left, ...right.reverse()];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    ctx.closePath();
  };

  const step = (dt: number) => {
    t += dt;
    born += dt;
    const grow = opts.ignite ? Math.min(1, born / opts.ignite) : 1;
    // Flame bits break off the tip; sparks fly from big fires.
    if (Math.random() < dt * (5 + intensity * 2) * grow) {
      const tipX = cx + Math.sin(t * 3.1 - 2.5) * size * 0.06;
      bits.push({
        x: tipX + (Math.random() - 0.5) * size * 0.2,
        y: baseY - FH * (0.45 + Math.random() * 0.2),
        vx: (Math.random() - 0.5) * size * 0.2,
        vy: -size * (0.9 + Math.random() * 0.6),
        age: 0,
        life: 0.35 + Math.random() * 0.3,
        r: size * (0.07 + Math.random() * 0.06),
        spark: false,
      });
    }
    if (intensity >= 2 && Math.random() < dt * (intensity === 3 ? 6 : 3) * grow) {
      bits.push({
        x: cx + (Math.random() - 0.5) * R,
        y: baseY - FH * 0.4,
        vx: (Math.random() - 0.5) * size * 0.6,
        vy: -size * (1.4 + Math.random() * 1.2),
        age: 0,
        life: 0.8 + Math.random() * 0.7,
        r: size * 0.025,
        spark: true,
      });
    }
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      b.age += dt;
      if (b.age >= b.life) {
        bits.splice(i, 1);
        continue;
      }
      b.vx += Math.sin(t * 12 + i) * size * dt * (b.spark ? 3 : 1);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    return grow;
  };

  const draw = (grow: number) => {
    ctx.clearRect(0, 0, W, H);
    // Warm light around the fire.
    const glow = ctx.createRadialGradient(cx, baseY - FH * 0.3, 0, cx, baseY - FH * 0.3, size * 0.7);
    glow.addColorStop(0, `rgba(251,146,60,${(0.28 + intensity * 0.05) * grow * (0.9 + 0.1 * Math.sin(t * 13))})`);
    glow.addColorStop(1, 'rgba(249,115,22,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    // Flame bits behind the main flame, shaped like little teardrops that shrink as they rise.
    for (const b of bits) {
      const k = b.age / b.life;
      if (b.spark) {
        ctx.globalAlpha = Math.max(0, (1 - k) * (0.75 + 0.25 * Math.sin(b.age * 45)));
        ctx.fillStyle = k < 0.4 ? '#ffd27a' : '#ff8a3c';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * (1 - k * 0.5), 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      const r = b.r * (1 - k);
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.fillStyle = k < 0.3 ? '#fb923c' : k < 0.65 ? '#f97316' : '#ef4444';
      ctx.beginPath();
      ctx.moveTo(b.x, b.y - r * 2.4);
      ctx.quadraticCurveTo(b.x + r * 1.1, b.y - r * 0.6, b.x + r, b.y);
      ctx.arc(b.x, b.y, r, 0, Math.PI, false);
      ctx.quadraticCurveTo(b.x - r * 1.1, b.y - r * 0.6, b.x, b.y - r * 2.4);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const flick = noise(t * 9) - 0.5;
    // Bigger streaks: smaller side flames lean out from the main one, like a campfire.
    if (intensity >= 2) {
      const sides = intensity === 3 ? [-1, 1] : [1];
      for (const d of sides) {
        LAYERS.slice(0, 2).forEach((L, i) => {
          flamePath(L, grow, (noise(t * 8 + d * 5) - 0.5) * 1.4, d * R * 0.55, 0.6, 20 + d * 9);
          ctx.fillStyle = grads[i];
          ctx.globalAlpha = 0.95;
          ctx.fill();
        });
      }
    }
    LAYERS.forEach((L, i) => {
      flamePath(L, grow, flick * (1 - i * 0.3));
      ctx.fillStyle = grads[i];
      ctx.globalAlpha = L.a;
      if (i === 0) {
        ctx.shadowColor = 'rgba(249,115,22,0.8)';
        ctx.shadowBlur = size * 0.18;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
  };

  if (still) {
    draw(step(0));
    return () => {};
  }

  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (visible) draw(step(dt));
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  // Stop working when it's scrolled out of sight.
  const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => (visible = e.isIntersecting)) : null;
  io?.observe(canvas);
  return () => {
    cancelAnimationFrame(raf);
    io?.disconnect();
  };
}

function prefersStill() {
  return (
    typeof window !== 'undefined' &&
    (document.documentElement.dataset.motion === 'reduce' || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  );
}

/**
 * A burning fire that takes up a `size` x `size` box in the layout (flames rise above it).
 * Used for the streak icon and the big streak screen.
 */
export function Fire({
  size = 20,
  lit = true,
  intensity = 1,
  ignite = 0,
  className = '',
}: {
  size?: number;
  lit?: boolean;
  intensity?: 1 | 2 | 3;
  ignite?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!lit || !ref.current) return;
    return runFire(ref.current, size, { intensity, ignite }, prefersStill());
  }, [lit, size, intensity, ignite]);

  if (!lit) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
        <path
          d="M12 1.6c1.1 3.4 6.6 6.3 6.6 12.4a6.6 6.6 0 0 1-13.2 0c0-3 1.4-4.9 2.7-6.5.3 1.8 1.1 3 2.4 3.4-.7-3.3-.1-6.4 1.5-9.3Z"
          fill="#64748b"
          opacity=".35"
          stroke="#94a3b8"
          strokeOpacity=".6"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <span className={`relative inline-block shrink-0 align-middle ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <canvas
        ref={ref}
        className="absolute pointer-events-none"
        style={{ width: size * 1.6, height: size * 2.2, left: -size * 0.3, bottom: -size * 0.2 }}
      />
    </span>
  );
}
