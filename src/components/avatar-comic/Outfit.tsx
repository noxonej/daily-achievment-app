import {  type AvatarItem } from '../../data/avatar';
import { shade, star, type Ctx } from './colors';

/* ---------- outfit ---------- */
// Natural sloped shoulders (not a round blob).
const TORSO = 'M9 100 C9.5 89 14 83.5 23 80.5 C31 77.8 39 75.4 45 74.4 H55 C61 75.4 69 77.8 77 80.5 C86 83.5 90.5 89 91 100 Z';

export function Outfit({ item, x }: { item: AvatarItem; x: Ctx }) {
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
