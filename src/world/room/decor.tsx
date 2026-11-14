import { shade, tint } from './paint';
import type { DrawProps } from './furniture';

/** Wall and floor models: posters, art, shelves, window treatments, lights, rugs, plants, lamps, collectibles. */

const Shadow = ({ cx, cy, rx, ry = 9, o = 0.3 }: { cx: number; cy: number; rx: number; ry?: number; o?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#rsh)" opacity={o} />
);

/* ================================================================ POSTERS above the bed (x 110–260, y 108–252) */

const Frame = ({ x, y, w, h, frame = '#f4f1ec', mat = true, children }: { x: number; y: number; w: number; h: number; frame?: string; mat?: boolean; children: React.ReactNode }) => (
  <g>
    <rect x={x + 3} y={y + 5} width={w} height={h} rx={2} fill="#000" opacity={0.18} />
    <rect x={x} y={y} width={w} height={h} rx={2} fill={frame} />
    <g>
      <rect x={x + (mat ? 8 : 4)} y={y + (mat ? 8 : 4)} width={w - (mat ? 16 : 8)} height={h - (mat ? 16 : 8)} fill="#fff" />
      <svg x={x + (mat ? 8 : 4)} y={y + (mat ? 8 : 4)} width={w - (mat ? 16 : 8)} height={h - (mat ? 16 : 8)} viewBox="0 0 100 130" preserveAspectRatio="xMidYMid slice">
        {children}
      </svg>
    </g>
  </g>
);

export const POSTERS: Record<string, (p: DrawProps) => React.ReactNode> = {
  none: () => null,
  mountain: ({ c }) => (
    <Frame x={120} y={110} w={130} h={150}>
      <rect width={100} height={130} fill={tint(c, 0.75)} />
      <circle cx={70} cy={40} r={14} fill={c} />
      <path d="M0 110 L34 58 L52 82 L70 52 L100 100 V130 H0 Z" fill={shade(c, 0.35)} />
      <path d="M34 58 L42 70 L30 74 Z M70 52 L78 64 L64 66 Z" fill="#fff" />
      <path d="M0 118 L40 92 L100 116 V130 H0 Z" fill={shade(c, 0.55)} />
    </Frame>
  ),
  /** Space mission poster: planet, rocket trail, stars. */
  space: () => (
    <Frame x={120} y={110} w={130} h={150} frame="#1f2430" mat={false}>
      <rect width={100} height={130} fill="#0e1430" />
      {[[12, 14], [80, 20], [30, 50], [88, 70], [8, 96], [60, 10], [46, 30]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={1.2} fill="#fff" />
      ))}
      <circle cx={64} cy={92} r={30} fill="#f97316" />
      <ellipse cx={64} cy={92} rx={46} ry={8} fill="none" stroke="#fde68a" strokeWidth={2} transform="rotate(-18 64 92)" />
      <path d="M26 70 L40 40 L46 46 Z" fill="#e5e7eb" />
      <path d="M26 70 Q18 84 10 100" stroke="#fde68a" strokeWidth={3} fill="none" opacity={0.7} />
      <rect x={10} y={112} width={50} height={6} fill="#fff" opacity={0.9} />
    </Frame>
  ),
  /** City at night skyline print. */
  city: ({ c }) => (
    <Frame x={120} y={110} w={130} h={150} frame="#262a33">
      <rect width={100} height={130} fill={shade(c, 0.6)} />
      <circle cx={74} cy={28} r={10} fill="#fef3c7" />
      {[[4, 70, 14], [20, 50, 12], [34, 64, 16], [52, 40, 12], [66, 58, 14], [82, 46, 16]].map(([x, y, w]) => (
        <g key={x}>
          <rect x={x} y={y} width={w} height={130 - y} fill={shade(c, 0.35)} />
          {Array.from({ length: Math.floor((120 - y) / 10) }, (_, i) => (
            <rect key={i} x={x + 3} y={y + 6 + i * 10} width={3} height={4} fill="#fde68a" opacity={i % 3 ? 0.8 : 0.25} />
          ))}
        </g>
      ))}
    </Frame>
  ),
  /** Bold motivational typography. */
  quote: ({ c }) => (
    <Frame x={120} y={110} w={130} h={150} frame="#111214" mat={false}>
      <rect width={100} height={130} fill={c} />
      <text x={10} y={40} fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={20} fill="#fff">YOU</text>
      <text x={10} y={64} fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={20} fill="#111">VS.</text>
      <text x={10} y={88} fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={20} fill="#fff">YOU</text>
      <rect x={10} y={104} width={40} height={4} fill="#fff" />
    </Frame>
  ),
  /** Supercar silhouette poster. */
  car: () => (
    <Frame x={112} y={120} w={146} h={110} frame="#e5e1da">
      <rect width={100} height={130} fill="#ebe5da" />
      <path d="M6 82 Q14 70 34 66 L56 52 Q72 48 86 60 L96 66 Q100 76 94 84 Z" fill="#c1121f" />
      <path d="M40 64 L56 54 Q66 52 74 60 Z" fill="#1f2937" />
      <circle cx={26} cy={84} r={9} fill="#111" />
      <circle cx={78} cy={84} r={9} fill="#111" />
      <circle cx={26} cy={84} r={4} fill="#9ca3af" />
      <circle cx={78} cy={84} r={4} fill="#9ca3af" />
      <rect x={6} y={104} width={60} height={5} fill="#111" />
      <rect x={6} y={112} width={36} height={3} fill="#111" opacity={0.6} />
    </Frame>
  ),
  /** Pixel game poster. */
  game: () => (
    <Frame x={120} y={110} w={130} h={150} frame="#312e81" mat={false}>
      <rect width={100} height={130} fill="#1e1b4b" />
      {[[30, 30], [40, 30], [50, 30], [60, 30], [20, 40], [70, 40], [20, 50], [40, 50], [60, 50], [70, 50], [20, 60], [30, 60], [40, 60], [50, 60], [60, 60], [70, 60], [30, 70], [60, 70], [20, 80], [70, 80]].map(([x, y]) => (
        <rect key={`${x}${y}`} x={x} y={y} width={10} height={10} fill="#a5b4fc" />
      ))}
      <rect x={40} y={50} width={10} height={10} fill="#1e1b4b" />
      <rect x={10} y={104} width={80} height={8} fill="#facc15" />
    </Frame>
  ),
  /** Vinyl record in a shadow box. */
  vinyl: () => (
    <g>
      <rect x={124} y={118} width={124} height={124} rx={3} fill="#000" opacity={0.18} />
      <rect x={120} y={114} width={124} height={124} rx={3} fill="#1b1b1f" />
      <circle cx={182} cy={176} r={50} fill="#0b0b0d" />
      {[44, 36, 28].map((r) => (
        <circle key={r} cx={182} cy={176} r={r} fill="none" stroke="#2a2a30" strokeWidth={1} />
      ))}
      <circle cx={182} cy={176} r={16} fill="#ef4444" />
      <circle cx={182} cy={176} r={2} fill="#111" />
    </g>
  ),
  /** Three small gallery frames in a row. */
  trio: ({ c }) => (
    <g>
      <Frame x={102} y={134} w={52} h={70}>
        <rect width={100} height={130} fill={tint(c, 0.6)} />
        <circle cx={50} cy={60} r={30} fill={c} />
      </Frame>
      <Frame x={160} y={118} w={56} h={100}>
        <rect width={100} height={130} fill="#efe9df" />
        <path d="M10 120 Q50 20 90 120" stroke={shade(c, 0.3)} strokeWidth={8} fill="none" />
      </Frame>
      <Frame x={222} y={140} w={52} h={64}>
        <rect width={100} height={130} fill={shade(c, 0.4)} />
        <rect x={20} y={30} width={60} height={70} fill={tint(c, 0.3)} />
      </Frame>
    </g>
  ),
};

