import { useId } from 'react';
import { PROPERTIES, decorFor, type DecorItem } from './catalog';
import type { WorldState } from '../lib/types';

/**
 * Your home, drawn as a room you look into (like a doll's house): back wall with a window, side
 * walls, floor and your things in fixed spots. The sky outside follows the real time of day, the
 * shelf shows your real badges and the books you logged.
 */
export function HomeScene({
  world,
  trophies,
  books,
  highlight,
  children,
}: {
  world: WorldState;
  trophies: number;
  books: number;
  /** A spot to softly outline while decorating. */
  highlight?: string;
  /** Your character, laid over the floor. */
  children?: React.ReactNode;
}) {
  const id = useId().replace(/:/g, '');
  const property = PROPERTIES.find((p) => p.id === world.property) ?? PROPERTIES[0];
  const wall = decorFor(world, 'wall');
  const floor = decorFor(world, 'floor');
  const hour = new Date().getHours();
  const time: 'day' | 'dusk' | 'night' = hour >= 7 && hour < 17 ? 'day' : hour >= 17 && hour < 20 ? 'dusk' : 'night';
  const t = property.tier;
  // Bigger homes get wider, taller windows; villa and mansion get a wall of glass.
  const win = t >= 6 ? { x: 150, y: 40, w: 150, h: 150 } : { x: 162 - t * 3, y: 58 - t * 3, w: 96 + t * 8, h: 82 + t * 7 };
  const shade = (hex: string, f: number) => mix(hex, '#000000', f);

  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-[28px] bg-[#120e0b]">
      <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" aria-label={`${property.name}`} role="img">
        <defs>
          <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
            {time === 'day' && (
              <>
                <stop offset="0" stopColor="#7cc4f2" />
                <stop offset="1" stopColor="#d9efff" />
              </>
            )}
            {time === 'dusk' && (
              <>
                <stop offset="0" stopColor="#3b2a63" />
                <stop offset="0.55" stopColor="#e9746a" />
                <stop offset="1" stopColor="#ffc48a" />
              </>
            )}
            {time === 'night' && (
              <>
                <stop offset="0" stopColor="#070b1d" />
                <stop offset="1" stopColor="#1e2a55" />
              </>
            )}
          </linearGradient>
          <radialGradient id={`light${id}`} cx="0.5" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#fff2dc" stopOpacity={time === 'day' ? 0.28 : 0.12} />
            <stop offset="1" stopColor="#000" stopOpacity="0.35" />
          </radialGradient>
          <radialGradient id={`lamp${id}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`floor${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={shade(floor.color ?? '#c9a479', 0.25)} />
            <stop offset="1" stopColor={floor.color ?? '#c9a479'} />
          </linearGradient>
          <clipPath id={`win${id}`}>
            <rect x={win.x} y={win.y} width={win.w} height={win.h} rx="4" />
          </clipPath>
        </defs>

        {/* ceiling, walls */}
        <polygon points="0,0 400,0 340,30 60,30" fill={shade(wall.color ?? '#e9dcc9', 0.45)} />
        <polygon points="0,0 60,30 60,200 0,262" fill={shade(wall.color ?? '#e9dcc9', 0.28)} />
        <polygon points="400,0 340,30 340,200 400,262" fill={shade(wall.color ?? '#e9dcc9', 0.22)} />
        <rect x="60" y="30" width="280" height="170" fill={wall.color} />
        <WallTexture style={wall.style} color={wall.color ?? '#9a5a44'} />
        {/* skirting */}
        <rect x="60" y="194" width="280" height="6" fill={shade(wall.color ?? '#e9dcc9', 0.35)} />

        {/* window */}
        <g clipPath={`url(#win${id})`}>
          <rect x={win.x} y={win.y} width={win.w} height={win.h} fill={`url(#sky${id})`} />
          <WindowView view={property.view} time={time} x={win.x} y={win.y} w={win.w} h={win.h} />
        </g>
        <rect x={win.x} y={win.y} width={win.w} height={win.h} rx="4" fill="none" stroke="#f6efe6" strokeWidth="4" />
        <line x1={win.x + win.w / 2} y1={win.y} x2={win.x + win.w / 2} y2={win.y + win.h} stroke="#f6efe6" strokeWidth="3" />
        {t < 6 && <rect x={win.x - 6} y={win.y + win.h} width={win.w + 12} height="5" rx="2" fill="#f6efe6" />}
        {/* light falling in */}
        <polygon
          points={`${win.x},${win.y + win.h} ${win.x + win.w},${win.y + win.h} ${win.x + win.w + 60},300 ${win.x - 30},300`}
          fill={time === 'night' ? '#9fb4ff' : '#fff1d6'}
          opacity={time === 'night' ? 0.05 : 0.12}
        />

        {/* floor */}
        <polygon points="60,200 340,200 400,262 400,300 0,300 0,262" fill={`url(#floor${id})`} />
        <FloorTexture style={floor.style} color={floor.color ?? '#c9a479'} />

        {/* things */}
        <Spot on={highlight === 'rug'}><Rug item={decorFor(world, 'rug')} /></Spot>
        <Spot on={highlight === 'art'}><Art item={decorFor(world, 'art')} /></Spot>
        <Spot on={highlight === 'shelf'}><Shelf item={decorFor(world, 'shelf')} trophies={trophies} books={books} /></Spot>
        <Spot on={highlight === 'plant'}><Plant item={decorFor(world, 'plant')} /></Spot>
        <Spot on={highlight === 'seat'}><Seat item={decorFor(world, 'seat')} /></Spot>
        <Spot on={highlight === 'desk'}><Desk item={decorFor(world, 'desk')} time={time} /></Spot>
        <Spot on={highlight === 'lamp'}><Lamp item={decorFor(world, 'lamp')} id={id} time={time} /></Spot>

        {/* soft room light and vignette */}
        <rect width="400" height="300" fill={`url(#light${id})`} pointerEvents="none" />
        {time === 'night' && <rect width="400" height="300" fill="#0a0d24" opacity="0.18" pointerEvents="none" />}
      </svg>
      {children && <div className="absolute left-1/2 bottom-[7%] -translate-x-1/2 w-[27%]">{children}</div>}
    </div>
  );
}

function Spot({ on, children }: { on: boolean; children: React.ReactNode }) {
  return <g className={on ? 'world-spot-on' : 'world-spot'}>{children}</g>;
}

/* ---------------------------------------------------------------- textures */

function WallTexture({ style, color }: { style: string; color: string }) {
  if (style === 'brick') {
    const rows = Array.from({ length: 17 }, (_, i) => 30 + i * 10);
    return (
      <g stroke={mix(color, '#000', 0.3)} strokeWidth="1" opacity="0.6">
        {rows.map((y, r) => (
          <g key={y}>
            <line x1="60" y1={y} x2="340" y2={y} />
            {Array.from({ length: 12 }, (_, i) => 60 + i * 24 + (r % 2 ? 12 : 0)).map((x) => (
              <line key={x} x1={x} y1={y} x2={x} y2={y + 10} />
            ))}
          </g>
        ))}
      </g>
    );
  }
  if (style === 'panels') {
    return (
      <g stroke={mix(color, '#000', 0.25)} strokeWidth="1.5" opacity="0.7">
        {Array.from({ length: 13 }, (_, i) => 60 + i * 22).map((x) => (
          <line key={x} x1={x} y1="30" x2={x} y2="200" />
        ))}
      </g>
    );
  }
  return null;
}

function FloorTexture({ style, color }: { style: string; color: string }) {
  const line = mix(color, '#000', 0.25);
  if (style === 'planks') {
    // Boards run toward the back of the room.
    return (
      <g stroke={line} strokeWidth="1" opacity="0.55">
        {Array.from({ length: 11 }, (_, i) => i / 10).map((f) => (
          <line key={f} x1={60 + f * 280} y1="200" x2={-20 + f * 440} y2="300" />
        ))}
      </g>
    );
  }
  if (style === 'tiles') {
    return (
      <g stroke={line} strokeWidth="0.8" opacity="0.45">
        {Array.from({ length: 7 }, (_, i) => i / 6).map((f) => (
          <line key={`v${f}`} x1={60 + f * 280} y1="200" x2={-20 + f * 440} y2="300" />
        ))}
        {[214, 232, 255, 282].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} />
        ))}
      </g>
    );
  }
  return <polygon points="60,200 340,200 400,262 400,300 0,300 0,262" fill="#fff" opacity="0.05" />;
}

