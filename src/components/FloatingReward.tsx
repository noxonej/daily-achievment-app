import { useEffect } from 'react';

interface FloatingRewardProps {
  xp: number;
  crit: boolean;
}

// Mounted only while a quest's just-completed window is active, so the
// vibrate call below fires exactly once per real completion.
export function FloatingReward({ xp, crit }: FloatingRewardProps) {
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(crit ? [10, 40, 10, 40, 25] : [12]);
    }
  }, [crit]);

  return (
    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 animate-float-up">
      {crit && <span className="text-sm">⚡</span>}
      <span className={`font-display font-extrabold text-sm whitespace-nowrap ${crit ? 'text-amber-300' : 'text-emerald-300'}`}>
        +{xp} XP{crit ? ' CRIT!' : ''}
      </span>
    </div>
  );
}