/* ================================================================ WALL ART (x 745–840, y 100–245) */

export const ART: Record<string, (p: DrawProps & { night: boolean }) => React.ReactNode> = {
  none: () => null,
  poster: ({ c }) => (
    <Frame x={748} y={110} w={90} h={120}>
      <rect width={100} height={130} fill={tint(c, 0.7)} />
      <circle cx={68} cy={38} r={14} fill={c} />
      <path d="M0 110 L36 60 L54 84 L70 56 L100 100 V130 H0 Z" fill={shade(c, 0.35)} />
    </Frame>
  ),
  abstract: ({ c }) => (
    <g>
      <rect x={752} y={112} width={86} height={128} fill="#000" opacity={0.18} />
      <rect x={748} y={106} width={86} height={128} fill="#f3eee6" />
      <circle cx={782} cy={150} r={24} fill={c} />
      <rect x={790} y={170} width={36} height={52} fill={shade(c, 0.4)} />
      <path d="M756 220 Q790 180 828 214" stroke="#1f2937" strokeWidth={4} fill="none" />
    </g>
  ),
  /** Soft neon script: a calm glow, not a rave. */
  neon: ({ c, night }) => (
    <g>
      <rect x={744} y={130} width={96} height={70} rx={8} fill="#000" opacity={0.08} />
      <path d="M758 172 Q764 150 780 156 Q792 162 784 176 Q776 190 792 186 Q806 182 806 166 Q812 154 824 160" stroke={c} strokeWidth={night ? 5 : 4} fill="none" strokeLinecap="round" opacity={night ? 1 : 0.85} />
      {night && <path d="M758 172 Q764 150 780 156 Q792 162 784 176 Q776 190 792 186 Q806 182 806 166 Q812 154 824 160" stroke={c} strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.18} />}
    </g>
  ),
  gold: ({ c }) => (
    <g>
      <rect x={752} y={110} width={86} height={118} rx={4} fill="#000" opacity={0.2} />
      <rect x={746} y={102} width={88} height={120} rx={4} fill={c} />
      <rect x={754} y={110} width={72} height={104} fill="#3f2d1d" />
      <ellipse cx={790} cy={150} rx={16} ry={20} fill="#e2b48c" />
      <path d="M766 214 Q790 172 814 214 Z" fill="#1f2937" />
      <rect x={746} y={102} width={88} height={120} rx={4} fill="none" stroke={tint(c, 0.4)} strokeWidth={2} />
    </g>
  ),
  /** Wall clock with moving hands. */
  clock: ({ c }) => {
    const now = new Date();
    const m = now.getMinutes() * 6;
    const h = (now.getHours() % 12) * 30 + now.getMinutes() / 2;
    return (
      <g>
        <circle cx={792} cy={168} r={44} fill="#000" opacity={0.15} />
        <circle cx={790} cy={164} r={44} fill={c} />
        <circle cx={790} cy={164} r={38} fill="#f8f6f2" />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={789} y={130} width={2} height={i % 3 ? 4 : 7} fill="#333" transform={`rotate(${i * 30} 790 164)`} />
        ))}
        <rect x={788.5} y={140} width={3} height={26} rx={1.5} fill="#222" transform={`rotate(${h} 790 164)`} />
        <rect x={789} y={132} width={2} height={34} rx={1} fill="#222" transform={`rotate(${m} 790 164)`} />
        <circle cx={790} cy={164} r={3} fill={c} />
      </g>
    );
  },
  /** World map with pins of places to go. */
  map: ({ c }) => (
    <g>
      <rect x={742} y={116} width={104} height={84} fill="#000" opacity={0.15} />
      <rect x={738} y={110} width={104} height={84} fill="#ece6d6" />
      <path d="M748 140 Q760 128 774 136 L778 152 Q766 162 756 156 Z M784 128 Q800 120 812 130 L806 146 Q792 148 788 140 Z M790 156 Q802 152 806 166 L798 182 Q788 176 790 156 Z M816 150 Q830 144 836 158 Q828 170 818 164 Z" fill={c} opacity={0.75} />
      {[[766, 142], [800, 132], [826, 156]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={3} fill="#ef4444" />
      ))}
    </g>
  ),
  /** Electric guitar on a wall hook. */
  guitar: ({ c }) => (
    <g>
      <rect x={784} y={92} width={12} height={6} rx={2} fill="#3a3a3a" />
      <rect x={786} y={96} width={8} height={78} fill="#d6b58a" />
      {[110, 124, 138, 152, 166].map((y) => (
        <rect key={y} x={786} y={y} width={8} height={1.5} fill="#8a6d4a" />
      ))}
      <path d="M770 178 Q762 194 772 210 Q780 226 790 222 Q800 228 810 214 Q820 196 808 182 Q802 172 790 174 Q778 170 770 178 Z" fill={c} />
      <rect x={780} y={196} width={20} height={4} rx={1} fill="#1a1a1a" />
      <rect x={780} y={204} width={20} height={4} rx={1} fill="#1a1a1a" />
    </g>
  ),
};

