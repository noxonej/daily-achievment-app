import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { ownership } from '../store/reducer';
import { todayKey } from '../lib/date';
import { boxPool, findItem, normalizeLook, RARITY } from '../data/avatar';
import { rewardInfo, rollBox, type BoxReward } from '../lib/dailyBox';
import { useDailyResetLabel } from '../lib/useResetCountdown';
import { Avatar } from './Avatar';
import { Confetti } from './Confetti';
import { Icon } from './Icon';

/** The daily box drawing: a glowing cube with a ribbon. `open` pops the lid. */
export function BoxArt({ size = 120, open = false, glow = '#a78bfa' }: { size?: number; open?: boolean; glow?: string }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="boxFront" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4c1d95" />
          <stop offset="1" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="boxSide" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#312e81" />
          <stop offset="1" stopColor="#0f0b2e" />
        </linearGradient>
        <linearGradient id="boxLid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#4c1d95" />
        </linearGradient>
        <radialGradient id="boxGlow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={glow} stopOpacity=".9" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="108" rx="38" ry="5" fill="#000" opacity=".4" />
      {open && <circle cx="60" cy="40" r="50" fill="url(#boxGlow)" />}
      {/* body */}
      <path d="M22 50 L60 64 L60 104 L22 90 Z" fill="url(#boxFront)" />
      <path d="M98 50 L60 64 L60 104 L98 90 Z" fill="url(#boxSide)" />
      <path d="M60 64 V104" stroke="#22d3ee" strokeWidth="1.2" opacity=".8" />
      <path d="M41 57 V97 M79 57 V97" stroke="#f0abfc" strokeWidth="3" opacity=".9" />
      <path d="M22 50 L60 64 L98 50" fill="none" stroke="#67e8f9" strokeWidth="1" opacity=".7" />
      {/* lid */}
      <g style={{ transformOrigin: '60px 50px', transform: open ? 'translateY(-26px) rotate(-14deg)' : 'none', transition: 'transform .45s cubic-bezier(.34,1.56,.64,1)' }}>
        <path d="M18 46 L60 32 L102 46 L60 60 Z" fill="url(#boxLid)" stroke="#a5f3fc" strokeWidth="1" strokeOpacity=".6" />
        <path d="M18 46 L60 60 L60 66 L18 52 Z" fill="#5b21b6" />
        <path d="M102 46 L60 60 L60 66 L102 52 Z" fill="#3b0764" />
        <path d="M39 39 L81 53 M81 39 L39 53" stroke="#f0abfc" strokeWidth="3" />
        <path d="M60 46 C52 34 44 34 46 40 C48 44 56 45 60 46 C64 45 72 44 74 40 C76 34 68 34 60 46Z" fill="#f0abfc" />
      </g>
    </svg>
  );
}

/** Today screen card: unlock by finishing one quest, open once per day. */
export function DailyBoxCard() {
  const { state } = useApp();
  const [opening, setOpening] = useState(false);
  const resetLabel = useDailyResetLabel();
  const today = todayKey();
  const doneToday = state.dayLogs[today]?.completedQuestIds.length ?? 0;
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
          className={`shrink-0 ${ready ? 'animate-chest-wiggle' : opened ? 'opacity-60' : 'grayscale opacity-50'}`}
        >
          <BoxArt size={64} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-violet-300">Daily box</p>
          {opened && info ? (
            <>
              <p className="font-display font-bold text-white truncate">
                <Icon name={info.icon} size="1.05em" className={`icon-inline ${info.tone}`} />
                {last?.kind === 'cosmetic' ? findItem(last.itemId)?.name ?? info.title : info.title}
              </p>
              <p className="text-xs text-slate-400">Next box in {resetLabel}</p>
            </>
          ) : ready ? (
            <>
              <p className="font-display font-bold text-white">Your box is ready!</p>
              <p className="text-xs text-slate-400">Boosts, shields, shards… or a mythic item</p>
            </>
          ) : (
            <>
              <p className="font-display font-bold text-white">Finish 1 quest to unlock</p>
              <p className="text-xs text-slate-400">A free prize every day you show up</p>
            </>
          )}
        </div>
        {ready && (
          <button onClick={() => setOpening(true)} className="shrink-0 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold px-4 py-2.5">
            Open
          </button>
        )}
      </div>
      {opening && <BoxOpening onClose={() => setOpening(false)} />}
    </>
  );
}

function BoxOpening({ onClose }: { onClose: () => void }) {
  const { state, stats, dispatch } = useApp();
  const [phase, setPhase] = useState<'closed' | 'opening' | 'reveal'>('closed');
  const [reward, setReward] = useState<BoxReward | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && phase !== 'opening' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, onClose]);

  function open() {
    if (phase !== 'closed') return;
    const r = rollBox(boxPool(ownership(state, stats)));
    setReward(r);
    setPhase('opening');
    try {
      navigator.vibrate?.([30, 40, 30, 40, 90]);
    } catch {
      // optional
    }
    setTimeout(() => {
      dispatch({ type: 'OPEN_DAILY_BOX', reward: r });
      setPhase('reveal');
    }, 950);
  }

  const info = reward ? rewardInfo(reward) : null;
  const item = reward?.kind === 'cosmetic' ? findItem(reward.itemId) : undefined;
  const mythic = RARITY.mythic;

  return (
    <div data-overlay className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center px-6 backdrop-in">
      {phase !== 'opening' && (
        <button onClick={onClose} aria-label="Close" className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10">
          <Icon name="✕" size={20} />
        </button>
      )}
      {phase !== 'reveal' ? (
        <button onClick={open} className="flex flex-col items-center" aria-label="Open box">
          <div className={phase === 'closed' ? 'animate-chest-wiggle' : 'animate-chest-burst'}>
            <BoxArt size={210} open={phase === 'opening'} />
          </div>
          <p className="mt-6 font-display text-2xl font-extrabold text-white">{phase === 'closed' ? 'Tap to open' : 'Opening…'}</p>
          <p className="text-sm text-slate-400 mt-1">1 in 50 boxes hides a mythic item</p>
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
              <div className="w-32 h-32 rounded-[28%] bg-white/[0.06] border border-white/10 flex items-center justify-center animate-prize-in">
                <Icon name={info.icon} size={60} strokeWidth={1.6} className={info.tone} />
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
