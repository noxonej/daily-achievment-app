import {  type AvatarItem } from '../../data/avatar';
import { shade, star, type Ctx } from './colors';

/* ---------- headwear ---------- */
export function Headwear({ item, x }: { item: AvatarItem; x: Ctx }) {
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
