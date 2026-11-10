import { useId } from 'react';

/**
 * A small fire that really burns: three flame layers (red-orange outside, amber middle,
 * a hot yellow-white core) that sway and stretch at different speeds, a soft glow, and
 * embers that rise and fade. `lit={false}` draws a cold grey flame for a 0-day streak.
 * Reduce motion keeps the flame still.
 */
/** A small teardrop flame, drawn around (0, 0). */
const TONGUE = 'M0-3.2c1 1.5 2 2.5 2 3.7a2 2 0 0 1-4 0C-2-.7-1-1.7 0-3.2Z';
const TONGUES = [
  { x: 12, y: 6.5, s: 0.9, d: 0, t: 0.9 },
  { x: 9.6, y: 10, s: 0.75, d: 0.35, t: 1.05 },
  { x: 14.6, y: 9, s: 0.8, d: 0.6, t: 0.95 },
  { x: 11, y: 5.5, s: 0.6, d: 0.8, t: 1.15 },
  { x: 13.4, y: 7, s: 0.6, d: 0.15, t: 1 },
  { x: 8.4, y: 12, s: 0.55, d: 0.5, t: 1.2 },
  { x: 15.8, y: 11.5, s: 0.55, d: 1, t: 1.1 },
];

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
  const still =
    typeof window !== 'undefined' &&
    (document.documentElement.dataset.motion === 'reduce' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  // Little flame tongues that break off the top and rise, like a real fire.
  const tongues = intensity === 1 ? TONGUES.slice(0, 3) : intensity === 2 ? TONGUES.slice(0, 5) : TONGUES;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={`fire overflow-visible ${className}`} data-intensity={intensity}>
      <defs>
        <linearGradient id={`fo${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#e11d48" />
          <stop offset=".35" stopColor="#f97316" />
          <stop offset=".8" stopColor="#fb923c" />
          <stop offset="1" stopColor="#fb923c" />
        </linearGradient>
        <linearGradient id={`fm${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f97316" />
          <stop offset=".6" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#fcd34d" />
        </linearGradient>
        <radialGradient id={`fc${id}`} cx=".5" cy=".8" r=".75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".45" stopColor="#fef3c7" />
          <stop offset="1" stopColor="#fcd34d" />
        </radialGradient>
        <radialGradient id={`fg${id}`} cx=".5" cy=".7" r=".5">
          <stop offset="0" stopColor="#fdba74" stopOpacity=".55" />
          <stop offset=".5" stopColor="#f97316" stopOpacity=".18" />
          <stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        {/* Moving noise bends the flame's edges, so it licks and flickers instead of just stretching. */}
        <filter id={`fw${id}`} x="-30%" y="-40%" width="160%" height="170%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.11 0.2" numOctaves="1" seed="3" result="n">
            {!still && <animate attributeName="baseFrequency" dur="1.7s" values="0.11 0.2;0.13 0.27;0.1 0.23;0.11 0.2" repeatCount="indefinite" />}
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale={still ? 0 : 2.2 + intensity * 0.4} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation=".28" />
        </filter>
      </defs>
      <ellipse cx="12" cy="15.5" rx={6 + intensity} ry={6 + intensity} fill={`url(#fg${id})`} className="fire-glow" />
      <g filter={`url(#fw${id})`}>
        {!still &&
          tongues.map((t, i) => (
            <g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.s})`}>
              <path
                d={TONGUE}
                fill={i % 2 ? "#fb923c" : "#f97316"}
                className="fire-tongue"
                style={{ animationDelay: `${t.d}s`, animationDuration: `${t.t}s` }}
              />
            </g>
          ))}
        <path d={OUTER} fill={`url(#fo${id})`} className="fire-outer" />
        <path d={MID} fill={`url(#fm${id})`} className="fire-mid" />
        <path d={CORE} fill={`url(#fc${id})`} className="fire-core" />
      </g>
      {intensity >= 2 && (
        <g fill="#fdba74">
          <circle cx="8.5" cy="8" r=".7" className="fire-ember" style={{ animationDelay: '0s' }} />
          <circle cx="15.5" cy="9" r=".6" className="fire-ember" style={{ animationDelay: '.7s' }} />
          {intensity >= 3 && <circle cx="12" cy="4" r=".8" className="fire-ember" style={{ animationDelay: '1.3s' }} />}
        </g>
      )}
    </svg>
  );
}