/* ================================================================ SHELVES above the desk (x 880–1100, y 100–200) */

const TROPHY = ['#f0b93a', '#c0c7d1', '#d08a4a', '#7dd3fc', '#f0b93a', '#a78bfa'];

function Trophies({ n, x0, y, max = 5 }: { n: number; x0: number; y: number; max?: number }) {
  return (
    <g>
      {Array.from({ length: Math.min(n, max) }, (_, i) => {
        const x = x0 + i * 22;
        const col = TROPHY[i % TROPHY.length];
        return (
          <g key={i}>
            <rect x={x} y={y - 6} width={14} height={6} fill={shade(col, 0.4)} />
            <rect x={x + 5} y={y - 14} width={4} height={8} fill={col} />
            <path d={`M${x} ${y - 28} H${x + 14} V${y - 22} Q${x + 14} ${y - 13} ${x + 7} ${y - 13} Q${x} ${y - 13} ${x} ${y - 22} Z`} fill={col} />
          </g>
        );
      })}
    </g>
  );
}

function Books({ n, x0, y, max = 7 }: { n: number; x0: number; y: number; max?: number }) {
  const cols = ['#b91c1c', '#1d4ed8', '#047857', '#a16207', '#6d28d9', '#334155', '#be185d'];
  return (
    <g>
      {Array.from({ length: Math.min(Math.max(n, 2), max) }, (_, i) => {
        const h = 22 + ((i * 7) % 9);
        return <rect key={i} x={x0 + i * 7} y={y - h} width={6} height={h} fill={cols[i % cols.length]} />;
      })}
    </g>
  );
}

export const SHELVES: Record<string, (p: DrawProps & { trophies: number; books: number }) => React.ReactNode> = {
  none: () => null,
  /** One plank with your real badges as trophies, plus your logged books. */
  trophy: ({ c, trophies, books }) => (
    <g>
      <rect x={890} y={182} width={200} height={10} rx={2} fill={c} />
      <rect x={890} y={190} width={200} height={4} fill="#000" opacity={0.2} />
      <Trophies n={Math.max(1, trophies)} x0={902} y={182} />
      <Books n={books} x0={1030} y={182} />
    </g>
  ),
  /** Two floating shelves, staggered. */
  floating: ({ c, trophies, books }) => (
    <g>
      <rect x={884} y={140} width={120} height={8} rx={2} fill={c} />
      <rect x={976} y={196} width={126} height={8} rx={2} fill={c} />
      <rect x={884} y={146} width={120} height={4} fill="#000" opacity={0.15} />
      <rect x={976} y={202} width={126} height={4} fill="#000" opacity={0.15} />
      <Books n={books + 3} x0={892} y={140} max={6} />
      <circle cx={958} cy={128} r={10} fill="#4ade80" />
      <rect x={952} y={128} width={12} height={12} rx={2} fill="#e5e7eb" />
      <Trophies n={Math.max(1, trophies)} x0={986} y={196} max={5} />
    </g>
  ),
  /** Pegboard with tools, headphones and small frames. */
  pegboard: ({ c }) => (
    <g>
      <rect x={890} y={96} width={200} height={110} rx={4} fill={c} />
      {Array.from({ length: 9 }, (_, i) =>
        Array.from({ length: 5 }, (_, j) => <circle key={`${i}${j}`} cx={902 + i * 22} cy={106 + j * 22} r={1.6} fill={shade(c, 0.35)} />),
      )}
      <path d="M914 116 Q914 100 930 100 Q946 100 946 116" stroke="#1f2937" strokeWidth={4} fill="none" />
      <rect x={908} y={114} width={10} height={16} rx={3} fill="#1f2937" />
      <rect x={942} y={114} width={10} height={16} rx={3} fill="#1f2937" />
      <rect x={972} y={120} width={36} height={46} fill="#f8fafc" />
      <rect x={976} y={124} width={28} height={30} fill="#38bdf8" opacity={0.6} />
      <rect x={1024} y={112} width={6} height={60} rx={3} fill="#f59e0b" />
      <rect x={1040} y={150} width={40} height={6} rx={2} fill={shade(c, 0.4)} />
      <circle cx={1050} cy={142} r={7} fill="#f472b6" />
      <rect x={1062} y={130} width={14} height={20} rx={2} fill="#a3e635" />
    </g>
  ),
  /** Lit glass display cabinet (wall mounted). */
  glass: ({ c, trophies, night }) => (
    <g>
      <rect x={894} y={94} width={192} height={112} rx={4} fill={shade(c, 0.5)} />
      <rect x={900} y={100} width={180} height={100} rx={2} fill={night ? '#2a3240' : '#cfd8e3'} opacity={0.85} />
      <rect x={900} y={100} width={180} height={4} fill="#fff7e0" opacity={night ? 0.9 : 0.5} />
      <rect x={900} y={148} width={180} height={4} fill={c} />
      <Trophies n={Math.max(2, trophies)} x0={912} y={148} max={7} />
      <Trophies n={Math.max(1, trophies - 7)} x0={930} y={198} max={6} />
      <path d="M904 104 L940 104 L904 160 Z" fill="#fff" opacity={0.15} />
    </g>
  ),
  /** Shelf of sneakers in a row. */
  sneakers: ({ c }) => (
    <g>
      {[150, 200].map((y) => (
        <g key={y}>
          <rect x={890} y={y} width={200} height={7} rx={2} fill={c} />
          {[0, 1, 2, 3].map((i) => {
            const col = ['#f8fafc', '#ef4444', '#111827', '#22c55e', '#f59e0b', '#3b82f6', '#e5e7eb', '#a855f7'][(i + y / 50) % 8];
            const x = 900 + i * 48;
            return (
              <g key={i}>
                <path d={`M${x} ${y} V${y - 14} Q${x + 6} ${y - 22} ${x + 16} ${y - 18} L${x + 22} ${y - 10} Q${x + 36} ${y - 8} ${x + 38} ${y} Z`} fill={col} />
                <path d={`M${x} ${y - 2} H${x + 38}`} stroke="#fff" strokeWidth={3} />
              </g>
            );
          })}
        </g>
      ))}
    </g>
  ),
};

