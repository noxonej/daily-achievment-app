/**
 * A short, punchy burst: a shockwave ring, sparks shooting out and a few particles. Drop it inside a
 * `relative` element at the point it should explode from. Pure CSS, so it costs nothing when idle.
 */
export function Burst({ x = '50%', y = '50%', color = 'var(--color-emerald-400)', size = 1, sparks = 10 }: { x?: string; y?: string; color?: string; size?: number; sparks?: number }) {
  return (
    <span className="pointer-events-none absolute z-10" style={{ left: x, top: y, width: 0, height: 0, ['--fx' as string]: color, ['--fs' as string]: size }} aria-hidden="true">
      <span className="fx-ring" />
      <span className="fx-ring fx-ring-2" />
      {Array.from({ length: sparks }, (_, i) => (
        <span key={i} className="fx-spark" style={{ ['--a' as string]: `${(360 / sparks) * i + 8}deg`, animationDelay: `${(i % 3) * 25}ms` }} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <span key={`d${i}`} className="fx-dot" style={{ ['--a' as string]: `${60 * i + 30}deg`, ['--d' as string]: `${26 + (i % 3) * 9}px` }} />
      ))}
    </span>
  );
}
