import { useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Icon } from './Icon';
import { LevelUpScreen } from './LevelUpScreen';
import { useExit } from '../lib/useExit';

export function CelebrationOverlay() {
  const { celebrations, dismissCelebration } = useApp();
  // The toast and the level-up screen animate away (instead of vanishing) before the next one comes.
  const { shown: current, leaving } = useExit(celebrations[0], 320);

  useEffect(() => {
    if (!current || current.kind === 'levelup' || leaving) return;
    const t = setTimeout(() => dismissCelebration(), 2500);
    return () => clearTimeout(t);
  }, [current, leaving, dismissCelebration]);

  if (!current) return null;

  if (current.kind === 'levelup') {
    return <LevelUpScreen level={current.level} leaving={leaving} onClose={dismissCelebration} />;
  }

  return (
    <div className="fixed top-[calc(env(safe-area-inset-top)+60px+0.5rem)] left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none">
      <button
        onClick={dismissCelebration}
        className={`toast-glass pointer-events-auto flex ${leaving ? 'toast-out' : 'animate-celebrate'} items-center gap-3 rounded-full pl-2 pr-5 py-2 max-w-sm`}
      >
        <span className="shrink-0 w-10 h-10 rounded-full bg-amber-500 text-[#fff] flex items-center justify-center"><Icon name={current.icon} size={20} /></span>
        <span className="text-left min-w-0">
          <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400">
            {current.kind === 'goal' ? 'Goal Complete' : 'Achievement Unlocked'}
          </p>
          <p className="text-sm font-semibold text-white truncate">{current.title}</p>
        </span>
      </button>
    </div>
  );
}
