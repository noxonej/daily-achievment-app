import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../store/AppContext';
import { parseQuickAdd, type Parsed } from '../../lib/quickAdd';
import { formatEventDate, formatPlanTime, weekdayOfDate, weekdayShort } from '../../lib/weekPlan';
import { formatMoney } from '../../lib/money';
import { Icon } from '../Icon';

const EXAMPLES = ['Dentist tomorrow 15:00', 'Spent 4.50 on lunch', 'Every day: read 10 pages', 'Gym every monday 17:30', 'Call grandma', 'Exam on friday'];

function describe(p: Parsed, currency: string): { icon: string; label: string; tone: string } {
  switch (p.kind) {
    case 'event':
      return { icon: '📅', label: `Plan · ${formatEventDate(p.date)}${p.time ? ` · ${formatPlanTime(p.time)}` : ''} · ${p.text}`, tone: 'text-violet-200 bg-violet-500/10 border-violet-400/30' };
    case 'weekly':
      return { icon: '🔁', label: `Every ${p.days.map(weekdayShort).join(', ')}${p.time ? ` · ${formatPlanTime(p.time)}` : ''} · ${p.text}`, tone: 'text-violet-200 bg-violet-500/10 border-violet-400/30' };
    case 'expense':
      return { icon: '💸', label: `Spent ${formatMoney(p.amount, currency)}${p.note ? ` · ${p.note}` : ''}`, tone: 'text-emerald-200 bg-emerald-500/10 border-emerald-400/30' };
    case 'quest':
      return { icon: '🎯', label: `New daily quest · ${p.title}`, tone: 'text-amber-200 bg-amber-500/10 border-amber-400/30' };
    default:
      return { icon: '✅', label: `To-do for today · ${p.text}`, tone: 'text-sky-200 bg-sky-500/10 border-sky-400/30' };
  }
}

/**
 * One box for everything: type it in plain words and the app files it in the right place
 * (plan, money, quests or today's to-dos). It shows what it understood before you add it.
 */
export function QuickAdd() {
  const { state, dispatch } = useApp();
  const [text, setText] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [hint, setHint] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const currency = state.money?.currency ?? 'USD';
  const parsed = parseQuickAdd(text, state);
  const info = parsed ? describe(parsed, currency) : null;

  useEffect(() => {
    const t = setInterval(() => setHint((h) => (h + 1) % EXAMPLES.length), 3500);
    return () => clearInterval(t);
  }, []);

  function add() {
    if (!parsed || !info) return;
    switch (parsed.kind) {
      case 'event':
        dispatch({ type: 'PLAN_ADD', day: weekdayOfDate(parsed.date), text: parsed.text, time: parsed.time, date: parsed.date });
        break;
      case 'weekly':
        for (const day of parsed.days) dispatch({ type: 'PLAN_ADD', day, text: parsed.text, time: parsed.time });
        break;
      case 'expense': {
        const account = state.money?.accounts.find((a) => a.kind === 'spending');
        dispatch({ type: 'MONEY_ADD_EXPENSE', amount: parsed.amount, categoryId: parsed.categoryId, accountId: account?.id, note: parsed.note || undefined });
        break;
      }
      case 'quest':
        dispatch({ type: 'ADD_QUEST', quest: { title: parsed.title, frequency: 'daily', difficulty: 'easy', icon: '✨', category: 'Life' } });
        break;
      default:
        dispatch({ type: 'ADD_QUICK_TASK', text: parsed.text });
    }
    try {
      navigator.vibrate?.(15);
    } catch {
      // optional
    }
    setDone(info.label);
    setText('');
    setTimeout(() => setDone(null), 2400);
  }

  return (
    <section aria-label="Quick add" className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="flex gap-2"
      >
        <label className="flex-1 min-w-0 flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 focus-within:border-amber-400/60 px-3">
          <Icon name="＋" size={17} className="shrink-0 text-amber-300" />
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Try “${EXAMPLES[hint]}”`}
            aria-label="Quick add: type anything"
            enterKeyHint="done"
            className="flex-1 min-w-0 h-11 bg-transparent text-base text-white placeholder:text-slate-500 focus:outline-none"
          />
        </label>
        <button type="submit" disabled={!parsed} className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold px-4">
          Add
        </button>
      </form>
      {info && (
        <p className={`mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${info.tone}`}>
          <Icon name={info.icon} size={13} className="shrink-0" />
          <span className="truncate">{info.label}</span>
        </p>
      )}
      {!info && done && (
        <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200 fade-up">
          <Icon name="✓" size={13} className="shrink-0" />
          <span className="truncate">Added: {done}</span>
        </p>
      )}
    </section>
  );
}
