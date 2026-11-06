import type { Quest } from '../lib/types';
import { QUEST_LIBRARY } from '../data/questLibrary';
import { useApp } from '../store/AppContext';
import { Modal } from './Modal';
import { Icon } from './Icon';

/** Pick one of today's daily quests to trade for a different simple quest (today only). */
export function QuestSwapModal({
  open,
  onClose,
  candidates,
  onSwap,
}: {
  open: boolean;
  onClose: () => void;
  candidates: Quest[];
  onSwap: (questId: string, replacement: { title: string; description?: string; icon: string }) => void;
}) {
  const { state } = useApp();

  function pickReplacement() {
    const taken = new Set(state.quests.map((q) => q.title.toLowerCase()));
    const pool = QUEST_LIBRARY.filter((l) => l.frequency === 'daily' && !l.measure && !l.promptForNote && !taken.has(l.title.toLowerCase()));
    const choice = pool[Math.floor(Math.random() * pool.length)] ?? { title: 'Take a 10-minute walk', description: 'Fresh air, no phone.', icon: '🚶' };
    return { title: choice.title, description: choice.description, icon: choice.icon };
  }

  return (
    <Modal open={open} onClose={onClose} title="Swap a quest">
      <p className="text-sm text-slate-400 mb-4">
        Not feeling one of today's quests? Trade it for a different one. It's back to normal tomorrow, and finishing the new one counts just the same.
      </p>
      {candidates.length === 0 ? (
        <p className="text-sm text-slate-300">Nothing left to swap today. Every daily quest is done or already swapped.</p>
      ) : (
        <div className="space-y-2">
          {candidates.map((q) => (
            <button
              key={q.id}
              onClick={() => onSwap(q.id, pickReplacement())}
              className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] hover:border-sky-400/50 px-3.5 py-3 text-left transition"
            >
              <span className="shrink-0 w-9 h-9 rounded-lg bg-white/5 text-slate-200 flex items-center justify-center">
                <Icon name={q.icon} size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-white truncate">{q.title}</span>
                <span className="block text-xs text-slate-500">+{q.xp} XP</span>
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-sky-300">
                <Icon name="🔁" size={14} />
                Swap
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
