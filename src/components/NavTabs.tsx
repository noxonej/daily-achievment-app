import { Icon } from './Icon';
import { t } from '../lib/prefs';
import { Avatar } from './Avatar';
import { useApp } from '../store/AppContext';

export type ViewId = 'today' | 'plan' | 'money' | 'quests' | 'you';

const TABS: Array<{ id: ViewId; label: string; icon: string }> = [
  { id: 'today', label: 'Today', icon: 'df:today' },
  { id: 'plan', label: 'Plan', icon: 'df:plan' },
  { id: 'money', label: 'Money', icon: 'df:money' },
  { id: 'quests', label: 'Quests', icon: 'df:quests' },
  { id: 'you', label: 'You', icon: 'avatar' },
];

interface NavTabsProps {
  active: ViewId;
  onChange: (v: ViewId) => void;
}

export function NavTabs({ active, onChange }: NavTabsProps) {
  const { state, stats } = useApp();
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === active));

  return (
    <nav className="sticky bottom-0 z-30 bg-canvas/[0.97] border-t border-white/[0.06] shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.5)]">
      <div className="max-w-2xl mx-auto relative px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        <div
          className="absolute top-1.5 bottom-[max(0.375rem,env(safe-area-inset-bottom))] rounded-xl bg-amber-500/10 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ width: `calc((100% - 0.75rem) / ${TABS.length})`, transform: `translateX(calc(${activeIndex} * 100%))` }}
        />
        <div className="relative grid" style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}>
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-amber-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span key={isActive ? 'on' : 'off'} className={`leading-none ${isActive ? 'animate-nav-pop' : ''}`}>
                  {tab.icon === 'avatar' ? (
                    <span className={`relative block rounded-[8px] ring-2 ${isActive ? 'ring-amber-400' : 'ring-transparent'}`}>
                      <Avatar look={state.character} size={22} />
                      {stats.chestsAvailable > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-canvas" />
                      )}
                    </span>
                  ) : (
                    <Icon name={tab.icon} size={20} strokeWidth={isActive ? 2.3 : 1.9} />
                  )}
                </span>
                {t(`nav.${tab.id}` as 'nav.today')}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
