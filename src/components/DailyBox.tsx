import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBackToClose } from '../lib/backstack';
import { t } from '../lib/prefs';
import { doneByHand } from '../store/reducer';
import { useApp } from '../store/AppContext';
import { ownership } from '../store/reducer';
import { todayKey } from '../lib/date';
import { boxPool, chestPool, findItem, normalizeLook, RARITY } from '../data/avatar';
import { BOX_ODDS, jackpotPool, rewardInfo, rollBox, type BoxReward } from '../lib/dailyBox';
import { CHECKIN_REWARDS, PERFECT_WEEK_BONUS, checkInRewardInfo, checkInView } from '../lib/checkIn';
import { useDailyResetLabel } from '../lib/useResetCountdown';
import { DECOR, DECOR_SLOTS, VEHICLES, partsOf, vehicleHex, worldOf } from '../world/catalog';
import { VehicleDraw } from '../world/VehicleDraw';
import { HomeThumb } from '../world/room/Room';
import { Avatar } from './Avatar';
import { Confetti } from './Confetti';
import { Icon } from './Icon';
import { Burst } from './fx/Burst';
import { Gift } from './fx/Gift';
import { OpenBurst, PrizeHalo, StageLight } from './fx/RewardFx';

/** The daily box art (kept for other screens): the pixel gift on its plinth. */
export function BoxArt(props: { size?: number; glow?: boolean; sparkle?: boolean; lid?: 'on' | 'off'; locked?: boolean }) {
  return <Gift size={props.size} locked={props.locked} phase={props.lid === 'off' ? 'open' : props.glow ? 'ready' : 'idle'} />;
}

/** Old name, same card. */
export const DailyBoxCard = DailyRewardCard;

/**
 * Daily reward (redesigned 2026-11-22): one card for both daily prizes.
 * Step 1: claim today's check-in on the 7-day track (just for showing up).
 * Step 2: finish one quest and open today's box, which has a 1-in-100 World jackpot.
 */
