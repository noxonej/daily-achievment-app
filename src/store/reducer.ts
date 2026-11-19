/**
 * The app's reducer. Each feature lives in its own slice file (src/store/slices); this file asks
 * each slice in turn and uses the first answer. Action types and the saved state shape are the
 * same as before the split (2026-11-19).
 */
import type { AppState } from '../lib/types';
import { legendaryBonus, worldOf } from '../world/catalog';
import type { Action } from './actions';
import { setBonusPct } from './state';
import { questsSlice } from './slices/quests';
import { rewardsSlice } from './slices/rewards';
import { worldSlice } from './slices/world';
import { planSlice } from './slices/plan';
import { moneySlice } from './slices/money';
import { friendsSlice } from './slices/friends';
import { wellbeingSlice } from './slices/wellbeing';
import { settingsSlice } from './slices/settings';

export type { Action } from './actions';
export {
  createInitialState,
  ownership,
  createEmptyWeekPlan,
  isOwnFund,
  starterQuestTitles,
  doneByHand,
  CONTENT_VERSION,
  currentProgress,
  migrateContent,
  type NewQuestInput,
  type NewGoalInput,
} from './state';

const SLICES = [questsSlice, rewardsSlice, worldSlice, planSlice, moneySlice, friendsSlice, wellbeingSlice, settingsSlice];

export function reducer(state: AppState, action: Action): AppState {
  // Legendary collection XP bonus for today's XP (see recomputeDailyLog in state.ts).
  setBonusPct(legendaryBonus(worldOf(state)));
  for (const slice of SLICES) {
    const next = slice(state, action);
    if (next !== undefined) return next;
  }
  return state;
}
