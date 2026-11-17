import type { ReactNode } from 'react';

/**
 * Each home's own architecture (2026-11-17): beams, slanted ceilings, panels, columns, glass.
 * Drawn over the wall and floor but under your furniture, so every home looks like a different
 * place even with the same things in it. Rasterised to pixel art with the rest of the room.
 */

const W = 1200; // ROOM_W
const WALL_H = 400;

const beam = (y: number, h: number, c: string, k: string) => <rect key={k} x={0} y={y} width={W} height={h} fill={c} />;

function Logs({ c, o = 0.35 }: { c: string; o?: number }) {
  return (
    <g opacity={o}>
      {Array.from({ length: 14 }, (_, i) => (
        <g key={i}>
          <rect x={0} y={i * 29} width={W} height={3} fill={c} />
          <rect x={0} y={i * 29 + 3} width={W} height={2} fill="#fff" opacity={0.25} />
        </g>
      ))}
    </g>
  );
}

function Planks({ c, o = 0.3, step = 36 }: { c: string; o?: number; step?: number }) {
  return (
    <g opacity={o}>
      {Array.from({ length: Math.ceil(W / step) }, (_, i) => (
        <rect key={i} x={i * step} y={0} width={3} height={WALL_H} fill={c} />
      ))}
    </g>
  );
}

function Columns({ c, cap }: { c: string; cap: string }) {
  return (
    <g>
      {[0, W - 46].map((x) => (
        <g key={x}>
          <rect x={x} y={20} width={46} height={WALL_H - 20} fill={c} />
          <rect x={x + 8} y={20} width={4} height={WALL_H - 20} fill="#000" opacity={0.1} />
          <rect x={x + 22} y={20} width={4} height={WALL_H - 20} fill="#000" opacity={0.1} />
          <rect x={x - 6} y={14} width={58} height={14} fill={cap} />
          <rect x={x - 6} y={WALL_H - 14} width={58} height={14} fill={cap} />
        </g>
      ))}
    </g>
  );
}

