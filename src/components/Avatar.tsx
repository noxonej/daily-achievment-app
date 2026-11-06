import { useId, type ReactNode } from 'react';
import type { Character } from '../lib/types';
import { findItem, normalizeLook, type AvatarItem } from '../data/avatar';

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
    default:
      return <path d={TORSO} fill={c1} />;
  }
}

/* ---------- face ---------- */
function Face({ x }: { x: Ctx }) {
  return (
    <g>
      <ellipse cx="42.5" cy="45" rx="2.5" ry="3.1" fill="#1f1a17" />
      <ellipse cx="57.5" cy="45" rx="2.5" ry="3.1" fill="#1f1a17" />
      <circle cx="43.4" cy="43.8" r=".95" fill="#fff" />
      <circle cx="58.4" cy="43.8" r=".95" fill="#fff" />
      <path d="M39.3 39.6 q3.2 -1.7 6.4 0 M54.3 39.6 q3.2 -1.7 6.4 0" stroke={x.hairDark} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M50 47.5 q1.3 1.8 0 2.6" stroke={x.skinDark} strokeWidth=".9" fill="none" strokeLinecap="round" opacity=".7" />
      <path d="M45 52.4 Q50 57.2 55 52.4" stroke="#7a3b2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="37.5" cy="51" rx="3.2" ry="1.8" fill="#ff6b81" opacity=".28" />
      <ellipse cx="62.5" cy="51" rx="3.2" ry="1.8" fill="#ff6b81" opacity=".28" />
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
    default:
      return null;
  }
  return <g transform="translate(72 64) scale(1.05)">{body}</g>;
}

/* ---------- the avatar ---------- */
export function Avatar({
  look,
  size = 96,
  shape = 'rounded',
  className = '',
  title,
}: {
  look: Partial<Character> | undefined;
  size?: number;
  shape?: 'rounded' | 'circle' | 'square';
  className?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, '');
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
        <g transform="translate(0 2.5)">
          <HairBack style={hairItem.style} x={x} />
        </g>
        {/* neck */}
        <path d="M43 56 H57 V76 H43 Z" fill={skin} />
        <path d="M43 60 Q50 66 57 60 V64 Q50 69 43 64 Z" fill={x.skinDark} opacity=".35" />
        <Outfit item={findItem(l.outfit)!} x={x} />
        {/* ears + head (nudged down for a shorter, friendlier neck) */}
        <g transform="translate(0 2.5)">
        <circle cx="29.5" cy="46" r="4.3" fill={skin} />
        <circle cx="70.5" cy="46" r="4.3" fill={skin} />
        <circle cx="29.5" cy="46" r="2" fill={x.skinDark} opacity=".25" />
        <circle cx="70.5" cy="46" r="2" fill={x.skinDark} opacity=".25" />
        <circle cx="50" cy="42" r="21" fill={`url(#${id}skin)`} />
        <Face x={x} />
        <HairFront style={hairItem.style} x={x} />
        <Eyewear item={findItem(l.face)!} x={x} />
        <Headwear item={findItem(l.headwear)!} x={x} />
        </g>
        <Pet item={findItem(l.pet)!} />
      </g>
    </svg>
  );
}
