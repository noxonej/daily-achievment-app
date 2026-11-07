import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../Modal';
import { Icon } from '../Icon';
import { useMoney } from './ui';

/** Notes and coins per currency, in cents. Other currencies use a general set. */
const DENOMS: Record<string, { notes: number[]; coins: number[] }> = {
  EUR: { notes: [50000, 20000, 10000, 5000, 2000, 1000, 500], coins: [200, 100, 50, 20, 10, 5, 2, 1] },
  USD: { notes: [10000, 5000, 2000, 1000, 500, 200, 100], coins: [25, 10, 5, 1] },
  GBP: { notes: [5000, 2000, 1000, 500], coins: [200, 100, 50, 20, 10, 5, 2, 1] },
  PLN: { notes: [50000, 20000, 10000, 5000, 2000, 1000], coins: [500, 200, 100, 50, 20, 10, 5, 2, 1] },
};
const GENERIC = { notes: [10000, 5000, 2000, 1000, 500], coins: [200, 100, 50, 20, 10, 5, 1] };

/** Count the cash in your wallet note by note, then save the total to a spending account. */
export function CashCounter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { money, fmt, dispatch } = useMoney();
  const set = DENOMS[money.currency] ?? GENERIC;
  const [counts, setCounts] = useState<Record<number, number>>({});
  const spending = money.accounts.filter((a) => a.kind === 'spending');
  const [accountId, setAccountId] = useState(spending[0]?.id ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCounts({});
    setSaved(false);
    setAccountId((id) => (spending.some((a) => a.id === id) ? id : spending[0]?.id ?? ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = useMemo(() => Object.entries(counts).reduce((s, [v, n]) => s + Number(v) * n, 0), [counts]);
  const account = spending.find((a) => a.id === accountId);

  function change(v: number, d: number) {
    setCounts((c) => ({ ...c, [v]: Math.max(0, (c[v] ?? 0) + d) }));
  }

  const Row = ({ v, coin }: { v: number; coin?: boolean }) => (
    <div className="flex items-center gap-2 py-1.5">
      <span
        className={`shrink-0 h-8 flex items-center justify-center font-display font-bold text-[13px] tabular-nums ${
          coin ? 'w-8 rounded-full bg-gradient-to-b from-yellow-200 to-amber-500 text-[#3b2405]' : 'w-14 rounded-md bg-gradient-to-b from-emerald-200 to-emerald-500 text-[#06281b]'
        }`}
      >
        {v >= 100 ? v / 100 : `${v}¢`}
      </span>
      <span className="flex-1 text-sm text-slate-400 tabular-nums">{(counts[v] ?? 0) > 0 ? `= ${fmt(v * (counts[v] ?? 0))}` : ''}</span>
      <button onClick={() => change(v, -1)} disabled={!counts[v]} aria-label={`One less ${v}`} className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white text-lg disabled:opacity-30">
        −
      </button>
      <span className="w-8 text-center font-bold text-white tabular-nums">{counts[v] ?? 0}</span>
      <button onClick={() => change(v, 1)} aria-label={`One more ${v}`} className="w-9 h-9 rounded-lg bg-amber-500 text-white text-lg">
        +
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Count my cash">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total</p>
          <p key={total} className="font-display text-3xl font-extrabold text-white tabular-nums animate-num-pop">{fmt(total)}</p>
          {account && total > 0 && account.amount !== total && (
            <p className="text-xs text-slate-400 mt-1">
              {account.name} says {fmt(account.amount)} ({total > account.amount ? '+' : '−'}
              {fmt(Math.abs(total - account.amount))})
            </p>
          )}
        </div>
        <section>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Notes</p>
          {set.notes.map((v) => (
            <Row key={v} v={v} />
          ))}
        </section>
        <section>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Coins</p>
          {set.coins.map((v) => (
            <Row key={v} v={v} coin />
          ))}
        </section>
        {spending.length > 1 && (
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} aria-label="Save to" className="w-full rounded-xl bg-white/5 border border-white/10 px-3 h-11 text-[15px] text-white">
            {spending.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
        <button
          disabled={!account || total === 0}
          onClick={() => {
            if (!account) return;
            dispatch({ type: 'MONEY_UPSERT_ACCOUNT', account: { ...account, amount: total } });
            setSaved(true);
            setTimeout(onClose, 700);
          }}
          className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold py-3 flex items-center justify-center gap-2"
        >
          {saved ? <Icon name="✓" size={18} strokeWidth={3} className="animate-check" /> : null}
          {saved ? 'Saved' : account ? `Set ${account.name} to ${fmt(total)}` : 'Add a spending account first'}
        </button>
      </div>
    </Modal>
  );
}
