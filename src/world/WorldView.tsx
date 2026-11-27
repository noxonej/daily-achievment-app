import './world.css';
import { todayKey } from '../lib/date';
import { useCallback, useMemo, useRef, useState } from 'react';
import { PurchaseCelebration, PurchaseSheet } from './Purchase';
import { usePixelated } from './px/pixelate';
import { useApp } from '../store/AppContext';
import { Segmented } from '../components/Segmented';
import { InfoTip } from '../components/Guide';
import { Coin } from '../components/Coin';
import { Icon } from '../components/Icon';
import { useCountUp } from '../lib/useCountUp';
import { useIntent } from '../lib/intents';
import type { DecorSlot, DerivedStats, WorldState } from '../lib/types';
import {
  DECOR,
  DECOR_SLOTS,
  PROPERTIES,
  canUnlock,
  decorFor,
  owns,
  ownsDecor,
  worldOf,
  type DecorItem,
} from './catalog';
import { GarageSection } from './Garage';
import { BuyButton, Requirements } from './ui';
import { HomeThumb, Room, RoomDefs, SlotArt, windowRect, type Dropped, type TimeOfDay } from './room/Room';
import { DecorateOverlay, draftBlocked, type Draft } from './room/Decorate';
import { MAX_PLACED, freeSpot, isMovable, itemOf, layoutOf, onWall } from './room/layout';
import { createPortal } from 'react-dom';
import { AVATAR_ITEMS, isOwned } from '../data/avatar';
import { ownership } from '../store/reducer';
import { useBackToClose } from '../lib/backstack';
import { t } from '../lib/prefs';

type Section = 'room' | 'garage' | 'homes';

export interface Pending {
  id: string;
  name: string;
  coins: number;
  vehicleId?: string;
  /** A decoration bought while trying it: where it goes in the room. */
  at?: { x: number; y: number };
  uid?: string;
}

/**
 * World (rebuilt 2026-11-14): the life you build alongside your real one.
 * Room: a wide room you drag around and tap to change, lit by the real time of day.
 * Garage (2026-11-16): a pixel-art garage you upgrade, with your character next to a hand-made
 * collection of cars, motorcycles, bikes, e-scooters and five legendaries.
 * Homes: move up as you grow.
 */
export function WorldView() {
  const { stats, dispatch } = useApp();
  const toGarage = useIntent('world-garage');
  const [section, setSection] = useState<Section>(toGarage ? 'garage' : 'room');
  const [pending, setPending] = useState<Pending | null>(null);
  const [party, setParty] = useState<Pending | null>(null);
  const [bought, setBought] = useState<{ id: string; key: number; uid?: string } | null>(null);
  const coins = useCountUp(stats.availableShards, 700);

  function confirm(p: Pending) {
    dispatch({ type: 'WORLD_BUY', id: p.id, vehicleId: p.vehicleId, at: p.at, uid: p.uid });
    // Paid things: the item drops into the room / garage when the reveal fades out, not hidden behind it.
    if (p.coins > 0) setParty(p);
    else setBought({ id: p.id, key: Date.now(), uid: p.uid });
  }
  const partyRef = useRef<Pending | null>(null);
  partyRef.current = party;
  const endParty = useCallback(() => {
    const p = partyRef.current;
    if (p) setBought({ id: p.id, key: Date.now(), uid: p.uid });
    setParty(null);
  }, []);
  const decorThumb = useCallback(
    (id: string) => {
      const item = DECOR.find((d) => d.id === id);
      return item ? <Thumb item={item} tier={6} trophies={0} books={0} locked={false} /> : null;
    },
    [],
  );
  function buy(p: Pending) {
    if (p.coins === 0) confirm(p);
    else setPending(p);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 stagger">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{t('world.eyebrow')}</p>
          <h1 className="font-display text-[30px] leading-tight font-medium tracking-tight text-white mt-1 flex items-center gap-1">
            {t('nav.world')}
            <InfoTip title={t('world.infoTitle')} text={t('world.infoText')} />
          </h1>
        </div>
        <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5" aria-label={t('world.coins', { n: stats.availableShards })}>
          <Coin size={16} />
          <span className="num-px text-[22px] text-white">{coins.toLocaleString()}</span>
        </span>
      </div>

      <Segmented
        value={section}
        onChange={setSection}
        options={[
          { id: 'room', label: t('world.room'), icon: '🏠' },
          { id: 'garage', label: t('world.garage'), icon: '🚗' },
          { id: 'homes', label: t('world.homes'), icon: '🏢' },
        ]}
      />

      <div key={section} className="animate-view-right space-y-4">
        {section === 'room' && <RoomSection stats={stats} onBuy={buy} bought={bought} />}
        {section === 'garage' && <GarageSection stats={stats} onBuy={buy} bought={bought} />}
        {section === 'homes' && <HomesSection stats={stats} onBuy={buy} />}
      </div>

      <PurchaseSheet
        item={pending}
        balance={stats.availableShards}
        decorThumb={decorThumb}
        onCancel={() => setPending(null)}
        onBuy={() => {
          if (pending) confirm(pending);
          setPending(null);
        }}
      />
      <PurchaseCelebration item={party} decorThumb={decorThumb} onDone={endParty} />
    </div>
  );
}

