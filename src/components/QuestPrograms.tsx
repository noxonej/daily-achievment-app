import { useApp } from '../store/AppContext';
import { weekKey } from '../lib/date';
import { shortNum } from '../lib/num';
import { Icon } from './Icon';
import { byPriority } from '../lib/goalCoach';

/** Each card gets its own glow so a row of them never looks repeated. */
const GLOWS = [
  { core: '#67e8f9', mid: '#0e7490' },
  { core: '#93c5fd', mid: '#1d4ed8' },
  { core: '#5eead4', mid: '#0f766e' },
  { core: '#a5b4fc', mid: '#4338ca' },
];

interface Program {
  id: string;
  title: string;
  value: number;
  target: number;
  sub: string;
  onOpen: () => void;
}

/**
 * The top of Quests: this week and your long-term goals as glowing cards you swipe through.
 * The glow fills up as the card's progress does.
 */
export function QuestPrograms({ onOpen }: { onOpen: (section: 'weekly' | 'goals') => void }) {
  const { state } = useApp();
  const key = weekKey();
  const weekly = state.quests.filter((q) => q.frequency === 'weekly' && !q.archived && q.wildcardWeekKey !== key);
  const doneWeekly = weekly.filter((q) => state.weekLogs[key]?.completedQuestIds.includes(q.id)).length;
  const goals = state.goals.filter((g) => !g.completedAt).sort(byPriority);

  const programs: Program[] = [
    // Yearly goals lead: they are the big dreams.
    ...goals.map((g) => ({ id: g.id, title: g.title, value: g.progress, target: Math.max(g.target, 1), sub: g.timeframe === 'yearly' ? `${g.unit} · this year` : g.unit, onOpen: () => onOpen('goals') })),
    { id: 'week', title: 'This week', value: doneWeekly, target: Math.max(weekly.length, 1), sub: weekly.length ? 'weekly quests' : 'no weekly quests yet', onOpen: () => onOpen('weekly') },
  ];

  return (
    <div className="-mx-4 px-4 overflow-x-auto no-scrollbar snap-x snap-mandatory" aria-label="Your programs">
      <div className="flex gap-3 w-max pb-1">
        {programs.map((p, i) => {
          const glow = GLOWS[i % GLOWS.length];
          const frac = Math.min(1, p.value / p.target);
          return (
            <button
              key={p.id}
              onClick={p.onOpen}
              className="program-card theme-dark day-in snap-start relative overflow-hidden shrink-0 w-[164px] h-[206px] rounded-[28px] p-4 text-left transition-transform active:scale-[0.97]"
              style={{ animationDelay: `${0.06 + i * 0.06}s`, ['--core' as string]: glow.core, ['--mid' as string]: glow.mid }}
            >
              {/* the glowing shape grows with progress */}
              <span
                className="blob absolute left-1/2 rounded-full"
                aria-hidden="true"
                style={{
                  width: 150,
                  height: 150,
                  bottom: -70 + frac * 60,
                  marginLeft: -75,
                  background: 'radial-gradient(circle at 50% 40%, var(--core) 0%, var(--mid) 55%, transparent 72%)',
                  filter: 'blur(14px)',
                  animationDelay: `${-i * 2.3}s`,
                  transition: 'bottom 1s cubic-bezier(.22,1,.36,1)',
                }}
              />
              <span className="relative flex items-start gap-2">
                <span className="flex-1 min-w-0 text-[15px] font-semibold leading-snug text-white line-clamp-2">{p.title}</span>
                <span className="shrink-0 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white">
                  <Icon name="›" size={16} />
                </span>
              </span>
              <span className="absolute left-4 bottom-4 right-4">
                <span className="block num-thin text-[40px] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,.35)]">
                  {shortNum(p.value)}
                  <span className="text-[20px] text-white/70">/{shortNum(p.target)}</span>
                </span>
                <span className="block mt-1 text-[11px] font-semibold text-white/75 truncate">{p.sub}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
