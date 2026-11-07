export type MeasureUnit = 'steps' | 'km' | 'glasses' | 'reps' | 'minutes' | 'pages';

export interface QuestMeasure {
  unit: MeasureUnit;
  target: number;
  /** Water: millilitres per glass / bottle (default 250). */
  size?: number;
  /** Your own quick-add buttons (e.g. +20 push-ups). */
  quick?: number[];
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'epic';

export type Frequency = 'daily' | 'weekly';

export interface Quest {
  id: string;
  title: string;
  description?: string;
  frequency: Frequency;
  difficulty: Difficulty;
  xp: number;
  icon: string;
  category: string;
  custom: boolean;
  archived: boolean;
  createdAt: string;
  /** Set only on the auto-rotating daily wildcard quest; value is the date (YYYY-MM-DD) it belongs to. */
  wildcardDate?: string;
  /** Set only on the auto-rotating weekly wildcard quest; value is the ISO week (YYYY-Www) it belongs to. */
  wildcardWeekKey?: string;
  /** Shows an inline textarea on the card; writing something non-empty is what completes the quest. */
  promptForNote?: boolean;
  /** Longer clarifying explanation, hidden behind a tap/click "more info" affordance on the card. */
  details?: string;
  /** Written quests: number of separate entries required (e.g. 3 for "Gratitude x3"). */
  noteList?: number;
  /** Written quests: minimum number of real words. */
  noteMinWords?: number;
  /** Number-based quests (steps, km, glasses…): completes when today's/this week's total reaches the target. */
  measure?: QuestMeasure;
}

export type GoalTimeframe = 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface LongTermGoal {
  id: string;
  title: string;
  description?: string;
  timeframe: GoalTimeframe;
  target: number;
  unit: string;
  progress: number;
  icon: string;
  createdAt: string;
  completedAt?: string;
}

export interface QuickTask {
  id: string;
  text: string;
  done: boolean;
}

export interface DayLog {
  date: string;
  completedQuestIds: string[];
  xpEarned: number;
  perfectDay: boolean;
  dailyQuestCount: number;
  /** Notes written on individual quests (e.g. Gratitude x3), keyed by quest id. */
  notes?: Record<string, string>;
  /** Freeform journal entry for the day, independent of any quest. */
  freeNote?: string;
  /** One-off, non-recurring to-dos for the day. */
  quickTasks?: QuickTask[];
  /** Progress on number-based quests, keyed by quest id. */
  progress?: Record<string, number>;
  /** XP multiplier for today from a daily-box boost (e.g. 1.5 or 2). */
  xpBoost?: number;
  /** Daily quests swapped for something else today (Quest Swap), keyed by the original quest id. */
  swaps?: Record<string, { title: string; description?: string; icon: string }>;
  /** Daily quests skipped with a Skip Pass: they count as done for streaks and perfect days, but give no XP. */
  skipped?: string[];
}

export interface WeekLog {
  weekKey: string;
  completedQuestIds: string[];
  xpEarned: number;
  perfectWeek: boolean;
  weeklyQuestCount: number;
  notes?: Record<string, string>;
  progress?: Record<string, number>;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export type AvatarSlot = 'skin' | 'expression' | 'hair' | 'hairColor' | 'outfit' | 'headwear' | 'face' | 'backdrop' | 'pet';
export type CosmeticSlot = AvatarSlot;

/** The avatar's look: one item id per slot. */
export type Character = Record<AvatarSlot, string>;

export type WeekdayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type PlanCategory = 'health' | 'mind' | 'study' | 'work' | 'money' | 'personal';

export interface PlanItem {
  id: string;
  category?: PlanCategory;
  /** Optional "HH:MM" (24h) start time; items without one sort after timed ones. */
  time?: string;
  text: string;
  /** Set on one-time items ("YYYY-MM-DD"): they show up on that date only and disappear afterwards. */
  date?: string;
  /** Optional short note, e.g. an address or what to bring. */
  note?: string;
}

/** A reusable Monday–Sunday routine. Not tied to any date — the same plan repeats every week. */
export interface WeekPlan {
  days: Record<WeekdayId, PlanItem[]>;
  /** Ticks only count for this ISO week; they clear automatically when a new week starts. */
  checkedWeekKey: string;
  checkedIds: string[];
  /** One-time items (dentist, exam, birthday…), each with a date. Past ones are removed automatically. */
  events?: PlanItem[];
}

export type MoneyKind = 'spending' | 'savings' | 'investing';

/** All money amounts are stored as integer cents to avoid floating-point drift. */
export interface MoneyAccount {
  id: string;
  name: string;
  kind: MoneyKind;
  amount: number;
}

export interface SpendCategory {
  id: string;
  name: string;
  icon: string;
  /** How much may be spent in this category per day, in cents. The daily limit is the sum of these. */
  dailyLimit: number;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  categoryId: string;
  /** Account the money came out of; refunded there if the expense is deleted. */
  accountId?: string;
  note?: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  /** Target amount in cents. */
  target: number;
  /** The savings account that holds this goal's money; progress is that account's balance. */
  accountId: string;
  /** Optional planned saving per week, in cents, used to estimate when the goal is reached. */
  weekly?: number;
  createdAt: string;
}

/** Something you want to buy one day (wishlist). */
export interface WishItem {
  id: string;
  name: string;
  /** Price in cents. */
  price: number;
  icon: string;
  link?: string;
  /** YYYY-MM-DD it was added (for the 24-hour "do I still want it?" rule). */
  addedAt: string;
}

export interface MoneyState {
  currency: string;
  setupDone: boolean;
  accounts: MoneyAccount[];
  categories: SpendCategory[];
  expenses: Expense[];
  goals: SavingsGoal[];
  /** Crypto you hold; values come from live prices (or a price you type in). */
  crypto?: CryptoHolding[];
  /** Last prices fetched, per coin id, in the money currency. Kept so values show offline. */
  cryptoPrices?: { currency: string; fetchedAt: string; prices: Record<string, { price: number; change24h?: number }> };
  /** Bills and subscriptions that come out every month. */
  bills?: Bill[];
  /** Wishlist: things you'd like, before they become savings goals. */
  wishlist?: WishItem[];
  /** Money coming in, used by the money plan (cents per month). */
  income?: { monthly: number; kind: 'allowance' | 'salary' };
  /** Share of income to save, 0–1 (the plan suggests one). */
  saveRate?: number;
}

export interface CryptoHolding {
  id: string;
  /** CoinGecko id, e.g. "bitcoin". */
  coinId: string;
  symbol: string;
  name: string;
  /** How many coins (can be a fraction). */
  amount: number;
  /** What you paid in total, in cents (optional, for profit / loss). */
  invested?: number;
  /** Price per coin in cents, used when live prices aren't available. */
  manualPrice?: number;
}

export interface Bill {
  id: string;
  name: string;
  icon: string;
  /** Monthly amount in cents. */
  amount: number;
  /** Day of the month it's paid (1–31). */
  day: number;
  kind: 'bill' | 'subscription';
  /** Subscription check-up answer: do you really use it? */
  used?: 'yes' | 'rarely';
}

export interface RunRecord {
  id: string;
  date: string;
  km: number;
  seconds: number;
  source: 'gps' | 'manual';
}

export interface NoteEntry {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  color: 'none' | 'amber' | 'sky' | 'emerald' | 'violet' | 'rose';
  createdAt: string;
  updatedAt: string;
}

/** Which of your activity friends see (all on by default). */
export interface Sharing {
  quests: boolean;
  runs: boolean;
  streak: boolean;
  level: boolean;
  badges: boolean;
}

export interface Prefs {
  language: string;
  theme: 'dark' | 'light' | 'system';
  timeFormat: 'auto' | '12' | '24';
  sounds: boolean;
  haptics: boolean;
  reduceMotion: boolean;
  splash: boolean;
  /** Simple mode: hides the extra cards so the app is easy for a first-timer. */
  simple: boolean;
  /** Daily boost card: famous quotes, Bible verses, both, or hidden. */
  daily: 'quotes' | 'verses' | 'both' | 'off';
  /** Motivational reminders (when the app is installed and notifications are allowed). */
  nudges: boolean;
  /** Evening check time for the "you haven't done a quest yet" reminder, HH:MM. */
  nudgeTime: string;
}

export type Accent = 'cyber' | 'amber' | 'ocean' | 'emerald' | 'violet' | 'rose';
export type BgTheme = 'nebula' | 'graphite' | 'midnight' | 'black';
export interface Appearance {
  accent: Accent;
  background: BgTheme;
  /** True once the user picked a theme themselves (so new defaults don't override it). */
  chosen?: boolean;
}

export type FocusArea = 'health' | 'mind' | 'study' | 'money' | 'work' | 'sleep';

export interface Profile {
  name: string;
  focusAreas: FocusArea[];
  wakeTime: string;
  bedTime: string;
}

/** 1 = awful … 5 = great */
export type Mood = 1 | 2 | 3 | 4 | 5;

export interface AppState {
  quests: Quest[];
  goals: LongTermGoal[];
  dayLogs: Record<string, DayLog>;
  weekLogs: Record<string, WeekLog>;
  unlockedAchievements: UnlockedAchievement[];
  lastOpenedDate: string;
  wildcardEnabled: boolean;
  character: Character;
  /** Avatar items bought with shards. */
  unlockedCosmeticIds: string[];
  /** Shards paid for each bought item, so later price changes don't change your balance. */
  purchases?: Record<string, number>;
  /** Avatar items won from reward chests. */
  wonCosmeticIds: string[];
  chestsOpened: number;
  /** Shards granted by chests once every item is already owned. */
  bonusShards: number;
  weekPlan: WeekPlan;
  money: MoneyState;
  /** False only for brand-new users who haven't been through first-run setup. */
  onboarded: boolean;
  profile: Profile;
  /** Daily mood check-in, keyed by YYYY-MM-DD. */
  moods: Record<string, Mood>;
  /** Minutes of focus-timer time completed, keyed by YYYY-MM-DD. */
  focusMinutes: Record<string, number>;
  /** Runs recorded with the run tracker (or added by hand). */
  runs: RunRecord[];
  /** Bumped when built-in content changes, so existing saves get new default quests once. */
  contentVersion: number;
  appearance: Appearance;
  prefs: Prefs;
  /** Free-form notes (the Notes side of the diary). */
  notes: NoteEntry[];
  /** Daily box: last date it was opened, and what it gave. */
  dailyBox: { lastOpened: string | null; lastReward: unknown };
  questSwaps: number;
  /** Skip Passes (rare chest / daily box prize): skip one daily quest without breaking the streak. */
  skipPasses: number;
  /** Getting-started progress and tab explainers already seen (e.g. "visit:plan", "hint:money"). */
  guide?: string[];
  /** Last day the streak pop-up was shown (once a day, on the first quest). */
  streakPopDate?: string;
  /** What friends can see. Money, plans, diary and notes are never shared. */
  sharing?: Sharing;
  streakShields: number;
  /** Days a Streak Shield covered; they count as perfect for the streak only. */
  shieldedDates: string[];
  /** Extra reward chests won from the daily box. */
  bonusChests: number;
  createdAt: string;
}

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  category: string;
  metric: keyof DerivedStats;
  target: number;
  check: (stats: DerivedStats) => boolean;
}

export interface DerivedStats {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalQuestsCompleted: number;
  totalPerfectDays: number;
  goalsCompleted: number;
  daysActive: number;
  availableShards: number;
  /** Reward chests earned so far: one per perfect day, perfect week and level reached. */
  chestsEarned: number;
  chestsAvailable: number;
}
