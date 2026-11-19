/** Reducer slice: Diary, notes, mood, sleep and focus time. Returns undefined for actions it doesn't handle. */
import type { AppState, NoteEntry, SleepEntry } from '../../lib/types';
import { fallAsleepMin, hoursBetween, sleepQuestsDone } from '../../lib/sleep';
import {  todayKey } from '../../lib/date';
import type { Action } from '../actions';
import { reducer } from '../reducer';

export function wellbeingSlice(state: AppState, action: Action): AppState | undefined {
  switch (action.type) {
    case 'SET_DIARY': {
      // The diary page for a day is the same text as that day's note on the Today screen.
      const existing = state.dayLogs[action.date];
      const freeNote = action.text;
      if (!existing && !freeNote.trim()) return state;
      const log = existing
        ? { ...existing, freeNote }
        : { date: action.date, completedQuestIds: [], xpEarned: 0, perfectDay: false, dailyQuestCount: 0, freeNote };
      return { ...state, dayLogs: { ...state.dayLogs, [action.date]: log } };
    }


    case 'UPSERT_NOTE': {
      const now = new Date().toISOString();
      const notes = state.notes ?? [];
      if (action.note.id && notes.some((n) => n.id === action.note.id)) {
        return { ...state, notes: notes.map((n) => (n.id === action.note.id ? { ...n, ...action.note, updatedAt: now } : n)) };
      }
      const note: NoteEntry = {
        id: action.note.id ?? `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: action.note.title ?? '',
        body: action.note.body ?? '',
        pinned: action.note.pinned ?? false,
        color: action.note.color ?? 'none',
        createdAt: now,
        updatedAt: now,
      };
      return { ...state, notes: [note, ...notes] };
    }


    case 'DELETE_NOTE':
      return { ...state, notes: (state.notes ?? []).filter((n) => n.id !== action.noteId) };


    case 'SET_MOOD': {
      const moods = { ...(state.moods ?? {}) };
      if (action.mood === null) delete moods[action.date];
      else moods[action.date] = action.mood;
      return { ...state, moods };
    }


    case 'SLEEP_SET': {
      const sleep = { ...(state.sleep ?? {}), ...action.sleep };
      if (sleep.needHours !== undefined) sleep.needHours = Math.min(12, Math.max(5, Math.round(sleep.needHours * 4) / 4));
      if (sleep.fallAsleep !== undefined) sleep.fallAsleep = Math.min(60, Math.max(0, Math.round(sleep.fallAsleep)));
      return { ...state, sleep };
    }


    case 'SLEEP_START':
      return { ...state, sleep: { ...(state.sleep ?? {}), sleepingSince: action.at } };


    case 'SLEEP_CANCEL': {
      const { sleepingSince: _drop, ...rest } = state.sleep ?? {};
      void _drop;
      return { ...state, sleep: rest };
    }


    case 'SLEEP_LOG': {
      const start = new Date(action.start);
      const end = new Date(action.end);
      const mins = (end.getTime() - start.getTime()) / 60000;
      // Ignore impossible nights (negative, or longer than 16 hours).
      if (!(mins > 30 && mins < 16 * 60)) return { ...state, sleep: { ...(state.sleep ?? {}), sleepingSince: undefined } };
      const hours = hoursBetween(action.start, action.end, fallAsleepMin(state.sleep));
      const date = todayKey(end);
      const entry: SleepEntry = { id: `sleep-${end.getTime()}`, date, start: action.start, end: action.end, hours, feel: action.feel };
      // One entry per morning: a new one replaces that day's.
      const log = [...(state.sleep?.log ?? []).filter((e) => e.date !== date), entry].sort((a, b) => a.date.localeCompare(b.date)).slice(-120);
      let next: AppState = { ...state, sleep: { ...(state.sleep ?? {}), sleepingSince: undefined, log } };
      if (date === todayKey()) {
        const doneNow = next.dayLogs[date]?.completedQuestIds ?? [];
        for (const id of sleepQuestsDone(next, entry)) {
          if (!doneNow.includes(id)) next = reducer(next, { type: 'TOGGLE_QUEST', questId: id });
        }
      }
      return next;
    }


    case 'SLEEP_DELETE':
      return { ...state, sleep: { ...(state.sleep ?? {}), log: (state.sleep?.log ?? []).filter((e) => e.id !== action.entryId) } };


    case 'ADD_FOCUS_MINUTES': {
      if (action.minutes <= 0) return state;
      const focusMinutes = { ...(state.focusMinutes ?? {}) };
      focusMinutes[action.date] = (focusMinutes[action.date] ?? 0) + action.minutes;
      return { ...state, focusMinutes };
    }

    default:
      return undefined;
  }
}
