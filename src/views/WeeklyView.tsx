import { useApp } from '../store/AppContext';
import { weekKey } from '../lib/date';
import { useWeeklyResetLabel } from '../lib/useResetCountdown';
import { QuestCard } from '../components/QuestCard';
import { NoteQuestCard } from '../components/NoteQuestCard';
import { WildcardQuestCard } from '../components/WildcardQuestCard';
import { ProgressBar } from '../components/ProgressBar';
import type { ViewId } from '../components/NavTabs';

export function WeeklyView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { state, dispatch } = useApp();
  const resetLabel = useWeeklyResetLabel();
  const key = weekKey();
  const log = state.weekLogs[key];
  const completed = log?.completedQuestIds ?? [];
  const notes = log?.notes ?? {};
  const allActiveWeekly = state.quests.filter((q) => q.frequency === 'weekly' && !q.archived);
  const wildcard = allActiveWeekly.find((q) => q.wildcardWeekKey === key);
  const activeWeekly = allActiveWeekly.filter((q) => q.wildcardWeekKey !== key);
  const doneCount = activeWeekly.filter((q) => completed.includes(q.id)).length;
  const isPerfect = activeWeekly.length > 0 && doneCount === activeWeekly.length;

  const sorted = [...activeWeekly].sort((a, b) => {
    const ac = completed.includes(a.id) ? 1 : 0;
    const bc = completed.includes(b.id) ? 1 : 0;
    return ac - bc;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
      <div>
        <p className="text-slate-400 text-sm">This week</p>
        <h1 className="font-display text-2xl font-bold text-white mt-0.5">Weekly Quests</h1>
        <p className="text-sm text-slate-400 mt-1">
          Bigger challenges — you've got until Sunday to finish these.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">
            {doneCount} / {activeWeekly.length} complete
          </span>
          {isPerfect && (
            <span className="text-xs font-bold text-sky-300 bg-sky-500/10 border border-sky-500/30 rounded-full px-2.5 py-1">
              🛡️ Perfect week
            </span>
          )}
        </div>
        <ProgressBar value={doneCount} max={Math.max(activeWeekly.length, 1)} />
        <p className="text-[11px] text-slate-500 mt-2">🔄 New quests in {resetLabel}</p>
      </div>

      {wildcard && (
        <WildcardQuestCard
          quest={wildcard}
          completed={completed.includes(wildcard.id)}
          onToggle={() => dispatch({ type: 'TOGGLE_QUEST', questId: wildcard.id })}
        />
      )}

      {activeWeekly.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
          <p className="text-3xl mb-2">🏔️</p>
          <p className="text-white font-semibold mb-1">No weekly quests yet</p>
          <p className="text-slate-400 text-sm mb-4 px-6">
            Add a bigger challenge you can chip away at all week.
          </p>
          <button
            onClick={() => onNavigate('manage')}
            className="rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm px-4 py-2 transition"
          >
            Add a quest
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((quest) =>
            quest.promptForNote ? (
              <NoteQuestCard
                key={quest.id}
                quest={quest}
                note={notes[quest.id] ?? ''}
                completed={completed.includes(quest.id)}
                onChangeNote={(note) => dispatch({ type: 'SET_QUEST_NOTE', questId: quest.id, note })}
              />
            ) : (
              <QuestCard
                key={quest.id}
                quest={quest}
                completed={completed.includes(quest.id)}
                onToggle={() => dispatch({ type: 'TOGGLE_QUEST', questId: quest.id })}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
