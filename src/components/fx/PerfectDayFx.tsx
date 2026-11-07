import { useEffect, useRef, useState } from 'react';
import { Confetti } from '../Confetti';
import { Icon } from '../Icon';

/** Full-screen moment when the last daily quest is done: light rays, a slam-in title and confetti. */
export function PerfectDayFx({ onDone }: { onDone: () => void }) {
  const [out, setOut] = useState(false);
  // Keep the latest callback without restarting the timers on every re-render.
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    try {
      navigator.vibrate?.([20, 40, 20, 40, 80]);
    } catch {
      // optional
    }
    const a = setTimeout(() => setOut(true), 2100);
    const b = setTimeout(() => done.current(), 2500);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  return (
    <div className={`fixed inset-0 z-[65] flex items-center justify-center overflow-hidden pointer-events-none transition-opacity duration-300 ${out ? 'opacity-0' : ''}`} aria-live="polite">
      <div className="absolute inset-0 bg-[#04060a]/85 backdrop-in" />
      <div className="absolute inset-0 fx-flash" />
      <div className="absolute w-[160vmax] h-[160vmax] fx-rays" />
      <Confetti count={110} />
      <div className="relative text-center fx-slam">
        <span className="absolute left-1/2 top-1/2 w-0 h-0">
          <span className="fx-shock" />
          <span className="fx-shock fx-shock-2" />
        </span>
        <Icon name="✨" size={54} className="mx-auto text-emerald-200 drop-shadow-[0_0_24px_rgba(52,211,153,0.9)]" />
        <p className="font-display text-[44px] leading-none font-black tracking-tight text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.6)] mt-2">
          PERFECT
          <br />
          DAY
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 border border-white/20 px-3 py-1 text-sm font-bold text-amber-200">
          <Icon name="df:chest" size={15} /> +1 reward chest
        </p>
      </div>
    </div>
  );
}