export function DailyRewardCard() {
  const { state, dispatch } = useApp();
  const [opening, setOpening] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const resetLabel = useDailyResetLabel();
  const today = todayKey();
  const v = checkInView(state, today);
  const doneToday = doneByHand(state.dayLogs[today]);
  const boxOpened = state.dailyBox?.lastOpened === today;
  const boxReady = !boxOpened && doneToday > 0;
  const last = boxOpened ? (state.dailyBox.lastReward as BoxReward | null) : null;
  const lastInfo = last ? rewardInfo(last) : null;
  const claimNow = !v.claimedToday;
  const todayCheck = checkInRewardInfo(CHECKIN_REWARDS[(claimNow ? v.nextDay : v.filled) - 1]);
  const allDone = v.claimedToday && boxOpened;
  const hot = claimNow || boxReady;

  function claim() {
    if (v.claimedToday) return;
    dispatch({ type: 'CLAIM_CHECK_IN' });
    setJustClaimed(true);
    try {
      navigator.vibrate?.([15, 40, 30]);
    } catch {
      // optional
    }
  }

  const title = claimNow
    ? t('dr.claimTitle', { n: v.nextDay })
    : boxReady
      ? t('dr.boxReady')
      : boxOpened && lastInfo
        ? last?.kind === 'cosmetic'
          ? findItem(last.itemId)?.name ?? lastInfo.title
          : lastInfo.title
        : t('dr.boxLocked');
  const sub = claimNow
    ? t('dr.claimSub', { x: todayCheck.title.toLowerCase() })
    : boxReady
      ? t('dr.boxReadySub')
      : allDone
        ? t('dr.next', { t: resetLabel })
        : justClaimed
          ? t('checkin.got', { x: todayCheck.title.toLowerCase() })
          : t('dr.boxLockedSub');

  return (
    <>
      <section aria-label={t('dr.title')} className={`drc relative overflow-hidden rounded-[26px] ${hot ? 'is-hot' : ''} ${last?.kind === 'jackpot' ? 'is-jackpot' : ''}`}>
        <span className="drc-sheen" aria-hidden="true" />
        <div className="relative flex items-center gap-3.5 p-3.5 pb-0">
          <button
            onClick={() => (claimNow ? claim() : boxReady && setOpening(true))}
            disabled={!hot}
            aria-label={claimNow ? t('checkin.claim') : boxReady ? t('dr.open') : t('dr.title')}
            className="drc-stage shrink-0 w-[96px] h-[96px] rounded-[20px] flex items-end justify-center pb-1"
          >
            <Gift size={84} phase={hot ? 'ready' : boxOpened ? 'opened' : 'idle'} locked={!hot && !boxOpened} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="px-label text-[9px] text-amber-300">{t('dr.title')}</p>
              <span className="drc-chip px-label text-[8px]">{t('dr.dayOf', { n: claimNow ? v.nextDay : v.filled })}</span>
            </div>
            <p className="mt-1.5 font-display text-[17px] font-semibold text-white leading-snug line-clamp-2">
              {boxOpened && lastInfo && !claimNow && !boxReady && <Icon name={lastInfo.icon} size="1em" className={`icon-inline ${lastInfo.tone}`} />}
              {title}
            </p>
            <p className="mt-0.5 text-[12.5px] text-slate-400 leading-snug">{sub}</p>
          </div>
        </div>

        {/* The 7-day track: one pip a day, day 7 is a chest. */}
        <ol className="relative mt-3.5 mx-3.5 grid grid-cols-7 gap-1.5" aria-label={t('checkin.week')}>
          {CHECKIN_REWARDS.map((r, i) => {
            const day = i + 1;
            const info = checkInRewardInfo(r);
            const done = day <= v.filled;
            const now = claimNow && day === v.nextDay;
            const big = day === 7;
            return (
              <li
                key={day}
                aria-label={`${t('checkin.day', { n: day, x: info.title })}${done ? `, ${t('checkin.claimed')}` : now ? `, ${t('checkin.ready')}` : ''}`}
                className={`drc-pip relative ${done ? 'is-done' : now ? 'is-now' : ''} ${big ? 'is-big' : ''}`}
              >
                {done && justClaimed && day === v.filled && <Burst x="50%" y="45%" color="var(--color-amber-400)" size={0.9} sparks={10} />}
                {done ? (
                  <Icon name="✓" size={15} strokeWidth={3} className="drc-pip-check" />
                ) : (
                  <Icon name={info.icon} size={big ? 17 : 15} className={big ? 'text-fuchsia-300' : r.kind === 'shards' ? '' : 'text-sky-300'} />
                )}
                <span className="drc-pip-day num-px">{day}</span>
              </li>
            );
          })}
        </ol>

        <div className="relative p-3.5 pt-3">
          {claimNow ? (
            <button onClick={claim} className="drc-cta w-full rounded-2xl py-3 text-[15px] font-bold active:scale-[0.98] transition">
              {t('dr.claimBtn', { x: todayCheck.title })}
            </button>
          ) : boxReady ? (
            <button onClick={() => setOpening(true)} className="drc-cta w-full rounded-2xl py-3 text-[15px] font-bold active:scale-[0.98] transition">
              {t('dr.open')}
            </button>
          ) : (
            <div className="drc-steps flex items-center gap-2 text-[12px]">
              <span className="drc-step is-done">
                <Icon name="✓" size={13} strokeWidth={3} /> {t('dr.stepCheck')}
              </span>
              <span className={`drc-step ${boxOpened ? 'is-done' : ''}`}>
                {boxOpened ? <Icon name="✓" size={13} strokeWidth={3} /> : <Icon name="🔒" size={13} />} {t('dr.stepBox')}
              </span>
              <span className="ml-auto text-slate-500 tabular-nums">{t('dr.in', { t: resetLabel })}</span>
            </div>
          )}
          <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-slate-400">
            <Icon name="✨" size={13} className="text-yellow-300 shrink-0" />
            <span className="min-w-0">
              {t('dr.jackpotLine')}
              {v.perfectPossible && v.filled < 7 && !allDone && <> · {t('dr.week', { n: PERFECT_WEEK_BONUS })}</>}
            </span>
          </p>
        </div>
      </section>
      {/* Rendered on <body> so no card animation underneath can show through or clip it. */}
      {opening && createPortal(<BoxOpening onClose={() => setOpening(false)} />, document.body)}
    </>
  );
}

