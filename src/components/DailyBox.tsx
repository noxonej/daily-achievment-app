import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useBackToClose } from '../lib/backstack';
import { t } from '../lib/prefs';
import { doneByHand } from '../store/reducer';
import { useApp } from '../store/AppContext';
import { ownership } from '../store/reducer';
import { todayKey } from '../lib/date';
import { boxPool, findItem, normalizeLook, RARITY } from '../data/avatar';
import { rewardInfo, rollBox, type BoxReward } from '../lib/dailyBox';
import { useDailyResetLabel } from '../lib/useResetCountdown';
import { Avatar } from './Avatar';
import { Confetti } from './Confetti';
import { Icon } from './Icon';
import { Gift } from './fx/Gift';
import { OpenBurst, PrizeHalo, StageLight } from './fx/RewardFx';

/** The daily box art (kept for other screens): the pixel gift on its plinth. */
export function BoxArt(props: { size?: number; glow?: boolean; sparkle?: boolean; lid?: 'on' | 'off'; locked?: boolean }) {
  return <Gift size={props.size} locked={props.locked} phase={props.lid === 'off' ? 'open' : props.glow ? 'ready' : 'idle'} />;
}

/**
 * Today screen card (redesigned 2026-11-16): the box is the hero, sitting on its own lit plinth.
 * Unlock by finishing one quest, open once per day.
 */
export function DailyBoxCard() {
  const { state } = useApp();
  const [opening, setOpening] = useState(false);
  const resetLabel = useDailyResetLabel();
  const today = todayKey();
  const doneToday = doneByHand(state.dayLogs[today]);
  const opened = state.dailyBox?.lastOpened === today;
  const ready = !opened && doneToday > 0;
  const last = opened ? (state.dailyBox.lastReward as BoxReward | null) : null;
  const info = last ? rewardInfo(last) : null;

  return (
    <>
      <div className={`dbox-card relative overflow-hidden rounded-[24px] p-3 flex items-center gap-3.5 ${ready ? 'is-ready' : ''}`}>
        <button
          onClick={() => ready && setOpening(true)}
          disabled={!ready}
          aria-label={ready ? 'Open the daily box' : 'Daily box'}
          className="dbox-stage shrink-0 w-[92px] h-[92px] rounded-[18px] flex items-end justify-center pb-1"
        >
          <Gift size={80} phase={ready ? 'ready' : opened ? 'opened' : 'idle'} locked={!ready && !opened} />
        </button>
        <div className="flex-1 min-w-0 py-1">
          <p className="px-label text-[9px] text-amber-300">{t('box.title')}</p>
          {opened && info ? (
            <>
              <p className="mt-1.5 font-display text-[16px] font-semibold text-white leading-snug truncate">
                <Icon name={info.icon} size="1.05em" className={`icon-inline ${info.tone}`} />
                {last?.kind === 'cosmetic' ? findItem(last.itemId)?.name ?? info.title : info.title}
              </p>
              <p className="mt-0.5 text-[12px] text-slate-400">{t('box.next', { t: resetLabel })}</p>
            </>
          ) : ready ? (
            <>
              <p className="mt-1.5 font-display text-[16px] font-semibold text-white leading-snug">{t('box.ready')}</p>
              <p className="mt-0.5 text-[12px] text-slate-400 leading-snug">{t('box.readySub')}</p>
            </>
          ) : (
            <>
              <p className="mt-1.5 font-display text-[16px] font-semibold text-white leading-snug">{t('box.locked')}</p>
              <p className="mt-0.5 text-[12px] text-slate-400 leading-snug">{t('box.lockedSub')}</p>
            </>
          )}
        </div>
        {ready && (
          <button onClick={() => setOpening(true)} className="shrink-0 self-center rounded-full bg-amber-500 hover:bg-amber-400 text-[#fff] text-[14px] font-bold px-4 py-2.5 active:scale-95 transition">
            {t('box.open')}
          </button>
        )}
      </div>
      {/* Rendered on <body> so no card animation underneath can show through or clip it. */}
      {opening && createPortal(<BoxOpening onClose={() => setOpening(false)} />, document.body)}
    </>
  );
}

