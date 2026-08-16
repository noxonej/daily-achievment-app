import { useApp } from '../store/AppContext';
import { HeatmapCalendar } from '../components/HeatmapCalendar';

export function StatsView() {
  const { state, stats } = useApp();

  const tiles: Array<{ label: string; value: string | number; icon: string }> = [
    { label: 'Total XP', value: stats.totalXp, icon: '⚡' },
    { label: 'Level', value: stats.level, icon: '⭐' },
    { label: 'Current Streak', value: `${stats.currentStreak}d`, icon: '🔥' },
    { label: 'Longest Streak', value: `${stats.longestStreak}d`, icon: '🏅' },
    { label: 'Perfect Days', value: stats.totalPerfectDays, icon: '✨' },
    { label: 'Quests Done', value: stats.totalQuestsCompleted, icon: '⚔️' },
    { label: 'Days Active', value: stats.daysActive, icon: '🗓️' },
    { label: 'Goals Done', value: stats.goalsCompleted, icon: '🏆' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
      <div>
        <p className="text-slate-400 text-sm">Your journey so far</p>
        <h1 className="font-display text-2xl font-bold text-white mt-0.5">Stats</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-semibold text-white mb-3">Activity</p>
        <HeatmapCalendar dayLogs={state.dayLogs} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{t.icon}</span>
              <span className="text-xs text-slate-400 font-medium">{t.label}</span>
            </div>
            <p className="font-display text-2xl font-bold text-white">{t.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
