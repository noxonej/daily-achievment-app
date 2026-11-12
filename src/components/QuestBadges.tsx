import type { Quest } from '../lib/types';
import { questRarity, rarityText } from '../lib/rarity';
import { useApp } from '../store/AppContext';
import { todayKey } from '../lib/date';
import { Icon } from './Icon';

/** Under a quest's title: how rare it is ("~8% of people do this") and a "Proven" tick once you answered its proof. */
export function QuestBadges({ quest }: { quest: Quest }) {
  const { state } = useApp();
  const pct = questRarity(quest);
  const proven = !!state.dayLogs[todayKey()]?.proofs?.[quest.id];
  const rare = pct < 10;
  return (
    <span className="mt-1 flex items-center gap-1.5 flex-wrap text-[10.5px] font-semibold">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-px border ${rare ? 'border-violet-400/30 bg-violet-500/10 text-violet-200' : 'border-white/10 bg-white/[0.04] text-slate-400'}`}
        title="About this share of people do this. An estimate from habit surveys, not live data."
      >
        <Icon name="👥" size={10} />
        {rare ? `Only ~${rarityText(pct)} do this` : `~${rarityText(pct)} of people do this`}
      </span>
      {proven && (
        <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-px border border-emerald-400/30 bg-emerald-500/10 text-emerald-200">
          <Icon name="✓" size={10} /> Proven
        </span>
      )}
    </span>
  );
}
