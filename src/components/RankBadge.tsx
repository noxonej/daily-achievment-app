import { useId } from 'react';
import type { Rank } from '../lib/ranks';

/**
 * A rank's badge: a faceted shield in the tier's colour with one, two or three chevrons for the
 * division. Higher tiers grow wings (Gold+) and a crown (Diamond+); Squzo Legend gets a star.
 */
export function RankBadge({ rank, size = 40, className = '', shine = false }: { rank: Rank; size?: number; className?: string; shine?: boolean }) {
  const id = useId().replace(/:/g, '');
  const { c1, c2, c3 } = rank.tier;
  const t = rank.tierIndex;
  const legend = rank.division === 0;
  const wings = t >= 2;
  const crown = t >= 4;
  // Chevrons stack upward: I = 1, II = 2, III = 3.
  const chevrons = Array.from({ length: rank.division }, (_, i) => 41 - i * 7);
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={`${shine ? 'rank-shine' : ''} ${className}`} role="img" aria-label={rank.name}>
      <defs>
        <linearGradient id={`rb${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c2} />
          <stop offset="0.45" stopColor={c1} />
          <stop offset="1" stopColor={c3} />
        </linearGradient>
        <linearGradient id={`ri${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c3} />
          <stop offset="1" stopColor="#0d0a08" />
        </linearGradient>
        {legend && (
          <linearGradient id={`rl${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="0.5" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#f472b6" />
          </linearGradient>
        )}
      </defs>
      {wings && (
        <g fill={`url(#rb${id})`} stroke={c3} strokeWidth="1" strokeLinejoin="round">
          <path d="M14 22 L2 18 L6 28 L1 31 L8 37 L5 42 L15 42 Z" />
          <path d="M50 22 L62 18 L58 28 L63 31 L56 37 L59 42 L49 42 Z" />
        </g>
      )}
      {crown && (
        <path d="M22 9 L25 2 L29 7 L32 0 L35 7 L39 2 L42 9 Z" fill={`url(#rb${id})`} stroke={c3} strokeWidth="1" strokeLinejoin="round" />
      )}
      {/* shield */}
      <path d="M32 6 L52 13 L52 33 C52 46 42 55 32 60 C22 55 12 46 12 33 L12 13 Z" fill={legend ? `url(#rl${id})` : `url(#rb${id})`} stroke={c3} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M32 12 L46 17 L46 33 C46 42 39 49 32 53 C25 49 18 42 18 33 L18 17 Z" fill={`url(#ri${id})`} opacity="0.88" />
      {/* facet light */}
      <path d="M32 6 L52 13 L32 20 L12 13 Z" fill="#fff" opacity="0.22" />
      {legend ? (
        <path d="M32 21 L35.5 29.5 L44.5 30 L37.5 35.5 L40 44.5 L32 39.5 L24 44.5 L26.5 35.5 L19.5 30 L28.5 29.5 Z" fill="#fff" />
      ) : (
        <g fill="none" stroke={c2} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          {chevrons.map((y) => (
            <path key={y} d={`M23 ${y} L32 ${y - 7} L41 ${y}`} />
          ))}
        </g>
      )}
    </svg>
  );
}
