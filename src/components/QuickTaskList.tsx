import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { todayKey } from '../lib/date';

export function QuickTaskList() {
  const { state, dispatch } = useApp();
  const [text, setText] = useState('');
  const tasks = state.dayLogs[todayKey()]?.quickTasks ?? [];

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    dispatch({ type: 'ADD_QUICK_TASK', text: trimmed });
    setText('');
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white mb-3">📋 Quick Tasks</p>

      {tasks.length > 0 && (
        <div className="space-y-2 mb-3">
          {tasks.map((t) => (
            <div
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => dispatch({ type: 'TOGGLE_QUICK_TASK', taskId: t.id })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') dispatch({ type: 'TOGGLE_QUICK_TASK', taskId: t.id });
              }}
              className="flex items-center gap-2.5 cursor-pointer -mx-1 px-1 py-0.5 rounded-lg hover:bg-white/5 transition"
            >
              <span
                className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center text-xs transition ${
                  t.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'
                }`}
              >
                {t.done && '✓'}
              </span>
              <span className={`flex-1 text-sm ${t.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                {t.text}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'DELETE_QUICK_TASK', taskId: t.id });
                }}
                className="shrink-0 text-slate-500 hover:text-red-400 text-xs px-1"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {tasks.length === 0 && (
        <p className="text-xs text-slate-500 mb-3">Odd little to-dos that don't deserve a full quest.</p>
      )}

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="Add a quick task…"
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="shrink-0 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-30 text-white text-sm font-semibold px-3.5 transition"
        >
          Add
        </button>
      </div>
    </div>
  );
}
