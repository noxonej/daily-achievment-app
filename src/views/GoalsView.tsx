import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ProgressBar } from '../components/ProgressBar';
import { GoalFormModal } from '../components/GoalFormModal';
import type { LongTermGoal } from '../lib/types';

const TIMEFRAME_LABEL: Record<string, string> = {
  weekly: 'This Week',
  monthly: 'This Month',
  yearly: 'This Year',
  custom: 'Custom',
};

export function GoalsView() {
  const { state, dispatch } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LongTermGoal | null>(null);

  const active = state.goals.filter((g) => !g.completedAt);
  const completed = state.goals.filter((g) => !!g.completedAt);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(g: LongTermGoal) {
    setEditing(g);
    setModalOpen(true);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">Dreams in progress</p>
          <h1 className="font-display text-2xl font-bold text-white mt-0.5">Long-Term Goals</h1>
        </div>
        <button
          onClick={openAdd}
          className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm px-3.5 py-2 transition"
        >
          + Add
        </button>
      </div>

      {active.length === 0 && completed.length === 0 && (
        <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
          <p className="text-3xl mb-2">🏆</p>
          <p className="text-white font-semibold mb-1">No goals yet</p>
          <p className="text-slate-400 text-sm mb-4 px-6">
            Set something big to work toward across weeks, months, or the year.
          </p>
          <button
            onClick={openAdd}
            className="rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm px-4 py-2 transition"
          >
            Set a goal
          </button>
        </div>
      )}

      <div className="space-y-3">
        {active.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            onAdjust={(delta) => dispatch({ type: 'ADJUST_GOAL_PROGRESS', goalId: g.id, delta })}
            onEdit={() => openEdit(g)}
            onDelete={() => dispatch({ type: 'DELETE_GOAL', goalId: g.id })}
          />
        ))}
      </div>

      {completed.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 mt-6">
            Completed ({completed.length})
          </p>
          <div className="space-y-2">
            {completed.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"
              >
                <span className="text-xl">{g.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-emerald-200 truncate">{g.title}</span>
                  <span className="block text-xs text-slate-400">
                    {g.target} {g.unit} · completed
                  </span>
                </span>
                <span className="text-lg">🏆</span>
                <button
                  onClick={() => dispatch({ type: 'DELETE_GOAL', goalId: g.id })}
                  className="text-slate-500 hover:text-red-400 text-sm px-1"
                  aria-label="Delete goal"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <GoalFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing ?? undefined}
        onSubmit={(data) => {
          if (editing) {
            dispatch({ type: 'UPDATE_GOAL', goalId: editing.id, updates: data });
          } else {
            dispatch({ type: 'ADD_GOAL', goal: data });
          }
        }}
      />
    </div>
  );
}

function GoalCard({
  goal,
  onAdjust,
  onEdit,
  onDelete,
}: {
  goal: LongTermGoal;
  onAdjust: (delta: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{goal.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white text-[15px]">{goal.title}</p>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
              {TIMEFRAME_LABEL[goal.timeframe]}
            </span>
          </div>
          {goal.description && <p className="text-xs text-slate-400 mt-0.5">{goal.description}</p>}
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <button onClick={onEdit} className="text-slate-500 hover:text-white text-sm p-1" aria-label="Edit goal">
            ✎
          </button>
          <button onClick={onDelete} className="text-slate-500 hover:text-red-400 text-sm p-1" aria-label="Delete goal">
            ✕
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-400">
            {goal.progress} / {goal.target} {goal.unit}
          </span>
          <span className="text-xs font-semibold text-amber-300">
            {Math.round((goal.progress / goal.target) * 100)}%
          </span>
        </div>
        <ProgressBar value={goal.progress} max={goal.target} />
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={() => onAdjust(-1)}
          disabled={goal.progress <= 0}
          aria-label={`Decrease progress on ${goal.title}`}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 text-white font-bold transition"
        >
          −
        </button>
        <button
          onClick={() => onAdjust(1)}
          aria-label={`Increase progress on ${goal.title}`}
          className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-200 font-bold transition"
        >
          +
        </button>
      </div>
    </div>
  );
}