/* ================================================================ WINDOW treatments (given the window rect) */

export interface Win {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const WINDOWS: Record<string, (p: DrawProps & { win: Win }) => React.ReactNode> = {
  plain: () => null,
  /** Floor-length curtains on a rod, gently swaying. */
  curtains: ({ c, win }) => (
    <g>
      <rect x={win.x - 40} y={win.y - 18} width={win.w + 80} height={5} rx={2} fill="#3b3b3b" />
      {[-1, 1].map((side) => {
        const x = side < 0 ? win.x - 36 : win.x + win.w - 8;
        return (
          <g key={side} className="room-curtain" style={{ transformOrigin: `${x + 22}px ${win.y - 14}px` }}>
            <path d={`M${x} ${win.y - 14} H${x + 44} Q${x + 48} ${win.y + win.h * 0.6} ${x + 40} ${win.y + win.h + 40} H${x + 4} Q${x - 4} ${win.y + win.h * 0.6} ${x} ${win.y - 14} Z`} fill={c} />
            {[10, 22, 34].map((d) => (
              <path key={d} d={`M${x + d} ${win.y - 10} Q${x + d + 2} ${win.y + win.h * 0.6} ${x + d - 1} ${win.y + win.h + 38}`} stroke={shade(c, 0.15)} strokeWidth={2} fill="none" />
            ))}
          </g>
        );
      })}
    </g>
  ),
  /** Half-lowered wooden blinds. */
  blinds: ({ c, win }) => (
    <g>
      <rect x={win.x - 6} y={win.y - 8} width={win.w + 12} height={10} rx={2} fill={shade(c, 0.2)} />
      {Array.from({ length: Math.floor(win.h * 0.45 / 9) }, (_, i) => (
        <rect key={i} x={win.x - 2} y={win.y + 2 + i * 9} width={win.w + 4} height={6} rx={1} fill={i % 2 ? c : tint(c, 0.06)} />
      ))}
      <path d={`M${win.x + 12} ${win.y} V${win.y + win.h * 0.5} M${win.x + win.w - 12} ${win.y} V${win.y + win.h * 0.5}`} stroke={shade(c, 0.3)} strokeWidth={1} />
    </g>
  ),
  /** Sheer white drapes that let the light through. */
  sheer: ({ win }) => (
    <g opacity={0.55}>
      <rect x={win.x - 30} y={win.y - 16} width={win.w + 60} height={3} fill="#cbd5e1" />
      <path className="room-curtain" style={{ transformOrigin: `${win.x}px ${win.y}px` }} d={`M${win.x - 26} ${win.y - 14} H${win.x + win.w * 0.35} Q${win.x + win.w * 0.28} ${win.y + win.h * 0.6} ${win.x + win.w * 0.12} ${win.y + win.h + 36} H${win.x - 20} Z`} fill="#fff" />
      <path className="room-curtain" style={{ transformOrigin: `${win.x + win.w}px ${win.y}px` }} d={`M${win.x + win.w + 26} ${win.y - 14} H${win.x + win.w * 0.65} Q${win.x + win.w * 0.72} ${win.y + win.h * 0.6} ${win.x + win.w * 0.88} ${win.y + win.h + 36} H${win.x + win.w + 20} Z`} fill="#fff" />
    </g>
  ),
  /** Velvet drapes with tie-backs and a valance. */
  velvet: ({ c, a, win }) => (
    <g>
      {[-1, 1].map((side) => {
        const x0 = side < 0 ? win.x - 44 : win.x + win.w + 44;
        const xi = side < 0 ? win.x + 16 : win.x + win.w - 16;
        return (
          <g key={side}>
            <path d={`M${x0} ${win.y - 16} L${xi} ${win.y - 16} Q${xi - side * 10} ${win.y + win.h * 0.45} ${x0 + side * -18} ${win.y + win.h * 0.55} Q${x0 + side * -10} ${win.y + win.h} ${x0 + side * -12} ${win.y + win.h + 44} L${x0} ${win.y + win.h + 44} Z`} fill={c} />
            <ellipse cx={x0 + side * -16} cy={win.y + win.h * 0.55} rx={8} ry={5} fill={a} />
          </g>
        );
      })}
      <path d={`M${win.x - 48} ${win.y - 24} H${win.x + win.w + 48} V${win.y + 4} Q${win.x + win.w * 0.75} ${win.y + 20} ${win.x + win.w / 2} ${win.y + 6} Q${win.x + win.w * 0.25} ${win.y + 20} ${win.x - 48} ${win.y + 4} Z`} fill={shade(c, 0.1)} />
      <path d={`M${win.x - 48} ${win.y - 20} H${win.x + win.w + 48}`} stroke={a} strokeWidth={3} />
    </g>
  ),
};

/* ================================================================ LIGHTS (ceiling / ambient) */

export const LIGHTS: Record<string, (p: DrawProps) => React.ReactNode> = {
  /** A bare bulb on a cord. */
  bulb: ({ night }) => (
    <g>
      <path d="M600 28 V92" stroke="#2a2a2a" strokeWidth={2} />
      <rect x={595} y={90} width={10} height={8} fill="#6b7280" />
      <circle cx={600} cy={106} r={10} fill={night ? '#fff3c4' : '#f6efe0'} />
    </g>
  ),
  /** Scandinavian dome pendant. */
  pendant: ({ c, night }) => (
    <g>
      <path d="M600 28 V100" stroke="#2a2a2a" strokeWidth={2} />
      <path d="M560 136 Q562 100 600 98 Q638 100 640 136 Z" fill={c} />
      <ellipse cx={600} cy={136} rx={40} ry={5} fill={night ? '#fff1c2' : shade(c, 0.25)} />
    </g>
  ),
  /** Warm fairy lights draped across the wall. */
  fairy: ({ night }) => {
    const pts = Array.from({ length: 24 }, (_, i) => {
      const x = 60 + i * 30;
      const y = 50 + Math.sin(i * 0.9) * 10 + (i % 6 === 3 ? 14 : 0);
      return [x, y];
    });
    return (
      <g>
        <path d={`M${pts.map((p) => p.join(' ')).join(' L')}`} stroke="#3a3a3a" strokeWidth={1.2} fill="none" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y + 4} r={3.4} fill={night ? '#ffd27a' : '#f3dfb4'} className={night ? 'room-twinkle' : ''} style={{ animationDelay: `${(i % 7) * 0.4}s` }} />
        ))}
      </g>
    );
  },
  /** LED strip along the ceiling edge (soft, one colour). */
  led: ({ c, night }) => (
    <g>
      <rect x={0} y={28} width={1200} height={4} fill={c} opacity={night ? 0.95 : 0.5} />
      {night && <rect x={0} y={32} width={1200} height={40} fill="url(#ledfall)" style={{ color: c }} opacity={0.5} />}
    </g>
  ),
  /** Crystal chandelier. */
  chandelier: ({ c, night }) => (
    <g>
      <path d="M600 28 V70" stroke={c} strokeWidth={3} />
      <path d="M540 100 Q600 130 660 100" stroke={c} strokeWidth={4} fill="none" />
      <path d="M560 88 Q600 108 640 88" stroke={c} strokeWidth={3} fill="none" />
      <circle cx={600} cy={74} r={6} fill={c} />
      {[540, 560, 580, 600, 620, 640, 660].map((x, i) => (
        <g key={x}>
          <path d={`M${x} ${100 + Math.abs(3 - i) * -3} V${116 + Math.abs(3 - i) * -3}`} stroke={tint(c, 0.4)} strokeWidth={1.5} />
          <path d={`M${x} ${116 + Math.abs(3 - i) * -3} l4 8 l-4 8 l-4 -8 Z`} fill={night ? '#fff7dc' : '#e8f1ff'} opacity={0.9} />
        </g>
      ))}
    </g>
  ),
  /** Track spotlights. */
  track: ({ c }) => (
    <g>
      <rect x={300} y={28} width={600} height={6} fill={c} />
      {[360, 520, 680, 840].map((x, i) => (
        <g key={x} transform={`rotate(${i % 2 ? 16 : -16} ${x} 34)`}>
          <rect x={x - 3} y={34} width={6} height={10} fill={c} />
          <rect x={x - 9} y={44} width={18} height={22} rx={4} fill={shade(c, 0.1)} />
        </g>
      ))}
    </g>
  ),
};

