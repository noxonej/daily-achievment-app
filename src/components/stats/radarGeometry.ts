import { STAT_IDS, type IrlStats, type StatId } from '../../lib/irlStats';

/** Angle of each stat's axis (Body at the top, then clockwise). */
export function axisAngle(i: number): number {
  return -Math.PI / 2 + (i * 2 * Math.PI) / STAT_IDS.length;
}

export function point(cx: number, cy: number, r: number, i: number): [number, number] {
  const a = axisAngle(i);
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
}

/**
 * The chart's outer ring in levels: a bit above your best stat, rounded to 10, so the shape fills the
 * chart for beginners and still shows differences for strong players.
 */
export function chartMax(stats: IrlStats): number {
  const best = Math.max(...STAT_IDS.map((id) => stats[id].level));
  return Math.min(100, Math.max(10, Math.ceil((best + 2) / 10) * 10));
}

/** 0–1 per stat (a little inner floor so the shape never collapses to a dot). */
export function share(stats: IrlStats, id: StatId, max: number): number {
  return Math.max(0.08, Math.min(1, (stats[id].level + stats[id].progress) / max));
}
