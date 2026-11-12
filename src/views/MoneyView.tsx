import { useEffect, useState } from 'react';
import { SavePanel } from '../components/money/SavePanel';
import { InfoTip } from '../components/Guide';
import type { MoneyAccount, MoneyKind, SavingsGoal, SpendCategory } from '../lib/types';
import { todayKey, parseKey } from '../lib/date';
import {
  CURRENCIES,
  GOAL_PRESETS,
  MONEY_KINDS,
  centsToInput,
  dailyLimit,
  expensesOn,
  formatWeeks,
  goalProgress,
  guessCurrency,
  kindMeta,
  lastNDays,
  moneyId,
  parseMoney,
  spentOn,
  splitDailyLimit,
  totalByKind,
} from '../lib/money';
import { Segmented } from '../components/Segmented';
import { CryptoPanel } from '../components/money/CryptoPanel';
import { TipsPanel, TipCard } from '../components/money/TipsPanel';
import { BillsCard, MonthCard, SubscriptionCalculator } from '../components/money/BillsCard';
import { WishlistCard } from '../components/money/WishlistCard';
import { BudgetCard } from '../components/money/BudgetCard';
import { MoneyPlanCard } from '../components/money/MoneyPlanCard';
import { CashCounter } from '../components/money/CashCounter';
import { cryptoTotal } from '../lib/crypto';
import { billsPerMonth, lessonOfTheDay, smartTips } from '../lib/moneyTips';
import { AmountInput, Field, card, inputClass, primaryBtn, secondaryBtn, useMoney } from '../components/money/ui';
import { isOwnFund } from '../store/reducer';
import { useCountUp } from '../lib/useCountUp';
import { takeIntent } from '../lib/intents';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Icon, IconGrid } from '../components/Icon';
import { locale } from '../lib/locale';

/** A money amount that counts up when it first appears and when it changes. */
function CountUp({ value, format }: { value: number; format: (cents: number) => string }) {
  return <>{format(useCountUp(value, 800, 0))}</>;
}

