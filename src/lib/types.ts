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

export interface DayLog {
  date: string;
  completedQuestIds: string[];
  xpEarned: number;
  perfectDay: boolean;
  dailyQuestCount: number;
}

export interface WeekLog {
  weekKey: string;
  completedQuestIds: string[];
  xpEarned: number;
  perfectWeek: boolean;
  weeklyQuestCount: number;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export interface AppState {
  quests: Quest[];
  goals: LongTermGoal[];
  dayLogs: Record<string, DayLog>;
  weekLogs: Record<string, WeekLog>;
  unlockedAchievements: UnlockedAchievement[];
  lastOpenedDate: string;
  wildcardEnabled: boolean;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
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
}
