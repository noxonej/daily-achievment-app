import type { Achievement, AchievementTier, DerivedStats } from '../lib/types';

function threshold(
  id: string,
  title: string,
  description: string,
  icon: string,
  tier: AchievementTier,
  category: string,
  metric: keyof DerivedStats,
  target: number,
): Achievement {
  return { id, title, description, icon, tier, category, metric, target, check: (s) => s[metric] >= target };
}

export const ACHIEVEMENTS: Achievement[] = [
  // Quests
  threshold('first-quest', 'First Steps', 'Complete your first quest.', '🌱', 'bronze', 'Quests', 'totalQuestsCompleted', 1),
  threshold('quests-25', 'Getting Started', 'Complete 25 quests.', '⚔️', 'bronze', 'Quests', 'totalQuestsCompleted', 25),
  threshold('quests-100', 'Centurion', 'Complete 100 quests.', '🛡️', 'silver', 'Quests', 'totalQuestsCompleted', 100),
  threshold('quests-500', 'Relentless', 'Complete 500 quests.', '🗡️', 'gold', 'Quests', 'totalQuestsCompleted', 500),
  threshold('quests-1000', 'Unstoppable', 'Complete 1000 quests.', '👑', 'platinum', 'Quests', 'totalQuestsCompleted', 1000),

  // Streaks
  threshold('streak-3', 'Warming Up', 'Reach a 3 day streak.', '🔥', 'bronze', 'Streaks', 'longestStreak', 3),
  threshold('streak-7', 'One Week Strong', 'Reach a 7 day streak.', '🔥', 'bronze', 'Streaks', 'longestStreak', 7),
  threshold('streak-30', 'Habit Formed', 'Reach a 30 day streak.', '🔥', 'silver', 'Streaks', 'longestStreak', 30),
  threshold('streak-100', 'Iron Will', 'Reach a 100 day streak.', '🔥', 'gold', 'Streaks', 'longestStreak', 100),
  threshold('streak-365', 'A Full Year', 'Reach a 365 day streak.', '🌟', 'platinum', 'Streaks', 'longestStreak', 365),

  // Perfect days
  threshold('perfect-1', 'Perfect Day', 'Complete every daily quest in one day.', '✨', 'bronze', 'Perfection', 'totalPerfectDays', 1),
  threshold('perfect-7', 'Flawless Week', 'Rack up 7 perfect days.', '💎', 'silver', 'Perfection', 'totalPerfectDays', 7),
  threshold('perfect-30', 'Flawless Month', 'Rack up 30 perfect days.', '💠', 'gold', 'Perfection', 'totalPerfectDays', 30),

  // Levels
  threshold('level-5', 'Level 5', 'Reach level 5.', '⭐', 'bronze', 'Levels', 'level', 5),
  threshold('level-10', 'Level 10', 'Reach level 10.', '⭐', 'silver', 'Levels', 'level', 10),
  threshold('level-25', 'Level 25', 'Reach level 25.', '🌠', 'gold', 'Levels', 'level', 25),
  threshold('level-50', 'Level 50', 'Reach level 50.', '☄️', 'platinum', 'Levels', 'level', 50),

  // Goals
  threshold('goal-1', 'Dream Chaser', 'Complete your first long-term goal.', '🏆', 'silver', 'Goals', 'goalsCompleted', 1),
  threshold('goal-5', 'Dream Achiever', 'Complete 5 long-term goals.', '🏆', 'gold', 'Goals', 'goalsCompleted', 5),

  // Consistency
  threshold('days-active-30', 'Regular', 'Show up on 30 different days.', '🗓️', 'silver', 'Consistency', 'daysActive', 30),
  threshold('days-active-365', 'A Whole Year', 'Show up on 365 different days.', '🎂', 'platinum', 'Consistency', 'daysActive', 365),
];
