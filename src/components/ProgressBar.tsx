import { useEffect, useRef, useState } from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  colorClass?: string;
  trackClass?: string;
  heightClass?: string;
  animated?: boolean;
}

export function ProgressBar({
  value,
  max,
  colorClass = 'bg-gradient-to-r from-amber-500 to-amber-400',
  trackClass = 'bg-white/10',
  heightClass = 'h-3',
  animated = true,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  // When the bar grows (not on first show), a bright glint runs along it once.
  const prev = useRef(pct);
  const [glint, setGlint] = useState(0);
  useEffect(() => {
    if (pct > prev.current) setGlint((g) => g + 1);
    prev.current = pct;
  }, [pct]);
  return (
    <div className={`w-full ${heightClass} ${trackClass} rounded-full overflow-hidden relative`}>
      <div
        className={`${heightClass} ${colorClass} rounded-full transition-all duration-500 ease-out relative overflow-hidden bar-in`}
        style={{ width: `${pct}%` }}
      >
        {animated && pct > 0 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
        )}
        {glint > 0 && <span key={glint} className="bar-glint" aria-hidden="true" />}
      </div>
    </div>
  );
}
