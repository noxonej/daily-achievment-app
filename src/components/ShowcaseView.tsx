import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Character } from '../lib/types';
import { useApp } from '../store/AppContext';
import { useBackToClose } from '../lib/backstack';
import { ACHIEVEMENTS } from '../data/achievements';
import { TIER_ORDER, TIER_STYLES } from '../lib/achievementTiers';
import { levelFromTotalXp } from '../lib/xp';
import { rankForLevel } from '../lib/ranks';
import { getShowcase } from '../lib/friends';
import { DEFAULT_SHOWCASE, featuredBadges, ownShowcase, showcasePrefs, type Showcase } from '../lib/showcase';
import { CharacterSprite } from '../world/char/CharacterSprite';
import { Room } from '../world/room/Room';
import { GarageScene } from '../world/Garage';
import { RARITY_COLOR, VEHICLES, vehicleHex, partsOf, DEFAULT_WORLD } from '../world/catalog';
import { vehicleSprite } from '../world/px/sprite';
import { BadgeCrest } from './BadgeCrest';
import { Icon } from './Icon';
import { RankBadge } from './RankBadge';
import './showcase.css';

/**
 * Profile showcase (2026-11-27): visiting another player. Their character, level and progress, the
 * badges they picked, and (if they share them) their home, garage and collection. Everything here
 * comes from real progress; you can look, not change anything.
 */

function lookOf(raw?: string): Partial<Character> | undefined {
  try {
    return raw ? (JSON.parse(raw) as Partial<Character>) : undefined;
  } catch {
    return undefined;
  }
}

