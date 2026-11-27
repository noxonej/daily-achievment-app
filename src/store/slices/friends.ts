/** Reducer slice: What friends can see. Returns undefined for actions it doesn't handle. */
import type { AppState } from '../../lib/types';
import { DEFAULT_SHOWCASE } from '../../lib/showcase';
import type { Action } from '../actions';

export function friendsSlice(state: AppState, action: Action): AppState | undefined {
  switch (action.type) {
    case 'SET_SHARING':
      return { ...state, sharing: { ...{ quests: true, runs: true, streak: true, level: true, badges: true }, ...(state.sharing ?? {}), ...action.sharing } };

    case 'SET_SHOWCASE': {
      const next = { ...DEFAULT_SHOWCASE, ...(state.showcase ?? {}), ...action.showcase };
      // Only badges you really earned can be featured, at most three.
      const earned = new Set(state.unlockedAchievements.map((a) => a.id));
      if (next.featured) next.featured = [...new Set(next.featured)].filter((id) => earned.has(id)).slice(0, 3);
      return { ...state, showcase: next };
    }

    default:
      return undefined;
  }
}
