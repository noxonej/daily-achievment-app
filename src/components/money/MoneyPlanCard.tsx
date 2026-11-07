import { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { buildMoneyPlan, suggestedSaveRate } from '../../lib/moneyPlan';
import { parseMoney, centsToInput, splitDailyLimit } from '../../lib/money';
import { todayKey } from '../../lib/date';
import { formatEventDate, weekdayShort } from '../../lib/weekPlan';
import { Icon } from '../Icon';
import { AmountInput, card, primaryBtn, secondaryBtn, useMoney } from './ui';

const KIND_ICON = { fun: '🎉', food: '🍔', transport: '🚌', gift: '🎁' } as const;

/** "Plan my money": income → save / bills / spend, then a day-by-day budget shaped by your week plan. */
export function MoneyPlanCard() {
  const { state } = useApp();
  const { money, fmt, dispatch } = useMoney();
  const plan = buildMoneyPlan(state, money);
  const [editing, setEditing] = useState(false);
  const [applied, setApplied] = useState(false);
  const today = todayKey();

  if (!plan || editing) return <IncomeSetup onDone={() => setEditing(false)} />;
  const max = Math.max(...plan.days.map((d) => d.amount), 1);
  const todayPlan = plan.days.find((d) => d.date === today);

  return (
    <div className={`${card} p-5`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">
            <Icon name="🧮" size="1.15em" className="icon-inline text-amber-300" />
            Your money plan
          </p>
          <p className="text-xs text-slate-400 mt-0.5">From {fmt(plan.monthlyIn, true)} a month and your week plan</p>
        </div>
        <button onClick={() => setEditing(true)} className={`${secondaryBtn} shrink-0 px-2.5 py-1.5 text-xs`}>
          Edit
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <Split label="Save" value={fmt(plan.saveMonthly, true)} sub={`${Math.round(plan.saveRate * 100)}% first`} tone="text-emerald-300" />
        <Split label="Bills" value={fmt(plan.billsMonthly, true)} sub="a month" tone="text-sky-300" />
        <Split label="Spend" value={fmt(plan.spendWeekly, true)} sub="a week" tone="text-amber-300" />
      </div>

      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-5 mb-2">This week, day by day</p>
      <div className="grid grid-cols-7 gap-1.5 items-end h-24" aria-label="Spending plan per day">
        {plan.days.map((d) => (
          <div key={d.day} className="flex flex-col items-center justify-end h-full">
            <span className="text-[10px] font-bold text-slate-300 tabular-nums mb-1">{fmt(d.amount, true)}</span>
            <div
              className={`w-full rounded-t-md bar-grow-y ${d.date === today ? 'bg-amber-400' : d.reasons.length ? 'bg-amber-500/60' : 'bg-white/15'}`}
              style={{ height: `${Math.max(8, (d.amount / max) * 70)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 mt-1">
        {plan.days.map((d) => (
          <div key={d.day} className="text-center">
            <p className={`text-[10px] font-semibold ${d.date === today ? 'text-amber-300' : 'text-slate-500'}`}>{weekdayShort(d.day)}</p>
            <div className="flex justify-center gap-0.5 mt-0.5 h-3">
              {[...new Set(d.reasons.map((r) => r.kind))].map((k) => (
                <Icon key={k} name={KIND_ICON[k]} size={10} className="text-slate-400" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {todayPlan && (
        <p className="text-sm text-slate-300 mt-4">
          <b className="text-white">Today: {fmt(todayPlan.amount)}</b>
          {todayPlan.reasons.length > 0 ? ` (${todayPlan.reasons.map((r) => r.text).slice(0, 2).join(', ')})` : ': a quiet day, a good one to save on.'}
        </p>
      )}
      {plan.gifts.map((g) => (
        <p key={g.text + g.date} className="text-sm text-amber-200 mt-2">
          <Icon name="🎁" size="1.1em" className="icon-inline" />
          {g.text} {formatEventDate(g.date).toLowerCase() === 'today' ? 'today' : `on ${formatEventDate(g.date)}`}: put a little aside for a present.
        </p>
      ))}

      <button
        onClick={() => {
          const perDay = Math.round(plan.spendWeekly / 7);
          dispatch({ type: 'MONEY_SET_CATEGORIES', categories: splitDailyLimit(money.categories, perDay) });
          setApplied(true);
        }}
        className={`${primaryBtn} w-full py-3 mt-4`}
      >
        {applied ? 'Daily limit updated ✓' : `Use it: ${fmt(Math.round(plan.spendWeekly / 7))} a day limit`}
      </button>
      <p className="text-[11px] text-slate-500 mt-2 text-center">Move the "Save" part to savings the day you get your money.</p>
    </div>
  );
}

function Split({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="rounded-xl bg-black/20 border border-white/[0.06] p-2.5 text-center">
      <p className={`text-[11px] font-bold ${tone}`}>{label}</p>
      <p className="font-display text-base font-extrabold text-white tabular-nums mt-0.5">{value}</p>
      <p className="text-[10px] text-slate-500">{sub}</p>
    </div>
  );
}

function IncomeSetup({ onDone }: { onDone: () => void }) {
  const { money, dispatch } = useMoney();
  const [amount, setAmount] = useState(money.income ? centsToInput(money.income.monthly) : '');
  const [kind, setKind] = useState<'allowance' | 'salary'>(money.income?.kind ?? 'allowance');
  const [rate, setRate] = useState(Math.round((money.saveRate ?? suggestedSaveRate(money.income?.kind ?? 'allowance')) * 100));
  const cents = parseMoney(amount);
  return (
    <div className={`${card} p-5`}>
      <p className="text-sm font-semibold text-white">
        <Icon name="🧮" size="1.15em" className="icon-inline text-amber-300" />
        Plan my money
      </p>
      <p className="text-xs text-slate-400 mt-0.5">Get a simple plan: what to save, and how much you can spend each day.</p>
      <label className="block mt-4">
        <span className="text-sm font-semibold text-slate-300">Money I get per month</span>
        <div className="mt-1.5">
          <AmountInput value={amount} onChange={setAmount} invalid={amount !== '' && cents === null} />
        </div>
      </label>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/[0.04] border border-white/10 p-1 mt-3" role="radiogroup" aria-label="Where it comes from">
        {(['allowance', 'salary'] as const).map((k) => (
          <button
            key={k}
            role="radio"
            aria-checked={kind === k}
            onClick={() => {
              setKind(k);
              setRate(Math.round(suggestedSaveRate(k) * 100));
            }}
            className={`rounded-lg py-2 text-sm font-bold ${kind === k ? 'bg-amber-500 text-white' : 'text-slate-400'}`}
          >
            {k === 'allowance' ? 'Pocket money' : 'Salary / job'}
          </button>
        ))}
      </div>
      <label className="block mt-4">
        <span className="text-sm font-semibold text-slate-300">Save {rate}% of it</span>
        <input type="range" min={0} max={60} step={5} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full mt-2 accent-[var(--color-amber-500)]" aria-label="Savings rate" />
        <span className="block text-xs text-slate-500">{kind === 'allowance' ? 'With pocket money, saving 30% is a great habit.' : 'The 50/30/20 rule saves 20%.'}</span>
      </label>
      <button
        disabled={!cents}
        onClick={() => {
          if (!cents) return;
          dispatch({ type: 'MONEY_SET_INCOME', income: { monthly: cents, kind }, saveRate: rate / 100 });
          onDone();
        }}
        className={`${primaryBtn} w-full py-3 mt-4`}
      >
        Make my plan
      </button>
    </div>
  );
}
