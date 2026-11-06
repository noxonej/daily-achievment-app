import { useApp } from '../store/AppContext';
import { lastNDays } from '../lib/money';
import { parseKey } from '../lib/date';
import { MOODS } from '../lib/mood';
import { Icon } from './Icon';
import { locale } from '../lib/locale';

function avg(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/** Mood across the last week, and (once there's enough data) what seems to lift it. */
export function MoodInsights() {
  const { state } = useApp();
  const moods = state.moods ?? {};
  const days = lastNDays(7);
  const entries = Object.entries(moods);
  if (entries.length === 0) return null;

  const findings: string[] = [];
  if (entries.length >= 5) {
    const perfect = entries.filter(([d]) => state.dayLogs[d]?.perfectDay).map(([, m]) => m);
    const notPerfect = entries.filter(([d]) => !state.dayLogs[d]?.perfectDay).map(([, m]) => m);
    if (perfect.length >= 2 && notPerfect.length >= 2 && avg(perfect) - avg(notPerfect) >= 0.4) {
      findings.push('You feel better on days you finish all your daily quests.');
    }
    const focused = entries.filter(([d]) => (state.focusMinutes?.[d] ?? 0) >= 25).map(([, m]) => m);
    const unfocused = entries.filter(([d]) => (state.focusMinutes?.[d] ?? 0) < 25).map(([, m]) => m);
    if (focused.length >= 2 && unfocused.length >= 2 && avg(focused) - avg(unfocused) >= 0.4) {
      findings.push('Days with at least 25 minutes of focus are your better days.');
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm font-semibold text-white">Mood this week</p>
        <p className="text-xs text-slate-500">{entries.length} check-ins total</p>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const m = MOODS.find((x) => x.value === moods[d]);
          return (
            <div key={d} className="flex flex-col items-center gap-1">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${m ? 'bg-white/5' : 'border border-dashed border-white/10'}`}>
                {m && <Icon name={m.icon} size={20} className={m.color} />}
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                {i === 6 ? 'Today' : parseKey(d).toLocaleDateString(locale(), { weekday: 'short' })}
              </span>
            </div>
          );
        })}
      </div>
      {findings.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {findings.map((f) => (
            <li key={f} className="flex gap-2 text-sm text-slate-200">
              <Icon name="💡" size={16} className="shrink-0 mt-0.5 text-amber-300" />
              {f}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500 mt-3">Keep checking in. After a few days you'll see what actually lifts your mood.</p>
      )}
    </div>
  );
}