/* ---------------------------------------------------------------- window views */

function WindowView({ view, time, x, y, w, h }: { view: string; time: 'day' | 'dusk' | 'night'; x: number; y: number; w: number; h: number }) {
  const base = y + h;
  const night = time === 'night';
  const far = night ? '#1a2244' : time === 'dusk' ? '#6b4a6e' : '#9cb7cc';
  const near = night ? '#10162e' : time === 'dusk' ? '#4a3150' : '#6f8ea8';
  const lit = night ? '#ffd27a' : 'transparent';
  const stars = night
    ? Array.from({ length: 10 }, (_, i) => <circle key={i} cx={x + ((i * 37) % w)} cy={y + ((i * 23) % (h * 0.4))} r="0.9" fill="#fff" opacity="0.8" />)
    : null;
  const sun = time === 'day' ? <circle cx={x + w * 0.78} cy={y + h * 0.22} r="9" fill="#fff6d6" /> : time === 'dusk' ? <circle cx={x + w * 0.3} cy={y + h * 0.62} r="13" fill="#ffd38a" opacity="0.9" /> : <circle cx={x + w * 0.75} cy={y + h * 0.2} r="7" fill="#f3f0e0" />;
  if (view === 'sea' || view === 'cliffs') {
    return (
      <g>
        {stars}
        {sun}
        <rect x={x} y={y + h * 0.62} width={w} height={h * 0.38} fill={night ? '#0c1838' : time === 'dusk' ? '#c06a6a' : '#3f8fc4'} />
        {[0.7, 0.8, 0.9].map((f) => (
          <line key={f} x1={x + 8} y1={y + h * f} x2={x + w - 8} y2={y + h * f} stroke="#fff" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="10 8" />
        ))}
      </g>
    );
  }
  if (view === 'garden' || view === 'hills' || view === 'park') {
    return (
      <g>
        {stars}
        {sun}
        <path d={`M${x} ${base - h * 0.32} Q ${x + w * 0.3} ${base - h * 0.5} ${x + w * 0.6} ${base - h * 0.36} T ${x + w} ${base - h * 0.4} V ${base} H ${x} Z`} fill={night ? '#16241f' : time === 'dusk' ? '#5d4a4a' : '#7fb07a'} />
        <path d={`M${x} ${base - h * 0.15} Q ${x + w * 0.5} ${base - h * 0.3} ${x + w} ${base - h * 0.18} V ${base} H ${x} Z`} fill={night ? '#0f1a16' : time === 'dusk' ? '#3e3438' : '#5d9459'} />
        {[0.18, 0.42, 0.74].map((f) => (
          <g key={f}>
            <rect x={x + w * f - 1.5} y={base - h * 0.28} width="3" height={h * 0.12} fill="#5a3e2b" />
            <circle cx={x + w * f} cy={base - h * 0.3} r={view === 'park' ? 9 : 7} fill={night ? '#183025' : '#3f7f45'} />
          </g>
        ))}
      </g>
    );
  }
  // city / skyline
  const buildings = Array.from({ length: 9 }, (_, i) => {
    const bw = w / 9;
    const bh = h * (0.25 + (((i * 53) % 7) / 7) * (view === 'skyline' ? 0.55 : 0.35));
    return { x: x + i * bw, w: bw - 2, h: bh, layer: i % 2 };
  });
  return (
    <g>
      {stars}
      {sun}
      {buildings.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={base - b.h} width={b.w} height={b.h} fill={b.layer ? far : near} />
          {night &&
            Array.from({ length: Math.floor(b.h / 9) }, (_, r) => (
              <rect key={r} x={b.x + 2 + ((r * 3) % Math.max(1, b.w - 5))} y={base - b.h + 4 + r * 9} width="2.5" height="3" fill={lit} opacity={(r + i) % 3 ? 0.9 : 0.3} />
            ))}
        </g>
      ))}
    </g>
  );
}

