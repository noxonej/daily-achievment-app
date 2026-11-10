import { useState } from 'react';
import { todayKey } from '../../lib/date';
import { centsToInput, parseMoney, totalByKind } from '../../lib/money';
import { billsPerMonth, monthStart, spendByCategory } from '../../lib/moneyTips';
import { Icon } from '../Icon';
import { Modal } from '../Modal';
import { AmountInput, card, primaryBtn, secondaryBtn, useMoney } from './ui';

function daysInMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/**
 * "Give every euro a job" (envelope budgeting, like YNAB, without the learning curve): the money you
 * get this month, minus fixed costs and what you save first, is "Ready to assign". You split it into
 * envelopes per category and see what's left in each as you spend.
 */
export function BudgetCard() {
  const { money, fmt } = useMoney();
  const [open, setOpen] = useState(false);
  const today = todayKey();
  const income = money.income?.monthly ?? 0;
  const fixed = billsPerMonth(money);
  const saveFirst = income ? Math.round(income * (money.saveRate ?? 0.3)) : 0;
  // Without a monthly income set, budget the spending money you have now.
  const base = income ? income - fixed - saveFirst : Math.max(0, totalByKind(money.accounts, 'spending'));
  const assigned = money.categories.reduce((n, c) => n + (c.monthly ?? 0), 0);
  const ready = base - assigned;
  const spent = new Map(spendByCategory(money, monthStart(today), today).map((r) => [r.categoryId, r.amount]));
  const daysLeft = daysInMonth() - new Date().getDate() + 1;
  const any = assigned > 0;

  return (
    <div className={`${card} p-5`} id="budget">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">
            <Icon name="🧮" size="1.15em" className="icon-inline text-emerald-300" />
            Monthly budget
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Give every {money.currency === 'USD' ? 'dollar' : 'euro'} a job before you spend it.</p>
        </div>
        <button onClick={() => setOpen(true)} className={`${secondaryBtn} shrink-0 px-2.5 py-1.5 text-xs`}>
          {any ? 'Edit' : 'Assign'}
        </button>
      </div>

      <div className={`mt-3 rounded-xl border px-3 py-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 ${ready < 0 ? 'border-red-400/40 bg-red-500/10' : ready > 0 ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-black/20'}`}>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{ready < 0 ? 'Assigned too much' : 'Ready to assign'}</span>
        <span className={`ml-auto font-display text-xl font-extrabold tabular-nums whitespace-nowrap ${ready < 0 ? 'text-red-300' : 'text-white'}`}>{fmt(Math.abs(ready))}</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-1.5">
        {income
          ? `${fmt(income, true)} in − ${fmt(fixed, true)} bills & subscriptions − ${fmt(saveFirst, true)} saved first`
          : 'Based on your spending money now. Set your monthly money in "Your money plan" to budget each month.'}
      </p>

      {any ? (
        <ul className="mt-4 space-y-3">
          {money.categories
            .filter((c) => (c.monthly ?? 0) > 0 || (spent.get(c.id) ?? 0) > 0)
            .map((c) => {
              const a = c.monthly ?? 0;
              const s = spent.get(c.id) ?? 0;
              const left = a - s;
              const pct = a > 0 ? Math.min(1, s / a) : 1;
              return (
                <li key={c.id}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-semibold text-slate-200 truncate">
                      <Icon name={c.icon} size="1.1em" className="icon-inline text-emerald-300" />
                      {c.name}
                    </span>
                    <span className={`shrink-0 text-xs tabular-nums ${left < 0 ? 'text-red-300 font-bold' : 'text-slate-400'}`}>
                      {left < 0 ? `${fmt(-left)} over` : `${fmt(left)} left`} · of {fmt(a)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className={`h-full rounded-full ${left < 0 ? 'bg-red-400' : pct > 0.85 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.max(3, pct * 100)}%` }} />
                  </div>
                  {left > 0 && daysLeft > 1 && <p className="text-[10px] text-slate-500 mt-0.5">about {fmt(Math.floor(left / daysLeft))} a day for the {daysLeft} days left</p>}
                </li>
              );
            })}
        </ul>
      ) : (
        <button onClick={() => setOpen(true)} className={`${primaryBtn} w-full py-3 mt-4`}>
          Split my money into envelopes
        </button>
      )}
      {money.categories.some((c) => (c.monthly ?? 0) > 0 && (spent.get(c.id) ?? 0) > (c.monthly ?? 0)) && (
        <p className="text-xs text-amber-200 mt-3">
          <Icon name="💡" size="1.1em" className="icon-inline text-yellow-300" />
          Overspent somewhere? That's fine: move money from another envelope with Edit. Plans change, the point is to decide on purpose.
        </p>
      )}
      <AssignModal open={open} onClose={() => setOpen(false)} base={base} />
    </div>
  );
}

function AssignModal({ open, onClose, base }: { open: boolean; onClose: () => void; base: number }) {
  const { money, dispatch, fmt } = useMoney();
  const [values, setValues] = useState<Record<string, string>>({});
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setValues(Object.fromEntries(money.categories.map((c) => [c.id, c.monthly ? centsToInput(c.monthly) : ''])));
  }
  if (!open && wasOpen) setWasOpen(false);
  const cents = (id: string) => parseMoney(values[id] ?? '') ?? 0;
  const total = money.categories.reduce((n, c) => n + cents(c.id), 0);
  const ready = base - total;
  const dim = daysInMonth();

  return (
    <Modal open={open} onClose={onClose} title="Give your money a job">
      <div className="space-y-4">
        <div className={`rounded-xl border px-3 py-2.5 flex items-center justify-between ${ready < 0 ? 'border-red-400/40 bg-red-500/10' : 'border-emerald-400/40 bg-emerald-500/10'}`}>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{ready < 0 ? 'Too much assigned' : 'Ready to assign'}</span>
          <span className={`font-display text-lg font-extrabold tabular-nums ${ready < 0 ? 'text-red-300' : 'text-white'}`}>{fmt(Math.abs(ready))}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setValues(Object.fromEntries(money.categories.map((c) => [c.id, c.dailyLimit ? centsToInput(c.dailyLimit * dim) : values[c.id] ?? ''])))}
            className={`${secondaryBtn} px-3 py-1.5 text-xs`}
          >
            From my daily limits
          </button>
          <button
            onClick={() => {
              const n = money.categories.length || 1;
              const each = Math.max(0, Math.floor(base / n));
              setValues(Object.fromEntries(money.categories.map((c) => [c.id, centsToInput(each)])));
            }}
            className={`${secondaryBtn} px-3 py-1.5 text-xs`}
          >
            Split evenly
          </button>
        </div>
        <ul className="space-y-2.5">
          {money.categories.map((c) => (
            <li key={c.id} className="grid grid-cols-[1fr_9rem] items-center gap-2">
              <span className="text-sm font-semibold text-slate-200 truncate">
                <Icon name={c.icon} size="1.1em" className="icon-inline text-emerald-300" />
                {c.name}
              </span>
              <AmountInput value={values[c.id] ?? ''} onChange={(v) => setValues((s) => ({ ...s, [c.id]: v }))} invalid={!!values[c.id] && parseMoney(values[c.id]) === null} />
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            dispatch({ type: 'MONEY_SET_ASSIGNED', assigned: Object.fromEntries(money.categories.map((c) => [c.id, cents(c.id)])) });
            onClose();
          }}
          className={`${primaryBtn} w-full py-3`}
        >
          Save budget
        </button>
      </div>
    </Modal>
  );
}
