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

function star(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  }
  return d + 'Z';
}

type Ctx = { id: string; skin: string; skinDark: string; hair: string; hairDark: string };

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
  const shine = <path d="M37 26 Q44 21 52 22" stroke="#fff" strokeOpacity=".22" strokeWidth="1.6" fill="none" strokeLinecap="round" />;
  switch (style) {
    case 'short':
      return (
        <g>
          <path
            d="M28.5 44 C27 28 37 19 50 19 C63 19 73 28 71.5 44 C69.5 37 65 32.5 58 31.5 C55 34.5 48 35.5 41 33.5 C35 35 31 39 28.5 44 Z"
            fill={x.hair}
          />
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
          {[
            [36, 27],
            [48, 23],
            [62, 26],
          ].map(([cx, cy]) => (
            <circle key={`h${cx}`} cx={cx} cy={cy} r="1.6" fill="#fff" opacity=".18" />
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
          <path d="M46 19 Q55 13 63 16.5" stroke="#fff" strokeOpacity=".25" strokeWidth="1.6" fill="none" strokeLinecap="round" />
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
const TORSO = 'M12 100 C12 83 27 73 50 73 C73 73 88 83 88 100 Z';

function Outfit({ item, x }: { item: AvatarItem; x: Ctx }) {
  const c1 = item.c1 ?? '#64748b';
  const c2 = item.c2 ?? shade(c1, -0.25);
  const g = `${x.id}out`;
  const neckline = <path d="M41.5 73.2 Q50 83 58.5 73.2 Z" fill={x.skin} />;
  switch (item.style) {
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
const EYE_L = 42.5;
const EYE_R = 57.5;
const EYE_Y = 45;
const INK = '#1f1a17';
const LIP = '#7a3b2e';

function heart(cx: number, cy: number, s: number): string {
  return `M${cx} ${cy + s * 0.9} C${cx - s * 1.6} ${cy - s * 0.1} ${cx - s * 0.9} ${cy - s * 1.3} ${cx} ${cy - s * 0.45} C${cx + s * 0.9} ${cy - s * 1.3} ${cx + s * 1.6} ${cy - s * 0.1} ${cx} ${cy + s * 0.9}Z`;
}

type EyeKind = 'open' | 'round' | 'happy' | 'closed' | 'half' | 'star' | 'heart' | 'dizzy' | 'robot' | 'fire' | 'side' | 'x' | 'sparkle' | 'puppy' | 'cosmic';

function Eye({ cx, kind, x }: { cx: number; kind: EyeKind; x: Ctx }) {
  const cy = EYE_Y;
  switch (kind) {
    case 'side':
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx="3.2" ry="2.6" fill="#fff" />
          <circle cx={cx + 1.6} cy={cy + 0.2} r="1.7" fill={INK} />
          <path d={`M${cx - 3.6} ${cy - 1.4} Q${cx} ${cy - 3.2} ${cx + 3.6} ${cy - 1.4}`} stroke={x.skinDark} strokeWidth="1.3" fill="none" />
        </g>
      );
    case 'cosmic':
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx="3.6" ry="4" fill="#a855f7" opacity=".35" />
          <ellipse cx={cx} cy={cy} rx="2.6" ry="3" fill="#4c1d95" />
          <circle cx={cx - 0.6} cy={cy + 0.8} r=".9" fill="#22d3ee" />
          <path d={star(cx + 0.6, cy - 0.6, 1.6, 0.5, 4)} fill="#fff" />
        </g>
      );
    case 'x':
      return <path d={`M${cx - 2.4} ${cy - 2.4} L${cx + 2.4} ${cy + 2.4} M${cx + 2.4} ${cy - 2.4} L${cx - 2.4} ${cy + 2.4}`} stroke={INK} strokeWidth="1.6" strokeLinecap="round" />;
    case 'sparkle':
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx="2.6" ry="3.2" fill={INK} />
          <path d={star(cx + 0.7, cy - 1, 1.5, 0.5, 4)} fill="#fff" />
          <circle cx={cx - 0.9} cy={cy + 1.3} r=".5" fill="#fff" />
        </g>
      );
    case 'puppy':
      return (
        <g>
          <ellipse cx={cx} cy={cy + 0.3} rx="3.2" ry="3.8" fill={INK} />
          <circle cx={cx + 1} cy={cy - 1} r="1.4" fill="#fff" />
          <circle cx={cx - 1} cy={cy + 1.6} r=".7" fill="#fff" />
          <path d={`M${cx - 2.6} ${cy + 3.6} Q${cx} ${cy + 4.8} ${cx + 2.6} ${cy + 3.6}`} stroke="#7dd3fc" strokeWidth=".9" fill="none" />
        </g>
      );
    case 'round':
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx="3.1" ry="3.7" fill="#fff" />
          <circle cx={cx} cy={cy + 0.3} r="2.1" fill={INK} />
          <circle cx={cx + 0.8} cy={cy - 0.6} r=".8" fill="#fff" />
        </g>
      );
    case 'happy':
      return <path d={`M${cx - 3} ${cy + 1} Q${cx} ${cy - 3} ${cx + 3} ${cy + 1}`} stroke={INK} strokeWidth="1.7" fill="none" strokeLinecap="round" />;
    case 'closed':
      return <path d={`M${cx - 3} ${cy} Q${cx} ${cy + 2.6} ${cx + 3} ${cy}`} stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />;
    case 'half':
      return (
        <g>
          <ellipse cx={cx} cy={cy + 0.6} rx="2.5" ry="2.4" fill={INK} />
          <path d={`M${cx - 3.4} ${cy - 0.4} H${cx + 3.4}`} stroke={x.skinDark} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx={cx + 0.8} cy={cy + 0.6} r=".7" fill="#fff" />
        </g>
      );
    case 'star':
      return <path d={star(cx, cy, 3.8, 1.6)} fill="#facc15" stroke="#b45309" strokeWidth=".6" strokeLinejoin="round" />;
    case 'heart':
      return <path d={heart(cx, cy, 3)} fill="#f43f5e" />;
    case 'dizzy':
      return (
        <path
          d={`M${cx} ${cy} m-.6 0 a.6 .6 0 1 1 1.2 0 a1.4 1.4 0 1 1 -2.8 0 a2.2 2.2 0 1 1 4.4 0 a3 3 0 1 1 -6 0`}
          stroke={INK}
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
      );
    case 'robot':
      return (
        <g>
          <rect x={cx - 3} y={cy - 1.8} width="6" height="3.6" rx="1" fill="#22d3ee" opacity=".35" />
          <rect x={cx - 2.4} y={cy - 1.2} width="4.8" height="2.4" rx=".8" fill="#22d3ee" />
        </g>
      );
    case 'fire':
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx="3.6" ry="4.2" fill="#f97316" opacity=".35" />
          <ellipse cx={cx} cy={cy} rx="2.5" ry="3.1" fill="#ea580c" />
          <ellipse cx={cx} cy={cy - 0.4} rx="1.2" ry="1.7" fill="#fde047" />
        </g>
      );
    default:
      return (
        <g>
          <path d={`M${cx - 3.1} ${cy + 0.3} Q${cx} ${cy - 4} ${cx + 3.1} ${cy + 0.3} Q${cx} ${cy + 3.3} ${cx - 3.1} ${cy + 0.3}Z`} fill="#fff" opacity=".92" />
          <circle cx={cx + 0.15} cy={cy + 0.1} r="2.15" fill={INK} />
          <circle cx={cx + 0.9} cy={cy - 0.75} r=".6" fill="#fff" />
          <path d={`M${cx - 3.3} ${cy + 0.2} Q${cx} ${cy - 4.3} ${cx + 3.3} ${cy}`} stroke={INK} strokeWidth="1.1" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}

type BrowKind = 'normal' | 'raised' | 'angry' | 'sad' | 'flat' | 'one' | 'none';
function Brows({ kind, x }: { kind: BrowKind; x: Ctx }) {
  const paths: Record<Exclude<BrowKind, 'none'>, string> = {
    normal: 'M39 39.8 Q42.5 37.9 46 39.2 M54 39.2 Q57.5 37.9 61 39.8',
    raised: 'M39.3 37.6 q3.2 -2.2 6.4 0 M54.3 37.6 q3.2 -2.2 6.4 0',
    angry: 'M39.3 38.2 L45.7 40.6 M60.7 38.2 L54.3 40.6',
    sad: 'M39.3 40.6 L45.7 38.6 M60.7 40.6 L54.3 38.6',
    flat: 'M39.5 39.8 H45.5 M54.5 39.8 H60.5',
    one: 'M39.5 40 H45.5 M54.3 38.2 q3.2 -3 6.4 -1',
  };
  if (kind === 'none') return null;
  return <path d={paths[kind]} stroke={x.hairDark} strokeWidth={kind === 'angry' ? 1.5 : 1.15} fill="none" strokeLinecap="round" />;
}

type MouthKind = 'smile' | 'grin' | 'soft' | 'sad' | 'frown' | 'o' | 'smirk' | 'laugh' | 'cat' | 'robot' | 'grit' | 'small' | 'flat' | 'buck' | 'pout';
function Mouth({ kind }: { kind: MouthKind }) {
  switch (kind) {
    case 'grin':
      return (
        <g>
          <path d="M44.3 51.3 Q50 58.6 55.7 51.3 Z" fill="#5b2320" />
          <path d="M45.4 51.6 H54.6 Q54.2 53 53.6 53.4 H46.4 Q45.8 53 45.4 51.6Z" fill="#fff" />
        </g>
      );
    case 'laugh':
      return (
        <g>
          <path d="M43.5 50.8 Q50 61 56.5 50.8 Z" fill="#5b2320" />
          <path d="M46 56.2 Q50 54 54 56.2 Q50 59.2 46 56.2Z" fill="#fb7185" />
          <path d="M44.6 51.1 H55.4 Q55 52.6 54.4 53 H45.6 Q45 52.6 44.6 51.1Z" fill="#fff" />
        </g>
      );
    case 'soft':
      return <path d="M46.5 52.6 Q50 55.2 53.5 52.6" stroke={LIP} strokeWidth="1.4" fill="none" strokeLinecap="round" />;
    case 'sad':
      return <path d="M45.5 55.2 Q50 51.2 54.5 55.2" stroke={LIP} strokeWidth="1.5" fill="none" strokeLinecap="round" />;
    case 'frown':
      return <path d="M45 55 Q50 51.8 55 55" stroke={LIP} strokeWidth="1.8" fill="none" strokeLinecap="round" />;
    case 'o':
      return <ellipse cx="50" cy="53.6" rx="2.3" ry="2.9" fill="#5b2320" />;
    case 'smirk':
      return <path d="M45.5 53.4 Q51 55.6 55 51.6" stroke={LIP} strokeWidth="1.5" fill="none" strokeLinecap="round" />;
    case 'cat':
      return <path d="M45.6 52.4 q2.2 2.4 4.4 0 q2.2 2.4 4.4 0" stroke={LIP} strokeWidth="1.3" fill="none" strokeLinecap="round" />;
    case 'robot':
      return (
        <g>
          <rect x="44.5" y="52" width="11" height="3" rx="1" fill="#0f172a" />
          {[46.5, 49, 51.5, 54].map((mx) => (
            <rect key={mx} x={mx - 0.6} y="52.6" width="1.2" height="1.8" fill="#22d3ee" />
          ))}
        </g>
      );
    case 'grit':
      return (
        <g>
          <rect x="44.6" y="51.8" width="10.8" height="3.8" rx="1.4" fill="#fff" stroke={LIP} strokeWidth="1" />
          <path d="M44.8 53.7 H55.2 M48.2 51.9 V55.5 M51.8 51.9 V55.5" stroke={LIP} strokeWidth=".6" />
        </g>
      );
    case 'small':
      return <path d="M48 53.4 H52" stroke={LIP} strokeWidth="1.4" strokeLinecap="round" />;
    case 'flat':
      return <path d="M45.5 53.6 H54.5" stroke={LIP} strokeWidth="1.5" strokeLinecap="round" />;
    case 'buck':
      return (
        <g>
          <path d="M44.6 51.8 Q50 57 55.4 51.8 Z" fill="#5b2320" />
          <rect x="47.6" y="51.8" width="2.2" height="3" rx=".5" fill="#fff" />
          <rect x="50.2" y="51.8" width="2.2" height="3" rx=".5" fill="#fff" />
        </g>
      );
    case 'pout':
      return <path d="M47 54.4 Q50 52.6 53 54.4" stroke={LIP} strokeWidth="1.5" fill="none" strokeLinecap="round" />;
    default:
      return (
        <g>
          <path d="M46.2 53 Q50 55.8 53.8 53" stroke={LIP} strokeWidth="1.25" fill="none" strokeLinecap="round" />
          <path d="M47.8 55.6 Q50 56.4 52.2 55.6" stroke={LIP} strokeWidth=".7" fill="none" strokeLinecap="round" opacity=".35" />
        </g>
      );
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
}

const EXPRESSIONS: Record<string, ExpressionSpec> = {
  happy: { eyes: ['open', 'open'], brows: 'normal', mouth: 'smile' },
  grin: { eyes: ['open', 'open'], brows: 'raised', mouth: 'grin', blush: true },
  calm: { eyes: ['closed', 'closed'], brows: 'flat', mouth: 'soft' },
  sad: { eyes: ['open', 'open'], brows: 'sad', mouth: 'sad', tear: true },
  angry: { eyes: ['open', 'open'], brows: 'angry', mouth: 'frown' },
  surprised: { eyes: ['round', 'round'], brows: 'raised', mouth: 'o' },
  sleepy: { eyes: ['closed', 'closed'], brows: 'flat', mouth: 'small', zzz: true },
  wink: { eyes: ['open', 'happy'], brows: 'normal', mouth: 'smile', blush: true },
  laugh: { eyes: ['happy', 'happy'], brows: 'raised', mouth: 'laugh', blush: true },
  smirk: { eyes: ['half', 'half'], brows: 'normal', mouth: 'smirk' },
  determined: { eyes: ['open', 'open'], brows: 'angry', mouth: 'grit', sweat: true },
  starstruck: { eyes: ['star', 'star'], brows: 'raised', mouth: 'grin', blush: true },
  love: { eyes: ['heart', 'heart'], brows: 'raised', mouth: 'smile', blush: true },
  dizzy: { eyes: ['dizzy', 'dizzy'], brows: 'sad', mouth: 'o' },
  cat: { eyes: ['happy', 'happy'], brows: 'normal', mouth: 'cat', blush: true, whiskers: true },
  robot: { eyes: ['robot', 'robot'], brows: 'none', mouth: 'robot' },
  fire: { eyes: ['fire', 'fire'], brows: 'angry', mouth: 'smirk' },
  sigma: { eyes: ['half', 'half'], brows: 'one', mouth: 'smirk' },
  sideeye: { eyes: ['side', 'side'], brows: 'flat', mouth: 'flat' },
  rizz: { eyes: ['half', 'happy'], brows: 'one', mouth: 'smirk', blush: true },
  bruh: { eyes: ['half', 'half'], brows: 'flat', mouth: 'flat' },
  unbothered: { eyes: ['closed', 'closed'], brows: 'one', mouth: 'smirk' },
  nerd: { eyes: ['open', 'open'], brows: 'raised', mouth: 'buck', blush: true },
  crylaugh: { eyes: ['happy', 'happy'], brows: 'sad', mouth: 'laugh', tear: true, tears2: true },
  pleading: { eyes: ['puppy', 'puppy'], brows: 'sad', mouth: 'pout', blush: true },
  dead: { eyes: ['x', 'x'], brows: 'flat', mouth: 'o' },
  maincharacter: { eyes: ['sparkle', 'sparkle'], brows: 'one', mouth: 'smirk', blush: true },
  cosmic: { eyes: ['cosmic', 'cosmic'], brows: 'normal', mouth: 'soft' },
};

/** Maps today's mood check-in (1–5) to an expression for the "Match my mood" face. */
const MOOD_FACE: Record<number, string> = { 1: 'sad', 2: 'sleepy', 3: 'calm', 4: 'happy', 5: 'laugh' };

function Face({ x, style, mood }: { x: Ctx; style: string; mood?: number }) {
  const key = style === 'mood' ? (mood ? MOOD_FACE[mood] : 'happy') : style;
  const e = EXPRESSIONS[key] ?? EXPRESSIONS.happy;
  return (
    <g>
      <Eye cx={EYE_L} kind={e.eyes[0]} x={x} />
      <Eye cx={EYE_R} kind={e.eyes[1]} x={x} />
      <Brows kind={e.brows} x={x} />
      {e.mouth !== 'robot' && (
        <path d="M50.6 45.5 Q51.8 49.4 50.4 50.6 Q49.4 51 48.7 50.4" stroke={x.skinDark} strokeWidth=".85" fill="none" strokeLinecap="round" opacity=".55" />
      )}
      <Mouth kind={e.mouth} />
      {e.blush && (
        <>
          <ellipse cx="38" cy="51" rx="3" ry="1.6" fill="#ff6b81" opacity=".16" />
          <ellipse cx="62" cy="51" rx="3" ry="1.6" fill="#ff6b81" opacity=".16" />
        </>
      )}
      {e.tear && <path d="M39.2 48.6 q-1.4 2.4 0 3.4 q1.4 -1 0 -3.4Z" fill="#7dd3fc" />}
      {e.tears2 && <path d="M60.8 48.6 q-1.4 2.4 0 3.4 q1.4 -1 0 -3.4Z" fill="#7dd3fc" />}
      {e.sweat && <path d="M66.5 36 q-1.6 2.6 0 3.8 q1.6 -1.2 0 -3.8Z" fill="#7dd3fc" />}
      {e.whiskers && <path d="M33 50 l-5 -1 M33 52 l-5 1 M67 50 l5 -1 M67 52 l5 1" stroke={INK} strokeWidth=".6" opacity=".6" />}
      {e.zzz && (
        <text x="66" y="27" fontSize="8.5" fontWeight="900" fill="#e2e8f0" fontFamily="system-ui, sans-serif" opacity=".85">
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
/** Scales every head layer (hair, face, glasses, hats) about the chin: a smaller head reads as less cartoonish. */
const HEAD = 'translate(50 66.5) scale(0.9) translate(-50 -63.5)';
/** Oval face with a defined jaw and chin (fits the same box the hair and hats were drawn for). */
const FACE = 'M29 41 C29 27 38.5 21 50 21 C61.5 21 71 27 71 41 C71 50 68 57 62.5 60.8 C58.5 63.4 54.5 64.4 50 64.4 C45.5 64.4 41.5 63.4 37.5 60.8 C32 57 29 50 29 41Z';

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
  const x: Ctx = { id, skin, skinDark: shade(skin, -0.3), hair: hairColor, hairDark: shade(hairColor, -0.35) };
  const clip = `${id}clip`;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={title ?? 'Avatar'}>
      <defs>
        <clipPath id={clip}>
          {shape === 'circle' ? <circle cx="50" cy="50" r="50" /> : <rect width="100" height="100" rx={shape === 'rounded' ? 24 : 0} />}
        </clipPath>
        <radialGradient id={`${id}skin`} cx=".4" cy=".35" r=".75">
          <stop offset="0" stopColor={shade(skin, 0.12)} />
          <stop offset="1" stopColor={skin} />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <Backdrop item={findItem(l.backdrop)!} x={x} />
        <g transform={HEAD}>
          <HairBack style={hairItem.style} x={x} />
        </g>
        {/* neck */}
        <path d="M44.6 58 H55.4 V76 H44.6 Z" fill={skin} />
        <path d="M44.6 61 Q50 67.5 55.4 61 V65.5 Q50 70 44.6 65.5 Z" fill={x.skinDark} opacity=".3" />
        <Outfit item={findItem(l.outfit)!} x={x} />
        {/* ears + head: scaled about the chin for natural, grown-up proportions */}
        <g transform={HEAD}>
        <ellipse cx="29.6" cy="46" rx="3.2" ry="4.6" fill={skin} />
        <ellipse cx="70.4" cy="46" rx="3.2" ry="4.6" fill={skin} />
        <path d="M30 43.5 q-1.6 2.5 0 5" stroke={x.skinDark} strokeWidth=".8" fill="none" opacity=".45" />
        <path d="M70 43.5 q1.6 2.5 0 5" stroke={x.skinDark} strokeWidth=".8" fill="none" opacity=".45" />
        <path d={FACE} fill={`url(#${id}skin)`} />
        <path d="M61 26 C70 32 72 46 66 56 C63 60 58 62.5 54 63.2 C60 59 66 51 66.5 42 C66.8 35 64.5 29.5 61 26Z" fill={x.skinDark} opacity=".13" />
        <path d="M43 60.5 Q50 64 57 60.5" stroke={x.skinDark} strokeWidth="1" fill="none" opacity=".18" strokeLinecap="round" />
        <Face x={x} style={findItem(l.expression)!.style} mood={mood ?? todayMood} />
        <HairFront style={hairItem.style} x={x} />
        <Eyewear item={findItem(l.face)!} x={x} />
        <Headwear item={findItem(l.headwear)!} x={x} />
        </g>
        <Pet item={findItem(l.pet)!} />
      </g>
    </svg>
  );
}
