import { useApp } from '../store/AppContext';

export function NewDayBanner() {
  const { isNewDay, dismissNewDay, stats } = useApp();
  if (!isNewDay) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-3">
      <div className="flex items-center gap-3 bg-gradient-to-r from-amber-600/20 to-rose-600/20 border border-amber-500/30 rounded-xl px-4 py-3 animate-pop-in">
        <span className="text-2xl">🌅</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">A new day, a new set of quests!</p>
          <p className="text-xs text-slate-400">
            {stats.currentStreak > 0
              ? `Keep your ${stats.currentStreak} day streak alive.`
              : 'Complete every daily quest to start a streak.'}
          </p>
        </div>
        <button
          onClick={dismissNewDay}
          className="shrink-0 text-slate-400 hover:text-white w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
