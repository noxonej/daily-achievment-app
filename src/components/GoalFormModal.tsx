import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import type { GoalTimeframe, LongTermGoal } from '../lib/types';
import { IconGrid } from './Icon';

const ICONS = ['🎯', '📚', '💪', '🧘', '💰', '🎨', '🎵', '🌍', '💻', '🏃', '✍', '🌱', '🗣', '🧠', '🚲', '🏋', '🎸', '✈', '🍳', '🤝'];

/** Ready-made long-term goals, so starting one is a single tap. */
const GOAL_PRESETS: Array<{ title: string; description: string; timeframe: GoalTimeframe; target: number; unit: string; icon: string }> = [
  { title: 'Read 12 books', description: 'About one book a month.', timeframe: 'yearly', target: 12, unit: 'books', icon: '📚' },
  { title: 'Run 100 km', description: 'Add every run until you hit 100.', timeframe: 'yearly', target: 100, unit: 'km', icon: '🏃' },
  { title: 'Learn 500 new words', description: 'In a language you want to speak.', timeframe: 'yearly', target: 500, unit: 'words', icon: '🗣' },
  { title: '50 gym sessions', description: 'Roughly one a week for a year.', timeframe: 'yearly', target: 50, unit: 'sessions', icon: '🏋' },
  { title: 'Save my first 1,000', description: 'Count each 10 you put aside.', timeframe: 'yearly', target: 100, unit: 'x 10 saved', icon: '💰' },
  { title: '30 days without junk food', description: 'Days in a row or not, every clean day counts.', timeframe: 'monthly', target: 30, unit: 'days', icon: '🥦' },
  { title: 'Learn a song on guitar', description: 'Practice sessions until you can play it.', timeframe: 'monthly', target: 20, unit: 'practices', icon: '🎸' },
  { title: 'Cook 20 new meals', description: 'Recipes you have never made before.', timeframe: 'yearly', target: 20, unit: 'meals', icon: '🍳' },
  { title: 'Finish an online course', description: 'Count each lesson you complete.', timeframe: 'custom', target: 30, unit: 'lessons', icon: '🎓' },
  { title: 'Meditate 100 days', description: 'Build a real calm-mind habit.', timeframe: 'yearly', target: 100, unit: 'days', icon: '🧘' },
  { title: 'Build a side project', description: 'Hours spent making your own thing.', timeframe: 'custom', target: 100, unit: 'hours', icon: '💻' },
  { title: 'Make 10 new friends', description: 'Real chats with new people.', timeframe: 'yearly', target: 10, unit: 'friends', icon: '🤝' },
  { title: 'Cycle 500 km', description: 'Every ride adds up.', timeframe: 'yearly', target: 500, unit: 'km', icon: '🚲' },
  { title: 'Visit 3 new places', description: 'Cities, towns or countries you have never been to.', timeframe: 'yearly', target: 3, unit: 'places', icon: '✈' },
];

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
    progress?: number;
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
  const [progress, setProgress] = useState(initial?.progress ?? 0);

  // The modal stays mounted, so fill the form again every time it opens (a new goal or a
  // different one). Before, it kept the first goal's values and editing looked broken.
  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setTimeframe(initial?.timeframe ?? 'yearly');
    setTarget(initial?.target ?? 10);
    setUnit(initial?.unit ?? 'times');
    setIcon(initial?.icon ?? '🎯');
    setProgress(initial?.progress ?? 0);
  }, [open, initial]);

  const valid = !!title.trim() && target > 0 && Number.isFinite(target) && progress >= 0;

  function handleSubmit() {
    if (!valid) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      timeframe,
      target,
      unit: unit.trim() || 'times',
      icon,
      progress: Math.min(progress, target),
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Goal' : 'New Long-Term Goal'}>
      <div className="space-y-4">
        {!initial && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Pick one or make your own</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.title}
                  onClick={() => {
                    setTitle(p.title);
                    setDescription(p.description);
                    setTimeframe(p.timeframe);
                    setTarget(p.target);
                    setUnit(p.unit);
                    setIcon(p.icon);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    title === p.title ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-white/10 bg-white/5 text-slate-300'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        )}
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

        {initial && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Done so far</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={target}
                value={progress}
                onChange={(e) => setProgress(Math.max(0, Number(e.target.value) || 0))}
                className="flex-1 min-w-0 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white tabular-nums focus:outline-none focus:border-amber-400"
              />
              <span className="shrink-0 text-sm text-slate-400">of {target} {unit}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Timeframe</label>
          <div className="grid grid-cols-4 gap-2">
            {(['weekly', 'monthly', 'yearly', 'custom'] as GoalTimeframe[]).map((tf) => (
              <button
                type="button"
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
          disabled={!valid}
          className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 active:scale-95 transition-all"
        >
          {initial ? 'Save Changes' : 'Create Goal'}
        </button>
      </div>
    </Modal>
  );
}
