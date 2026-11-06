import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { todayKey, formatDisplayDate } from '../lib/date';
import { useDailyResetLabel } from '../lib/useResetCountdown';
import { QuestCard } from '../components/QuestCard';
import { NoteQuestCard } from '../components/NoteQuestCard';
import { WildcardQuestCard } from '../components/WildcardQuestCard';
import { ProgressBar } from '../components/ProgressBar';
import { QuickTaskList } from '../components/QuickTaskList';
import { DailyNoteBox } from '../components/DailyNoteBox';
import { DailyInsight } from '../components/DailyInsight';
import { Confetti } from '../components/Confetti';
import { TodayPlanCard } from '../components/TodayPlanCard';
import type { ViewId } from '../components/NavTabs';
import { Icon } from '../components/Icon';
import { NowNextCard } from '../components/NowNextCard';
import { MoodCheckIn } from '../components/MoodCheckIn';
import { InstallCard } from '../components/InstallCard';
import { focusTimer } from '../lib/focusTimer';
import { setIntent } from '../lib/intents';

function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] py-3 transition"
    >
      <span className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
        <Icon name={icon} size={19} />
      </span>
      <span className="text-xs font-semibold text-slate-200">{label}</span>
    </button>
  );
}

export function TodayView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { state, dispatch, stats } = useApp();
  const resetLabel = useDailyResetLabel();
  const key = todayKey();
  const log = state.dayLogs[key];
  const completed = log?.completedQuestIds ?? [];
  const notes = log?.notes ?? {};
  const allActiveDaily = state.quests.filter((q) => q.frequency === 'daily' && !q.archived);
  const wildcard = allActiveDaily.find((q) => q.wildcardDate === key);
  const activeDaily = allActiveDaily.filter((q) => q.wildcardDate !== key);
  const doneCount = activeDaily.filter((q) => completed.includes(q.id)).length;
  const isPerfect = activeDaily.length > 0 && doneCount === activeDaily.length;

  const [showConfetti, setShowConfetti] = useState(false);
  const wasPerfectRef = useRef(isPerfect);
  useEffect(() => {
    if (isPerfect && !wasPerfectRef.current) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 1400);
      wasPerfectRef.current = isPerfect;
      return () => clearTimeout(t);
    }
    wasPerfectRef.current = isPerfect;
  }, [isPerfect]);

  const sorted = [...activeDaily].sort((a, b) => {
    const ac = completed.includes(a.id) ? 1 : 0;
    const bc = completed.includes(b.id) ? 1 : 0;
    return ac - bc;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5 stagger">
      <div>
        <p className="text-slate-400 text-sm">{formatDisplayDate(key)}</p>
        <h1 className="font-display text-[26px] leading-tight font-extrabold text-white mt-0.5">
          {greeting()}
          {state.profile?.name ? `, ${state.profile.name}` : ''}
        </h1>
      </div>

      <InstallCard />

      <NowNextCard onOpenPlan={() => onNavigate('plan')} />

      <div className="grid grid-cols-3 gap-2">
        <QuickAction icon="⏱" label="Focus" onClick={() => focusTimer.open()} />
        <QuickAction
          icon="💸"
          label="Log spending"
          onClick={() => {
            setIntent('add-expense');
            onNavigate('money');
          }}
        />
        <QuickAction icon="📅" label="Week plan" onClick={() => onNavigate('plan')} />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        {showConfetti && <Confetti count={36} />}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">
            <span className="font-bold text-white">Daily quests</span> · {doneCount} / {activeDaily.length} done
          </span>
          {isPerfect && (
            <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1">
              <Icon name="✨" size="1.15em" className="icon-inline" />Perfect day
            </span>
          )}
        </div>
        <ProgressBar
          value={doneCount}
          max={Math.max(activeDaily.length, 1)}
          colorClass="bg-gradient-to-r from-emerald-500 to-teal-400"
        />
        <p className="text-[11px] text-slate-500 mt-2"><Icon name="🔄" size="1.15em" className="icon-inline" />New quests in {resetLabel}</p>
      </div>

      <TodayPlanCard onOpen={() => onNavigate('plan')} />

      <MoodCheckIn />

      <DailyInsight activeDailyCount={activeDaily.length} doneCount={doneCount} />

      {wildcard && (
        <WildcardQuestCard
          quest={wildcard}
          completed={completed.includes(wildcard.id)}
          onToggle={() => dispatch({ type: 'TOGGLE_QUEST', questId: wildcard.id })}
          periodKey={key}
        />
      )}

      {activeDaily.length === 0 ? (
        <EmptyState onNavigate={onNavigate} />
      ) : (
        <div className="space-y-2.5 rows-stagger">
          {sorted.map((quest) =>
            quest.promptForNote ? (
              <NoteQuestCard
                key={quest.id}
                quest={quest}
                note={notes[quest.id] ?? ''}
                completed={completed.includes(quest.id)}
                onChangeNote={(note) => dispatch({ type: 'SET_QUEST_NOTE', questId: quest.id, note })}
                periodKey={key}
              />
            ) : (
              <QuestCard
                key={quest.id}
                quest={quest}
                completed={completed.includes(quest.id)}
                onToggle={() => dispatch({ type: 'TOGGLE_QUEST', questId: quest.id })}
                periodKey={key}
              />
            ),
          )}
        </div>
      )}

      <QuickTaskList />
      <DailyNoteBox />

      <button
        onClick={() => onNavigate('quests')}
        className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left hover:border-white/20 transition"
      >
        <span className="flex items-center gap-3">
          <span className="shrink-0 w-10 h-10 rounded-xl bg-white/5 text-sky-300 flex items-center justify-center"><Icon name="🗡" size={20} /></span>
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
      <div className="flex justify-center mb-2 text-slate-400"><Icon name="🗺" size={30} strokeWidth={1.8} /></div>
      <p className="text-white font-semibold mb-1">No daily quests yet</p>
      <p className="text-slate-400 text-sm mb-4 px-6">Add one to start building your streak.</p>
      <button
        onClick={() => {
          setIntent('you-settings');
          onNavigate('you');
        }}
        className="rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm px-4 py-2 transition"
      >
        Add a quest
      </button>
    </div>
  );
}
