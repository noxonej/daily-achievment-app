import type { Challenge } from '../lib/types';
import type { AppState, CosmeticSlot, GoalLogEntry, PlanCategory, PlanItem, WeekdayId, MoneyAccount, Mood, Profile, Appearance, Prefs, NoteEntry, QuestMeasure, MoneyKind, MoneyState, SavingsGoal, SpendCategory, CryptoHolding, Bill, Sharing, WishItem, CustomReward, SleepState, DecorSlot } from '../lib/types';
import type { BoxReward } from '../lib/dailyBox';
import type { NewGoalInput, NewQuestInput } from './state';

export type Action =
  | { type: 'TOGGLE_QUEST'; questId: string }
  | { type: 'SQUAD_ADD'; code: string }
  /** B6: `friend` set = a friend you invited reached 3 days; unset = you (the invited one) did. */
  | { type: 'INVITE_REWARD'; friend?: string; name?: string }
  | { type: 'SQUAD_REMOVE'; code: string }
  | { type: 'CHALLENGE_JOIN'; challenge: Challenge }
  | { type: 'CHALLENGE_TICK'; code: string; index: number }
  | { type: 'CHALLENGE_LEAVE'; code: string }
  | { type: 'ADD_QUEST'; quest: NewQuestInput }
  | { type: 'UPDATE_QUEST'; questId: string; updates: Partial<NewQuestInput> }
  | { type: 'DELETE_QUEST'; questId: string }
  | { type: 'TOGGLE_ARCHIVE_QUEST'; questId: string }
  | { type: 'ADD_GOAL'; goal: NewGoalInput }
  | { type: 'UPDATE_GOAL'; goalId: string; updates: Partial<NewGoalInput> }
  | { type: 'ADJUST_GOAL_PROGRESS'; goalId: string; delta: number }
  | { type: 'DELETE_GOAL'; goalId: string }
  | { type: 'ADD_GOAL_LOG'; goalId: string; entry: GoalLogEntry }
  | { type: 'DELETE_GOAL_LOG'; goalId: string; entryId: string }
  | { type: 'UNLOCK_ACHIEVEMENTS'; ids: string[] }
  | { type: 'MARK_DAY_OPENED'; date: string }
  | { type: 'SYNC_WILDCARD' }
  | { type: 'SET_WILDCARD_ENABLED'; enabled: boolean }
  | { type: 'UNLOCK_COSMETIC'; itemId: string }
  | { type: 'EQUIP_COSMETIC'; slot: CosmeticSlot; itemId: string }
  /** World: buy a home, decor, vehicle, paint or garage spot (applies it right away; paint goes on vehicleId). */
  | { type: 'WORLD_BUY'; id: string; vehicleId?: string }
  | { type: 'WORLD_MOVE'; property: string }
  | { type: 'WORLD_PLACE'; slot: DecorSlot; itemId: string }
  /** Put one more shelf or collectible you own anywhere in the room. */
  | { type: 'WORLD_EXTRA_ADD'; itemId: string; x: number; y: number }
  | { type: 'WORLD_EXTRA_REMOVE'; index: number }
  | { type: 'WORLD_FEATURE'; vehicleId: string }
  | { type: 'WORLD_PAINT'; vehicleId: string; paint: string }
  | { type: 'WORLD_MOD'; vehicleId: string; partId: string }
  /** Pick where your vehicles live (an owned GARAGE_ENVS place). */
  | { type: 'WORLD_GARAGE'; id: string }
  | { type: 'WORLD_TINT'; part: 'wall' | 'floor'; color: string | null }
  | { type: 'WORLD_SIZE'; slot: 'poster' | 'art'; size: 's' | 'm' | 'l' }
  /** Use a legendary milestone (level 100, 365-day streak...) to take one legendary vehicle. */
  | { type: 'LEGENDARY_PICK'; pickId: string; vehicleId: string }
  /** itemId is the rolled prize, or null when everything is owned (gives bonus coins instead). */
  | { type: 'OPEN_CHEST'; itemId: string | null; skip?: boolean; worldId?: string }
  | { type: 'SET_QUEST_NOTE'; questId: string; note: string; /** true = the "Mark done" tap, false = undo; left out while typing. */ done?: boolean }
  /** Saves a quest's proof answer for today; the first proof per quest per day gives a small coin bonus. */
  | { type: 'PROOF_QUEST'; questId: string; text: string }
  | { type: 'SET_FREE_NOTE'; note: string }
  | { type: 'ADD_QUICK_TASK'; text: string }
  | { type: 'TOGGLE_QUICK_TASK'; taskId: string }
  | { type: 'DELETE_QUICK_TASK'; taskId: string }
  | { type: 'PLAN_ADD'; day: WeekdayId; text: string; time?: string; category?: PlanCategory; date?: string; note?: string }
  | { type: 'PLAN_UPDATE'; day: WeekdayId; itemId: string; text: string; time?: string; category?: PlanCategory; date?: string; note?: string }
  | { type: 'PLAN_LOAD_STARTER'; days: Record<WeekdayId, Array<Omit<PlanItem, 'id'>>>; /** Swap the whole week (undoable from the screen). */ replace?: boolean }
  | { type: 'PLAN_DELETE'; day: WeekdayId; itemId: string }
  | { type: 'PLAN_TOGGLE'; itemId: string }
  | { type: 'PLAN_COPY_DAY'; from: WeekdayId; to: WeekdayId[] }
  | { type: 'PLAN_CLEAR_DAY'; day: WeekdayId }
  | { type: 'MONEY_SETUP'; currency: string; amounts: Record<MoneyKind, number> }
  | { type: 'MONEY_SET_CURRENCY'; currency: string }
  | { type: 'MONEY_UPSERT_ACCOUNT'; account: Omit<MoneyAccount, 'id'> & { id?: string } }
  | { type: 'MONEY_DELETE_ACCOUNT'; accountId: string }
  | { type: 'MONEY_TRANSFER'; fromId: string; toId: string; amount: number }
  | { type: 'MONEY_ADD_EXPENSE'; amount: number; categoryId: string; accountId?: string; note?: string }
  | { type: 'MONEY_DELETE_EXPENSE'; expenseId: string }
  | { type: 'MONEY_SET_CATEGORIES'; categories: SpendCategory[] }
  | {
      type: 'MONEY_UPSERT_GOAL';
      goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'accountId'> & { id?: string; accountId?: string };
      /** When set, a new savings account is created to hold the goal's money, starting at this many cents. */
      newAccount?: { name: string; amount: number; fromAccountId?: string };
    }
  | { type: 'MONEY_DELETE_GOAL'; goalId: string; /** Also close the goal's own fund and move its money back. */ closeFund?: boolean }
  | { type: 'MONEY_SET_GOAL_SAVED'; goalId: string; amount: number }
  | { type: 'SYNC_DAILY_TWIST' }
  | {
      type: 'COMPLETE_ONBOARDING';
      profile: Profile;
      plan: Record<WeekdayId, Array<Omit<PlanItem, 'id'>>>;
      /** The daily quests picked in onboarding (titles). Without it, starter quests are chosen. */
      keep?: string[];
    }
  /** Onboarding's "do your first quest right now" (once per account). */
  | { type: 'FIRST_WIN'; title: string }
  | { type: 'SET_PROFILE'; profile: Partial<Profile> }
  | { type: 'SET_MOOD'; date: string; mood: Mood | null }
  | { type: 'SET_APPEARANCE'; appearance: Partial<Appearance> }
  | { type: 'SET_PREFS'; prefs: Partial<Prefs> }
  | { type: 'SET_DIARY'; date: string; text: string }
  | { type: 'UPSERT_NOTE'; note: Partial<NoteEntry> & { id?: string } }
  | { type: 'DELETE_NOTE'; noteId: string }
  | { type: 'ADD_FOCUS_MINUTES'; date: string; minutes: number }
  /** Sets today's (or this week's) total on a number-based quest; completes it at the target. */
  | { type: 'SET_PROGRESS'; questId: string; value: number }
  /** Change a number quest's goal, glass size or quick buttons; today's progress is kept (rescaled for a new glass size). */
  | { type: 'SET_MEASURE'; questId: string; measure: QuestMeasure }
  | { type: 'ADD_STEPS'; steps: number }
  | { type: 'SYNC_STEPS_TOTAL'; steps: number }
  | { type: 'SET_STEPS_TOKEN'; token: string }
  | { type: 'ADD_RUN'; km: number; seconds: number; source: 'gps' | 'manual' }
  | { type: 'OPEN_DAILY_BOX'; reward: BoxReward }
  | { type: 'GIFT_COINS'; id: string; amount: number }
  | { type: 'USE_SKIP_PASS'; questId: string }
  | { type: 'PRUNE_PLAN_EVENTS'; today: string }
  | { type: 'GUIDE_MARK'; key: string }
  | { type: 'SET_STREAK_POP'; date: string }
  | { type: 'SET_SHARING'; sharing: Partial<Sharing> }
  | { type: 'MONEY_UPSERT_CRYPTO'; holding: Omit<CryptoHolding, 'id'> & { id?: string } }
  | { type: 'MONEY_DELETE_CRYPTO'; holdingId: string }
  | { type: 'MONEY_SET_CRYPTO_PRICES'; prices: NonNullable<MoneyState['cryptoPrices']> }
  | { type: 'MONEY_UPSERT_BILL'; bill: Omit<Bill, 'id'> & { id?: string } }
  | { type: 'MONEY_DELETE_BILL'; billId: string }
  | { type: 'UPSERT_REWARD'; reward: Omit<CustomReward, 'id'> & { id?: string } }
  | { type: 'DELETE_REWARD'; rewardId: string }
  | { type: 'REDEEM_REWARD'; rewardId: string }
  | { type: 'TOGGLE_TASK_TOP'; taskId: string }
  | { type: 'CLAIM_CHECK_IN' }
  | { type: 'MONEY_SET_MODE'; mode: NonNullable<MoneyState['mode']>; saveRate: number }
  | { type: 'SLEEP_SET'; sleep: Partial<Pick<SleepState, 'band' | 'needHours' | 'fallAsleep'>> }
  | { type: 'SLEEP_START'; at: string }
  | { type: 'SLEEP_CANCEL' }
  | { type: 'SLEEP_LOG'; start: string; end: string; feel?: 1 | 2 | 3 }
  | { type: 'SLEEP_DELETE'; entryId: string }
  | { type: 'MONEY_SET_ASSIGNED'; assigned: Record<string, number> }
  | { type: 'MONEY_UPSERT_WISH'; wish: Omit<WishItem, 'id' | 'addedAt'> & { id?: string } }
  | { type: 'MONEY_DELETE_WISH'; wishId: string }
  | { type: 'MONEY_SET_INCOME'; income: MoneyState['income']; saveRate?: number }
  | { type: 'USE_QUEST_SWAP'; questId: string; replacement: { title: string; description?: string; icon: string } }
  /** Spends Streak Shields on missed days right before today, if that keeps an existing streak alive. */
  | { type: 'CHECK_STREAK_SHIELDS' }
  | { type: 'BUY_STREAK_SHIELD' }
  | { type: 'CLAIM_SEASON_TIER'; tier: number }
  | { type: 'DELETE_RUN'; runId: string }
  | { type: 'IMPORT_STATE'; state: AppState }
  | { type: 'RESET_ALL' };
