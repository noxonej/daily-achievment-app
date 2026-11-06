import { useState } from 'react';
import { MONEY_LESSONS, futureValue, lessonOfTheDay, smartTips, type MoneyTip } from '../../lib/moneyTips';
import { dailyLimit, parseMoney } from '../../lib/money';
import { Icon } from '../Icon';
import { AmountInput, Field, card, useMoney } from './ui';

const TONE: Record<MoneyTip['tone'], { box: string; icon: string }> = {
  good: { box: 'border-emerald-400/30 bg-emerald-500/[0.06]', icon: 'bg-emerald-500/15 text-emerald-300' },
  warn: { box: 'border-amber-400/30 bg-amber-500/[0.06]', icon: 'bg-amber-500/15 text-amber-300' },
  idea: { box: 'border-white/10 bg-white/[0.03]', icon: 'bg-sky-500/15 text-sky-300' },
};

export function TipCard({ tip }: { tip: MoneyTip }) {
  const t = TONE[tip.tone];
  return (
    <div className={`rounded-2xl border p-4 flex gap-3 ${t.box}`}>
      <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${t.icon}`}>
        <Icon name={tip.icon} size={19} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-white">{tip.title}</span>
        <span className="block text-[13px] text-slate-300 leading-relaxed mt-0.5">{tip.text}</span>
      </span>
    </div>
  );
}

/** Tips from your own numbers, money basics, and two calculators that make the maths feel real. */
export function TipsPanel() {
  const { money } = useMoney();
  const tips = smartTips(money);
  const lesson = lessonOfTheDay();
  const [allOpen, setAllOpen] = useState(false);

  return (
    <div className="space-y-4">
      <section>
        <p className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">For you, from your numbers</p>
        <div className="space-y-2.5">
          {tips.length === 0 ? (
            <TipCard tip={{ id: 'none', icon: '🏆', title: 'Looking good', text: 'No warnings right now. Keep tracking, and check back after a few more days of spending.', tone: 'good' }} />
          ) : (
            tips.slice(0, 5).map((tip) => <TipCard key={tip.id} tip={tip} />)
          )}
        </div>
      </section>

      <GrowCalculator />
      <WorthItCalculator />

      <section className={`${card} p-4`}>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Lesson of the day</p>
        <div className="flex gap-3 mt-2">
          <span className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
            <Icon name={lesson.icon} size={19} />
          </span>
          <span>
            <span className="block font-display text-base font-bold text-white">{lesson.title}</span>
            <span className="block text-[13px] text-slate-300 leading-relaxed mt-0.5">{lesson.text}</span>
          </span>
        </div>
        <button onClick={() => setAllOpen(!allOpen)} aria-expanded={allOpen} className="mt-3 text-sm font-semibold text-amber-300 hover:text-amber-200">
          {allOpen ? 'Hide lessons' : `All ${MONEY_LESSONS.length} money lessons`} {allOpen ? '▴' : '▾'}
        </button>
        {allOpen && (
          <ul className="mt-3 space-y-3 border-t border-white/[0.06] pt-3">
            {MONEY_LESSONS.filter((l) => l.id !== lesson.id).map((l) => (
              <li key={l.id} className="flex gap-3">
                <span className="shrink-0 w-8 h-8 rounded-lg bg-white/5 text-slate-300 flex items-center justify-center">
                  <Icon name={l.icon} size={16} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{l.title}</span>
                  <span className="block text-xs text-slate-400 leading-relaxed">{l.text}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-center text-[11px] text-slate-500 px-6">General money tips to help you learn, not financial advice.</p>
    </div>
  );
}

const RATES = [
  { v: 0, label: 'Under the bed', hint: '0%' },
  { v: 2, label: 'Savings account', hint: '~2%' },
  { v: 7, label: 'Index fund', hint: '~7%' },
];

/** "If I save X a month for Y years…" with compound growth, and what waiting 5 years costs. */
function GrowCalculator() {
  const { fmt } = useMoney();
  const [monthly, setMonthly] = useState('50');
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(7);
  const m = parseMoney(monthly) ?? 0;
  // Whole amounts only: the cents don't matter for a guess this far ahead.
  const whole = (c: number) => Math.round(c / 100) * 100;
  const result = whole(futureValue(m, years, rate));
  const putIn = m * years * 12;
  const late = years > 5 ? whole(futureValue(m, years - 5, rate)) : 0;

  return (
    <section className={`${card} p-4`}>
      <p className="text-sm font-bold text-white">
        <Icon name="📈" size="1.15em" className="icon-inline text-emerald-300" />
        Watch your money grow
      </p>
      <p className="text-xs text-slate-400 mt-0.5">See what saving a little every month turns into.</p>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Field label="Each month">
          <AmountInput value={monthly} onChange={setMonthly} invalid={parseMoney(monthly) === null && monthly !== ''} />
        </Field>
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">For {years} {years === 1 ? 'year' : 'years'}</span>
          <input type="range" min={1} max={40} value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full mt-4 accent-[var(--color-amber-500)]" aria-label="Years" />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-1.5 mt-3" role="radiogroup" aria-label="Where it grows">
        {RATES.map((r) => (
          <button
            key={r.v}
            role="radio"
            aria-checked={rate === r.v}
            onClick={() => setRate(r.v)}
            className={`rounded-xl border px-2 py-2 text-center transition ${rate === r.v ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 hover:border-white/25'}`}
          >
            <span className="block text-xs font-bold text-white">{r.label}</span>
            <span className="block text-[11px] text-slate-400">{r.hint} a year</span>
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-black/20 border border-white/[0.06] p-3.5">
        <p className="text-xs text-slate-400">After {years} years you'd have</p>
        <p className="font-display text-3xl font-extrabold text-white tabular-nums">{fmt(Math.round(result), true)}</p>
        <p className="text-xs text-slate-400 mt-1">
          You put in <b className="text-slate-200">{fmt(putIn, true)}</b>
          {result - putIn > 0 && (
            <>
              {' '}· growth adds <b className="text-emerald-300">{fmt(Math.round(result - putIn), true)}</b>
            </>
          )}
        </p>
        {rate > 0 && years > 5 && m > 0 && (
          <p className="text-xs text-amber-300 mt-2">
            Wait 5 years to start and you'd have only {fmt(Math.round(late), true)}. Starting early is the superpower.
          </p>
        )}
      </div>
    </section>
  );
}

/** Price → hours of work, days of your limit, and what it could grow into instead. */
function WorthItCalculator() {
  const { money, fmt } = useMoney();
  const [price, setPrice] = useState('');
  const [wage, setWage] = useState(() => {
    try {
      return localStorage.getItem('dayforge-hourly') ?? '';
    } catch {
      return '';
    }
  });
  const p = parseMoney(price) ?? 0;
  const w = parseMoney(wage) ?? 0;
  const limit = dailyLimit(money.categories);

  return (
    <section className={`${card} p-4`}>
      <p className="text-sm font-bold text-white">
        <Icon name="⚖" size="1.15em" className="icon-inline text-sky-300" />
        Is it worth it?
      </p>
      <p className="text-xs text-slate-400 mt-0.5">Thinking about buying something? See what it really costs you.</p>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Field label="Price">
          <AmountInput value={price} onChange={setPrice} />
        </Field>
        <Field label="You earn per hour">
          <AmountInput
            value={wage}
            onChange={(v) => {
              setWage(v);
              try {
                localStorage.setItem('dayforge-hourly', v);
              } catch {
                // only a convenience
              }
            }}
          />
        </Field>
      </div>
      {p > 0 && (
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {w > 0 && (
            <li className="flex gap-2">
              <Icon name="⌚" size={16} className="shrink-0 mt-0.5 text-sky-300" />
              <span>
                <b className="text-white">{(p / w).toFixed(p / w < 10 ? 1 : 0)} hours</b> of work to pay for it
              </span>
            </li>
          )}
          {limit > 0 && (
            <li className="flex gap-2">
              <Icon name="📅" size={16} className="shrink-0 mt-0.5 text-sky-300" />
              <span>
                <b className="text-white">{(p / limit).toFixed(p / limit < 10 ? 1 : 0)} days</b> of your daily limit
              </span>
            </li>
          )}
          <li className="flex gap-2">
            <Icon name="📈" size={16} className="shrink-0 mt-0.5 text-emerald-300" />
            <span>
              Invested instead, it could be <b className="text-white">{fmt(Math.round(futureValue(0, 10, 7, p) / 100) * 100, true)}</b> in 10 years
            </span>
          </li>
          <li className="flex gap-2 text-xs text-slate-400">
            <Icon name="⏳" size={15} className="shrink-0 mt-0.5" />
            <span>Still want it tomorrow? Then it's probably a good buy.</span>
          </li>
        </ul>
      )}
    </section>
  );
}