/* ---------------------------------------------------------------- things */

function Rug({ item }: { item: DecorItem }) {
  if (item.style === 'none') return null;
  const c = item.color ?? '#b98a6a';
  if (item.style === 'round') return <ellipse cx="200" cy="262" rx="95" ry="22" fill={c} opacity="0.9" />;
  if (item.style === 'stripe') {
    return (
      <g>
        <polygon points="110,236 290,236 320,286 80,286" fill={c} />
        {[0.2, 0.4, 0.6, 0.8].map((f) => (
          <line key={f} x1={110 + f * 180} y1="236" x2={80 + f * 240} y2="286" stroke="#efe6d8" strokeWidth="5" opacity="0.7" />
        ))}
      </g>
    );
  }
  return (
    <g>
      <polygon points="105,234 295,234 325,288 75,288" fill={c} />
      <polygon points="120,240 280,240 303,282 97,282" fill="none" stroke="#d9b36b" strokeWidth="3" />
      <ellipse cx="200" cy="261" rx="40" ry="11" fill="#2a3d6b" opacity="0.8" />
      <ellipse cx="200" cy="261" rx="20" ry="5" fill="#d9b36b" />
    </g>
  );
}

function Art({ item }: { item: DecorItem }) {
  if (item.style === 'none') return null;
  if (item.style === 'neon') {
    return (
      <g className="world-neon">
        <rect x="74" y="64" width="68" height="34" rx="8" fill="#0d1a20" opacity="0.6" />
        <text x="108" y="88" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight="800" fontSize="18" fill="none" stroke={item.color} strokeWidth="1.6" style={{ filter: `drop-shadow(0 0 4px ${item.color})` }}>
          Squzo
        </text>
      </g>
    );
  }
  const frame = item.style === 'gold' ? '#d4a63a' : '#2a221d';
  return (
    <g>
      <rect x="78" y="58" width="60" height={item.style === 'gold' ? 74 : 60} rx="2" fill={frame} />
      <rect x="82" y="62" width="52" height={item.style === 'gold' ? 66 : 52} fill={item.style === 'gold' ? '#3b2d24' : '#efe6d8'} />
      {item.style === 'poster' && (
        <g>
          <circle cx="118" cy="76" r="6" fill={item.color} />
          <polygon points="84,112 102,84 116,104 124,94 134,112" fill="#4b5a6b" />
        </g>
      )}
      {item.style === 'abstract' && (
        <g>
          <circle cx="98" cy="84" r="12" fill={item.color} />
          <rect x="106" y="90" width="22" height="22" fill="#2f4b5a" />
          <path d="M84 108 Q 108 70 132 104" stroke="#d9b36b" strokeWidth="3" fill="none" />
        </g>
      )}
      {item.style === 'gold' && (
        <g>
          <circle cx="108" cy="86" r="11" fill="#c9a07a" />
          <path d="M90 128 Q 108 98 126 128 Z" fill="#6b3a22" />
        </g>
      )}
    </g>
  );
}

