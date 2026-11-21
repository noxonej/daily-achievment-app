import { useId } from 'react';
import { STAT_IDS, STATS, type IrlStats } from '../../lib/irlStats';
import { chartMax, point, share } from './radarGeometry';
import { isLt } from '../../lib/lang';

/** The five-sided stat chart (the screenshot people share). */
export function StatsRadar({ stats, size = 300, labels = true }: { stats: IrlStats; size?: number; labels?: boolean }) {
  const id = useId().replace(/:/g, '');
  const c = 150;
  const R = labels ? 92 : 120;
  const max = chartMax(stats);
  const lt = isLt();
  const shape = STAT_IDS.map((s, i) => point(c, c, R * share(stats, s, max), i));
  const poly = shape.map((p) => p.join(',')).join(' ');
  return (
    <svg viewBox={labels ? "-38 -6 376 318" : "0 0 300 300"} width={size} height={labels ? size * (318 / 376) : size} role="img" aria-label={STAT_IDS.map((s) => `${STATS[s].label} level ${stats[s].level}`).join(', ')} className="block max-w-full h-auto">
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fb7185" stopOpacity=".55" />
          <stop offset=".5" stopColor="#a78bfa" stopOpacity=".5" />
          <stop offset="1" stopColor="#34d399" stopOpacity=".55" />
        </linearGradient>
        <radialGradient id={`${id}bg`}>
          <stop offset="0" stopColor="var(--mood2, #a78bfa)" stopOpacity=".18" />
          <stop offset="1" stopColor="var(--mood2, #a78bfa)" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}g`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx={c} cy={c} r={R + 18} fill={`url(#${id}bg)`} />
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={STAT_IDS.map((_, i) => point(c, c, R * f, i).join(',')).join(' ')} fill="none" stroke="currentColor" strokeOpacity={f === 1 ? 0.22 : 0.1} strokeWidth={f === 1 ? 1.5 : 1} />
      ))}
      {STAT_IDS.map((_, i) => {
        const [x, y] = point(c, c, R, i);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="currentColor" strokeOpacity=".1" />;
      })}
      <g className="radar-grow" style={{ transformOrigin: `${c}px ${c}px` }}>
        <polygon points={poly} fill={`url(#${id}f)`} stroke="#fff" strokeOpacity=".9" strokeWidth="2.2" strokeLinejoin="round" filter={`url(#${id}g)`} />
        {shape.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4.5" fill={STATS[STAT_IDS[i]].color} stroke="#fff" strokeWidth="1.5" />
        ))}
      </g>
      {labels &&
        STAT_IDS.map((s, i) => {
          const [x, y] = point(c, c, R + 26, i);
          // Top label sits above its corner, the others below/beside theirs.
          const top = i === 0 ? -20 : Math.abs(y - c) < 40 ? -4 : 6;
          return (
            <g key={s} transform={`translate(${x},${y + top})`}>
              <text textAnchor="middle" className="font-display" fontSize="13" fontWeight="800" fill="currentColor" letterSpacing=".04em">
                {(lt ? STATS[s].lt : STATS[s].label).toUpperCase()}
              </text>
              <text textAnchor="middle" y="16" fontSize="12" fontWeight="800" fill={stats[s].rank.color}>
                LV {stats[s].level}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
