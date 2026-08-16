import { useApp } from '../store/AppContext';
import { ACHIEVEMENTS } from '../data/achievements';
import { ProgressBar } from '../components/ProgressBar';
import { formatShortDate } from '../lib/date';

export function AchievementsView() {
  const { state } = useApp();
  const unlockedMap = new Map(state.unlockedAchievements.map((u) => [u.id, u.unlockedAt]));
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedMap.has(a.id)).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
      <div>
        <p className="text-slate-400 text-sm">Your trophy case</p>
        <h1 className="font-display text-2xl font-bold text-white mt-0.5">Achievements</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">
            {unlockedCount} / {ACHIEVEMENTS.length} unlocked
          </span>
        </div>
        <ProgressBar
          value={unlockedCount}
          max={ACHIEVEMENTS.length}
          colorClass="bg-gradient-to-r from-amber-400 to-yellow-300"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const unlockedAt = unlockedMap.get(a.id);
          const isUnlocked = !!unlockedAt;
          return (
            <div
              key={a.id}
              className={`rounded-2xl border p-3.5 text-center transition ${
                isUnlocked
                  ? 'border-amber-400/30 bg-gradient-to-b from-amber-400/10 to-transparent'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div className={`text-3xl mb-1.5 ${isUnlocked ? '' : 'grayscale opacity-30'}`}>{a.icon}</div>
              <p className={`text-[13px] font-bold leading-tight ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                {a.title}
              </p>
              <p className={`text-[11px] mt-1 leading-snug ${isUnlocked ? 'text-slate-400' : 'text-slate-600'}`}>
                {a.description}
              </p>
              {isUnlocked && unlockedAt && (
                <p className="text-[10px] mt-1.5 font-semibold text-amber-400/80">
                  {formatShortDate(unlockedAt.slice(0, 10))}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