function Shelf({ item, trophies, books }: { item: DecorItem; trophies: number; books: number }) {
  if (item.style === 'none') return null;
  const glass = item.style === 'glass';
  const wood = item.color ?? '#7a5236';
  const cups = Math.min(trophies, 4);
  const spines = Math.min(books, 9);
  const spineColors = ['#c86b4e', '#3f5a73', '#d4a63a', '#5d9459', '#8b5cf6', '#e9dcc9', '#2f6b5f', '#d7263d', '#5aa9e6'];
  return (
    <g>
      {glass && <rect x="282" y="64" width="54" height="128" rx="3" fill="#d9e7ee" opacity="0.18" stroke="#e8f4fa" strokeOpacity="0.5" />}
      {[100, 136, 172].map((y) => (
        <rect key={y} x="284" y={y} width="50" height="4" rx="1" fill={glass ? '#e8f4fa' : wood} opacity={glass ? 0.7 : 1} />
      ))}
      {glass && <rect x="284" y="66" width="50" height="3" fill="#fff" opacity="0.8" className="world-neon" />}
      {/* trophies: one cup per badge you earned (up to four) */}
      {Array.from({ length: cups }, (_, i) => (
        <g key={i} transform={`translate(${290 + i * 12} 84)`}>
          <path d="M0 0 H8 V4 Q8 9 4 10 Q0 9 0 4 Z" fill={i === 0 ? '#f0b93a' : i === 1 ? '#c9d3df' : '#c57b3f'} />
          <rect x="3" y="10" width="2" height="3" fill="#8a5d07" />
          <rect x="1" y="13" width="6" height="3" fill="#3a2a1a" />
        </g>
      ))}
      {cups === 0 && <text x="309" y="96" textAnchor="middle" fontSize="6" fill="#fff" opacity="0.4">badges here</text>}
      {/* books: one spine per book you logged */}
      {Array.from({ length: spines }, (_, i) => (
        <rect key={i} x={287 + i * 5.2} y={i % 3 === 0 ? 116 : 120} width="4.4" height={i % 3 === 0 ? 20 : 16} fill={spineColors[i]} />
      ))}
      {spines === 0 && <text x="309" y="132" textAnchor="middle" fontSize="6" fill="#fff" opacity="0.4">your books</text>}
      <rect x="292" y="156" width="16" height="16" rx="2" fill="#2a221d" />
      <circle cx="320" cy="164" r="7" fill="#e9dcc9" />
    </g>
  );
}

