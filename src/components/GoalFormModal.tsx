import { useState } from 'react';
import { Modal } from './Modal';
import type { GoalTimeframe, LongTermGoal } from '../lib/types';

const ICONS = ['🎯', '📚', '💪', '🧘', '💰', '🎨', '🎵', '🌍', '💻', '🏃', '✍️', '🌱'];

interface GoalFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    timeframe: GoalTimeframe;
    target: number;
    unit: string;
    icon: string;
  }) => void;
  initial?: LongTermGoal;
}

export function GoalFormModal({ open, onClose, onSubmit, initial }: GoalFormModalProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [timeframe, setTimeframe] = useState<GoalTimeframe>(initial?.timeframe ?? 'yearly');
  const [target, setTarget] = useState(initial?.target ?? 10);
  const [unit, setUnit] = useState(initial?.unit ?? 'times');
  const [icon, setIcon] = useState(initial?.icon ?? '🎯');

  function reset() {
    setTitle('');
    setDescription('');
    setTimeframe('yearly');
    setTarget(10);
    setUnit('times');
    setIcon('🎯');
  }

  function handleSubmit() {
    if (!title.trim() || target <= 0) return;
    onSubmit({ title: title.trim(), description: description.trim() || undefined, timeframe, target, unit: unit.trim() || 'times', icon });
    if (!initial) reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Goal' : 'New Long-Term Goal'}>
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
            placeholder="Read 12 books"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Why this matters to you"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Target</label>
            <input
              type="number"
              min={1}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Unit</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="books, days..."
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Timeframe</label>
          <div className="grid grid-cols-4 gap-2">
            {(['weekly', 'monthly', 'yearly', 'custom'] as GoalTimeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold capitalize transition ${
                  timeframe === tf
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!title.trim() || target <= 0}
          className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 active:scale-95 transition-all"
        >
          {initial ? 'Save Changes' : 'Create Goal'}
        </button>
      </div>
    </Modal>
  );
}
