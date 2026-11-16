import { useApp } from '../../store/AppContext';
import { SEASON_TIERS, claimedTiers, daysLeftInSeason, seasonKey, seasonLabel, seasonPoints, seasonTheme } from '../../lib/seasons';
import { Icon } from '../Icon';
import { Coin } from '../Coin';

/** This month's season: points from quests and perfect days, three prize tiers, days left. */
export function SeasonCard() {
  const { state, dispatch } = useApp();
  const key = seasonKey();
  const theme = seasonTheme(key);
  const pts = seasonPoints(state, key);
  const claimed = claimedTiers(state, key);
  const max = SEASON_TIERS[SEASON_TIERS.length - 1].points;
  const left = daysLeftInSeason();
  const next = SEASON_TIERS.find((t) => pts < t.points);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <span className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${theme.color}22`, color: theme.color }}>
          <Icon name={theme.icon} size={22} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.color }}>
            Season · {left} {left === 1 ? 'day' : 'days'} left
          </p>
          <p className="font-display font-semibold text-white truncate">{seasonLabel(key)}</p>
          <p className="text-xs text-slate-400">
            {next ? `${next.points - pts} points to ${next.label}. 1 per quest, +3 for a perfect day.` : 'Gold reached. You own this season.'}
          </p>
        </div>
        <span className="font-display text-xl font-bold text-white tabular-nums">{pts}</span>
      </div>

      <div className="relative mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (pts / max) * 100)}%`, background: theme.color }} />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {SEASON_TIERS.map((t, i) => {
          const got = claimed.includes(i);
          const ready = !got && pts >= t.points;
          return (
            <button
              key={t.label}
              disabled={!ready}
              onClick={() => dispatch({ type: 'CLAIM_SEASON_TIER', tier: i })}
              className={`rounded-xl border px-2 py-2 text-center text-[11px] font-semibold ${ready ? 'border-amber-300/60 bg-amber-300/15 text-amber-100 animate-pulse' : 'border-white/[0.06] bg-black/20 text-slate-400'}`}
            >
              <span className="block font-bold text-white">
                {t.label}
                {t.reward.trophy && <Icon name="🏆" size="1em" className="icon-inline !ml-1 text-yellow-300" />}
              </span>
              <span className="flex items-center justify-center gap-1 mt-0.5">
                <Coin size={11} />
                {t.reward.coins}
                {t.reward.chest && ' + chest'}
              </span>
              <span className="block mt-0.5">{got ? 'Claimed ✓' : ready ? 'Tap to claim' : `${t.points} pts`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
