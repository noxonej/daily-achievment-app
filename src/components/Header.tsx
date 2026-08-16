import { useApp } from '../store/AppContext';
import { titleForLevel } from '../lib/xp';
import { ProgressBar } from './ProgressBar';
import { levelFromTotalXp } from '../lib/xp';

export function Header() {
  const { stats } = useApp();
  const { xpIntoLevel, xpForNextLevel } = levelFromTotalXp(stats.totalXp);
  const title = titleForLevel(stats.level);

  return (
    <header className="sticky top-0 z-30 bg-[#0b0e17]/90 backdrop-blur border-b border-white/10">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center font-display font-bold text-lg text-white shadow-lg shadow-violet-900/40">
              {stats.level}
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-white text-base leading-tight truncate">
                {title}
              </p>
              <p className="text-xs text-slate-400 leading-tight">
                {xpIntoLevel} / {xpForNextLevel} XP to level {stats.level + 1}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5">
            <span className="text-base leading-none">🔥</span>
            <span className="font-display font-bold text-orange-300 text-sm leading-none">
              {stats.currentStreak}
            </span>
          </div>
        </div>
        <div className="mt-2.5">
          <ProgressBar value={xpIntoLevel} max={xpForNextLevel} heightClass="h-2" />
        </div>
      </div>
    </header>
  );
}
