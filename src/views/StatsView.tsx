import { useApp } from '../store/AppContext';
import { shortNum } from '../lib/num';
import { HeatmapCalendar } from '../components/HeatmapCalendar';
import { JournalHistory } from '../components/JournalHistory';
import { Icon } from '../components/Icon';
import { MoodInsights } from '../components/MoodInsights';
import { WeekRecap } from '../components/WeekRecap';
import { todayKey } from '../lib/date';
import { t } from '../lib/prefs';

export function StatsView({ embedded = false }: { embedded?: boolean } = {}) {
  const { state, stats } = useApp();
  const focusToday = state.focusMinutes?.[todayKey()] ?? 0;
  const focusTotal = Object.values(state.focusMinutes ?? {}).reduce((a, b) => a + b, 0);

  const tiles: Array<{ label: string; value: string | number; icon: string }> = [
    { label: t('stats.totalXp'), value: stats.totalXp, icon: '⚡' },
    { label: t('stats.level'), value: stats.level, icon: '⭐' },
    { label: t('stats.streak'), value: `${stats.currentStreak}d`, icon: '🔥' },
    { label: t('stats.longest'), value: `${stats.longestStreak}d`, icon: '🏅' },
    { label: t('stats.perfect'), value: stats.totalPerfectDays, icon: '✨' },
    { label: t('stats.quests'), value: stats.totalQuestsCompleted, icon: '⚔️' },
    { label: t('stats.active'), value: stats.daysActive, icon: '🗓️' },
    { label: t('stats.goals'), value: stats.goalsCompleted, icon: '🏆' },
    { label: t('stats.focusToday'), value: `${focusToday}m`, icon: '⏱' },
    { label: t('stats.focusTotal'), value: focusTotal >= 120 ? `${Math.round(focusTotal / 6) / 10}h` : `${focusTotal}m`, icon: '⏳' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5 stagger">
      {!embedded && (
        <div>
          <p className="eyebrow">{t('stats.journey')}</p>
          <h1 className="font-display text-[30px] leading-tight font-medium tracking-tight text-white mt-1">{t('stats.title')}</h1>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-semibold text-white mb-3">{t('stats.activity')}</p>
        <HeatmapCalendar dayLogs={state.dayLogs} />
      </div>

      <WeekRecap />

      <MoodInsights />

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon name={t.icon} size={17} className="text-amber-300" />
              <span className="min-w-0 text-xs text-slate-400 font-medium truncate">{t.label}</span>
            </div>
            <p className="num-px text-[30px] text-white truncate">{typeof t.value === 'number' ? shortNum(t.value) : t.value}</p>
          </div>
        ))}
      </div>

      <JournalHistory dayLogs={state.dayLogs} weekLogs={state.weekLogs} quests={state.quests} />
    </div>
  );
}
