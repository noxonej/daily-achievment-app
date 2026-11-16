import { useId } from 'react';
import type { AchievementTier } from '../lib/types';
import { TIER_STYLES } from '../lib/achievementTiers';
import { Icon } from './Icon';

/**
 * A badge crest in the style of sports-game badges: a six-sided shield with a bevelled metal
 * frame in the tier's colour, a dark plate, the icon in the middle and a small tier gem.
 * Higher tiers get more: gold adds side wings, platinum a star on top, legend an animated
 * shimmer across the frame. Locked badges are a flat grey outline.
 */
export function BadgeCrest({ tier, icon, size = 72, locked = false, shine = false }: { tier: AchievementTier; icon: string; size?: number; locked?: boolean; shine?: boolean }) {
  const id = useId().replace(/:/g, '');
  const t = TIER_STYLES[tier];
  const SHIELD = 'M32 3 L56 12 V36 C56 50 45 59 32 63 C19 59 8 50 8 36 V12 Z';
  const INNER = 'M32 9 L50.5 16 V35.5 C50.5 46.5 42 53.5 32 56.8 C22 53.5 13.5 46.5 13.5 35.5 V16 Z';
  const rank = ['bronze', 'silver', 'gold', 'platinum', 'legend'].indexOf(tier);
  if (locked) {
    return (
      <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg viewBox="0 0 64 66" width={size} height={size} aria-hidden="true" className="absolute inset-0">
          <path d={SHIELD} fill="rgba(255,255,255,0.03)" stroke="currentColor" className="text-white/15" strokeWidth="2" strokeLinejoin="round" />
          <path d={INNER} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
        </svg>
        <Icon name={icon} size={size * 0.36} className="relative text-slate-600" />
      </span>
    );
  }
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size, filter: `drop-shadow(0 4px 10px ${t.glow})` }}>
      <svg viewBox="0 0 64 66" width={size} height={size} aria-hidden="true" className="absolute inset-0 overflow-visible">
        <defs>
          <linearGradient id={`f${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={t.frame[0]} />
            <stop offset=".45" stopColor={t.frame[1]} />
            <stop offset="1" stopColor={t.frame[2]} />
          </linearGradient>
          <linearGradient id={`fb${id}`} x1="1" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={t.frame[0]} />
            <stop offset=".5" stopColor={t.frame[1]} />
            <stop offset="1" stopColor={t.frame[2]} />
          </linearGradient>
          <radialGradient id={`p${id}`} cx=".5" cy=".3" r=".8">
            <stop offset="0" stopColor={t.plate[0]} />
            <stop offset="1" stopColor={t.plate[1]} />
          </radialGradient>
          <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".7" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`c${id}`}>
            <path d={SHIELD} />
          </clipPath>
        </defs>
        {/* wings for gold and up */}
        {rank >= 2 && (
          <g fill={`url(#f${id})`} stroke={t.frame[2]} strokeWidth=".8">
            <path d="M8 18 L1 22 L4 30 L1 36 L8 40 Z" />
            <path d="M56 18 L63 22 L60 30 L63 36 L56 40 Z" />
          </g>
        )}
        {/* star on top for platinum and legend */}
        {rank >= 3 && <path d="M32 -5 l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8Z" fill={`url(#f${id})`} stroke={t.frame[2]} strokeWidth=".8" />}
        <path d={SHIELD} fill={`url(#f${id})`} stroke={t.frame[2]} strokeWidth="1" strokeLinejoin="round" />
        <path d="M32 6 L53.3 14 V35.8 C53.3 48.3 43.6 56.3 32 59.9 C20.4 56.3 10.7 48.3 10.7 35.8 V14 Z" fill={`url(#fb${id})`} />
        <path d={INNER} fill={`url(#p${id})`} stroke={t.frame[2]} strokeWidth=".8" />
        {/* light catching the top-left edge */}
        <path d="M13.5 16 L32 9 L50.5 16" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1" />
        {/* tier pips at the bottom: one per tier step */}
        <g fill={t.frame[0]}>
          {Array.from({ length: rank + 1 }, (_, i) => (
            <rect key={i} x={32 - (rank + 1) * 2.6 + i * 5.2 + 0.6} y="48.5" width="4" height="2.2" rx="1" />
          ))}
        </g>
        {(shine || tier === 'legend') && (
          <g clipPath={`url(#c${id})`}>
            <rect x="-30" y="-10" width="18" height="90" fill={`url(#s${id})`} transform="rotate(20)" className="crest-shine" />
          </g>
        )}
      </svg>
      <Icon name={icon} size={size * 0.4} strokeWidth={2.2} className="relative -mt-[8%]" style={{ color: t.icon }} />
    </span>
  );
}
