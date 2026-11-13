import { useApp } from '../store/AppContext';
import { addDaysToKey, todayKey } from '../lib/date';
import { formatMoney, spentOn } from '../lib/money';
import { MOODS } from '../lib/mood';
import { Icon } from './Icon';
import { useState } from 'react';
import { drawShareCard, shareImage } from '../lib/shareCard';
import { rankForLevel } from '../lib/ranks';

/** Monday-based week keys: `offset` 0 = this week so far, -1 = last week. */
function weekDays(offset: number): string[] {
  const today = todayKey();
  const d = new Date();
  const mondayOffset = (d.getDay() + 6) % 7;
  const monday = addDaysToKey(today, -mondayOffset + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDaysToKey(monday, i));
  return offset === 0 ? days.filter((k) => k <= today) : days;
}

/** A small "your week in numbers" summary across quests, focus, runs, money and mood. */
export function WeekRecap({ offset = 0, dismissible, onDismiss }: { offset?: 0 | -1; dismissible?: boolean; onDismiss?: () => void }) {
  const { state, stats } = useApp();
  const [sharing, setSharing] = useState<string | null>(null);
  const days = weekDays(offset);
  const logs = days.map((k) => state.dayLogs[k]).filter(Boolean);
  const questsDone = logs.reduce((n, l) => n + (l?.completedQuestIds.length ?? 0), 0);
  const perfect = logs.filter((l) => l?.perfectDay && l.dailyQuestCount > 0).length;
  const focus = days.reduce((n, k) => n + (state.focusMinutes?.[k] ?? 0), 0);
  const km = (state.runs ?? []).filter((r) => days.includes(r.date)).reduce((n, r) => n + r.km, 0);
  const spent = days.reduce((n, k) => n + spentOn(state.money?.expenses ?? [], k), 0);
  const moods = days.map((k) => state.moods?.[k]).filter((m): m is NonNullable<typeof m> => !!m);
  const avgMood = moods.length ? Math.round(moods.reduce((a, b) => a + b, 0) / moods.length) : 0;
  const mood = MOODS.find((m) => m.value === avgMood);
  const xp = logs.reduce((n, l) => n + (l?.xpEarned ?? 0), 0);

  const tiles = [
    { icon: '✅', label: 'Quests done', value: String(questsDone), color: 'text-emerald-300' },
    { icon: '✨', label: 'Perfect days', value: `${perfect}/${days.length}`, color: 'text-amber-300' },
    { icon: '⏱', label: 'Focus', value: focus >= 60 ? `${Math.round(focus / 6) / 10}h` : `${focus}m`, color: 'text-sky-300' },
    { icon: '🏃', label: 'Ran', value: `${Math.round(km * 10) / 10} km`, color: 'text-emerald-300' },
    { icon: '💸', label: 'Spent', value: state.money?.setupDone ? formatMoney(spent, state.money.currency, { compact: true }) : '–', color: 'text-cyan-300' },
    { icon: mood?.icon ?? '😐', label: 'Avg mood', value: mood?.label ?? '–', color: mood?.color ?? 'text-slate-400' },
  ];
  const headline =
    perfect >= 5 ? 'Incredible week. Keep that energy.' : perfect >= 3 ? 'Solid week. You showed up.' : questsDone > 0 ? 'Every quest counts. Next week, aim for one more perfect day.' : 'A fresh week is a fresh start.';

  async function share() {
    setSharing('Making your image…');
    try {
      const blob = await drawShareCard({
        title: offset === 0 ? 'My week so far' : 'My week',
        headline,
        stats: [
          { label: 'quests done', value: String(questsDone) },
          { label: 'perfect days', value: `${perfect}/${days.length}` },
          { label: 'day streak', value: String(stats.currentStreak) },
          { label: 'XP earned', value: String(xp) },
          ...(focus > 0 ? [{ label: 'focus', value: focus >= 60 ? `${Math.round(focus / 6) / 10}h` : `${focus}m` }] : []),
          ...(km > 0 ? [{ label: 'km run', value: String(Math.round(km * 10) / 10) }] : []),
        ],
        footer: `Rank: ${rankForLevel(stats.level).name} · Level ${stats.level}`,
      });
      const r = await shareImage(blob, 'squzo-week.png', 'My week on Squzo');
      setSharing(r === 'downloaded' ? 'Saved the image. Post it to your story!' : null);
    } catch (e) {
      setSharing(e instanceof Error ? e.message : 'Could not share.');
    }
  }

  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      {dismissible && (
        <button onClick={onDismiss} aria-label="Dismiss" className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10">
          <Icon name="✕" size={16} />
        </button>
      )}
      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">{offset === 0 ? 'This week so far' : 'Last week recap'}</p>
      <p className="font-display text-lg font-bold text-white mt-0.5 pr-8">{headline}</p>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl bg-black/20 border border-white/[0.06] px-2.5 py-2">
            <Icon name={t.icon} size={15} className={t.color} />
            <p className="font-display text-base font-bold text-white mt-1 tabular-nums truncate">{t.value}</p>
            <p className="text-[10px] text-slate-500">{t.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 mt-2.5">
        <p className="text-[11px] text-slate-500">+{xp} XP earned from daily quests</p>
        <button onClick={share} className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white">
          <Icon name="📤" size={13} />
          Share
        </button>
      </div>
      {sharing && <p className="text-[11px] text-amber-200 mt-1.5">{sharing}</p>}
    </div>
  );
}