/* ================================================================ LAMPS (x 345–405, floor y≈445) */

export const LAMPS: Record<string, (p: DrawProps) => React.ReactNode> = {
  none: () => null,
  /** Classic floor lamp with a drum shade. */
  floor: ({ c, night }) => (
    <g>
      <Shadow cx={376} cy={446} rx={26} ry={5} />
      <ellipse cx={376} cy={442} rx={18} ry={4} fill="#2e2e2e" />
      <rect x={374} y={290} width={4} height={152} fill="#3a3a3a" />
      <path d="M352 296 L358 254 H394 L400 296 Z" fill={c} />
      {night && <path d="M352 296 L358 254 H394 L400 296 Z" fill="#ffd9a0" opacity={0.35} />}
    </g>
  ),
  /** Arc lamp curving over the sofa. */
  arc: ({ c, night }) => (
    <g>
      <rect x={350} y={430} width={34} height={14} rx={3} fill="#e5e5e5" />
      <path d="M367 432 V300 Q370 200 450 196 Q480 196 490 214" stroke={c} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M468 214 Q490 196 512 214 Z" fill={c} />
      <ellipse cx={490} cy={214} rx={22} ry={4} fill={night ? '#fff1c2' : shade(c, 0.2)} />
    </g>
  ),
  /** Tall LED tube in a stand. */
  tube: ({ c, night }) => (
    <g>
      <ellipse cx={376} cy={444} rx={14} ry={4} fill="#1f1f1f" />
      <rect x={371} y={250} width={10} height={194} rx={5} fill={night ? c : tint(c, 0.4)} opacity={night ? 1 : 0.85} />
      {night && <rect x={364} y={244} width={24} height={206} rx={12} fill={c} opacity={0.2} />}
    </g>
  ),
  /** Wooden tripod lamp. */
  tripod: ({ c, night }) => (
    <g>
      <path d="M376 300 L350 446 M376 300 L402 446 M376 300 L378 446" stroke={shade(c, 0.1)} strokeWidth={4} strokeLinecap="round" />
      <path d="M346 300 L354 252 H398 L406 300 Z" fill="#efe7da" />
      {night && <path d="M346 300 L354 252 H398 L406 300 Z" fill="#ffd9a0" opacity={0.4} />}
    </g>
  ),
  /** Paper lantern lamp on the floor. */
  lantern: ({ night }) => (
    <g>
      <Shadow cx={376} cy={448} rx={30} ry={6} />
      <ellipse cx={376} cy={404} rx={30} ry={42} fill={night ? '#fff0cf' : '#f5efe4'} />
      {[-24, -12, 0, 12, 24].map((d) => (
        <path key={d} d={`M${352} ${404 + d} Q376 ${408 + d} 400 ${404 + d}`} stroke="#d6cbb8" strokeWidth={1} fill="none" />
      ))}
      <rect x={366} y={444} width={20} height={4} fill="#3a3a3a" />
    </g>
  ),
  /** Retro mushroom table lamp on a side table. */
  mushroom: ({ c, night }) => (
    <g>
      <Shadow cx={376} cy={448} rx={26} ry={5} />
      <rect x={352} y={392} width={48} height={8} rx={2} fill="#7a5236" />
      <path d="M358 400 L356 446 M394 400 L396 446" stroke="#5a3c27" strokeWidth={4} />
      <rect x={370} y={356} width={12} height={36} rx={4} fill={shade(c, 0.1)} />
      <path d="M346 360 Q346 322 376 322 Q406 322 406 360 Z" fill={night ? tint(c, 0.4) : c} />
    </g>
  ),
};

