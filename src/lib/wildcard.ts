import type { Quest } from './types';
import { WILDCARD_POOL } from '../data/wildcardPool';
import { DIFFICULTY_XP } from './xp';

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function buildWildcardQuestForDate(dateKey: string): Quest {
  const seed = WILDCARD_POOL[hashString(dateKey) % WILDCARD_POOL.length];
  return {
    id: `wildcard-${dateKey}`,
    title: seed.title,
    description: seed.description,
    frequency: 'daily',
    difficulty: seed.difficulty,
    xp: DIFFICULTY_XP[seed.difficulty],
    icon: seed.icon,
    category: 'Wildcard',
    custom: false,
    archived: false,
    createdAt: new Date().toISOString(),
    wildcardDate: dateKey,
  };
}
