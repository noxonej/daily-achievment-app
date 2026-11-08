import { useEffect, useMemo, useState } from 'react';
import { useBackToClose } from '../lib/backstack';
import { useApp } from '../store/AppContext';
import { ownership } from '../store/reducer';
import type { AvatarSlot, Character } from '../lib/types';
import {
  AVATAR_ITEMS,
  AVATAR_SLOTS,
  CHEST_DUPLICATE_SHARDS,
  RARITY,
  isOwned,
  normalizeLook,
  rollChest,
  type AvatarItem,
} from '../data/avatar';
import { useWardrobeOpen, wardrobe } from '../lib/wardrobe';
import { Avatar } from './Avatar';
import { ChestArt } from './Chest';
import { Icon } from './Icon';

function unlockLabel(item: AvatarItem): string {
  switch (item.unlock.kind) {
    case 'free':
      return 'Free';
    case 'shop':
      return `${item.unlock.cost} shards`;
    case 'level':
      return `Reach level ${item.unlock.level}`;
    case 'streak':
      return `${item.unlock.days}-day streak`;
    case 'chest':
      return 'Chest only';
    case 'box':
      return 'Daily box only';
  }
}

/** Full-screen avatar customisation: try anything on, buy with shards, win from chests. */

/** Item tiles for these zoom in on the head, so faces, hair and hats are easy to compare. */
const HEAD_SLOTS = new Set<string>(['expression', 'hair', 'hairColor', 'face', 'headwear']);
export function Wardrobe() {
  const open = useWardrobeOpen();
  useBackToClose(open, () => wardrobe.close());
  const { state, stats, dispatch } = useApp();
  const [slot, setSlot] = useState<AvatarSlot>('outfit');
  const [preview, setPreview] = useState<AvatarItem | null>(null);
  const [chestOpen, setChestOpen] = useState(false);
  const look = normalizeLook(state.character);
  useEffect(() => {
    if (open) dispatch({ type: 'GUIDE_MARK', key: 'wardrobe' });
  }, [open, dispatch]);
  const ctx = ownership(state, stats);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setChestOpen(false);
    }
  }, [open]);

  const owned = (i: AvatarItem) => isOwned(i, ctx);
  const collected = AVATAR_ITEMS.filter(owned).length;
  const items = AVATAR_ITEMS.filter((i) => i.slot === slot);
  const shown: Character = preview ? { ...look, [preview.slot]: preview.id } : look;

  if (!open) return null;

  function tap(item: AvatarItem) {
    if (owned(item)) {
      dispatch({ type: 'EQUIP_COSMETIC', slot: item.slot, itemId: item.id });
      setPreview(null);
      try {
        navigator.vibrate?.(8);
      } catch {
        // optional
      }
    } else {
      setPreview(item);
    }
  }

  const previewOwned = preview ? owned(preview) : false;
  const canBuy = preview?.unlock.kind === 'shop' && !previewOwned && stats.availableShards >= preview.unlock.cost;

  return (
    <div data-overlay className="fixed inset-0 z-[75] bg-canvas flex flex-col backdrop-in">
      {/* top bar */}
      <div className="flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <button onClick={() => wardrobe.close()} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10">
          <Icon name="⬅" size={20} />
        </button>
        <h2 className="font-display text-lg font-extrabold text-white flex-1">Wardrobe</h2>
        <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-sm font-bold text-amber-200 tabular-nums">
          <Icon name="💎" size={15} />
          {stats.availableShards}
        </span>
        <button
          onClick={() => stats.chestsAvailable > 0 && setChestOpen(true)}
          className={`relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold tabular-nums ${
            stats.chestsAvailable > 0 ? 'bg-violet-500/15 border-violet-400/50 text-violet-100' : 'bg-white/5 border-white/10 text-slate-500'
          }`}
          aria-label={`${stats.chestsAvailable} chests to open`}
        >
          <Icon name="df:chest" size={15} />
          {stats.chestsAvailable}
          {stats.chestsAvailable > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-xl mx-auto px-4">
          {/* hero */}
          <div className="relative flex flex-col items-center pt-2">
            <div
              className={`relative rounded-[28%] p-1 transition-shadow ${
                preview ? `${RARITY[preview.rarity].glow}` : 'shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]'
              }`}
              style={preview ? { background: RARITY[preview.rarity].hex } : undefined}
            >
              <Avatar key={JSON.stringify(shown)} look={shown} size={190} className="animate-pop-in" />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {preview ? `Trying on: ${preview.name}` : 'Tap anything to try it on'} · {collected}/{AVATAR_ITEMS.length} collected
            </p>
          </div>

          {stats.chestsAvailable > 0 && (
            <button
              onClick={() => setChestOpen(true)}
              className="mt-4 w-full flex items-center gap-3 rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-600/25 to-fuchsia-600/15 p-3 text-left"
            >
              <span className="shrink-0 animate-chest-wiggle">
                <ChestArt size={54} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-white">
                  {stats.chestsAvailable} reward {stats.chestsAvailable === 1 ? 'chest' : 'chests'} to open
                </span>
                <span className="block text-xs text-violet-200/80">Won from perfect days, perfect weeks and level-ups</span>
              </span>
              <span className="rounded-xl bg-violet-500 text-white text-sm font-bold px-3.5 py-2">Open</span>
            </button>
          )}

          {/* slot tabs */}
          <div className="sticky top-0 z-10 -mx-4 px-4 pt-4 pb-3 bg-canvas">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {AVATAR_SLOTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSlot(s.id)}
                  aria-pressed={slot === s.id}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                    slot === s.id ? 'bg-amber-500 border-amber-400 text-white' : 'bg-white/[0.03] border-white/10 text-slate-300'
                  }`}
                >
                  <Icon name={s.icon} size={15} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* items */}
          <div key={slot} className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 rows-stagger">
            {items.map((item) => {
              const isOwnedItem = owned(item);
              const equipped = look[item.slot] === item.id;
              const r = RARITY[item.rarity];
              return (
                <button
                  key={item.id}
                  onClick={() => tap(item)}
                  className={`relative flex flex-col items-center rounded-2xl border-2 p-1.5 pb-2 transition ${
                    equipped ? 'border-amber-400 bg-amber-500/10' : `${r.border} ${r.bg}`
                  } ${preview?.id === item.id ? 'ring-2 ring-white/60' : ''} ${item.rarity !== 'common' && !equipped ? r.glow : ''}`}
                >
                  <div className="relative">
                    <Avatar look={{ ...look, [item.slot]: item.id }} size={84} framing={HEAD_SLOTS.has(item.slot) ? 'head' : 'full'} className={isOwnedItem ? '' : 'saturate-[.7] brightness-90'} />
                    {!isOwnedItem && (
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-canvas border border-white/15 flex items-center justify-center text-slate-200">
                        <Icon name={item.unlock.kind === 'chest' ? 'df:chest' : item.unlock.kind === 'box' ? '📦' : '🔒'} size={12} />
                      </span>
                    )}
                    {equipped && (
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-canvas flex items-center justify-center text-white">
                        <Icon name="✓" size={12} strokeWidth={3} className="animate-check" />
                      </span>
                    )}
                  </div>
                  <span className="mt-1.5 text-[11px] font-bold text-white leading-tight text-center line-clamp-1">{item.name}</span>
                  <span className={`text-[10px] font-semibold ${equipped ? 'text-amber-300' : isOwnedItem ? 'text-emerald-300' : r.text}`}>
                    {equipped ? 'Wearing' : isOwnedItem ? 'Owned' : unlockLabel(item)}
                  </span>
                  {item.rarity !== 'common' && (
                    <span className={`absolute top-1 left-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-black/60 ${r.text}`}>
                      {r.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-400 space-y-1.5">
            <p className="text-sm font-bold text-white mb-1">How to earn more</p>
            <p>
              <Icon name="💎" size="1.1em" className="icon-inline text-amber-300" />
              <b className="text-slate-200">Shards:</b> every XP you earn from quests is a shard to spend.
            </p>
            <p>
              <Icon name="df:chest" size="1.1em" className="icon-inline text-violet-300" />
              <b className="text-slate-200">Chests:</b> one for each perfect day, perfect week and new level.
            </p>
            <p>
              <Icon name="🔥" size="1.1em" className="icon-inline text-orange-400" />
              <b className="text-slate-200">Milestones:</b> streaks and levels unlock exclusive gear automatically.
            </p>
          </div>
        </div>
      </div>

      {preview && (
        <div className="border-t border-white/10 bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sheet-in">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <Avatar look={shown} size={52} />
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-wider ${RARITY[preview.rarity].text}`}>{RARITY[preview.rarity].label}</p>
              <p className="font-display font-bold text-white truncate">{preview.name}</p>
              <p className="text-xs text-slate-400 truncate">
                {previewOwned ? 'You own this' : preview.unlock.kind === 'chest' ? 'Win it from a reward chest' : preview.unlock.kind === 'box' ? 'Very rare prize from the daily box' : unlockLabel(preview)}
              </p>
            </div>
            {preview.unlock.kind === 'shop' && !previewOwned ? (
              <button
                disabled={!canBuy}
                onClick={() => {
                  dispatch({ type: 'UNLOCK_COSMETIC', itemId: preview.id });
                  dispatch({ type: 'EQUIP_COSMETIC', slot: preview.slot, itemId: preview.id });
                  setPreview(null);
                }}
                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-white/10 disabled:text-slate-500 text-white text-sm font-bold px-4 py-2.5"
              >
                <Icon name="💎" size={15} />
                {canBuy ? `Buy ${preview.unlock.cost}` : `Need ${preview.unlock.cost}`}
              </button>
            ) : (
              <button onClick={() => setPreview(null)} className="shrink-0 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-slate-200 px-4 py-2.5">
                Take off
              </button>
            )}
          </div>
        </div>
      )}

      {chestOpen && <ChestOpening onClose={() => setChestOpen(false)} />}
    </div>
  );
}