/* ================================================================ PLANTS (x 725–800, floor y≈452) */

const Pot = ({ x = 742, w = 40, h = 34, c = '#d9cfc2' }) => (
  <g>
    <Shadow cx={x + w / 2} cy={454} rx={w * 0.7} ry={6} />
    <path d={`M${x} ${452 - h} H${x + w} L${x + w - 5} 452 H${x + 5} Z`} fill={c} />
    <rect x={x - 2} y={452 - h} width={w + 4} height={5} rx={2} fill={tint(c, 0.15)} />
  </g>
);

export const PLANTS: Record<string, (p: DrawProps) => React.ReactNode> = {
  none: () => null,
  small: () => (
    <g>
      <Pot x={750} w={26} h={20} c="#c9785a" />
      <g className="room-sway" style={{ transformOrigin: '763px 432px' }}>
        {[-40, -15, 10, 35, 0].map((r, i) => (
          <ellipse key={i} cx={763} cy={420} rx={5} ry={12} fill={i === 4 ? '#7fbf8a' : '#5f9e6e'} transform={`rotate(${r} 763 432)`} />
        ))}
      </g>
    </g>
  ),
  monstera: () => (
    <g>
      <Pot x={740} w={44} h={36} c="#e8e2d8" />
      <g className="room-sway" style={{ transformOrigin: '762px 416px' }}>
        {[[-50, 320, 330], [10, 300, 340], [40, 330, 350], [-20, 350, 360], [60, 360, 370]].map(([r, , y], i) => (
          <g key={i} transform={`rotate(${r} 762 416)`}>
            <path d={`M762 416 V${y - 30}`} stroke="#3f7a4e" strokeWidth={3} />
            <path d={`M762 ${y - 30} q-26 -6 -24 -30 q8 -20 24 -14 q16 -6 24 14 q2 24 -24 30 Z`} fill={i % 2 ? '#2f7d4f' : '#3b8f5c'} />
            <path d={`M762 ${y - 36} v-24 M762 ${y - 46} l-12 -4 M762 ${y - 52} l12 -4`} stroke="#1f5c39" strokeWidth={1.5} />
          </g>
        ))}
      </g>
    </g>
  ),
  snake: () => (
    <g>
      <Pot x={744} w={38} h={30} c="#2f3437" />
      {[-14, -6, 2, 10, 16].map((d, i) => (
        <path key={i} d={`M${763 + d * 0.6} 424 Q${763 + d} ${360 - i * 8} ${763 + d * 1.6} ${330 + (i % 2) * 20}`} stroke="#3d7d4a" strokeWidth={9 - (i % 2) * 2} fill="none" strokeLinecap="round" />
      ))}
      {[-14, 2, 16].map((d) => (
        <path key={d} d={`M${763 + d * 0.6} 420 Q${763 + d} 370 ${763 + d * 1.6} 340`} stroke="#cde3a6" strokeWidth={1.2} fill="none" opacity={0.6} />
      ))}
    </g>
  ),
  /** Fiddle-leaf fig: tall, big round leaves. */
  fiddle: () => (
    <g>
      <Pot x={738} w={48} h={40} c="#f1ece4" />
      <path d="M762 414 Q756 330 766 250" stroke="#6b4a2f" strokeWidth={5} fill="none" />
      <g className="room-sway" style={{ transformOrigin: '762px 412px' }}>
        {[[740, 360, -30], [786, 340, 30], [744, 310, -40], [784, 290, 35], [760, 262, 0], [742, 270, -50], [790, 250, 45]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={14} ry={20} fill={i % 2 ? '#2e6b41' : '#3a7f50'} transform={`rotate(${r} ${x} ${y})`} />
        ))}
      </g>
    </g>
  ),
  olive: () => (
    <g>
      <Pot x={736} w={52} h={40} c="#b9a58c" />
      <path d="M762 414 Q760 330 770 280 M766 330 Q750 300 740 290" stroke="#6b5a45" strokeWidth={4} fill="none" />
      <g className="room-sway" style={{ transformOrigin: '762px 412px' }}>
        {Array.from({ length: 34 }, (_, i) => {
          const a = (i / 34) * Math.PI * 2;
          const r = 20 + (i % 5) * 7;
          return <ellipse key={i} cx={762 + Math.cos(a) * r} cy={268 + Math.sin(a) * r * 0.8} rx={3} ry={8} fill={i % 3 ? '#7a9a6a' : '#94b07f'} transform={`rotate(${(i * 47) % 180} ${762 + Math.cos(a) * r} ${268 + Math.sin(a) * r * 0.8})`} />;
        })}
      </g>
    </g>
  ),
  /** Cactus in a terracotta pot. */
  cactus: () => (
    <g>
      <Pot x={746} w={34} h={28} c="#c9785a" />
      <rect x={754} y={340} width={18} height={86} rx={9} fill="#4a8a5a" />
      <path d="M756 380 H740 V356" stroke="#4a8a5a" strokeWidth={12} strokeLinecap="round" fill="none" />
      <path d="M770 366 H784 V346" stroke="#4a8a5a" strokeWidth={10} strokeLinecap="round" fill="none" />
      <circle cx={763} cy={338} r={5} fill="#f472b6" />
    </g>
  ),
  /** Bonsai on a little stand. */
  bonsai: () => (
    <g>
      <Shadow cx={762} cy={452} rx={34} ry={5} />
      <path d="M736 452 V420 M788 452 V420" stroke="#3b2a1d" strokeWidth={4} />
      <rect x={730} y={414} width={64} height={8} rx={2} fill="#3b2a1d" />
      <rect x={738} y={400} width={48} height={14} rx={3} fill="#1f3b52" />
      <path d="M762 402 Q752 380 770 366 Q786 354 774 340" stroke="#5a3d2a" strokeWidth={6} fill="none" strokeLinecap="round" />
      <g className="room-sway" style={{ transformOrigin: '762px 400px' }}>
        <ellipse cx={748} cy={366} rx={22} ry={10} fill="#3f7a4a" />
        <ellipse cx={784} cy={344} rx={24} ry={11} fill="#4a8a55" />
        <ellipse cx={764} cy={330} rx={18} ry={9} fill="#3f7a4a" />
      </g>
    </g>
  ),
};

