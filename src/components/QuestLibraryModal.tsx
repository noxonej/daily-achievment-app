import { useMemo, useState } from 'react';
import { Modal } from './Modal';
import { useApp } from '../store/AppContext';
import { QUEST_LIBRARY, type LibraryQuest } from '../data/questLibrary';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from '../lib/xp';
import type { Frequency } from '../lib/types';

interface QuestLibraryModalProps {
  open: boolean;
  onClose: () => void;
}

const FILTERS: Array<{ id: Frequency | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
];

export function QuestLibraryModal({ open, onClose }: QuestLibraryModalProps) {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<Frequency | 'all'>('all');

  const activeTitles = useMemo(
    () => new Set(state.quests.filter((q) => !q.archived).map((q) => q.title.toLowerCase())),
    [state.quests],
  );

  const grouped = useMemo(() => {
    const filtered = QUEST_LIBRARY.filter((q) => filter === 'all' || q.frequency === filter);
    const byCategory = new Map<string, LibraryQuest[]>();
    for (const q of filtered) {
      if (!byCategory.has(q.category)) byCategory.set(q.category, []);
      byCategory.get(q.category)!.push(q);
    }
    return Array.from(byCategory.entries());
  }, [filter]);

  return (
    <Modal open={open} onClose={onClose} title="Quest Library">
      <p className="text-xs text-slate-400 -mt-1 mb-3">
        A bigger archive of quests to draw from — tap one to add it to your list.
      </p>

      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-lg py-2 text-xs font-semibold transition ${
              filter === f.id
                ? 'bg-amber-500/20 border border-amber-400 text-amber-200'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-5 max-h-96 overflow-y-auto pr-0.5">
        {grouped.map(([category, items]) => (
          <div key={category}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">{category}</p>
            <div className="space-y-2">
              {items.map((item) => {
                const added = activeTitles.has(item.title.toLowerCase());
                return (
                  <button
                    key={item.title}
                    onClick={() => {
                      if (added) return;
                      dispatch({
                        type: 'ADD_QUEST',
                        quest: {
                          title: item.title,
                          description: item.description,
                          frequency: item.frequency,
                          difficulty: item.difficulty,
                          icon: item.icon,
                          category: item.category,
                          promptForNote: item.promptForNote,
                        },
                      });
                    }}
                    disabled={added}
                    className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition ${
                      added
                        ? 'border-white/5 bg-white/[0.02] opacity-50'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-white truncate">{item.title}</span>
                      <span className="block text-xs text-slate-400 truncate">{item.description}</span>
                    </span>
                    <span className="shrink-0 flex flex-col items-end gap-1">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${DIFFICULTY_COLOR[item.difficulty]}`}
                      >
                        {DIFFICULTY_LABEL[item.difficulty]}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {added ? 'Added' : '+ Add'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
