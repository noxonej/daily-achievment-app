import type { Quest } from '../lib/types';

interface WildcardQuestCardProps {
  quest: Quest;
  completed: boolean;
  onToggle: () => void;
}

export function WildcardQuestCard({ quest, completed, onToggle }: WildcardQuestCardProps) {
  return (
    <div className="rounded-2xl p-[1.5px] bg-gradient-to-r from-rose-500/60 via-amber-500/60 to-amber-400/60">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 rounded-[15px] px-4 py-3.5 text-left transition-all ${
          completed ? 'bg-emerald-500/10' : 'bg-[#0f1220]'
        }`}
      >
        <div
          className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
            completed ? 'bg-emerald-500/20' : 'bg-white/5'
          }`}
        >
          {completed ? '✅' : quest.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-full px-2 py-0.5">
              🎲 Today's Wildcard
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
    </div>
  );
}
