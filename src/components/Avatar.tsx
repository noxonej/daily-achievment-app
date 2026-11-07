import { useId, type ReactNode } from 'react';
import type { Character } from '../lib/types';
import { findItem, normalizeLook, type AvatarItem } from '../data/avatar';
import { useTodayMood } from '../store/AppContext';

/* ---------- colour helpers ---------- */
function shade(hex: string, amount: number): string {
  // amount < 0 darkens, > 0 lightens (-1..1)
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const f = (c: number) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  return `#${[f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Blend two hex colours (t = 0 → a, 1 → b). */
function mix(a: string, b: string, t: number): string {
  const p = (h: string) => parseInt(h.replace('#', ''), 16);
  const [x, y] = [p(a), p(b)];
  const c = (sh: number) => Math.round(((x >> sh) & 255) * (1 - t) + ((y >> sh) & 255) * t);
  return `#${[c(16), c(8), c(0)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function star(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  }
  return d + 'Z';
}

type Ctx = {
  id: string;
  skin: string;
  skinDark: string;
  hair: string;
  hairDark: string;
  /** Iris colours: centre, mid, rim. */
  eye: [string, string, string];
  brow: string;
  lip: string;
  lipDark: string;
};

/* ---------- backdrop ---------- */
function Backdrop({ item, x }: { item: AvatarItem; x: Ctx }) {
  const g = `${x.id}bg`;
  const grad = (a: string, b: string, angle: 'v' | 'd' = 'd') => (
    <linearGradient id={g} x1="0" y1="0" x2={angle === 'd' ? 1 : 0} y2="1">
      <stop offset="0" stopColor={a} />
      <stop offset="1" stopColor={b} />
    </linearGradient>
  );
  let defs: ReactNode;
  let extra: ReactNode = null;
  switch (item.style) {
    case 'y2k':
      defs = grad('#f9a8d4', '#7dd3fc', 'v');
      extra = (
        <>
          <circle cx="80" cy="22" r="16" fill="#fff" opacity=".18" />
          {([[16, 18, 6], [84, 70, 5], [12, 74, 3.4], [70, 10, 2.6], [30, 8, 2.2]] as const).map(([cx, cy, r]) => (
            <path key={cx} d={star(cx, cy, r, r * 0.28, 4)} fill="#fff" stroke="#c4b5fd" strokeWidth=".5" />
          ))}
          <path d="M0 90 Q25 84 50 90 T100 90 V100 H0Z" fill="#c4b5fd" opacity=".55" />
        </>
      );
      break;
    case 'comic':
      // pop-art halftone with a burst behind the head
      defs = (
        <>
          <radialGradient id={g} cx=".5" cy=".42" r=".75">
            <stop offset="0" stopColor="#fde047" />
            <stop offset="1" stopColor="#f97316" />
          </radialGradient>
          <pattern id={`${g}d`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <circle cx="2" cy="2" r="1" fill="#dc2626" opacity=".55" />
          </pattern>
        </>
      );
      extra = (
        <>
          <rect width="100" height="100" fill={`url(#${g}d)`} />
          <path d={star(50, 44, 52, 30, 14)} fill="#fef08a" opacity=".85" />
          <path d={star(50, 44, 52, 30, 14)} fill="none" stroke="#1b1512" strokeWidth=".8" opacity=".5" />
        </>
      );
      break;
    case 'bubbles':
      defs = grad('#c4b5fd', '#f0abfc', 'v');
      extra = (
        <g>
          {([[16, 24, 9], [84, 30, 7], [78, 76, 10], [14, 72, 6], [40, 10, 4], [62, 12, 3]] as const).map(([cx, cy, r]) => (
            <g key={cx}>
              <circle cx={cx} cy={cy} r={r} fill="#fff" fillOpacity=".18" stroke="#fff" strokeOpacity=".8" strokeWidth=".7" />
              <path d={`M${cx - r * 0.55} ${cy - r * 0.2} Q${cx - r * 0.45} ${cy - r * 0.6} ${cx - r * 0.1} ${cy - r * 0.62}`} stroke="#fff" strokeWidth=".9" fill="none" strokeLinecap="round" />
            </g>
          ))}
        </g>
      );
      break;
    case 'desktop':
      // a retro computer screen with a window and a cursor
      defs = grad('#38bdf8', '#1d4ed8', 'v');
      extra = (
        <g>
          <rect x="6" y="8" width="34" height="24" rx="1.5" fill="#e2e8f0" stroke="#1b1512" strokeWidth=".8" />
          <rect x="6" y="8" width="34" height="5" rx="1.5" fill="#4f46e5" />
          <rect x="34" y="9.2" width="2.6" height="2.6" fill="#f87171" />
          <path d="M10 18 H34 M10 22 H28 M10 26 H31" stroke="#94a3b8" strokeWidth="1.2" />
          <path d="M80 12 l0 9 l2.4 -2.2 l1.6 3.4 l1.4 -.7 l-1.6 -3.3 l3.2 -.1Z" fill="#fff" stroke="#1b1512" strokeWidth=".6" strokeLinejoin="round" />
          <rect x="0" y="92" width="100" height="8" fill="#cbd5e1" />
          <rect x="2" y="93.5" width="12" height="5" rx="1" fill="#4ade80" stroke="#1b1512" strokeWidth=".5" />
        </g>
      );
      break;
    case 'sunset':
      defs = grad('#fb923c', '#db2777', 'v');
      extra = (
        <>
          <circle cx="50" cy="78" r="26" fill="#fde68a" opacity=".85" />
          {[70, 76, 82].map((y) => (
            <rect key={y} x="20" y={y} width="60" height="2.2" fill="#f97316" opacity=".55" />
          ))}
        </>
      );
      break;
    case 'ocean':
      defs = grad('#38bdf8', '#1e3a8a', 'v');
      extra = (
        <>
          {[
            [16, 70, 3],
            [24, 50, 2],
            [82, 40, 2.6],
            [88, 66, 1.8],
            [12, 30, 1.6],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={r} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth=".8" />
          ))}
          <path d="M0 86 Q12 82 25 86 T50 86 T75 86 T100 86 V100 H0Z" fill="#1e40af" opacity=".55" />
        </>
      );
      break;
    case 'forest':
      defs = grad('#86efac', '#166534', 'v');
      extra = (
        <g fill="#14532d" opacity=".55">
          <path d="M0 100 L10 62 L20 100Z M12 100 L24 54 L36 100Z M66 100 L78 56 L90 100Z M82 100 L92 64 L102 100Z" />
        </g>
      );
      break;
    case 'sakura':
      defs = grad('#fbcfe8', '#be185d', 'v');
      extra = (
        <g fill="#fff" opacity=".75">
          {[
            [14, 20, 20],
            [84, 28, -30],
            [20, 62, 50],
            [88, 70, 10],
            [72, 12, 70],
            [8, 44, -10],
          ].map(([cx, cy, rot]) => (
            <ellipse key={`${cx}${cy}`} cx={cx} cy={cy} rx="2.6" ry="1.4" transform={`rotate(${rot} ${cx} ${cy})`} />
          ))}
        </g>
      );
      break;
    case 'galaxy':
      defs = (
        <radialGradient id={g} cx=".3" cy=".25" r="1">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset=".55" stopColor="#1e1b4b" />
          <stop offset="1" stopColor="#020617" />
        </radialGradient>
      );
      extra = (
        <>
          {[
            [12, 14, 0.9],
            [86, 18, 1.2],
            [22, 40, 0.6],
            [80, 46, 0.7],
            [92, 76, 0.9],
            [8, 72, 1.1],
            [64, 8, 0.6],
            [36, 10, 0.8],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={r} fill="#fff" opacity=".9" />
          ))}
          <path d={star(84, 34, 2.4, 0.8, 4)} fill="#fde68a" />
          <circle cx="14" cy="88" r="7" fill="#f472b6" opacity=".8" />
          <ellipse cx="14" cy="88" rx="12" ry="2.6" fill="none" stroke="#fbcfe8" strokeWidth="1" opacity=".8" />
        </>
      );
      break;
    case 'neon':
      defs = grad('#2e1065', '#020617', 'v');
      extra = (
        <g stroke="#e879f9" strokeWidth=".6" opacity=".7">
          {[60, 68, 77, 88].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} />
          ))}
          {[-40, -15, 10, 35, 60, 85, 110, 135].map((x2) => (
            <line key={x2} x1="50" y1="52" x2={x2} y2="100" stroke="#22d3ee" />
          ))}
          <line x1="0" y1="52" x2="100" y2="52" stroke="#f0abfc" strokeWidth="1" />
        </g>
      );
      break;
    case 'gold':
      defs = (
        <radialGradient id={g} cx=".5" cy=".35" r=".8">
          <stop offset="0" stopColor="#fef3c7" />
          <stop offset=".5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#78350f" />
        </radialGradient>
      );
      extra = (
        <g fill="#fff" opacity=".18">
          {[0, 30, 60, 90, 120, 150].map((a) => (
            <rect key={a} x="48" y="-30" width="4" height="160" transform={`rotate(${a} 50 50)`} />
          ))}
        </g>
      );
      break;
    case 'sky':
      defs = grad('#7dd3fc', '#2563eb', 'v');
      extra = (
        <g fill="#fff" opacity=".85">
          <ellipse cx="18" cy="20" rx="10" ry="4.5" />
          <ellipse cx="24" cy="17" rx="6" ry="4.5" />
          <ellipse cx="80" cy="34" rx="11" ry="4.5" />
          <ellipse cx="86" cy="31" rx="6" ry="4" />
        </g>
      );
      break;
    case 'beach':
      defs = grad('#7dd3fc', '#e0f2fe', 'v');
      extra = (
        <>
          <circle cx="82" cy="18" r="8" fill="#fde047" />
          <rect x="0" y="62" width="100" height="16" fill="#0ea5e9" />
          <path d="M0 64 Q12 61 25 64 T50 64 T75 64 T100 64" stroke="#fff" strokeOpacity=".7" strokeWidth="1" fill="none" />
          <path d="M0 76 Q30 70 60 76 T100 74 V100 H0Z" fill="#fcd34d" />
          <path d="M10 76 Q12 60 8 48 M8 48 q-8 -2 -12 4 M8 48 q8 -3 12 3 M8 48 q-2 -8 4 -10" stroke="#15803d" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      );
      break;
    case 'mountains':
      defs = grad('#c7d2fe', '#6366f1', 'v');
      extra = (
        <>
          <path d="M-10 80 L22 34 L46 72 L68 40 L110 86 V100 H-10Z" fill="#4338ca" opacity=".85" />
          <path d="M22 34 L16 43 L22 41 L27 44 Z M68 40 L62 48 L68 46 L74 50 Z" fill="#fff" />
          <path d="M-10 92 L30 66 L60 88 L84 70 L110 94 V100 H-10Z" fill="#312e81" />
        </>
      );
      break;
    case 'city':
      defs = grad('#1e1b4b', '#0f172a', 'v');
      extra = (
        <>
          <circle cx="80" cy="16" r="5" fill="#fef9c3" opacity=".9" />
          <g fill="#020617">
            {[
              [0, 58, 14],
              [14, 46, 12],
              [26, 62, 10],
              [64, 50, 12],
              [76, 40, 12],
              [88, 56, 14],
            ].map(([bx, by, bw]) => (
              <rect key={bx} x={bx} y={by} width={bw} height={100 - by} />
            ))}
          </g>
          <g fill="#facc15" opacity=".85">
            {[
              [3, 62],
              [8, 70],
              [17, 50],
              [21, 58],
              [17, 66],
              [67, 56],
              [71, 64],
              [79, 46],
              [83, 54],
              [79, 62],
              [92, 60],
              [96, 68],
            ].map(([wx, wy]) => (
              <rect key={`${wx}${wy}`} x={wx} y={wy} width="2" height="2.6" />
            ))}
          </g>
        </>
      );
      break;
    case 'lava':
      defs = grad('#450a0a', '#0c0a09', 'v');
      extra = (
        <>
          <path d="M0 80 Q20 74 40 82 T80 78 T100 80 V100 H0Z" fill="#ea580c" />
          <path d="M0 86 Q25 80 50 88 T100 86 V100 H0Z" fill="#f97316" />
          <path d="M10 30 L18 44 L14 52 M86 20 L80 36 L88 46" stroke="#f97316" strokeWidth="1.4" fill="none" opacity=".8" />
          {[
            [20, 70, 1.4],
            [70, 66, 1],
            [44, 72, 1.2],
          ].map(([cx, cy, r]) => (
            <circle key={cx} cx={cx} cy={cy} r={r} fill="#fde047" />
          ))}
        </>
      );
      break;
    case 'aurora':
      defs = grad('#0f172a', '#020617', 'v');
      extra = (
        <>
          <path d="M-5 40 Q20 18 45 34 T100 22 L100 46 Q75 56 50 44 T-5 60Z" fill="#22c55e" opacity=".45" />
          <path d="M-5 30 Q25 12 50 26 T105 16 L105 30 Q78 40 52 32 T-5 42Z" fill="#a855f7" opacity=".4" />
          {[
            [12, 12],
            [30, 8],
            [64, 10],
            [88, 6],
            [76, 60],
            [8, 70],
          ].map(([cx, cy]) => (
            <circle key={`${cx}${cy}`} cx={cx} cy={cy} r=".8" fill="#fff" />
          ))}
          <path d="M0 88 L18 76 L34 86 L52 74 L72 86 L88 76 L100 84 V100 H0Z" fill="#020617" />
        </>
      );
      break;
    case 'blackhole':
      defs = (
        <radialGradient id={g} cx=".5" cy=".42" r=".75">
          <stop offset="0" stopColor="#000" />
          <stop offset=".22" stopColor="#000" />
          <stop offset=".3" stopColor="#f97316" />
          <stop offset=".38" stopColor="#7c3aed" />
          <stop offset=".7" stopColor="#0b0420" />
          <stop offset="1" stopColor="#020008" />
        </radialGradient>
      );
      extra = (
        <>
          <ellipse cx="50" cy="42" rx="46" ry="7" fill="none" stroke="#fdba74" strokeWidth="2.4" opacity=".7" transform="rotate(-12 50 42)" />
          <ellipse cx="50" cy="42" rx="40" ry="4" fill="none" stroke="#fff" strokeWidth=".8" opacity=".6" transform="rotate(-12 50 42)" />
          {[
            [10, 12],
            [86, 16],
            [14, 78],
            [90, 70],
            [72, 90],
          ].map(([cx, cy]) => (
            <circle key={`${cx}${cy}`} cx={cx} cy={cy} r=".8" fill="#fff" />
          ))}
        </>
      );
      break;
    default:
      defs = grad(item.c1 ?? '#334155', item.c2 ?? '#0f172a');
      extra = <circle cx="50" cy="30" r="40" fill="#fff" opacity=".05" />;
  }
  return (
    <>
      <defs>{defs}</defs>
      <rect width="100" height="100" fill={`url(#${g})`} />
      {extra}
    </>
  );
}

/* ---------- hair (back layer, behind head) ---------- */
function HairBack({ style, x }: { style: string; x: Ctx }) {
  switch (style) {
    case 'long':
    case 'clips':
      return (
        <path
          d="M27 44 C26 25 37 17 50 17 C63 17 74 25 73 44 L76 76 C71 80 64 80 62 73 L62 52 L38 52 L38 73 C36 80 29 80 24 76 Z"
          fill={x.hair}
        />
      );
    case 'ponytail':
      return <path d="M64 28 C82 26 88 46 80 66 C78 54 72 44 64 40 Z" fill={x.hairDark} />;
    case 'afro':
      return (
        <g fill={x.hair}>
          <circle cx="50" cy="35" r="27" />
          {[
            [26, 28],
            [32, 16],
            [44, 10],
            [57, 10],
            [68, 16],
            [74, 28],
            [76, 42],
            [24, 42],
          ].map(([cx, cy]) => (
            <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="8" />
          ))}
        </g>
      );
    case 'bob':
      return <path d="M27.5 44 C26 26 37 18.5 50 18.5 C63 18.5 74 26 72.5 44 L73 60 Q66 64 62 60 L62 50 H38 V60 Q34 64 27 60 Z" fill={x.hair} />;
    case 'pigtails':
      return (
        <g fill={x.hair}>
          <path d="M30 38 C18 36 12 50 17 62 C20 54 25 48 31 46 Z" />
          <path d="M70 38 C82 36 88 50 83 62 C80 54 75 48 69 46 Z" />
        </g>
      );
    case 'braids':
      return (
        <g fill={x.hair}>
          <path d="M28 44 C27 26 37 18.5 50 18.5 C63 18.5 73 26 72 44 Z" />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <ellipse cx="31" cy={50 + i * 6.2} rx="3.8" ry="3.6" />
              <ellipse cx="69" cy={50 + i * 6.2} rx="3.8" ry="3.6" />
            </g>
          ))}
          <circle cx="31" cy="81" r="1.8" fill="#f472b6" />
          <circle cx="69" cy="81" r="1.8" fill="#f472b6" />
        </g>
      );
    default:
      return null;
  }
}

