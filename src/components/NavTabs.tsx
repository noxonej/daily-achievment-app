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
  return (
    <nav className="sticky bottom-0 z-30 bg-[#0b0e17]/95 backdrop-blur border-t border-white/10">
      <div className="max-w-2xl mx-auto grid grid-cols-6">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-violet-300' : 'text-slate-500 hover:text-slate-300'
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
    </nav>
  );
}