const SHELLS: Record<string, () => ReactNode> = {
  /** The Launchpad: a rented room with an old pipe and a radiator. */
  room: () => (
    <g>
      <rect x={0} y={0} width={W} height={10} fill="#d8cbb6" />
      <rect x={0} y={26} width={W} height={7} fill="#9aa1ab" />
      <rect x={0} y={33} width={W} height={2} fill="#000" opacity={0.2} />
      {[180, 640, 1050].map((x) => (
        <rect key={x} x={x} y={22} width={10} height={15} fill="#7d848e" />
      ))}
      <rect x={W - 70} y={WALL_H - 120} width={50} height={110} fill="#c7c9cc" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={W - 66 + i * 8} y={WALL_H - 116} width={4} height={102} fill="#a7aab0" />
      ))}
    </g>
  ),
  /** Cozy Attic: slanted ceilings and a wooden ridge beam. */
  attic: () => (
    <g>
      <path d={`M0 0 H470 L0 360 Z`} fill="#8a5a3b" />
      <path d={`M${W} 0 H${W - 470} L${W} 360 Z`} fill="#7a4e33" />
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d={`M${i * 80} 0 L0 ${i * 62}`} stroke="#5e3a24" strokeWidth={4} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <path key={`r${i}`} d={`M${W - i * 80} 0 L${W} ${i * 62}`} stroke="#4f3020" strokeWidth={4} />
      ))}
      <rect x={0} y={0} width={W} height={18} fill="#6b4329" />
      <path d={`M470 0 L0 360`} stroke="#3b2416" strokeWidth={6} />
      <path d={`M${W - 470} 0 L${W} 360`} stroke="#3b2416" strokeWidth={6} />
    </g>
  ),
  /** Parkside Studio: clean crown moulding and a picture rail. */
  studio: () => (
    <g>
      <rect x={0} y={0} width={W} height={16} fill="#f3efe8" />
      <rect x={0} y={16} width={W} height={4} fill="#d9d2c6" />
      <rect x={0} y={150} width={W} height={4} fill="#fff" opacity={0.5} />
      <rect x={0} y={154} width={W} height={2} fill="#000" opacity={0.12} />
    </g>
  ),
  /** Skyline Apartment: concrete pillar and a ceiling light track. */
  city: () => (
    <g>
      <rect x={0} y={0} width={W} height={22} fill="#c9c7c3" />
      <rect x={0} y={22} width={W} height={3} fill="#000" opacity={0.15} />
      <rect x={120} y={30} width={960} height={6} fill="#2b2f36" />
      {[220, 470, 720, 970].map((x) => (
        <g key={x}>
          <rect x={x} y={36} width={14} height={18} fill="#2b2f36" />
          <rect x={x + 2} y={54} width={10} height={4} fill="#fde68a" />
        </g>
      ))}
      <rect x={20} y={0} width={60} height={WALL_H} fill="#b8b5b0" />
      <rect x={70} y={0} width={10} height={WALL_H} fill="#000" opacity={0.12} />
    </g>
  ),
  /** Pine Cabin: log walls and heavy beams. */
  cabin: () => (
    <g>
      <Logs c="#3b2416" o={0.45} />
      {beam(0, 26, '#5b3a22', 'b1')}
      {beam(26, 4, '#2e1c10', 'b2')}
      {[60, 380, 760, 1100].map((x) => (
        <rect key={x} x={x} y={0} width={30} height={60} fill="#4a2f1b" />
      ))}
      <rect x={0} y={0} width={34} height={WALL_H} fill="#6b4529" />
      <rect x={W - 34} y={0} width={34} height={WALL_H} fill="#5b3a22" />
    </g>
  ),
  /** Beach Hut: bamboo poles and a straw fringe. */
  beachhut: () => (
    <g>
      <Planks c="#b98a4f" o={0.25} step={30} />
      <path d={`M0 0 H${W} V30 ${Array.from({ length: 40 }, (_, i) => `L${W - i * 30 - 15} ${i % 2 ? 46 : 38} L${W - i * 30 - 30} 30`).join(' ')} Z`} fill="#d9b26a" />
      <rect x={0} y={0} width={W} height={12} fill="#b98a4f" />
      {[0, W - 28].map((x) => (
        <g key={x}>
          <rect x={x} y={0} width={28} height={WALL_H} fill="#c9a15e" />
          {[80, 170, 260, 350].map((y) => (
            <rect key={y} x={x} y={y} width={28} height={5} fill="#8a6a3a" />
          ))}
        </g>
      ))}
    </g>
  ),
  /** Brickworks Loft: steel beams and rivets. */
  loft: () => (
    <g>
      <rect x={0} y={0} width={W} height={20} fill="#3a3f47" />
      <rect x={0} y={20} width={W} height={10} fill="#2b2f36" />
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x={20 + i * 50} y={23} width={4} height={4} fill="#5b6270" />
      ))}
      {[0, W - 40].map((x) => (
        <g key={x}>
          <rect x={x} y={0} width={40} height={WALL_H} fill="#3a3f47" />
          <rect x={x + 6} y={0} width={28} height={WALL_H} fill="#2f343b" />
        </g>
      ))}
    </g>
  ),
  /** Willow Lane House: wainscoting and a warm cornice. */
  house: () => (
    <g>
      <rect x={0} y={0} width={W} height={18} fill="#efe6d6" />
      <rect x={0} y={18} width={W} height={5} fill="#c9b99c" />
      <rect x={0} y={250} width={W} height={150} fill="#f1ebe0" opacity={0.85} />
      <rect x={0} y={246} width={W} height={6} fill="#d8ccb6" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={20 + i * 100} y={268} width={80} height={112} fill="none" stroke="#d8ccb6" strokeWidth={3} />
      ))}
    </g>
  ),
  /** Snowpeak Chalet: an A-frame of big beams. */
  chalet: () => (
    <g>
      <Logs c="#3b2416" o={0.3} />
      <path d={`M0 0 H${W} V40 L${W / 2} 0 L0 40 Z`} fill="#4a2f1b" />
      <path d={`M0 120 L${W / 2} 0 L${W} 120`} stroke="#5b3a22" strokeWidth={22} fill="none" />
      <path d={`M0 120 L${W / 2} 0 L${W} 120`} stroke="#3b2416" strokeWidth={4} fill="none" />
      <rect x={W / 2 - 12} y={0} width={24} height={WALL_H} fill="#5b3a22" opacity={0.0} />
      <rect x={0} y={0} width={30} height={WALL_H} fill="#5b3a22" />
      <rect x={W - 30} y={0} width={30} height={WALL_H} fill="#4a2f1b" />
    </g>
  ),
  /** Jungle Treehouse: plank walls with a branch growing through. */
  treehouse: () => (
    <g>
      <Planks c="#3b2a16" o={0.4} step={42} />
      <path d={`M${W} 60 Q${W - 160} 50 ${W - 260} 110 Q${W - 300} 130 ${W - 330} 120`} stroke="#5a3e2b" strokeWidth={22} fill="none" strokeLinecap="round" />
      {[[W - 120, 40], [W - 220, 90], [W - 320, 110], [W - 60, 90]].map(([x, y]) => (
        <ellipse key={`${x}${y}`} cx={x} cy={y} rx={34} ry={16} fill="#3f8f4a" />
      ))}
      <path d="M0 0 H180 Q120 30 90 80 Q60 50 0 70 Z" fill="#2f7a3c" />
      <rect x={0} y={0} width={W} height={12} fill="#5a3e2b" />
    </g>
  ),
  /** Hillcrest Villa: white columns. */
  villa: () => (
    <g>
      <rect x={0} y={0} width={W} height={14} fill="#f4f1ec" />
      <Columns c="#f4f1ec" cap="#e2ddd4" />
    </g>
  ),
  /** Moon Base: metal panels, rivets and a warning stripe. */
  moonbase: () => (
    <g>
      <g opacity={0.5}>
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={i * 120} y={0} width={3} height={WALL_H} fill="#4b5563" />
        ))}
        {[130, 260].map((y) => (
          <rect key={y} x={0} y={y} width={W} height={3} fill="#4b5563" />
        ))}
        {Array.from({ length: 30 }, (_, i) => (
          <rect key={`r${i}`} x={8 + (i % 10) * 120} y={10 + Math.floor(i / 10) * 130} width={4} height={4} fill="#d1d5db" />
        ))}
      </g>
      <rect x={0} y={0} width={W} height={22} fill="#374151" />
      {Array.from({ length: 30 }, (_, i) => (
        <path key={i} d={`M${i * 40} ${WALL_H - 16} l20 0 l-12 16 l-20 0 Z`} fill={i % 2 ? '#facc15' : '#111827'} />
      ))}
    </g>
  ),
  /** Seacliff Estate: columns, gold cornice and an arch. */
  mansion: () => (
    <g>
      <rect x={0} y={0} width={W} height={20} fill="#f6f1e7" />
      <rect x={0} y={20} width={W} height={6} fill="#d4a63a" />
      <Columns c="#f6f1e7" cap="#d4a63a" />
    </g>
  ),
  /** Rooftop Penthouse: a full glass wall over the city at night. */
  penthouse: () => (
    <g>
      <rect x={0} y={0} width={W} height={WALL_H} fill="#0e1430" opacity={0.55} />
      {Array.from({ length: 22 }, (_, i) => {
        const bw = W / 22;
        const bh = 120 + ((i * 73) % 170);
        return (
          <g key={i}>
            <rect x={i * bw} y={WALL_H - bh} width={bw - 4} height={bh} fill="#1c2546" opacity={0.85} />
            {Array.from({ length: Math.floor(bh / 26) }, (_, r) => (
              <rect key={r} x={i * bw + 6 + ((r * 7) % 20)} y={WALL_H - bh + 10 + r * 26} width={6} height={8} fill="#ffd27a" opacity={(r + i) % 3 ? 0.8 : 0.2} />
            ))}
          </g>
        );
      })}
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={`m${i}`} x={i * 150} y={0} width={8} height={WALL_H} fill="#1f2937" />
      ))}
      <rect x={0} y={0} width={W} height={16} fill="#1f2937" />
      <rect x={0} y={WALL_H - 40} width={W} height={4} fill="#9ca3af" opacity={0.7} />
    </g>
  ),
};

export function HomeShell({ id }: { id: string }) {
  const draw = SHELLS[id];
  return draw ? <g>{draw()}</g> : null;
}