function BoxOpening({ onClose }: { onClose: () => void }) {
  const { state, stats, dispatch } = useApp();
  // closed → shake (anticipation) → burst (lid flies off, light pours out) → reveal
  const [phase, setPhase] = useState<'closed' | 'shake' | 'burst' | 'reveal'>('closed');
  const [reward, setReward] = useState<BoxReward | null>(null);
  const busy = phase === 'shake' || phase === 'burst';

  useBackToClose(true, () => !busy && onClose());

  function open() {
    if (phase !== 'closed') return;
    const r = rollBox(boxPool(ownership(state, stats)));
    // Saved on tap, before the animation, so closing or reloading can't re-roll today's box.
    dispatch({ type: 'OPEN_DAILY_BOX', reward: r });
    setReward(r);
    setPhase('shake');
    try {
      navigator.vibrate?.([20, 60, 20, 60, 30]);
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
    }, 750);
    setTimeout(() => setPhase('reveal'), 1500);
  }

  const info = reward ? rewardInfo(reward) : null;
  const item = reward?.kind === 'cosmetic' ? findItem(reward.itemId) : undefined;
  const mythic = RARITY.mythic;

  return (
    <div data-overlay className="theme-dark box-stage fixed inset-0 z-[80] flex flex-col items-center justify-center px-6 backdrop-in">
      <StageLight tint="#ffe2a8" lit={phase === 'burst' || phase === 'reveal'} />
      <span className="box-stage-floor" aria-hidden="true" />
      {!busy && (
        <button onClick={onClose} aria-label="Close" className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10">
          <Icon name="✕" size={20} />
        </button>
      )}
      {phase !== 'reveal' ? (
        <button onClick={open} className="relative flex flex-col items-center" aria-label="Open box">
          <div className="relative">
            {phase === 'burst' && <OpenBurst color="#fcd34d" coins={10} />}
            <Gift size={240} phase={phase === 'closed' ? 'ready' : phase === 'shake' ? 'shake' : 'open'} />
          </div>
          <p className={`mt-5 px-label text-[11px] text-amber-200 transition-opacity duration-300 ${busy ? 'opacity-0' : ''}`}>Daily box</p>
          <p className={`mt-2 font-display text-[26px] font-semibold text-white transition-opacity duration-300 ${busy ? 'opacity-0' : ''}`}>Tap to open</p>
          <p className={`text-[13px] text-slate-400 mt-1 transition-opacity duration-300 ${busy ? 'opacity-0' : ''}`}>1 in 50 boxes hides a mythic item</p>
        </button>
      ) : (
        info && (
          <div className="relative flex flex-col items-center text-center">
            {item && <Confetti count={60} />}
            {item ? (
              <div className="relative">
                <PrizeHalo color={mythic.hex} big />
                <div className="prize-card relative rounded-[28%] p-1.5 animate-prize-in" style={{ background: 'linear-gradient(160deg,#a5b4fc,#6d5bd0)', boxShadow: '0 24px 50px -20px #000' }}>
                  <Avatar look={{ ...normalizeLook(state.character), [item.slot]: item.id }} size={180} />
                </div>
              </div>
            ) : (
              <div className="relative">
                <PrizeHalo color="#fcd34d" />
                <div className="prize-card relative w-36 h-36 rounded-[30%] bg-gradient-to-b from-[#26324a] to-[#141a28] ring-1 ring-white/15 flex items-center justify-center animate-prize-in shadow-[0_24px_50px_-20px_#000]">
                  <Icon name={info.icon} size={64} strokeWidth={1.6} className={info.tone} />
                </div>
              </div>
            )}
            <div className="-mt-4 relative z-[-1]">
              <Gift size={132} phase="opened" />
            </div>
            <p className={`mt-3 px-label text-[10px] fade-up ${item ? mythic.text : 'text-amber-200'}`}>{item ? 'Mythic · daily box exclusive' : "Today's prize"}</p>
            <p className="font-display text-3xl font-semibold text-white mt-2 fade-up [animation-delay:.1s]">{item ? item.name : info.title}</p>
            <p className="text-sm text-slate-400 mt-1.5 max-w-xs fade-up [animation-delay:.15s]">{info.text}</p>
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
              <button onClick={onClose} className="rounded-2xl bg-white/10 border border-white/10 text-white font-semibold px-5 py-3">
                {item ? 'Later' : 'Nice!'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-5">Come back tomorrow for another box.</p>
          </div>
        )
      )}
    </div>
  );
}
