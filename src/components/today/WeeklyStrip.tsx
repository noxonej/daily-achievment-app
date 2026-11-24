import { useApp } from '../../store/AppContext';
import { weekKey } from '../../lib/date';
import { useWeeklyResetLabel } from '../../lib/useResetCountdown';
import { setIntent } from '../../lib/intents';
import { L, isLt } from '../../lib/lang';
import { Icon } from '../Icon';
import { UNIT_META } from '../../lib/measure';
import type { ViewId } from '../NavTabs';
import './weekly.css';

const DAYS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAYS_LT = ['P', 'A', 'T', 'K', 'P', 'Š', 'S'];

/**
 * This week's quests, right under the daily ones (2026-11-24: "I almost forgot weekly quests
 * existed"). Its own look so you can tell it apart from daily quests at a glance: a sky-blue
 * "WEEKLY" tag, a 7-day track and the time left. Tap it to open the full list in Goals.
 */
export function WeeklyStrip({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { state } = useApp();
  const left = useWeeklyResetLabel();
  const key = weekKey();
  const log = state.weekLogs[key];
  const done = log?.completedQuestIds ?? [];
  const quests = state.quests.filter((q) => q.frequency === 'weekly' && !q.archived && (!q.wildcardWeekKey || q.wildcardWeekKey === key));
  const main = quests.filter((q) => !q.wildcardWeekKey);
  if (quests.length === 0) return null;
  const doneMain = main.filter((q) => done.includes(q.id)).length;
  const all = main.length > 0 && doneMain === main.length;
  // Today's place in the week, Monday first.
  const dayIdx = (new Date().getDay() + 6) % 7;
  // The next one to work on: unfinished, number quests with progress first.
  const open = quests.filter((q) => !done.includes(q.id));
  const next = [...open].sort((a, b) => (log?.progress?.[b.id] ?? 0) / (b.measure?.target ?? 1) - (log?.progress?.[a.id] ?? 0) / (a.measure?.target ?? 1))[0];
  const nextVal = next?.measure ? log?.progress?.[next.id] ?? 0 : 0;
  const days = isLt() ? DAYS_LT : DAYS_EN;

  return (
    <button
      type="button"
      onClick={() => {
        setIntent('quests-weekly');
        onNavigate('quests');
      }}
      className={`weekly-strip w-full text-left rounded-2xl px-4 py-3.5 ${all ? 'is-done' : ''}`}
      aria-label={L(`Weekly quests: ${doneMain} of ${main.length} done, ${left} left`, `Savaitės užduotys: ${doneMain} iš ${main.length}, liko ${left}`)}
    >
      <span className="flex items-center gap-2">
        <span className="weekly-tag px-label">{L('Weekly', 'Savaitės')}</span>
        <span className="flex-1 min-w-0 truncate text-[13px] font-semibold text-white">
          {all ? L('Perfect week! All done', 'Tobula savaitė!') : L(`${doneMain} of ${main.length} done`, `Atlikta ${doneMain} iš ${main.length}`)}
        </span>
        <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-sky-200/80">
          <Icon name="⏳" size={12} />
          {L(`${left} left`, `liko ${left}`)}
        </span>
      </span>

      {/* one segment per weekly quest */}
      {main.length > 0 && (
        <span className="mt-2.5 flex gap-1" aria-hidden="true">
          {main.map((q) => {
            const d = done.includes(q.id);
            const part = !d && q.measure ? Math.min(1, (log?.progress?.[q.id] ?? 0) / q.measure.target) : 0;
            return (
              <span key={q.id} className="weekly-seg flex-1">
                <span className="weekly-seg-fill" style={{ transform: `scaleX(${d ? 1 : part})` }} />
              </span>
            );
          })}
        </span>
      )}

      <span className="mt-2.5 flex items-center gap-3">
        <span className="flex-1 min-w-0">
          {next ? (
            <span className="flex items-center gap-1.5 text-[12px] text-slate-300 min-w-0">
              <Icon name={next.icon} size={14} className="shrink-0 text-sky-300" />
              <span className="truncate">
                {L('Next:', 'Toliau:')} <b className="font-semibold text-white">{next.title}</b>
              </span>
              {next.measure && (
                <span className="shrink-0 tabular-nums text-sky-200/80">
                  {nextVal}/{next.measure.target} {UNIT_META[next.measure.unit]?.label}
                </span>
              )}
            </span>
          ) : (
            <span className="text-[12px] text-emerald-300 font-semibold">{L('Every weekly quest is finished.', 'Visos savaitės užduotys atliktos.')}</span>
          )}
        </span>
        {/* where you are in the week */}
        <span className="shrink-0 flex gap-[3px]" aria-hidden="true">
          {days.map((d, i) => (
            <span key={i} className={`weekly-day ${i < dayIdx ? 'past' : i === dayIdx ? 'now' : ''}`}>
              {d}
            </span>
          ))}
        </span>
        <Icon name="›" size={16} className="shrink-0 text-slate-500" />
      </span>
    </button>
  );
}