/* ---------- hair (front layer, over head) ---------- */
function HairFront({ style, x }: { style: string; x: Ctx }) {
  // Comic-book shine: a hard white streak, no soft gloss.
  const shine = (
    <g fill="none" stroke="#fff" strokeLinecap="round" opacity=".8">
      <path d="M36.6 27.4 Q40.2 23.6 45.2 22.8" strokeWidth="1.5" />
      <path d="M47.6 22.4 L49 22.3" strokeWidth="1.5" />
    </g>
  );
  const butterfly = (cx: number, cy: number, c: string, rot = 0) => (
    <g key={`${cx}${cy}`} transform={`rotate(${rot} ${cx} ${cy})`} stroke={INK} strokeWidth=".55">
      <ellipse cx={cx - 1.6} cy={cy - 0.9} rx="1.8" ry="1.5" fill={c} />
      <ellipse cx={cx + 1.6} cy={cy - 0.9} rx="1.8" ry="1.5" fill={c} />
      <ellipse cx={cx - 1.2} cy={cy + 1} rx="1.2" ry="1" fill={shade(c, 0.25)} />
      <ellipse cx={cx + 1.2} cy={cy + 1} rx="1.2" ry="1" fill={shade(c, 0.25)} />
      <path d={`M${cx} ${cy - 2} V${cy + 2}`} strokeWidth=".8" />
    </g>
  );
  switch (style) {
    case 'frosted': {
      // spiky with bleached tips, very 2000s
      const tips: Array<[number, number]> = [[28.5, 27], [35.5, 16.5], [44, 11], [53, 10], [61.5, 13.5], [68.5, 20], [72, 29]];
      return (
        <g>
          <path d="M28.5 43 C28 30 37 21.5 50 21.5 C63 21.5 72 30 71.5 43 C67.5 35.5 60 32 50 32.5 C40 32 32.5 35.5 28.5 43Z" fill={x.hair} />
          {tips.map(([ax, ay]) => (
            <path key={ax} d={`M${ax - 5 + (ax - 50) * 0.08} ${ay + 15} L${ax} ${ay} L${ax + 5 + (ax - 50) * 0.08} ${ay + 15}Z`} fill={x.hair} />
          ))}
          {tips.map(([ax, ay]) => (
            <path key={`t${ax}`} d={`M${ax - 2.4} ${ay + 6.2} L${ax} ${ay} L${ax + 2.4} ${ay + 6.2}Z`} fill="#fdf2c2" />
          ))}
        </g>
      );
    }
    case 'spacebuns':
      return (
        <g>
          <circle cx="34" cy="20" r="7" fill={x.hair} />
          <circle cx="66" cy="20" r="7" fill={x.hair} />
          <path d="M29 42 C29 28 38 20.5 50 20.5 C62 20.5 71 28 71 42 C66 33 56 30.5 50 31 C44 30.5 34 33 29 42Z" fill={x.hair} />
          <path d="M50 21 V30.5" stroke={x.hairDark} strokeWidth=".8" />
          {butterfly(41, 25, '#f472b6', -15)}
          {shine}
        </g>
      );
    case 'curtains':
      // 90s middle part with curtain bangs
      return (
        <g>
          <path d="M29 44 C28 29 38 20.5 50 20.5 C62 20.5 72 29 71 44 C69 37 63 31.5 53.4 29.6 L50 33.4 L46.6 29.6 C37 31.5 31 37 29 44Z" fill={x.hair} />
          <path d="M50 21 V32" stroke={x.hairDark} strokeWidth=".8" />
          <path d="M33 37 Q37 31.5 44 30.6 M67 37 Q63 31.5 56 30.6" stroke={x.hairDark} strokeWidth=".7" fill="none" strokeLinecap="round" />
          {shine}
        </g>
      );
    case 'clips':
      // long hair with a zig-zag part and butterfly clips
      return (
        <g>
          <path d="M29 43 C29 28 38 20.5 50 20.5 C62 20.5 71 28 71 43 C67 34 59 29.5 50 30.5 C46 34 38 37 29 43Z" fill={x.hair} />
          <path d="M50 21 l-1.4 2 l2.4 2 l-2.4 2 l2.4 2 l-1 1.4" stroke={x.hairDark} strokeWidth=".7" fill="none" strokeLinejoin="round" />
          {butterfly(37.5, 30, '#a78bfa', -25)}
          {butterfly(43.5, 25.8, '#f472b6', -10)}
          {butterfly(58, 25.4, '#38bdf8', 12)}
          {shine}
        </g>
      );
    case 'twists': {
      // short twists on top with faded sides, like a fresh cut
      const tufts: Array<[number, number, number]> = [
        [33.4, 34.2, 3.6], [36.2, 29.2, 3.9], [40.6, 25.4, 4.1], [46.2, 23.2, 4.2], [52.2, 22.8, 4.2], [58, 24.4, 4.1], [62.8, 27.8, 3.9], [66.4, 32.6, 3.6],
        [42.8, 30, 3.9], [49.4, 28.4, 4.1], [56.2, 29.4, 3.9], [38.4, 33.4, 3.2], [61.6, 33.4, 3.2],
      ];
      const tip = shade(x.hair, 0.28);
      return (
        <g>
          <path d="M29.4 42 C29.4 30 38.6 22.5 50 22.5 C61.4 22.5 70.6 30 70.6 42 C68.6 38.6 66.4 36.6 63.6 35.6 L36.4 35.6 C33.6 36.6 31.4 38.6 29.4 42Z" fill={x.hairDark} />
          <g fill={x.hair}>
            {tufts.map(([cx, cy, r]) => (
              <path key={`${cx}${cy}`} d={`M${cx - r} ${cy + r * 0.4} C${cx - r} ${cy - r * 0.9} ${cx - r * 0.2} ${cy - r * 1.35} ${cx + r * 0.25} ${cy - r * 1.45} C${cx + r * 0.2} ${cy - r * 0.9} ${cx + r} ${cy - r * 0.6} ${cx + r} ${cy + r * 0.4} C${cx + r} ${cy + r * 1.1} ${cx - r} ${cy + r * 1.1} ${cx - r} ${cy + r * 0.4}Z`} />
            ))}
          </g>
          {tufts.slice(0, 11).map(([cx, cy, r]) => (
            <path key={`t${cx}${cy}`} d={`M${cx - r * 0.45} ${cy + r * 0.1} Q${cx} ${cy - r * 0.6} ${cx + r * 0.35} ${cy - r * 0.9}`} stroke={tip} strokeWidth=".7" fill="none" strokeLinecap="round" opacity=".7" />
          ))}
        </g>
      );
    }
    case 'short':
      return (
        <g>
          <path
            d="M28.5 44 C27 28 37 19 50 19 C63 19 73 28 71.5 44 C70.2 39.5 68 36 64.6 33.6 L63.6 36.4 L60.8 32.4 L58.8 35.6 L56.4 31.6 L53.4 35 L51.4 31.2 L47.6 34.6 L46.4 30.8 L42.2 34.2 L41.4 31 L37.4 34.6 C33.2 36.6 30.2 40 28.5 44 Z"
            fill={x.hair}
          />
          <path d="M42.2 34.2 L44.6 28.8 M47.6 34.6 L49.4 28.6 M53.4 35 L54.4 29 M58.8 35.6 L58.4 29.6" stroke={x.hairDark} strokeWidth=".6" opacity=".55" strokeLinecap="round" />
          {shine}
        </g>
      );
    case 'buzz':
      return <path d="M29 40 C30 27 39 20.5 50 20.5 C61 20.5 70 27 71 40 C64 32.5 36 32.5 29 40Z" fill={x.hair} opacity=".9" />;
    case 'long':
      return (
        <g>
          <path d="M29 43 C29 28 38 20.5 50 20.5 C62 20.5 71 28 71 43 C67 34 59 29.5 50 30.5 C46 34 38 37 29 43Z" fill={x.hair} />
          {shine}
        </g>
      );
    case 'curly':
      return (
        <g fill={x.hair}>
          {[
            [30, 39],
            [32, 31],
            [37, 25],
            [44, 21.5],
            [52, 20.5],
            [59, 22.5],
            [65, 26.5],
            [69, 32],
            [70.5, 39.5],
            [42, 29],
            [50, 27.5],
            [58, 29.5],
          ].map(([cx, cy]) => (
            <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="5.6" />
          ))}
        </g>
      );
    case 'ponytail':
      return (
        <g>
          <path d="M29 43 C28 28 38 20 50 20 C62 20 72 28 71 43 C67 34 58 30 46 31 C38 33 32 37 29 43Z" fill={x.hair} />
          <rect x="63" y="27" width="5" height="5" rx="1.5" fill="#f472b6" transform="rotate(20 65 29)" />
          {shine}
        </g>
      );
    case 'bun':
      return (
        <g>
          <circle cx="50" cy="15.5" r="7.5" fill={x.hair} />
          <path d="M43.5 20.5 Q50 23 56.5 20.5" stroke={x.hairDark} strokeWidth="1.6" fill="none" />
          <path d="M29 42 C29 28 38 20.5 50 20.5 C62 20.5 71 28 71 42 C66 33 34 33 29 42Z" fill={x.hair} />
          {shine}
        </g>
      );
    case 'spiky':
      return (
        <path
          d="M28 44 L26 33 L33 35 L32 24 L40 29 L41 16 L48 25.5 L53 14 L56 26 L64 18 L64.5 29 L72 26 L69.5 35 L74 37 L72 44 C68 35 60 31 50 32 C40 31 32 35 28 44Z"
          fill={x.hair}
          stroke={x.hairDark}
          strokeWidth=".8"
          strokeLinejoin="round"
        />
      );
    case 'afro':
      return <path d="M29 40 C30 28 39 22 50 22 C61 22 70 28 71 40 C64 33 36 33 29 40Z" fill={x.hairDark} opacity=".9" />;
    case 'mohawk':
      return (
        <g>
          <path d="M30 40 C31 28 40 21.5 50 21.5 C60 21.5 69 28 70 40 C63 33 37 33 30 40Z" fill={x.hairDark} opacity=".45" />
          <path d="M45.5 34 C44 25 45.5 13 50 4 C54.5 13 56 25 54.5 34 Z" fill={x.hair} stroke={x.hairDark} strokeWidth=".8" />
        </g>
      );
    case 'quiff':
      return (
        <g>
          <path d="M29 42 C28 30 35 22 44 20 C47 13 58 11 66 17 C61 16 58 18 57 21 C66 23 72 31 71 42 C68 35 63 31.5 56 31 C50 33 40 34 29 42Z" fill={x.hair} />
        </g>
      );
    case 'bob':
      return (
        <g>
          <path d="M29 41 C29 27 38 20.5 50 20.5 C62 20.5 71 27 71 41 L71 37 Q50 31 29 37 Z" fill={x.hair} />
          <path d="M30.5 37.5 Q50 30.5 69.5 37.5 L69 34 Q50 27 31 34Z" fill={x.hairDark} opacity=".35" />
          {shine}
        </g>
      );
    case 'pigtails':
      return (
        <g>
          <path d="M29 42 C28 28 38 20 50 20 C62 20 72 28 71 42 C67 34 58 30.5 50 31 C42 30.5 33 34 29 42Z" fill={x.hair} />
          <circle cx="29.5" cy="40" r="2.2" fill="#38bdf8" />
          <circle cx="70.5" cy="40" r="2.2" fill="#38bdf8" />
          {shine}
        </g>
      );
    case 'braids':
      return (
        <g>
          <path d="M29 43 C29 28 38 20.5 50 20.5 C62 20.5 71 28 71 43 C67 34 58 29 51 29.5 L50 33 L49 29.5 C42 29 33 34 29 43Z" fill={x.hair} />
          <path d="M50 21 V31" stroke={x.hairDark} strokeWidth=".9" />
        </g>
      );
    case 'messy':
      return (
        <path
          d="M28 44 C25 36 28 30 31 31 C30 24 36 21 39 24 C40 18 47 17 49 21 C52 16 59 17 60 22 C64 19 70 23 68 28 C73 29 74 36 72 44 C69 36 64 32 57 31.5 C55 35 46 35 42 33.5 C36 35 31 39 28 44Z"
          fill={x.hair}
          stroke={x.hairDark}
          strokeWidth=".7"
          strokeLinejoin="round"
        />
      );
    default:
      return null;
  }
}

/* ---------- outfit ---------- */
// Natural sloped shoulders (not a round blob).
const TORSO = 'M9 100 C9.5 89 14 83.5 23 80.5 C31 77.8 39 75.4 45 74.4 H55 C61 75.4 69 77.8 77 80.5 C86 83.5 90.5 89 91 100 Z';

