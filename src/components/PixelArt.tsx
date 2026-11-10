/**
 * Pixel-art chest and gift box, drawn as crisp rectangles on a small grid so they match the
 * pixel character and coins. Both have a separate lid that animates open (see index.css:
 * .px-lid-open), a glow in the prize's colour and optional sparkles.
 */
type R = [x: number, y: number, w: number, h: number, fill: string];

function Rects({ rects }: { rects: R[] }) {
  return (
    <>
      {rects.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w + 0.02} height={h + 0.02} fill={fill} />
      ))}
    </>
  );
}

function Sparkles({ points }: { points: Array<[number, number, number]> }) {
  return (
    <>
      {points.map(([x, y, d]) => (
        <g key={`${x}-${y}`} className="twinkle" style={{ animationDelay: `${d}s`, transformBox: 'fill-box', transformOrigin: 'center' }}>
          <rect x={x} y={y - 1} width="1" height="3" fill="#fff7d6" />
          <rect x={x - 1} y={y} width="3" height="1" fill="#fff7d6" />
        </g>
      ))}
    </>
  );
}

const K = '#24130a';

/* ---------------- Chest ---------------- */

function chestLid(gem: string): R[] {
  const L = '#c97a3a';
  const W = '#a35a24';
  const D = '#6e3612';
  const g = '#f2bb35';
  const G = '#ffe58a';
  const o = '#a86d10';
  return [
    // outline of the rounded lid
    [9, 3, 14, 1, K], [6, 4, 20, 1, K], [4, 5, 24, 1, K], [3, 6, 26, 7, K],
    // wood
    [9, 4, 14, 1, L], [6, 5, 20, 1, L], [4, 6, 24, 1, L], [4, 7, 24, 4, W], [4, 10, 24, 1, D],
    [24, 7, 4, 4, D],
    // gold rim along the bottom of the lid
    [3, 11, 26, 2, g], [3, 11, 26, 1, G], [3, 12, 26, 1, o],
    // gold bands
    [8, 4, 3, 8, g], [8, 4, 1, 8, G], [10, 4, 1, 8, o],
    [21, 4, 3, 8, g], [21, 4, 1, 8, G], [23, 4, 1, 8, o],
    // lock top with gem
    [14, 9, 4, 4, K], [15, 10, 2, 2, gem], [15, 10, 1, 1, '#ffffffcc'],
  ];
}

function chestBody(): R[] {
  const W = '#94501f';
  const L = '#b8692e';
  const D = '#5c2c0d';
  const g = '#f2bb35';
  const G = '#ffe58a';
  const o = '#a86d10';
  return [
    [3, 13, 26, 13, K],
    [4, 13, 24, 12, W],
    [4, 13, 24, 1, L],
    // planks
    [4, 17, 24, 1, D], [4, 21, 24, 1, D], [4, 18, 24, 1, '#ffffff18'], [4, 22, 24, 1, '#ffffff18'],
    // shade on the right
    [24, 13, 4, 12, '#00000040'],
    // gold bands and bottom rim
    [8, 13, 3, 12, g], [8, 13, 1, 12, G], [10, 13, 1, 12, o],
    [21, 13, 3, 12, g], [21, 13, 1, 12, G], [23, 13, 1, 12, o],
    [4, 23, 24, 2, g], [4, 23, 24, 1, G],
    // rivets
    [9, 15, 1, 1, '#fff7d6'], [9, 20, 1, 1, '#fff7d6'], [22, 15, 1, 1, '#fff7d6'], [22, 20, 1, 1, '#fff7d6'],
    // lock plate + keyhole
    [13, 13, 6, 6, K], [14, 13, 4, 5, g], [14, 13, 4, 1, G], [15, 15, 2, 2, K], [15.5, 17, 1, 1, K],
  ];
}

export function PixelChest({
  open = false,
  glow = '#fbbf24',
  size = 160,
  shine = false,
}: {
  open?: boolean;
  glow?: string;
  size?: number;
  shine?: boolean;
}) {
  return (
    <svg viewBox="0 0 32 30" width={size} height={size * (30 / 32)} shapeRendering="crispEdges" aria-hidden="true" className="overflow-visible">
      {(open || shine) && (
        <circle cx="16" cy="16" r="17" fill={glow} opacity={open ? 0.45 : 0.18} className={open ? '' : 'glow-pulse'} style={{ transformOrigin: '16px 16px', filter: 'blur(3px)' }} />
      )}
      {open && (
        <g className="px-beams" style={{ transformOrigin: '16px 12px' }}>
          <path d="M6 13 L-4 -14 H36 L26 13 Z" fill={glow} opacity=".35" shapeRendering="geometricPrecision" />
          <path d="M11 13 L6 -14 H26 L21 13 Z" fill="#fff7d6" opacity=".5" shapeRendering="geometricPrecision" />
        </g>
      )}
      <rect x="5" y="26" width="22" height="2" fill="#000" opacity=".35" />
      <rect x="3" y="27" width="26" height="1" fill="#000" opacity=".2" />
      {open && (
        <Rects
          rects={[
            [3, 11, 26, 3, K],
            [5, 11, 22, 1, '#fde68a'],
            [7, 10, 2, 1, '#f2bb35'], [12, 10, 2, 1, '#ffe58a'], [18, 10, 2, 1, '#f2bb35'], [23, 10, 2, 1, '#ffe58a'],
          ]}
        />
      )}
      <Rects rects={chestBody()} />
      <g className={open ? 'px-lid-open' : ''} style={{ transformBox: 'view-box', transformOrigin: '16px 12px' }}>
        <Rects rects={chestLid(glow)} />
      </g>
      {shine && <Sparkles points={[[2, 6, 0], [29, 4, 0.9], [30, 19, 1.6], [1, 21, 2.1]]} />}
    </svg>
  );
}

