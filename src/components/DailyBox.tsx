import { useState } from 'react';
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
import { PixelGift } from './PixelArt';
import { Coin } from './Coin';

/** The daily box: a pixel-art violet gift with a gold ribbon and bow. */
export function BoxArt(props: { size?: number; glow?: boolean; sparkle?: boolean; lid?: 'on' | 'off'; locked?: boolean }) {
  return <PixelGift {...props} />;
}

/** Today screen card: unlock by finishing one quest, open once per day. */
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
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 flex items-center gap-4 ${
          ready ? 'border-violet-400/50 bg-violet-500/[0.08] shadow-[0_0_30px_-12px_rgba(167,139,250,0.8)]' : 'border-white/10 bg-white/[0.03]'
        }`}
      >
        <button
          onClick={() => ready && setOpening(true)}
          disabled={!ready}
          aria-label={ready ? 'Open the daily box' : 'Daily box'}
          className={`shrink-0 ${ready ? 'animate-float-soft' : opened ? 'opacity-70' : ''}`}
        >
          <BoxArt size={64} glow={ready} sparkle={ready} locked={!ready && !opened} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-violet-300">{t('box.title')}</p>
          {opened && info ? (
            <>
              <p className="font-display font-bold text-white truncate">
                <Icon name={info.icon} size="1.05em" className={`icon-inline ${info.tone}`} />
                {last?.kind === 'cosmetic' ? findItem(last.itemId)?.name ?? info.title : info.title}
              </p>
              <p className="text-xs text-slate-400">{t('box.next', { t: resetLabel })}</p>
            </>
          ) : ready ? (
            <>
              <p className="font-display font-bold text-white">{t('box.ready')}</p>
              <p className="text-xs text-slate-400">{t('box.readySub')}</p>
            </>
          ) : (
            <>
              <p className="font-display font-bold text-white">{t('box.locked')}</p>
              <p className="text-xs text-slate-400">{t('box.lockedSub')}</p>
            </>
          )}
        </div>
        {ready && (
          <button onClick={() => setOpening(true)} className="shrink-0 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold px-4 py-2.5">
            {t('box.open')}
          </button>
        )}
      </div>
      {opening && <BoxOpening onClose={() => setOpening(false)} />}
    </>
  );
}

function BoxOpening({ onClose }: { onClose: () => void }) {
  const { state, stats, dispatch } = useApp();
  // closed → shake (anticipation) → burst (lid flies off, light, particles) → reveal
  const [phase, setPhase] = useState<'closed' | 'shake' | 'burst' | 'reveal'>('closed');
  const [reward, setReward] = useState<BoxReward | null>(null);
  const busy = phase === 'shake' || phase === 'burst';

  useBackToClose(true, () => !busy && onClose());

  function open() {
    if (phase !== 'closed') return;
    const r = rollBox(boxPool(ownership(state, stats)));
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
    setTimeout(() => {
      dispatch({ type: 'OPEN_DAILY_BOX', reward: r });
      setPhase('reveal');
    }, 1350);
  }

  const info = reward ? rewardInfo(reward) : null;
  const item = reward?.kind === 'cosmetic' ? findItem(reward.itemId) : undefined;
  const mythic = RARITY.mythic;

  return (
    <div data-overlay className="theme-dark fixed inset-0 z-[80] bg-black/[0.92] flex flex-col items-center justify-center px-6 backdrop-in">
      {!busy && (
        <button onClick={onClose} aria-label="Close" className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10">
          <Icon name="✕" size={20} />
        </button>
      )}
      {phase !== 'reveal' ? (
        <button onClick={open} className="relative flex flex-col items-center" aria-label="Open box">
          <div className="relative">
            {phase === 'burst' && (
              <>
                <span className="box-beam" aria-hidden="true" />
                <span className="open-flash" aria-hidden="true" />
                <span className="box-shockwave" aria-hidden="true" />
                {Array.from({ length: 10 }, (_, i) => (
                  <span
                    key={`c${i}`}
                    className="coin-fly"
                    aria-hidden="true"
                    style={{ ['--dx' as string]: `${(i % 2 ? 1 : -1) * (25 + ((i * 41) % 100))}px`, ['--up' as string]: `${110 + ((i * 47) % 80)}px`, animationDelay: `${(i % 5) * 0.05}s` }}
                  >
                    <Coin size={20} />
                  </span>
                ))}
                {Array.from({ length: 16 }, (_, i) => {
                  const a = (i / 16) * Math.PI * 2;
                  const d = 110 + (i % 3) * 28;
                  return (
                    <span
                      key={i}
                      className="box-particle"
                      aria-hidden="true"
                      style={{ ['--dx' as string]: `${Math.cos(a) * d}px`, ['--dy' as string]: `${Math.sin(a) * d - 40}px`, animationDelay: `${(i % 4) * 0.03}s` }}
                    />
                  );
                })}
              </>
            )}
            <div className={phase === 'closed' ? 'animate-float-soft' : phase === 'shake' ? 'box-shake' : 'box-pop'}>
              <BoxArt size={220} glow sparkle={phase === 'closed'} lid={phase === 'burst' ? 'off' : 'on'} />
            </div>
          </div>
          <p className={`mt-6 font-display text-2xl font-extrabold text-white transition-opacity duration-300 ${busy ? 'opacity-0' : ''}`}>Tap to open</p>
          <p className={`text-sm text-slate-400 mt-1 transition-opacity duration-300 ${busy ? 'opacity-0' : ''}`}>1 in 50 boxes hides a mythic item</p>
        </button>
      ) : (
        info && (
          <div className="relative flex flex-col items-center text-center">
            {item && <Confetti count={60} />}
            {item ? (
              <div className="relative">
                <div className="absolute inset-[-60px] rounded-full prize-rays" style={{ ['--ray' as string]: mythic.hex }} />
                <div className="relative rounded-[28%] p-1.5 animate-prize-in" style={{ background: 'linear-gradient(135deg,#67e8f9,#a78bfa,#f0abfc)', boxShadow: `0 0 70px -6px ${mythic.hex}` }}>
                  <Avatar look={{ ...normalizeLook(state.character), [item.slot]: item.id }} size={180} />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-[-50px] rounded-full prize-rays" style={{ ['--ray' as string]: '#a78bfa' }} />
                <div className="relative w-36 h-36 rounded-[30%] bg-gradient-to-br from-white/[0.12] to-white/[0.03] border border-white/15 flex items-center justify-center animate-prize-in shadow-[0_0_60px_-10px_rgba(167,139,250,0.7)]">
                  <Icon name={info.icon} size={64} strokeWidth={1.6} className={info.tone} />
                </div>
              </div>
            )}
            <p className={`mt-7 text-xs font-black uppercase tracking-[0.25em] fade-up ${item ? mythic.text : 'text-slate-400'}`}>{item ? 'Mythic · daily box exclusive' : "Today's prize"}</p>
            <p className="font-display text-3xl font-extrabold text-white mt-1 fade-up [animation-delay:.1s]">{item ? item.name : info.title}</p>
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
