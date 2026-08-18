export type ViewId = 'today' | 'weekly' | 'goals' | 'achievements' | 'stats' | 'manage';

const TABS: Array<{ id: ViewId; label: string; icon: string }> = [
  { id: 'today', label: 'Today', icon: '☀️' },
  { id: 'weekly', label: 'Weekly', icon: '🗡️' },
  { id: 'goals', label: 'Goals', icon: '🏆' },
  { id: 'achievements', label: 'Badges', icon: '🎖️' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'manage', label: 'Manage', icon: '⚙️' },
];

interface NavTabsProps {
  active: ViewId;
  onChange: (v: ViewId) => void;
}

export function NavTabs({ active, onChange }: NavTabsProps) {
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === active));

  return (
    <nav className="sticky bottom-0 z-30 bg-[#0d0f19]/95 backdrop-blur border-t border-white/[0.06] shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.5)]">
      <div className="max-w-2xl mx-auto relative px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        <div
          className="absolute top-1.5 bottom-[max(0.375rem,env(safe-area-inset-bottom))] rounded-xl bg-amber-500/10 transition-transform duration-300 ease-out"
          style={{ width: `calc((100% - 0.75rem) / 6)`, transform: `translateX(calc(${activeIndex} * 100%))` }}
        />
        <div className="relative grid grid-cols-6">
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
                <span className={`text-lg leading-none ${isActive ? 'scale-110' : ''} transition-transform`}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