const SKIP_PASS_CHANCE = 0.06;

function ChestOpening({ onClose }: { onClose: () => void }) {
  const { state, stats, dispatch } = useApp();
  useBackToClose(true, onClose);
  // closed → shake (anticipation) → opening (lid swings up, light, sparkles) → reveal
  const [phase, setPhase] = useState<'closed' | 'shake' | 'opening' | 'reveal'>('closed');
  // undefined = not opened yet, null = shards (everything owned), 'skip' = a Skip Pass.
  const [prize, setPrize] = useState<AvatarItem | null | 'skip' | undefined>(undefined);
  const look = normalizeLook(state.character);
  const ctx = useMemo(() => ownership(state, stats), [state, stats]);

  function openIt() {
    if (phase !== 'closed') return;
    // A small chance (6%) of a Skip Pass instead of an item.
    const skip = Math.random() < SKIP_PASS_CHANCE;
    const won = skip ? null : rollChest(ctx);
    setPrize(skip ? 'skip' : won);
    setPhase('shake');
    try {
      navigator.vibrate?.([20, 60, 20, 60, 30]);
    } catch {
      // optional
    }
    setTimeout(() => {
      setPhase('opening');
      try {
        navigator.vibrate?.(60);
      } catch {
        // optional
      }
    }, 700);
    setTimeout(() => {
      dispatch({ type: 'OPEN_CHEST', itemId: won?.id ?? null, skip });
      setPhase('reveal');
    }, 1400);
  }

  const item = prize && prize !== 'skip' ? prize : null;
  const r = item ? RARITY[item.rarity] : prize === 'skip' ? { ...RARITY.epic, hex: '#14b8a6', text: 'text-teal-300', label: 'Rare drop' } : RARITY.legendary;
  const remaining = stats.chestsAvailable;

  return (
    <div className="theme-dark fixed inset-0 z-[80] bg-black/[0.92] flex flex-col items-center justify-center px-6 backdrop-in">
      <button onClick={onClose} aria-label="Close" className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10">
        <Icon name="✕" size={20} />
      </button>

      {phase !== 'reveal' ? (
        <button onClick={openIt} className="flex flex-col items-center" aria-label="Open chest">
          <div className="relative">
            {phase === 'opening' && (
              <>
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
            <div className={phase === 'closed' ? 'animate-float-soft' : phase === 'shake' ? 'box-shake' : 'chest-pop'}>
              <ChestArt size={230} open={phase === 'opening'} glow={r.hex} shine={phase === 'closed'} />
            </div>
          </div>
          <p className="mt-6 font-display text-2xl font-extrabold text-white">{phase === 'closed' ? 'Tap to open' : 'Opening…'}</p>
          <p className="text-sm text-slate-400 mt-1">Could be common, rare, epic, legendary… or a Skip Pass</p>
        </button>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-[-60px] rounded-full prize-rays" style={{ ['--ray' as string]: r.hex }} />
            {prize === 'skip' ? (
              <div className="relative w-[180px] h-[180px] rounded-[28%] flex items-center justify-center animate-prize-in bg-gradient-to-br from-teal-400 to-emerald-600" style={{ boxShadow: `0 0 60px -6px ${r.hex}` }}>
                <Icon name="⏭" size={96} strokeWidth={1.6} className="text-[#fff]" />
              </div>
            ) : (
              <div className="relative rounded-[28%] p-1.5 animate-prize-in" style={{ background: r.hex, boxShadow: `0 0 60px -6px ${r.hex}` }}>
                <Avatar look={item ? { ...look, [item.slot]: item.id } : look} size={180} />
              </div>
            )}
          </div>
          <p className={`mt-7 text-xs font-black uppercase tracking-[0.25em] ${r.text} fade-up`}>{item ? r.label : prize === 'skip' ? 'Rare drop' : 'Bonus'}</p>
          <p className="font-display text-3xl font-extrabold text-white mt-1 fade-up [animation-delay:.1s]">
            {item ? item.name : prize === 'skip' ? 'Skip Pass' : `+${CHEST_DUPLICATE_SHARDS} shards`}
          </p>
          <p className="text-sm text-slate-400 mt-1 fade-up [animation-delay:.15s] max-w-xs">
            {item
              ? `New ${AVATAR_SLOTS.find((s) => s.id === item.slot)?.label.toLowerCase()} added to your wardrobe`
              : prize === 'skip'
                ? 'Skip one daily quest on a busy day without losing your streak. Use it from the Today screen.'
                : "You've collected everything a chest can give!"}
          </p>
          <div className="flex gap-2.5 mt-7 fade-up [animation-delay:.2s]">
            {item && (
              <button
                onClick={() => {
                  dispatch({ type: 'EQUIP_COSMETIC', slot: item.slot, itemId: item.id });
                  onClose();
                }}
                className="rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-3"
              >
                Wear it
              </button>
            )}
            {remaining > 0 ? (
              <button
                onClick={() => {
                  setPrize(undefined);
                  setPhase('closed');
                }}
                className="rounded-2xl bg-violet-500 hover:bg-violet-400 text-white font-bold px-5 py-3"
              >
                Open next ({remaining})
              </button>
            ) : (
              <button onClick={onClose} className="rounded-2xl bg-white/10 border border-white/10 text-white font-semibold px-5 py-3">
                Nice!
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
