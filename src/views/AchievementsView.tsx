import { useApp } from '../store/AppContext';
import { ACHIEVEMENTS } from '../data/achievements';
import { AchievementBadge } from '../components/AchievementBadge';
import { ProgressBar } from '../components/ProgressBar';

const CATEGORY_ORDER = ['Quests', 'Streaks', 'Perfection', 'Levels', 'Goals', 'Consistency'];

export function AchievementsView() {
  const { state, stats } = useApp();
  const unlockedMap = new Map(state.unlockedAchievements.map((u) => [u.id, u.unlockedAt]));
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedMap.has(a.id)).length;

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    items: ACHIEVEMENTS.filter((a) => a.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
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

      {byCategory.map(({ category, items }) => (
        <div key={category}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2.5">{category}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((a, i) => (
              <AchievementBadge
                key={a.id}
                achievement={a}
                unlockedAt={unlockedMap.get(a.id)}
                current={stats[a.metric]}
                shineDelay={(i % 5) * 0.6}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
