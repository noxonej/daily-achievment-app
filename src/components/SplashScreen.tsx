import { useEffect, useState } from 'react';
import { Logo, Wordmark } from './Logo';

const SEEN_KEY = 'quest-log-splash-seen';

function shouldShow(): boolean {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return sessionStorage.getItem(SEEN_KEY) !== '1';
  } catch {
    return true;
  }
}

/** Short animated logo intro, once per app launch (not on every tab or reload within a session). */
export function SplashScreen() {
  const [phase, setPhase] = useState<'show' | 'leaving' | 'gone'>(() => (shouldShow() ? 'show' : 'gone'));

  useEffect(() => {
    if (phase === 'gone') return;
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // storage blocked; the splash just shows again next launch
    }
    const leave = setTimeout(() => setPhase('leaving'), 1350);
    const gone = setTimeout(() => setPhase('gone'), 1700);
    return () => {
      clearTimeout(leave);
      clearTimeout(gone);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'gone') return null;
  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-canvas ${phase === 'leaving' ? 'splash-out' : ''}`}
      onClick={() => setPhase('gone')}
      aria-hidden="true"
    >
      <div className="absolute w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />
      <Logo size={88} animated className="relative drop-shadow-[0_12px_32px_rgba(245,158,11,0.35)]" />
      <Wordmark className="relative text-2xl mt-5 fade-up [animation-delay:0.55s]" />
      <p className="relative text-xs text-slate-500 mt-1.5 fade-up [animation-delay:0.75s]">Plan it. Do it. Level up.</p>
    </div>
  );
}