/* ---------------------------------------------------------------- room */

const TIMES: Array<{ id: TimeOfDay | undefined; label: string; icon: string }> = [
  { id: undefined, get label() { return t('world.now'); }, icon: '🌅' },
  { id: 'day', get label() { return t('world.day'); }, icon: '☀️' },
  { id: 'dusk', get label() { return t('world.dusk'); }, icon: '🌅' },
  { id: 'night', get label() { return t('world.night'); }, icon: '🌙' },
];

function RoomSection({ stats, onBuy, bought }: { stats: DerivedStats; onBuy: (p: Pending) => void; bought: { id: string; key: number; uid?: string } | null }) {
  const { state, dispatch } = useApp();
  const world = worldOf(state);
  const [slot, setSlot] = useState<DecorSlot | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Dropped | null>(null);
  const [timeIx, setTimeIx] = useState(0);
  // Free decorating (2026-11-27): moving things around, with a preview before saving.
  const [decorating, setDecorating] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const placing = decorating;
  const [note, setNote] = useState<{ text: string; key: number } | null>(null);
  const time = TIMES[timeIx];
  const layout = layoutOf(world);
  // Every pet you own lives here; the one you take along walks with your character.
  const ctx = useMemo(() => ownership(state, stats), [state, stats]);
  const pets = useMemo(
    () => AVATAR_ITEMS.filter((i) => i.slot === 'pet' && i.style !== 'none' && i.id !== state.character?.pet && isOwned(i, ctx)).map((i) => ({ id: i.id, name: i.name })),
    [ctx, state.character?.pet],
  );
  function say(text: string) {
    const key = Date.now();
    setNote({ text, key });
    setTimeout(() => setNote((n) => (n?.key === key ? null : n)), 2600);
  }
  const preview = previewId ? DECOR.find((d) => d.id === previewId) ?? null : null;
  const sceneWorld: WorldState = preview ? { ...world, decor: { ...world.decor, [preview.slot]: preview.id } } : world;
  const property = PROPERTIES.find((p) => p.id === world.property) ?? PROPERTIES[0];
  const books = useMemo(() => state.goals.filter((g) => g.kind === 'books').reduce((n, g) => n + (g.log?.length ?? 0), 0), [state.goals]);
  const trophies = state.unlockedAchievements.length;
  const movable = !!slot && isMovable(slot);
  // Decorations: "leave empty" isn't needed any more (put things away instead).
  const items = slot ? DECOR.filter((d) => d.slot === slot && !(isMovable(slot) && d.model === 'none')) : [];
  const current = slot ? decorFor(world, slot) : null;
  const slotInfo = slot ? DECOR_SLOTS.find((s) => s.id === slot) : null;
  // A fresh purchase drops into the room the same way placing does.
  const boughtDecor = bought ? DECOR.find((d) => d.id === bought.id) : null;
  const dropped: Dropped | null = placed ?? (boughtDecor ? { slot: boughtDecor.slot, key: bought!.key, uid: bought!.uid } : null);
  const draftItem = draft ? itemOf({ id: draft.itemId }) : null;
  const blocked = draft ? draftBlocked(world, draft) : null;
  /** Start moving a new copy of a decoration (or try one you don't own yet). */
  function startNew(item: DecorItem, buy = false) {
    const at = freeSpot(world, layout, item.id);
    setSlot(null);
    setPreviewId(null);
    setDecorating(true);
    setDraft({ uid: `d${Date.now().toString(36)}`, itemId: item.id, ...at, isNew: true, buy });
  }
  function saveDraft() {
    if (!draft || !draftItem || blocked) return;
    if (draft.buy) {
      onBuy({ id: draftItem.id, name: draftItem.name, coins: draftItem.unlock.coins, at: { x: draft.x, y: draft.y }, uid: draft.uid });
      setDraft(null);
      setDecorating(false);
      return;
    }
    if (draft.isNew) dispatch({ type: 'WORLD_LAYOUT_ADD', uid: draft.uid, itemId: draft.itemId, x: draft.x, y: draft.y, s: draft.s });
    else dispatch({ type: 'WORLD_LAYOUT_MOVE', uid: draft.uid, x: draft.x, y: draft.y, s: draft.s });
    setPlaced({ slot: draftItem.slot, key: Date.now(), uid: draft.uid });
    say(draft.isNew ? `${draftItem.name} placed` : `${draftItem.name} moved`);
    // The preview stays a moment longer, until the room picture has caught up.
    const d = draft;
    setTimeout(() => setDraft((x) => (x === d ? null : x)), 220);
  }
  function putAway() {
    if (!draft || draft.isNew || !draftItem) return;
    dispatch({ type: 'WORLD_LAYOUT_REMOVE', uid: draft.uid });
    say(`${draftItem.name} put away`);
    setDraft(null);
  }

  function pick(s: DecorSlot | null) {
    setSlot(s);
    setPreviewId(null);
  }

  return (
    <>
      <div className="relative world-scene-in h-[min(92vw,420px)]">
        <Room
          walkable={!placing}
          world={sceneWorld}
          trophies={trophies}
          books={books}
          focus={slot}
          onTapSlot={placing ? undefined : (s) => pick(slot === s ? null : s)}
          editing={!slot && !placing}
          dropped={dropped}
          time={time.id}
          decorating={decorating}
          lookAt={draft && draftItem ? draft.x + 60 : null}
          hide={draft && !draft.isNew ? draft.uid : undefined}
          overlay={<DecorateOverlay world={world} draft={draft} onSelect={(p) => setDraft({ uid: p.uid, itemId: p.id, x: p.x, y: p.y, s: p.s, isNew: false })} onDraft={setDraft} />}
          onTapPlaced={(uid) => {
            const p = layout.find((x) => x.uid === uid);
            const it = p && itemOf(p);
            if (!p || !it) return;
            setDecorating(true);
            setSlot(null);
            setDraft({ uid: p.uid, itemId: p.id, x: p.x, y: p.y, s: p.s, isNew: false });
          }}
          pets={pets}
          cheer={(state.dayLogs[todayKey()]?.completedQuestIds.length ?? 0)}
          onTapPet={(id) => {
            const name = pets.find((p) => p.id === id)?.name ?? 'Your pet';
            dispatch({ type: 'EQUIP_COSMETIC', slot: 'pet', itemId: id });
            say(`${name} is walking with you now`);
          }}
          character={{ look: state.character }}
        />
        {note && (
          <div key={note.key} className="theme-dark pointer-events-none absolute left-1/2 bottom-3 z-[10] -translate-x-1/2 rounded-full bg-black/75 px-3.5 py-1.5 text-[13px] font-semibold text-white whitespace-nowrap toast-in-up">
            {note.text}
          </div>
        )}
        <div className={`theme-dark pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2 ${placing ? 'invisible' : ''}`}>
          {slot ? (
            <button onClick={() => pick(null)} className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/65 pl-2.5 pr-3.5 py-1.5 text-[13px] font-semibold text-white">
              <Icon name="↩" size={14} />
              Whole room
            </button>
          ) : (
            <span className="flex items-center gap-2 rounded-full bg-black/60 pl-3 pr-3.5 py-1.5">
              <Icon name="🏠" size={13} className="text-white/70" />
              <span className="text-[13px] font-semibold text-white">{property.name}</span>
            </span>
          )}
          <div className="flex items-center gap-2">
            {preview && (
              <button key={preview.id} onClick={() => setPreviewId(null)} className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-amber-500 pl-3 pr-2.5 py-1.5 text-[12px] font-semibold text-[#fff] toast-in-up" aria-label={`Stop trying ${preview.name}`}>
                Trying
                <Icon name="✕" size={13} />
              </button>
            )}
            <button
              onClick={() => setTimeIx((timeIx + 1) % TIMES.length)}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[12px] font-semibold text-white"
              aria-label={t('world.light', { x: time.label })}
            >
              <Icon name={time.icon} size={13} />
              {time.label}
            </button>
          </div>
        </div>
      </div>

      {decorating ? (
        <div className="deco-bar sheet-up rounded-[22px] bg-white/[0.045] p-3">
          {draft && draftItem ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-white truncate">{draftItem.name}</p>
                  <p className={`text-[12px] ${blocked ? 'text-red-300' : 'text-emerald-300'}`}>{blocked ? `Overlaps ${blocked}. Drag it somewhere free.` : draft.buy ? 'Preview: drag it where you want it.' : 'Fits here. Drag to move.'}</p>
                </div>
                {(draftItem.slot === 'poster' || draftItem.slot === 'art') && (
                  <div className="flex gap-1 shrink-0" role="radiogroup" aria-label="Size">
                    {(['s', 'm', 'l'] as const).map((k) => {
                      const on = (draft.s ?? 'm') === k;
                      return (
                        <button key={k} role="radio" aria-checked={on} onClick={() => setDraft({ ...draft, s: k })} className={`w-9 h-8 rounded-lg text-[12px] font-bold ${on ? 'seg-pill seg-on' : 'bg-white/[0.06] text-slate-300'}`}>
                          {k.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                {!draft.isNew && (
                  <button onClick={putAway} className="rounded-full bg-white/[0.07] px-3.5 py-2 text-[13px] font-semibold text-slate-200">
                    Put away
                  </button>
                )}
                <button onClick={() => setDraft(null)} className="rounded-full bg-white/[0.07] px-3.5 py-2 text-[13px] font-semibold text-slate-200">
                  Cancel
                </button>
                {draft.buy ? (
                  <div className="ml-auto">
                    <BuyButton gate={blocked ? { ok: false, reason: 'space', text: 'Overlaps' } : canUnlock(draftItem.unlock, stats)} coins={draftItem.unlock.coins} onClick={saveDraft} verb="Get" />
                  </div>
                ) : (
                  <button onClick={saveDraft} disabled={!!blocked} className="ml-auto rounded-full bg-amber-500 disabled:opacity-40 px-5 py-2 text-[13px] font-bold text-[#fff]">
                    {draft.isNew ? 'Place here' : 'Save'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-slate-300 leading-snug">Tap a decoration to move it. Add more from the list below ({layout.length}/{MAX_PLACED}).</p>
              <button onClick={() => setDecorating(false)} className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-[13px] font-bold text-[#fff]">
                Done
              </button>
            </div>
          )}
        </div>
      ) : (
        !slot && (
          <div className="flex items-center justify-between gap-3 -mt-1">
            <p className="text-[13px] text-slate-400">
              {t('world.walkHint')}
              {pets.length > 0 ? t('world.petHint') : ''}
            </p>
            <button onClick={() => setDecorating(true)} className="deco-open shrink-0 flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 py-2 text-[13px] font-semibold text-white">
              <Icon name="✋" size={14} />
              Decorate
            </button>
          </div>
        )
      )}

      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
        {[...DECOR_SLOTS].sort((a, b) => +(b.id === 'wall' || b.id === 'floor') - +(a.id === 'wall' || a.id === 'floor')).map((s) => (
          <button
            key={s.id}
            onClick={() => pick(slot === s.id ? null : s.id)}
            aria-pressed={slot === s.id}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${slot === s.id ? 'seg-pill seg-on' : 'bg-white/[0.05] text-slate-300 hover:bg-white/10'}`}
          >
            <Icon name={s.icon} size={15} />
            {s.label}
          </button>
        ))}
      </div>

      {slot && slotInfo && (
        <div key={slot} className="sheet-up">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">{slotInfo.label} · {items.filter((i) => ownsDecor(world, i)).length}/{items.length} owned</p>
            <button onClick={() => pick(null)} className="text-xs font-semibold text-slate-400 hover:text-white">
              Done
            </button>
          </div>
          {(slot === 'wall' || slot === 'floor') && <TintPicker part={slot} />}
          {movable && (
            <p className="mt-2 rounded-2xl bg-white/[0.035] px-3 py-2.5 text-[12px] text-slate-400 leading-snug">
              <b className="text-white font-semibold">Put as many as you like.</b> {onWall(slot) ? 'Hang them anywhere on the wall' : 'Stand them anywhere on the floor'}, even the same one twice. Drag them around with Decorate.
            </p>
          )}
          <div className="mt-2 grid grid-cols-2 min-[520px]:grid-cols-3 gap-2 rows-stagger">
            {items.map((item) => {
              const have = ownsDecor(world, item);
              const count = movable ? layout.filter((p) => p.id === item.id).length : 0;
              const on = movable ? count > 0 : current?.id === item.id;
              const trying = previewId === item.id;
              const gate = canUnlock(item.unlock, stats);
              const full = movable && layout.length >= MAX_PLACED;
              return (
                <div key={item.id} className={`rounded-[20px] p-2.5 transition-shadow ${on ? 'world-home-here' : trying ? 'bg-white/[0.06] ring-1 ring-white/40' : 'bg-white/[0.035]'}`}>
                  <button
                    onClick={() => (movable ? (have ? !full && startNew(item) : !item.unlock.chest && startNew(item, true)) : have ? !on && place(item) : setPreviewId(trying ? null : item.id))}
                    className="block w-full rounded-2xl overflow-hidden"
                    aria-label={have ? `Place ${item.name}` : `Try ${item.name} in your room`}
                  >
                    <Thumb item={item} tier={property.tier} trophies={trophies} books={books} locked={!have && !gate.ok} />
                  </button>
                  <p className="mt-2 text-[13px] font-semibold text-white leading-tight">{item.name}</p>
                  {item.blurb && <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{item.blurb}</p>}
                  {!have && <Requirements unlock={item.unlock} stats={stats} compact />}
                  <div className="mt-2 flex gap-1.5">
                    {movable && have ? (
                      <>
                        {count > 0 && <span className="self-center text-xs font-bold text-[var(--mood)]">{count} in room</span>}
                        <button disabled={full} onClick={() => startNew(item)} className="flex-1 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-40 px-3 py-1.5 text-xs font-semibold text-white">
                          {count > 0 ? '+ Add another' : 'Place'}
                        </button>
                      </>
                    ) : on ? (
                      <span className="flex-1 self-center text-xs font-bold text-[var(--mood)]">In your room</span>
                    ) : have ? (
                      <button onClick={() => place(item)} className="flex-1 rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
                        Place
                      </button>
                    ) : null}
                    {have ? null : (
                      <>
                        {!trying && !item.unlock.chest && (
                          <button onClick={() => (movable ? startNew(item, true) : setPreviewId(item.id))} className="shrink-0 rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-slate-200">
                            Try
                          </button>
                        )}
                        <BuyButton gate={gate} coins={item.unlock.coins} small onClick={() => onBuy({ id: item.id, name: item.name, coins: item.unlock.coins })} verb="Get" />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  function place(item: DecorItem) {
    dispatch({ type: 'WORLD_PLACE', slot: item.slot, itemId: item.id });
    setPreviewId(null);
    setPlaced({ slot: item.slot, key: Date.now() });
  }
}

/** A close-up of one item, drawn with the same art as the room. */
const TINTS: Record<'wall' | 'floor', string[]> = {
  wall: ['#f4e9d8', '#f7d6d0', '#ffd98a', '#c9e8c2', '#a8dadc', '#9ec5ff', '#c3b5f5', '#f1a7c9', '#ff9e7a', '#8fd18a', '#3d4a6b', '#2b2b33'],
  floor: ['#d9b48a', '#a8774f', '#6b4a33', '#c9c4bc', '#8d8a85', '#3b3f46', '#e8dfd0', '#b5651d', '#5b7a5a', '#6c5a8a', '#2f4f6f', '#f0e6d2'],
};

/** Paint the room any colour you like (free). It goes over the wall or floor you own. */
function TintPicker({ part }: { part: 'wall' | 'floor' }) {
  const { state, dispatch } = useApp();
  const current = worldOf(state).tints?.[part];
  const set = (color: string | null) => dispatch({ type: 'WORLD_TINT', part, color });
  return (
    <div className="mt-2 rounded-2xl bg-white/[0.035] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-white">{part === 'wall' ? 'Paint the walls' : 'Floor colour'}</span>
        {current && (
          <button onClick={() => set(null)} className="text-[12px] font-semibold text-slate-400 hover:text-white">
            Reset
          </button>
        )}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {TINTS[part].map((c) => (
          <button key={c} onClick={() => set(c)} aria-label={`Colour ${c}`} aria-pressed={current === c} className={`aspect-square rounded-lg ring-1 ring-black/20 ${current === c ? 'outline outline-2 outline-offset-2 outline-[var(--mood)]' : ''}`} style={{ background: c }} />
        ))}
        <label className="aspect-square rounded-lg flex items-center justify-center cursor-pointer" style={{ background: 'conic-gradient(#f87171,#fbbf24,#a3e635,#22d3ee,#818cf8,#e879f9,#f87171)' }} aria-label="Pick any colour">
          <input type="color" value={current ?? '#ffffff'} onChange={(e) => set(e.target.value)} className="opacity-0 w-0 h-0" />
          <span className="w-4 h-4 rounded-full bg-white/90 text-[11px] leading-4 text-center font-bold text-slate-700">+</span>
        </label>
      </div>
    </div>
  );
}

function Thumb({ item, tier, trophies, books, locked }: { item: DecorItem; tier: number; trophies: number; books: number; locked: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  // Item icons are pixel sprites with a dark outline, like the vehicles.
  const pixels = usePixelated(svgRef, `${item.id}|${tier}|${trophies}|${books}`, 96, 72, { outline: item.slot !== 'window' });
  const rect = DECOR_SLOTS.find((s) => s.id === item.slot)?.rect;
  if (item.slot === 'wall' || item.slot === 'floor' || !rect) {
    return (
      <div className="aspect-[4/3] w-full" style={{ background: `linear-gradient(160deg, ${item.color ?? '#888'}, color-mix(in srgb, ${item.color ?? '#888'} 70%, #000))` }}>
        <div className="w-full h-full" style={{ background: item.slot === 'floor' ? 'repeating-linear-gradient(90deg, transparent 0 22px, rgba(0,0,0,.12) 22px 24px)' : 'linear-gradient(180deg, transparent 70%, rgba(0,0,0,.18))' }} />
      </div>
    );
  }
  const win = windowRect(tier);
  let [x, y, w, h] = rect;
  if (item.slot === 'window') [x, y, w, h] = [win.x - 40, win.y - 30, win.w + 80, win.h + 70];
  // Pad to a 4:3 box so every card lines up.
  const pad = 14;
  let vw = w + pad * 2;
  let vh = h + pad * 2;
  if (vw / vh > 4 / 3) vh = (vw * 3) / 4;
  else vw = (vh * 4) / 3;
  const vx = x + w / 2 - vw / 2;
  const vy = y + h / 2 - vh / 2;
  const empty = item.model === 'none';
  return (
    <div className="car-tile aspect-[4/3] w-full relative">
      {empty ? (
        <span className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-white/50">Leave empty</span>
      ) : (
        <>
          <svg ref={svgRef} viewBox={`${vx} ${vy} ${vw} ${vh}`} className="absolute inset-0 w-full h-full" style={{ opacity: pixels ? 0 : 1 }} aria-hidden="true">
            <RoomDefs />
            {item.slot === 'window' && <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="#9cc9ea" />}
            <SlotArt item={item} night={false} trophies={trophies} books={books} win={win} />
          </svg>
          {pixels && <img src={pixels} alt="" aria-hidden="true" className={`px-art absolute inset-0 w-full h-full ${locked ? 'car-card-lock' : ''}`} draggable={false} />}
        </>
      )}
      {locked && (
        <span className="absolute right-1.5 top-1.5 w-6 h-6 rounded-full bg-black/55 flex items-center justify-center text-white/80">
          <Icon name="🔒" size={12} />
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- homes */

function HomesSection({ stats, onBuy }: { stats: DerivedStats; onBuy: (p: Pending) => void }) {
  const { state, dispatch } = useApp();
  const world = worldOf(state);
  const [preview, setPreview] = useState<string | null>(null);
  const shown = preview ? PROPERTIES.find((p) => p.id === preview) ?? null : null;
  return (
    <div>
      <p className="text-[13px] text-slate-400">Every home is a different place: its own walls, view and style. Tap one to look inside before you move.</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5 rows-stagger">
        {PROPERTIES.map((p) => {
          const owned = owns(world, p.id);
          const here = world.property === p.id;
          const gate = canUnlock(p.unlock, stats);
          return (
            <div key={p.id} className={`relative overflow-hidden rounded-[22px] ${here ? 'world-home-here' : 'bg-white/[0.035]'}`}>
              <button onClick={() => setPreview(p.id)} className="block w-full text-left" aria-label={`Look inside ${p.name}`}>
                <div className="relative">
                  <HomeThumb id={p.id} className={`aspect-[16/10] w-full ${!owned && !gate.ok ? 'car-card-lock' : ''}`} />
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white">
                    <Icon name={here ? '🏠' : owned ? '✓' : gate.ok ? '🔑' : '🔒'} size={11} />
                    {here ? 'Home' : owned ? 'Yours' : gate.ok ? 'Ready' : `LV ${p.unlock.level}`}
                  </span>
                </div>
                <div className="px-3 pt-2">
                  <p className="text-[14px] font-semibold text-white leading-tight">{p.name}</p>
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mt-0.5">{p.blurb}</p>
                </div>
              </button>
              <div className="px-3 pb-3 pt-2">
                {here ? (
                  <span className="text-xs font-bold text-[var(--mood)]">You live here</span>
                ) : owned ? (
                  <button onClick={() => dispatch({ type: 'WORLD_MOVE', property: p.id })} className="w-full rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
                    Live here
                  </button>
                ) : (
                  <BuyButton gate={gate} coins={p.unlock.coins} small onClick={() => onBuy({ id: p.id, name: p.name, coins: p.unlock.coins })} verb="Move in" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {shown && (
        <HomePreview
          id={shown.id}
          onClose={() => setPreview(null)}
          action={
            world.property === shown.id ? null : owns(world, shown.id) ? (
              <button onClick={() => { dispatch({ type: 'WORLD_MOVE', property: shown.id }); setPreview(null); }} className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-[#fff]">
                Live here
              </button>
            ) : (
              <BuyButton gate={canUnlock(shown.unlock, stats)} coins={shown.unlock.coins} onClick={() => { setPreview(null); onBuy({ id: shown.id, name: shown.name, coins: shown.unlock.coins }); }} verb="Move in" />
            )
          }
        />
      )}
    </div>
  );
}

/** Walk into a home before buying it: the real room, with your character and your furniture. */
function HomePreview({ id, onClose, action }: { id: string; onClose: () => void; action: React.ReactNode }) {
  const { state, stats } = useApp();
  const world = worldOf(state);
  const property = PROPERTIES.find((p) => p.id === id)!;
  const look: WorldState = { ...world, property: id, decor: { ...world.decor, wall: undefined, floor: undefined }, tints: undefined };
  const gate = canUnlock(property.unlock, stats);
  useBackToClose(true, onClose);
  return createPortal(
    <div data-overlay className="theme-dark fixed inset-0 z-[80] bg-[#07080c] backdrop-in flex flex-col">
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <div>
          <p className="px-label text-[9px] text-amber-200">{owns(world, id) ? 'Your home' : 'Preview'}</p>
          <p className="font-display text-xl font-semibold text-white">{property.name}</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:bg-white/10">
          <Icon name="✕" size={20} />
        </button>
      </div>
      <div className="flex-1 min-h-0 px-3">
        <div className="relative h-full max-h-[460px]">
          <Room world={look} trophies={0} books={0} focus={null} time="day" character={{ look: state.character }} />
        </div>
      </div>
      <div className="px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="text-[13px] text-slate-400">{property.blurb}</p>
        {!owns(world, id) && <Requirements unlock={property.unlock} stats={stats} />}
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[12px] text-slate-500">{gate.ok || owns(world, id) ? 'Drag to look around.' : 'Keep going to unlock it.'}</span>
          {action}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------------------------------------------------------- shared bits */