function Stat({ value, label }: { value: number | undefined; label: string }) {
  if (value === undefined) return null;
  return (
    <div className="sc-stat rounded-2xl px-2 py-2 text-center">
      <p className="num-px text-[22px] text-white leading-none">{value.toLocaleString()}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}

/** The showcase itself (used for visiting and for your own preview). */
export function ShowcaseBody({ sc, own = false }: { sc: Showcase; own?: boolean }) {
  const look = useMemo(() => lookOf(sc.look), [sc.look]);
  const rank = rankForLevel(sc.level);
  const prog = sc.xp !== undefined ? levelFromTotalXp(sc.xp) : null;
  const [cheer, setCheer] = useState(1);
  const clip = useMemo(() => ({ name: 'celebrate' as const, key: cheer }), [cheer]);
  const cars = (sc.cars ?? []).map((id) => VEHICLES.find((v) => v.id === id)).filter((v): v is (typeof VEHICLES)[number] => !!v);
  const rarest = [...cars].sort((a, b) => ['common', 'rare', 'epic', 'legendary'].indexOf(b.rarity) - ['common', 'rare', 'epic', 'legendary'].indexOf(a.rarity));
  const garageVehicle = sc.garage?.vehicle ? (VEHICLES.find((v) => v.id === sc.garage!.vehicle) ?? null) : null;

  return (
    <div className="space-y-4">
      {/* who they are */}
      <section className="sc-hero relative overflow-hidden rounded-[26px] p-4">
        <div className="flex items-end gap-3">
          <button className="sc-char shrink-0 w-[112px]" onClick={() => setCheer((k) => k + 1)} aria-label={`${sc.name} cheers`}>
            <CharacterSprite look={look} base="idle" clip={clip} title={sc.name} />
          </button>
          <div className="flex-1 min-w-0 pb-2">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-200">
              <RankBadge rank={rank} size={16} />
              {rank.name}
            </p>
            <p className="mt-0.5 font-display text-[26px] font-semibold text-white leading-tight truncate">{sc.name}</p>
            <p className="num-px text-[18px] text-slate-300">LV {sc.level}</p>
          </div>
        </div>
        {prog && (
          <div className="mt-3">
            <div className="flex items-baseline justify-between text-[11px] font-semibold tabular-nums text-slate-400">
              <span>Level {sc.level + 1}</span>
              <span>
                {prog.xpIntoLevel.toLocaleString()} / {prog.xpForNextLevel.toLocaleString()} XP
              </span>
            </div>
            <span className="px-bar mt-1.5 block" style={{ ['--p' as string]: `${(prog.xpIntoLevel / prog.xpForNextLevel) * 100}%` }} />
          </div>
        )}
        {(sc.streak !== undefined || sc.quests !== undefined) && (
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            <Stat value={sc.streak} label="Streak" />
            <Stat value={sc.best} label="Best" />
            <Stat value={sc.quests} label="Quests" />
            <Stat value={sc.perfect} label="Perfect" />
          </div>
        )}
      </section>

      {/* badges they picked */}
      {sc.featured.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">{own ? 'Your featured badges' : 'Featured badges'}</p>
            {sc.badges !== undefined && <p className="text-[12px] text-slate-400">{sc.badges} earned</p>}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {sc.featured.map((id) => {
              const a = ACHIEVEMENTS.find((x) => x.id === id)!;
              return (
                <div key={id} className="sc-badge rounded-2xl p-2 flex flex-col items-center text-center">
                  <BadgeCrest tier={a.tier} icon={a.icon} size={58} shine={a.tier === 'legend' || a.tier === 'platinum'} />
                  <p className="mt-1 text-[12px] font-semibold text-white leading-tight">{a.title}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${TIER_STYLES[a.tier].labelColor}`}>{TIER_STYLES[a.tier].label}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* their home */}
      {sc.room && (
        <section>
          <p className="eyebrow">{own ? 'Your home' : `${sc.name}'s home`}</p>
          <div className="sc-room mt-2 relative h-[300px] rounded-[22px] overflow-hidden">
            <Room world={sc.room.world} trophies={sc.badges ?? 0} books={0} focus={null} character={{ look: look ?? {} }} />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Drag to look around.</p>
        </section>
      )}

      {/* their garage */}
      {sc.garage && (
        <section>
          <p className="eyebrow">{own ? 'Your garage' : `${sc.name}'s garage`}</p>
          <div className="garage-card theme-dark mt-2 relative overflow-hidden rounded-[22px]">
            <GarageScene world={sc.garage.world} earned={sc.garage.trophies} vehicle={garageVehicle} hex={sc.garage.hex} parts={sc.garage.parts} look={look} env={sc.garage.env} upgrades={sc.garage.upgrades} />
            {garageVehicle && (
              <span className="absolute left-3 top-3 rounded-xl bg-black/55 px-2.5 py-1.5 pointer-events-none">
                <span className="px-label block text-[8px] leading-none" style={{ color: RARITY_COLOR[garageVehicle.rarity] }}>
                  {garageVehicle.rarity}
                </span>
                <span className="mt-1 block text-[14px] font-semibold text-[#fff] leading-tight">{garageVehicle.name}</span>
              </span>
            )}
          </div>
        </section>
      )}

      {/* collection */}
      {sc.cars && (
        <section>
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Collection</p>
            <p className="text-[12px] text-slate-400">
              <span className="num-px text-[17px] text-slate-200">{cars.length}</span>/<span className="num-px text-[17px]">{VEHICLES.length}</span> vehicles
            </p>
          </div>
          {cars.length ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {rarest.slice(0, 9).map((v) => {
                const s = vehicleSprite(v, vehicleHex(DEFAULT_WORLD, v), partsOf(DEFAULT_WORLD, v), { crop: true });
                return (
                  <div key={v.id} className={`veh-tile rounded-2xl p-1.5 ${v.cls === 'legendary' ? 'is-legend' : ''}`}>
                    <span className="veh-plinth flex items-end justify-center rounded-xl h-[46px] px-1 pb-1">
                      <img src={s.url} alt="" className="px-art max-h-full w-auto max-w-full" draggable={false} />
                    </span>
                    <span className="mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-[1px] shrink-0" style={{ background: RARITY_COLOR[v.rarity] }} />
                      <span className="text-[11px] font-semibold text-white truncate">{v.name}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-1 text-[12px] text-slate-500">No vehicles yet.</p>
          )}
        </section>
      )}
    </div>
  );
}

function Shell({ title, sub, onClose, children }: { title: string; sub: string; onClose: () => void; children: React.ReactNode }) {
  useBackToClose(true, onClose);
  return createPortal(
    <div data-overlay className="theme-dark fixed inset-0 z-[80] bg-[#07080c] backdrop-in flex flex-col">
      <div className="shrink-0 flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <button onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10">
          <Icon name="✕" size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="px-label text-[9px] text-amber-200">{sub}</p>
          <p className="font-display text-lg font-semibold text-white truncate">{title}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
    </div>,
    document.body,
  );
}

/** Visiting someone: loads their showcase by id. */
export function VisitShowcase({ uid, name, look, onClose }: { uid: string; name: string; look?: string; onClose: () => void }) {
  const [sc, setSc] = useState<Showcase | 'hidden' | null | 'loading' | 'error'>('loading');
  useEffect(() => {
    let live = true;
    getShowcase(uid)
      .then((r) => live && setSc(r))
      .catch(() => live && setSc('error'));
    return () => {
      live = false;
    };
  }, [uid]);
  const basic = useMemo(() => lookOf(look), [look]);
  return (
    <Shell title={name} sub="Visiting" onClose={onClose}>
      {sc === 'loading' ? (
        <div className="space-y-3" aria-busy="true">
          <div className="sc-skel h-[170px] rounded-[26px]" />
          <div className="sc-skel h-[110px] rounded-[22px]" />
          <div className="sc-skel h-[260px] rounded-[22px]" />
        </div>
      ) : typeof sc === 'object' && sc ? (
        <ShowcaseBody sc={sc} />
      ) : (
        <div className="pt-8 flex flex-col items-center text-center">
          <span className="w-[120px]">
            <CharacterSprite look={basic} base="idle" title={name} />
          </span>
          <p className="mt-3 font-display text-lg font-semibold text-white">
            {sc === 'hidden' ? `${name} keeps their profile private` : sc === 'error' ? "Couldn't load it right now" : `${name} hasn't shared a showcase yet`}
          </p>
          <p className="mt-1 max-w-[280px] text-[13px] text-slate-400">
            {sc === 'hidden'
              ? 'Only people they chose can visit their home and garage.'
              : sc === 'error'
                ? 'Check your connection and try again.'
                : 'It appears after they open the newest Squzo.'}
          </p>
        </div>
      )}
    </Shell>
  );
}

/** Your own showcase: what others see, and what you show. */
export function ShowcaseEditor({ onClose }: { onClose: () => void }) {
  const { state, stats, dispatch } = useApp();
  const prefs = showcasePrefs(state);
  const name = state.profile?.name || 'You';
  const preview = useMemo(() => ownShowcase(state, stats, name), [state, stats, name]);
  const set = (p: Partial<typeof DEFAULT_SHOWCASE>) => dispatch({ type: 'SET_SHOWCASE', showcase: p });
  const featured = featuredBadges(state);
  const [picking, setPicking] = useState(false);
  const earned = useMemo(
    () =>
      state.unlockedAchievements
        .map((u) => ACHIEVEMENTS.find((a) => a.id === u.id))
        .filter((a): a is (typeof ACHIEVEMENTS)[number] => !!a)
        .sort((a, b) => TIER_ORDER.indexOf(b.tier) - TIER_ORDER.indexOf(a.tier)),
    [state.unlockedAchievements],
  );
  const toggle = (id: string) => {
    const now = featured.includes(id) ? featured.filter((x) => x !== id) : [...featured, id].slice(-3);
    set({ featured: now });
  };

  return (
    <Shell title="Your showcase" sub="Profile" onClose={onClose}>
      <section className="sc-panel rounded-[22px] p-4 space-y-3">
        <div>
          <p className="text-[13px] font-semibold text-white">Who can visit you</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Who can visit you">
            {(
              [
                ['friends', 'Friends'],
                ['everyone', 'Everyone'],
                ['nobody', 'Nobody'],
              ] as const
            ).map(([id, label]) => (
              <button key={id} role="radio" aria-checked={prefs.who === id} onClick={() => set({ who: id })} className={`rounded-full py-2 text-[13px] font-semibold ${prefs.who === id ? 'seg-pill seg-on' : 'bg-white/[0.05] text-slate-300'}`}>
                {label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {prefs.who === 'everyone'
              ? 'Anyone signed in can open it, for example from the public board.'
              : prefs.who === 'friends'
                ? 'Only the friends you added can open it.'
                : 'Nobody can visit. Your character still shows next to your name.'}
          </p>
        </div>
        {prefs.who !== 'nobody' && (
          <div className="divide-y divide-white/[0.06]">
            {(
              [
                ['stats', 'Streak, quests and perfect days'],
                ['room', 'Your home'],
                ['garage', 'Your garage'],
                ['collection', 'Your vehicle collection'],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center justify-between gap-3 py-2.5 text-[13px] text-slate-200">
                {label}
                <input type="checkbox" checked={prefs[k]} onChange={(e) => set({ [k]: e.target.checked })} className="w-5 h-5 accent-amber-500" />
              </label>
            ))}
          </div>
        )}
        <p className="text-[11px] text-slate-500">Always private: money, goals, diary, notes and your quest list. Badges come from real progress, never from the shop.</p>
      </section>

      <section className="mt-4">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Featured badges</p>
          <button onClick={() => setPicking((p) => !p)} className="text-xs font-semibold text-[var(--mood)]" aria-expanded={picking}>
            {picking ? 'Done' : earned.length ? 'Choose' : ''}
          </button>
        </div>
        {picking ? (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {earned.map((a) => {
              const on = featured.includes(a.id);
              return (
                <button key={a.id} onClick={() => toggle(a.id)} aria-pressed={on} className={`sc-badge rounded-2xl p-1.5 flex flex-col items-center ${on ? 'is-on' : ''}`}>
                  <BadgeCrest tier={a.tier} icon={a.icon} size={44} />
                  <span className="mt-0.5 text-[10px] text-slate-300 leading-tight text-center line-clamp-2">{a.title}</span>
                </button>
              );
            })}
            <p className="col-span-4 text-[11px] text-slate-500">Pick up to three. {(state.showcase?.featured ?? []).length === 0 && 'Until you pick, your best three are shown.'}</p>
          </div>
        ) : (
          !earned.length && <p className="mt-1 text-[12px] text-slate-500">Earn your first badge by finishing a quest.</p>
        )}
      </section>

      <p className="mt-5 mb-2 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">This is what visitors see</p>
      {preview && <ShowcaseBody sc={preview} own />}
    </Shell>
  );
}
