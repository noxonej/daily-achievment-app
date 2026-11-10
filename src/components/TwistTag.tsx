import type { Quest } from '../lib/types';
import { Icon } from './Icon';

/** Small tag under a quest's name when today's version is a daily twist. */
export function TwistTag({ quest }: { quest: Quest }) {
  if (!quest.twist) return null;
  return (
    <span
      title={`Usually: ${quest.twist.baseTitle}`}
      className="inline-flex items-center gap-1 mt-1 rounded-full bg-sky-500/10 border border-sky-400/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-200"
    >
      <Icon name="🔀" size={10} className="shrink-0" />
      Today's twist
    </span>
  );
}
