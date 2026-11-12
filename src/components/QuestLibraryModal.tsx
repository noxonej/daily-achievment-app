import { useMemo, useState } from 'react';
import { Modal } from './Modal';
import { useApp } from '../store/AppContext';
import { questRarity, rarityText } from '../lib/rarity';
import { proofFor } from '../lib/proof';
import { QUEST_LIBRARY, type LibraryQuest } from '../data/questLibrary';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from '../lib/xp';
import type { Frequency } from '../lib/types';
import { Icon } from './Icon';

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
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const categories = useMemo(() => Array.from(new Set(QUEST_LIBRARY.map((q) => q.category))), []);

  const activeTitles = useMemo(
    () => new Set(state.quests.filter((q) => !q.archived).map((q) => q.title.toLowerCase())),
    [state.quests],
  );

  const grouped = useMemo(() => {
    const words = query.trim().toLowerCase();
    const filtered = QUEST_LIBRARY.filter(
      (q) =>
        (filter === 'all' || q.frequency === filter) &&
        (!cat || q.category === cat) &&
        (!words || `${q.title} ${q.description} ${q.category}`.toLowerCase().includes(words)),
    );
    const byCategory = new Map<string, LibraryQuest[]>();
    for (const q of filtered) {
      if (!byCategory.has(q.category)) byCategory.set(q.category, []);
      byCategory.get(q.category)!.push(q);
    }
    return Array.from(byCategory.entries());
  }, [filter, query, cat]);

  return (
    <Modal open={open} onClose={onClose} title="Quest Library">
      <p className="text-xs text-slate-400 -mt-1 mb-3">
        {QUEST_LIBRARY.length} quest ideas. Tap one to add it to your list.
      </p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search, e.g. water, money, read"
        aria-label="Search quests"
        className="w-full rounded-xl bg-white/5 border border-white/10 px-3 h-11 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 mb-3"
      />
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 -mx-1 px-1" aria-label="Categories">
        {[null, ...categories].map((c) => (
          <button
            key={c ?? 'all'}
            onClick={() => setCat(c)}
            aria-pressed={cat === c}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border transition ${
              cat === c ? 'bg-amber-500 border-amber-500 text-white' : 'border-white/10 bg-white/5 text-slate-300'
            }`}
          >
            {c ?? 'Every topic'}
          </button>
        ))}
      </div>

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
        {grouped.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No quests match. Try another word, or make your own with + Add.</p>}
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
                          measure: item.measure,
                          noteList: item.noteList,
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
                    <Icon name={item.icon} size={19} className="shrink-0 text-slate-300" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-white truncate">{item.title}</span>
                      <span className="block text-xs text-slate-400 truncate">{item.description}</span>
                      <span className="block text-[10.5px] font-semibold text-violet-300/90">
                        ~{rarityText(questRarity(item))} of people do this{proofFor(item) ? ' · asks for proof' : ''}
                      </span>
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
