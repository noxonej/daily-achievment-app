import type { Achievement, AchievementTier, NumericStat } from '../lib/types';

function threshold(
  id: string,
  title: string,
  description: string,
  icon: string,
  tier: AchievementTier,
  category: string,
  metric: NumericStat,
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
  threshold('quests-2500', 'Living Legend', 'Complete 2500 quests.', '👑', 'legend', 'Quests', 'totalQuestsCompleted', 2500),

  // Streaks
  threshold('streak-3', 'Warming Up', 'Reach a 3 day streak.', '🔥', 'bronze', 'Streaks', 'longestStreak', 3),
  threshold('streak-7', 'One Week Strong', 'Reach a 7 day streak.', '🔥', 'bronze', 'Streaks', 'longestStreak', 7),
  threshold('streak-30', 'Habit Formed', 'Reach a 30 day streak.', '🔥', 'silver', 'Streaks', 'longestStreak', 30),
  threshold('streak-100', 'Iron Will', 'Reach a 100 day streak.', '🔥', 'gold', 'Streaks', 'longestStreak', 100),
  threshold('streak-14', 'Two Week Flame', 'Reach a 14 day streak.', '🔥', 'silver', 'Streaks', 'longestStreak', 14),
  threshold('streak-60', 'On Fire', 'Reach a 60 day streak.', '🔥', 'gold', 'Streaks', 'longestStreak', 60),
  threshold('streak-200', 'Eternal Flame', 'Reach a 200 day streak.', '🔥', 'platinum', 'Streaks', 'longestStreak', 200),
  threshold('streak-365', 'A Full Year', 'Reach a 365 day streak.', '🌟', 'legend', 'Streaks', 'longestStreak', 365),

  // Perfect days
  threshold('perfect-1', 'Perfect Day', 'Complete every daily quest in one day.', '✨', 'bronze', 'Perfection', 'totalPerfectDays', 1),
  threshold('perfect-7', 'Flawless Week', 'Rack up 7 perfect days.', '🌟', 'silver', 'Perfection', 'totalPerfectDays', 7),
  threshold('perfect-30', 'Flawless Month', 'Rack up 30 perfect days.', '💠', 'gold', 'Perfection', 'totalPerfectDays', 30),
  threshold('perfect-100', 'Perfectionist', 'Rack up 100 perfect days.', '💠', 'platinum', 'Perfection', 'totalPerfectDays', 100),
  threshold('perfect-week-1', 'Clean Sweep', 'Finish every weekly quest in one week.', '🧹', 'silver', 'Perfection', 'perfectWeeks', 1),
  threshold('perfect-week-10', 'Weekly Machine', 'Have 10 perfect weeks.', '⚙', 'gold', 'Perfection', 'perfectWeeks', 10),

  // Levels
  threshold('level-5', 'Level 5', 'Reach level 5.', '⭐', 'bronze', 'Levels', 'level', 5),
  threshold('level-10', 'Level 10', 'Reach level 10.', '⭐', 'silver', 'Levels', 'level', 10),
  threshold('level-25', 'Level 25', 'Reach level 25.', '🌠', 'gold', 'Levels', 'level', 25),
  threshold('level-50', 'Level 50', 'Reach level 50.', '☄️', 'platinum', 'Levels', 'level', 50),
  threshold('level-100', 'Level 100', 'Reach level 100.', '🚀', 'legend', 'Levels', 'level', 100),

  // Goals
  threshold('goal-1', 'Dream Chaser', 'Complete your first long-term goal.', '🏆', 'silver', 'Goals', 'goalsCompleted', 1),
  threshold('goal-5', 'Dream Achiever', 'Complete 5 long-term goals.', '🏆', 'gold', 'Goals', 'goalsCompleted', 5),

  // Consistency
  threshold('days-active-30', 'Regular', 'Show up on 30 different days.', '🗓️', 'silver', 'Consistency', 'daysActive', 30),
  threshold('days-active-100', 'Committed', 'Show up on 100 different days.', '📆', 'gold', 'Consistency', 'daysActive', 100),
  threshold('days-active-365', 'A Whole Year', 'Show up on 365 different days.', '🎂', 'platinum', 'Consistency', 'daysActive', 365),

  // Focus
  threshold('focus-60', 'Locked In', 'Focus for 60 minutes in total.', '⏱', 'bronze', 'Focus', 'focusTotal', 60),
  threshold('focus-600', 'Deep Worker', 'Focus for 10 hours in total.', '🧠', 'silver', 'Focus', 'focusTotal', 600),
  threshold('focus-3000', 'Flow State', 'Focus for 50 hours in total.', '🧠', 'gold', 'Focus', 'focusTotal', 3000),
  threshold('focus-10000', 'Master of Focus', 'Focus for 166 hours in total.', '🎯', 'legend', 'Focus', 'focusTotal', 10000),

  // Running
  threshold('km-5', 'First 5K', 'Run 5 km in total.', '🏃', 'bronze', 'Running', 'kmRun', 5),
  threshold('km-42', 'Marathon Legs', 'Run 42 km in total.', '🏃', 'silver', 'Running', 'kmRun', 42),
  threshold('km-250', 'Road Warrior', 'Run 250 km in total.', '👟', 'gold', 'Running', 'kmRun', 250),
  threshold('km-1000', 'Thousand Club', 'Run 1000 km in total.', '🏅', 'legend', 'Running', 'kmRun', 1000),

  // Money
  threshold('savings-1', 'Saver', 'Reach a savings goal.', '🐷', 'silver', 'Money', 'savingsReached', 1),
  threshold('savings-3', 'Money Maker', 'Reach 3 savings goals.', '💰', 'gold', 'Money', 'savingsReached', 3),

  // Life
  threshold('sleep-7', 'Sleep Tracker', 'Log 7 nights of sleep.', '😴', 'bronze', 'Life', 'nightsLogged', 7),
  threshold('sleep-30', 'Well Rested', 'Log 30 nights of sleep.', '🌙', 'silver', 'Life', 'nightsLogged', 30),
  threshold('mood-14', 'Self-Aware', 'Check in your mood on 14 days.', '🙂', 'bronze', 'Life', 'moodDays', 14),
  threshold('mood-100', 'Know Yourself', 'Check in your mood on 100 days.', '😊', 'gold', 'Life', 'moodDays', 100),
  threshold('chest-10', 'Treasure Hunter', 'Open 10 chests.', '🎁', 'silver', 'Collection', 'chestsOpened', 10),
  threshold('chest-50', 'Loot Goblin', 'Open 50 chests.', '👑', 'gold', 'Collection', 'chestsOpened', 50),
];
