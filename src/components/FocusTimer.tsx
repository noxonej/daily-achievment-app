import { useEffect, useRef } from 'react';
import { useBackToClose } from '../lib/backstack';
import { useApp } from '../store/AppContext';
import { todayKey } from '../lib/date';
import { focusTimer, formatClock, playChime, useFocusState, useTimeLeft } from '../lib/focusTimer';
import { showSystemNotification } from '../lib/notify';
import { Icon } from './Icon';

const PRESETS = [15, 25, 45, 60];
const R = 118;
const C = 2 * Math.PI * R;

/** Full-screen focus timer plus a small pill above the nav bar while it runs in the background. */
export function FocusTimer() {
  const { state, dispatch } = useApp();
  const s = useFocusState();
  useBackToClose(s.open, () => focusTimer.close());
  const left = useTimeLeft(s);
  const running = s.endAt !== null;
  const paused = s.pausedLeftMs !== null;
  const idle = !running && !paused;
  const total = s.durationMin * 60000;
  const progress = idle ? 0 : 1 - left / total;
  const finishing = useRef(false);

  // Finish exactly once when the clock hits zero (also catches up after the app was in the background).
  useEffect(() => {
    if (!running || left > 0 || finishing.current) return;
    finishing.current = true;
    focusTimer.finish();
    dispatch({ type: 'ADD_FOCUS_MINUTES', date: todayKey(), minutes: s.durationMin });
    playChime();
    try {
      navigator.vibrate?.([200, 100, 200, 100, 300]);
    } catch {
      // no vibration support
    }
    showSystemNotification('Focus session complete', `${s.durationMin} minutes${s.label ? ` · ${s.label}` : ''}. Take a short break.`);
    setTimeout(() => (finishing.current = false), 500);
  }, [running, left, s.durationMin, s.label, dispatch]);

  const todayMinutes = state.focusMinutes?.[todayKey()] ?? 0;

  if (!s.open) {
    if (idle && !s.finishedAt) return null;
    return (
      <button
        onClick={() => focusTimer.open()}
        className="fixed z-40 left-1/2 -translate-x-1/2 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] flex items-center gap-2 rounded-full bg-raised/95 border border-amber-400/40 shadow-xl px-4 py-2 animate-pop-in"
      >
        <span className={`w-2 h-2 rounded-full ${running ? 'bg-emerald-400 animate-pulse' : s.finishedAt ? 'bg-amber-400' : 'bg-slate-400'}`} />
        <Icon name="⏱" size={16} className="text-amber-300" />
        <span className="text-sm font-bold text-white tabular-nums">{s.finishedAt ? 'Done!' : formatClock(left)}</span>
        {s.label && <span className="text-xs text-slate-400 max-w-[9rem] truncate">{s.label}</span>}
      </button>
    );
  }

  return (
    <div data-overlay className="fixed inset-0 z-[70] bg-canvas flex flex-col backdrop-in">
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Focus</p>
          <p className="text-xs text-slate-500">{todayMinutes} min focused today</p>
        </div>
        <button
          onClick={() => focusTimer.close()}
          aria-label={idle ? 'Close' : 'Minimize'}
          className="w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10"
        >
          <Icon name="✕" size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 sheet-in">
        {s.finishedAt ? (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center animate-pop-in">
              <Icon name="✅" size={48} />
            </div>
            <h2 className="font-display text-3xl font-extrabold text-white mt-5">Nice work!</h2>
            <p className="text-slate-400 mt-2">
              {s.durationMin} minutes of focus{s.label ? ` on "${s.label}"` : ''}. Stand up, drink water, rest your eyes for 5 minutes.
            </p>
            <div className="flex gap-2.5 mt-8 justify-center">
              <button
                onClick={() => {
                  focusTimer.acknowledge();
                  focusTimer.close();
                }}
                className="rounded-2xl bg-white/5 border border-white/10 text-white font-semibold px-5 py-3"
              >
                Done
              </button>
              <button
                onClick={() => {
                  focusTimer.acknowledge();
                  focusTimer.start();
                }}
                className="rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-3"
              >
                Another round
              </button>
            </div>
          </div>
        ) : (
          <>
            <input
              value={s.label}
              onChange={(e) => focusTimer.setLabel(e.target.value)}
              placeholder="What are you focusing on?"
              maxLength={60}
              className="w-full max-w-xs text-center bg-transparent border-b border-white/10 focus:border-amber-400/60 text-lg text-white placeholder:text-slate-600 py-2 mb-8 focus:outline-none"
            />
            <div className="relative" style={{ width: 272, height: 272 }}>
              <svg viewBox="0 0 272 272" className="w-full h-full -rotate-90">
                <circle cx="136" cy="136" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
                <circle
                  cx="136"
                  cy="136"
                  r={R}
                  fill="none"
                  stroke="url(#focusGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${C * progress} ${C}`}
                  opacity={progress > 0 ? 1 : 0}
                  style={{ transition: 'stroke-dasharray 0.3s linear' }}
                />
                <defs>
                  <linearGradient id="focusGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#fbbf24" />
                    <stop offset="1" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-6xl font-extrabold text-white tabular-nums tracking-tight">{formatClock(left)}</span>
                <span className="text-sm text-slate-400 mt-1">{running ? 'Stay with it' : paused ? 'Paused' : `${s.durationMin} min session`}</span>
              </div>
            </div>

            {idle && (
              <div className="flex gap-2 mt-8">
                {PRESETS.map((m) => (
                  <button
                    key={m}
                    onClick={() => focusTimer.setDuration(m)}
                    aria-pressed={s.durationMin === m}
                    className={`w-16 rounded-xl border py-2 text-sm font-bold transition ${
                      s.durationMin === m ? 'bg-amber-500/15 border-amber-400 text-amber-200' : 'border-white/10 text-slate-300'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mt-8">
              {!idle && (
                <button
                  onClick={() => {
                    const mins = focusTimer.stop();
                    if (mins > 0) dispatch({ type: 'ADD_FOCUS_MINUTES', date: todayKey(), minutes: mins });
                  }}
                  aria-label="Stop"
                  className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"
                >
                  <Icon name="↺" size={22} />
                </button>
              )}
              <button
                onClick={() => (running ? focusTimer.pause() : paused ? focusTimer.resume() : focusTimer.start())}
                aria-label={running ? 'Pause' : paused ? 'Resume' : 'Start'}
                className="w-20 h-20 rounded-full bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center shadow-[0_12px_32px_-8px_rgba(245,158,11,0.7)]"
              >
                <Icon name={running ? '⏸' : '▶'} size={32} fill="currentColor" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-6 text-center max-w-xs">
              {idle ? 'Put your phone face down. You can leave the app; the timer keeps going.' : 'Stopping early still counts the minutes you did.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
