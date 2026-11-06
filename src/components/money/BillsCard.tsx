import { useEffect, useState } from 'react';
import type { Bill } from '../../lib/types';
import { addDaysToKey, parseKey, todayKey } from '../../lib/date';
import { centsToInput, parseMoney } from '../../lib/money';
import { billsPerMonth, monthStart, nextDue, spendByCategory } from '../../lib/moneyTips';
import { locale } from '../../lib/locale';
import { Icon, IconGrid } from '../Icon';
import { Modal } from '../Modal';
import { AmountInput, Field, card, inputClass, primaryBtn, secondaryBtn, useMoney } from './ui';

function dueLabel(date: string, today: string): string {
  if (date === today) return 'today';
  if (date === addDaysToKey(today, 1)) return 'tomorrow';
  const days = Math.round((parseKey(date).getTime() - parseKey(today).getTime()) / 86400000);
  if (days < 7) return `in ${days} days`;
  return parseKey(date).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
}

/** Monthly bills and subscriptions: what they cost a month and a year, and what's due next. */
export function BillsCard() {
  const { money, fmt } = useMoney();
  const [editing, setEditing] = useState<Bill | 'new' | null>(null);
  const today = todayKey();
  const bills = [...(money.bills ?? [])].sort((a, b) => nextDue(a.day, today).localeCompare(nextDue(b.day, today)));
  const monthly = billsPerMonth(money);
  const subs = bills.filter((b) => b.kind === 'subscription');

  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-2 px-5 pt-4 pb-2">
        <div>
          <p className="text-sm font-semibold text-white">
            <Icon name="🧾" size="1.15em" className="icon-inline text-sky-300" />
            Bills & subscriptions
          </p>
          {bills.length > 0 ? (
            <p className="text-xs text-slate-400 mt-0.5">
              <b className="text-white">{fmt(monthly)}</b> a month · {fmt(monthly * 12, true)} a year
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-0.5">Phone, streaming, gym, games… things that come out every month.</p>
          )}
        </div>
        <button onClick={() => setEditing('new')} className={`${secondaryBtn} shrink-0 px-2.5 py-1.5 text-xs`}>
          + Add
        </button>
      </div>
      {bills.length > 0 && (
        <ul className="px-2 pb-2">
          {bills.map((b) => {
            const due = nextDue(b.day, today);
            const soon = due <= addDaysToKey(today, 3);
            return (
              <li key={b.id}>
                <button onClick={() => setEditing(b)} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.04] text-left">
                  <span className="shrink-0 w-9 h-9 rounded-lg bg-white/5 text-sky-300 flex items-center justify-center">
                    <Icon name={b.icon} size={17} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] text-slate-200 truncate">{b.name}</span>
                    <span className={`block text-xs ${soon ? 'text-amber-300 font-semibold' : 'text-slate-500'}`}>
                      {b.kind === 'subscription' ? 'Subscription' : 'Bill'} · due {dueLabel(due, today)}
                    </span>
                  </span>
                  <span className="font-bold text-white tabular-nums">{fmt(b.amount)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {subs.length >= 3 && (
        <p className="px-5 pb-4 text-xs text-slate-400">
          <Icon name="💡" size="1.1em" className="icon-inline text-yellow-300" />
          {subs.length} subscriptions. Cancel the one you used least this month and save {fmt(Math.min(...subs.map((s) => s.amount)) * 12, true)} a year.
        </p>
      )}
      <BillModal bill={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

const BILL_ICONS = ['📱', '🎬', '🎵', '🎮', '🏋', '🏠', '💡', '🚌', '☁', '📰', '🛡', '🧾'];
const BILL_IDEAS: Array<{ name: string; icon: string; kind: Bill['kind'] }> = [
  { name: 'Phone plan', icon: '📱', kind: 'bill' },
  { name: 'Netflix', icon: '🎬', kind: 'subscription' },
  { name: 'Spotify', icon: '🎵', kind: 'subscription' },
  { name: 'Gym', icon: '🏋', kind: 'subscription' },
  { name: 'Game pass', icon: '🎮', kind: 'subscription' },
  { name: 'Bus pass', icon: '🚌', kind: 'bill' },
  { name: 'Cloud storage', icon: '☁', kind: 'subscription' },
];

function BillModal({ bill, onClose }: { bill: Bill | 'new' | null; onClose: () => void }) {
  const { dispatch, fmt, undoable } = useMoney();
  const existing = bill && bill !== 'new' ? bill : null;
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState(1);
  const [icon, setIcon] = useState('🧾');
  const [kind, setKind] = useState<Bill['kind']>('subscription');

  useEffect(() => {
    if (!bill) return;
    setName(existing?.name ?? '');
    setAmount(existing ? centsToInput(existing.amount) : '');
    setDay(existing?.day ?? new Date().getDate());
    setIcon(existing?.icon ?? '🧾');
    setKind(existing?.kind ?? 'subscription');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bill]);

  const cents = parseMoney(amount);
  const valid = name.trim().length > 0 && cents !== null && cents > 0;

  function save() {
    if (!valid || cents === null) return;
    dispatch({ type: 'MONEY_UPSERT_BILL', bill: { id: existing?.id, name, amount: cents, day, icon, kind } });
    onClose();
  }

  return (
    <Modal open={!!bill} onClose={onClose} title={existing ? 'Edit bill' : 'Add a bill or subscription'}>
      <div className="space-y-4">
        {!existing && (
          <div className="flex flex-wrap gap-1.5">
            {BILL_IDEAS.map((i) => (
              <button
                key={i.name}
                onClick={() => {
                  setName(i.name);
                  setIcon(i.icon);
                  setKind(i.kind);
                }}
                className="rounded-full bg-white/5 border border-white/10 hover:border-white/25 px-2.5 py-1 text-xs font-semibold text-slate-300"
              >
                {i.name}
              </button>
            ))}
          </div>
        )}
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Phone plan" maxLength={40} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Each month">
            <AmountInput value={amount} onChange={setAmount} invalid={amount !== '' && cents === null} />
          </Field>
          <Field label="Paid on day">
            <select value={day} onChange={(e) => setDay(Number(e.target.value))} className={inputClass}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/[0.04] border border-white/10 p-1" role="radiogroup" aria-label="Type">
          {(['subscription', 'bill'] as const).map((k) => (
            <button
              key={k}
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={`rounded-lg py-2 text-sm font-bold ${kind === k ? 'bg-amber-500 text-white' : 'text-slate-400'}`}
            >
              {k === 'subscription' ? 'Subscription' : 'Bill'}
            </button>
          ))}
        </div>
        <IconGrid options={BILL_ICONS} value={icon} onChange={setIcon} size="sm" />
        {cents !== null && cents > 0 && (
          <p className="text-sm text-slate-400">
            That's <b className="text-white">{fmt(cents * 12)}</b> a year.
          </p>
        )}
        <div className="flex gap-2">
          {existing && (
            <button
              onClick={() => {
                undoable({ type: 'MONEY_DELETE_BILL', billId: existing.id }, `${existing.name} removed`);
                onClose();
              }}
              className="rounded-xl px-4 text-sm font-semibold text-red-300 hover:bg-red-500/10"
            >
              Delete
            </button>
          )}
          <button onClick={save} disabled={!valid} className={`${primaryBtn} flex-1 py-3`}>
            {existing ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** This month's spending by category, compared with the same days last month. */
export function MonthCard() {
  const { money, fmt } = useMoney();
  const today = todayKey();
  const from = monthStart(today);
  const rows = spendByCategory(money, from, today);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  if (total === 0) return null;
  const d = parseKey(today);
  const lastFrom = monthStart(todayKey(new Date(d.getFullYear(), d.getMonth() - 1, 1)));
  const lastTo = todayKey(new Date(d.getFullYear(), d.getMonth() - 1, Math.min(d.getDate(), new Date(d.getFullYear(), d.getMonth(), 0).getDate())));
  const lastTotal = spendByCategory(money, lastFrom, lastTo).reduce((s, r) => s + r.amount, 0);
  const diff = total - lastTotal;
  const max = rows[0]?.amount ?? 1;
  const monthName = d.toLocaleDateString(locale(), { month: 'long' });

  return (
    <div className={`${card} p-5`}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-white first-letter:uppercase">Spent in {monthName}</p>
        <p className="font-display text-lg font-extrabold text-white tabular-nums">{fmt(total)}</p>
      </div>
      {lastTotal > 0 && (
        <p className={`text-xs mt-0.5 ${diff > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
          {diff > 0 ? '▲' : '▼'} {fmt(Math.abs(diff))} {diff > 0 ? 'more' : 'less'} than this time last month
        </p>
      )}
      <ul className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <li key={r.categoryId}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-slate-200 font-semibold truncate">
                <Icon name={r.category?.icon ?? '💸'} size="1.1em" className="icon-inline text-cyan-300" />
                {r.category?.name ?? 'Other'}
              </span>
              <span className="text-xs text-slate-400 tabular-nums shrink-0">
                {fmt(r.amount)} · {Math.round((r.amount / total) * 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.07] mt-1.5 overflow-hidden">
              <div className="h-full rounded-full bg-cyan-500 bar-in" style={{ width: `${(r.amount / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
