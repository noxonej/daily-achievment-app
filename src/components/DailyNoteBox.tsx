import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { todayKey } from '../lib/date';

export function DailyNoteBox() {
  const { state, dispatch } = useApp();
  const stored = state.dayLogs[todayKey()]?.freeNote ?? '';
  const [text, setText] = useState(stored);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(stored);
  }, [stored]);

  function handleChange(value: string) {
    setText(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => dispatch({ type: 'SET_FREE_NOTE', note: value }), 500);
  }

  function handleBlur() {
    if (timerRef.current) clearTimeout(timerRef.current);
    dispatch({ type: 'SET_FREE_NOTE', note: text });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white mb-2.5">📓 Today's Note</p>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        rows={3}
        placeholder="Anything on your mind — no quest attached, just a note to your future self."
        className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 resize-none"
      />
    </div>
  );
}
