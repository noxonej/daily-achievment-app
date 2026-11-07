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
  const [checkup, setCheckup] = useState(false);
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
        <div className="shrink-0 flex gap-1.5">
          {subs.length > 0 && (
            <button onClick={() => setCheckup(true)} className={`${secondaryBtn} px-2.5 py-1.5 text-xs`}>
              <Icon name="🔍" size="1.1em" className="icon-inline" />
              Check-up
            </button>
          )}
          <button onClick={() => setEditing('new')} className={`${secondaryBtn} px-2.5 py-1.5 text-xs`}>
            + Add
          </button>
        </div>
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
      {(() => {
        const unused = subs.filter((b) => b.used === 'rarely');
        if (unused.length)
          return (
            <button onClick={() => setCheckup(true)} className="block w-full text-left px-5 pb-4 text-xs text-amber-200">
              <Icon name="💡" size="1.1em" className="icon-inline text-yellow-300" />
              You hardly use {unused.length === 1 ? unused[0].name : `${unused.length} subscriptions`}. Cancel and save{' '}
              <b>{fmt(unused.reduce((n, b) => n + b.amount, 0) * 12, true)} a year</b>.
            </button>
          );
        if (subs.length >= 2 && subs.some((b) => !b.used))
          return (
            <button onClick={() => setCheckup(true)} className="block w-full text-left px-5 pb-4 text-xs text-slate-400">
              <Icon name="💡" size="1.1em" className="icon-inline text-yellow-300" />
              {subs.length} subscriptions cost {fmt(subs.reduce((n, b) => n + b.amount, 0) * 12, true)} a year. Do a 30-second check-up.
            </button>
          );
        return null;
      })()}
      <CheckupModal open={checkup} onClose={() => setCheckup(false)} subs={subs} />
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

/**
 * Subscription check-up (like the money apps that hunt down forgotten subscriptions): go through each
 * one, say if you really use it, and see what cancelling the unused ones saves, now and invested.
 */
function CheckupModal({ open, onClose, subs }: { open: boolean; onClose: () => void; subs: Bill[] }) {
  const { dispatch, fmt } = useMoney();
  const unused = subs.filter((b) => b.used === 'rarely');
  const yearly = unused.reduce((n, b) => n + b.amount, 0) * 12;
  // What that yearly saving grows to in 10 years at 7% a year, added once a year.
  let grown = 0;
  for (let i = 0; i < 10; i++) grown = (grown + yearly) * 1.07;
  return (
    <Modal open={open} onClose={onClose} title="Subscription check-up">
      <p className="text-sm text-slate-400 -mt-1 mb-3">Be honest: did you really use it in the last month?</p>
      <ul className="space-y-2">
        {subs.map((b) => (
          <li key={b.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-3">
              <span className="shrink-0 w-9 h-9 rounded-lg bg-white/5 text-sky-300 flex items-center justify-center">
                <Icon name={b.icon} size={17} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold text-white truncate">{b.name}</span>
                <span className="block text-xs text-slate-400">
                  {fmt(b.amount)} a month · {fmt(b.amount * 12, true)} a year
                </span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-2.5" role="radiogroup" aria-label={`Do you use ${b.name}?`}>
              {(
                [
                  ['yes', 'I use it'],
                  ['rarely', 'Hardly ever'],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  role="radio"
                  aria-checked={b.used === v}
                  onClick={() => dispatch({ type: 'MONEY_UPSERT_BILL', bill: { ...b, used: v } })}
                  className={`rounded-lg py-2 text-xs font-bold border ${
                    b.used === v ? (v === 'yes' ? 'bg-emerald-500/15 border-emerald-400 text-emerald-100' : 'bg-amber-500/15 border-amber-400 text-amber-100') : 'border-white/10 text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {b.used === 'rarely' && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-400">Cancel it where you pay (app store, website), then remove it here.</p>
                <button onClick={() => dispatch({ type: 'MONEY_DELETE_BILL', billId: b.id })} className="shrink-0 rounded-lg border border-rose-400/40 text-rose-200 text-xs font-bold px-2.5 py-1.5">
                  Cancelled
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {yearly > 0 ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.08] p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">You could save</p>
          <p className="font-display text-3xl font-extrabold text-white tabular-nums">{fmt(yearly, true)} a year</p>
          <p className="text-xs text-slate-300 mt-1">Invested instead, that grows to about <b className="text-white">{fmt(Math.round(grown), true)}</b> in 10 years.</p>
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500 text-center">Mark the ones you hardly use to see what you'd save.</p>
      )}
      <button onClick={onClose} className={`${primaryBtn} w-full py-3 mt-4`}>
        Done
      </button>
    </Modal>
  );
}
