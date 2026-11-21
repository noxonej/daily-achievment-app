import { useApp } from '../../store/AppContext';
import { wealthPack } from '../../lib/wealth';
import { STATS } from '../../lib/irlStats';
import { useIrlStats } from '../stats/useIrlStats';
import { Icon } from '../Icon';
import { L, isLt } from '../../lib/lang';
import { DIFFICULTY_XP } from '../../lib/xp';

/** Money tab: the four Wealth quests, one tap to add the ones you don't have yet (B2). */
export function WealthPackCard() {
  const { state, dispatch } = useApp();
  const wealth = useIrlStats().wealth;
  const pack = wealthPack();
  const have = new Set(state.quests.filter((q) => !q.archived).map((q) => q.title));
  const missing = pack.filter((q) => !have.has(q.title));
  const lt = isLt();
  return (
    <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-4">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${STATS.wealth.color}22`, color: STATS.wealth.color }}>
          <Icon name="💰" size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{L('Wealth quests', 'Turto užduotys')}</p>
          <p className="text-xs text-slate-400">
            {lt ? STATS.wealth.lt : STATS.wealth.label} LV {wealth.level} · {lt ? wealth.rank.lt : wealth.rank.name}
          </p>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5">
        {pack.map((q) => (
          <li key={q.title} className="flex items-center gap-2 text-[13px] text-slate-200">
            <Icon name={have.has(q.title) ? '✅' : q.icon} size={15} className={have.has(q.title) ? 'text-emerald-300' : 'text-slate-400'} />
            <span className="flex-1 min-w-0 truncate">{q.title}</span>
            <span className="text-[11px] font-bold text-emerald-300 tabular-nums">+{DIFFICULTY_XP[q.difficulty]}</span>
          </li>
        ))}
      </ul>
      {missing.length > 0 ? (
        <button
          onClick={() => missing.forEach((q) => dispatch({ type: 'ADD_QUEST', quest: { title: q.title, description: q.description, frequency: q.frequency, difficulty: q.difficulty, icon: q.icon, category: q.category } }))}
          className="mt-3 w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold py-2.5"
        >
          {missing.length === pack.length ? L('Add all 4 to my day', 'Pridėti visas 4') : L(`Add the other ${missing.length}`, `Pridėti likusias ${missing.length}`)}
        </button>
      ) : (
        <p className="mt-3 text-xs text-emerald-200">{L('All four are in your day. Every one grows your Wealth stat.', 'Visos keturios jau tavo dienoje. Kiekviena kelia Turto rodiklį.')}</p>
      )}
    </section>
  );
}
