import { useId } from 'react';
import { APP_NAME, APP_NAME_PARTS } from '../lib/brand';

/** The Dayforge mark: a check that turns into an upward arrow (done, then growing). */
export function Logo({ size = 32, animated = false, className = '' }: { size?: number; animated?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`${animated ? 'logo-tile' : ''} ${className}`}
      role="img"
      aria-label={APP_NAME}
    >
      <defs>
        {/* The tile follows the app's accent colour, so the logo always matches the theme. */}
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--color-amber-300)' }} />
          <stop offset="0.5" style={{ stopColor: 'var(--color-amber-500)' }} />
          <stop offset="1" style={{ stopColor: 'var(--color-amber-600)' }} />
        </linearGradient>
        <linearGradient id={`hl${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".38" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`sh${id}`} cx=".25" cy=".1" r=".9">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill={`url(#bg${id})`} />
      <rect width="48" height="48" rx="14" fill={`url(#sh${id})`} />
      <rect x="1" y="1" width="46" height="24" rx="13" fill={`url(#hl${id})`} />
      <rect x=".75" y=".75" width="46.5" height="46.5" rx="13.25" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1.5" />
      {/* The tick pops in with a scale (transform only): drawing it with stroke dashes glitches on iPhone Safari. */}
      <g fill="none" stroke="#fff" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" className={animated ? 'logo-check-in' : ''}>
        <path d="M12.5 26.5 20 34 35 17" />
        <path d="M26.5 16 35.5 16.2 35.7 25" />
      </g>
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-tight text-white ${className}`}>
      {APP_NAME_PARTS[0]}<span className="text-amber-400">{APP_NAME_PARTS[1]}</span>
    </span>
  );
}
