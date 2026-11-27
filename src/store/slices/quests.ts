import { sameObjective } from '../../lib/questSwap';
/** Reducer slice: Quests, goals, quick tasks, measures, steps and runs. Returns undefined for actions it doesn't handle. */
import type { AppState, GoalLogEntry, LongTermGoal, Quest, RunRecord } from '../../lib/types';
import { PROOF_BONUS } from '../../lib/proof';
import {  todayKey, weekKey } from '../../lib/date';
import { applyDailyTwists, untwisted } from '../../lib/dailyTwist';
import { buildWildcardQuestForDate, buildWeeklyWildcardQuestForWeek } from '../../lib/wildcard';
import {  DIFFICULTY_XP } from '../../lib/xp';
import { checkNote, noteDone } from '../../lib/questRules';
import type { Action } from '../actions';
import {  recomputeDailyLog, recomputeWeeklyLog, mondayKey, currentProgress, withProgress } from '../state';

export function questsSlice(state: AppState, action: Action): AppState | undefined {
  switch (action.type) {
    case 'PROOF_QUEST': {
      const key = todayKey();
      const log = state.dayLogs[key];
      const text = action.text.trim().slice(0, 500);
      if (!log || !text) return state;
      const first = !log.proofs?.[action.questId];
      return {
        ...state,
        bonusShards: (state.bonusShards ?? 0) + (first ? PROOF_BONUS : 0),
        dayLogs: { ...state.dayLogs, [key]: { ...log, proofs: { ...(log.proofs ?? {}), [action.questId]: text } } },
      };
    }


    case 'TOGGLE_QUEST': {
      const quest = state.quests.find((q) => q.id === action.questId);
      if (!quest) return state;

      if (quest.frequency === 'daily') {
        const key = todayKey();
        const existing = state.dayLogs[key];
        const completed = existing ? [...existing.completedQuestIds] : [];
        const idx = completed.indexOf(quest.id);
        if (idx >= 0) completed.splice(idx, 1);
        else completed.push(quest.id);
        const newLog = recomputeDailyLog(state.quests, completed, existing);
        return { ...state, dayLogs: { ...state.dayLogs, [key]: newLog } };
      } else {
        const key = weekKey();
        const existing = state.weekLogs[key];
        const completed = existing ? [...existing.completedQuestIds] : [];
        const idx = completed.indexOf(quest.id);
        if (idx >= 0) completed.splice(idx, 1);
        else completed.push(quest.id);
        const newLog = recomputeWeeklyLog(state.quests, completed, existing);
        return { ...state, weekLogs: { ...state.weekLogs, [key]: newLog } };
      }
    }


    case 'SET_QUEST_NOTE': {
      const quest = state.quests.find((q) => q.id === action.questId);
      if (!quest) return state;
      // Typing only saves the text. A written quest is completed by the explicit "Mark done" tap
      // (action.done === true), and only if the answer meets the quest's rule. Editing a finished
      // answer below the rule un-completes it again. (2026-11-24: quests used to tick themselves
      // while you were still typing, 0.4 s after the word count was reached.)
      const hasText = action.note.trim().length > 0;
      const passes = checkNote(quest, action.note).done;
      const isDaily = quest.frequency === 'daily';
      const key = isDaily ? todayKey() : weekKey();
      const existing = isDaily ? state.dayLogs[key] : state.weekLogs[key];
      const completed = existing ? [...existing.completedQuestIds] : [];
      const idx = completed.indexOf(quest.id);
      const done = noteDone(idx >= 0, passes, action.done);
      if (done && idx < 0) completed.push(quest.id);
      if (!done && idx >= 0) completed.splice(idx, 1);
      const notes = { ...(existing?.notes ?? {}) };
      if (hasText) notes[quest.id] = action.note;
      else delete notes[quest.id];
      if (isDaily) {
        const newLog = recomputeDailyLog(state.quests, completed, { ...state.dayLogs[key], notes });
        return { ...state, dayLogs: { ...state.dayLogs, [key]: newLog } };
      }
      const newLog = recomputeWeeklyLog(state.quests, completed, { ...state.weekLogs[key], notes });
      return { ...state, weekLogs: { ...state.weekLogs, [key]: newLog } };
    }


    case 'SET_FREE_NOTE': {
      const key = todayKey();
      const existing = state.dayLogs[key];
      const completed = existing?.completedQuestIds ?? [];
      const newLog = recomputeDailyLog(state.quests, completed, { ...existing, freeNote: action.note });
      return { ...state, dayLogs: { ...state.dayLogs, [key]: newLog } };
    }


    case 'ADD_QUICK_TASK': {
      const key = todayKey();
      const existing = state.dayLogs[key];
      const completed = existing?.completedQuestIds ?? [];
      const quickTasks = [
        ...(existing?.quickTasks ?? []),
        { id: `qt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text: action.text, done: false },
      ];
      const newLog = recomputeDailyLog(state.quests, completed, { ...existing, quickTasks });
      return { ...state, dayLogs: { ...state.dayLogs, [key]: newLog } };
    }


    case 'TOGGLE_QUICK_TASK': {
      const key = todayKey();
      const existing = state.dayLogs[key];
      if (!existing?.quickTasks) return state;
      const quickTasks = existing.quickTasks.map((t) => (t.id === action.taskId ? { ...t, done: !t.done } : t));
      const newLog = recomputeDailyLog(state.quests, existing.completedQuestIds, { ...existing, quickTasks });
      return { ...state, dayLogs: { ...state.dayLogs, [key]: newLog } };
    }


    case 'DELETE_QUICK_TASK': {
      const key = todayKey();
      const existing = state.dayLogs[key];
      if (!existing?.quickTasks) return state;
      const quickTasks = existing.quickTasks.filter((t) => t.id !== action.taskId);
      const newLog = recomputeDailyLog(state.quests, existing.completedQuestIds, { ...existing, quickTasks });
      return { ...state, dayLogs: { ...state.dayLogs, [key]: newLog } };
    }


    case 'ADD_QUEST': {
      const q: Quest = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: action.quest.title,
        description: action.quest.description,
        frequency: action.quest.frequency,
        difficulty: action.quest.difficulty,
        xp: DIFFICULTY_XP[action.quest.difficulty],
        icon: action.quest.icon || (action.quest.frequency === 'daily' ? '🎯' : '🏔️'),
        category: action.quest.category || 'Custom',
        custom: true,
        archived: false,
        createdAt: new Date().toISOString(),
        promptForNote: action.quest.promptForNote,
        details: action.quest.details,
        noteList: action.quest.noteList,
        noteMinWords: action.quest.noteMinWords,
        measure: action.quest.measure,
        ...(action.quest.stats?.length ? { stats: action.quest.stats } : {}),
      };
      return { ...state, quests: [...state.quests, q] };
    }


    case 'UPDATE_QUEST': {
      return {
        ...state,
        quests: state.quests.map((q) => {
          if (q.id !== action.questId) return q;
          // Editing a quest makes what you typed its real version, so drop today's twist.
          const updated = { ...q, ...action.updates };
          delete updated.twist;
          if (action.updates.difficulty) updated.xp = DIFFICULTY_XP[action.updates.difficulty];
          return updated;
        }),
      };
    }


    case 'DELETE_QUEST': {
      return { ...state, quests: state.quests.filter((q) => q.id !== action.questId) };
    }


    case 'TOGGLE_ARCHIVE_QUEST': {
      return {
        ...state,
        quests: state.quests.map((q) => (q.id === action.questId ? { ...q, archived: !q.archived } : q)),
      };
    }


    case 'ADD_GOAL': {
      const g: LongTermGoal = {
        id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: action.goal.title,
        description: action.goal.description,
        timeframe: action.goal.timeframe,
        target: action.goal.target,
        unit: action.goal.unit,
        progress: 0,
        icon: action.goal.icon || '🎯',
        createdAt: new Date().toISOString(),
        ...(action.goal.kind ? { kind: action.goal.kind } : {}),
      };
      return { ...state, goals: [...state.goals, g] };
    }


    case 'UPDATE_GOAL': {
      return {
        ...state,
        goals: state.goals.map((g) => {
          if (g.id !== action.goalId) return g;
          const next = { ...g, ...action.updates };
          next.target = Math.max(1, next.target);
          next.progress = Math.max(0, Math.min(next.target, next.progress));
          // Editing the target or progress can finish a goal or reopen a finished one.
          next.completedAt = next.progress >= next.target ? g.completedAt ?? new Date().toISOString() : undefined;
          return next;
        }),
      };
    }


    case 'ADJUST_GOAL_PROGRESS': {
      return {
        ...state,
        goals: state.goals.map((g) => {
          if (g.id !== action.goalId) return g;
          const nextProgress = Math.max(0, Math.min(g.target, g.progress + action.delta));
          const wasComplete = !!g.completedAt;
          const isComplete = nextProgress >= g.target;
          return {
            ...g,
            progress: nextProgress,
            completedAt: isComplete ? g.completedAt ?? new Date().toISOString() : wasComplete ? g.completedAt : undefined,
          };
        }),
      };
    }


    case 'DELETE_GOAL': {
      return { ...state, goals: state.goals.filter((g) => g.id !== action.goalId) };
    }


    case 'ADD_GOAL_LOG':
    case 'DELETE_GOAL_LOG': {
      return {
        ...state,
        goals: state.goals.map((g) => {
          if (g.id !== action.goalId) return g;
          const log = g.log ?? [];
          let delta: number;
          let nextLog: GoalLogEntry[];
          if (action.type === 'ADD_GOAL_LOG') {
            delta = action.entry.amount;
            nextLog = [...log, action.entry].slice(-500);
          } else {
            const e = log.find((x) => x.id === action.entryId);
            if (!e) return g;
            delta = -e.amount;
            nextLog = log.filter((x) => x.id !== action.entryId);
          }
          const progress = Math.max(0, Math.min(g.target, Math.round((g.progress + delta) * 10) / 10));
          return { ...g, log: nextLog, progress, completedAt: progress >= g.target ? g.completedAt ?? new Date().toISOString() : undefined };
        }),
      };
    }


    case 'SYNC_DAILY_TWIST': {
      if (state.prefs?.dailyTwists === false) {
        const quests = state.quests.map(untwisted);
        return quests.some((q, i) => q !== state.quests[i]) ? { ...state, quests } : state;
      }
      const quests = applyDailyTwists(state.quests, todayKey());
      return quests === state.quests ? state : { ...state, quests };
    }


    case 'SYNC_WILDCARD': {
      const today = todayKey();
      const thisWeek = weekKey();
      const withoutStale = state.quests.filter(
        (q) => (!q.wildcardDate || q.wildcardDate === today) && (!q.wildcardWeekKey || q.wildcardWeekKey === thisWeek),
      );
      const removedStale = withoutStale.length !== state.quests.length;

      if (!state.wildcardEnabled) {
        const withoutAnyWildcard = withoutStale.filter((q) => !q.wildcardDate && !q.wildcardWeekKey);
        return withoutAnyWildcard.length !== state.quests.length ? { ...state, quests: withoutAnyWildcard } : state;
      }

      let quests = withoutStale;
      let changed = removedStale;
      if (!quests.some((q) => q.wildcardDate === today)) {
        quests = [...quests, buildWildcardQuestForDate(today)];
        changed = true;
      }
      if (!quests.some((q) => q.wildcardWeekKey === thisWeek)) {
        quests = [...quests, buildWeeklyWildcardQuestForWeek(thisWeek)];
        changed = true;
      }
      return changed ? { ...state, quests } : state;
    }


    case 'SET_WILDCARD_ENABLED': {
      return { ...state, wildcardEnabled: action.enabled };
    }


    case 'SET_MEASURE': {
      const quest = state.quests.find((q) => q.id === action.questId);
      if (!quest?.measure || action.measure.unit !== quest.measure.unit || !(action.measure.target > 0)) return state;
      const before = currentProgress(state, quest);
      const oldSize = quest.measure.size ?? 250;
      const newSize = action.measure.size ?? 250;
      const updated = { ...quest, measure: { ...action.measure } };
      // "Drink 2L of water" follows a new daily goal (e.g. 2.5L).
      if (quest.measure.unit === 'glasses' && /\d+([.,]\d+)?\s?L\b/.test(quest.title)) {
        const l = Math.round(((action.measure.size ?? 250) * action.measure.target) / 100) / 10;
        updated.title = quest.title.replace(/\d+([.,]\d+)?\s?L\b/, `${l}L`);
      } else if (quest.measure.unit !== 'glasses' && quest.measure.target !== action.measure.target) {
        // "Walk 10,000 steps" → "Walk 8,000 steps" (only when the old goal is written in the title).
        const t = quest.measure.target;
        const forms = [t.toLocaleString('en-US'), String(t), t.toLocaleString('de-DE')];
        const hit = forms.find((f) => new RegExp(`(^|\\D)${f.replace(/[.,]/g, '\\$&')}(?!\\d)`).test(quest.title));
        if (hit) {
          const nt = action.measure.target;
          const repl = hit.includes(',') ? nt.toLocaleString('en-US') : hit.includes('.') && t >= 1000 ? nt.toLocaleString('de-DE') : String(nt);
          updated.title = quest.title.replace(hit, repl);
        }
      }
      let next: AppState = { ...state, quests: state.quests.map((q) => (q.id === quest.id ? updated : q)) };
      // Same amount of water drunk, counted in the new glass size.
      const value = quest.measure.unit === 'glasses' && oldSize !== newSize ? Math.round((before * oldSize) / newSize) : before;
      next = withProgress(next, updated, value);
      return next;
    }


    case 'SET_PROGRESS': {
      const quest = state.quests.find((q) => q.id === action.questId);
      if (!quest?.measure) return state;
      return withProgress(state, quest, Math.max(0, action.value));
    }


    case 'ADD_STEPS': {
      // Counted steps go to every active steps quest (daily and weekly).
      if (!(action.steps > 0)) return state;
      let next = state;
      for (const q of state.quests.filter((x) => x.measure?.unit === 'steps' && !x.archived)) {
        next = withProgress(next, q, currentProgress(next, q) + Math.round(action.steps));
      }
      return next;
    }


    case 'SYNC_STEPS_TOTAL': {
      // Today's total from the phone's own step counter (Apple Health via a Shortcut, or a ?steps= link).
      // It already includes steps the app counted itself, so daily quests take the bigger number, and
      // weekly quests only get what's new, so nothing is counted twice.
      const total = Math.round(action.steps);
      if (!(total > 0)) return state;
      const today = todayKey();
      const before = state.stepSync?.date === today ? state.stepSync.steps : 0;
      const stepQuests = state.quests.filter((x) => x.measure?.unit === 'steps' && !x.archived);
      const daily = stepQuests.find((q) => q.frequency === 'daily');
      const dailyBefore = daily ? currentProgress(state, daily) : before;
      const gained = Math.max(0, total - Math.max(dailyBefore, before));
      let next: AppState = { ...state, stepSync: { date: today, steps: Math.max(total, before), at: new Date().toISOString() } };
      for (const q of stepQuests) {
        if (q.frequency === 'daily') next = withProgress(next, q, Math.max(currentProgress(next, q), total));
        else if (gained > 0) next = withProgress(next, q, currentProgress(next, q) + gained);
      }
      return next;
    }


    case 'SET_STEPS_TOKEN':
      return state.stepsToken ? state : { ...state, stepsToken: action.token };


    case 'ADD_RUN': {
      if (!(action.km > 0)) return state;
      const km = Math.round(action.km * 100) / 100;
      const run: RunRecord = { id: `run-${Date.now()}`, date: todayKey(), km, seconds: Math.max(0, Math.round(action.seconds)), source: action.source };
      let next: AppState = { ...state, runs: [...(state.runs ?? []), run] };
      // A run counts toward every active distance quest, daily and weekly.
      for (const q of next.quests.filter((x) => x.measure?.unit === 'km' && !x.archived)) {
        next = withProgress(next, q, currentProgress(next, q) + km);
      }
      return next;
    }


    case 'DELETE_RUN': {
      const run = (state.runs ?? []).find((r) => r.id === action.runId);
      if (!run) return state;
      let next: AppState = { ...state, runs: (state.runs ?? []).filter((r) => r.id !== action.runId) };
      if (run.date === todayKey() || run.date >= mondayKey()) {
        for (const q of next.quests.filter((x) => x.measure?.unit === 'km' && !x.archived)) {
          const applies = q.frequency === 'weekly' ? run.date >= mondayKey() : run.date === todayKey();
          if (applies) next = withProgress(next, q, Math.max(0, currentProgress(next, q) - run.km));
        }
      }
      return next;
    }


    case 'USE_QUEST_SWAP': {
      const quest = state.quests.find((q) => q.id === action.questId);
      const today = todayKey();
      const log = state.dayLogs[today];
      if (!quest || quest.frequency !== 'daily' || (state.questSwaps ?? 0) <= 0) return state;
      if (log?.completedQuestIds.includes(quest.id) || log?.swaps?.[quest.id]) return state;
      // A swap must be a genuinely different quest (2026-11-27), not the same goal with a new number.
      if (sameObjective(quest, action.replacement)) return state;
      const swaps = { ...(log?.swaps ?? {}), [quest.id]: action.replacement };
      return {
        ...state,
        questSwaps: (state.questSwaps ?? 0) - 1,
        dayLogs: { ...state.dayLogs, [today]: recomputeDailyLog(state.quests, log?.completedQuestIds ?? [], { ...log, swaps }) },
      };
    }


    case 'USE_SKIP_PASS': {
      const quest = state.quests.find((q) => q.id === action.questId);
      const today = todayKey();
      const log = state.dayLogs[today];
      if (!quest || quest.frequency !== 'daily' || quest.archived || (state.skipPasses ?? 0) <= 0) return state;
      if (log?.completedQuestIds.includes(quest.id)) return state;
      const skipped = [...(log?.skipped ?? []), quest.id];
      return {
        ...state,
        skipPasses: (state.skipPasses ?? 0) - 1,
        dayLogs: { ...state.dayLogs, [today]: recomputeDailyLog(state.quests, log?.completedQuestIds ?? [], { ...log, skipped }) },
      };
    }


    case 'TOGGLE_TASK_TOP': {
      const key = todayKey();
      const log = state.dayLogs[key];
      if (!log?.quickTasks) return state;
      const target = log.quickTasks.find((t) => t.id === action.taskId);
      if (!target) return state;
      // At most three top priorities: starring a fourth is ignored.
      if (!target.top && log.quickTasks.filter((t) => t.top && !t.done).length >= 3) return state;
      const quickTasks = log.quickTasks.map((t) => (t.id === action.taskId ? { ...t, top: !t.top } : t));
      return { ...state, dayLogs: { ...state.dayLogs, [key]: { ...log, quickTasks } } };
    }

    default:
      return undefined;
  }
}
