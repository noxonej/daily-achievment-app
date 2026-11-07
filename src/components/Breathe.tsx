import { useEffect, useState, useSyncExternalStore } from 'react';
import { useBackToClose } from '../lib/backstack';
import { useApp } from '../store/AppContext';
import { todayKey } from '../lib/date';
import { Icon } from './Icon';

/* A short guided breathing session (like the calm apps): breathe in 4s, hold 4s, out 6s. */
let isOpen = false;
const listeners = new Set<() => void>();
export const breathe = {
  open() {
    isOpen = true;
    listeners.forEach((l) => l());
  },
  close() {
    isOpen = false;
    listeners.forEach((l) => l());
  },
};
function useOpen() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => isOpen,
  );
}

const PHASES = [
  { label: 'Breathe in', secs: 4, scale: 1 },
  { label: 'Hold', secs: 4, scale: 1 },
  { label: 'Breathe out', secs: 6, scale: 0.55 },
] as const;
const CYCLE = PHASES.reduce((n, p) => n + p.secs, 0);
const LENGTHS = [1, 3, 5];

export function BreatheOverlay() {
  const open = useOpen();
  if (!open) return null;
  return <Session />;
}

function Session() {
  const { state, dispatch } = useApp();
  const [minutes, setMinutes] = useState(1);
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  useBackToClose(true, () => breathe.close());

  useEffect(() => {
    if (start === null || finished) return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [start, finished]);

  const elapsed = start === null ? 0 : (now - start) / 1000;
  const total = minutes * 60;
  const inCycle = elapsed % CYCLE;
  let acc = 0;
  let phase: (typeof PHASES)[number] = PHASES[0];
  let left: number = PHASES[0].secs;
  for (const p of PHASES) {
    if (inCycle < acc + p.secs) {
      phase = p;
      left = Math.ceil(acc + p.secs - inCycle);
      break;
    }
    acc += p.secs;
  }

  useEffect(() => {
    if (start === null || finished || elapsed < total) return;
    setFinished(true);
    dispatch({ type: 'ADD_FOCUS_MINUTES', date: todayKey(), minutes });
    // A breathing or meditation quest counts as done.
    const today = todayKey();
    const done = state.dayLogs[today]?.completedQuestIds ?? [];
    const q = state.quests.find((x) => !x.archived && x.frequency === 'daily' && !x.measure && !x.promptForNote && /breath|meditat|mindful|calm/i.test(x.title) && !done.includes(x.id));
    if (q) dispatch({ type: 'TOGGLE_QUEST', questId: q.id });
    try {
      navigator.vibrate?.([40, 60, 40]);
    } catch {
      // optional
    }
  }, [elapsed, total, start, finished, minutes, dispatch, state.dayLogs, state.quests]);

  // The circle grows while breathing in, stays while holding, and shrinks while breathing out.
  const scale = start === null ? 0.7 : phase.label === 'Breathe out' ? 0.55 : 1;
  const dur = start === null ? 0.6 : phase.secs;

  return (
    <div data-overlay role="dialog" aria-label="Breathe" className="theme-dark fixed inset-0 z-[75] flex flex-col items-center justify-center bg-[#06121a] px-6 backdrop-in">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_45%_at_50%_45%,rgba(45,212,191,0.18),transparent_70%)]" />
      <button onClick={() => breathe.close()} aria-label="Close" className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:bg-white/10">
        <Icon name="✕" size={20} />
      </button>

      <div className="relative w-64 h-64 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-teal-300/15" />
        <div
          className="absolute inset-4 rounded-full bg-gradient-to-br from-teal-300/70 to-sky-500/60 shadow-[0_0_80px_-10px_rgba(45,212,191,0.7)]"
          style={{ transform: `scale(${finished ? 0.8 : scale})`, transition: `transform ${dur}s ease-in-out` }}
        />
        <div className="relative text-center">
          {finished ? (
            <>
              <Icon name="✓" size={40} strokeWidth={3} className="mx-auto text-white" />
              <p className="font-display text-xl font-bold text-white mt-1">Well done</p>
            </>
          ) : start === null ? (
            <p className="font-display text-2xl font-bold text-white">Ready?</p>
          ) : (
            <>
              <p className="font-display text-2xl font-bold text-white">{phase.label}</p>
              <p className="font-display text-4xl font-extrabold text-white/90 tabular-nums mt-1">{left}</p>
            </>
          )}
        </div>
      </div>

      {start === null && !finished && (
        <>
          <p className="relative mt-8 text-center text-sm text-teal-100/70 max-w-xs">In for 4, hold for 4, out for 6. Slow breathing calms your body down in about a minute.</p>
          <div className="relative mt-5 flex gap-2" role="radiogroup" aria-label="Length">
            {LENGTHS.map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={minutes === m}
                onClick={() => setMinutes(m)}
                className={`rounded-full px-4 py-2 text-sm font-bold border ${minutes === m ? 'bg-teal-400/20 border-teal-300 text-white' : 'border-white/15 text-slate-300'}`}
              >
                {m} min
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setStart(Date.now());
              setNow(Date.now());
            }}
            className="relative mt-6 w-full max-w-xs rounded-2xl bg-gradient-to-b from-teal-400 to-teal-600 text-white font-display text-lg font-bold py-4"
          >
            Start
          </button>
        </>
      )}

      {start !== null && !finished && (
        <>
          <div className="relative mt-10 w-full max-w-xs h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-teal-300 transition-[width] duration-200" style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }} />
          </div>
          <button onClick={() => breathe.close()} className="relative mt-6 text-sm font-semibold text-slate-400">
            Stop
          </button>
        </>
      )}

      {finished && (
        <>
          <p className="relative mt-8 text-center text-sm text-teal-100/80 max-w-xs">
            {minutes} calm {minutes === 1 ? 'minute' : 'minutes'} added to your focus time. Use this before tests, sleep, or when you feel stressed.
          </p>
          <button onClick={() => breathe.close()} className="relative mt-6 w-full max-w-xs rounded-2xl bg-white/10 border border-white/15 text-white font-bold py-3.5">
            Done
          </button>
        </>
      )}
    </div>
  );
}
