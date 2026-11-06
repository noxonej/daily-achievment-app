import type { ReactNode } from 'react';
import { useApp } from '../../store/AppContext';
import { createEmptyMoney, formatMoney } from '../../lib/money';

export const inputClass =
  'w-full rounded-xl bg-white/5 border border-white/10 px-3 h-11 text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 focus:bg-white/[0.07] transition';
export const card = 'rounded-2xl border border-white/10 bg-white/[0.03]';
export const primaryBtn =
  'rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold transition active:scale-[0.98]';
export const secondaryBtn =
  'rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-semibold text-slate-200 transition';


export function useMoney() {
  const { state, dispatch, undoable } = useApp();
  const money = state.money ?? createEmptyMoney();
  const fmt = (cents: number, compact = false) => formatMoney(cents, money.currency, { compact });
  return { money, dispatch, fmt, undoable };
}


export function AmountInput({
  value,
  onChange,
  autoFocus,
  big,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  big?: boolean;
  invalid?: boolean;
}) {
  const { money } = useMoney();
  return (
    <div className="relative">
      <input
        autoFocus={autoFocus}
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} pr-14 ${big ? '!h-14 !text-2xl font-bold' : ''} ${invalid ? '!border-red-400/60' : ''}`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">{money.currency}</span>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

