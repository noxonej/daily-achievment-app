import type { Quest } from '../lib/types';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from '../lib/xp';
import { InfoDisclosure } from './InfoDisclosure';

interface QuestCardProps {
  quest: Quest;
  completed: boolean;
  onToggle: () => void;
}

export function QuestCard({ quest, completed, onToggle }: QuestCardProps) {
  return (
    <div
      className={`rounded-xl border px-4 py-3.5 transition-all group ${
        completed
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
      }`}
    >
      <button onClick={onToggle} className="w-full flex items-center gap-3 text-left">
        <div
          className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
            completed ? 'bg-emerald-500/20' : 'bg-white/5 group-hover:bg-white/10'
          }`}
        >
          {completed ? '✅' : quest.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`font-semibold text-[15px] leading-tight truncate ${
              completed ? 'text-emerald-300 line-through decoration-2' : 'text-white'
            }`}
          >
            {quest.title}
          </p>
          {quest.description && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{quest.description}</p>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${DIFFICULTY_COLOR[quest.difficulty]}`}
          >
            {DIFFICULTY_LABEL[quest.difficulty]}
          </span>
          <span className="text-[11px] font-display font-bold text-amber-300">+{quest.xp} XP</span>
        </div>
      </button>
      {quest.details && (
        <div className="pl-12 mt-1">
          <InfoDisclosure text={quest.details} />
        </div>
      )}
    </div>
  );
}