function Outfit({ item, x }: { item: AvatarItem; x: Ctx }) {
  const c1 = item.c1 ?? '#64748b';
  const c2 = item.c2 ?? shade(c1, -0.25);
  const g = `${x.id}out`;
  const neckline = <path d="M41.5 73.2 Q50 83 58.5 73.2 Z" fill={x.skin} />;
  switch (item.style) {
    case 'babytee':
      // fitted baby tee with a chrome star
      return (
        <g>
          <defs>
            <linearGradient id={`${g}ch`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f8fafc" />
              <stop offset=".45" stopColor="#c4b5fd" />
              <stop offset=".7" stopColor="#7dd3fc" />
              <stop offset="1" stopColor="#f0abfc" />
            </linearGradient>
          </defs>
          <path d={TORSO} fill={c1} />
          {neckline}
          <path d="M41.5 73.2 Q50 83 58.5 73.2" stroke={c2} strokeWidth="1.6" fill="none" />
          <path d={star(50, 90, 7.2, 3, 4)} fill={`url(#${g}ch)`} stroke="#1b1512" strokeWidth="1" strokeLinejoin="round" />
          <path d={star(60, 84.5, 2.2, 0.8, 4)} fill="#fff" />
          <path d={star(40.5, 85.5, 1.6, 0.6, 4)} fill="#fff" />
        </g>
      );
    case 'chromepuffer':
      return (
        <g>
          <defs>
            <linearGradient id={`${g}cp`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#94a3b8" />
              <stop offset=".25" stopColor="#f1f5f9" />
              <stop offset=".5" stopColor="#a5b4fc" />
              <stop offset=".75" stopColor="#f5d0fe" />
              <stop offset="1" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          <path d={TORSO} fill={`url(#${g}cp)`} />
          {[86, 93].map((y) => (
            <path key={y} d={`M12 ${y} Q50 ${y - 3} 88 ${y}`} stroke="#475569" strokeWidth=".8" fill="none" opacity=".7" />
          ))}
          <path d="M38 76 Q50 70 62 76 L60 83 Q50 79 40 83Z" fill="#cbd5e1" stroke="#475569" strokeWidth=".6" />
          <path d="M50 78 V100" stroke="#334155" strokeWidth="1" />
          <path d="M22 82 Q30 80 34 86" stroke="#fff" strokeWidth="1.4" fill="none" opacity=".7" strokeLinecap="round" />
        </g>
      );
    case 'meshjersey':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          <path d="M42 73.4 L50 82 L58 73.4 Z" fill={x.skin} />
          <path d="M41 73.4 L50 83 L59 73.4" stroke={c2} strokeWidth="2.2" fill="none" />
          <path d="M14 88 Q16 84 22 82 M86 88 Q84 84 78 82" stroke={c2} strokeWidth="2.4" fill="none" />
          <text x="50" y="97" textAnchor="middle" fontSize="12" fontWeight="900" fontFamily="system-ui, sans-serif" fill={c2} stroke="#1b1512" strokeWidth=".6">
            00
          </text>
        </g>
      );
    case 'chaintee':
      // black tee with a silver chain and a star pendant
      return (
        <g>
          <path d={TORSO} fill={c1} />
          {neckline}
          <path d="M41.5 73.2 Q50 83 58.5 73.2" stroke={c2} strokeWidth="1.6" fill="none" />
          <path d="M42 75 Q50 89 58 75" stroke="#e2e8f0" strokeWidth="1.2" fill="none" strokeDasharray="1.3 .7" />
          <path d={star(50, 88.4, 3, 1.3, 5)} fill="#e2e8f0" stroke="#1b1512" strokeWidth=".6" />
          <path d="M70 90 l4 -4 M74 90 l-4 -4" stroke="#f472b6" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      );
    case 'graphic':
      // an oversized tee with a big smiley print
      return (
        <g>
          <path d={TORSO} fill={c1} />
          {neckline}
          <path d="M41.5 73.2 Q50 83 58.5 73.2" stroke={c2} strokeWidth="1.6" fill="none" />
          <path d="M22 86 Q25 93 24 100 M78 86 Q75 93 76 100" stroke={c2} strokeWidth="1" fill="none" />
          <g stroke="#1b1512" strokeWidth="1.3" fill="none" strokeLinecap="round">
            <circle cx="50" cy="89" r="6.4" />
            <path d="M46.4 86.4 l1.8 1.8 M48.2 86.4 l-1.8 1.8" />
            <circle cx="53.2" cy="87.2" r="1" />
            <path d="M45.9 90.4 Q50 94.2 54.1 90.4" />
          </g>
          <path d="M50.5 92.1 q.2 2.6 1.6 2.6 q1.4 0 1 -3" fill="#f472b6" stroke="#1b1512" strokeWidth=".9" />
        </g>
      );
    case 'tee':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          {neckline}
          <path d="M41.5 73.2 Q50 83 58.5 73.2" stroke={c2} strokeWidth="1.8" fill="none" />
          <path d="M24 88 Q26 94 25 100 M76 88 Q74 94 75 100" stroke={c2} strokeWidth="1" fill="none" />
        </g>
      );
    case 'hoodie':
    case 'flame':
      return (
        <g>
          {item.style === 'flame' && (
            <defs>
              <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1c1917" />
                <stop offset="1" stopColor="#450a0a" />
              </linearGradient>
            </defs>
          )}
          <path d={TORSO} fill={item.style === 'flame' ? `url(#${g})` : c1} />
          {item.style === 'flame' && (
            <path
              d="M14 100 C18 92 20 86 24 90 C26 84 30 82 32 88 C35 80 40 80 41 88 C44 82 48 80 50 88 C53 80 58 82 59 88 C61 82 66 82 68 89 C71 84 76 86 76 92 C80 88 84 92 86 100Z"
              fill={c1}
            />
          )}
          {item.style === 'flame' && (
            <path d="M24 100 C26 95 30 92 33 96 C36 90 42 91 44 97 C47 92 53 92 56 97 C59 91 65 91 67 96 C70 93 74 95 76 100Z" fill="#facc15" />
          )}
          <path d="M34 76 Q50 64 66 76 L61 82 Q50 75 39 82 Z" fill={item.style === 'flame' ? '#292524' : c2} />
          <path d="M45.5 80 L44.5 91 M54.5 80 L55.5 91" stroke="#f8fafc" strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="44.5" cy="91.5" r="1.1" fill="#f8fafc" />
          <circle cx="55.5" cy="91.5" r="1.1" fill="#f8fafc" />
          {item.style === 'hoodie' && <path d="M36 94 Q50 91 64 94 L62 100 H38 Z" fill={c2} opacity=".7" />}
        </g>
      );
    case 'bomber':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          {neckline}
          <path d="M40 74 Q50 70 60 74 L58.5 77 Q50 74 41.5 77 Z" fill={c2} />
          <path d="M50 79 V100" stroke="#d4d4d8" strokeWidth="1.2" />
          <path d="M33 88 l7 -2 M60 86 l7 2" stroke={shade(c1, -0.35)} strokeWidth="1.4" strokeLinecap="round" />
          <rect x="22" y="80" width="5" height="3" rx="1" fill={c2} />
        </g>
      );
    case 'track':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          {neckline}
          <path d="M40.5 74.5 L50 78 L59.5 74.5" stroke={c2} strokeWidth="2" fill="none" />
          <path d="M50 78 V100" stroke={shade(c1, -0.3)} strokeWidth="1.2" />
          <path d="M18 84 L23 100 M21.5 82 L27 100 M82 84 L77 100 M78.5 82 L73 100" stroke={c2} strokeWidth="1.4" />
        </g>
      );
    case 'jersey':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          <path d="M42 73.4 L50 83 L58 73.4 Z" fill={x.skin} />
          <path d="M42 73.4 L50 83 L58 73.4" stroke={c2} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
          <text x="50" y="97.5" textAnchor="middle" fontSize="13" fontWeight="900" fill={c2} fontFamily="system-ui, sans-serif">
            1
          </text>
          <path d="M16 90 L20 88 M84 90 L80 88" stroke={c2} strokeWidth="3" />
        </g>
      );
    case 'ninja':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          <path d="M42 73.4 L50 81 L58 73.4 Z" fill={x.skin} />
          <path d="M41 73.5 L60 100 M59 73.5 L48 88" stroke="#374151" strokeWidth="3.2" />
          <path d="M14 97 H86" stroke={c2} strokeWidth="3.5" />
        </g>
      );
    case 'suit':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          <path d="M41.5 73.3 L50 92 L58.5 73.3 Z" fill="#f8fafc" />
          <path d="M48.3 76 h3.4 l1.3 10 l-3 4 l-3 -4 z" fill={c2} />
          <path d="M48.6 75 h2.8 l-.5 2 h-1.8z" fill={shade(c2, -0.3)} />
          <path d="M41.5 73.3 L50 92 L43 94 L36 78 Z M58.5 73.3 L50 92 L57 94 L64 78 Z" fill={shade(c1, 0.12)} />
          <circle cx="50" cy="96" r=".9" fill="#94a3b8" />
          <path d="M62 84 h5" stroke="#f8fafc" strokeWidth="1.2" />
        </g>
      );
    case 'space':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          <path d={TORSO} fill="none" stroke={c2} strokeWidth=".6" />
          <ellipse cx="50" cy="75" rx="11" ry="4" fill={c2} />
          <ellipse cx="50" cy="74.5" rx="8" ry="2.6" fill={x.skin} />
          <rect x="41" y="84" width="18" height="11" rx="2.5" fill="#e2e8f0" stroke={c2} strokeWidth=".8" />
          <circle cx="45" cy="89.5" r="1.4" fill="#ef4444" />
          <circle cx="50" cy="89.5" r="1.4" fill="#22c55e" />
          <circle cx="55" cy="89.5" r="1.4" fill="#3b82f6" />
          <rect x="20" y="86" width="7" height="4" rx="1" fill="#2563eb" />
        </g>
      );
    case 'armor':
      return (
        <g>
          <defs>
            <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f1f5f9" />
              <stop offset=".5" stopColor={c1} />
              <stop offset="1" stopColor={c2} />
            </linearGradient>
          </defs>
          <path d={TORSO} fill={`url(#${g})`} />
          <ellipse cx="50" cy="74.5" rx="9" ry="3" fill={x.skin} />
          <path d="M30 86 Q50 80 70 86 M28 94 Q50 88 72 94" stroke={c2} strokeWidth="1" fill="none" />
          <ellipse cx="22" cy="84" rx="11" ry="7" fill={c2} />
          <ellipse cx="78" cy="84" rx="11" ry="7" fill={c2} />
          <ellipse cx="22" cy="83" rx="9" ry="5" fill={c1} />
          <ellipse cx="78" cy="83" rx="9" ry="5" fill={c1} />
          {[16, 22, 28, 72, 78, 84].map((cx) => (
            <circle key={cx} cx={cx} cy="83" r=".9" fill={c2} />
          ))}
          <circle cx="50" cy="90" r="4.5" fill="#facc15" stroke="#a16207" strokeWidth=".8" />
          <path d={star(50, 90, 2.6, 1.1)} fill="#a16207" />
        </g>
      );
    case 'robe':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          <path d="M47.5 76 H52.5 V100 H47.5 Z" fill={c2} />
          <path d="M22 84 Q50 69 78 84 Q50 93 22 84 Z" fill="#f8fafc" />
          {[30, 38, 46, 54, 62, 70].map((cx, i) => (
            <path key={cx} d={`M${cx} ${82 + (i % 2)} l.8 2 l-.8 1 l-.8 -1z`} fill="#111827" />
          ))}
          <ellipse cx="50" cy="75" rx="8" ry="2.8" fill={x.skin} />
          <circle cx="50" cy="90" r="1.6" fill="#facc15" />
          <circle cx="50" cy="95" r="1.6" fill="#facc15" />
        </g>
      );
    case 'denim':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          <path d="M42 73.4 L50 84 L58 73.4 Z" fill={c2} />
          <path d="M42 73.4 L50 84 L58 73.4 Z" fill="none" stroke={shade(c1, -0.3)} strokeWidth=".8" />
          <path d="M40.5 73 L36 80 L44 82 Z M59.5 73 L64 80 L56 82 Z" fill={shade(c1, -0.15)} />
          <rect x="32" y="85" width="9" height="7" rx="1" fill="none" stroke="#fbbf24" strokeWidth=".7" strokeDasharray="1.2 .8" />
          <rect x="59" y="85" width="9" height="7" rx="1" fill="none" stroke="#fbbf24" strokeWidth=".7" strokeDasharray="1.2 .8" />
          {[88, 94].map((cy) => (
            <circle key={cy} cx="50" cy={cy} r=".9" fill="#d4d4d8" />
          ))}
        </g>
      );
    case 'stripes':
      return (
        <g>
          <defs>
            <clipPath id={`${x.id}torso`}>
              <path d={TORSO} />
            </clipPath>
          </defs>
          <path d={TORSO} fill={c1} />
          <g clipPath={`url(#${x.id}torso)`} fill={c2}>
            {[78, 84, 90, 96].map((y) => (
              <rect key={y} x="0" y={y} width="100" height="2.6" />
            ))}
          </g>
          <path d="M41 73.3 Q50 81 59 73.3 Z" fill={x.skin} />
          <path d="M41 73.3 Q50 81 59 73.3" stroke={shade(c1, -0.3)} strokeWidth="2" fill="none" />
        </g>
      );
    case 'flannel':
      return (
        <g>
          <defs>
            <clipPath id={`${x.id}torso`}>
              <path d={TORSO} />
            </clipPath>
          </defs>
          <path d={TORSO} fill={c1} />
          <g clipPath={`url(#${x.id}torso)`}>
            {[16, 26, 36, 46, 56, 66, 76, 86].map((vx) => (
              <rect key={vx} x={vx} y="70" width="3" height="32" fill={c2} opacity=".45" />
            ))}
            {[79, 89, 99].map((y) => (
              <rect key={y} x="0" y={y} width="100" height="3" fill={c2} opacity=".45" />
            ))}
          </g>
          <path d="M42 73.4 L50 82 L58 73.4 Z" fill={x.skin} />
          <path d="M42 73.4 L46 80 L50 82 M58 73.4 L54 80 L50 82" stroke={shade(c1, -0.35)} strokeWidth="1.4" fill="none" />
          {[86, 92, 98].map((cy) => (
            <circle key={cy} cx="50" cy={cy} r=".8" fill="#f8fafc" />
          ))}
        </g>
      );
    case 'overalls':
      return (
        <g>
          <path d={TORSO} fill="#f8fafc" />
          <path d="M41.5 73.2 Q50 81 58.5 73.2 Z" fill={x.skin} />
          <path d="M33 86 H67 L69 100 H31 Z" fill={c1} />
          <path d="M35 78 L37 87 M65 78 L63 87" stroke={c1} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="37" cy="87" r="1.4" fill={c2} />
          <circle cx="63" cy="87" r="1.4" fill={c2} />
          <rect x="44" y="90" width="12" height="7" rx="1.5" fill={shade(c1, -0.15)} />
        </g>
      );
    case 'chef':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          <path d={TORSO} fill="none" stroke="#e2e8f0" strokeWidth=".6" />
          <path d="M40 73 Q50 80 60 73 L58 78 Q50 82 42 78Z" fill={c2} />
          <path d="M53 78 V100" stroke="#e2e8f0" strokeWidth=".8" />
          {[84, 90, 96].map((cy) => (
            <g key={cy}>
              <circle cx="46" cy={cy} r="1" fill="#94a3b8" />
              <circle cx="58" cy={cy} r="1" fill="#94a3b8" />
            </g>
          ))}
        </g>
      );
    case 'puffer':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          {[80, 87, 94].map((y) => (
            <path key={y} d={`M14 ${y + 4} Q50 ${y - 4} 86 ${y + 4}`} stroke={c2} strokeWidth="1.2" fill="none" />
          ))}
          <path d="M38 76 Q50 66 62 76 L60 81 Q50 76 40 81Z" fill={c2} />
          <path d="M50 78 V100" stroke="#cbd5e1" strokeWidth="1.2" />
          <path d="M24 84 q4 -3 8 0" stroke="#fff" strokeOpacity=".2" strokeWidth="1.2" fill="none" />
        </g>
      );
    case 'varsity':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          <path d="M12 100 C12 88 17 80 26 76 L30 100Z M88 100 C88 88 83 80 74 76 L70 100Z" fill={c2} />
          <path d="M41 73.3 Q50 81 59 73.3 Z" fill={x.skin} />
          <path d="M40.5 73.5 Q50 82 59.5 73.5" stroke={c2} strokeWidth="2.4" fill="none" />
          <path d="M40.5 73.5 Q50 82 59.5 73.5" stroke={c1} strokeWidth=".8" fill="none" />
          <text x="40" y="94" textAnchor="middle" fontSize="9" fontWeight="900" fill={c2} fontFamily="Georgia, serif">D</text>
          {[86, 92, 98].map((cy) => (
            <circle key={cy} cx="50" cy={cy} r="1" fill={c2} />
          ))}
        </g>
      );
    case 'leather':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          <path d="M41.5 73.3 L50 86 L58.5 73.3 Z" fill="#f8fafc" />
          <path d="M41.5 73.3 L36 78 L46 92 L50 86 Z" fill="#27272a" />
          <path d="M58.5 73.3 L64 78 L54 92 L50 86 Z" fill="#27272a" />
          <path d="M53 86 L57 100" stroke={c2} strokeWidth="1.1" />
          <path d="M28 88 h6 M66 92 h6" stroke={c2} strokeWidth="1" />
          <circle cx="37" cy="79" r=".8" fill={c2} />
          <circle cx="63" cy="79" r=".8" fill={c2} />
        </g>
      );
    case 'lab':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          <path d={TORSO} fill="none" stroke="#cbd5e1" strokeWidth=".6" />
          <path d="M41.5 73.3 L50 90 L58.5 73.3 Z" fill={c2} />
          <path d="M41.5 73.3 L50 90 L44 92 L36 78 Z M58.5 73.3 L50 90 L56 92 L64 78 Z" fill="#e2e8f0" />
          <rect x="60" y="86" width="9" height="8" rx="1" fill="none" stroke="#cbd5e1" strokeWidth=".7" />
          <path d="M62 84 V89 M64.5 83.5 V89" stroke="#ef4444" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M64.5 83.5 V89" stroke="#2563eb" strokeWidth="1.1" />
        </g>
      );
    case 'hawaii':
      return (
        <g>
          <defs>
            <clipPath id={`${x.id}torso`}>
              <path d={TORSO} />
            </clipPath>
          </defs>
          <path d={TORSO} fill={c1} />
          <g clipPath={`url(#${x.id}torso)`}>
            {[
              [22, 86],
              [34, 96],
              [64, 84],
              [76, 95],
              [52, 97],
              [80, 82],
            ].map(([cx, cy]) => (
              <g key={`${cx}${cy}`}>
                {[0, 72, 144, 216, 288].map((a) => (
                  <circle key={a} cx={cx + 2 * Math.cos((a * Math.PI) / 180)} cy={cy + 2 * Math.sin((a * Math.PI) / 180)} r="1.8" fill="#fb7185" />
                ))}
                <circle cx={cx} cy={cy} r="1.1" fill={c2} />
              </g>
            ))}
            <path d="M26 92 q4 -6 8 -2 M70 90 q4 -6 8 -2" stroke="#4ade80" strokeWidth="1.6" fill="none" />
          </g>
          <path d="M41.5 73.3 L50 86 L58.5 73.3 Z" fill={x.skin} />
          <path d="M41.5 73.3 L37 80 L46 83 L50 86 M58.5 73.3 L63 80 L54 83 L50 86" fill={shade(c1, -0.15)} stroke={shade(c1, -0.3)} strokeWidth=".6" />
        </g>
      );
    case 'hero':
      return (
        <g>
          <path d="M8 100 L18 78 Q50 70 82 78 L92 100Z" fill={c2} />
          <path d={TORSO} fill={c1} />
          <path d="M41.5 73.3 Q50 78 58.5 73.3 Z" fill={x.skin} />
          <path d="M40 73.6 Q50 78.5 60 73.6" stroke={c2} strokeWidth="1.8" fill="none" />
          <path d="M42 84 L50 80 L58 84 L50 96 Z" fill="#facc15" stroke={c2} strokeWidth="1.2" strokeLinejoin="round" />
          <text x="50" y="90.5" textAnchor="middle" fontSize="7" fontWeight="900" fill={c2} fontFamily="system-ui, sans-serif">D</text>
        </g>
      );
    case 'pirate':
      return (
        <g>
          <path d={TORSO} fill={c1} />
          <path d="M42 73.3 L50 90 L58 73.3 Z" fill="#f8fafc" />
          <path d="M45 76 q2.5 2 5 0 q2.5 2 5 0 M46 80 q2 1.6 4 0 q2 1.6 4 0" stroke="#cbd5e1" strokeWidth="1" fill="none" />
          <path d="M42 73.3 L36 80 L44 96 L50 90 Z M58 73.3 L64 80 L56 96 L50 90 Z" fill={shade(c1, -0.2)} />
          <path d="M36 80 L44 96 M64 80 L56 96" stroke={c2} strokeWidth="1.2" />
          {[84, 90].map((cy) => (
            <g key={cy}>
              <circle cx="42" cy={cy} r="1.1" fill={c2} />
              <circle cx="58" cy={cy} r="1.1" fill={c2} />
            </g>
          ))}
        </g>
      );
    case 'galaxyhoodie':
      return (
        <g>
          <defs>
            <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={c1} />
              <stop offset=".6" stopColor="#6d28d9" />
              <stop offset="1" stopColor="#db2777" />
            </linearGradient>
          </defs>
          <path d={TORSO} fill={`url(#${g})`} />
          {[
            [24, 88, 0.9],
            [33, 95, 0.6],
            [66, 86, 0.8],
            [74, 96, 1],
            [58, 98, 0.5],
            [28, 80, 0.5],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={r} fill="#fff" />
          ))}
          <path d={star(70, 90, 2, 0.7, 4)} fill="#fde68a" />
          <path d="M34 76 Q50 64 66 76 L61 82 Q50 75 39 82 Z" fill="#1e1b4b" />
          <path d="M45.5 80 L44.5 91 M54.5 80 L55.5 91" stroke={c2} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="44.5" cy="91.5" r="1.1" fill={c2} />
          <circle cx="55.5" cy="91.5" r="1.1" fill={c2} />
        </g>
      );
    case 'dragonarmor':
      return (
        <g>
          <defs>
            <clipPath id={`${x.id}torso`}>
              <path d={TORSO} />
            </clipPath>
          </defs>
          <path d={TORSO} fill={c1} />
          <g clipPath={`url(#${x.id}torso)`} fill="none" stroke="#450a0a" strokeWidth=".9">
            {[78, 84, 90, 96].map((y, row) =>
              [10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90].map((sx) => (
                <path key={`${y}${sx}`} d={`M${sx + (row % 2) * 4 - 4} ${y} q4 5 8 0`} />
              )),
            )}
          </g>
          <ellipse cx="50" cy="74.5" rx="9" ry="3" fill={x.skin} />
          <path d="M22 80 Q50 70 78 80" stroke={c2} strokeWidth="2.2" fill="none" />
          <path d="M18 86 L26 78 L28 88 Z M82 86 L74 78 L72 88 Z" fill={c2} />
          <circle cx="50" cy="89" r="4" fill="#f97316" stroke={c2} strokeWidth="1.2" />
          <circle cx="49" cy="88" r="1.3" fill="#fde047" />
        </g>
      );
    case 'holo':
      return (
        <g>
          <defs>
            <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#67e8f9" />
              <stop offset=".35" stopColor="#a78bfa" />
              <stop offset=".7" stopColor="#f0abfc" />
              <stop offset="1" stopColor="#fde68a" />
            </linearGradient>
          </defs>
          <path d={TORSO} fill={`url(#${g})`} />
          <path d="M20 100 L34 76 M30 100 L44 78 M58 100 L70 78 M70 100 L80 82" stroke="#fff" strokeOpacity=".35" strokeWidth="2.2" />
          <path d="M34 76 Q50 64 66 76 L61 82 Q50 75 39 82 Z" fill="#312e81" opacity=".85" />
          <path d="M45.5 80 L44.5 91 M54.5 80 L55.5 91" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="44.5" cy="91.5" r="1.1" fill="#fff" />
          <circle cx="55.5" cy="91.5" r="1.1" fill="#fff" />
          <path d={TORSO} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth=".6" />
        </g>
      );
    default:
      return <path d={TORSO} fill={c1} />;
  }
}

