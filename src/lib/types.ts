export type MeasureUnit = 'steps' | 'km' | 'glasses' | 'reps' | 'minutes' | 'pages';

export interface QuestMeasure {
  unit: MeasureUnit;
  target: number;
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
}

/** A reusable Monday–Sunday routine. Not tied to any date — the same plan repeats every week. */
export interface WeekPlan {
  days: Record<WeekdayId, PlanItem[]>;
  /** Ticks only count for this ISO week; they clear automatically when a new week starts. */
  checkedWeekKey: string;
  checkedIds: string[];
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

export interface MoneyState {
  currency: string;
  setupDone: boolean;
  accounts: MoneyAccount[];
  categories: SpendCategory[];
  expenses: Expense[];
  goals: SavingsGoal[];
}

export interface RunRecord {
  id: string;
  date: string;
  km: number;
  seconds: number;
  source: 'gps' | 'manual';
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
