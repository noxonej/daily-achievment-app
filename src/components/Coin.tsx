/**
 * Squzo coin: the in-app money (saved as "shards" in the data). A crisp pixel-art gold coin,
 * in the spirit of pixel adventure games but with a cleaner palette: dark rim, warm gold face,
 * a raised diamond in the middle and a shine that sweeps across now and then.
 */
const MAP = [
  '....kkkk....',
  '..kkllllkk..',
  '.kllggggddk.',
  '.klgggldgdk.',
  'klggglwldgdk',
  'klgglwwwldgk',
  'klggdlwldgdk',
  'kdggggdggddk',
  '.kdgggggddk.',
  '.kddgggdddk.',
  '..kkddddkk..',
  '....kkkk....',
];

const COLORS: Record<string, string> = {
  k: '#6b3d06',
  d: '#c98a1c',
  g: '#f2bb35',
  l: '#ffe58a',
  w: '#fffbe8',
};

const RECTS = MAP.flatMap((row, y) =>
  [...row].flatMap((c, x) => (COLORS[c] ? [{ x, y, fill: COLORS[c] }] : [])),
);

export function Coin({ size = 16, shine = false, className = '' }: { size?: number | string; shine?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`inline-block shrink-0 ${shine ? 'coin-shine' : ''} ${className}`}
      style={{ verticalAlign: '-0.15em' }}
    >
      {RECTS.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width="1.02" height="1.02" fill={r.fill} />
      ))}
      {shine && <rect className="coin-glint" x="-3" y="0" width="2" height="12" fill="#fff" opacity=".55" transform="skewX(-20)" />}
    </svg>
  );
}
