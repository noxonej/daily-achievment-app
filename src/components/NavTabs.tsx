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

/**
 * Floating tab bar. The open tab grows into a pill in that tab's own colour (its "mood") and shows
 * its name; the others are icons only, so five tabs never feel crowded.
 */
export function NavTabs({ active, onChange }: NavTabsProps) {
  const { state, stats } = useApp();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 pointer-events-none px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="dock pointer-events-auto max-w-md mx-auto h-[62px] p-[7px] flex items-stretch gap-1">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          const label = t(`nav.${tab.id}` as 'nav.today');
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              style={{ flexGrow: isActive ? 2.15 : 1 }}
              className={`relative min-w-0 basis-0 flex items-center justify-center gap-1.5 rounded-full transition-[flex-grow,background-color,color,box-shadow] duration-500 ease-[cubic-bezier(.34,1.4,.64,1)] ${
                isActive ? 'dock-pill text-[#15110e]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span key={isActive ? 'on' : 'off'} className={`shrink-0 leading-none ${isActive ? 'animate-nav-pop' : ''}`}>
                {tab.icon === 'avatar' ? (
                  <span className={`relative block rounded-[9px] ring-2 ${isActive ? 'ring-[#15110e]/25' : 'ring-transparent'}`}>
                    <Avatar look={state.character} size={24} />
                    {stats.chestsAvailable > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#181310]" />
                    )}
                  </span>
                ) : (
                  <Icon name={tab.icon} size={21} strokeWidth={isActive ? 2.3 : 1.9} />
                )}
              </span>
              {isActive && <span className="dock-label min-w-0 truncate text-[13px] font-bold tracking-tight">{label}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
