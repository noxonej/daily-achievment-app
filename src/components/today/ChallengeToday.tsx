import { useApp } from '../../store/AppContext';
import { challengeDay } from '../../lib/social';
import { todayKey } from '../../lib/date';
import { Icon } from '../Icon';
import { L } from '../../lib/lang';

/** Today: the quests of challenges you're in, ticked right here (B3). */
export function ChallengeToday({ onOpen }: { onOpen: () => void }) {
  const { state, dispatch } = useApp();
  const today = todayKey();
  const live = (state.challenges ?? []).filter((c) => {
    const d = challengeDay(c, today);
    return d >= 1 && d <= c.days && !c.finishedAt;
  });
  if (!live.length) return null;
  return (
    <>
      {live.map((c) => {
        const done = new Set(c.done[today] ?? []);
        return (
          <section key={c.code} className="rounded-[22px] border border-[var(--mood2)]/30 bg-[var(--mood2)]/[0.06] p-4">
            <button onClick={onOpen} className="w-full flex items-center gap-2 text-left">
              <Icon name={c.badge} size={16} className="text-[var(--mood2)]" />
              <span className="flex-1 min-w-0 text-sm font-bold text-white truncate">{c.title}</span>
              <span className="text-xs font-semibold text-slate-400 tabular-nums">
                {L('Day', 'Diena')} {challengeDay(c, today)}/{c.days} · {done.size}/{c.quests.length}
              </span>
            </button>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {c.quests.map((q, i) => {
                const on = done.has(i);
                return (
                  <button
                    key={i}
                    aria-pressed={on}
                    onClick={() => dispatch({ type: 'CHALLENGE_TICK', code: c.code, index: i })}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${on ? 'border-[var(--mood2)] bg-[var(--mood2)] text-slate-950' : 'border-white/15 text-slate-200'}`}
                  >
                    <Icon name={on ? '✓' : q.icon} size={13} />
                    {q.title}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