export function MoneyView() {
  const { money, dispatch } = useMoney();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState<TransferPreset | null>(null);
  const [editing, setEditing] = useState<MoneyAccount | 'new' | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | 'new' | null>(null);
  // Simple by design: Home has only what you use every day. Everything else is one tap away in Tools.
  const [tab, setTab] = useState<'home' | 'tools' | 'learn'>('home');
  const [tool, setTool] = useState<ToolId | null>(null);
  function goTo(id: string) {
    const map: Record<string, ToolId> = { 'money-plan': 'plan', budget: 'budget', bills: 'bills', wishlist: 'wishlist' };
    setTab('tools');
    setTool(map[id] ?? null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const [countOpen, setCountOpen] = useState(false);
  useEffect(() => {
    if (takeIntent('add-expense') && money.setupDone) setExpenseOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 stagger">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Your money</p>
          <h1 className="font-display text-[30px] leading-tight font-medium tracking-tight text-white mt-1 flex items-center gap-1">
            Money
            <InfoTip title="Know where your money goes" text="Tell the app how much you have. When you buy something, tap I spent money. Stay under your daily limit and watch your savings goals fill up. Everything stays on your phone." />
          </h1>
        </div>
        {money.setupDone && (
          <select
            value={money.currency}
            onChange={(e) => dispatch({ type: 'MONEY_SET_CURRENCY', currency: e.target.value })}
            aria-label="Currency"
            className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm font-semibold text-slate-200 focus:outline-none focus:border-amber-400/60"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {!money.setupDone ? (
        <SetupCard />
      ) : (
        <>
          <MoneyHero />
          <Segmented
            value={tab}
            onChange={(v) => {
              setTab(v);
              setTool(null);
            }}
            options={[
              { id: 'home', label: 'Home', icon: '💰' },
              { id: 'tools', label: 'Tools', icon: '🔧' },
              { id: 'learn', label: 'Learn', icon: '💡' },
            ]}
          />
          {tab === 'learn' ? (
            <div className="animate-view-in">
              <TipsPanel />
            </div>
          ) : tab === 'tools' ? (
            <div key={tool ?? 'grid'} className="animate-view-in space-y-4">
              {!tool ? (
                <ToolGrid onOpen={setTool} />
              ) : (
                <>
                  <button onClick={() => setTool(null)} className="flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white">
                    <Icon name="‹" size={18} /> All tools
                  </button>
                  {tool === 'month' && (
                    <>
                      <MonthSummary />
                      <MonthCard />
                      <HistoryCard />
                    </>
                  )}
                  {tool === 'plan' && <MoneyPlanCard onChangeMode={() => setTool('save')} />}
                  {tool === 'budget' && <BudgetCard />}
                  {tool === 'bills' && (
                    <>
                      <BillsCard />
                      <SubscriptionCalculator />
                    </>
                  )}
                  {tool === 'wishlist' && <WishlistCard />}
                  {tool === 'save' && <SavePanel onGo={goTo} />}
                  {tool === 'assets' && <CryptoPanel />}
                  {tool === 'accounts' && (
                    <AccountsCard
                      onCount={() => setCountOpen(true)}
                      onEdit={(a) => setEditing(a)}
                      onAdd={() => setEditing('new')}
                      onTransfer={() => setTransferOpen({})}
                    />
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="animate-view-in space-y-4">
              <TodayCard
                onAddExpense={() => setExpenseOpen(true)}
                onEditLimits={() => setLimitsOpen(true)}
                onSaveLeftover={(amount) => setTransferOpen({ fromKind: 'spending', toKind: 'savings', amount })}
              />
              <GoalsCard
                onAdd={() => setEditingGoal('new')}
                onEdit={(g) => setEditingGoal(g)}
                onAddMoney={(g) => setTransferOpen({ fromKind: 'spending', toId: g.accountId })}
                onTakeOut={(g) => setTransferOpen({ fromId: g.accountId, toKind: 'spending' })}
              />
              <TopTip onMore={() => setTab('learn')} />
              <button
                onClick={() => setTab('tools')}
                className="w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/20 px-4 py-3.5 text-left transition"
              >
                <span className="w-9 h-9 rounded-xl bg-[color-mix(in_srgb,var(--mood)_15%,transparent)] text-[var(--mood)] flex items-center justify-center">
                  <Icon name="🧰" size={18} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-white">More money tools</span>
                  <span className="block text-xs text-slate-400 truncate">Budget, bills, wishlist, accounts, month report, investing</span>
                </span>
                <Icon name="›" size={18} className="text-slate-400" />
              </button>
            </div>
          )}
        </>
      )}

      <ExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} />
      <CashCounter open={countOpen} onClose={() => setCountOpen(false)} />
      <LimitsModal open={limitsOpen} onClose={() => setLimitsOpen(false)} />
      <TransferModal preset={transferOpen} onClose={() => setTransferOpen(null)} />
      <AccountModal account={editing} onClose={() => setEditing(null)} />
      <GoalModal goal={editingGoal} onClose={() => setEditingGoal(null)} />
    </div>
  );
}

/* ---------------- Tools ---------------- */

type ToolId = 'month' | 'plan' | 'budget' | 'bills' | 'wishlist' | 'save' | 'accounts' | 'assets';

const TOOLS: Array<{ id: ToolId; icon: string; title: string; text: string }> = [
  { id: 'month', icon: '📊', title: 'This month', text: 'In, out and what is left' },
  { id: 'plan', icon: '🧭', title: 'Money plan', text: 'How much to save each month' },
  { id: 'budget', icon: '🎯', title: 'Budget', text: 'Limits per category' },
  { id: 'bills', icon: '🧾', title: 'Bills & subs', text: 'What you pay every month' },
  { id: 'wishlist', icon: '🛍', title: 'Wishlist', text: 'Wait before you buy' },
  { id: 'save', icon: '🐷', title: 'Save more', text: 'Proven saving methods' },
  { id: 'accounts', icon: '🏦', title: 'Accounts', text: 'Cash, bank, savings' },
  { id: 'assets', icon: '📈', title: 'Investing', text: 'Stocks and crypto' },
];

function ToolGrid({ onOpen }: { onOpen: (id: ToolId) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {TOOLS.map((tl) => (
        <button
          key={tl.id}
          onClick={() => onOpen(tl.id)}
          className="rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/20 p-3.5 text-left transition active:scale-[0.98]"
        >
          <span className="w-9 h-9 rounded-xl bg-[color-mix(in_srgb,var(--mood)_14%,transparent)] text-[var(--mood)] flex items-center justify-center">
            <Icon name={tl.icon} size={18} />
          </span>
          <span className="block mt-2.5 text-[15px] font-semibold text-white">{tl.title}</span>
          <span className="block text-xs text-slate-400">{tl.text}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- Setup ---------------- */

function SetupCard() {
  const { dispatch } = useMoney();
  const [currency, setCurrency] = useState(guessCurrency);
  const [values, setValues] = useState<Record<MoneyKind, string>>({ spending: '', savings: '', investing: '' });
  const parsed = Object.fromEntries(MONEY_KINDS.map((k) => [k.id, values[k.id] ? parseMoney(values[k.id]) : 0])) as Record<
    MoneyKind,
    number | null
  >;
  const invalid = Object.values(parsed).some((v) => v === null);

  return (
    <div className={`${card} p-5`}>
      <div className="flex mb-2 text-amber-300"><Icon name="💰" size={34} strokeWidth={1.8} /></div>
      <h2 className="font-display text-xl font-bold text-white">Let's count your money</h2>
      <p className="text-sm text-slate-400 mt-1">
        Type how much you have right now. A rough number is fine, and you can change it any time.
      </p>

      <label className="block mt-5">
        <span className="text-sm font-semibold text-slate-300">Currency</span>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`${inputClass} mt-1.5`}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 space-y-4">
        {MONEY_KINDS.map((k) => (
          <label key={k.id} className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: k.color }} />
              {k.label}
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">{k.hint}</span>
            <input
              inputMode="decimal"
              placeholder="0"
              value={values[k.id]}
              onChange={(e) => setValues((v) => ({ ...v, [k.id]: e.target.value }))}
              className={`${inputClass} mt-1.5 ${parsed[k.id] === null ? 'border-red-400/60' : ''}`}
            />
          </label>
        ))}
      </div>

      <button
        disabled={invalid}
        onClick={() => {
          dispatch({
            type: 'MONEY_SETUP',
            currency,
            amounts: { spending: parsed.spending ?? 0, savings: parsed.savings ?? 0, investing: parsed.investing ?? 0 },
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`${primaryBtn} w-full py-3 mt-5`}
      >
        Show my money
      </button>
    </div>
  );
}

/* ---------------- This month at a glance ---------------- */

/** Income, what's gone out (spending + fixed costs) and what's left, for the current month. */
function MonthSummary() {
  const { money, fmt } = useMoney();
  const today = todayKey();
  const from = `${today.slice(0, 8)}01`;
  const spent = money.expenses.filter((e) => e.date >= from && e.date <= today).reduce((n, e) => n + e.amount, 0);
  const fixed = billsPerMonth(money);
  const income = money.income?.monthly ?? 0;
  const left = income - spent - fixed;
  const monthName = new Date().toLocaleDateString(locale(), { month: 'long' });
  const tiles: Array<{ label: string; value: string; tone: string; hint?: string }> = [
    { label: 'Money in', value: income ? fmt(income, true) : '—', tone: 'text-emerald-300', hint: income ? (money.income?.kind === 'salary' ? 'salary' : 'pocket money') : 'set in Money plan' },
    { label: 'Spent', value: fmt(spent, true), tone: 'text-white', hint: 'so far' },
    { label: 'Fixed costs', value: fmt(fixed, true), tone: 'text-sky-200', hint: 'bills + subs' },
    { label: income ? 'Left over' : 'Out total', value: income ? fmt(left, true) : fmt(spent + fixed, true), tone: income && left < 0 ? 'text-red-300' : 'text-amber-200', hint: income ? (left >= 0 ? 'to save' : 'over budget') : 'this month' },
  ];
  return (
    <section aria-label="This month" className={`${card} p-4`}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 first-letter:uppercase">{monthName} at a glance</p>
      <div className="grid grid-cols-2 min-[400px]:grid-cols-4 gap-2 mt-2.5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl bg-black/20 border border-white/[0.06] p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t.label}</p>
            <p className={`font-display text-base font-extrabold tabular-nums mt-0.5 ${t.tone}`}>{t.value}</p>
            {t.hint && <p className="text-[10px] text-slate-500">{t.hint}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Overview (donut + can / can't spend) ---------------- */

/** Top of Money: everything you own as one big, thin number on a mint glow, and where it sits. */
function MoneyHero() {
  const { money, fmt } = useMoney();
  const spending = totalByKind(money.accounts, 'spending');
  const savings = totalByKind(money.accounts, 'savings');
  const crypto = cryptoTotal(money);
  const investing = totalByKind(money.accounts, 'investing') + crypto;
  const total = spending + savings + investing;
  const parts = [
    { id: 'spending', label: 'Can spend', amount: Math.max(0, spending), color: 'bg-spend' },
    { id: 'savings', label: 'Saved', amount: Math.max(0, savings), color: 'bg-[var(--mood)]' },
    { id: 'investing', label: crypto > 0 ? 'Invested + crypto' : 'Invested', amount: Math.max(0, investing), color: 'bg-[var(--mood2)]' },
  ];
  const sum = parts.reduce((a, p) => a + p.amount, 0) || 1;
  return (
    <section aria-label="Everything you have" className="relative text-center pt-2">
      <p className="eyebrow">Everything you have</p>
      <p className={`mt-3 num-thin text-[56px] ${total < 0 ? 'text-red-300' : 'text-white'}`}>
        <CountUp value={total} format={(v) => fmt(v, true)} />
      </p>
      <div className="mt-5 flex h-3 gap-1 rounded-full overflow-hidden" aria-hidden="true">
        {parts.map((p, i) =>
          p.amount > 0 ? (
            <span key={p.id} className={`${p.color} h-full rounded-full bar-in`} style={{ width: `${(p.amount / sum) * 100}%`, animationDelay: `${0.15 + i * 0.12}s` }} />
          ) : null,
        )}
        {total <= 0 && <span className="h-full w-full rounded-full bg-white/[0.08]" />}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-left">
        {parts.map((p) => (
          <div key={p.id} className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 truncate">
              <span className={`w-2 h-2 rounded-full shrink-0 ${p.color}`} />
              {p.label}
            </p>
            <p className={`mt-1 font-display text-[19px] font-normal tabular-nums truncate ${p.id === 'spending' && spending < 0 ? 'text-red-300' : 'text-white'}`}>
              <CountUp value={p.id === 'spending' ? spending : p.amount} format={(v) => fmt(v, true)} />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The most useful tip right now (or the lesson of the day), with a link to all tips. */
function TopTip({ onMore }: { onMore: () => void }) {
  const { money } = useMoney();
  const tip = smartTips(money)[0];
  const lesson = lessonOfTheDay();
  return (
    <button onClick={onMore} className="block w-full text-left" aria-label="Open money tips">
      <TipCard tip={tip ?? { id: 'lesson', icon: lesson.icon, title: lesson.title, text: lesson.text, tone: 'idea' }} />
    </button>
  );
}

/* ---------------- Today ---------------- */

function TodayCard({
  onAddExpense,
  onEditLimits,
  onSaveLeftover,
}: {
  onAddExpense: () => void;
  onEditLimits: () => void;
  onSaveLeftover: (amount: number) => void;
}) {
  const { money, fmt, undoable } = useMoney();
  const today = todayKey();
  const limit = dailyLimit(money.categories);
  const spent = spentOn(money.expenses, today);
  const left = limit - spent;
  const spendable = totalByKind(money.accounts, 'spending');
  const daysItLasts = limit > 0 ? Math.floor(Math.max(spendable, 0) / limit) : null;
  const todays = expensesOn(money.expenses, today).slice().reverse();
  const hasSavings = money.accounts.some((a) => a.kind === 'savings');
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const barColor = left < 0 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500';

  return (
    <div className={card}>
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-300">Today's limit</p>
            {limit === 0 ? (
              <p className="text-sm text-slate-400 mt-1">Set a daily limit so you know how much you can spend each day.</p>
            ) : left >= 0 ? (
              <p className="mt-1">
                <span className="font-display text-3xl font-extrabold text-white tabular-nums"><CountUp value={left} format={(v) => fmt(v)} /></span>
                <span className="block text-sm text-slate-400">left to spend today, out of {fmt(limit)}</span>
              </p>
            ) : (
              <p className="mt-1">
                <span className="font-display text-3xl font-extrabold text-red-300 tabular-nums"><CountUp value={-left} format={(v) => fmt(v)} /></span>
                <span className="block text-sm text-red-300/80">over today's limit. Try to spend less tomorrow.</span>
              </p>
            )}
          </div>
          <button onClick={onEditLimits} className={`${secondaryBtn} shrink-0 px-3 py-2`}>
            {limit === 0 ? 'Set limit' : 'Edit limit'}
          </button>
        </div>

        {limit > 0 && (
          <>
            <div className="h-2.5 rounded-full bg-white/[0.07] mt-4 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 bar-in ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            {daysItLasts !== null && (
              <p className="text-xs text-slate-400 mt-2">
                <Icon name="⏳" size="1.15em" className="icon-inline" />At this limit, your spending money lasts about{' '}
                <span className="font-bold text-white">
                  {daysItLasts} {daysItLasts === 1 ? 'day' : 'days'}
                </span>
                .
              </p>
            )}
          </>
        )}
      </div>

      {limit > 0 && (
        <div className="px-5 pb-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Where you can spend it</p>
          {money.categories.map((c) => {
            const s = spentOn(money.expenses, today, c.id);
            const over = s > c.dailyLimit;
            const w = c.dailyLimit > 0 ? Math.min(100, (s / c.dailyLimit) * 100) : s > 0 ? 100 : 0;
            return (
              <div key={c.id}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-slate-200 font-semibold">
                    <Icon name={c.icon} size="1.1em" className="icon-inline text-cyan-300" />
                    {c.name}
                  </span>
                  <span className={`tabular-nums text-xs ${over ? 'text-red-300 font-bold' : 'text-slate-400'}`}>
                    {fmt(s)} / {fmt(c.dailyLimit)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.07] mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 bar-in ${over ? 'bg-red-500' : 'bg-cyan-500'}`}
                    style={{ width: `${w}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-5 pb-5">
        <button onClick={onAddExpense} className={`${primaryBtn} w-full py-3`}>
          + I spent money
        </button>
        {limit > 0 && left > 0 && hasSavings && (
          <button
            onClick={() => onSaveLeftover(left)}
            className="w-full mt-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200 py-1.5"
          >
            End of the day? Move today's {fmt(left)} leftover to savings →
          </button>
        )}
      </div>

      {todays.length > 0 && (
        <ul className="border-t border-white/[0.06] divide-y divide-white/[0.06] rows-stagger">
          {todays.map((e) => {
            const cat = money.categories.find((c) => c.id === e.categoryId);
            return (
              <li key={e.id} className="flex items-center gap-3 px-5 py-2.5">
                <span className="shrink-0 w-9 h-9 rounded-lg bg-white/5 text-cyan-300 flex items-center justify-center"><Icon name={cat?.icon ?? '💸'} size={18} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-slate-200 truncate">{e.note || cat?.name || 'Expense'}</span>
                  {e.note && <span className="block text-xs text-slate-500">{cat?.name}</span>}
                </span>
                <span className="text-sm font-bold text-white tabular-nums">−{fmt(e.amount)}</span>
                <button
                  onClick={() => undoable({ type: 'MONEY_DELETE_EXPENSE', expenseId: e.id }, `Expense removed, ${fmt(e.amount)} put back`)}
                  aria-label="Remove expense (puts the money back)"
                  title="Remove (puts the money back)"
                  className="shrink-0 w-8 h-8 -mr-2 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5"
                >
                  <Icon name="✕" size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Savings goals ---------------- */

function GoalsCard({
  onAdd,
  onEdit,
  onAddMoney,
  onTakeOut,
}: {
  onAdd: () => void;
  onEdit: (g: SavingsGoal) => void;
  onAddMoney: (g: SavingsGoal) => void;
  onTakeOut: (g: SavingsGoal) => void;
}) {
  const { money, fmt } = useMoney();
  const goals = money.goals.filter((g) => money.accounts.some((a) => a.id === g.accountId));

  if (goals.length === 0) {
    return (
      <button
        onClick={onAdd}
        className="w-full flex items-center gap-3 rounded-2xl border border-dashed border-emerald-400/30 bg-emerald-500/[0.04] px-4 py-4 text-left hover:border-emerald-400/60 transition"
      >
        <span className="shrink-0 w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center"><Icon name="🚗" size={26} /></span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-white">Saving up for something?</span>
          <span className="block text-xs text-slate-400">Add a goal, like a car, and watch it fill up as you save</span>
        </span>
        <span className="text-emerald-300 font-bold">+</span>
      </button>
    );
  }

  return (
    <div className={card}>
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <p className="text-sm font-semibold text-white"><Icon name="🎯" size="1.15em" className="icon-inline text-emerald-300" />Savings goals</p>
        <button onClick={onAdd} className={`${secondaryBtn} px-2.5 py-1.5 text-xs`}>
          + Goal
        </button>
      </div>
      <div className="divide-y divide-white/[0.06]">
        {goals.map((g) => {
          const account = money.accounts.find((a) => a.id === g.accountId)!;
          const p = goalProgress(account.amount, g.target, g.weekly);
          return (
            <div key={g.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center"><Icon name={g.icon} size={26} /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-display text-lg font-bold text-white truncate">{g.name}</p>
                    <p className="text-sm font-bold text-emerald-300 tabular-nums">{Math.floor(p.pct)}%</p>
                  </div>
                  <p className="text-sm text-slate-400 tabular-nums">
                    <span className="font-bold text-white"><CountUp value={p.saved} format={(v) => fmt(v, true)} /></span> of {fmt(g.target, true)}
                  </p>
                </div>
              </div>
              <div className="h-3 rounded-full bg-white/[0.07] mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700 bar-in"
                  style={{ width: `${p.pct}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {p.reached ? (
                  <span className="font-bold text-emerald-300"><Icon name="🎉" size="1.15em" className="icon-inline" />You did it! You've saved enough for your {g.name.toLowerCase()}.</span>
                ) : (
                  <>
                    <span className="font-bold text-white">{fmt(p.remaining, true)}</span> to go
                    {p.weeksLeft !== null && p.eta && g.weekly ? (
                      <>
                        {' '}
                        · saving {fmt(g.weekly, true)}/week gets you there in about{' '}
                        <span className="font-bold text-white">{formatWeeks(p.weeksLeft)}</span> (
                        {p.eta.toLocaleDateString(locale(), { month: 'short', year: 'numeric' })})
                      </>
                    ) : (
                      <> · set how much you'll save per week to see when you'll get there</>
                    )}
                  </>
                )}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => onAddMoney(g)} className={`${primaryBtn} flex-1 min-w-[7.5rem] py-2.5 text-sm`}>
                  + Add money
                </button>
                {account.amount > 0 && (
                  <button onClick={() => onTakeOut(g)} className={`${secondaryBtn} shrink-0 px-3 text-sm`}>
                    Take out
                  </button>
                )}
                <button onClick={() => onEdit(g)} className={`${secondaryBtn} shrink-0 px-4 text-sm`}>
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Last 7 days ---------------- */

function HistoryCard() {
  const { money, fmt } = useMoney();
  const days = lastNDays(7);
  const limit = dailyLimit(money.categories);
  const values = days.map((d) => spentOn(money.expenses, d));
  if (values.every((v) => v === 0)) return null;
  const max = Math.max(limit, ...values, 1);
  const underCount = limit > 0 ? values.filter((v) => v <= limit).length : null;

  return (
    <div className={`${card} p-5`}>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-white">Last 7 days</p>
        {underCount !== null && (
          <p className="text-xs text-slate-400">
            Under limit <span className="font-bold text-white">{underCount}/7</span> days
          </p>
        )}
      </div>
      <div className="relative mt-4 h-28">
        {limit > 0 && (
          <div
            className="absolute inset-x-0 border-t border-dashed border-slate-500/60"
            style={{ bottom: `${(limit / max) * 100}%` }}
          >
            <span className="absolute right-0 -top-4 text-[10px] text-slate-400">limit {fmt(limit, true)}</span>
          </div>
        )}
        <div className="absolute inset-0 grid grid-cols-7 gap-2 items-end">
          {values.map((v, i) => (
            <div
              key={days[i]}
              className={`rounded-t-[4px] ${limit > 0 && v > limit ? 'bg-red-500' : 'bg-cyan-600'}`}
              style={{ height: `${v > 0 ? Math.max((v / max) * 100, 3) : 0}%` }}
              title={`${days[i]}: ${fmt(v)}`}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 mt-1.5 border-t border-white/10 pt-1.5">
        {values.map((v, i) => (
          <div key={days[i]} className="text-center">
            <p className="text-[10px] font-semibold text-slate-400">
              {i === 6 ? 'Today' : parseKey(days[i]).toLocaleDateString(locale(), { weekday: 'short' })}
            </p>
            <p className="text-[10px] text-slate-300 tabular-nums">{v > 0 ? fmt(v, true) : '–'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Accounts ---------------- */

function AccountsCard({
  onEdit,
  onAdd,
  onTransfer,
  onCount,
}: {
  onCount: () => void;
  onEdit: (a: MoneyAccount) => void;
  onAdd: () => void;
  onTransfer: () => void;
}) {
  const { money, fmt } = useMoney();
  return (
    <div className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-2">
        <p className="text-sm font-semibold text-white whitespace-nowrap">Where your money is</p>
        <div className="flex flex-wrap gap-1.5 [&>button]:whitespace-nowrap">
          <button onClick={onCount} className={`${secondaryBtn} px-2.5 py-1.5 text-xs`}>
            <Icon name="🧮" size="1.1em" className="icon-inline" />
            Count cash
          </button>
          {money.accounts.length > 1 && (
            <button onClick={onTransfer} className={`${secondaryBtn} px-2.5 py-1.5 text-xs`}>
              ⇄ Move money
            </button>
          )}
          <button onClick={onAdd} className={`${secondaryBtn} px-2.5 py-1.5 text-xs`}>
            + Add
          </button>
        </div>
      </div>
      {MONEY_KINDS.map((k) => {
        const accounts = money.accounts.filter((a) => a.kind === k.id);
        if (accounts.length === 0) return null;
        return (
          <div key={k.id} className="px-2 pb-2">
            <p className="flex items-center gap-2 px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span className="w-2 h-2 rounded-full" style={{ background: k.color }} />
              {k.short}
            </p>
            {accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => onEdit(a)}
                className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.04] text-left transition"
              >
                <span className="text-[15px] text-slate-200">{a.name}</span>
                <span className="flex items-center gap-2">
                  <span className={`font-bold tabular-nums ${a.amount < 0 ? 'text-red-300' : 'text-white'}`}>{fmt(a.amount)}</span>
                  <Icon name="✎" size={14} className="text-slate-500" />
                </span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Modals ---------------- */

function ExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { money, dispatch, fmt } = useMoney();
  const spendingAccounts = money.accounts.filter((a) => a.kind === 'spending');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(money.categories[0]?.id ?? '');
  const [accountId, setAccountId] = useState(spendingAccounts[0]?.id ?? '');
  const [note, setNote] = useState('');
  const cents = parseMoney(amount);

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setNote('');
    setCategoryId((id) => (money.categories.some((c) => c.id === id) ? id : money.categories[0]?.id ?? ''));
    setAccountId((id) => (spendingAccounts.some((a) => a.id === id) ? id : spendingAccounts[0]?.id ?? ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const today = todayKey();
  const cat = money.categories.find((c) => c.id === categoryId);
  const catLeft = cat ? cat.dailyLimit - spentOn(money.expenses, today, cat.id) : 0;
  const totalLeft = dailyLimit(money.categories) - spentOn(money.expenses, today);
  const wouldExceed = cents !== null && cents > 0 && cat && cat.dailyLimit > 0 && cents > catLeft;

  function save() {
    if (!cents || cents <= 0) return;
    dispatch({ type: 'MONEY_ADD_EXPENSE', amount: cents, categoryId, accountId: accountId || undefined, note });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="I spent money">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-4"
      >
        <Field label="How much?">
          <AmountInput value={amount} onChange={setAmount} autoFocus big invalid={amount !== '' && cents === null} />
        </Field>

        <div>
          <p className="text-sm font-semibold text-slate-300 mb-1.5">On what?</p>
          <div className="grid grid-cols-2 gap-2">
            {money.categories.map((c) => {
              const left = c.dailyLimit - spentOn(money.expenses, today, c.id);
              const on = c.id === categoryId;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  aria-pressed={on}
                  className={`rounded-xl border px-3 py-2 text-left transition ${
                    on ? 'bg-amber-500/15 border-amber-400/60' : 'bg-white/[0.03] border-white/10 hover:border-white/25'
                  }`}
                >
                  <span className="block text-sm font-semibold text-white">
                    <Icon name={c.icon} size="1.1em" className="icon-inline text-cyan-300" />
                    {c.name}
                  </span>
                  {c.dailyLimit > 0 && (
                    <span className={`block text-[11px] tabular-nums ${left < 0 ? 'text-red-300' : 'text-slate-400'}`}>
                      {left >= 0 ? `${fmt(left)} left today` : `${fmt(-left)} over`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {wouldExceed && (
          <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            <Icon name="⚠" size="1.15em" className="icon-inline" />This goes {fmt(cents - Math.max(catLeft, 0))} over your {cat!.name} limit for today
            {totalLeft - cents < 0 ? ' and over your whole daily limit' : ''}. Do you really need it?
          </p>
        )}

        {spendingAccounts.length > 1 && (
          <Field label="Paid from">
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
              {spendingAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({fmt(a.amount)})
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Note (optional)">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. lunch with friends" className={inputClass} />
        </Field>

        <button type="submit" disabled={!cents || cents <= 0} className={`${primaryBtn} w-full py-3`}>
          {cents && cents > 0 ? `Save ${fmt(cents)}` : 'Enter an amount'}
        </button>
        {spendingAccounts.length > 0 && (
          <p className="text-xs text-slate-500 text-center -mt-1">
            This is taken off {spendingAccounts.find((a) => a.id === accountId)?.name ?? 'your spending money'}.
          </p>
        )}
      </form>
    </Modal>
  );
}

const GOAL_ICONS = ['🚗', '🏍️', '🛟', '📱', '💻', '✈️', '🏠', '🎓', '🎮', '👟', '⌚', '🎸', '💍', '🎯'];

function GoalModal({ goal, onClose }: { goal: SavingsGoal | 'new' | null; onClose: () => void }) {
  const { money, dispatch, fmt, undoable } = useMoney();
  const existing = goal && goal !== 'new' ? goal : null;
  const savingsAccounts = money.accounts.filter((a) => a.kind === 'savings');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🚗');
  const [target, setTarget] = useState('');
  const [weekly, setWeekly] = useState('');
  const [where, setWhere] = useState<string>('new');
  const [start, setStart] = useState('');
  const [saved, setSaved] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fund = existing ? money.accounts.find((a) => a.id === existing.accountId) : undefined;
  const ownFund = !!existing && isOwnFund(money, existing);

  useEffect(() => {
    if (!goal) return;
    if (goal === 'new') {
      setName('Car');
      setIcon('🚗');
      setTarget('');
      setWeekly('');
      setWhere('new');
      setStart('');
    } else {
      setName(goal.name);
      setIcon(goal.icon);
      setTarget(centsToInput(goal.target));
      setWeekly(goal.weekly ? centsToInput(goal.weekly) : '');
      setWhere(goal.accountId);
      setSaved(centsToInput(money.accounts.find((a) => a.id === goal.accountId)?.amount ?? 0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal]);

  const targetCents = parseMoney(target);
  const weeklyCents = weekly ? parseMoney(weekly) : 0;
  const startCents = start ? parseMoney(start) : 0;
  const moveFrom = savingsAccounts[0];
  const tooMuch = !!moveFrom && startCents !== null && startCents > Math.max(0, moveFrom.amount);
  const savedCents = existing ? (saved.trim() === '' ? 0 : parseMoney(saved)) : 0;
  const valid =
    !!targetCents && targetCents > 0 && weeklyCents !== null && startCents !== null && savedCents !== null && !tooMuch && name.trim() !== '';
  const savedNow = existing ? (savedCents ?? 0) : where === 'new' ? (startCents ?? 0) : (money.accounts.find((a) => a.id === where)?.amount ?? 0);
  const preview = targetCents ? goalProgress(savedNow, targetCents, weeklyCents ?? undefined) : null;

  function save() {
    if (!valid) return;
    dispatch({
      type: 'MONEY_UPSERT_GOAL',
      goal: { id: existing?.id, name, icon, target: targetCents!, weekly: weeklyCents || undefined, accountId: where === 'new' ? undefined : where },
      newAccount:
        where === 'new' && !existing ? { name: `${name.trim()} fund`, amount: startCents ?? 0, fromAccountId: moveFrom?.id } : undefined,
    });
    if (existing && fund && savedCents !== null && savedCents !== fund.amount) {
      dispatch({ type: 'MONEY_SET_GOAL_SAVED', goalId: existing.id, amount: savedCents });
    }
    // Renaming a goal renames its own fund too, so both places show the same name.
    if (existing && fund && ownFund && name.trim() && name.trim() !== existing.name) {
      dispatch({ type: 'MONEY_UPSERT_ACCOUNT', account: { ...fund, amount: savedCents ?? fund.amount, name: `${name.trim()} fund` } });
    }
    onClose();
  }

  return (
    <>
      <Modal open={!!goal && !confirmDelete} onClose={onClose} title={existing ? `Edit ${existing.name} goal` : 'New savings goal'}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-4"
        >
          {!existing && (
            <div className="flex flex-wrap gap-2">
              {GOAL_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => {
                    setName(p.name);
                    setIcon(p.icon);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    name === p.name ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-100' : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  <Icon name={p.icon} size="1.15em" className="icon-inline" />
                  {p.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <span className="shrink-0 w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
              <Icon name={icon} size={22} />
            </span>
            <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Goal name" placeholder="What are you saving for?" className={inputClass} />
          </div>

          <IconGrid options={Array.from(new Set([icon, ...GOAL_ICONS]))} value={icon} onChange={setIcon} size="sm" />

          <Field label="How much does it cost?" hint="For a car, add a bit extra for insurance, tax and the first repairs.">
            <AmountInput value={target} onChange={setTarget} autoFocus={!existing} invalid={target !== '' && !targetCents} />
          </Field>

          {!existing && (
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-1.5">Where will you keep this money?</p>
              <select value={where} onChange={(e) => setWhere(e.target.value)} className={inputClass}>
                <option value="new">A new “{name.trim() || 'Goal'} fund” in savings</option>
                {savingsAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({fmt(a.amount)})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1.5">
                A separate fund is best: you can see exactly how much is for the {name.trim().toLowerCase() || 'goal'}.
              </p>
            </div>
          )}

          {!existing && where === 'new' && (
            <Field
              label={moveFrom ? 'Move some savings into it now (optional)' : 'Already saved for it (optional)'}
              hint={moveFrom ? `Taken out of ${moveFrom.name} (${fmt(moveFrom.amount)}), so nothing is counted twice.` : undefined}
            >
              <AmountInput value={start} onChange={setStart} invalid={startCents === null || tooMuch} />
            </Field>
          )}

          {existing && fund && (
            <Field
              label="Saved so far"
              hint={ownFund ? `This is the money in ${fund.name}. Change it if you saved or spent some outside the app.` : `This is everything in ${fund.name}, which other money may share.`}
            >
              <AmountInput value={saved} onChange={setSaved} invalid={savedCents === null} />
            </Field>
          )}

          <Field label="How much can you save per week? (optional)" hint="Used to work out when you'll reach your goal.">
            <AmountInput value={weekly} onChange={setWeekly} invalid={weeklyCents === null} />
          </Field>

          {preview && !preview.reached && preview.weeksLeft !== null && preview.eta && (
            <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2.5 text-sm text-emerald-100">
              <Icon name="📅" size="1.15em" className="icon-inline" />You'll have it in about <span className="font-bold">{formatWeeks(preview.weeksLeft)}</span>, around{' '}
              <span className="font-bold">{preview.eta.toLocaleDateString(locale(), { month: 'long', year: 'numeric' })}</span>.
            </p>
          )}

          <button type="submit" disabled={!valid} className={`${primaryBtn} w-full py-3`}>
            {existing ? 'Save goal' : 'Create goal'}
          </button>
          {existing && (
            <button type="button" onClick={() => setConfirmDelete(true)} className="w-full text-sm font-semibold text-red-300 hover:text-red-200 py-1">
              Delete goal
            </button>
          )}
        </form>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete the ${existing?.name ?? ''} goal?`}
        message={
          ownFund && fund
            ? `The goal and its ${fund.name} are removed everywhere. The ${fmt(fund.amount)} in it moves back to your other money, so nothing is lost.`
            : 'Only the goal is removed. The money you saved stays in your savings.'
        }
        confirmLabel="Delete goal"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (existing) undoable({ type: 'MONEY_DELETE_GOAL', goalId: existing.id, closeFund: true }, `${existing.name} goal deleted`);
          setConfirmDelete(false);
          onClose();
        }}
      />
    </>
  );
}

const ICON_CHOICES = ['🍔', '☕', '🚌', '⛽', '🎮', '🎬', '🛍️', '👕', '📱', '🎁', '💊', '📚', '🏋️', '🐶', '💸'];

function LimitsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { money, dispatch, fmt } = useMoney();
  const [cats, setCats] = useState<Array<SpendCategory & { input: string }>>([]);
  const [days, setDays] = useState('7');
  const [picking, setPicking] = useState<number | null>(null);
  const spendable = Math.max(0, totalByKind(money.accounts, 'spending'));

  useEffect(() => {
    if (open) setCats(money.categories.map((c) => ({ ...c, input: c.dailyLimit ? centsToInput(c.dailyLimit) : '' })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dayCount = Math.max(0, Math.floor(Number(days) || 0));
  const suggested = dayCount > 0 ? Math.floor(spendable / dayCount) : 0;
  const parsedCats = cats.map((c) => ({ ...c, dailyLimit: c.input ? parseMoney(c.input) : 0 }));
  const invalid = parsedCats.some((c) => c.dailyLimit === null || !c.name.trim());
  const total = parsedCats.reduce((s, c) => s + (c.dailyLimit ?? 0), 0);

  function applySuggestion() {
    const split = splitDailyLimit(
      parsedCats.map((c) => ({ id: c.id, name: c.name, icon: c.icon, dailyLimit: c.dailyLimit ?? 0 })),
      suggested,
    );
    setCats(split.map((c) => ({ ...c, input: c.dailyLimit ? centsToInput(c.dailyLimit) : '' })));
  }

  function update(i: number, patch: Partial<SpendCategory & { input: string }>) {
    setCats((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }

  function save() {
    if (invalid) return;
    dispatch({
      type: 'MONEY_SET_CATEGORIES',
      categories: parsedCats.map(({ id, name, icon, dailyLimit }) => ({ id, name: name.trim(), icon, dailyLimit: dailyLimit ?? 0 })),
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Daily limit">
      <div className="space-y-5">
        <section className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.06] p-4">
          <p className="text-sm font-bold text-white"><Icon name="🧮" size="1.15em" className="icon-inline text-cyan-300" />Work it out for me</p>
          <p className="text-xs text-slate-400 mt-0.5">
            You have <span className="font-bold text-slate-200">{fmt(spendable)}</span> spending money. How many days until you
            get more (allowance, pay day)?
          </p>
          <div className="flex items-center gap-2 mt-3">
            <input
              inputMode="numeric"
              value={days}
              onChange={(e) => setDays(e.target.value.replace(/\D/g, '').slice(0, 3))}
              aria-label="Days"
              className={`${inputClass} !w-20 text-center font-bold`}
            />
            <span className="text-sm text-slate-300">days</span>
            <span className="flex-1 text-right text-sm text-slate-300">
              = <span className="font-bold text-white">{fmt(suggested)}</span>/day
            </span>
          </div>
          <button
            type="button"
            disabled={suggested <= 0 || cats.length === 0}
            onClick={applySuggestion}
            className={`${secondaryBtn} w-full mt-3 py-2.5 disabled:opacity-40`}
          >
            Use {fmt(suggested)} a day and split it for me
          </button>
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-sm font-bold text-white">Where you can spend it, per day</p>
            <p className="text-sm text-slate-300 tabular-nums">
              Total <span className="font-bold text-white">{fmt(total)}</span>
            </p>
          </div>
          <div className="space-y-2">
            {cats.map((c, i) => (
              <div key={c.id}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPicking(picking === i ? null : i)}
                  aria-label={`Change icon for ${c.name}`}
                  aria-expanded={picking === i}
                  className={`shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center transition ${
                    picking === i ? 'border-amber-400 bg-amber-500/15 text-amber-200' : 'border-white/10 bg-white/5 text-cyan-300 hover:border-white/25'
                  }`}
                >
                  <Icon name={c.icon} size={19} />
                </button>
                <input
                  value={c.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  aria-label="Category name"
                  className={`${inputClass} flex-1 min-w-0`}
                />
                <input
                  inputMode="decimal"
                  placeholder="0"
                  value={c.input}
                  onChange={(e) => update(i, { input: e.target.value })}
                  aria-label={`${c.name} daily limit`}
                  className={`${inputClass} !w-24 shrink-0 text-right ${parsedCats[i]?.dailyLimit === null ? '!border-red-400/60' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setCats((cs) => cs.filter((_, j) => j !== i))}
                  disabled={cats.length <= 1}
                  aria-label={`Remove ${c.name}`}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 disabled:opacity-20"
                >
                  <Icon name="✕" size={15} />
                </button>
              </div>
              {picking === i && (
                <div className="mt-2 mb-1 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <IconGrid
                    options={Array.from(new Set([c.icon, ...ICON_CHOICES]))}
                    value={c.icon}
                    onChange={(ic) => {
                      update(i, { icon: ic });
                      setPicking(null);
                    }}
                    size="sm"
                  />
                </div>
              )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCats((cs) => [...cs, { id: moneyId('cat'), name: 'New category', icon: '💸', dailyLimit: 0, input: '' }])}
            className="mt-2 text-sm font-semibold text-amber-300 hover:text-amber-200 py-1"
          >
            + Add a category
          </button>
        </section>

        <button onClick={save} disabled={invalid} className={`${primaryBtn} w-full py-3`}>
          Save daily limit ({fmt(total)})
        </button>
      </div>
    </Modal>
  );
}

type TransferPreset = { fromKind?: MoneyKind; toKind?: MoneyKind; fromId?: string; toId?: string; amount?: number };

function TransferModal({ preset, onClose }: { preset: TransferPreset | null; onClose: () => void }) {
  const { money, dispatch, fmt } = useMoney();
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const cents = parseMoney(amount);

  useEffect(() => {
    if (!preset) return;
    const fixedTo = preset.toId ? money.accounts.find((a) => a.id === preset.toId) : undefined;
    const from =
      (preset.fromId ? money.accounts.find((a) => a.id === preset.fromId) : undefined) ??
      money.accounts.find((a) => a.kind === (preset.fromKind ?? 'spending') && a.id !== fixedTo?.id) ??
      money.accounts.find((a) => a.id !== fixedTo?.id);
    const to =
      fixedTo ??
      money.accounts.find((a) => a.kind === (preset.toKind ?? 'savings') && a.id !== from?.id) ??
      money.accounts.find((a) => a.id !== from?.id);
    setFromId(from?.id ?? '');
    setToId(to?.id ?? '');
    setAmount(preset.amount ? centsToInput(preset.amount) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  const label = (a: MoneyAccount) => `${a.name} · ${kindMeta(a.kind).short} (${fmt(a.amount)})`;

  return (
    <Modal open={!!preset} onClose={onClose} title="Move money">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!cents || fromId === toId) return;
          dispatch({ type: 'MONEY_TRANSFER', fromId, toId, amount: cents });
          onClose();
        }}
        className="space-y-4"
      >
        <Field label="From">
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} className={inputClass}>
            {money.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {label(a)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="To">
          <select value={toId} onChange={(e) => setToId(e.target.value)} className={inputClass}>
            {money.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {label(a)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="How much?">
          <AmountInput value={amount} onChange={setAmount} invalid={amount !== '' && cents === null} />
        </Field>
        <button type="submit" disabled={!cents || fromId === toId} className={`${primaryBtn} w-full py-3`}>
          {fromId === toId ? 'Pick two different places' : cents ? `Move ${fmt(cents)}` : 'Enter an amount'}
        </button>
      </form>
    </Modal>
  );
}

function AccountModal({ account, onClose }: { account: MoneyAccount | 'new' | null; onClose: () => void }) {
  const { money, dispatch, undoable } = useMoney();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<MoneyKind>('spending');
  const [amount, setAmount] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cents = amount.trim().startsWith('-') ? parseMoney(amount.trim().slice(1)) : parseMoney(amount || '0');
  const signed = cents === null ? null : amount.trim().startsWith('-') ? -cents : cents;
  const existing = account && account !== 'new' ? account : null;

  useEffect(() => {
    if (!account) return;
    if (account === 'new') {
      setName('');
      setKind('savings');
      setAmount('');
    } else {
      setName(account.name);
      setKind(account.kind);
      setAmount(centsToInput(account.amount));
    }
  }, [account]);

  return (
    <>
      <Modal open={!!account && !confirmDelete} onClose={onClose} title={existing ? `Edit ${existing.name}` : 'Add a place for money'}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (signed === null) return;
            dispatch({ type: 'MONEY_UPSERT_ACCOUNT', account: { id: existing?.id, name, kind, amount: signed } });
            onClose();
          }}
          className="space-y-4"
        >
          <Field label="Name">
            <input
              autoFocus={!existing}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bank card, Piggy bank, Stocks app"
              className={inputClass}
            />
          </Field>
          <div>
            <p className="text-sm font-semibold text-slate-300 mb-1.5">Type</p>
            <div className="grid grid-cols-3 gap-2">
              {MONEY_KINDS.map((k) => (
                <button
                  type="button"
                  key={k.id}
                  onClick={() => setKind(k.id)}
                  aria-pressed={kind === k.id}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                    kind === k.id ? 'bg-white/10 border-white/40 text-white' : 'bg-white/[0.03] border-white/10 text-slate-400'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ background: k.color }} />
                  {k.short}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">{kindMeta(kind).hint}</p>
          </div>
          <Field label="How much is in it now?">
            <AmountInput value={amount} onChange={setAmount} invalid={signed === null} />
          </Field>
          <button type="submit" disabled={signed === null} className={`${primaryBtn} w-full py-3`}>
            Save
          </button>
          {existing && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full text-sm font-semibold text-red-300 hover:text-red-200 py-1"
            >
              Delete this
            </button>
          )}
        </form>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${existing?.name ?? ''}?`}
        message={
          (money.accounts.length <= 1
            ? 'This is your only account. Your expenses stay in the history.'
            : 'It will be removed from your total. Your expenses stay in the history.') +
          (existing && money.goals.some((g) => g.accountId === existing.id)
            ? ' The savings goal that uses it will be removed too.'
            : '')
        }
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (existing) undoable({ type: 'MONEY_DELETE_ACCOUNT', accountId: existing.id }, `${existing.name} deleted`);
          setConfirmDelete(false);
          onClose();
        }}
      />
    </>
  );
}
