import type { ReactNode } from 'react';
import type { AvatarItem } from '../data/avatar';

/* Scene backgrounds behind the character (shared by every character style). */

export function star(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  }
  return d + 'Z';
}

/** Only the id is needed here (for unique gradient ids). */
type Ctx = { id: string };

export function Backdrop({ item, x }: { item: AvatarItem; x: Ctx }) {
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
