import { useEffect, useState } from 'react';
import { useNoDoubleTap } from '../lib/noDoubleTap';
import { useBackToClose } from '../lib/backstack';
import { useApp } from '../store/AppContext';
import { formatDuration, formatPace, runTracker, useElapsedMs, useRunState, type GpsQuality } from '../lib/runTracker';
import { Icon } from './Icon';

const GPS_LABEL: Record<GpsQuality, { text: string; color: string }> = {
  none: { text: 'GPS off', color: 'bg-slate-500' },
  searching: { text: 'Finding GPS…', color: 'bg-amber-400 animate-pulse' },
  weak: { text: 'Weak GPS', color: 'bg-orange-400' },
  good: { text: 'GPS ready', color: 'bg-emerald-400' },
  denied: { text: 'Location blocked', color: 'bg-rose-500' },
  unsupported: { text: 'No GPS on this device', color: 'bg-rose-500' },
};

/** Full-screen run tracker: live distance, time and pace from GPS, or add a run by hand. */
export function RunTracker() {
  const { dispatch } = useApp();
  const s = useRunState();
  useBackToClose(s.open, () => runTracker.close());
  const noDoubleTap = useNoDoubleTap();
  const elapsed = useElapsedMs(s);
  const [manual, setManual] = useState(false);
  const [km, setKm] = useState('');
  const [mins, setMins] = useState('');

  useEffect(() => {
    runTracker.resumeAfterReload();
  }, []);

  if (!s.open) {
    if (s.status !== 'running' && s.status !== 'paused') return null;
    return (
      <button
        onClick={() => runTracker.open()}
        className="fixed z-40 left-1/2 -translate-x-1/2 bottom-[calc(8rem+env(safe-area-inset-bottom))] flex items-center gap-2 rounded-full bg-raised/95 border border-emerald-400/40 shadow-xl px-4 py-2 animate-pop-in"
      >
        <span className={`w-2 h-2 rounded-full ${s.status === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
        <Icon name="🏃" size={16} className="text-emerald-300" />
        <span className="text-sm font-bold text-white tabular-nums">{(s.distanceM / 1000).toFixed(2)} km</span>
        <span className="text-xs text-slate-400 tabular-nums">{formatDuration(elapsed)}</span>
      </button>
    );
  }

  const km2 = s.distanceM / 1000;
  const gps = GPS_LABEL[s.gps];
  const manualKm = Number(km.replace(',', '.'));
  const manualOk = manualKm > 0 && manualKm < 200;

  function save() {
    if (km2 > 0.01) dispatch({ type: 'ADD_RUN', km: km2, seconds: elapsed / 1000, source: 'gps' });
    runTracker.reset();
    runTracker.close();
  }

  return (
    <div data-overlay onClickCapture={noDoubleTap} className="fixed inset-0 z-[70] bg-canvas flex flex-col backdrop-in">
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Run</p>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${gps.color}`} />
            {gps.text}
          </p>
        </div>
        <button onClick={() => runTracker.close()} aria-label={s.status === 'running' ? 'Minimize' : 'Close'} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10">
          <Icon name="✕" size={20} />
        </button>
      </div>

      {manual ? (
        <div className="flex-1 flex flex-col justify-center px-6 max-w-sm w-full mx-auto sheet-in">
          <h2 className="font-display text-2xl font-extrabold text-white">Add a run</h2>
          <p className="text-sm text-slate-400 mt-1">Treadmill, a run without your phone, or one you forgot to track.</p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <label className="block">
              <span className="text-sm font-semibold text-slate-300">Distance (km)</span>
              <input autoFocus inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} placeholder="3.0" className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-3 h-12 text-lg text-white focus:outline-none focus:border-emerald-400/60" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-300">Time (min)</span>
              <input inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value.replace(/\D/g, ''))} placeholder="20" className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-3 h-12 text-lg text-white focus:outline-none focus:border-emerald-400/60" />
            </label>
          </div>
          <button
            disabled={!manualOk}
            onClick={() => {
              dispatch({ type: 'ADD_RUN', km: manualKm, seconds: (Number(mins) || 0) * 60, source: 'manual' });
              setKm('');
              setMins('');
              setManual(false);
              runTracker.close();
            }}
            className="mt-6 w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-bold py-3.5"
          >
            Save run
          </button>
          <button onClick={() => setManual(false)} className="mt-2 py-2 text-sm font-semibold text-slate-400">
            Back to GPS tracking
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6 sheet-in">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Distance</p>
          <p className="font-display text-8xl font-extrabold text-white tabular-nums tracking-tight leading-none mt-2">{km2.toFixed(2)}</p>
          <p className="text-lg font-bold text-emerald-300">km</p>
          <div className="grid grid-cols-2 gap-3 mt-10 w-full max-w-xs">
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 py-3 text-center">
              <p className="font-display text-2xl font-bold text-white tabular-nums">{formatDuration(elapsed)}</p>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mt-0.5">Time</p>
            </div>
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 py-3 text-center">
              <p className="font-display text-2xl font-bold text-white tabular-nums">{formatPace(elapsed, s.distanceM)}</p>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mt-0.5">Pace / km</p>
            </div>
          </div>

          {s.status === 'finished' ? (
            <div className="mt-10 w-full max-w-xs space-y-2">
              <button onClick={save} disabled={km2 <= 0.01} className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-bold py-3.5">
                {km2 > 0.01 ? `Save ${km2.toFixed(2)} km run` : 'No distance recorded'}
              </button>
              <button onClick={() => runTracker.reset()} className="w-full py-2 text-sm font-semibold text-slate-400">
                Discard
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-10">
              {s.status !== 'idle' && (
                <button onClick={() => runTracker.finish()} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold">
                  Finish
                </button>
              )}
              <button
                onClick={() => (s.status === 'running' ? runTracker.pause() : s.status === 'paused' ? runTracker.resume() : runTracker.start())}
                disabled={s.gps === 'unsupported' || s.gps === 'denied'}
                aria-label={s.status === 'running' ? 'Pause' : s.status === 'paused' ? 'Resume' : 'Start run'}
                className="w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 text-white flex items-center justify-center shadow-[0_12px_32px_-8px_rgba(16,185,129,0.7)]"
              >
                <Icon name={s.status === 'running' ? '⏸' : '▶'} size={32} fill="currentColor" />
              </button>
            </div>
          )}

          <p className="text-xs text-slate-500 mt-6 text-center max-w-xs">
            {s.gps === 'denied'
              ? 'Allow location for this app in your phone settings to track runs, or add one by hand.'
              : s.gps === 'unsupported'
                ? "This device can't track location. You can still add runs by hand."
                : 'Keep the app open while you run. Your screen stays on so the GPS keeps tracking.'}
          </p>
          {s.status === 'idle' && (
            <button onClick={() => setManual(true)} className="mt-3 text-sm font-semibold text-emerald-300">
              Add a run by hand instead
            </button>
          )}
        </div>
      )}
    </div>
  );
}
