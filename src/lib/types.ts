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
}

export interface WeekLog {
  weekKey: string;
  completedQuestIds: string[];
  xpEarned: number;
  perfectWeek: boolean;
  weeklyQuestCount: number;
  notes?: Record<string, string>;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export type CosmeticSlot = 'outfit' | 'hat' | 'accessory' | 'aura';

export interface Character {
  outfit: string;
  hat: string;
  accessory: string;
  aura: string;
}

export interface AppState {
  quests: Quest[];
  goals: LongTermGoal[];
  dayLogs: Record<string, DayLog>;
  weekLogs: Record<string, WeekLog>;
  unlockedAchievements: UnlockedAchievement[];
  lastOpenedDate: string;
  wildcardEnabled: boolean;
  character: Character;
  unlockedCosmeticIds: string[];
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
}
