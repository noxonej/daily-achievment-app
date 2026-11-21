/** Reducer slice: squads and challenges (B3, round 2). Returns undefined for actions it doesn't handle. */
import type { AppState, JoinedChallenge } from '../../lib/types';
import type { Action } from '../actions';
import { todayKey } from '../../lib/date';
import { challengeDay, isFinished } from '../../lib/social';
import { INVITE_COINS, INVITE_ITEM, INVITED_GIFT, MAX_INVITE_REWARDS } from '../../lib/invites';

/** XP for each challenge quest ticked (on top of your normal quests). */
export const CHALLENGE_TICK_XP = 10;

export function socialSlice(state: AppState, action: Action): AppState | undefined {
  switch (action.type) {
    case 'INVITE_REWARD': {
      const won = state.wonCosmeticIds ?? [];
      const withItem = won.includes(INVITE_ITEM) ? won : [...won, INVITE_ITEM];
      if (!action.friend) {
        if ((state.gifts ?? []).includes(INVITED_GIFT)) return state;
        return { ...state, gifts: [...(state.gifts ?? []), INVITED_GIFT], wonCosmeticIds: withItem };
      }
      const claimed = state.invite?.claimed ?? [];
      if (claimed.includes(action.friend) || claimed.length >= MAX_INVITE_REWARDS) return state;
      return {
        ...state,
        invite: { ...(state.invite ?? {}), claimed: [...claimed, action.friend] },
        bonusShards: (state.bonusShards ?? 0) + INVITE_COINS,
        wonCosmeticIds: withItem,
      };
    }
    case 'SQUAD_ADD': {
      const list = state.squads ?? [];
      return list.includes(action.code) ? state : { ...state, squads: [...list, action.code].slice(-10) };
    }
    case 'SQUAD_REMOVE':
      return { ...state, squads: (state.squads ?? []).filter((c) => c !== action.code) };

    case 'CHALLENGE_JOIN': {
      const list = state.challenges ?? [];
      if (list.some((c) => c.code === action.challenge.code)) return state;
      const joined: JoinedChallenge = { ...action.challenge, joinedAt: todayKey(), done: {} };
      return { ...state, challenges: [...list, joined].slice(-20) };
    }
    case 'CHALLENGE_LEAVE':
      return { ...state, challenges: (state.challenges ?? []).filter((c) => c.code !== action.code) };

    case 'CHALLENGE_TICK': {
      const today = todayKey();
      let xp = 0;
      const challenges = (state.challenges ?? []).map((c) => {
        if (c.code !== action.code) return c;
        const day = challengeDay(c, today);
        // Only during the challenge, only real quests, and never after it's finished.
        if (day < 1 || day > c.days || action.index < 0 || action.index >= c.quests.length || c.finishedAt) return c;
        const ids = c.done[today] ?? [];
        const on = ids.includes(action.index);
        xp = on ? -CHALLENGE_TICK_XP : CHALLENGE_TICK_XP;
        const next: JoinedChallenge = { ...c, done: { ...c.done, [today]: on ? ids.filter((i) => i !== action.index) : [...ids, action.index] } };
        return isFinished(next) ? { ...next, finishedAt: today } : next;
      });
      if (!xp) return state;
      return { ...state, challenges, bonusXp: Math.max(0, (state.bonusXp ?? 0) + xp) };
    }

    default:
      return undefined;
  }
}
