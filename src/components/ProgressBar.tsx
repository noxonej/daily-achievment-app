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
  colorClass = 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
  trackClass = 'bg-white/10',
  heightClass = 'h-3',
  animated = true,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={`w-full ${heightClass} ${trackClass} rounded-full overflow-hidden relative`}>
      <div
        className={`${heightClass} ${colorClass} rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
        style={{ width: `${pct}%` }}
      >
        {animated && pct > 0 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
        )}
      </div>
    </div>
  );
}
