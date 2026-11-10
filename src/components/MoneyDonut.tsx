import { useEffect, useState } from 'react';
import { useCountUp } from '../lib/useCountUp';
import type { MoneyKind } from '../lib/types';
import { MONEY_KINDS, formatMoney } from '../lib/money';

interface Slice {
  kind: MoneyKind;
  amount: number;
}

const SIZE = 220;
const STROKE = 22;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 3; // surface gap between segments, in px along the ring

/** Part-to-whole ring of where the money sits; total in the middle. Tap a slice or legend row to focus it. */
export function MoneyDonut({ slices, currency }: { slices: Slice[]; currency: string }) {
  const [active, setActive] = useState<MoneyKind | null>(null);
  // Ring draws itself in on first show, then eases between values.
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(r);
  }, []);
  const total = slices.reduce((s, x) => s + x.amount, 0);
  const positive = slices.filter((s) => s.amount > 0);
  const ringTotal = positive.reduce((s, x) => s + x.amount, 0);
  const focused = active ? slices.find((s) => s.kind === active) : null;
  const gap = positive.length > 1 ? GAP : 0;

  let offset = 0;
  const arcs = positive.map((s) => {
    const len = (s.amount / ringTotal) * C;
    const arc = { ...s, dash: Math.max(len - gap, 0.5), offset };
    offset += len;
    return arc;
  });

  const centerLabel = focused ? MONEY_KINDS.find((k) => k.id === focused.kind)!.short : 'Total';
  const centerValue = focused ? focused.amount : total;
  const shownValue = useCountUp(centerValue, 900, 0);
  const valueText = formatMoney(shownValue, currency, { compact: Math.abs(centerValue) >= 10000000 });

  return (
    <div>
      <div className="relative mx-auto" style={{ width: SIZE, height: SIZE, maxWidth: '100%' }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full -rotate-90" role="img" aria-label={`Total ${formatMoney(total, currency)}`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
          {arcs.map((a) => {
            const meta = MONEY_KINDS.find((k) => k.id === a.kind)!;
            const dim = active && active !== a.kind;
            return (
              <circle
                key={a.kind}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={meta.color}
                strokeWidth={active === a.kind ? STROKE + 4 : STROKE}
                strokeDasharray={drawn ? `${a.dash} ${C - a.dash}` : `0 ${C}`}
                strokeDashoffset={drawn ? -a.offset : 0}
                opacity={dim ? 0.3 : 1}
                style={{
                  transition:
                    'stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1), stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1), stroke-width 0.2s, opacity 0.2s',
                }}
                className="cursor-pointer"
                onClick={() => setActive(active === a.kind ? null : a.kind)}
                onMouseEnter={() => setActive(a.kind)}
                onMouseLeave={() => setActive(null)}
              >
                <title>{`${meta.short}: ${formatMoney(a.amount, currency)}`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{centerLabel}</span>
          <span
            className={`font-display font-extrabold text-white tabular-nums leading-tight mt-0.5 ${
              valueText.length > 15 ? 'text-base' : valueText.length > 12 ? 'text-lg' : valueText.length > 9 ? 'text-2xl' : 'text-3xl'
            }`}
          >
            {valueText}
          </span>
          {focused && total > 0 && (
            <span className="text-xs text-slate-400 mt-0.5 tabular-nums">{Math.round((focused.amount / total) * 100)}% of total</span>
          )}
        </div>
      </div>

      <ul className="mt-4 space-y-1">
        {MONEY_KINDS.map((k) => {
          const amount = slices.find((s) => s.kind === k.id)?.amount ?? 0;
          const pct = total > 0 ? Math.round((Math.max(amount, 0) / Math.max(ringTotal, 1)) * 100) : 0;
          return (
            <li key={k.id}>
              <button
                onClick={() => setActive(active === k.id ? null : k.id)}
                className={`w-full flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-xl px-3 py-2 text-left transition ${
                  active === k.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                }`}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: k.color }} />
                <span className="flex-1 min-w-0 text-sm font-semibold text-slate-200 truncate">{k.short}</span>
                <span className="shrink-0 text-xs text-slate-500 tabular-nums w-10 text-right">{pct}%</span>
                <span className="shrink-0 ml-auto text-sm font-bold text-white tabular-nums whitespace-nowrap">{formatMoney(amount, currency)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