function JackpotArt({ reward }: { reward: Extract<BoxReward, { kind: 'jackpot' }> }) {
  const { state } = useApp();
  const world = worldOf(state);
  if (reward.what === 'vehicle') {
    const v = VEHICLES.find((x) => x.id === reward.id);
    if (v) return <VehicleDraw vehicle={v} hex={vehicleHex(world, v)} parts={partsOf(world, v)} spin className="w-[200px] h-auto" />;
  }
  if (reward.what === 'home') return <HomeThumb id={reward.id} className="w-[208px] h-[140px] rounded-[18px]" />;
  const d = DECOR.find((x) => x.id === reward.id);
  return (
    <span className="flex flex-col items-center gap-2">
      <Icon name={DECOR_SLOTS.find((x) => x.id === d?.slot)?.icon ?? '🛋'} size={72} strokeWidth={1.6} className="text-white" />
      {d?.color && <span className="w-16 h-3 rounded-full ring-2 ring-white/50" style={{ background: d.color }} />}
    </span>
  );
}

function BoxOpening({ onClose }: { onClose: () => void }) {
  const { state, stats, dispatch } = useApp();
  // closed → shake (anticipation) → burst (lid flies off, light pours out) → reveal
  const [phase, setPhase] = useState<'closed' | 'shake' | 'burst' | 'reveal'>('closed');
  const [reward, setReward] = useState<BoxReward | null>(null);
  const [showOdds, setShowOdds] = useState(false);
  const busy = phase === 'shake' || phase === 'burst';
  const ctx = useMemo(() => ownership(state, stats), [state, stats]);

  useBackToClose(true, () => !busy && onClose());

  function open() {
    if (phase !== 'closed') return;
    const r = rollBox(boxPool(ctx), Math.random, jackpotPool(worldOf(state), stats.level), chestPool(ctx));
    // Saved on tap, before the animation, so closing or reloading can't re-roll today's box.
    dispatch({ type: 'OPEN_DAILY_BOX', reward: r });
    setReward(r);
    setShowOdds(false);
    setPhase('shake');
    try {
      navigator.vibrate?.(r.kind === 'jackpot' ? [30, 50, 30, 50, 30, 50, 80] : [20, 60, 20, 60, 30]);
    } catch {
      // optional
    }
    setTimeout(() => {
      setPhase('burst');
      try {
        navigator.vibrate?.(60);
      } catch {
        // optional
      }
    }, r.kind === 'jackpot' ? 1100 : 750);
    setTimeout(() => setPhase('reveal'), r.kind === 'jackpot' ? 2000 : 1500);
  }

  const info = reward ? rewardInfo(reward) : null;
  const item = reward?.kind === 'cosmetic' ? findItem(reward.itemId) : undefined;
  const jackpot = reward?.kind === 'jackpot' ? reward : null;
  const tier = jackpot ? 'jackpot' : item ? 'mythic' : reward?.kind === 'chest' || (reward?.kind === 'xpBoost' && reward.multiplier >= 2) || (reward?.kind === 'shards' && reward.amount >= 100) ? 'rare' : 'common';
  const tint = tier === 'jackpot' ? '#fde047' : tier === 'mythic' ? RARITY.mythic.hex : tier === 'rare' ? '#7dd3fc' : '#fcd34d';
  const tierLabel = tier === 'jackpot' ? t('dr.tierJackpot') : tier === 'mythic' ? t('dr.tierMythic') : tier === 'rare' ? t('dr.tierRare') : t('dr.tierPrize');

  return (
    <div data-overlay className={`theme-dark box-stage fixed inset-0 z-[80] flex flex-col items-center justify-center px-6 backdrop-in ${jackpot && phase !== 'closed' ? 'is-jackpot' : ''}`}>
      <StageLight tint={phase === 'closed' ? '#ffe2a8' : tint} lit={phase === 'burst' || phase === 'reveal'} />
      <span className="box-stage-floor" aria-hidden="true" />
      {!busy && (
        <button onClick={onClose} aria-label="Close" className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10">
          <Icon name="✕" size={20} />
        </button>
      )}
      {phase !== 'reveal' ? (
        <div className="relative flex flex-col items-center">
          <button onClick={open} className="relative flex flex-col items-center" aria-label="Open box">
            <div className="relative">
              {phase === 'burst' && <OpenBurst color={tint} coins={jackpot ? 18 : 10} />}
              <Gift size={232} phase={phase === 'closed' ? 'ready' : phase === 'shake' ? 'shake' : 'open'} />
            </div>
            <p className={`mt-5 px-label text-[11px] text-amber-200 transition-opacity duration-300 ${busy ? 'opacity-0' : ''}`}>{t('dr.title')}</p>
            <p className={`mt-2 font-display text-[28px] font-semibold text-white transition-opacity duration-300 ${busy ? 'opacity-0' : ''}`}>{t('dr.tap')}</p>
          </button>
          <button
            onClick={() => setShowOdds((s) => !s)}
            className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] text-slate-300 bg-white/[0.06] ring-1 ring-white/10 transition-opacity duration-300 ${busy ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <Icon name="✨" size={13} className="text-yellow-300" />
            {t('dr.inside')}
            <Icon name="▾" size={13} className={`transition-transform ${showOdds ? 'rotate-180' : ''}`} />
          </button>
          {showOdds && !busy && (
            <ul className="mt-3 w-[min(320px,86vw)] rounded-2xl bg-white/[0.05] ring-1 ring-white/10 divide-y divide-white/[0.06] fade-up">
              {BOX_ODDS.map((o) => (
                <li key={o.label} className="flex items-center justify-between gap-3 px-3.5 py-2 text-[12.5px]">
                  <span className="text-slate-300">{o.label}</span>
                  <span className={`num-px text-[15px] ${o.tone}`}>{o.pct}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        info && (
          <div className="relative flex flex-col items-center text-center">
            {(item || jackpot) && <Confetti count={jackpot ? 110 : 60} />}
            <p className={`px-label text-[10px] mb-5 fade-up ${tier === 'jackpot' ? 'drc-jackpot-label' : ''}`} style={{ color: tint }}>
              {tierLabel}
            </p>
            {jackpot ? (
              <div className="relative">
                <PrizeHalo color={tint} big />
                <div className="prize-card drc-jackpot-card relative w-[236px] min-h-[180px] rounded-[30px] flex items-center justify-center p-3 animate-prize-in">
                  <JackpotArt reward={jackpot} />
                </div>
              </div>
            ) : item ? (
              <div className="relative">
                <PrizeHalo color={tint} big />
                <div className="prize-card relative rounded-[28%] p-1.5 animate-prize-in" style={{ background: 'linear-gradient(160deg,#a5b4fc,#6d5bd0)', boxShadow: '0 24px 50px -20px #000' }}>
                  <Avatar look={{ ...normalizeLook(state.character), [item.slot]: item.id }} size={180} />
                </div>
              </div>
            ) : (
              <div className="relative">
                <PrizeHalo color={tint} />
                <div className="prize-card drc-prize relative w-36 h-36 rounded-[30%] flex items-center justify-center animate-prize-in" style={{ ['--tint' as string]: tint }}>
                  <Icon name={info.icon} size={64} strokeWidth={1.6} className={info.tone} />
                </div>
              </div>
            )}
            <p className="font-display text-[30px] font-semibold text-white mt-6 fade-up [animation-delay:.1s]">{item ? item.name : info.title}</p>
            <p className="text-sm text-slate-400 mt-1.5 max-w-xs fade-up [animation-delay:.15s]">{jackpot ? t('dr.jackpotText', { x: info.text }) : info.text}</p>
            <div className="flex gap-2.5 mt-7 fade-up [animation-delay:.2s]">
              {item && (
                <button
                  onClick={() => {
                    dispatch({ type: 'EQUIP_COSMETIC', slot: item.slot, itemId: item.id });
                    onClose();
                  }}
                  className="rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold px-5 py-3"
                >
                  Wear it
                </button>
              )}
              <button onClick={onClose} className={`rounded-2xl font-semibold px-6 py-3 ${jackpot ? 'drc-cta' : 'bg-white/10 border border-white/10 text-white'}`}>
                {item ? 'Later' : jackpot ? t('dr.awesome') : 'Nice!'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-5">{t('dr.comeBack')}</p>
          </div>
        )
      )}
    </div>
  );
}