function Plant({ item }: { item: DecorItem }) {
  if (item.style === 'none') return null;
  if (item.style === 'small') {
    return (
      <g>
        <rect x="240" y="190" width="14" height="12" rx="2" fill="#c86b4e" />
        <path d="M247 190 q-8 -10 -2 -16 q4 8 2 16 q6 -12 10 -12 q-2 8 -10 12" fill="#5d9459" />
      </g>
    );
  }
  if (item.style === 'monstera') {
    return (
      <g>
        <path d="M66 236 h30 l-4 26 h-22 Z" fill="#efe6d8" />
        {[[-26, -50], [-8, -64], [12, -54], [24, -36], [-30, -28]].map(([dx, dy], i) => (
          <g key={i}>
            <line x1="81" y1="236" x2={81 + dx * 0.8} y2={236 + dy * 0.8} stroke="#3f6b3a" strokeWidth="2" />
            <ellipse cx={81 + dx} cy={236 + dy} rx="14" ry="10" fill={i % 2 ? '#3f7f45' : '#4c9152'} transform={`rotate(${dx} ${81 + dx} ${236 + dy})`} />
          </g>
        ))}
      </g>
    );
  }
  return (
    <g>
      <path d="M62 240 h36 l-5 28 h-26 Z" fill="#3a3330" />
      <path d="M80 240 C 78 210 84 190 80 160" stroke="#6b5a45" strokeWidth="4" fill="none" />
      {Array.from({ length: 14 }, (_, i) => (
        <ellipse key={i} cx={64 + ((i * 29) % 36)} cy={150 + ((i * 17) % 50)} rx="7" ry="3" fill={i % 2 ? '#8aa07a' : '#a3b58f'} transform={`rotate(${(i * 40) % 180} ${64 + ((i * 29) % 36)} ${150 + ((i * 17) % 50)})`} />
      ))}
    </g>
  );
}

function Seat({ item }: { item: DecorItem }) {
  const c = item.color ?? '#cfc3b2';
  const dark = mix(c, '#000', 0.25);
  if (item.style === 'beanbag') {
    return (
      <g>
        <ellipse cx="128" cy="262" rx="34" ry="8" fill="#000" opacity="0.25" />
        <path d="M96 262 Q 92 224 122 220 Q 156 218 160 260 Z" fill={c} />
        <path d="M104 240 Q 126 230 150 242" stroke={dark} strokeWidth="2" fill="none" />
      </g>
    );
  }
  const chester = item.style === 'chesterfield';
  return (
    <g>
      <ellipse cx="128" cy="266" rx="62" ry="8" fill="#000" opacity="0.28" />
      <rect x="70" y="214" width="116" height="34" rx={chester ? 6 : 10} fill={dark} />
      <rect x="76" y="232" width="104" height="24" rx="6" fill={c} />
      <rect x="64" y="226" width="16" height="34" rx="6" fill={c} />
      <rect x="176" y="226" width="16" height="34" rx="6" fill={c} />
      {chester &&
        Array.from({ length: 8 }, (_, i) => <circle key={i} cx={82 + i * 13} cy="224" r="1.4" fill="#2a160c" />)}
      <rect x="84" y="222" width="22" height="14" rx="4" fill={mix(c, '#fff', 0.2)} />
      <rect x="72" y="258" width="4" height="8" fill="#2a221d" />
      <rect x="180" y="258" width="4" height="8" fill="#2a221d" />
    </g>
  );
}

