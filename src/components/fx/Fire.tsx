import { useId } from 'react';

/**
 * A small fire that really burns: three flame layers (red-orange outside, amber middle,
 * a hot yellow-white core) that sway and stretch at different speeds, a soft glow, and
 * embers that rise and fade. `lit={false}` draws a cold grey flame for a 0-day streak.
 * Reduce motion keeps the flame still.
 */
export function Fire({ size = 20, lit = true, intensity = 1, className = '' }: { size?: number; lit?: boolean; intensity?: 1 | 2 | 3; className?: string }) {
  const id = useId().replace(/:/g, '');
  const OUTER = 'M12 1.6c1.1 3.4 6.6 6.3 6.6 12.4a6.6 6.6 0 0 1-13.2 0c0-3 1.4-4.9 2.7-6.5.3 1.8 1.1 3 2.4 3.4-.7-3.3-.1-6.4 1.5-9.3Z';
  const MID = 'M12 7.2c.9 2.4 4.4 4.3 4.4 8.2a4.4 4.4 0 0 1-8.8 0c0-2 .9-3.2 1.8-4.2.2 1.1.7 1.9 1.5 2.2-.4-2.2 0-4.3 1.1-6.2Z';
  const CORE = 'M12 12.2c.6 1.4 2.4 2.5 2.4 4.6a2.4 2.4 0 0 1-4.8 0c0-1.1.5-1.8 1-2.4.1.6.4 1 .8 1.2-.2-1.2 0-2.4.6-3.4Z';
  if (!lit) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
        <path d={OUTER} fill="#64748b" opacity=".35" stroke="#94a3b8" strokeOpacity=".6" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={`fire overflow-visible ${className}`} data-intensity={intensity}>
      <defs>
        <linearGradient id={`fo${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f43f5e" />
          <stop offset=".45" stopColor="#f97316" />
          <stop offset="1" stopColor="#fb923c" stopOpacity=".85" />
        </linearGradient>
        <linearGradient id={`fm${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fb923c" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
        <radialGradient id={`fc${id}`} cx=".5" cy=".75" r=".7">
          <stop offset="0" stopColor="#fffbeb" />
          <stop offset=".6" stopColor="#fde68a" />
          <stop offset="1" stopColor="#fbbf24" />
        </radialGradient>
        <radialGradient id={`fg${id}`} cx=".5" cy=".7" r=".5">
          <stop offset="0" stopColor="#fdba74" stopOpacity=".5" />
          <stop offset=".5" stopColor="#fb923c" stopOpacity=".18" />
          <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="12" cy="15" rx={6 + intensity} ry={6 + intensity} fill={`url(#fg${id})`} className="fire-glow" />
      <path d={OUTER} fill={`url(#fo${id})`} className="fire-outer" />
      <path d={MID} fill={`url(#fm${id})`} className="fire-mid" />
      <path d={CORE} fill={`url(#fc${id})`} className="fire-core" />
      {intensity >= 2 && (
        <g fill="#fdba74">
          <circle cx="8.5" cy="8" r=".8" className="fire-ember" style={{ animationDelay: '0s' }} />
          <circle cx="15.5" cy="9" r=".7" className="fire-ember" style={{ animationDelay: '.7s' }} />
          {intensity >= 3 && <circle cx="12" cy="4" r=".9" className="fire-ember" style={{ animationDelay: '1.3s' }} />}
        </g>
      )}
    </svg>
  );
}
