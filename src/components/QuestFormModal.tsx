import { useState } from 'react';
import { Modal } from './Modal';
import type { Difficulty, Frequency, Quest } from '../lib/types';
import { DIFFICULTY_LABEL, DIFFICULTY_XP } from '../lib/xp';
import { Icon, IconGrid } from './Icon';
import { UNIT_META } from '../lib/measure';
import type { MeasureUnit, QuestMeasure } from '../lib/types';


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
    measure?: QuestMeasure;
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
  const [kind, setKind] = useState<'check' | 'note' | 'number'>(initial?.measure ? 'number' : initial?.promptForNote ? 'note' : 'check');
  const [unit, setUnit] = useState<MeasureUnit>(initial?.measure?.unit ?? 'reps');
  const [target, setTarget] = useState(initial?.measure ? String(initial.measure.target) : '');
  const targetNum = Number(target.replace(',', '.'));

  function reset() {
    setTitle('');
    setDescription('');
    setDetails('');
    setFrequency(defaultFrequency);
    setDifficulty('easy');
    setIcon('🎯');
    setCategory('Custom');
    setKind('check');
    setTarget('');
  }

  const numberInvalid = kind === 'number' && !(targetNum > 0);

  function handleSubmit() {
    if (!title.trim() || numberInvalid) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      frequency,
      difficulty,
      icon,
      category: category.trim() || 'Custom',
      promptForNote: kind === 'note',
      details: details.trim() || undefined,
      measure: kind === 'number' ? { unit, target: targetNum } : undefined,
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
            <IconGrid options={ICONS} value={icon} onChange={setIcon} size="sm" />
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

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">How is it completed?</label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['check', '✓', 'Tick it off'],
                ['note', '📝', 'Write something'],
                ['number', '📊', 'Reach a number'],
              ] as const
            ).map(([k, ic, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-[11px] font-semibold transition ${
                  kind === k ? 'border-amber-400 bg-amber-500/15 text-white' : 'border-white/10 bg-white/5 text-slate-400'
                }`}
              >
                <Icon name={ic} size={16} />
                {label}
              </button>
            ))}
          </div>
          {kind === 'note' && <p className="text-[11px] text-slate-500 mt-1.5">Needs real words to count. Put a number in the title like "x3" or "top 3" to ask for that many separate answers.</p>}
          {kind === 'number' && (
            <div className="flex gap-2 mt-2">
              <input
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Target, e.g. 50"
                aria-label="Target"
                className={`flex-1 min-w-0 rounded-lg bg-white/5 border px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 ${target && numberInvalid ? 'border-red-400/60' : 'border-white/10'}`}
              />
              <select value={unit} onChange={(e) => setUnit(e.target.value as MeasureUnit)} aria-label="Unit" className="rounded-lg bg-white/5 border border-white/10 px-2 py-2 text-sm text-white focus:outline-none">
                {(Object.keys(UNIT_META) as MeasureUnit[]).map((u) => (
                  <option key={u} value={u}>
                    {UNIT_META[u].label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!title.trim() || numberInvalid}
          className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 active:scale-95 transition-all"
        >
          {initial ? 'Save Changes' : 'Create Quest'}
        </button>
      </div>
    </Modal>
  );
}
