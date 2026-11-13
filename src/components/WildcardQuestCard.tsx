import type { Quest } from '../lib/types';
import { FloatingReward } from './FloatingReward';
import { useCompletionFx } from '../lib/useCompletionFx';
import { questReward } from '../lib/rewards';
import { Icon } from './Icon';
import { CompleteBurst } from './fx/CompleteBurst';

interface WildcardQuestCardProps {
  quest: Quest;
  completed: boolean;
  onToggle: () => void;
  periodKey: string;
}

export function WildcardQuestCard({ quest, completed, onToggle, periodKey }: WildcardQuestCardProps) {
  const { justCompleted } = useCompletionFx(completed);
  const { xp, crit } = questReward(periodKey, quest.id, quest.xp);

  return (
    <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-r from-orange-400/55 to-yellow-400/35">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 rounded-[15px] px-4 py-3.5 text-left transition-all active:scale-[0.99] ${
          completed ? 'bg-emerald-500/10' : 'bg-surface'
        }`}
      >
        <div
          className={`relative shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
            completed ? 'bg-emerald-500/20' : 'bg-white/5'
          } ${justCompleted ? 'animate-pop-in' : ''}`}
        >{justCompleted && <CompleteBurst />}
          {completed ? <Icon name="✅" size={20} className="text-emerald-300 animate-check" /> : <Icon name={quest.icon} size={19} className="text-slate-200" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-full px-2 py-0.5">
              <Icon name="🎲" size="1.15em" className="icon-inline" />Today's Wildcard
            </span>
          </div>
          <p
            className={`font-semibold text-[15px] leading-tight truncate ${
              completed ? 'text-emerald-300 line-through decoration-2' : 'text-white'
            }`}
          >
            {quest.title}
          </p>
          {quest.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{quest.description}</p>}
        </div>
        <span className="shrink-0 text-[11px] font-display font-bold text-amber-300">+{quest.xp} XP</span>
      </button>
      {justCompleted && <FloatingReward xp={xp} crit={crit} />}
    </div>
  );
}
