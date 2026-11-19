/** Reducer slice: What friends can see. Returns undefined for actions it doesn't handle. */
import type { AppState } from '../../lib/types';
import type { Action } from '../actions';

export function friendsSlice(state: AppState, action: Action): AppState | undefined {
  switch (action.type) {
    case 'SET_SHARING':
      return { ...state, sharing: { ...{ quests: true, runs: true, streak: true, level: true, badges: true }, ...(state.sharing ?? {}), ...action.sharing } };

    default:
      return undefined;
  }
}
