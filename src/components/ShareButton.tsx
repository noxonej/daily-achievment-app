import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { useIrlStats } from './stats/useIrlStats';
import { shareChallengeCard, shareSavingsCard, shareStatsCard, shareStreakCard, type ShareResult } from '../lib/shareCards';
import { logEvent } from '../lib/analytics';
import { Icon } from './Icon';
import { L } from '../lib/lang';
import type { JoinedChallenge } from '../lib/types';

type Props =
  | { kind: 'stats' }
  | { kind: 'streak'; days: number }
  | { kind: 'challenge'; challenge: JoinedChallenge }
  | { kind: 'savings'; amount: string; goal?: string; pct?: number; hide?: boolean };

/** "Share" for the story cards (B4): Web Share with the image, or a download where that's not possible. */
export function ShareButton(props: Props & { className?: string; label?: string }) {
  const { state, stats } = useApp();
  const irl = useIrlStats();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setNote(null);
    try {
      let r: ShareResult;
      if (props.kind === 'stats') r = await shareStatsCard(state, irl, stats.level);
      else if (props.kind === 'streak') r = await shareStreakCard(props.days);
      else if (props.kind === 'challenge') r = await shareChallengeCard(props.challenge);
      else r = await shareSavingsCard({ amount: props.amount, goal: props.goal, pct: props.pct, hide: !!props.hide });
      if (r !== 'cancelled') logEvent('share');
      if (r === 'downloaded') setNote(L('Image saved. Post it to your story!', 'Paveikslėlis išsaugotas. Įkelk į istoriją!'));
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not share.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-center">
      <button
        onClick={(e) => {
          e.stopPropagation();
          void go();
        }}
        disabled={busy}
        className={props.className ?? 'flex items-center gap-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60'}
      >
        <Icon name="📤" size={14} />
        {busy ? L('Making…', 'Kuriama…') : (props.label ?? L('Share', 'Dalintis'))}
      </button>
      {note && <span className="mt-1 text-[11px] text-slate-400">{note}</span>}
    </span>
  );
}
