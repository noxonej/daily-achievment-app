import { useApp } from '../store/AppContext';
import { formatMoney } from '../lib/money';
import { goalSaved, goalShare, vehicleGoal } from '../lib/wealth';
import { L } from '../lib/lang';
import { Icon } from '../components/Icon';
import { vehicleSprite } from './px/sprite';
import { partsOf, vehicleHex, worldOf, type Vehicle } from './catalog';

/**
 * Your real car fund, in the Garage (B2): the car fills with colour as the savings goal fills up.
 * Picks the first savings goal that looks like a vehicle (🚗 icon or "car" / "mašina" in its name).
 */
export function CarFund({ vehicle }: { vehicle: Vehicle }) {
  const { state, dispatch } = useApp();
  const money = state.money;
  const goal = vehicleGoal(money);
  if (!money?.setupDone) return null;
  if (!goal) {
    return (
      <button
        onClick={() => dispatch({ type: 'MONEY_UPSERT_GOAL', goal: { name: L('Car fund', 'Mašinai'), icon: '🚗', target: 300000 }, newAccount: { name: L('Car fund', 'Mašinai'), amount: 0 } })}
        className="w-full flex items-center gap-3 rounded-[20px] border border-dashed border-emerald-400/40 bg-emerald-500/[0.06] px-4 py-3 text-left"
      >
        <Icon name="🚗" size={20} className="text-emerald-300" />
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-white">{L('Saving for a real car?', 'Taupai tikrai mašinai?')}</span>
          <span className="block text-xs text-slate-400">{L('Start a car fund: this car fills up as you save. Change the amount in Money.', 'Pradėk taupyti: ši mašina prisipildys spalvų, kai taupysi. Sumą pakeisi Pinigų skiltyje.')}</span>
        </span>
        <Icon name="➕" size={18} className="text-emerald-300" />
      </button>
    );
  }
  const world = worldOf(state);
  const sprite = vehicleSprite(vehicle, vehicleHex(world, vehicle), partsOf(world, vehicle), { crop: true });
  const pct = goalShare(money, goal);
  const saved = goalSaved(money, goal);
  const fmt = (c: number) => formatMoney(c, money.currency);
  return (
    <section className="rounded-[22px] border border-emerald-400/25 bg-gradient-to-b from-emerald-500/[0.10] to-transparent p-4" aria-label={L('Real car fund', 'Tikros mašinos fondas')}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">{L('Real-life fund', 'Tikras fondas')} · {goal.name}</p>
        <p className="font-display text-sm font-extrabold text-white tabular-nums">{Math.floor(pct * 100)}%</p>
      </div>
      <div className="relative mx-auto mt-2" style={{ width: `min(100%, ${sprite.w * 2.2}px)`, aspectRatio: `${sprite.w} / ${sprite.h}` }}>
        <img src={sprite.url} alt="" draggable={false} className="px-art absolute inset-0 w-full h-full grayscale opacity-30" />
        <img
          src={sprite.url}
          alt={`${goal.name}: ${Math.floor(pct * 100)}%`}
          draggable={false}
          className="px-art absolute inset-0 w-full h-full transition-[clip-path] duration-700"
          style={{ clipPath: `inset(0 ${100 - pct * 100}% 0 0)` }}
        />
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/[0.08] overflow-hidden">
        <div className="h-full rounded-full bg-emerald-400 bar-in" style={{ width: `${Math.max(2, pct * 100)}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-slate-300 tabular-nums">
        {fmt(saved)} / {fmt(goal.target)}
        {pct >= 1 ? ` · ${L('Goal reached! 🎉', 'Tikslas pasiektas! 🎉')}` : ` · ${L('add money in the Money tab', 'pridėk pinigų Pinigų skiltyje')}`}
      </p>
      <p className="mt-1 text-[10px] text-slate-500">{L('General information, not financial advice.', 'Bendra informacija, ne finansinė konsultacija.')}</p>
    </section>
  );
}
