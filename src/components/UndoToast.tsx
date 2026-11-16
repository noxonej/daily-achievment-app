import { useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Icon } from './Icon';
import { useExit } from '../lib/useExit';

const VISIBLE_MS = 5000;

export function UndoToast() {
  const { undoToast: live, undo, dismissUndo } = useApp();
  const { shown: undoToast, leaving } = useExit(live, 240);
  useEffect(() => {
    if (!live) return;
    const t = setTimeout(dismissUndo, VISIBLE_MS);
    return () => clearTimeout(t);
  }, [live, dismissUndo]);
  if (!undoToast) return null;
  return (
    <div className="fixed z-[65] inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] px-4 flex justify-center pointer-events-none">
      <div
        key={undoToast.id}
        role="status"
        className={`pointer-events-auto relative overflow-hidden flex items-center gap-3 rounded-2xl bg-raised border border-white/10 shadow-2xl pl-4 pr-2 py-2 max-w-sm w-full ${leaving ? 'toast-out-down' : 'toast-in-up'}`}
      >
        <span className="flex-1 text-sm text-slate-200 truncate">{undoToast.message}</span>
        <button onClick={undo} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-amber-300 hover:bg-white/5">
          <Icon name="↩" size={16} />
          Undo
        </button>
        <span className="absolute left-0 bottom-0 h-0.5 bg-amber-400/70 toast-timer" style={{ animationDuration: `${VISIBLE_MS}ms` }} />
      </div>
    </div>
  );
}