/* ================================================================ RUGS (centre x 600, floor y 455–545) */

export const RUGS: Record<string, (p: DrawProps) => React.ReactNode> = {
  none: () => null,
  round: ({ c }) => (
    <g>
      <ellipse cx={600} cy={500} rx={170} ry={36} fill={c} />
      <ellipse cx={600} cy={500} rx={150} ry={30} fill="none" stroke={tint(c, 0.2)} strokeWidth={3} />
    </g>
  ),
  stripe: ({ c }) => (
    <g>
      <path d="M440 466 H760 L800 536 H400 Z" fill="#efe9de" />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${446 - i * 10} ${474 + i * 16} H${754 + i * 10} L${758 + i * 10} ${482 + i * 16} H${442 - i * 10} Z`} fill={c} />
      ))}
    </g>
  ),
  persian: ({ c }) => (
    <g>
      <path d="M430 462 H770 L812 540 H388 Z" fill={c} />
      <path d="M448 470 H752 L786 532 H414 Z" fill="none" stroke="#e8c78f" strokeWidth={3} />
      <path d="M470 478 H730 L756 524 H444 Z" fill={shade(c, 0.2)} />
      <path d="M600 484 L640 500 L600 516 L560 500 Z" fill="#e8c78f" />
      <path d="M600 490 L624 500 L600 510 L576 500 Z" fill={c} />
      {[480, 720].map((x) => (
        <circle key={x} cx={x} cy={500} r={8} fill="#e8c78f" opacity={0.8} />
      ))}
    </g>
  ),
  /** Fluffy shag rug. */
  shag: ({ c }) => (
    <g>
      <ellipse cx={600} cy={500} rx={180} ry={40} fill={c} />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * Math.PI * 2;
        return <path key={i} d={`M${600 + Math.cos(a) * 176} ${500 + Math.sin(a) * 38} l${Math.cos(a) * 6} ${Math.sin(a) * 3}`} stroke={tint(c, 0.15)} strokeWidth={3} strokeLinecap="round" />;
      })}
      <ellipse cx={600} cy={496} rx={140} ry={26} fill={tint(c, 0.08)} />
    </g>
  ),
  /** Checkerboard rug. */
  checker: ({ c }) => (
    <g>
      <path d="M440 466 H760 L800 538 H400 Z" fill="#f2ede4" />
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 8 }, (_, k) => {
          if ((r + k) % 2) return null;
          const y0 = 466 + r * 18;
          const y1 = y0 + 18;
          const x0a = 440 - r * 10 + k * (320 + r * 20) / 8;
          const wa = (320 + r * 20) / 8;
          const x0b = 440 - (r + 1) * 10 + k * (320 + (r + 1) * 20) / 8;
          const wb = (320 + (r + 1) * 20) / 8;
          return <path key={`${r}${k}`} d={`M${x0a} ${y0} h${wa} L${x0b + wb} ${y1} H${x0b} Z`} fill={c} />;
        }),
      )}
    </g>
  ),
  /** Gaming rug: dark with a controller-button motif. */
  gamer: ({ c }) => (
    <g>
      <path d="M436 466 H764 L806 538 H394 Z" fill="#17181d" />
      <path d="M452 474 H748 L782 530 H418 Z" fill="none" stroke={c} strokeWidth={2} />
      <circle cx={560} cy={502} r={10} fill="none" stroke={c} strokeWidth={3} />
      <path d="M600 492 L612 512 H588 Z" fill="none" stroke={c} strokeWidth={3} />
      <rect x={630} y={492} width={18} height={18} fill="none" stroke={c} strokeWidth={3} />
      <path d="M672 492 L688 512 M688 492 L672 512" stroke={c} strokeWidth={3} />
    </g>
  ),
};

/* ================================================================ COLLECTIBLES (x 1112–1195, floor y≈452) */

export const COLLECTIBLES: Record<string, (p: DrawProps) => React.ReactNode> = {
  none: () => null,
  /** Acoustic guitar on a stand. */
  guitar: ({ c }) => (
    <g>
      <Shadow cx={1150} cy={454} rx={30} ry={5} />
      <path d="M1136 452 L1150 420 L1164 452" stroke="#1f1f1f" strokeWidth={3} fill="none" />
      <rect x={1146} y={290} width={9} height={90} fill="#5a3d26" />
      <rect x={1143} y={278} width={15} height={16} rx={3} fill="#3a2718" />
      <path d="M1150 372 Q1124 372 1126 400 Q1122 418 1130 432 Q1140 450 1150 446 Q1160 450 1170 432 Q1178 418 1174 400 Q1176 372 1150 372 Z" fill={c} />
      <circle cx={1150} cy={406} r={8} fill="#1f1f1f" />
      <path d="M1150 300 V430" stroke="#eee" strokeWidth={0.8} />
    </g>
  ),
  /** Aquarium on a cabinet with fish that swim. */
  aquarium: ({ night }) => (
    <g>
      <Shadow cx={1154} cy={454} rx={44} ry={6} />
      <rect x={1114} y={392} width={80} height={60} rx={3} fill="#2b2b30" />
      <rect x={1112} y={322} width={84} height={70} rx={4} fill="#1d4f6e" opacity={0.85} />
      <rect x={1112} y={322} width={84} height={8} fill={night ? '#e0f2fe' : '#94a3b8'} />
      <path d="M1112 382 Q1130 374 1150 384 Q1170 376 1196 384 V392 H1112 Z" fill="#c2a878" />
      <path d="M1126 384 Q1122 362 1130 346 M1132 384 Q1136 366 1130 352" stroke="#3f9e5f" strokeWidth={3} fill="none" />
      <g className="room-fish">
        <path d="M1150 350 q8 -6 14 0 q-6 6 -14 0 Z M1150 350 l-6 -5 v10 Z" fill="#fb923c" />
      </g>
      <g className="room-fish room-fish-2">
        <path d="M1170 366 q6 -5 11 0 q-5 5 -11 0 Z M1170 366 l-5 -4 v8 Z" fill="#fde047" />
      </g>
      <circle cx={1180} cy={340} r={2} fill="#fff" opacity={0.6} className="room-bubble" />
    </g>
  ),
  /** Arcade cabinet. */
  arcade: ({ c, night }) => (
    <g>
      <Shadow cx={1154} cy={455} rx={42} ry={6} />
      <path d="M1118 452 V300 L1130 286 H1186 V452 Z" fill={c} />
      <rect x={1124} y={292} width={56} height={18} fill="#111" />
      <rect x={1128} y={295} width={48} height={12} fill={night ? '#fde047' : '#facc15'} opacity={0.9} />
      <rect x={1126} y={318} width={52} height={44} fill="#0b1220" />
      <rect x={1130} y={322} width={44} height={36} fill="#1e40af" className="room-screen" />
      <rect x={1144} y={336} width={8} height={8} fill="#fde047" />
      <path d="M1118 372 L1186 372 L1192 392 H1112 Z" fill={shade(c, 0.25)} />
      <circle cx={1136} cy={382} r={4} fill="#ef4444" />
      <circle cx={1166} cy={382} r={4} fill="#22c55e" />
      <circle cx={1178} cy={382} r={4} fill="#3b82f6" />
    </g>
  ),
  /** Sneaker display tower. */
  kicks: ({ c }) => (
    <g>
      <Shadow cx={1154} cy={455} rx={38} ry={6} />
      <rect x={1120} y={300} width={70} height={152} rx={3} fill="#1f2228" />
      {[0, 1, 2, 3].map((i) => {
        const y = 332 + i * 36;
        const col = [c, '#f8fafc', '#ef4444', '#22c55e'][i];
        return (
          <g key={i}>
            <rect x={1124} y={y} width={62} height={3} fill="#3a3e47" />
            <path d={`M1132 ${y} V${y - 12} Q1138 ${y - 20} 1148 ${y - 16} L1154 ${y - 9} Q1168 ${y - 7} 1170 ${y} Z`} fill={col} />
            <rect x={1124} y={y - 24} width={62} height={2} fill="#fff7e0" opacity={0.5} />
          </g>
        );
      })}
    </g>
  ),
  /** Telescope on a tripod pointed at the window. */
  telescope: ({ c }) => (
    <g>
      <path d="M1154 380 L1128 452 M1154 380 L1180 452 M1154 380 V452" stroke="#2b2b30" strokeWidth={3} />
      <g transform="rotate(-30 1154 372)">
        <rect x={1100} y={362} width={86} height={18} rx={8} fill={c} />
        <rect x={1180} y={360} width={12} height={22} rx={4} fill={shade(c, 0.3)} />
        <rect x={1092} y={366} width={10} height={10} rx={2} fill="#2b2b30" />
      </g>
    </g>
  ),
  /** Record player on a sideboard. */
  turntable: ({ c }) => (
    <g>
      <Shadow cx={1154} cy={455} rx={42} ry={6} />
      <rect x={1114} y={392} width={80} height={60} rx={3} fill={c} />
      <path d="M1124 452 V458 M1184 452 V458" stroke="#222" strokeWidth={3} />
      {[1120, 1132, 1144].map((x) => (
        <rect key={x} x={x} y={400} width={9} height={46} fill={['#be123c', '#1d4ed8', '#eab308'][(x / 12) % 3 | 0]} />
      ))}
      <rect x={1112} y={378} width={84} height={14} rx={2} fill="#1f1f22" />
      <ellipse cx={1146} cy={378} rx={26} ry={5} fill="#0b0b0d" className="room-spin-flat" />
      <ellipse cx={1146} cy={378} rx={7} ry={1.6} fill="#ef4444" />
      <path d="M1186 374 L1166 378" stroke="#d4d4d8" strokeWidth={2} />
    </g>
  ),
  /** Cat tree with a sleeping cat that breathes. */
  cat: ({ c }) => (
    <g>
      <Shadow cx={1154} cy={455} rx={40} ry={6} />
      <rect x={1122} y={440} width={64} height={12} rx={3} fill="#d6c8b4" />
      <rect x={1148} y={330} width={12} height={110} fill="#c8b89f" />
      <path d="M1148 340 h12 M1148 360 h12 M1148 380 h12 M1148 400 h12 M1148 420 h12" stroke="#b5a387" strokeWidth={2} />
      <rect x={1120} y={322} width={70} height={12} rx={4} fill="#d6c8b4" />
      <g className="room-breathe" style={{ transformOrigin: '1154px 322px' }}>
        <path d="M1128 322 Q1128 300 1150 300 Q1176 300 1180 322 Z" fill={c} />
        <circle cx={1134} cy={306} r={10} fill={c} />
        <path d="M1127 299 L1129 290 L1135 297 M1137 297 L1142 290 L1143 299" fill={c} />
        <path d="M1130 307 q3 2 6 0" stroke="#222" strokeWidth={1.2} fill="none" />
        <path d="M1180 320 Q1196 318 1190 300" stroke={c} strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
    </g>
  ),
  /** A big gold trophy on a plinth, for the biggest goals. */
  plinth: ({ c }) => (
    <g>
      <Shadow cx={1154} cy={455} rx={36} ry={6} />
      <rect x={1126} y={392} width={56} height={60} fill="#e7e2da" />
      <rect x={1122} y={386} width={64} height={8} fill="#f4f0ea" />
      <rect x={1140} y={370} width={28} height={16} fill={shade(c, 0.4)} />
      <rect x={1150} y={346} width={8} height={24} fill={c} />
      <path d="M1128 292 H1180 V312 Q1180 344 1154 346 Q1128 344 1128 312 Z" fill={c} />
      <path d="M1128 300 Q1114 300 1116 314 Q1118 326 1132 326 M1180 300 Q1194 300 1192 314 Q1190 326 1176 326" stroke={c} strokeWidth={4} fill="none" />
      <path d="M1136 300 Q1140 330 1150 336" stroke="#fff" strokeWidth={3} opacity={0.4} fill="none" />
    </g>
  ),
};
