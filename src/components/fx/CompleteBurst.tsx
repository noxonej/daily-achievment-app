/**
 * A little celebration on a quest's icon when it's ticked: a ring that expands, sparks that fly
 * out in a circle and a few twinkling stars. Pure CSS, so it's cheap. Place inside a `relative` box.
 */
const COLORS = ['#34d399', '#fbbf24', '#6ee7b7', '#f472b6', '#60a5fa', '#fde047'];
const SPARKS = Array.from({ length: 12 }, (_, i) => ({ a: i * 30 + (i % 2) * 8, r: 30 + (i % 3) * 9, c: COLORS[i % COLORS.length] }));
const STARS = [
  { x: -22, y: -20, d: 0.05 },
  { x: 24, y: -14, d: 0.15 },
  { x: 16, y: 22, d: 0.25 },
];

export function CompleteBurst() {
  return (
    <span className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <span className="qb-ring" />
      {SPARKS.map((s, i) => (
        <span key={i} className="qb-spark" style={{ ['--a' as string]: `${s.a}deg`, ['--r' as string]: `${s.r}px`, background: s.c, color: s.c }} />
      ))}
      {STARS.map((s, i) => (
        <svg key={i} className="qb-star" viewBox="0 0 10 10" width="10" height="10" style={{ ['--x' as string]: `${s.x}px`, ['--y' as string]: `${s.y}px`, animationDelay: `${s.d}s` }}>
          <path d="M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2Z" fill="#fde68a" />
        </svg>
      ))}
    </span>
  );
}
