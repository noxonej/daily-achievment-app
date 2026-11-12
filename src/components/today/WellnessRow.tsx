import { useApp } from '../../store/AppContext';
import { breathe } from '../Breathe';
import { sleepTool } from '../SleepTool';
import { focusTimer } from '../../lib/focusTimer';
import { runTracker } from '../../lib/runTracker';
import { Icon } from '../Icon';
import { t } from '../../lib/prefs';

/**
 * "Recharge": big, colourful shortcuts to the wellness tools (Breathe, Sleep, Focus, Run),
 * so they're one tap away near the top of Today instead of tiny buttons further down.
 */
export function WellnessRow() {
  const { state } = useApp();
  const hour = new Date().getHours();
  const night = hour >= 20 || hour < 5;
  const bed = state.profile?.bedTime;
  const tiles = [
    { id: 'breathe', icon: '🌬', title: 'Breathe', sub: '1 min calm', from: '#22d3ee', to: '#0e7490', on: () => breathe.open() },
    { id: 'sleep', icon: '🌙', title: 'Sleep', sub: night ? 'Wind down' : bed ? `Bed ${bed}` : 'Plan sleep', from: '#818cf8', to: '#3730a3', on: () => sleepTool.open() },
    { id: 'focus', icon: '⏱', title: t('now.focus'), sub: '25 min', from: '#60a5fa', to: '#1d4ed8', on: () => focusTimer.open() },
    { id: 'run', icon: 'df:run', title: t('qa.run'), sub: 'GPS', from: '#2dd4bf', to: '#0f766e', on: () => runTracker.open() },
  ];
  // At night, Sleep goes first.
  if (night) tiles.unshift(tiles.splice(1, 1)[0]);
  return (
    <section aria-label="Recharge">
      <p className="eyebrow mb-2 px-1">Recharge</p>
      <div className="grid grid-cols-4 gap-2">
        {tiles.map((x, i) => (
          <button
            key={x.id}
            onClick={x.on}
            className="wellness-tile day-in relative overflow-hidden rounded-2xl px-1 py-2.5 pt-3 flex flex-col items-center text-center active:scale-95 transition-transform"
            style={{ ['--w1' as string]: x.from, ['--w2' as string]: x.to, animationDelay: `${0.05 * i}s` }}
          >
            <span className="wellness-icon w-10 h-10 rounded-2xl flex items-center justify-center text-white">
              <Icon name={x.icon} size={20} strokeWidth={2.2} />
            </span>
            <span className="mt-1.5 text-[11.5px] min-[360px]:text-[12.5px] font-semibold text-white leading-tight truncate max-w-full">{x.title}</span>
            <span className="text-[9.5px] min-[360px]:text-[10px] text-slate-400 leading-tight truncate max-w-full">{x.sub}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
