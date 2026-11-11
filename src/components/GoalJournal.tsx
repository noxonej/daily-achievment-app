import { useState } from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { useApp } from '../store/AppContext';
import { todayKey } from '../lib/date';
import type { LongTermGoal } from '../lib/types';
import { LOG_SETUP, goalKind, goalTip, logUnit } from '../lib/goalCoach';

/**
 * The journal under a long-term goal: log each book or session, see the last few,
 * and get a tip that fits what you logged.
 */
export function GoalJournal({ goal }: { goal: LongTermGoal }) {
  const { dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const kind = goalKind(goal);
  if (!kind) return null;
  const setup = LOG_SETUP[kind];
  const tip = goalTip(goal);
  const log = goal.log ?? [];
  const recent = [...log].reverse().slice(0, showAll ? 50 : 3);

  return (
    <div className="mt-3 space-y-2.5">
      {tip && (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.07] px-3 py-2.5">
          <p className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
            <Icon name="💡" size={13} /> {tip.title}
          </p>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{tip.text}</p>
        </div>
      )}

      {recent.length > 0 && (
        <ul className="space-y-1">
          {recent.map((e) => (
            <li key={e.id} className="flex items-center gap-2 text-xs text-slate-300">
              <span className="shrink-0 text-slate-500 tabular-nums w-11">{e.date.slice(5).replace('-', '/')}</span>
              <span className="min-w-0 flex-1 truncate">
                {e.text || e.tag || setup.noun}
                {e.text && e.tag ? <span className="text-slate-500"> · {e.tag}</span> : null}
                {e.minutes ? <span className="text-slate-500"> · {e.minutes} min</span> : null}
                {logUnit(goal) === 'km' ? <span className="text-slate-500"> · {e.amount} km</span> : null}
              </span>
              <button
                type="button"
                onClick={() => dispatch({ type: 'DELETE_GOAL_LOG', goalId: goal.id, entryId: e.id })}
                className="shrink-0 p-1 text-slate-600 hover:text-red-400"
                aria-label={`Remove ${e.text || e.tag || setup.noun}`}
              >
                <Icon name="✕" size={12} />
              </button>
            </li>
          ))}
          {log.length > 3 && (
            <li>
              <button type="button" onClick={() => setShowAll((v) => !v)} className="text-xs font-semibold text-slate-400 hover:text-white">
                {showAll ? 'Show less' : `Show all ${log.length}`}
              </button>
            </li>
          )}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-100 text-sm font-semibold py-2 transition"
      >
        + Log a {setup.noun}
      </button>
      <LogSheet goal={goal} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function LogSheet({ goal, open, onClose }: { goal: LongTermGoal; open: boolean; onClose: () => void }) {
  const { dispatch } = useApp();
  const kind = goalKind(goal)!;
  const setup = LOG_SETUP[kind];
  const unit = logUnit(goal);
  const [text, setText] = useState('');
  const [tag, setTag] = useState<string | undefined>();
  const [minutes, setMinutes] = useState('');
  const [km, setKm] = useState('');

  const mins = Math.max(0, Math.round(Number(minutes) || 0));
  const kmNum = Math.max(0, Number(km.replace(',', '.')) || 0);
  const amount = unit === 'km' ? Math.round(kmNum * 10) / 10 : unit === 'hours' ? Math.round((mins / 60) * 10) / 10 : 1;
  const valid = amount > 0 && (kind !== 'books' || !!text.trim());

  function save() {
    if (!valid) return;
    dispatch({
      type: 'ADD_GOAL_LOG',
      goalId: goal.id,
      entry: {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: todayKey(),
        text: text.trim() || undefined,
        tag,
        minutes: mins || undefined,
        amount,
      },
    });
    setText('');
    setTag(undefined);
    setMinutes('');
    setKm('');
    onClose();
  }

  const input =
    'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400';

  return (
    <Modal open={open} onClose={onClose} title={`Log a ${setup.noun}`}>
      <div className="space-y-4">
        {setup.textLabel && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">{setup.textLabel}</label>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={kind === 'books' ? 'Atomic Habits' : kind === 'art' ? 'A sketch of my dog' : 'Built a login page'}
              className={input}
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">{setup.tagLabel}</label>
          <div className="flex flex-wrap gap-2">
            {setup.tags.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTag(tag === t ? undefined : t)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  tag === t ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-white/10 bg-white/5 text-slate-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {(setup.minutes || unit === 'hours') && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Minutes{unit === 'hours' ? '' : ' (optional)'}</label>
            <input type="number" inputMode="numeric" min={0} value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="30" className={input} />
          </div>
        )}
        {unit === 'km' && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Kilometres</label>
            <input type="number" inputMode="decimal" min={0} step="0.1" value={km} onChange={(e) => setKm(e.target.value)} placeholder="5" className={input} />
          </div>
        )}
        <button
          type="button"
          onClick={save}
          disabled={!valid}
          className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 transition"
        >
          Save {unit === 'one' ? `(+1 ${goal.unit})` : `(+${amount} ${unit === 'km' ? 'km' : 'h'})`}
        </button>
      </div>
    </Modal>
  );
}
