import { INK } from './Face';
import { shade, type Ctx } from './colors';

/* ---------- hair (back layer, behind head) ---------- */
export function HairBack({ style, x }: { style: string; x: Ctx }) {
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
export function HairFront({ style, x }: { style: string; x: Ctx }) {
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