/* ---------- face / expression ---------- */
// Realistic comic style (like a modern game character): almond eyes with a coloured iris and a
// bold inked upper lid, tapered inked brows, a drawn nose and lips, all with hard comic shadows.
const EYE_L = 42.5;
const EYE_R = 57.5;
const EYE_Y = 45;
const EYE_W = 4.3;
const EYE_H = 3.3;
const INK = '#1b1512';
const MOUTH_IN = '#4a1418';
const TONGUE = '#d9596a';

function heart(cx: number, cy: number, s: number): string {
  return `M${cx} ${cy + s * 0.9} C${cx - s * 1.6} ${cy - s * 0.1} ${cx - s * 0.9} ${cy - s * 1.3} ${cx} ${cy - s * 0.45} C${cx + s * 0.9} ${cy - s * 1.3} ${cx + s * 1.6} ${cy - s * 0.1} ${cx} ${cy + s * 0.9}Z`;
}

type EyeKind = 'open' | 'round' | 'happy' | 'closed' | 'half' | 'star' | 'heart' | 'dizzy' | 'robot' | 'fire' | 'side' | 'x' | 'sparkle' | 'puppy' | 'cosmic' | 'squint' | 'droopy';
/** How the upper lid cuts across the eye: angry slants down to the nose, sad slants up. */
type Lid = 'none' | 'angry' | 'sad' | 'half' | 'squint' | 'droopy';

/** Almond eye outline; `dir` points to the outer corner (towards the ear). */
function almond(cx: number, cy: number, dir: number, w = EYE_W, h = EYE_H): string {
  const X = (dx: number) => cx + dx * dir;
  return `M${X(-w)} ${cy + 0.4} Q${X(-w * 0.45)} ${cy - h} ${X(w * 0.12)} ${cy - h * 0.98} Q${X(w * 0.78)} ${cy - h * 0.86} ${X(w)} ${cy - 0.3} Q${X(w * 0.45)} ${cy + h * 0.78} ${X(-w * 0.08)} ${cy + h * 0.74} Q${X(-w * 0.72)} ${cy + h * 0.62} ${X(-w)} ${cy + 0.4}Z`;
}

/**
 * The comic eye: white almond, coloured iris with a dark ring, pupil and a hard light dot, a bold
 * inked upper lid with a flick at the outer corner, a light lower lid and the crease above.
 */
