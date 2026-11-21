import { useMemo } from 'react';
import { useApp } from '../../store/AppContext';
import { useFriends } from '../../lib/friends';
import { irlStats, type IrlStats } from '../../lib/irlStats';

/** Your five IRL stats, worked out from your history (cheap: recomputed only when the save changes). */
export function useIrlStats(): IrlStats {
  const { state, stats } = useApp();
  const friends = useFriends().friends.length;
  return useMemo(() => irlStats(state, { friends, longestStreak: stats.longestStreak }), [state, friends, stats.longestStreak]);
}
