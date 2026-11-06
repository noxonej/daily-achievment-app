import { useEffect } from 'react';
import { useSimple } from '../lib/prefs';
import { useApp } from '../store/AppContext';
import { Icon } from './Icon';

export function NewDayBanner() {
  const { isNewDay, dismissNewDay, stats } = useApp();
  const simple = useSimple();
  // Simple mode skips the "new day" banner: the day just starts quietly.
  useEffect(() => {
    if (simple && isNewDay) dismissNewDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simple, isNewDay]);
  if (!isNewDay || simple) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-3">
      <div className="flex items-center gap-3 bg-amber-500/[0.07] border border-amber-500/25 rounded-xl px-4 py-3 animate-pop-in">
        <span className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center"><Icon name="🌅" size={22} /></span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">A new day, a new set of quests!</p>
          <p className="text-xs text-slate-400">
            {stats.currentStreak > 0
              ? `Keep your ${stats.currentStreak} day streak alive.`
              : 'Finish one quest to start a streak.'}
          </p>
        </div>
        <button
          onClick={dismissNewDay}
          className="shrink-0 text-slate-400 hover:text-white w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10"
          aria-label="Dismiss"
        >
          <Icon name="✕" size={16} />
        </button>
      </div>
    </div>
  );
}
