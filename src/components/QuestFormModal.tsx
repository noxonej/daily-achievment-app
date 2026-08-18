import { useState } from 'react';
import { Modal } from './Modal';
import type { Difficulty, Frequency, Quest } from '../lib/types';
import { DIFFICULTY_LABEL, DIFFICULTY_XP } from '../lib/xp';

const ICONS = ['🎯', '📖', '🧘', '🏃', '💧', '🙏', '🥗', '🧹', '📚', '💪', '☎️', '🗓️', '🚀', '💻', '🎨', '🎵'];

interface QuestFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    frequency: Frequency;
    difficulty: Difficulty;
    icon: string;
    category: string;
    promptForNote?: boolean;
    details?: string;
  }) => void;
  initial?: Quest;
  defaultFrequency?: Frequency;
}

export function QuestFormModal({ open, onClose, onSubmit, initial, defaultFrequency = 'daily' }: QuestFormModalProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [details, setDetails] = useState(initial?.details ?? '');
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? defaultFrequency);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? 'easy');
  const [icon, setIcon] = useState(initial?.icon ?? '🎯');
  const [category, setCategory] = useState(initial?.category ?? 'Custom');
  const [promptForNote, setPromptForNote] = useState(initial?.promptForNote ?? false);

  function reset() {
    setTitle('');
    setDescription('');
    setDetails('');
    setFrequency(defaultFrequency);
    setDifficulty('easy');
    setIcon('🎯');
    setCategory('Custom');
    setPromptForNote(false);
  }

  function handleSubmit() {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      frequency,
      difficulty,
      icon,
      category: category.trim() || 'Custom',
      promptForNote,
      details: details.trim() || undefined,
    });
    if (!initial) reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Quest' : 'New Quest'}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button
                key={i}
                onClick={() => setIcon(i)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border transition ${
                  icon === i ? 'border-amber-400 bg-amber-500/20' : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Read 15 pages"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="A little reminder of what this means"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            More info (optional)
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={2}
            placeholder="A longer explanation, hidden behind a tap — useful for clearing up anything that could be read differently by different people"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Mind, Body, Life..."
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Frequency</label>
          <div className="grid grid-cols-2 gap-2">
            {(['daily', 'weekly'] as Frequency[]).map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold capitalize transition ${
                  frequency === f
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                }`}
              >
                {f === 'daily' ? 'Daily quest' : 'Weekly quest'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Difficulty</label>
          <div className="grid grid-cols-4 gap-2">
            {(['easy', 'medium', 'hard', 'epic'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                  difficulty === d
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                }`}
              >
                {DIFFICULTY_LABEL[d]}
                <span className="block text-[10px] text-slate-500">+{DIFFICULTY_XP[d]} XP</span>
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2.5 rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={promptForNote}
            onChange={(e) => setPromptForNote(e.target.checked)}
            className="w-4 h-4 accent-amber-500"
          />
          <span className="text-xs text-slate-300">
            📝 Ask for a written note — writing something is what completes it
          </span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 active:scale-95 transition-all"
        >
          {initial ? 'Save Changes' : 'Create Quest'}
        </button>
      </div>
    </Modal>
  );
}
