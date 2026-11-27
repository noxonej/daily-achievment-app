import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useApp } from '../store/AppContext';
import { CharacterSprite } from '../world/char/CharacterSprite';
import type { ClipName } from '../world/char/anim';
import { ShareButton } from './ShareButton';
import { InviteButton } from './InviteCard';
import { L, isLt } from '../lib/lang';
import { Icon } from './Icon';
import { RankBadge } from './RankBadge';
import { rankForLevel, rankRarity, formatPct, tierStyle } from '../lib/ranks';
import './levelup.css';

/**
 * The level-up / rank-up moment (redesigned 2026-11-24).
 *
 * Every tier has its own colours, glow, motto and particle shape (ranks.ts TIER_STYLE), so Silver at
 * level 10 feels different from Gold at 16. The number stays big and bold in the pixel number font
 * with a hard "extruded" pixel shadow: pixel-inspired without shrinking it.
 *
 * Beats: stage fades in (solid, nothing from the app shows through) → label → the old number rolls
 * up and the new one drops in → pixel burst → rank plate → buttons. With reduced motion everything
 * simply appears in its final place.
 */
export function LevelUpScreen({ level, leaving, onClose }: { level: number; leaving: boolean; onClose: () => void }) {
  const rank = rankForLevel(level);
  const style = tierStyle(rank);
  const { c1, c2, c3 } = rank.tier;
  const rankedUp = rank.startLevel === level && level > 1;
  const toNext = rank.nextLevel ? rank.nextLevel - level : 0;
  const nextRank = rank.nextLevel ? rankForLevel(rank.nextLevel) : null;
  const span = rank.nextLevel ? rank.nextLevel - rank.startLevel : 1;
  const into = level - rank.startLevel + 1;

  useEffect(() => {
    try {
      navigator.vibrate?.(rankedUp ? [30, 80, 60] : 40);
    } catch {
      // optional
    }
  }, [rankedUp]);

  // A ring of particles that bursts from the number, in the tier's colours and shape.
  const sparks = useMemo(
    () => {
      const n = rankedUp ? 28 : 18;
      return Array.from({ length: n }, (_, i) => ({
        a: (360 / n) * i + (i % 2 ? 7 : -5),
        d: (rankedUp ? 120 : 90) + ((i * 37) % 60),
        s: 5 + ((i * 13) % 3) * 2,
        c: [c2, style.glow, c1][i % 3],
        delay: (i % 4) * 0.025,
      }));
    },
    [rankedUp, c1, c2, style.glow],
  );

  const vars = { '--t1': c1, '--t2': c2, '--t3': c3, '--tg': style.glow } as CSSProperties;
  const label = rankedUp ? L('RANK UP', 'NAUJAS RANGAS') : L('LEVEL UP', 'NAUJAS LYGIS');

  return (
    <div className={`lvl-stage fixed inset-0 z-[60] flex items-center justify-center p-5 overflow-hidden ${leaving ? 'overlay-out' : ''}`} style={vars} role="dialog" aria-label={`${L('Level', 'Lygis')} ${level}. ${rank.name}`}>
      <div className="lvl-backdrop absolute inset-0" onClick={onClose} />
      <div className="lvl-rays absolute pointer-events-none" aria-hidden="true" />
      <div className="lvl-glow absolute pointer-events-none" aria-hidden="true" />

      <div className="relative w-full max-w-xs text-center">
        <Celebrating />
        <p className="lvl-label px-label" aria-hidden="true">
          {label.split('').map((ch, i) => (
            <span key={i} style={{ animationDelay: `${120 + i * 35}ms` }}>
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </p>

        {/* the number: the old level rolls away, the new one drops in */}
        <div className="lvl-num-box relative mx-auto" aria-hidden="true">
          <span className="lvl-num lvl-num-old">{Math.max(1, level - 1)}</span>
          <span className="lvl-num lvl-num-new">
            <span className="lvl-num-back">{level}</span>
            <span className="lvl-num-front">{level}</span>
          </span>
          <span className="lvl-burst" aria-hidden="true">
            {sparks.map((p, i) => (
              <span
                key={i}
                className={`lvl-spark is-${style.spark}`}
                style={{ '--a': `${p.a}deg`, '--d': `${p.d}px`, width: p.s, height: p.s, background: p.c, animationDelay: `${0.62 + p.delay}s` } as CSSProperties}
              />
            ))}
          </span>
        </div>

        {/* the rank plate */}
        <div className="lvl-plate mt-3 mx-auto">
          <div className={`relative mx-auto ${rankedUp ? 'lvl-badge-new' : 'lvl-badge'}`} style={{ width: rankedUp ? 104 : 64, height: rankedUp ? 104 : 64 }}>
            <RankBadge rank={rank} size={rankedUp ? 104 : 64} shine />
            {rankedUp && <span className="lvl-badge-sweep" aria-hidden="true" />}
          </div>
          <p className="lvl-rank-name font-display mt-2">{rank.name}</p>
          <p className="lvl-motto">{isLt() ? style.mottoLt : style.motto}</p>
          {rankedUp && rank.index > 0 && (
            <p className="mt-1 text-[12px] text-slate-300">
              {L('Only about', 'Tik apie')} <b className="text-white">{formatPct(rankRarity(rank.index))}</b> {L('of players get this far', 'žaidėjų pasiekia tiek')}
            </p>
          )}
          {!rankedUp && nextRank && (
            <div className="mt-3">
              <div className="lvl-track" aria-hidden="true">
                {Array.from({ length: span }, (_, i) => (
                  <span key={i} className={i < into ? 'on' : ''} style={{ animationDelay: `${1.1 + i * 0.06}s` }} />
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                {toNext === 1 ? L(`1 more level to ${nextRank.name}`, `Dar 1 lygis iki ${nextRank.name}`) : L(`${toNext} more levels to ${nextRank.name}`, `Dar ${toNext} lygiai iki ${nextRank.name}`)}
              </p>
            </div>
          )}
        </div>

        <div className="lvl-late mt-4 flex justify-center">
          <span className="lvl-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold">
            <Icon name="df:chest" size={14} /> {L('+1 reward chest', '+1 prizų skrynia')}
          </span>
        </div>
        <button onClick={onClose} className="lvl-cta lvl-late mt-6 w-full rounded-2xl font-display text-lg font-bold py-3.5 active:scale-95 transition-transform">
          {L("Let's go", 'Pirmyn')}
        </button>
        <div className="lvl-late mt-3 flex justify-center gap-2">
          <ShareButton kind="stats" label={L('Share my stats', 'Dalintis rodikliais')} />
          <InviteButton />
        </div>
      </div>
    </div>
  );
}

/** Your character jumps for joy as the new number lands (2026-11-27), then waves a second time. */
function Celebrating() {
  const { state } = useApp();
  const [clip, setClip] = useState<{ name: ClipName; key: number } | null>(null);
  useEffect(() => {
    const a = setTimeout(() => setClip({ name: 'celebrate', key: 1 }), 620);
    return () => clearTimeout(a);
  }, []);
  return (
    <div className="lvl-hero mx-auto -mb-1 w-[92px]" aria-hidden="true">
      <CharacterSprite look={state.character} base="idle" clip={clip} />
    </div>
  );
}
