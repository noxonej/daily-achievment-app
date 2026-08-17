import { useApp } from '../store/AppContext';
import { todayKey, formatDisplayDate } from '../lib/date';
import { QuestCard } from '../components/QuestCard';
import { WildcardQuestCard } from '../components/WildcardQuestCard';
import { ProgressBar } from '../components/ProgressBar';
import type { ViewId } from '../components/NavTabs';

export function TodayView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { state, dispatch, stats } = useApp();
  const key = todayKey();
  const log = state.dayLogs[key];
  const completed = log?.completedQuestIds ?? [];
  const allActiveDaily = state.quests.filter((q) => q.frequency === 'daily' && !q.archived);
  const wildcard = allActiveDaily.find((q) => q.wildcardDate === key);
  const activeDaily = allActiveDaily.filter((q) => q.wildcardDate !== key);
  const doneCount = activeDaily.filter((q) => completed.includes(q.id)).length;
  const isPerfect = activeDaily.length > 0 && doneCount === activeDaily.length;

  const sorted = [...activeDaily].sort((a, b) => {
    const ac = completed.includes(a.id) ? 1 : 0;
    const bc = completed.includes(b.id) ? 1 : 0;
    return ac - bc;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
      <div>
        <p className="text-slate-400 text-sm">{formatDisplayDate(key)}</p>
        <h1 className="font-display text-2xl font-bold text-white mt-0.5">Today's Quests</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">
            {doneCount} / {activeDaily.length} complete
          </span>
          {isPerfect && (
            <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1">
              ✨ Perfect day
            </span>
          )}
        </div>
        <ProgressBar
          value={doneCount}
          max={Math.max(activeDaily.length, 1)}
          colorClass="bg-gradient-to-r from-emerald-500 to-teal-400"
        />
      </div>

      {wildcard && (
        <WildcardQuestCard
          quest={wildcard}
          completed={completed.includes(wildcard.id)}
          onToggle={() => dispatch({ type: 'TOGGLE_QUEST', questId: wildcard.id })}
        />
      )}

      {activeDaily.length === 0 ? (
        <EmptyState onNavigate={onNavigate} />
      ) : (
        <div className="space-y-2.5">
          {sorted.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              completed={completed.includes(quest.id)}
              onToggle={() => dispatch({ type: 'TOGGLE_QUEST', questId: quest.id })}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => onNavigate('weekly')}
        className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 px-4 py-3.5 text-left hover:border-white/20 transition"
      >
        <span className="flex items-center gap-3">
          <span className="text-xl">🗡️</span>
          <span>
            <span className="block text-sm font-semibold text-white">Weekly quests</span>
            <span className="block text-xs text-slate-400">Bigger goals, a whole week to finish</span>
          </span>
        </span>
        <span className="text-slate-400">→</span>
      </button>

      <div className="text-center text-xs text-slate-500 pt-1">
        Level {stats.level} · {stats.totalQuestsCompleted} quests completed all-time
      </div>
    </div>
  );
}

function EmptyState({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  return (
    <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
      <p className="text-3xl mb-2">🗺️</p>
      <p className="text-white font-semibold mb-1">No daily quests yet</p>
      <p className="text-slate-400 text-sm mb-4 px-6">Add one to start building your streak.</p>
      <button
        onClick={() => onNavigate('manage')}
        className="rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold text-sm px-4 py-2 transition"
      >
        Add a quest
      </button>
    </div>
  );
}