function ComicEye({ cx, cy, x, dir, lid = 'none', look = 0, big = false }: { cx: number; cy: number; x: Ctx; dir: number; lid?: Lid; look?: number; big?: boolean }) {
  const w = big ? EYE_W + 0.5 : EYE_W;
  const h = big ? EYE_H + 1 : EYE_H;
  const X = (dx: number) => cx + dx * dir;
  const cid = `${x.id}k${Math.round(cx * 10)}`;
  const shape = almond(cx, cy, dir, w, h);
  // the lid line: from the inner end height to the outer end height
  const cut: Record<Lid, [number, number]> = {
    none: [cy - 20, cy - 20],
    angry: [cy - 0.8, cy - 3.6],
    sad: [cy - 3.6, cy - 1],
    half: [cy - 0.2, cy - 0.5],
    squint: [cy - 1.5, cy - 1.9],
    droopy: [cy + 0.6, cy + 0.2],
  };
  const [yi, yo] = cut[lid];
  const inner = X(-7);
  const outer = X(7);
  const below = `M${inner} ${yi} L${outer} ${yo} L${outer} ${cy + 10} L${inner} ${cy + 10}Z`;
  const at = (ax: number) => yi + ((yo - yi) * (ax - inner)) / (outer - inner);
  const pupilY = lid === 'half' || lid === 'droopy' ? cy + 1.3 : lid === 'squint' ? cy + 0.6 : cy - 0.1;
  const px = cx - dir * 0.25 + look * 1.7;
  const irisR = big ? 1.75 : 2.15;
  return (
    <g>
      <defs>
        <clipPath id={`${cid}e`}>
          <path d={shape} />
        </clipPath>
        <clipPath id={`${cid}l`}>
          <path d={below} />
        </clipPath>
      </defs>
      {/* brow-ridge shadow */}
      <path d={`M${X(-4.8)} ${cy - 3.3} Q${cx} ${cy - 5.6} ${X(5)} ${cy - 3.1}`} stroke={x.skinDark} strokeWidth="1.5" fill="none" opacity=".35" strokeLinecap="round" />
      <path d={`M${X(-3.9)} ${cy - h - 0.9} Q${cx} ${cy - h - 2.4} ${X(4.1)} ${cy - h - 0.7}`} stroke={x.skinDark} strokeWidth=".6" fill="none" opacity=".7" />
      <g clipPath={`url(#${cid}l)`}>
        <g clipPath={`url(#${cid}e)`}>
          <rect x={cx - 7} y={cy - 7} width="14" height="14" fill="#fbf8f4" />
          <path d={`M${cx - 7} ${cy - 7} H${cx + 7} V${cy - h * 0.25} Q${cx} ${cy - h * 0.7} ${cx - 7} ${cy - h * 0.2}Z`} fill={INK} opacity=".18" />
          <circle cx={px} cy={pupilY} r={irisR} fill={x.eye[1]} />
          <circle cx={px} cy={pupilY} r={irisR} fill="none" stroke={x.eye[2]} strokeWidth=".55" />
          <circle cx={px} cy={pupilY} r={irisR * 0.48} fill={INK} />
          <circle cx={px + 0.75} cy={pupilY - 0.75} r=".58" fill="#fff" />
        </g>
        {/* bold upper lid with an outer flick, light lower lid */}
        <path
          d={`M${X(-w - 0.1)} ${cy + 0.5} Q${X(-w * 0.45)} ${cy - h - 0.35} ${X(w * 0.12)} ${cy - h - 0.3} Q${X(w * 0.8)} ${cy - h * 0.92} ${X(w + 1.1)} ${cy - 1.3}`}
          stroke={INK}
          strokeWidth="1.35"
          fill="none"
          strokeLinecap="round"
        />
        <path d={`M${X(-w * 0.75)} ${cy + h * 0.66} Q${X(0)} ${cy + h * 0.95} ${X(w * 0.85)} ${cy + h * 0.35}`} stroke={INK} strokeWidth=".5" fill="none" opacity=".55" strokeLinecap="round" />
      </g>
      {lid !== 'none' && (
        <g clipPath={`url(#${cid}e)`}>
          <path d={`M${X(-w - 1)} ${at(X(-w - 1))} L${X(w + 1)} ${at(X(w + 1))}`} stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

function Eye({ cx, kind, x, lid }: { cx: number; kind: EyeKind; x: Ctx; lid: Lid }) {
  const cy = EYE_Y;
  const dir = cx < 50 ? -1 : 1;
  const X = (dx: number) => cx + dx * dir;
  const big = (el: ReactNode) => <g transform={`translate(${cx} ${cy}) scale(1.15) translate(${-cx} ${-cy})`}>{el}</g>;
  switch (kind) {
    case 'side':
      return <ComicEye cx={cx} cy={cy} x={x} dir={dir} lid={lid === 'none' ? 'squint' : lid} look={1} />;
    case 'round':
      return <ComicEye cx={cx} cy={cy} x={x} dir={dir} big />;
    case 'half':
      return <ComicEye cx={cx} cy={cy} x={x} dir={dir} lid={lid === 'none' ? 'half' : lid} />;
    case 'squint':
      return <ComicEye cx={cx} cy={cy} x={x} dir={dir} lid={lid === 'none' ? 'squint' : lid} />;
    case 'droopy':
      return <ComicEye cx={cx} cy={cy} x={x} dir={dir} lid="droopy" />;
    case 'happy':
      // laughing eyes: an upward arc with a lash flick and the cheek pushed up
      return (
        <g>
          <path d={`M${X(-4.4)} ${cy + 1.2} Q${cx} ${cy - 3.6} ${X(4.6)} ${cy + 0.6} l${0.9 * dir} -.6`} stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${X(-3.2)} ${cy + 3} Q${cx} ${cy + 2} ${X(3.4)} ${cy + 2.8}`} stroke={x.skinDark} strokeWidth=".7" fill="none" opacity=".7" strokeLinecap="round" />
        </g>
      );
    case 'closed':
      return (
        <g>
          <path d={`M${X(-4.3)} ${cy} Q${cx} ${cy + 2.6} ${X(4.5)} ${cy - 0.3} l${0.8 * dir} -.5`} stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          {[-1.8, 0, 1.8].map((d) => (
            <path key={d} d={`M${X(d)} ${cy + 1.85 - Math.abs(d) * 0.2} l${0.3 * dir} .9`} stroke={INK} strokeWidth=".5" strokeLinecap="round" />
          ))}
          <path d={`M${X(-3.9)} ${cy - 2.6} Q${cx} ${cy - 4.2} ${X(4.1)} ${cy - 2.4}`} stroke={x.skinDark} strokeWidth=".6" fill="none" opacity=".7" />
        </g>
      );
    case 'cosmic':
      return big(
        <g>
          <path d={almond(cx, cy, dir)} fill="#2e1065" stroke={INK} strokeWidth="1" />
          <circle cx={cx - 0.6} cy={cy + 0.6} r=".8" fill="#22d3ee" />
          <path d={star(cx + 0.6, cy - 0.5, 1.8, 0.5, 4)} fill="#fff" />
          <circle cx={cx + 2.2} cy={cy + 0.8} r=".4" fill="#f0abfc" />
        </g>,
      );
    case 'x':
      return big(<path d={`M${cx - 2.3} ${cy - 2.3} L${cx + 2.3} ${cy + 2.3} M${cx + 2.3} ${cy - 2.3} L${cx - 2.3} ${cy + 2.3}`} stroke={INK} strokeWidth="1.4" strokeLinecap="round" />);
    case 'sparkle':
      return (
        <g>
          <ComicEye cx={cx} cy={cy} x={x} dir={dir} big />
          <path d={star(cx - dir * 0.25 + 1.2, cy - 1.2, 1.7, 0.5, 4)} fill="#fff" />
          <circle cx={cx - dir * 0.25 - 1} cy={cy + 1.3} r=".5" fill="#fff" />
        </g>
      );
    case 'puppy':
      return (
        <g>
          <ComicEye cx={cx} cy={cy} x={x} dir={dir} lid="sad" big />
          <circle cx={cx - dir * 0.25 + 0.9} cy={cy - 0.4} r=".8" fill="#fff" />
          <path d={`M${X(-3.4)} ${cy + 4.6} Q${cx} ${cy + 5.8} ${X(3.6)} ${cy + 4.4}`} stroke="#7dd3fc" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'star':
      return big(<path d={star(cx, cy, 3.9, 1.6)} fill="#facc15" stroke={INK} strokeWidth=".8" strokeLinejoin="round" />);
    case 'heart':
      return big(<path d={heart(cx, cy, 3)} fill="#f43f5e" stroke={INK} strokeWidth=".8" />);
    case 'dizzy':
      return (
        <g>
          <path d={almond(cx, cy, dir)} fill="#fbf8f4" stroke={INK} strokeWidth="1.1" />
          <path d={`M${cx} ${cy} m-.5 0 a.5 .5 0 1 1 1 0 a1.2 1.2 0 1 1 -2.4 0 a1.9 1.9 0 1 1 3.8 0`} stroke={INK} strokeWidth=".8" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'robot':
      return big(
        <g>
          <rect x={cx - 3.2} y={cy - 1.8} width="6.4" height="3.6" rx="1" fill="#0f172a" stroke={INK} strokeWidth=".6" />
          <rect x={cx - 2.4} y={cy - 1.1} width="4.8" height="2.2" rx=".6" fill="#22d3ee" />
        </g>,
      );
    case 'fire':
      return (
        <g>
          <ComicEye cx={cx} cy={cy} x={x} dir={dir} lid="angry" />
          <circle cx={cx - dir * 0.25} cy={cy - 0.1} r="2.15" fill="#f97316" />
          <circle cx={cx - dir * 0.25} cy={cy - 0.1} r="1" fill="#fde047" />
        </g>
      );
    default:
      return <ComicEye cx={cx} cy={cy} x={x} dir={dir} lid={lid} />;
  }
}

type BrowKind = 'normal' | 'raised' | 'angry' | 'sad' | 'flat' | 'one' | 'worried' | 'none';
/** Left brow as [inner, middle, outer]; the right one is mirrored. */
const BROW_PTS: Record<Exclude<BrowKind, 'none' | 'one'>, [[number, number], [number, number], [number, number]]> = {
  normal: [[46.6, 39.3], [42.6, 37.8], [38.2, 39.2]],
  raised: [[46.4, 37.6], [42.4, 35.4], [38.2, 37.2]],
  angry: [[46.8, 41.3], [42.8, 39.5], [38.4, 38]],
  sad: [[46.4, 38], [42.6, 38.9], [38.6, 40.8]],
  flat: [[46.6, 40.1], [42.6, 39.7], [38.4, 40]],
  worried: [[46.4, 37.6], [42.6, 38.2], [38.6, 39.8]],
};

function browPath(pts: [[number, number], [number, number], [number, number]], mirror: boolean, thick: number): string {
  const m = ([px, py]: [number, number]): [number, number] => (mirror ? [100 - px, py] : [px, py]);
  const [a, b, c] = pts.map(m);
  // bold at the inner end, tapering to a point at the outer end
  return `M${a[0]} ${a[1] - thick * 0.55} Q${b[0]} ${b[1] - thick * 0.7} ${c[0]} ${c[1]} Q${b[0]} ${b[1] + thick * 0.35} ${a[0]} ${a[1] + thick * 0.5}Z`;
}

/** Bold, tapered inked brows: the strongest part of a comic face. */
function Brows({ kind, x }: { kind: BrowKind; x: Ctx }) {
  if (kind === 'none') return null;
  const fill = mix(x.hairDark, INK, 0.55);
  const thick = kind === 'angry' ? 2.3 : 1.9;
  const left = kind === 'one' ? BROW_PTS.flat : BROW_PTS[kind];
  const right = kind === 'one' ? ([[46.4, 37.2], [42.4, 34.6], [38.2, 36.4]] as [[number, number], [number, number], [number, number]]) : BROW_PTS[kind];
  return (
    <g fill={fill} stroke={INK} strokeWidth=".35" strokeLinejoin="round">
      <path d={browPath(left, false, thick)} />
      <path d={browPath(right, true, thick)} />
    </g>
  );
}

function lidFor(brows: BrowKind): Lid {
  if (brows === 'angry') return 'angry';
  if (brows === 'sad') return 'sad';
  return 'none';
}

/** Lips along a line from l through m to r: an inked parting line, a shaded lower lip and corners. */
function Lips({ l, m, r, x, lower = 1 }: { l: [number, number]; m: [number, number]; r: [number, number]; x: Ctx; lower?: number }) {
  const midY = (l[1] + r[1]) / 4 + m[1] / 2;
  return (
    <g>
      <path d={`M${l[0] + 1} ${l[1] + 0.3} Q${m[0]} ${midY + 2.6 * lower} ${r[0] - 1} ${r[1] + 0.3} Q${m[0]} ${midY + 0.6} ${l[0] + 1} ${l[1] + 0.3}Z`} fill={x.lip} opacity=".55" />
      <path d={`M${m[0] - 1.8} ${midY + 2.6 * lower} Q${m[0]} ${midY + 3.1 * lower} ${m[0] + 1.8} ${midY + 2.6 * lower}`} stroke={x.skinDark} strokeWidth=".7" fill="none" strokeLinecap="round" />
      <path d={`M${l[0]} ${l[1]} Q${m[0]} ${m[1]} ${r[0]} ${r[1]}`} stroke={INK} strokeWidth="1.15" fill="none" strokeLinecap="round" />
      <path d={`M${l[0] - 0.2} ${l[1] - 0.6} l.3 1.1 M${r[0] + 0.2} ${r[1] - 0.6} l-.3 1.1`} stroke={INK} strokeWidth=".6" strokeLinecap="round" opacity=".7" />
    </g>
  );
}

/** An open mouth: dark inside, top teeth, tongue, inked outline and a shaded lower lip. */
function OpenMouth({ w, h, T = 52, teeth = true, tongue = true, x }: { w: number; h: number; T?: number; teeth?: boolean; tongue?: boolean; x: Ctx }) {
  const L = 50 - w;
  const R = 50 + w;
  const id = `${x.id}m`;
  const shape = `M${L} ${T} Q50 ${T + 1.2} ${R} ${T} Q${R - 0.5} ${T + h} 50 ${T + h + 0.3} Q${L + 0.5} ${T + h} ${L} ${T}Z`;
  return (
    <g>
      <defs>
        <clipPath id={`${id}c`}>
          <path d={shape} />
        </clipPath>
      </defs>
      <path d={shape} fill={MOUTH_IN} />
      <g clipPath={`url(#${id}c)`}>
        {tongue && <ellipse cx="50" cy={T + h + 0.4} rx={w * 0.6} ry={h * 0.42} fill={TONGUE} />}
        {teeth && <path d={`M${L} ${T - 1} H${R} V${T + 1.7} Q50 ${T + 2.7} ${L} ${T + 1.7}Z`} fill="#f8f5ef" />}
        {teeth && <path d={`M${L + w * 0.55} ${T + 0.6} V${T + 2.2} M${R - w * 0.55} ${T + 0.6} V${T + 2.2}`} stroke="#cfc6b8" strokeWidth=".35" />}
      </g>
      <path d={shape} fill="none" stroke={INK} strokeWidth="1.05" strokeLinejoin="round" />
      <path d={`M${50 - w * 0.45} ${T + h + 1.6} Q50 ${T + h + 2.3} ${50 + w * 0.45} ${T + h + 1.6}`} stroke={x.skinDark} strokeWidth=".8" fill="none" strokeLinecap="round" />
    </g>
  );
}

type MouthKind = 'smile' | 'grin' | 'soft' | 'sad' | 'frown' | 'o' | 'smirk' | 'laugh' | 'cat' | 'robot' | 'grit' | 'small' | 'flat' | 'buck' | 'pout' | 'tongue' | 'wavy' | 'yawn' | 'side' | 'smug';
function Mouth({ kind, x }: { kind: MouthKind; x: Ctx }) {
  const line = { stroke: INK, strokeWidth: 1.15, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'grin':
      return <OpenMouth w={5.4} h={4.4} tongue={false} x={x} />;
    case 'laugh':
      return <OpenMouth w={5.8} h={6.8} T={51.6} x={x} />;
    case 'soft':
      return <Lips l={[46.8, 53.2]} m={[50, 55]} r={[53.2, 53.2]} x={x} lower={0.8} />;
    case 'sad':
      return <Lips l={[46, 55.2]} m={[50, 52.6]} r={[54, 55.2]} x={x} lower={0.7} />;
    case 'frown':
      return (
        <g>
          <Lips l={[45.4, 55.4]} m={[50, 52.2]} r={[54.6, 55.4]} x={x} lower={0.7} />
          <path d="M47.5 58.6 Q50 59.6 52.5 58.6" stroke={x.skinDark} strokeWidth=".8" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'o':
      return (
        <g>
          <ellipse cx="50" cy="55" rx="2.2" ry="2.8" fill={MOUTH_IN} stroke={INK} strokeWidth="1" />
          <path d="M48.4 58.8 Q50 59.4 51.6 58.8" stroke={x.skinDark} strokeWidth=".7" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'yawn':
      return <OpenMouth w={3} h={5} T={52.6} teeth={false} x={x} />;
    case 'smirk':
      return (
        <g>
          <Lips l={[45.8, 54.2]} m={[50.6, 55.6]} r={[54.8, 52.4]} x={x} lower={0.7} />
          <path d="M55.4 51.6 q.9 .8 .5 1.9" stroke={INK} strokeWidth=".7" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'smug':
      // closed, satisfied little smile pushed to one side
      return <Lips l={[47, 54.4]} m={[51, 55.2]} r={[54.4, 53]} x={x} lower={0.6} />;
    case 'side':
      // mouth pressed and pulled to one side
      return <path d="M49 54.6 Q51.6 54 54 53.2" {...line} />;
    case 'cat':
      return <path d="M45.6 53 q2.2 2.4 4.4 0 q2.2 2.4 4.4 0" {...line} />;
    case 'wavy':
      return <path d="M45.4 54.6 q1.15 -1.2 2.3 0 t2.3 0 t2.3 0 t2.3 0" {...line} />;
    case 'robot':
      return (
        <g>
          <rect x="44.5" y="52" width="11" height="3" rx="1" fill="#0f172a" stroke={INK} strokeWidth=".6" />
          {[46.5, 49, 51.5, 54].map((mx) => (
            <rect key={mx} x={mx - 0.6} y="52.6" width="1.2" height="1.8" fill="#22d3ee" />
          ))}
        </g>
      );
    case 'grit':
      return (
        <g>
          <rect x="44.2" y="51.8" width="11.6" height="4.6" rx="2" fill="#f8f5ef" stroke={INK} strokeWidth="1.05" />
          <path d="M44.6 54.1 H55.4 M47 52 V56.2 M50 51.8 V56.4 M53 52 V56.2" stroke={INK} strokeWidth=".5" />
          <path d="M47 58.6 Q50 59.5 53 58.6" stroke={x.skinDark} strokeWidth=".8" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'small':
      return <Lips l={[48, 54]} m={[50, 54.7]} r={[52, 54]} x={x} lower={0.5} />;
    case 'flat':
      return <Lips l={[46.2, 54.2]} m={[50, 54.3]} r={[53.8, 54.2]} x={x} lower={0.6} />;
    case 'buck':
      return (
        <g>
          <path d="M44.8 52.4 Q50 57.2 55.2 52.4" {...line} />
          <path d="M48 53.9 V56 H52 V53.9" fill="#f8f5ef" stroke={INK} strokeWidth=".8" strokeLinejoin="round" />
          <path d="M50 54.4 V56" stroke={INK} strokeWidth=".5" />
        </g>
      );
    case 'pout':
      return (
        <g>
          <ellipse cx="50" cy="54.6" rx="2" ry="1.4" fill={x.lip} stroke={INK} strokeWidth=".8" />
          <path d="M48.6 54.4 H51.4" stroke={INK} strokeWidth=".6" />
        </g>
      );
    case 'tongue':
      return (
        <g>
          <path d="M51 54.2 Q51.2 59 54 59 Q56.6 58.8 56 54" fill={TONGUE} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
          <path d="M53.6 55.2 V57.2" stroke={shade(TONGUE, -0.25)} strokeWidth=".6" strokeLinecap="round" />
          <path d="M44.6 52.8 Q50.5 57 56.4 52.4" {...line} />
        </g>
      );
    default:
      return <Lips l={[45.2, 52.8]} m={[50, 56.4]} r={[54.8, 52.8]} x={x} />;
  }
}

interface ExpressionSpec {
  eyes: [EyeKind, EyeKind];
  brows: BrowKind;
  mouth: MouthKind;
  blush?: boolean;
  tear?: boolean;
  whiskers?: boolean;
  zzz?: boolean;
  sweat?: boolean;
  tears2?: boolean;
  /** Little motion lines by the head (surprise). */
  pop?: boolean;
  /** The comic "angry vein" mark on the forehead. */
  vein?: boolean;
  /** Sparkles around the face. */
  bling?: boolean;
  /** A sweat drop on the side of the head (awkward / deadpan). */
  drop?: boolean;
}

/** Every expression differs from every other in at least two of: eyes, brows, mouth, extras. */
const EXPRESSIONS: Record<string, ExpressionSpec> = {
  happy: { eyes: ['open', 'open'], brows: 'normal', mouth: 'smile' },
  grin: { eyes: ['squint', 'squint'], brows: 'raised', mouth: 'grin' },
  calm: { eyes: ['closed', 'closed'], brows: 'flat', mouth: 'soft' },
  sad: { eyes: ['open', 'open'], brows: 'sad', mouth: 'sad', tear: true },
  angry: { eyes: ['open', 'open'], brows: 'angry', mouth: 'frown', vein: true },
  surprised: { eyes: ['round', 'round'], brows: 'raised', mouth: 'o', pop: true },
  sleepy: { eyes: ['droopy', 'droopy'], brows: 'worried', mouth: 'yawn', zzz: true },
  wink: { eyes: ['open', 'happy'], brows: 'normal', mouth: 'smile', blush: true },
  laugh: { eyes: ['happy', 'happy'], brows: 'raised', mouth: 'laugh', blush: true },
  smirk: { eyes: ['open', 'squint'], brows: 'one', mouth: 'smirk' },
  determined: { eyes: ['squint', 'squint'], brows: 'angry', mouth: 'grit', sweat: true },
  starstruck: { eyes: ['star', 'star'], brows: 'raised', mouth: 'grin', blush: true },
  love: { eyes: ['heart', 'heart'], brows: 'raised', mouth: 'smile', blush: true },
  dizzy: { eyes: ['dizzy', 'dizzy'], brows: 'worried', mouth: 'wavy' },
  cat: { eyes: ['happy', 'happy'], brows: 'normal', mouth: 'cat', blush: true, whiskers: true },
  robot: { eyes: ['robot', 'robot'], brows: 'none', mouth: 'robot' },
  fire: { eyes: ['fire', 'fire'], brows: 'angry', mouth: 'smirk' },
  sigma: { eyes: ['half', 'half'], brows: 'flat', mouth: 'smug' },
  sideeye: { eyes: ['side', 'side'], brows: 'one', mouth: 'side' },
  rizz: { eyes: ['squint', 'happy'], brows: 'raised', mouth: 'smirk', blush: true, bling: true },
  bruh: { eyes: ['half', 'half'], brows: 'raised', mouth: 'flat', drop: true },
  unbothered: { eyes: ['closed', 'closed'], brows: 'raised', mouth: 'smug' },
  nerd: { eyes: ['round', 'round'], brows: 'normal', mouth: 'buck', blush: true },
  crylaugh: { eyes: ['happy', 'happy'], brows: 'worried', mouth: 'laugh', tear: true, tears2: true },
  pleading: { eyes: ['puppy', 'puppy'], brows: 'worried', mouth: 'pout', blush: true },
  dead: { eyes: ['x', 'x'], brows: 'flat', mouth: 'tongue' },
  maincharacter: { eyes: ['open', 'open'], brows: 'one', mouth: 'grin', bling: true },
  cosmic: { eyes: ['cosmic', 'cosmic'], brows: 'normal', mouth: 'soft' },
  silly: { eyes: ['happy', 'open'], brows: 'raised', mouth: 'tongue', blush: true },
  sparkle: { eyes: ['sparkle', 'sparkle'], brows: 'normal', mouth: 'soft', bling: true },
};

/** Maps today's mood check-in (1–5) to an expression for the "Match my mood" face. */
const MOOD_FACE: Record<number, string> = { 1: 'sad', 2: 'sleepy', 3: 'calm', 4: 'happy', 5: 'laugh' };


function Face({ x, style, mood }: { x: Ctx; style: string; mood?: number }) {
  const key = style === 'mood' ? (mood ? MOOD_FACE[mood] : 'happy') : style;
  const e = EXPRESSIONS[key] ?? EXPRESSIONS.happy;
  const lid = lidFor(e.brows);
  return (
    <g>
      {e.blush && (
        <>
          <ellipse cx="37.5" cy="51.4" rx="3" ry="1.5" fill="#ff5a78" opacity=".24" />
          <ellipse cx="62.5" cy="51.4" rx="3" ry="1.5" fill="#ff5a78" opacity=".24" />
          <path d="M36 51 l.8 -.6 M37.6 51.2 l.8 -.6 M62 51 l.8 -.6 M63.6 51.2 l.8 -.6" stroke="#e11d48" strokeWidth=".45" opacity=".6" strokeLinecap="round" />
        </>
      )}
      <Eye cx={EYE_L} kind={e.eyes[0]} x={x} lid={lid} />
      <Eye cx={EYE_R} kind={e.eyes[1]} x={x} lid={lid} />
      <Brows kind={e.brows} x={x} />
      {e.mouth !== 'robot' && (
        // nose: bridge line on the shadow side, the tip, nostrils and the shadow under it
        <g>
          <path d="M51.6 44.4 Q52.8 47.6 52.6 49.6" stroke={x.skinDark} strokeWidth=".8" fill="none" strokeLinecap="round" />
          <path d="M48 50.6 Q50 52.4 52.4 50.4" fill={x.skinDark} opacity=".45" />
          <path d="M47.6 50.2 Q47.9 51.4 49.2 51.3 M52.6 50.2 Q52.3 51.4 51 51.3" stroke={INK} strokeWidth=".7" fill="none" strokeLinecap="round" />
          <path d="M49.4 51.5 Q50.1 51.9 50.8 51.5" stroke={INK} strokeWidth=".55" fill="none" strokeLinecap="round" />
        </g>
      )}
      <Mouth kind={e.mouth} x={x} />
      {e.tear && <path d="M38.6 48.4 q-1.4 2.4 0 3.4 q1.4 -1 0 -3.4Z M38.6 52.6 q-.8 1.6 0 2.2 q.8 -.6 0 -2.2Z" fill="#7dd3fc" stroke={INK} strokeWidth=".45" />}
      {e.tears2 && <path d="M61.4 48.4 q-1.4 2.4 0 3.4 q1.4 -1 0 -3.4Z M61.4 52.6 q-.8 1.6 0 2.2 q.8 -.6 0 -2.2Z" fill="#7dd3fc" stroke={INK} strokeWidth=".45" />}
      {e.sweat && <path d="M66.5 35 q-1.7 2.8 0 4 q1.7 -1.2 0 -4Z" fill="#7dd3fc" stroke={INK} strokeWidth=".5" />}
      {e.drop && <path d="M68 38 q-2.2 3.6 0 5.2 q2.2 -1.6 0 -5.2Z" fill="#bae6fd" stroke={INK} strokeWidth=".55" />}
      {e.pop && <path d="M30 31 l-2.6 -2.2 M28.4 35.6 l-3.2 -.8 M32.6 27.6 l-1.2 -3" stroke={INK} strokeWidth="1" strokeLinecap="round" />}
      {e.vein && <path d="M61.4 31.4 q1.6 1.6 0 3.2 M63.2 30.6 q-1.6 1.6 0 3.2 M60.6 33.4 q1.6 -1.6 3.2 0 M61.4 35.2 q1.6 -1.6 3.2 0" stroke="#dc2626" strokeWidth=".9" fill="none" strokeLinecap="round" />}
      {e.bling && (
        <g fill="#fde047" stroke={INK} strokeWidth=".4">
          <path d={star(30, 34, 2.4, 0.7, 4)} />
          <path d={star(70.5, 31, 1.8, 0.5, 4)} />
          <path d={star(68, 56, 1.4, 0.4, 4)} />
        </g>
      )}
      {e.whiskers && <path d="M33 51 l-5 -1 M33 53 l-5 1 M67 51 l5 -1 M67 53 l5 1" stroke={INK} strokeWidth=".7" strokeLinecap="round" />}
      {e.zzz && (
        <text x="66" y="27" fontSize="8.5" fontWeight="900" fill="#e2e8f0" stroke={INK} strokeWidth=".5" fontFamily="system-ui, sans-serif">
          z<tspan fontSize="5" dy="-3">z</tspan>
        </text>
      )}
    </g>
  );
}

/* ---------- eyewear ---------- */
function Eyewear({ item, x }: { item: AvatarItem; x: Ctx }) {
  const g = `${x.id}eye`;
  switch (item.style) {
    case 'oval':
      // tiny tinted Y2K shades
      return (
        <g>
          <ellipse cx="42" cy="46" rx="5.4" ry="3.4" fill={item.c1 ?? '#f472b6'} fillOpacity=".72" stroke="#cbd5e1" strokeWidth=".9" />
          <ellipse cx="58" cy="46" rx="5.4" ry="3.4" fill={item.c1 ?? '#f472b6'} fillOpacity=".72" stroke="#cbd5e1" strokeWidth=".9" />
          <path d="M47.4 45.6 Q50 44.6 52.6 45.6 M36.6 45.5 L30 44 M63.4 45.5 L70 44" stroke="#cbd5e1" strokeWidth=".9" fill="none" />
          <path d="M39.5 45 q1.5 -1.2 3.2 -1.3 M55.5 45 q1.5 -1.2 3.2 -1.3" stroke="#fff" strokeWidth=".8" strokeLinecap="round" opacity=".85" />
        </g>
      );
    case 'wrap':
      // chrome wraparound shield
      return (
        <g>
          <defs>
            <linearGradient id={`${g}w`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e0f2fe" />
              <stop offset=".35" stopColor="#818cf8" />
              <stop offset=".65" stopColor="#f0abfc" />
              <stop offset="1" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <path d="M30 42 Q50 37.5 70 42 L68.5 47.5 Q60 51.5 52 48.5 Q50 47.6 48 48.5 Q40 51.5 31.5 47.5Z" fill={`url(#${g}w)`} stroke="#1b1512" strokeWidth=".9" strokeLinejoin="round" />
          <path d="M34 43 Q42 40.6 48 41.2" stroke="#fff" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity=".9" />
        </g>
      );
    case 'round':
      return (
        <g stroke={item.c1 ?? '#1f2937'} strokeWidth="1.5" fill="#fff" fillOpacity=".12">
          <circle cx="42.5" cy="45" r="5.6" />
          <circle cx="57.5" cy="45" r="5.6" />
          <path d="M48.1 44.6 Q50 43.4 51.9 44.6 M36.9 44.5 L30 43 M63.1 44.5 L70 43" fill="none" />
        </g>
      );
    case 'shades':
      return (
        <g>
          <defs>
            <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#334155" />
              <stop offset="1" stopColor="#020617" />
            </linearGradient>
          </defs>
          <path d="M35 41.5 H48 Q48.5 50.5 42 50.8 Q35.5 50.5 35 41.5Z M52 41.5 H65 Q64.5 50.5 58 50.8 Q51.5 50.5 52 41.5Z" fill={`url(#${g})`} stroke="#d4af37" strokeWidth=".8" />
          <path d="M48 42.4 H52 M35 42 L30 41 M65 42 L70 41" stroke="#d4af37" strokeWidth="1" />
          <path d="M37.5 43.5 l3 3 M54.5 43.5 l3 3" stroke="#fff" strokeOpacity=".5" strokeWidth=".9" strokeLinecap="round" />
        </g>
      );
    case 'pixel':
      return (
        <g fill="#0a0a0a">
          <rect x="33" y="41" width="34" height="2.5" />
          {[34, 37, 40, 43, 53, 56, 59, 62].map((px, i) => (
            <rect key={px} x={px} y="43.5" width="3" height={i % 4 === 3 ? 2.5 : 5} />
          ))}
          <rect x="35" y="43.5" width="2.5" height="2.5" fill="#fff" opacity=".85" />
          <rect x="54" y="43.5" width="2.5" height="2.5" fill="#fff" opacity=".85" />
        </g>
      );
    case 'stars':
      return (
        <g>
          <path d={star(42.5, 45, 7, 3.4)} fill="#f472b6" fillOpacity=".75" stroke="#facc15" strokeWidth="1" strokeLinejoin="round" />
          <path d={star(57.5, 45, 7, 3.4)} fill="#f472b6" fillOpacity=".75" stroke="#facc15" strokeWidth="1" strokeLinejoin="round" />
          <path d="M48.6 44 H51.4" stroke="#facc15" strokeWidth="1.2" />
        </g>
      );
    case 'monocle':
      return (
        <g fill="none">
          <circle cx="57.5" cy="45" r="5.4" stroke="#d4af37" strokeWidth="1.6" fill="#fff" fillOpacity=".12" />
          <path d="M61.5 49 Q66 58 63 66" stroke="#d4af37" strokeWidth=".8" strokeDasharray="1.2 1" />
        </g>
      );
    case 'visor':
      return (
        <g>
          <defs>
            <linearGradient id={g} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#22d3ee" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path d="M31 40.5 H69 Q72 45 69 49.5 H31 Q28 45 31 40.5Z" fill={`url(#${g})`} opacity=".92" />
          <path d="M33 44.8 H67" stroke="#fff" strokeWidth=".9" opacity=".9" />
          <path d="M31 40.5 H69 Q72 45 69 49.5 H31 Q28 45 31 40.5Z" fill="none" stroke="#0f172a" strokeWidth=".8" />
        </g>
      );
    case 'nerd':
      return (
        <g fill="#fff" fillOpacity=".1" stroke="#111827" strokeWidth="2.2" strokeLinejoin="round">
          <rect x="36" y="41" width="12.5" height="8.5" rx="2" />
          <rect x="51.5" y="41" width="12.5" height="8.5" rx="2" />
          <path d="M48.5 44 H51.5 M36 43 L30 42 M64 43 L70 42" fill="none" />
        </g>
      );
    case '3d':
      return (
        <g>
          <rect x="34.5" y="40.5" width="31" height="9.5" rx="1.5" fill="#f8fafc" />
          <rect x="36.5" y="42" width="11.5" height="6.5" rx="1" fill="#ef4444" opacity=".85" />
          <rect x="52" y="42" width="11.5" height="6.5" rx="1" fill="#06b6d4" opacity=".85" />
          <path d="M34.5 43 L30 42 M65.5 43 L70 42" stroke="#f8fafc" strokeWidth="1.4" />
        </g>
      );
    case 'goggles':
      return (
        <g>
          <defs>
            <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fde047" />
              <stop offset=".5" stopColor="#f97316" />
              <stop offset="1" stopColor="#db2777" />
            </linearGradient>
          </defs>
          <path d="M27 42 Q50 38 73 42 L73 46 Q50 42 27 46Z" fill="#111827" />
          <rect x="33" y="38.5" width="34" height="13" rx="6.5" fill="#1f2937" />
          <rect x="35" y="40.5" width="30" height="9" rx="4.5" fill={`url(#${g})`} />
          <path d="M38 43 Q44 41 50 42" stroke="#fff" strokeOpacity=".6" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'hearts':
      return (
        <g>
          <path d={heart(42.5, 45, 4)} fill="#f43f5e" fillOpacity=".8" stroke="#be123c" strokeWidth=".9" />
          <path d={heart(57.5, 45, 4)} fill="#f43f5e" fillOpacity=".8" stroke="#be123c" strokeWidth=".9" />
          <path d="M48.3 44 H51.7 M36.5 43 L30 42 M63.5 43 L70 42" stroke="#be123c" strokeWidth="1" />
        </g>
      );
    case 'patch':
      return (
        <g>
          <path d="M29 37 L71 51" stroke="#111827" strokeWidth="1.3" />
          <ellipse cx="57.5" cy="45.5" rx="5.2" ry="4.6" fill="#111827" />
        </g>
      );
    default:
      return null;
  }
}

/* ---------- headwear ---------- */
function Headwear({ item, x }: { item: AvatarItem; x: Ctx }) {
  const c1 = item.c1 ?? '#2563eb';
  const c2 = item.c2 ?? shade(c1, -0.3);
  const g = `${x.id}hw`;
  switch (item.style) {
    case 'headband':
      return (
        <g>
          <path d="M28.7 35 Q50 27.5 71.3 35 L71.6 40 Q50 32.5 28.4 40 Z" fill={c1} />
          <path d="M28.7 35 Q50 27.5 71.3 35" stroke="#fff" strokeOpacity=".5" strokeWidth=".8" fill="none" />
        </g>
      );
    case 'trucker':
      // foam-front trucker cap with mesh back and a star patch
      return (
        <g>
          <path d="M28 37 C28 22 38 15.5 50 15.5 C62 15.5 72 22 72 37 Z" fill={c1} />
          <g stroke={c2} strokeWidth=".45" opacity=".8">
            {[30, 33, 36, 64, 67, 70].map((mx) => (
              <path key={mx} d={`M${mx} 24 V37`} />
            ))}
          </g>
          <path d="M36 37 C35.5 24 41 17 50 16.4 C59 17 64.5 24 64 37 Z" fill="#f8fafc" />
          <path d="M23 37.5 Q50 30.5 77 37.5 Q75 42.5 50 40.5 Q25 42.5 23 37.5Z" fill={c1} />
          <circle cx="50" cy="15.8" r="1.6" fill={c1} />
          <path d={star(50, 27.5, 5, 2.1, 5)} fill={c2} stroke="#1b1512" strokeWidth=".6" strokeLinejoin="round" />
        </g>
      );
    case 'bandana':
      return (
        <g>
          <path d="M27 37 C27 21 38 14.5 50 14.5 C62 14.5 73 21 73 37 C65 33 35 33 27 37Z" fill={c1} />
          <path d="M71 34 L79 31 L77 38 Z M71 35 L78 40 L72.5 42 Z" fill={c1} />
          <g fill="#fff" opacity=".9">
            {[[36, 26], [44, 21], [52, 19.5], [60, 22], [66, 28], [40, 32], [56, 29]].map(([cx, cy]) => (
              <g key={`${cx}${cy}`}>
                <circle cx={cx} cy={cy} r="1.1" />
                <circle cx={cx + 1.8} cy={cy + 1.6} r=".45" />
              </g>
            ))}
          </g>
        </g>
      );
    case 'butterflies':
      return (
        <g stroke="#1b1512" strokeWidth=".55">
          {([[33, 34, '#f472b6', -30], [39, 27, '#a78bfa', -15], [50, 23.5, '#38bdf8', 0], [61, 27, '#fde047', 15], [67, 34, '#4ade80', 30]] as const).map(([cx, cy, c, r]) => (
            <g key={cx} transform={`rotate(${r} ${cx} ${cy})`}>
              <path d={`M${cx} ${cy} C${cx - 4.5} ${cy - 5} ${cx - 5.5} ${cy + 1} ${cx} ${cy + 0.4}Z`} fill={c} />
              <path d={`M${cx} ${cy} C${cx + 4.5} ${cy - 5} ${cx + 5.5} ${cy + 1} ${cx} ${cy + 0.4}Z`} fill={c} />
              <path d={`M${cx} ${cy + 0.4} C${cx - 3} ${cy + 1} ${cx - 3} ${cy + 3.6} ${cx} ${cy + 1.4}Z M${cx} ${cy + 0.4} C${cx + 3} ${cy + 1} ${cx + 3} ${cy + 3.6} ${cx} ${cy + 1.4}Z`} fill={shade(c, 0.3)} />
            </g>
          ))}
        </g>
      );
    case 'sportvisor':
      return (
        <g>
          <path d="M28.5 35.5 Q50 28.5 71.5 35.5 L71.5 38.5 Q50 31.5 28.5 38.5 Z" fill={c1} />
          <path d="M24 38.5 Q50 31 76 38.5 Q74 44 50 42 Q26 44 24 38.5Z" fill={c2} />
          <path d="M30 40 Q50 35.4 70 40" stroke="#fff" strokeWidth=".9" fill="none" opacity=".7" />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d="M28 37 C28 22 38 15.5 50 15.5 C62 15.5 72 22 72 37 Z" fill={c1} />
          <path d="M50 15.5 V37" stroke={c2} strokeWidth=".8" />
          <path d="M23 37.5 Q50 30.5 77 37.5 Q75 42.5 50 40.5 Q25 42.5 23 37.5Z" fill={c2} />
          <circle cx="50" cy="15.8" r="1.6" fill={c2} />
          <circle cx="50" cy="28" r="3.2" fill="#fff" />
          <path d="M48.6 28 l1 1.1 l2 -2.2" stroke={c1} strokeWidth=".9" fill="none" />
        </g>
      );
    case 'beanie':
      return (
        <g>
          <path d="M27 38 C27 20 38 13.5 50 13.5 C62 13.5 73 20 73 38 Z" fill={c1} />
          <path d="M26 33 H74 V40 Q74 43 71 43 H29 Q26 43 26 40 Z" fill={c2} />
          {[31, 36, 41, 46, 51, 56, 61, 66].map((lx) => (
            <path key={lx} d={`M${lx + 1} 34 V42`} stroke={shade(c2, -0.25)} strokeWidth=".8" />
          ))}
          <circle cx="50" cy="12" r="5.5" fill="#f8fafc" />
          <circle cx="48.5" cy="10.5" r="1.6" fill="#fff" />
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path d="M26.5 45 C25 17 75 17 73.5 45" stroke={c1} strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="22" y="39" width="9" height="15" rx="4" fill={c1} />
          <rect x="69" y="39" width="9" height="15" rx="4" fill={c1} />
          <rect x="24.5" y="42" width="4" height="9" rx="2" fill={c2} />
          <rect x="71.5" y="42" width="4" height="9" rx="2" fill={c2} />
        </g>
      );
    case 'flowers':
      return (
        <g>
          <path d="M29 35 Q50 26 71 35" stroke="#16a34a" strokeWidth="2" fill="none" />
          {[
            [31, 34, '#f472b6'],
            [40, 29.5, '#fde047'],
            [50, 27.5, '#f9fafb'],
            [60, 29.5, '#fb7185'],
            [69, 34, '#c084fc'],
          ].map(([cx, cy, col]) => (
            <g key={`${cx}`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <circle
                  key={a}
                  cx={(cx as number) + 2.4 * Math.cos((a * Math.PI) / 180)}
                  cy={(cy as number) + 2.4 * Math.sin((a * Math.PI) / 180)}
                  r="2"
                  fill={col as string}
                />
              ))}
              <circle cx={cx as number} cy={cy as number} r="1.4" fill="#f59e0b" />
            </g>
          ))}
        </g>
      );
    case 'catears':
      return (
        <g>
          <path d="M30 30 L31 9 L45 21 Z M70 30 L69 9 L55 21 Z" fill={c1} />
          <path d="M33 25 L33.5 14 L41 20.5 Z M67 25 L66.5 14 L59 20.5 Z" fill="#f9a8d4" />
        </g>
      );
    case 'viking':
      return (
        <g>
          <path d="M31.5 29 C22 27 15 19 17 6 C21 15 27 19 34 21 Z M68.5 29 C78 27 85 19 83 6 C79 15 73 19 66 21 Z" fill="#fef3c7" stroke="#d6c08a" strokeWidth=".8" />
          <path d="M28.5 37 C28.5 21 38 15 50 15 C62 15 71.5 21 71.5 37 Z" fill="#94a3b8" />
          <path d="M27.5 34 H72.5 V39 H27.5 Z" fill="#92400e" />
          {[33, 41, 50, 59, 67].map((cx) => (
            <circle key={cx} cx={cx} cy="36.5" r="1" fill="#fbbf24" />
          ))}
          <path d="M50 15 V34" stroke="#64748b" strokeWidth="1.6" />
        </g>
      );
    case 'wizard':
      return (
        <g>
          <path d="M30 33 L57 -2 Q61 8 72 33 Z" fill={c1} />
          <ellipse cx="50" cy="33" rx="27" ry="5" fill={shade(c1, -0.25)} />
          <path d={star(56, 14, 3, 1.2)} fill={c2} />
          <path d={star(46, 24, 2, 0.8)} fill={c2} />
          <path d="M64 22 a3 3 0 1 0 2 4 a2.2 2.2 0 1 1 -2 -4" fill={c2} />
        </g>
      );
    case 'crown':
      return (
        <g>
          <defs>
            <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fde68a" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <path d="M33 27 L35 10 L43 19 L50 6 L57 19 L65 10 L67 27 Z" fill={`url(#${g})`} stroke="#b45309" strokeWidth=".8" strokeLinejoin="round" />
          <rect x="33" y="24.5" width="34" height="5.5" rx="1.5" fill="#f59e0b" stroke="#b45309" strokeWidth=".8" />
          <circle cx="41" cy="27.2" r="1.5" fill="#ef4444" />
          <circle cx="50" cy="27.2" r="1.8" fill="#3b82f6" />
          <circle cx="59" cy="27.2" r="1.5" fill="#22c55e" />
          {[35, 50, 65].map((cx, i) => (
            <circle key={cx} cx={cx} cy={i === 1 ? 6 : 10} r="1.5" fill="#fff7ed" />
          ))}
        </g>
      );
    case 'halo':
      return (
        <g>
          <ellipse cx="50" cy="11" rx="16" ry="4.2" fill="none" stroke="#fde68a" strokeWidth="5" opacity=".35" />
          <ellipse cx="50" cy="11" rx="16" ry="4.2" fill="none" stroke="#facc15" strokeWidth="2.4" />
        </g>
      );
    case 'party':
      return (
        <g>
          <path d="M40 26 L52 2 L62 25 Z" fill={c1} />
          <path d="M44 18 L58 15 M41.5 22.5 L60.5 20" stroke={c2} strokeWidth="2" />
          <circle cx="52" cy="2.5" r="3" fill={c2} />
          <path d="M40 26 Q51 29 62 25" stroke={shade(c1, -0.3)} strokeWidth="1.2" fill="none" />
        </g>
      );
    case 'bucket':
      return (
        <g>
          <path d="M32 31 C32 18 40 14 50 14 C60 14 68 18 68 31 Z" fill={c1} />
          <path d="M22 35 Q50 26 78 35 Q76 40 50 37.5 Q24 40 22 35Z" fill={c2} />
          <path d="M32 29 Q50 25 68 29" stroke={shade(c1, -0.25)} strokeWidth="1.6" fill="none" />
        </g>
      );
    case 'beret':
      return (
        <g>
          <ellipse cx="46" cy="25" rx="22" ry="9" fill={c1} transform="rotate(-8 46 25)" />
          <path d="M30 31 Q50 27 66 31" stroke={shade(c1, -0.3)} strokeWidth="2" fill="none" />
          <path d="M44 16 L45 12" stroke={shade(c1, -0.3)} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    case 'chefhat':
      return (
        <g>
          <circle cx="38" cy="15" r="8" fill="#f8fafc" />
          <circle cx="50" cy="10" r="9" fill="#f8fafc" />
          <circle cx="62" cy="15" r="8" fill="#f8fafc" />
          <rect x="33" y="15" width="34" height="16" rx="2" fill="#f8fafc" />
          <path d="M33 26 H67" stroke="#e2e8f0" strokeWidth="1" />
          <path d="M40 14 V25 M50 11 V25 M60 14 V25" stroke="#e2e8f0" strokeWidth=".8" />
        </g>
      );
    case 'cowboy':
      return (
        <g>
          <path d="M14 30 Q20 38 50 36 Q80 38 86 30 Q82 40 50 41 Q18 40 14 30Z" fill={c2} />
          <path d="M33 33 C31 22 36 12 42 14 Q50 18 58 14 C64 12 69 22 67 33 Q50 36 33 33Z" fill={c1} />
          <path d="M33.5 30 Q50 33 66.5 30 L67 33 Q50 36 33 33 Z" fill={shade(c2, -0.3)} />
          <path d="M50 17 V24" stroke={shade(c1, -0.3)} strokeWidth="1" />
        </g>
      );
    case 'tophat':
      return (
        <g>
          <path d="M24 31 Q50 25 76 31 Q74 35 50 33.5 Q26 35 24 31Z" fill={c1} />
          <rect x="35" y="4" width="30" height="27" rx="2" fill={c1} />
          <rect x="35" y="22" width="30" height="5" fill={c2} />
          <path d="M38 7 V20" stroke="#fff" strokeOpacity=".15" strokeWidth="2" />
        </g>
      );
    case 'propeller':
      return (
        <g>
          <path d="M29 37 C29 22 38 15.5 50 15.5 C62 15.5 71 22 71 37 Z" fill="#ef4444" />
          <path d="M50 15.5 C42 16 37 22 37 37 H50 Z" fill="#facc15" />
          <path d="M50 15.5 C58 16 63 22 63 37 H50 Z" fill="#3b82f6" opacity=".95" />
          <path d="M50 15.5 V8" stroke="#64748b" strokeWidth="1.4" />
          <ellipse cx="42" cy="8" rx="8" ry="2" fill="#22c55e" transform="rotate(-8 42 8)" />
          <ellipse cx="58" cy="8" rx="8" ry="2" fill="#a855f7" transform="rotate(8 58 8)" />
          <circle cx="50" cy="8" r="1.6" fill="#111827" />
        </g>
      );
    case 'bunny':
      return (
        <g>
          <ellipse cx="40" cy="10" rx="5" ry="14" fill={c1} transform="rotate(-12 40 10)" />
          <ellipse cx="60" cy="10" rx="5" ry="14" fill={c1} transform="rotate(12 60 10)" />
          <ellipse cx="40" cy="11" rx="2.4" ry="10" fill="#fbcfe8" transform="rotate(-12 40 11)" />
          <ellipse cx="60" cy="11" rx="2.4" ry="10" fill="#fbcfe8" transform="rotate(12 60 11)" />
          <path d="M30 30 Q50 22 70 30" stroke="#f472b6" strokeWidth="2.4" fill="none" />
        </g>
      );
    case 'piratehat':
      return (
        <g>
          <path d="M16 30 Q30 12 50 12 Q70 12 84 30 Q66 26 50 33 Q34 26 16 30Z" fill="#111827" />
          <path d="M16 30 Q34 26 50 33 Q66 26 84 30" stroke="#facc15" strokeWidth="1.4" fill="none" />
          <circle cx="50" cy="21" r="4" fill="#f8fafc" />
          <rect x="47.6" y="23.5" width="4.8" height="2.6" rx=".8" fill="#f8fafc" />
          <circle cx="48.5" cy="20.8" r="1" fill="#111827" />
          <circle cx="51.5" cy="20.8" r="1" fill="#111827" />
          <path d="M44 27 L56 31 M56 27 L44 31" stroke="#f8fafc" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      );
    case 'devil':
      return (
        <g>
          <path d="M33 27 C30 20 31 13 35 8 C35 15 38 20 41 23 Z" fill="#dc2626" />
          <path d="M67 27 C70 20 69 13 65 8 C65 15 62 20 59 23 Z" fill="#dc2626" />
          <path d="M34 24 C33 19 33.5 14 35 10" stroke="#fca5a5" strokeWidth=".8" fill="none" />
        </g>
      );
    case 'crystalcrown':
      return (
        <g>
          <defs>
            <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ecfeff" />
              <stop offset=".5" stopColor="#a5f3fc" />
              <stop offset="1" stopColor="#c084fc" />
            </linearGradient>
          </defs>
          <path d="M32 28 L33 12 L41 20 L45 4 L50 16 L55 4 L59 20 L67 12 L68 28 Z" fill={`url(#${g})`} stroke="#e9d5ff" strokeWidth=".9" strokeLinejoin="round" />
          <path d="M45 4 L47 18 M55 4 L53 18 M33 12 L38 24 M67 12 L62 24" stroke="#fff" strokeOpacity=".6" strokeWidth=".7" />
          <rect x="32" y="25.5" width="36" height="5" rx="1.5" fill="#c4b5fd" stroke="#e9d5ff" strokeWidth=".7" />
          <path d={star(50, 28, 2.2, 0.9, 4)} fill="#fff" />
          <circle cx="40" cy="28" r="1.2" fill="#22d3ee" />
          <circle cx="60" cy="28" r="1.2" fill="#f0abfc" />
        </g>
      );
    default:
      return null;
  }
}

/* ---------- pet (on the right shoulder) ---------- */
function Pet({ item }: { item: AvatarItem }) {
  const c = item.c1 ?? '#f59e0b';
  const eyes = (y = 11, l = 8.5, r = 13.5) => (
    <>
      <circle cx={l} cy={y} r="1.2" fill="#111" />
      <circle cx={r} cy={y} r="1.2" fill="#111" />
      <circle cx={l + 0.4} cy={y - 0.4} r=".4" fill="#fff" />
      <circle cx={r + 0.4} cy={y - 0.4} r=".4" fill="#fff" />
    </>
  );
  let body: ReactNode = null;
  switch (item.style) {
    case 'butterfly':
      body = (
        <g stroke="#1b1512" strokeWidth=".7">
          <path d="M11 12 C2 2 -3 12 3 16 C6 18 9 16 11 13Z" fill={c} />
          <path d="M11 12 C20 2 25 12 19 16 C16 18 13 16 11 13Z" fill={c} />
          <path d="M11 13 C6 15 4 22 8 22 C10 22 11 18 11 14Z M11 13 C16 15 18 22 14 22 C12 22 11 18 11 14Z" fill={shade(c, 0.3)} />
          <circle cx="5" cy="10" r="1.4" fill="#fff" />
          <circle cx="17" cy="10" r="1.4" fill="#fff" />
          <path d="M11 10 V21" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M11 10 Q9 6 8 5 M11 10 Q13 6 14 5" fill="none" />
        </g>
      );
      break;
    case 'pixelpet':
      // an egg-shaped pocket pet with a pixel creature on its screen
      body = (
        <g>
          <ellipse cx="11" cy="14" rx="9" ry="10.5" fill={c} stroke="#1b1512" strokeWidth=".8" />
          <rect x="5" y="7" width="12" height="10" rx="1.5" fill="#bef264" stroke="#1b1512" strokeWidth=".7" />
          <g fill="#1b1512">
            <rect x="9" y="9" width="4" height="1.2" />
            <rect x="8" y="10.2" width="6" height="3.6" />
            <rect x="8" y="13.8" width="1.4" height="1.2" />
            <rect x="12.6" y="13.8" width="1.4" height="1.2" />
          </g>
          <rect x="9.2" y="11" width="1" height="1" fill="#bef264" />
          <rect x="11.8" y="11" width="1" height="1" fill="#bef264" />
          {[7, 11, 15].map((bx) => (
            <circle key={bx} cx={bx} cy="20.5" r="1.2" fill="#fde047" stroke="#1b1512" strokeWidth=".5" />
          ))}
        </g>
      );
      break;
    case 'flipphone':
      body = (
        <g stroke="#1b1512" strokeWidth=".8" strokeLinejoin="round">
          <path d="M15 1.5 V4" strokeWidth=".9" strokeLinecap="round" />
          <rect x="5" y="4" width="12" height="9" rx="2" fill={c} />
          <rect x="7" y="6" width="8" height="5" rx="1" fill="#a5f3fc" />
          <rect x="5" y="13.5" width="12" height="10" rx="2" fill={shade(c, -0.12)} />
          <g fill="#fff" stroke="none">
            {[0, 1, 2].map((r) => [0, 1, 2].map((k) => <rect key={`${r}${k}`} x={7.2 + k * 2.8} y={15.5 + r * 2.4} width="1.8" height="1.3" rx=".4" />))}
          </g>
          <path d={star(-1.5, 7, 2.4, 0.7, 4)} fill="#fde047" strokeWidth=".5" />
        </g>
      );
      break;
    case 'cat':
      body = (
        <>
          <path d="M18 20 C26 20 28 10 24 6" stroke={shade(c, -0.2)} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <ellipse cx="11" cy="19" rx="8" ry="5" fill={c} />
          <path d="M4 7 L5 1 L9 5 Z M18 7 L17 1 L13 5 Z" fill={c} />
          <circle cx="11" cy="10.5" r="7" fill={c} />
          <path d="M6 7 l1 -3 l2 2.5z M16 7 l-1 -3 l-2 2.5z" fill="#fda4af" />
          {eyes(10.5)}
          <path d="M10 13 l1 1 l1 -1" stroke="#7c2d12" strokeWidth=".7" fill="none" />
          <path d="M8 9 l1 0 M13 9 l1 0" stroke={shade(c, -0.3)} strokeWidth=".6" />
        </>
      );
      break;
    case 'puppy':
      body = (
        <>
          <ellipse cx="11" cy="19" rx="8" ry="5" fill={c} />
          <circle cx="11" cy="10.5" r="7" fill={c} />
          <ellipse cx="4.5" cy="10" rx="2.6" ry="5" fill={shade(c, -0.35)} transform="rotate(15 4.5 10)" />
          <ellipse cx="17.5" cy="10" rx="2.6" ry="5" fill={shade(c, -0.35)} transform="rotate(-15 17.5 10)" />
          <ellipse cx="11" cy="13.5" rx="3.6" ry="2.6" fill="#fef3c7" />
          {eyes(9.5)}
          <ellipse cx="11" cy="12.5" rx="1.3" ry=".9" fill="#111" />
          <path d="M10.4 15 q.6 1.6 1.2 0" fill="#fb7185" />
        </>
      );
      break;
    case 'bird':
      body = (
        <>
          <ellipse cx="11" cy="14" rx="8" ry="7.5" fill={c} />
          <ellipse cx="11.5" cy="16.5" rx="4.5" ry="4" fill="#e0f2fe" />
          <path d="M3 13 Q0 18 5 21 Q7 17 6 13Z" fill={shade(c, -0.3)} />
          <path d="M8 4 Q11 1 13 5" stroke={shade(c, -0.3)} strokeWidth="1.5" fill="none" />
          {eyes(11, 8.5, 14)}
          <path d="M10.5 13 L13 13 L11.7 15 Z" fill="#f59e0b" />
        </>
      );
      break;
    case 'slime':
      body = (
        <>
          <path d="M2 21 C1 12 6 4 11 4 C16 4 21 12 20 21 Q11 24 2 21Z" fill={c} opacity=".9" />
          <path d="M6 9 Q8 6 11 6" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {eyes(13.5, 8, 14)}
          <path d="M9.5 17 Q11 18.4 12.5 17" stroke="#14532d" strokeWidth=".8" fill="none" />
        </>
      );
      break;
    case 'robot':
      body = (
        <>
          <path d="M11 3 V0" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="11" cy="0" r="1.3" fill="#ef4444" />
          <rect x="3" y="3" width="16" height="12" rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth=".8" />
          <rect x="5.5" y="5.5" width="11" height="7" rx="2" fill="#0f172a" />
          <circle cx="8.5" cy="9" r="1.3" fill="#22d3ee" />
          <circle cx="13.5" cy="9" r="1.3" fill="#22d3ee" />
          <rect x="5" y="16" width="12" height="7" rx="2" fill="#94a3b8" />
          <circle cx="11" cy="19.5" r="1.2" fill="#facc15" />
        </>
      );
      break;
    case 'dragon':
      body = (
        <>
          <path d="M2 14 L-3 6 L5 10 Z M20 14 L25 6 L17 10 Z" fill={shade(c, -0.25)} />
          <ellipse cx="11" cy="18.5" rx="7.5" ry="5" fill={c} />
          <ellipse cx="11" cy="19.5" rx="4" ry="3" fill="#fde68a" />
          <circle cx="11" cy="10" r="7" fill={c} />
          <path d="M6 5 L5 0 L8.5 3.5 Z M16 5 L17 0 L13.5 3.5 Z" fill="#fde68a" />
          {eyes(9.5)}
          <path d="M9 13.5 h4" stroke={shade(c, -0.4)} strokeWidth=".8" strokeLinecap="round" />
          <circle cx="9.5" cy="12" r=".5" fill={shade(c, -0.4)} />
          <circle cx="12.5" cy="12" r=".5" fill={shade(c, -0.4)} />
        </>
      );
      break;
    case 'frog':
      body = (
        <>
          <ellipse cx="11" cy="16" rx="9" ry="7" fill={c} />
          <circle cx="6" cy="8" r="3.6" fill={c} />
          <circle cx="16" cy="8" r="3.6" fill={c} />
          {eyes(8, 6, 16)}
          <path d="M6 16 Q11 20 16 16" stroke="#14532d" strokeWidth=".9" fill="none" />
          <ellipse cx="11" cy="20" rx="5" ry="2.4" fill="#bbf7d0" />
          <circle cx="4.5" cy="14.5" r="1.2" fill="#fb7185" opacity=".5" />
          <circle cx="17.5" cy="14.5" r="1.2" fill="#fb7185" opacity=".5" />
        </>
      );
      break;
    case 'bunnypet':
      body = (
        <>
          <ellipse cx="7.5" cy="2" rx="2.4" ry="6" fill={c} />
          <ellipse cx="14.5" cy="2" rx="2.4" ry="6" fill={c} />
          <ellipse cx="7.5" cy="2.5" rx="1.1" ry="4" fill="#fbcfe8" />
          <ellipse cx="14.5" cy="2.5" rx="1.1" ry="4" fill="#fbcfe8" />
          <ellipse cx="11" cy="19" rx="8" ry="5" fill={c} />
          <circle cx="11" cy="11" r="6.8" fill={c} />
          {eyes(10.5)}
          <path d="M10.2 13 L11 13.8 L11.8 13" stroke="#f472b6" strokeWidth=".8" fill="none" />
        </>
      );
      break;
    case 'penguin':
      body = (
        <>
          <ellipse cx="11" cy="14" rx="8.5" ry="9" fill="#1e293b" />
          <ellipse cx="11" cy="16" rx="5.6" ry="6.6" fill="#f8fafc" />
          <ellipse cx="11" cy="9" rx="5.2" ry="4.4" fill="#f8fafc" />
          {eyes(8.5, 8.5, 13.5)}
          <path d="M9.6 11 L12.4 11 L11 13 Z" fill="#f59e0b" />
          <path d="M3 14 Q0 18 3.5 21 M19 14 Q22 18 18.5 21" stroke="#1e293b" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      );
      break;
    case 'fox':
      body = (
        <>
          <path d="M18 22 C26 22 28 12 22 8 C24 14 20 18 16 18Z" fill={c} />
          <path d="M22 8 C24 10 25 13 24 15" stroke="#fff" strokeWidth="1.6" fill="none" />
          <ellipse cx="11" cy="19" rx="7.5" ry="4.6" fill={c} />
          <path d="M3 4 L6 11 L10 7 Z M19 4 L16 11 L12 7 Z" fill={c} />
          <path d="M4.5 6 L6.5 10 L8.5 8 Z M17.5 6 L15.5 10 L13.5 8 Z" fill="#1c1917" />
          <path d="M3.5 10 Q11 4 18.5 10 Q17 16 11 17 Q5 16 3.5 10Z" fill={c} />
          <path d="M5.5 12.5 Q11 18 16.5 12.5 Q14 16.5 11 17 Q8 16.5 5.5 12.5Z" fill="#fff" />
          {eyes(11, 8.3, 13.7)}
          <circle cx="11" cy="15" r=".9" fill="#1c1917" />
        </>
      );
      break;
    case 'ghost':
      body = (
        <>
          <path d="M3 22 V11 C3 5 7 2 11 2 C15 2 19 5 19 11 V22 L16.3 19.5 L13.7 22 L11 19.5 L8.3 22 L5.7 19.5 Z" fill="#f8fafc" opacity=".92" />
          <ellipse cx="8" cy="10.5" rx="1.4" ry="2" fill="#1e293b" />
          <ellipse cx="14" cy="10.5" rx="1.4" ry="2" fill="#1e293b" />
          <ellipse cx="11" cy="15" rx="1.6" ry="1.2" fill="#1e293b" />
          <circle cx="6" cy="13" r="1.1" fill="#fda4af" opacity=".6" />
          <circle cx="16" cy="13" r="1.1" fill="#fda4af" opacity=".6" />
        </>
      );
      break;
    case 'phoenix':
      body = (
        <>
          <path d="M3 16 C-4 10 -2 2 3 0 C2 6 5 10 8 12Z" fill="#facc15" />
          <path d="M19 16 C26 10 24 2 19 0 C20 6 17 10 14 12Z" fill="#facc15" />
          <path d="M8 22 Q11 30 14 22" fill="#ef4444" />
          <ellipse cx="11" cy="15" rx="7" ry="7.5" fill={c} />
          <ellipse cx="11" cy="17" rx="4" ry="4.4" fill="#fde68a" />
          <path d="M9 7 Q10 2 11 6 Q12 1 13 7" fill="#ef4444" />
          {eyes(12, 8.5, 13.5)}
          <path d="M10 14 L12 14 L11 16Z" fill="#facc15" />
        </>
      );
      break;
    default:
      return null;
  }
  return <g transform="translate(72 64) scale(1.05)">{body}</g>;
}

/* ---------- head geometry ---------- */
/** Scales every head layer (hair, face, glasses, hats) about the chin. A big head reads as a cartoon. */
const HEAD = 'translate(50 68.5) scale(1.02) translate(-50 -63.5)';
/** Where the eyes, nose and mouth sit inside the head (eyes and glasses share it). */
const FEATURES = 'translate(50 48) scale(1.13) translate(-50 -48)';
/** A round, wide head with soft full cheeks and a rounded chin. */
const FACE =
  'M29.4 40.6 C29.4 27.2 38.8 20.6 50 20.6 C61.2 20.6 70.6 27.2 70.6 40.6 C70.6 46.6 69.6 51.2 67.4 55 C64.8 59.6 59.4 63.6 53.6 64.6 C51.2 65 48.8 65 46.4 64.6 C40.6 63.6 35.2 59.6 32.6 55 C30.4 51.2 29.4 46.6 29.4 40.6Z';
/** Shoulders a little narrower than real life: heroic but still comic. */
const BODY = 'translate(50 100) scale(.92 1) translate(-50 -100)';

/** Big round ears that stick out at eye level. */
function Ears({ x }: { x: Ctx }) {
  return (
    <g>
      {[-1, 1].map((d) => {
        const ex = 50 + d * 20.2;
        return (
          <g key={d}>
            <path
              d={`M${ex} 40.8 C${ex + d * 5} 39.6 ${ex + d * 6} 45.6 ${ex + d * 4.4} 49.6 C${ex + d * 3.2} 52.4 ${ex + d * 1.2} 52.6 ${ex - d * 0.4} 51.2 Z`}
              fill={x.skin}
            />
            <path d={`M${ex + d * 1.2} 43 C${ex + d * 3.8} 42.6 ${ex + d * 4.2} 47.6 ${ex + d * 2.2} 49`} stroke={INK} strokeWidth=".8" fill="none" strokeLinecap="round" />
            <path d={`M${ex + d * 1.6} 44.4 C${ex + d * 3.2} 44.6 ${ex + d * 3.2} 47.2 ${ex + d * 2} 47.8 Z`} fill={x.skinDark} opacity=".5" />
          </g>
        );
      })}
    </g>
  );
}

/* ---------- the avatar ---------- */
export function Avatar({
  look,
  size = 96,
  shape = 'rounded',
  className = '',
  title,
  mood,
}: {
  look: Partial<Character> | undefined;
  /** Today's mood (1–5), used when the "Match my mood" face is worn. */
  mood?: number;
  size?: number;
  shape?: 'rounded' | 'circle' | 'square';
  className?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, '');
  const todayMood = useTodayMood();
  const l = normalizeLook(look);
  const skinItem = findItem(l.skin)!;
  const hairItem = findItem(l.hair)!;
  const hairColor = findItem(l.hairColor)!.c1!;
  const skin = skinItem.c1!;
  const lip = mix(skin, '#b4505a', 0.5);
  const x: Ctx = {
    id,
    skin,
    skinDark: shade(skin, -0.22),
    hair: hairColor,
    hairDark: shade(hairColor, -0.35),
    eye: ['#a87545', '#6b4426', '#2e1b0e'],
    brow: INK,
    lip,
    lipDark: shade(lip, -0.18),
  };
  const clip = `${id}clip`;
  // The cartoon ink outline around every shape. Thicker on small pictures so it still shows.
  const ink = `url(#${id}ink)`;
  const radius = size < 60 ? 1.25 : size < 120 ? 1 : 0.9;
  const shadow = shade(skin, -0.16);

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={title ?? 'Avatar'}>
      <defs>
        <clipPath id={clip}>
          {shape === 'circle' ? <circle cx="50" cy="50" r="50" /> : <rect width="100" height="100" rx={shape === 'rounded' ? 24 : 0} />}
        </clipPath>
        <filter id={`${id}ink`} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius={radius} result="grown" />
          <feFlood floodColor={INK} />
          <feComposite in2="grown" operator="in" result="outline" />
          <feMerge>
            <feMergeNode in="outline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${id}face`}>
          <path d={FACE} />
        </clipPath>
        {/* comic-book halftone dots for the shadows */}
        <pattern id={`${id}dots`} width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="1.2" cy="1.2" r=".62" fill={shade(skin, -0.32)} />
        </pattern>
        <linearGradient id={`${id}rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".12" />
          <stop offset=".2" stopColor="#fff" stopOpacity="0" />
          <stop offset=".8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <Backdrop item={findItem(l.backdrop)!} x={x} />
        <g transform={HEAD}>
          <g filter={ink}>
            <HairBack style={hairItem.style} x={x} />
          </g>
        </g>
        {/* a thin neck with the chin's shadow */}
        <g filter={ink}>
          <path d="M43.6 58 H56.4 V80 H43.6 Z" fill={skin} />
        </g>
        <path d="M43.6 62.5 Q50 68.5 56.4 62.5 V67.5 Q50 72 43.6 67.5 Z" fill={shadow} />
        <path d="M43.6 64 Q50 70 56.4 64 V72 H43.6 Z" fill={`url(#${id}dots)`} opacity=".6" />
        <path d="M47.4 68 Q48.6 72 47.6 76" stroke={shade(skin, -0.25)} strokeWidth=".7" fill="none" opacity=".6" strokeLinecap="round" />
        <g transform={BODY}>
          <g filter={ink}>
            <Outfit item={findItem(l.outfit)!} x={x} />
          </g>
        </g>
        <g transform={HEAD}>
          <g filter={ink}>
            <Ears x={x} />
          </g>
          <g filter={ink}>
            <path d={FACE} fill={skin} />
          </g>
          {/* one flat cel shadow on the far cheek and under the hairline */}
          <g clipPath={`url(#${id}face)`}>
            {/* hard comic shadow on the far side of the face, with halftone in it */}
            <path d="M63.4 27 C69 34 69.6 46 66 53.6 C63.4 58.8 59 62 54.4 64 L73 66 L73 24Z" fill={shadow} opacity=".55" />
            <path d="M61.6 30 C66.6 38 67 49 62.6 56.4 C60 60.4 56.4 62.6 52.6 63.6 L73 66 L73 26Z" fill={`url(#${id}dots)`} opacity=".75" />
            {/* cheekbone and jaw shadows, a rim light on the near side, the chin */}
            <path d="M59.6 50.4 Q63 52.2 64.8 55.6" stroke={shadow} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M34.8 52 Q36.6 54.6 39.6 55.4" stroke={shadow} strokeWidth=".9" fill="none" strokeLinecap="round" opacity=".7" />
            <path d="M31.4 36 Q30.6 44 32.8 51" stroke="#fff" strokeWidth="1.1" fill="none" opacity=".35" strokeLinecap="round" />
            <path d="M46.2 61.6 Q50 63 53.8 61.6" stroke={shadow} strokeWidth="1" fill="none" strokeLinecap="round" />
          </g>
          <g transform={FEATURES}>
            <Face x={x} style={findItem(l.expression)!.style} mood={mood ?? todayMood} />
          </g>
          <g filter={ink}>
            <HairFront style={hairItem.style} x={x} />
          </g>
          <g transform={FEATURES}>
            <Eyewear item={findItem(l.face)!} x={x} />
          </g>
          <g filter={ink}>
            <Headwear item={findItem(l.headwear)!} x={x} />
          </g>
        </g>
        <g filter={ink}>
          <Pet item={findItem(l.pet)!} />
        </g>
        <rect width="100" height="100" fill={`url(#${id}rim)`} />
        {shape !== 'circle' && (
          <rect x=".6" y=".6" width="98.8" height="98.8" rx={shape === 'rounded' ? 23.5 : 0} fill="none" stroke="#fff" strokeOpacity=".14" strokeWidth="1.2" />
        )}
      </g>
    </svg>
  );
}
