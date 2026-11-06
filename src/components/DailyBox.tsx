import { useEffect, useId, useState } from 'react';
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

/**
 * The daily box: a violet gift box with a gold ribbon and bow. `glow` adds an aura, `sparkle`
 * twinkling stars, and `lid` controls the lid ("on", or "off" while it flies away when opened).
 */
export function BoxArt({
  size = 120,
  glow = false,
  sparkle = false,
  lid = 'on',
  locked = false,
}: {
  size?: number;
  glow?: boolean;
  sparkle?: boolean;
  lid?: 'on' | 'off';
  locked?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const u = (n: string) => `url(#${n}${id})`;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true" className="overflow-visible">
      <defs>
        <linearGradient id={`body${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={locked ? '#475569' : '#7c3aed'} />
          <stop offset="1" stopColor={locked ? '#1e293b' : '#3b0764'} />
        </linearGradient>
        <linearGradient id={`lid${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={locked ? '#94a3b8' : '#a78bfa'} />
          <stop offset="1" stopColor={locked ? '#475569' : '#6d28d9'} />
        </linearGradient>
        <linearGradient id={`gold${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={locked ? '#e2e8f0' : '#fef3c7'} />
          <stop offset=".45" stopColor={locked ? '#cbd5e1' : '#fbbf24'} />
          <stop offset="1" stopColor={locked ? '#64748b' : '#d97706'} />
        </linearGradient>
        <linearGradient id={`shine${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`aura${id}`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#c4b5fd" stopOpacity=".85" />
          <stop offset=".55" stopColor="#8b5cf6" stopOpacity=".25" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
      </defs>
      {glow && <circle cx="60" cy="66" r="58" fill={u('aura')} className="glow-pulse" style={{ transformOrigin: '60px 66px' }} />}
      <ellipse cx="60" cy="108" rx="36" ry="5" fill="#000" opacity=".35" />
      {/* body */}
      <rect x="24" y="56" width="72" height="50" rx="7" fill={u('body')} />
      <rect x="24" y="56" width="72" height="50" rx="7" fill={u('shine')} />
      <rect x="24" y="56" width="72" height="8" fill="#000" opacity=".18" />
      <rect x="53.5" y="56" width="13" height="50" fill={u('gold')} />
      <rect x="53.5" y="56" width="3" height="50" fill="#fff" opacity=".35" />
      {/* lid + bow */}
      <g className={lid === 'off' ? 'box-lid-off' : ''} style={{ transformOrigin: '60px 50px' }}>
        <rect x="18" y="42" width="84" height="18" rx="6" fill={u('lid')} />
        <rect x="18" y="42" width="84" height="5" rx="3" fill="#fff" opacity=".22" />
        <rect x="52" y="42" width="16" height="18" fill={u('gold')} />
        <rect x="52" y="42" width="3.5" height="18" fill="#fff" opacity=".35" />
        <path d="M60 41 C49 24 33 25 37 35 C40 42 52 42 60 41Z" fill={u('gold')} />
        <path d="M60 41 C71 24 87 25 83 35 C80 42 68 42 60 41Z" fill={u('gold')} />
        <path d="M60 41 C53 32 44 31 45 35 C46 38 53 40 60 41Z" fill="#000" opacity=".14" />
        <path d="M60 41 C67 32 76 31 75 35 C74 38 67 40 60 41Z" fill="#000" opacity=".14" />
        <rect x="55" y="36" width="10" height="9" rx="3.5" fill={u('gold')} />
        <rect x="56.5" y="37" width="3" height="4" rx="1.5" fill="#fff" opacity=".5" />
      </g>
      {locked && (
        <g>
          <circle cx="92" cy="96" r="12" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <rect x="86.5" y="94" width="11" height="8.5" rx="2" fill="#94a3b8" />
          <path d="M89 94 v-2.5 a3 3 0 0 1 6 0 V94" fill="none" stroke="#94a3b8" strokeWidth="2" />
        </g>
      )}
      {sparkle &&
        [
          [14, 30, 0],
          [104, 24, 0.8],
          [108, 76, 1.5],
          [10, 82, 2],
        ].map(([x, y, d]) => (
          <path
            key={`${x}-${y}`}
            d={`M${x} ${y - 6} L${x + 1.6} ${y - 1.6} L${x + 6} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 6} L${x - 1.6} ${y + 1.6} L${x - 6} ${y} L${x - 1.6} ${y - 1.6}Z`}
            fill="#fde68a"
            className="twinkle"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
    </svg>
  );
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

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
    <div data-overlay className="theme-dark fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center px-6 backdrop-in">
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
                <span className="box-shockwave" aria-hidden="true" />
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
