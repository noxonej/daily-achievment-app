import { useId } from 'react';

/** The Quest Log mark: a check that turns into an upward arrow (done, then growing). */
export function Logo({ size = 32, animated = false, className = '' }: { size?: number; animated?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`${animated ? 'logo-tile' : ''} ${className}`}
      role="img"
      aria-label="Quest Log"
    >
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="0.55" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id={`hl${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#bg${id})`} />
      <rect width="48" height="48" rx="12" fill={`url(#hl${id})`} />
      <g fill="none" stroke="#fff" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M12.5 26.5 20 34 35 17"
          pathLength={1}
          className={animated ? 'logo-stroke' : ''}
          style={animated ? { animationDelay: '0.35s' } : undefined}
        />
        <path
          d="M26.5 16 35.5 16.2 35.7 25"
          pathLength={1}
          className={animated ? 'logo-stroke' : ''}
          style={animated ? { animationDelay: '0.72s' } : undefined}
        />
      </g>
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-tight text-white ${className}`}>
      Quest<span className="text-amber-400">Log</span>
    </span>
  );
}
