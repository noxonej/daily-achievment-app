import { settings } from '../lib/settingsNav';
import { EditQuestsRow } from '../components/EditQuestsRow';
import { GettingStarted } from '../components/Guide';
import { FriendsPeek } from '../components/FriendsPeek';
import { useFlip } from '../lib/useFlip';
import { t } from '../lib/prefs';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { todayKey, formatDisplayDate } from '../lib/date';
import { QuestCard } from '../components/QuestCard';
import { NoteQuestCard } from '../components/NoteQuestCard';
import { MeasureQuestCard } from '../components/MeasureQuestCard';
import { WildcardQuestCard } from '../components/WildcardQuestCard';
import { QuickTaskList } from '../components/QuickTaskList';
import { DailyNoteBox } from '../components/DailyNoteBox';
import { DailyInsight } from '../components/DailyInsight';
import { PerfectDayFx } from '../components/fx/PerfectDayFx';
import { TodayPlanCard } from '../components/TodayPlanCard';
import type { ViewId } from '../components/NavTabs';
import { Icon } from '../components/Icon';
import { NowNextCard } from '../components/NowNextCard';
import { MoodCheckIn } from '../components/MoodCheckIn';
import { InstallCard } from '../components/InstallCard';
import { WeekRecap } from '../components/WeekRecap';
import { DailyBoxCard } from '../components/DailyBox';
import { CheckInCard } from '../components/today/CheckInCard';
import { QuestSwapModal } from '../components/QuestSwapModal';
import { DailyBoost } from '../components/today/DailyBoost';
import { CoachCard } from '../components/today/CoachCard';
import { QuickAdd } from '../components/today/QuickAdd';
import { TodayHero } from '../components/today/TodayHero';
import { breathe } from '../components/Breathe';

const RECAP_KEY = 'dayforge-recap-dismissed';
import { focusTimer } from '../lib/focusTimer';
import { runTracker } from '../lib/runTracker';
import { setIntent } from '../lib/intents';

function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return t('greet.night');
  if (h < 12) return t('greet.morning');
  if (h < 18) return t('greet.afternoon');
  return t('greet.evening');
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="min-w-0 flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] py-3 transition"
    >
      <span className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
        <Icon name={icon} size={19} />
      </span>
      <span className="max-w-full truncate px-0.5 text-[11px] min-[380px]:text-xs font-semibold text-slate-200">{label}</span>
    </button>
  );
}

