import { useState } from 'react';
import { MONEY_MODES, SAVING_METHODS, SCAM_FLAGS, modeInfo, type MethodAction, type MoneyMode } from '../../lib/moneyModes';
import { suggestedSaveRate } from '../../lib/moneyPlan';
import { billsPerMonth } from '../../lib/moneyTips';
import { Icon } from '../Icon';
import { card, primaryBtn, useMoney } from './ui';

type Target = 'money-plan' | 'budget' | 'bills' | 'wishlist';

/** Money tab > Save: choose what your money focuses on, and proven ways to save more. */
export function SavePanel({ onGo }: { onGo: (target: Target) => void }) {
  return (
    <div className="space-y-4">
      <ModePicker onGo={onGo} />
      <Methods onGo={onGo} />
      <ScamCard />
      <p className="text-[11px] text-slate-500 px-1">General money education, not financial advice for your situation.</p>
    </div>
  );
}

function ModePicker({ onGo }: { onGo: (t: Target) => void }) {
  const { money, dispatch, fmt } = useMoney();
  const current = money.mode;
  const [picked, setPicked] = useState<MoneyMode>(current ?? 'balanced');
  const info = modeInfo(picked);
  const kind = money.income?.kind ?? 'allowance';
  const rate = info.rate[kind];
  const isOn = current === picked && Math.abs((money.saveRate ?? suggestedSaveRate(kind)) - rate) < 0.001;
  const monthly = money.income?.monthly ?? 0;

  return (
    <section className={`${card} p-5`}>
      <p className="text-sm font-semibold text-white">
        <Icon name="🧭" size="1.15em" className="icon-inline text-amber-300" />
        Your money mode
      </p>
      <p className="text-xs text-slate-400 mt-0.5">What should your money focus on right now? You can change it any time.</p>
      <div className="mt-3 grid grid-cols-2 min-[400px]:grid-cols-3 gap-2" role="radiogroup" aria-label="Money mode">
        {MONEY_MODES.map((m) => {
          const on = picked === m.id;
          return (
            <button
              key={m.id}
              role="radio"
              aria-checked={on}
              onClick={() => setPicked(m.id)}
              className={`relative rounded-xl border-2 px-2.5 py-2.5 text-left transition active:scale-[0.97] ${on ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 hover:border-white/25'}`}
            >
              <Icon name={m.icon} size={18} className={on ? 'text-amber-300' : 'text-slate-300'} />
              <span className="block text-sm font-bold text-white mt-1 leading-tight">{m.label}</span>
              {current === m.id && <span className="absolute top-1.5 right-1.5 text-[9px] font-black uppercase text-emerald-300">Now</span>}
            </button>
          );
        })}
      </div>

      <div key={picked} className="mt-4 rounded-xl bg-black/20 border border-white/[0.06] p-4 animate-view-in">
        <p className="font-display font-bold text-white">{info.tagline}</p>
        <p className="text-sm text-emerald-300 font-semibold mt-1">
          Save {Math.round(rate * 100)}% first{monthly ? ` = ${fmt(Math.round(monthly * rate))} a month` : ''}
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {info.focus.map((f) => (
            <li key={f} className="flex gap-2 text-[13px] text-slate-300 leading-relaxed">
              <Icon name="✓" size={14} strokeWidth={3} className="shrink-0 mt-1 text-emerald-300" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={() => dispatch({ type: 'MONEY_SET_MODE', mode: picked, saveRate: rate })}
        disabled={isOn}
        className={`${primaryBtn} w-full py-3 mt-4 disabled:opacity-60`}
      >
        {isOn ? `${info.label} mode is on ✓` : `Use ${info.label} mode`}
      </button>
      {!monthly && (
        <button onClick={() => onGo('money-plan')} className="mt-2 w-full text-center text-xs font-semibold text-amber-300">
          Add your monthly money to see amounts →
        </button>
      )}
    </section>
  );
}

function Methods({ onGo }: { onGo: (t: Target) => void }) {
  const { money, dispatch, fmt } = useMoney();
  const [open, setOpen] = useState<string | null>('first');
  const [done, setDone] = useState<Record<string, boolean>>({});
  const hasGoal = (name: string) => money.goals.some((g) => g.name.toLowerCase() === name.toLowerCase());
  // One unit of the money's currency, so the 52-week challenge reads as 1, 2, 3…
  const unit = 100;

  function run(id: string, action: MethodAction) {
    if (action === 'plan') return onGo('money-plan');
    if (action === 'budget') return onGo('budget');
    if (action === 'subs') return onGo('bills');
    if (action === 'wishlist') return onGo('wishlist');
    if (action === 'goal-emergency') {
      const monthlyCosts = billsPerMonth(money) + (money.income?.monthly ?? 0) * 0.5;
      const target = money.income?.kind === 'salary' ? Math.max(50000, Math.round(monthlyCosts * 3)) : Math.max(10000, money.income?.monthly ?? 10000);
      dispatch({ type: 'MONEY_UPSERT_GOAL', goal: { name: 'Emergency fund', icon: '🛟', target }, newAccount: { name: 'Emergency fund', amount: 0 } });
    }
    if (action === 'goal-52') {
      dispatch({ type: 'MONEY_UPSERT_GOAL', goal: { name: '52-week challenge', icon: '🗓', target: 1378 * unit, weekly: 26 * unit }, newAccount: { name: '52-week challenge', amount: 0 } });
    }
    setDone((d) => ({ ...d, [id]: true }));
  }

  return (
    <section className={card}>
      <div className="px-5 pt-4 pb-2">
        <p className="text-sm font-semibold text-white">
          <Icon name="🐷" size="1.15em" className="icon-inline text-emerald-300" />
          Proven ways to save
        </p>
        <p className="text-xs text-slate-400 mt-0.5">Simple methods that really work. Tap one to read more.</p>
      </div>
      <ul className="divide-y divide-white/[0.06]">
        {SAVING_METHODS.map((m) => {
          const isOpen = open === m.id;
          const goalName = m.action === 'goal-emergency' ? 'Emergency fund' : m.action === 'goal-52' ? '52-week challenge' : null;
          const already = goalName ? hasGoal(goalName) : false;
          return (
            <li key={m.id}>
              <button onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-white/[0.03]">
                <span className="shrink-0 w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-300 flex items-center justify-center">
                  <Icon name={m.icon} size={17} />
                </span>
                <span className="flex-1 min-w-0 text-[15px] font-semibold text-white">{m.title}</span>
                <Icon name="▾" size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-4 -mt-1 animate-view-in">
                  <p className="text-[13px] text-slate-300 leading-relaxed">
                    {m.id === '52' ? m.text.replace('1,378', fmt(1378 * unit, true)) : m.text}
                  </p>
                  {m.action && (
                    <button
                      onClick={() => run(m.id, m.action!)}
                      disabled={already || done[m.id]}
                      className="mt-2.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 hover:bg-emerald-500/25 disabled:opacity-60 px-3 py-1.5 text-sm font-bold text-emerald-200"
                    >
                      {already || done[m.id] ? 'Added to your goals ✓' : m.actionLabel}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ScamCard() {
  return (
    <section className="rounded-2xl border border-red-400/30 bg-red-500/[0.06] p-5">
      <p className="text-sm font-semibold text-white">
        <Icon name="⚠" size="1.15em" className="icon-inline text-red-300" />
        Scam red flags
      </p>
      <p className="text-xs text-slate-400 mt-0.5">See one of these? Stop, and ask someone you trust before you pay anything.</p>
      <ul className="mt-3 space-y-1.5">
        {SCAM_FLAGS.map((f) => (
          <li key={f} className="flex gap-2 text-[13px] text-slate-300 leading-relaxed">
            <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-red-300" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
