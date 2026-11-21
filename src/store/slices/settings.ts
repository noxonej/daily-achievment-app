/** Reducer slice: Profile, settings, onboarding, import and reset. Returns undefined for actions it doesn't handle. */
import type { AppState, WeekdayId } from '../../lib/types';
import {  untwisted } from '../../lib/dailyTwist';
import {  normalizeLook } from '../../data/avatar';
import { DEFAULT_PREFS } from '../../lib/i18n';
import type { Action } from '../actions';
import { createInitialState, planId, normalizePlan, starterQuestTitles, migrateContent, normalizeMoney } from '../state';

export function settingsSlice(state: AppState, action: Action): AppState | undefined {
  switch (action.type) {
    case 'MARK_DAY_OPENED':
      return { ...state, lastOpenedDate: action.date };


    case 'SET_STREAK_POP':
      return { ...state, streakPopDate: action.date };


    case 'GUIDE_MARK':
      return (state.guide ?? []).includes(action.key) ? state : { ...state, guide: [...(state.guide ?? []), action.key] };


    case 'COMPLETE_ONBOARDING': {
      const plan = normalizePlan(state.weekPlan);
      const days = { ...plan.days };
      for (const day of Object.keys(days) as WeekdayId[]) {
        if (days[day].length === 0) days[day] = (action.plan[day] ?? []).map((i) => ({ ...i, id: planId() }));
      }
      // Start small: 4 daily quests that match what they want to work on. The rest stay in the list
      // (paused) and can be switched on any time in Settings → Quests.
      const keep = new Set(starterQuestTitles(action.profile.focusAreas));
      // Water: about 2 L a day for girls and women, 2.5 L for boys and men (EFSA), in 250 ml glasses.
      const glasses = action.profile.gender === 'male' ? 10 : 8;
      const quests = state.quests.map((q) => {
        const next = q.frequency === 'daily' && !q.custom && !q.wildcardDate ? { ...q, archived: !keep.has(untwisted(q).title) } : q;
        if (next.measure?.unit === 'glasses' && !next.custom && (next.measure.size ?? 250) === 250 && !next.twist) {
          return { ...next, title: glasses === 10 ? 'Drink 2.5L of water' : next.title, measure: { ...next.measure, target: glasses } };
        }
        return next;
      });
      // The daily wildcard stays on: a fresh bonus quest every day keeps the list from feeling the same.
      return { ...state, onboarded: true, profile: action.profile, weekPlan: { ...plan, days }, quests, wildcardEnabled: true };
    }


    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.profile } };


    case 'SET_PREFS':
      return { ...state, prefs: { ...DEFAULT_PREFS, ...(state.prefs ?? {}), ...action.prefs } };


    case 'SET_APPEARANCE':
      return { ...state, appearance: { ...(state.appearance ?? { accent: 'squzo', background: 'obsidian' }), ...action.appearance, chosen: true } };


    case 'IMPORT_STATE': {
      // Backups from before first-run setup existed belong to existing users, so never re-run setup for them.
      const merged = { ...createInitialState(), ...action.state, onboarded: action.state.onboarded ?? true, contentVersion: action.state.contentVersion ?? 1 };
      // Backup files are untrusted: money (wishlist links, A5) goes through the same checks as on load.
      return migrateContent({ ...merged, money: normalizeMoney(merged.money), character: normalizeLook(merged.character) });
    }


    case 'RESET_ALL': {
      return createInitialState();
    }

    default:
      return undefined;
  }
}