export function TodayView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { state, dispatch, stats } = useApp();
  // Every Monday, last week's recap sits at the top of Today until dismissed.
  const [showRecap, setShowRecap] = useState(() => {
    try {
      return new Date().getDay() === 1 && localStorage.getItem(RECAP_KEY) !== todayKey() && Object.keys(state.dayLogs).length > 0;
    } catch {
      return false;
    }
  });
  const key = todayKey();
  // Where the daily rewards card sits is decided when Today opens, so it doesn't jump away as you claim.
  const [rewardsOnTop] = useState(() => state.checkIn?.last !== key);
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
      wasPerfectRef.current = isPerfect;
      return;
    }
    wasPerfectRef.current = isPerfect;
  }, [isPerfect]);

  const boost = log?.xpBoost ?? 1;
  const swaps = log?.swaps ?? {};
  const [swapOpen, setSwapOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const skipped = log?.skipped ?? [];
  const simple = state.prefs?.simple !== false;
  const listRef = useRef<HTMLDivElement>(null);
  const sorted = [...activeDaily].sort((a, b) => {
    const ac = completed.includes(a.id) ? 1 : 0;
    const bc = completed.includes(b.id) ? 1 : 0;
    return ac - bc;
  });
  useFlip(listRef, sorted.map((q) => q.id).join(','));

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5 stagger">
      <div>
        <p className="text-slate-400 text-sm">{formatDisplayDate(key)}</p>
        <h1 className="font-display text-[26px] leading-tight font-extrabold text-white mt-0.5">
          {greeting()}
          {state.profile?.name ? `, ${state.profile.name}` : ''}
        </h1>
      </div>

      <TodayHero
        quests={activeDaily}
        completed={[...completed, ...skipped]}
        boost={boost}
        onDoNext={(q) => {
          if (q.measure || q.promptForNote || swaps[q.id]) {
            const el = document.querySelector<HTMLElement>(`[data-flip="${q.id}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el?.classList.add('attention');
            setTimeout(() => el?.classList.remove('attention'), 1400);
          } else dispatch({ type: 'TOGGLE_QUEST', questId: q.id });
        }}
        extras={
          <>
            {(state.streakShields ?? 0) > 0 && (
              <span aria-label={`${state.streakShields} streak ${state.streakShields === 1 ? 'shield' : 'shields'}`} className="flex items-center gap-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 px-2.5 py-1 text-[11px] font-bold text-emerald-200" title="Protects your streak if you miss two days">
                <Icon name="🛡" size={12} />
                {state.streakShields}
              </span>
            )}
            {(state.questSwaps ?? 0) > 0 && (
              <button onClick={() => setSwapOpen(true)} aria-label={`Swap a quest (${state.questSwaps} left)`} className="flex items-center gap-1 rounded-full bg-sky-400/10 border border-sky-400/40 hover:bg-sky-400/20 px-2.5 py-1 text-[11px] font-bold text-sky-200">
                <Icon name="🔁" size={12} />
                Swap ({state.questSwaps})
              </button>
            )}
            {(state.skipPasses ?? 0) > 0 && (
              <button onClick={() => setSkipOpen(true)} aria-label={`Skip a quest (${state.skipPasses} left)`} className="flex items-center gap-1 rounded-full bg-teal-400/10 border border-teal-400/40 hover:bg-teal-400/20 px-2.5 py-1 text-[11px] font-bold text-teal-200">
                <Icon name="⏭" size={12} />
                Skip ({state.skipPasses})
              </button>
            )}
          </>
        }
      />

      {/* Daily rewards: up top until today's is claimed, then it moves down next to the box. */}
      {rewardsOnTop && <CheckInCard />}

      <GettingStarted onNavigate={onNavigate} />

      {showRecap && (
        <WeekRecap
          offset={-1}
          dismissible
          onDismiss={() => {
            try {
              localStorage.setItem(RECAP_KEY, key);
            } catch {
              // ignore
            }
            setShowRecap(false);
          }}
        />
      )}

      <NowNextCard onOpenPlan={() => onNavigate('plan')} />

      {showConfetti && <PerfectDayFx onDone={() => setShowConfetti(false)} />}

      {/* Simple mode keeps Today to the essentials: what's now, your quests, the box and your mood. */}
      {!simple && <TodayPlanCard onOpen={() => onNavigate('plan')} />}

      {!simple && <MoodCheckIn />}

      {!simple && <DailyInsight activeDailyCount={activeDaily.length} doneCount={doneCount} />}

      {wildcard && (
        <WildcardQuestCard
          quest={wildcard}
          completed={completed.includes(wildcard.id)}
          onToggle={() => dispatch({ type: 'TOGGLE_QUEST', questId: wildcard.id })}
          periodKey={key}
        />
      )}

      {activeDaily.length > 0 && <EditQuestsRow label="Daily quests" />}

      {activeDaily.length === 0 ? (
        <EmptyState />
      ) : (
        <div ref={listRef} className="space-y-2.5 rows-stagger">
          {sorted.map((original) => {
            // A swapped quest shows its replacement for today; completing it still counts for the original slot.
            if (skipped.includes(original.id))
              return (
                <div key={original.id} data-flip={original.id}>
                  <SkippedQuest quest={original} />
                </div>
              );
            const swap = swaps[original.id];
            const quest = swap
              ? { ...original, ...swap, promptForNote: false, measure: undefined, noteList: undefined, noteMinWords: undefined, details: undefined }
              : original;
            return (
              <div key={original.id} data-flip={original.id}>
              {quest.measure ? (
              <MeasureQuestCard
                key={quest.id}
                quest={quest}
                value={log?.progress?.[quest.id] ?? 0}
                completed={completed.includes(quest.id)}
                onSet={(value) => dispatch({ type: 'SET_PROGRESS', questId: quest.id, value })}
                periodKey={key}
              />
            ) : quest.promptForNote ? (
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
              )}
              </div>
            );
          })}
        </div>
      )}

      <QuickAdd />

      <div className="grid grid-cols-5 gap-1.5">
        <QuickAction icon="⏱" label={t('now.focus')} onClick={() => focusTimer.open()} />
        <QuickAction icon="🌬" label="Breathe" onClick={() => breathe.open()} />
        <QuickAction icon="df:run" label={t('qa.run')} onClick={() => runTracker.open()} />
        <QuickAction
          icon="df:spend"
          label={t('qa.spent')}
          onClick={() => {
            setIntent('add-expense');
            onNavigate('money');
          }}
        />
        <QuickAction icon="df:plan" label={t('nav.plan')} onClick={() => onNavigate('plan')} />
      </div>

      {!rewardsOnTop && <CheckInCard />}

      <DailyBoxCard />

      <FriendsPeek
        onOpen={() => {
          setIntent('you-friends');
          onNavigate('you');
        }}
      />

      {simple && <MoodCheckIn />}

      <CoachCard onNavigate={onNavigate} max={simple ? 1 : 2} />

      <DailyBoost />

      <InstallCard />

      {(!simple || (log?.quickTasks?.length ?? 0) > 0) && <QuickTaskList />}
      {!simple && <DailyNoteBox />}

      {!simple && (
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
      )}

      {!simple && (
        <div className="text-center text-xs text-slate-500 pt-1">
          Level {stats.level} · {stats.totalQuestsCompleted} quests completed all-time
        </div>
      )}

      <QuestSwapModal
        mode="skip"
        open={skipOpen}
        onClose={() => setSkipOpen(false)}
        candidates={activeDaily.filter((q) => !completed.includes(q.id))}
        onSwap={(questId) => {
          dispatch({ type: 'USE_SKIP_PASS', questId });
          setSkipOpen(false);
        }}
      />
      <QuestSwapModal
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        candidates={activeDaily.filter((q) => !completed.includes(q.id) && !swaps[q.id])}
        onSwap={(questId, replacement) => {
          dispatch({ type: 'USE_QUEST_SWAP', questId, replacement });
          setSwapOpen(false);
        }}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
      <div className="flex justify-center mb-2 text-slate-400"><Icon name="🗺" size={30} strokeWidth={1.8} /></div>
      <p className="text-white font-semibold mb-1">No daily quests yet</p>
      <p className="text-slate-400 text-sm mb-4 px-6">Add one to start building your streak.</p>
      <button
        onClick={() => {
          settings.open('quests');
        }}
        className="rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm px-4 py-2 transition"
      >
        Add a quest
      </button>
    </div>
  );
}

function SkippedQuest({ quest }: { quest: { title: string; icon: string } }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-teal-400/30 bg-teal-500/[0.04] px-4 py-3">
      <span className="shrink-0 w-10 h-10 rounded-xl bg-teal-500/10 text-teal-300 flex items-center justify-center">
        <Icon name="⏭" size={18} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-slate-400 line-through truncate">{quest.title}</span>
        <span className="block text-xs text-teal-300">Skipped with a Skip Pass · streak safe</span>
      </span>
    </div>
  );
}