/* ---------------- Gift box ---------------- */

export function PixelGift({
  size = 120,
  glow = false,
  sparkle = false,
  lid = 'on',
  locked = false,
}: {
  size?: number;
  glow?: boolean;
  sparkle?: boolean;
  lid?: 'on' | 'off';
  locked?: boolean;
}) {
  const P = locked ? '#475569' : '#7c3aed';
  const p = locked ? '#334155' : '#5b21b6';
  const q = locked ? '#94a3b8' : '#a78bfa';
  const Q = locked ? '#cbd5e1' : '#c4b5fd';
  const g = locked ? '#cbd5e1' : '#f2bb35';
  const G = locked ? '#f1f5f9' : '#ffe58a';
  const o = locked ? '#64748b' : '#a86d10';
  const body: R[] = [
    [5, 14, 22, 14, K],
    [6, 14, 20, 13, P],
    [6, 14, 20, 2, p],
    [21, 16, 5, 11, '#00000033'],
    [6, 16, 2, 11, '#ffffff22'],
    [14, 14, 4, 13, g], [14, 14, 1, 13, G], [17, 14, 1, 13, o],
  ];
  const top: R[] = [
    // lid
    [3, 9, 26, 6, K],
    [4, 10, 24, 4, q], [4, 10, 24, 1, Q], [4, 13, 24, 1, p],
    [13, 9, 6, 6, K], [14, 10, 4, 4, g], [14, 10, 1, 4, G], [17, 10, 1, 4, o],
    // bow: two round loops and a knot, with ribbon tails on the lid
    [8, 2, 5, 1, K], [7, 3, 1, 1, K], [6, 4, 1, 4, K], [7, 8, 1, 1, K], [8, 9, 6, 1, K], [13, 3, 1, 1, K], [14, 4, 1, 1, K],
    [8, 3, 5, 6, g], [7, 4, 1, 4, g], [13, 4, 1, 5, g], [8, 3, 3, 1, G], [7, 4, 1, 2, G], [9, 5, 3, 2, o],
    [19, 2, 5, 1, K], [24, 3, 1, 1, K], [25, 4, 1, 4, K], [24, 8, 1, 1, K], [18, 9, 6, 1, K], [18, 3, 1, 1, K], [17, 4, 1, 1, K],
    [19, 3, 5, 6, g], [24, 4, 1, 4, g], [18, 4, 1, 5, g], [21, 3, 3, 1, G], [20, 5, 3, 2, o],
    [14, 5, 4, 5, K], [15, 6, 2, 3, g], [15, 6, 1, 1, G],
  ];
  return (
    <svg viewBox="0 0 32 30" width={size} height={size * (30 / 32)} shapeRendering="crispEdges" aria-hidden="true" className="overflow-visible">
      {glow && <circle cx="16" cy="17" r="15" fill="#a78bfa" opacity=".35" className="glow-pulse" style={{ transformOrigin: '16px 17px', filter: 'blur(3px)' }} />}
      <rect x="6" y="28" width="20" height="1" fill="#000" opacity=".35" />
      <Rects rects={body} />
      <g className={lid === 'off' ? 'px-gift-lid-off' : ''} style={{ transformBox: 'view-box', transformOrigin: '16px 12px' }}>
        <Rects rects={top} />
      </g>
      {locked && (
        <Rects
          rects={[
            [22, 21, 8, 8, K], [23, 24, 6, 4, '#94a3b8'], [24, 22, 1, 2, '#94a3b8'], [27, 22, 1, 2, '#94a3b8'], [24, 21, 4, 1, '#94a3b8'], [25.5, 25, 1, 2, K],
          ]}
        />
      )}
      {sparkle && <Sparkles points={[[2, 8, 0], [29, 6, 0.8], [30, 20, 1.5], [1, 22, 2]]} />}
    </svg>
  );
}
