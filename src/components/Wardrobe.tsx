import { useEffect, useMemo, useState } from 'react';
import { DECOR_SLOTS, PAINTS, VEHICLES, WORLD_DROP_CHANCE, rollWorldDrop, worldOf, type WorldDrop } from '../world/catalog';
import { VehicleArt } from '../world/VehicleArt';
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
import { Coin } from './Coin';
import { Icon } from './Icon';

function unlockLabel(item: AvatarItem): string {
  switch (item.unlock.kind) {
    case 'free':
      return 'Free';
    case 'shop':
      return `${item.unlock.cost} coins`;
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

/** Full-screen avatar customisation: try anything on, buy with coins, win from chests. */

/** Item tiles for these zoom in on the head, so faces, hair and hats are easy to compare. */
const HEAD_SLOTS = new Set<string>(['expression', 'hair', 'hairColor', 'face', 'headwear']);
export function Wardrobe() {
  const open = useWardrobeOpen();
  useBackToClose(open, () => wardrobe.close());
  const { state, stats, dispatch } = useApp();
  const [slot, setSlot] = useState<AvatarSlot>('outfit');
  // Try-on: one item per category, so you can see a whole outfit together before buying any of it.
  const [tryOn, setTryOn] = useState<Partial<Record<AvatarSlot, AvatarItem>>>({});
  const [comparing, setComparing] = useState(false);
  const [compact, setCompact] = useState(false);
  const [chestOpen, setChestOpen] = useState(false);
  const look = normalizeLook(state.character);
  useEffect(() => {
    if (open) dispatch({ type: 'GUIDE_MARK', key: 'wardrobe' });
  }, [open, dispatch]);
  const ctx = ownership(state, stats);

  useEffect(() => {
    if (!open) {
      setTryOn({});
      setChestOpen(false);
      setCompact(false);
    }
  }, [open]);

  const owned = (i: AvatarItem) => isOwned(i, ctx);
  const counts = useMemo(() => {
    const c = {} as Record<AvatarSlot, { have: number; total: number }>;
    for (const s of AVATAR_SLOTS) c[s.id] = { have: 0, total: 0 };
    for (const i of AVATAR_ITEMS) {
      c[i.slot].total++;
      if (isOwned(i, ctx)) c[i.slot].have++;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.unlockedCosmeticIds, state.wonCosmeticIds, stats.level, stats.longestStreak]);
  const items = AVATAR_ITEMS.filter((i) => i.slot === slot);
  const trying = Object.values(tryOn).filter(Boolean) as AvatarItem[];
  const tried: Partial<Character> = Object.fromEntries(trying.map((i) => [i.slot, i.id]));
  const shown: Character = comparing ? look : { ...look, ...tried };
  const slotInfo = AVATAR_SLOTS.find((s) => s.id === slot)!;
  const here = counts[slot];

  if (!open) return null;

  function tap(item: AvatarItem) {
    if (owned(item)) {
      dispatch({ type: 'EQUIP_COSMETIC', slot: item.slot, itemId: item.id });
      setTryOn(({ [item.slot]: _drop, ...rest }) => rest);
      try {
        navigator.vibrate?.(8);
      } catch {
        // optional
      }
    } else {
      // Tap again to take it off.
      setTryOn((t) => {
        if (t[item.slot]?.id === item.id) {
          const { [item.slot]: _drop, ...rest } = t;
          return rest;
        }
        return { ...t, [item.slot]: item };
      });
    }
  }

  const buyable = trying.filter((i) => i.unlock.kind === 'shop');
  const total = buyable.reduce((sum, i) => sum + (i.unlock.kind === 'shop' ? i.unlock.cost : 0), 0);
  const canBuy = buyable.length > 0 && stats.availableShards >= total;
  const lockedOther = trying.length - buyable.length;
  function buyAll() {
    if (!canBuy) return;
    for (const i of buyable) {
      dispatch({ type: 'UNLOCK_COSMETIC', itemId: i.id });
      dispatch({ type: 'EQUIP_COSMETIC', slot: i.slot, itemId: i.id });
    }
    setTryOn((t) => Object.fromEntries(Object.entries(t).filter(([, i]) => i && i.unlock.kind !== 'shop')));
    try {
      navigator.vibrate?.([10, 40, 18]);
    } catch {
      // optional
    }
  }
  const hint = (i: AvatarItem) =>
    i.unlock.kind === 'chest' ? 'Win it from a chest' : i.unlock.kind === 'box' ? 'Daily box prize' : unlockLabel(i);

  return (
    <div data-overlay className="fixed inset-0 z-[75] bg-canvas flex flex-col backdrop-in">
      {/* top bar */}
      <div className="shrink-0 flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1">
        <button onClick={() => wardrobe.close()} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10">
          <Icon name="⬅" size={20} />
        </button>
        <h2 className="font-display text-lg font-bold text-white flex-1">Wardrobe</h2>
        <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-sm font-bold text-white tabular-nums" aria-label={`${stats.availableShards} coins`}>
          <Icon name="💎" size={15} />
          {stats.availableShards}
        </span>
        <button
          onClick={() => stats.chestsAvailable > 0 && setChestOpen(true)}
          disabled={stats.chestsAvailable === 0}
          className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums transition ${
            stats.chestsAvailable > 0 ? 'bg-violet-500 text-[#fff] active:scale-95' : 'bg-white/[0.06] text-slate-500'
          }`}
          aria-label={`${stats.chestsAvailable} chests to open`}
        >
          <Icon name="df:chest" size={15} />
          {stats.chestsAvailable > 0 ? `Open ${stats.chestsAvailable}` : 0}
        </button>
      </div>

      {/* stage: your character stays in view while you browse, so every try-on is visible */}
      <div className="shrink-0 px-4">
        <div className={`wardrobe-stage relative mx-auto flex flex-col items-center ${compact ? 'is-compact' : ''}`}>
          <button
            type="button"
            className="wardrobe-avatar relative rounded-[28%] select-none"
            onPointerDown={() => trying.length && setComparing(true)}
            onPointerUp={() => setComparing(false)}
            onPointerLeave={() => setComparing(false)}
            onPointerCancel={() => setComparing(false)}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={trying.length ? 'Hold to compare with your current look' : 'Your character'}
          >
            <Avatar look={shown} size={168} />
            {trying.length > 0 && (
              <span key={comparing ? 'now' : 'try'} className="tryon-tag absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
                {comparing ? 'Your look now' : 'Trying on'}
              </span>
            )}
          </button>
          <p className="mt-3 text-[11px] text-slate-400 h-4">
            {trying.length ? 'Hold your character to compare' : 'Tap any item to try it on, even before you buy it'}
          </p>
        </div>

        {/* categories, each with its own collected count */}
        <div className="-mx-4 px-4 mt-2 flex gap-1.5 overflow-x-auto no-scrollbar" role="tablist" aria-label="Categories">
          {AVATAR_SLOTS.map((s) => {
            const on = slot === s.id;
            const c = counts[s.id];
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={on}
                onClick={() => setSlot(s.id)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                  on ? 'bg-amber-500 text-white' : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <Icon name={s.icon} size={15} />
                {s.label}
                <span className={`text-[11px] tabular-nums ${on ? 'text-white/80' : 'text-slate-500'}`}>
                  {c.have}/{c.total}
                </span>
                {tryOn[s.id] && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" aria-label="trying one on" />}
              </button>
            );
          })}
        </div>

        <div className="mt-3 mb-2 flex items-center gap-3">
          <p className="text-[13px] text-slate-300 whitespace-nowrap">
            <b className="text-white font-semibold">{slotInfo.label}</b>
            <span className="tabular-nums">
              {' '}
              · {here.have} / {here.total} collected
            </span>
          </p>
          <span className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
            <span className="block h-full rounded-full bg-amber-500 transition-[width] duration-700" style={{ width: `${(here.have / Math.max(1, here.total)) * 100}%` }} />
          </span>
          {here.have === here.total && <span className="text-[11px] font-bold text-emerald-300">Complete</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" onScroll={(e) => setCompact(e.currentTarget.scrollTop > 24)}>
        <div className="max-w-xl mx-auto px-4 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {/* items */}
          <div key={slot} className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 rows-stagger">
            {items.map((item) => {
              const isOwnedItem = owned(item);
              const equipped = look[item.slot] === item.id;
              const isTrying = tryOn[item.slot]?.id === item.id;
              const r = RARITY[item.rarity];
              return (
                <button
                  key={item.id}
                  onClick={() => tap(item)}
                  aria-pressed={equipped || isTrying}
                  className={`wardrobe-tile relative flex flex-col items-center rounded-2xl border-[1.5px] p-1.5 pb-2 ${
                    equipped ? 'border-amber-400 bg-amber-500/10' : isTrying ? 'is-trying border-white/60 bg-white/[0.06]' : `${r.border} bg-white/[0.03]`
                  }`}
                >
                  <div className="relative">
                    <Avatar look={{ ...look, [item.slot]: item.id }} size={84} framing={HEAD_SLOTS.has(item.slot) ? 'head' : 'full'} className={isOwnedItem || isTrying ? '' : 'saturate-[.75]'} />
                    {!isOwnedItem && (
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-raised border border-white/10 flex items-center justify-center text-slate-300">
                        <Icon name={item.unlock.kind === 'chest' ? 'df:chest' : item.unlock.kind === 'box' ? '📦' : '🔒'} size={12} />
                      </span>
                    )}
                    {equipped && (
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-canvas flex items-center justify-center text-[#fff]">
                        <Icon name="✓" size={12} strokeWidth={3} className="animate-check" />
                      </span>
                    )}
                  </div>
                  <span className="mt-1.5 text-[11px] font-bold text-white leading-tight text-center line-clamp-1">{item.name}</span>
                  <span className={`text-[10px] font-semibold ${equipped ? 'text-amber-300' : isTrying ? 'text-white' : isOwnedItem ? 'text-emerald-300' : 'text-slate-400'}`}>
                    {equipped ? 'Wearing' : isTrying ? 'Trying on' : isOwnedItem ? 'Owned' : unlockLabel(item)}
                  </span>
                  {item.rarity !== 'common' && (
                    <span className={`absolute top-1.5 left-1.5 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-canvas/80 ${r.text}`}>{r.label}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-400 space-y-1.5">
            <p className="text-sm font-bold text-white mb-1">How to earn more</p>
            <p>
              <Icon name="💎" size="1.1em" className="icon-inline text-amber-300" />
              <b className="text-slate-200">Coins:</b> every XP you earn from quests is a coin to spend.
            </p>
            <p>
              <Icon name="df:chest" size="1.1em" className="icon-inline text-violet-300" />
              <b className="text-slate-200">Chests:</b> one for each perfect day, perfect week and new level.
            </p>
            <p>
              <Icon name="🔥" size="1.1em" className="icon-inline text-orange-400" />
              <b className="text-slate-200">Milestones:</b> streaks and levels unlock exclusive gear automatically.
            </p>
            <p className="pt-1 text-slate-500 tabular-nums">
              All categories: {AVATAR_SLOTS.reduce((s, x) => s + counts[x.id].have, 0)} / {AVATAR_ITEMS.length} collected
            </p>
          </div>
        </div>
      </div>

      {trying.length > 0 && (
        <div className="shrink-0 border-t border-white/10 bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sheet-in">
          <div className="max-w-xl mx-auto">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
              {trying.map((i) => (
                <button
                  key={i.id}
                  onClick={() => tap(i)}
                  className="tryon-chip shrink-0 flex items-center gap-1.5 rounded-full bg-white/[0.06] pl-2.5 pr-2 py-1 text-xs"
                  aria-label={`Take off ${i.name}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full`} style={{ background: RARITY[i.rarity].hex }} aria-hidden="true" />
                  <span className="font-semibold text-white">{i.name}</span>
                  <span className="text-slate-400">{hint(i)}</span>
                  <Icon name="✕" size={12} className="text-slate-500" />
                </button>
              ))}
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <p className="flex-1 min-w-0 text-[11px] text-slate-400 leading-snug">
                {buyable.length === 0
                  ? 'These can only be won, not bought. Open chests to get them.'
                  : canBuy
                    ? lockedOther
                      ? `Buys ${buyable.length} now. ${lockedOther} more can only be won.`
                      : `You'll have ${stats.availableShards - total} coins left.`
                    : `You need ${total - stats.availableShards} more coins. Every XP is a coin.`}
              </p>
              <button onClick={() => setTryOn({})} className="shrink-0 rounded-xl bg-white/[0.06] text-sm font-semibold text-slate-200 px-3.5 py-2.5">
                Take off
              </button>
              {buyable.length > 0 && (
                <button
                  disabled={!canBuy}
                  onClick={buyAll}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-500 disabled:bg-white/10 disabled:text-slate-500 text-white text-sm font-bold px-4 py-2.5"
                >
                  <Icon name="💎" size={15} />
                  {buyable.length > 1 ? `Buy all · ${total}` : `Buy · ${total}`}
                </button>
              )}
            </div>
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
  // undefined = not opened yet, null = coins (everything owned), 'skip' = a Skip Pass.
  const [prize, setPrize] = useState<AvatarItem | null | 'skip' | { world: WorldDrop } | undefined>(undefined);
  const look = normalizeLook(state.character);
  const ctx = useMemo(() => ownership(state, stats), [state, stats]);

  function openIt() {
    if (phase !== 'closed') return;
    // A small chance (6%) of a Skip Pass instead of an item.
    // The very first chest is a lucky one (epic or legendary, never a Skip Pass).
    const first = (state.chestsOpened ?? 0) === 0;
    const skip = !first && Math.random() < SKIP_PASS_CHANCE;
    // Sometimes a chest holds something for your World (home decor, paint or even a vehicle).
    const worldDrop = !first && !skip && Math.random() < WORLD_DROP_CHANCE ? rollWorldDrop(worldOf(state)) : null;
    const won = skip || worldDrop ? null : rollChest(ctx, Math.random, first);
    setPrize(skip ? 'skip' : worldDrop ? { world: worldDrop } : won);
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
      dispatch({ type: 'OPEN_CHEST', itemId: won?.id ?? null, skip, worldId: worldDrop?.id });
      setPhase('reveal');
    }, 1400);
  }

  const drop = prize && typeof prize === 'object' && 'world' in prize ? prize.world : null;
  const item = prize && prize !== 'skip' && !drop ? (prize as AvatarItem) : null;
  const r = drop ? RARITY[drop.rarity] : item ? RARITY[item.rarity] : prize === 'skip' ? { ...RARITY.epic, hex: '#14b8a6', text: 'text-teal-300', label: 'Rare drop' } : RARITY.legendary;
  const remaining = stats.chestsAvailable;

  return (
    <div className="theme-dark box-stage fixed inset-0 z-[80] flex flex-col items-center justify-center px-6 backdrop-in">
      <button onClick={onClose} aria-label="Close" className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10">
        <Icon name="✕" size={20} />
      </button>

      {phase !== 'reveal' ? (
        <button onClick={openIt} className="flex flex-col items-center" aria-label="Open chest">
          <div className="relative">
            {phase === 'opening' && (
              <>
                <span className="open-flash" aria-hidden="true" />
                <span className="box-shockwave" aria-hidden="true" />
                {Array.from({ length: 12 }, (_, i) => {
                  const side = i % 2 ? 1 : -1;
                  const dx = side * (30 + ((i * 37) % 110));
                  return (
                    <span
                      key={`c${i}`}
                      className="coin-fly"
                      aria-hidden="true"
                      style={{ ['--dx' as string]: `${dx}px`, ['--up' as string]: `${120 + ((i * 53) % 90)}px`, animationDelay: `${(i % 6) * 0.05}s` }}
                    >
                      <Coin size={22} />
                    </span>
                  );
                })}
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
          <p className="text-sm text-slate-400 mt-1">
            {(state.chestsOpened ?? 0) === 0 ? 'Your first chest is a lucky one: epic or better!' : 'Common 62% · Rare 26% · Epic 9.5% · Legendary 2.5% · sometimes a World item'}
          </p>
        </button>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-[-60px] rounded-full prize-rays" style={{ ['--ray' as string]: r.hex }} />
            {drop ? (
              <div className="relative w-[180px] h-[180px] rounded-[28%] flex items-center justify-center animate-prize-in bg-gradient-to-br from-sky-500 to-indigo-700" style={{ boxShadow: `0 0 60px -6px ${r.hex}` }}>
                {drop.kind === 'vehicle' && VEHICLES.find((v) => v.id === drop.id) ? (
                  <VehicleArt vehicle={VEHICLES.find((v) => v.id === drop.id)!} paint={PAINTS.find((p) => p.id === VEHICLES.find((v) => v.id === drop.id)!.paint)?.hex ?? '#888'} className="w-[150px]" />
                ) : (
                  <span className="flex flex-col items-center gap-2">
                    <Icon name={drop.kind === 'paint' ? '🎨' : DECOR_SLOTS.find((x) => x.id === drop.slot)?.icon ?? '🏠'} size={64} strokeWidth={1.6} className="text-white" />
                    {drop.color && <span className="w-16 h-3 rounded-full ring-2 ring-white/50" style={{ background: drop.color }} />}
                  </span>
                )}
              </div>
            ) : prize === 'skip' ? (
              <div className="relative w-[180px] h-[180px] rounded-[28%] flex items-center justify-center animate-prize-in bg-gradient-to-br from-teal-400 to-emerald-600" style={{ boxShadow: `0 0 60px -6px ${r.hex}` }}>
                <Icon name="⏭" size={96} strokeWidth={1.6} className="text-[#fff]" />
              </div>
            ) : (
              <div className="relative rounded-[28%] p-1.5 animate-prize-in" style={{ background: r.hex, boxShadow: `0 0 60px -6px ${r.hex}` }}>
                <Avatar look={item ? { ...look, [item.slot]: item.id } : look} size={180} />
              </div>
            )}
          </div>
          <p className={`mt-7 text-xs font-black uppercase tracking-[0.25em] ${r.text} fade-up`}>{drop ? `${r.label} · World` : item ? r.label : prize === 'skip' ? 'Rare drop' : 'Bonus'}</p>
          <p className="font-display text-3xl font-extrabold text-white mt-1 fade-up [animation-delay:.1s]">
            {drop ? drop.name : item ? item.name : prize === 'skip' ? 'Skip Pass' : `+${CHEST_DUPLICATE_SHARDS} coins`}
          </p>
          <p className="text-sm text-slate-400 mt-1 fade-up [animation-delay:.15s] max-w-xs">
            {drop
              ? drop.kind === 'vehicle'
                ? 'A chest-only vehicle! Find it in your garage on the World tab.'
                : drop.kind === 'paint'
                  ? 'A chest-only paint for your vehicles. Use it in the garage.'
                  : 'A chest-only item for your home. Nobody can buy this one.'
              : item
              ? `New ${AVATAR_SLOTS.find((s) => s.id === item.slot)?.label.toLowerCase()} added to your wardrobe`
              : prize === 'skip'
                ? 'Skip one daily quest on a busy day without losing your streak. Use it from the Today screen.'
                : "You've collected everything a chest can give!"}
          </p>
          <div className="flex gap-2.5 mt-7 fade-up [animation-delay:.2s]">
            {drop?.kind === 'decor' && drop.slot && (
              <button
                onClick={() => {
                  dispatch({ type: 'WORLD_PLACE', slot: drop.slot!, itemId: drop.id });
                  onClose();
                }}
                className="rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-3"
              >
                Put it in my home
              </button>
            )}
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