function Desk({ item, time }: { item: DecorItem; time: string }) {
  if (item.style === 'none') return null;
  const c = item.color ?? '#c9a479';
  const glow = time === 'night' ? 0.9 : 0.6;
  return (
    <g>
      <ellipse cx="318" cy="276" rx="58" ry="7" fill="#000" opacity="0.28" />
      <rect x="266" y="226" width="104" height="8" rx="2" fill={c} />
      {item.style === 'exec' ? (
        <rect x="270" y="234" width="96" height="40" rx="2" fill={mix(c, '#000', 0.2)} />
      ) : (
        <>
          <rect x="270" y="234" width="4" height="40" fill={mix(c, '#000', 0.3)} />
          <rect x="362" y="234" width="4" height="40" fill={mix(c, '#000', 0.3)} />
        </>
      )}
      {/* screen(s) */}
      <rect x="296" y="196" width="44" height="28" rx="2" fill="#15171c" />
      <rect x="299" y="199" width="38" height="22" fill={item.style === 'gaming' ? '#3b2a63' : item.style === 'studio' ? '#e9dcc9' : '#2b4f6e'} opacity={glow} />
      {item.style === 'gaming' && (
        <>
          <rect x="344" y="200" width="22" height="24" rx="2" fill="#15171c" />
          <rect x="346" y="202" width="18" height="20" fill="#22d3ee" opacity={glow * 0.6} />
          <rect x="272" y="222" width="94" height="2" fill="#f472b6" className="world-neon" />
        </>
      )}
      {item.style === 'studio' && <circle cx="356" cy="210" r="8" fill="none" stroke="#2a221d" strokeWidth="3" />}
      <rect x="316" y="224" width="4" height="3" fill="#15171c" />
      {item.style === 'exec' && <rect x="276" y="218" width="12" height="8" rx="1" fill="#d4a63a" />}
    </g>
  );
}

function Lamp({ item, id, time }: { item: DecorItem; id: string; time: string }) {
  if (item.style === 'none') return null;
  const on = time !== 'day';
  const c = item.color ?? '#e8d9c2';
  if (item.style === 'tube') {
    return (
      <g className="world-neon">
        <rect x="26" y="120" width="5" height="120" rx="2.5" fill={c} style={{ filter: `drop-shadow(0 0 6px ${c})` }} />
        {on && <circle cx="28" cy="180" r="50" fill={c} opacity="0.12" />}
      </g>
    );
  }
  if (item.style === 'arc') {
    return (
      <g>
        {on && <circle cx="150" cy="150" r="60" fill={`url(#lamp${id})`} />}
        <path d="M30 262 V 120 Q 40 80 140 120" stroke={c} strokeWidth="3" fill="none" />
        <path d="M130 116 h22 l-4 12 h-14 Z" fill={c} />
        <ellipse cx="30" cy="264" rx="10" ry="3" fill="#2a221d" />
      </g>
    );
  }
  return (
    <g>
      {on && <circle cx="34" cy="150" r="50" fill={`url(#lamp${id})`} />}
      <rect x="32" y="150" width="3" height="110" fill="#3a2f27" />
      <path d="M22 130 h26 l-5 22 h-16 Z" fill={c} />
      <ellipse cx="33" cy="262" rx="10" ry="3" fill="#2a221d" />
    </g>
  );
}

/** Mixes two hex colours (f = share of the second). */
function mix(a: string, b: string, f: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const m = (s: number) => Math.round(ch(pa, s) * (1 - f) + ch(pb, s) * f);
  return `#${((m(16) << 16) | (m(8) << 8) | m(0)).toString(16).padStart(6, '0')}`;
}
