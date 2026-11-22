/** Reducer slice: Achievements, coins, daily box, check-in, rewards shop, seasons and streak shields. Returns undefined for actions it doesn't handle. */
import type { AppState, CustomReward, Redemption } from '../../lib/types';
import { claimCheckIn } from '../../lib/checkIn';
import { SEASON_TIERS, claimedTiers, seasonKey, seasonPoints } from '../../lib/seasons';
import { addDaysToKey, todayKey } from '../../lib/date';
import { boxPool, chestPool } from '../../data/avatar';
import { jackpotPool } from '../../lib/dailyBox';
import { worldOf } from '../../world/catalog';
import { MAX_SHIELDS, SHIELD_PRICE, computeDerivedStats, dayCountsForStreak, graceDays } from '../../lib/stats';
import type { Action } from '../actions';
import {  ownership, recomputeDailyLog, doneByHand } from '../state';

export function rewardsSlice(state: AppState, action: Action): AppState | undefined {
  switch (action.type) {
    case 'UNLOCK_ACHIEVEMENTS': {
      const now = new Date().toISOString();
      const existingIds = new Set(state.unlockedAchievements.map((a) => a.id));
      const newOnes = action.ids.filter((id) => !existingIds.has(id)).map((id) => ({ id, unlockedAt: now }));
      if (newOnes.length === 0) return state;
      return { ...state, unlockedAchievements: [...state.unlockedAchievements, ...newOnes] };
    }


    case 'GIFT_COINS': {
      if ((state.gifts ?? []).includes(action.id)) return state;
      return { ...state, bonusShards: (state.bonusShards ?? 0) + action.amount, gifts: [...(state.gifts ?? []), action.id] };
    }

    case 'OPEN_DAILY_BOX': {
      const today = todayKey();
      const log = state.dayLogs[today];
      if (state.dailyBox?.lastOpened === today || !log || doneByHand(log) === 0) return state;
      let next: AppState = { ...state, dailyBox: { lastOpened: today, lastReward: action.reward } };
      const r = action.reward;
      switch (r.kind) {
        case 'shards':
          next = { ...next, bonusShards: (next.bonusShards ?? 0) + Math.max(0, Math.min(500, r.amount)) };
          break;
        case 'xpBoost': {
          const boost = Math.max(log.xpBoost ?? 1, Math.min(2, r.multiplier));
          next = { ...next, dayLogs: { ...next.dayLogs, [today]: recomputeDailyLog(next.quests, log.completedQuestIds, { ...log, xpBoost: boost }) } };
          break;
        }
        case 'swap':
          next = { ...next, questSwaps: (next.questSwaps ?? 0) + 1 };
          break;
        case 'shield':
          next = { ...next, streakShields: (next.streakShields ?? 0) + 1 };
          break;
        case 'skip':
          next = { ...next, skipPasses: (next.skipPasses ?? 0) + 1 };
          break;
        case 'chest':
          next = { ...next, bonusChests: (next.bonusChests ?? 0) + 1 };
          break;
        case 'cosmetic': {
          const stats = computeDerivedStats(state);
          const ctx = ownership(state, stats);
          // A mythic, or (once every mythic is collected) any wardrobe item you don't have yet.
          const allowed = boxPool(ctx).some((i) => i.id === r.itemId) || (boxPool(ctx).length === 0 && chestPool(ctx).some((i) => i.id === r.itemId));
          if (!allowed) return state;
          next = { ...next, wonCosmeticIds: [...(next.wonCosmeticIds ?? []), r.itemId] };
          break;
        }
        case 'jackpot': {
          const world = worldOf(state);
          if (!jackpotPool(world, computeDerivedStats(state).level).some((p) => p.id === r.id)) return state;
          // Free, like chest drops: stored as paid with 0 coins.
          next = { ...next, world: { ...world, paid: { ...world.paid, [r.id]: 0 } } };
          break;
        }
      }
      return next;
    }


    case 'CLAIM_CHECK_IN': {
      const claim = claimCheckIn(state, todayKey());
      if (!claim) return state;
      let next: AppState = { ...state, checkIn: claim.record };
      const r = claim.reward;
      if (r.kind === 'shards') next = { ...next, bonusShards: (next.bonusShards ?? 0) + r.amount };
      if (r.kind === 'swap') next = { ...next, questSwaps: (next.questSwaps ?? 0) + 1 };
      if (r.kind === 'shield') next = { ...next, streakShields: (next.streakShields ?? 0) + 1 };
      if (r.kind === 'chest') next = { ...next, bonusChests: (next.bonusChests ?? 0) + 1 };
      if (claim.perfectBonus) next = { ...next, bonusShards: (next.bonusShards ?? 0) + claim.perfectBonus };
      return next;
    }


    case 'UPSERT_REWARD': {
      const r = action.reward;
      const cost = Math.round(r.cost);
      if (!r.title.trim() || !(cost > 0)) return state;
      const list = state.rewards ?? [];
      const id = r.id ?? `rw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const item: CustomReward = { id, title: r.title.trim().slice(0, 60), icon: r.icon || '🎁', cost: Math.min(100000, cost) };
      return { ...state, rewards: list.some((x) => x.id === id) ? list.map((x) => (x.id === id ? item : x)) : [...list, item] };
    }


    case 'DELETE_REWARD':
      return { ...state, rewards: (state.rewards ?? []).filter((x) => x.id !== action.rewardId) };


    case 'REDEEM_REWARD': {
      const r = (state.rewards ?? []).find((x) => x.id === action.rewardId);
      if (!r) return state;
      // Only if there are enough coins.
      if (computeDerivedStats(state).availableShards < r.cost) return state;
      const red: Redemption = { id: `rd-${Date.now()}`, rewardId: r.id, title: r.title, icon: r.icon, cost: r.cost, at: new Date().toISOString() };
      return { ...state, redemptions: [...(state.redemptions ?? []), red].slice(-500) };
    }


    case 'CLAIM_SEASON_TIER': {
      const key = seasonKey();
      const tier = SEASON_TIERS[action.tier];
      const claimed = claimedTiers(state, key);
      if (!tier || claimed.includes(action.tier) || seasonPoints(state, key) < tier.points) return state;
      return {
        ...state,
        bonusShards: (state.bonusShards ?? 0) + tier.reward.coins,
        bonusChests: (state.bonusChests ?? 0) + (tier.reward.chest ? 1 : 0),
        seasonClaims: { ...(state.seasonClaims ?? {}), [key]: [...claimed, action.tier] },
      };
    }


    case 'BUY_STREAK_SHIELD': {
      if ((state.streakShields ?? 0) >= MAX_SHIELDS) return state;
      if (computeDerivedStats(state).availableShards < SHIELD_PRICE) return state;
      return { ...state, streakShields: (state.streakShields ?? 0) + 1, shieldCoinsSpent: (state.shieldCoinsSpent ?? 0) + SHIELD_PRICE };
    }


    case 'CHECK_STREAK_SHIELDS': {
      let shields = state.streakShields ?? 0;
      if (shields <= 0) return state;
      const shielded = new Set(state.shieldedDates ?? []);
      // A rest day (one missed day in any 7) already keeps the streak: don't spend a shield on it.
      const rest = graceDays(state.dayLogs, shielded);
      const good = (k: string) => shielded.has(k) || rest.has(k) || dayCountsForStreak(state.dayLogs[k]);
      // Walk back over missed days (yesterday first), as far as the shields go.
      const missed: string[] = [];
      let cursor = addDaysToKey(todayKey(), -1);
      while (!good(cursor) && missed.length < shields && missed.length < 7) {
        missed.push(cursor);
        cursor = addDaysToKey(cursor, -1);
      }
      // Only spend shields if there's a streak behind the gap to protect.
      if (missed.length === 0 || !good(cursor)) return state;
      shields -= missed.length;
      return { ...state, streakShields: shields, shieldedDates: [...(state.shieldedDates ?? []), ...missed] };
    }

    default:
      return undefined;
  }
}
