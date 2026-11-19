/** Reducer slice: Wardrobe and World: cosmetics, chests, home, decor, garage and cars. Returns undefined for actions it doesn't handle. */
import type { AppState } from '../../lib/types';
import { DECOR, GARAGE_ENVS, LEGENDARY_PICKS, PAINTS, PARTS, PROPERTIES, VEHICLES, canFit, worldChestPool, canUnlock, MAX_EXTRAS, garageSpots, garageUsed, isCar, legendaryPool, owns, ownsDecor, unlockOf, worldOf } from '../../world/catalog';
import { BUY_XP_SHARE } from '../../lib/xp';
import { CHEST_DUPLICATE_SHARDS, chestPool, findItem, isOwned, normalizeLook } from '../../data/avatar';
import {  computeDerivedStats } from '../../lib/stats';
import type { Action } from '../actions';
import {  ownership } from '../state';

export function worldSlice(state: AppState, action: Action): AppState | undefined {
  switch (action.type) {
    case 'UNLOCK_COSMETIC': {
      const item = findItem(action.itemId);
      if (!item || item.unlock.kind !== 'shop') return state;
      const stats = computeDerivedStats(state);
      if (isOwned(item, ownership(state, stats)) || stats.availableShards < item.unlock.cost) return state;
      return {
        ...state,
        unlockedCosmeticIds: [...state.unlockedCosmeticIds, action.itemId],
        purchases: { ...(state.purchases ?? {}), [action.itemId]: item.unlock.cost },
        bonusXp: (state.bonusXp ?? 0) + Math.round(item.unlock.cost * BUY_XP_SHARE),
      };
    }


    case 'WORLD_BUY': {
      const world = worldOf(state);
      const unlock = unlockOf(action.id);
      if (!unlock || owns(world, action.id)) return state;
      const vehicle = VEHICLES.find((v) => v.id === action.id);
      if (vehicle && garageUsed(world) >= garageSpots(world)) return state;
      if (!canUnlock(unlock, computeDerivedStats(state)).ok) return state;
      const next = { ...world, paid: { ...world.paid, [action.id]: unlock.coins } };
      if (PROPERTIES.some((p) => p.id === action.id)) {
        // A new home shows its own walls and floor (you can still repaint them).
        next.property = action.id;
        next.decor = { ...next.decor, wall: undefined, floor: undefined };
        next.tints = undefined;
      }
      const decor = DECOR.find((d) => d.id === action.id);
      if (decor) next.decor = { ...world.decor, [decor.slot]: decor.id };
      if (vehicle) next.vehicle = vehicle.id;
      if (GARAGE_ENVS.some((g) => g.id === action.id)) next.garage = action.id;
      if (PAINTS.some((p) => p.id === action.id) && action.vehicleId && owns(world, action.vehicleId)) {
        next.paints = { ...(world.paints ?? {}), [action.vehicleId]: action.id };
      }
      const bought = PARTS.find((p) => p.id === action.id);
      if (bought && action.vehicleId && owns(world, action.vehicleId)) {
        next.mods = { ...(world.mods ?? {}), [action.vehicleId]: { ...(world.mods?.[action.vehicleId] ?? {}), [bought.kind]: bought.value } };
      }
      return { ...state, world: next, bonusXp: (state.bonusXp ?? 0) + Math.round(unlock.coins * BUY_XP_SHARE) };
    }


    case 'WORLD_MOVE': {
      const world = worldOf(state);
      if (!PROPERTIES.some((p) => p.id === action.property) || !owns(world, action.property)) return state;
      return { ...state, world: { ...world, property: action.property, decor: { ...world.decor, wall: undefined, floor: undefined }, tints: undefined } };
    }


    case 'WORLD_PLACE': {
      const world = worldOf(state);
      const item = DECOR.find((d) => d.id === action.itemId && d.slot === action.slot);
      if (!item || !ownsDecor(world, item)) return state;
      return { ...state, world: { ...world, decor: { ...world.decor, [action.slot]: item.id } } };
    }


    case 'WORLD_EXTRA_ADD': {
      const world = worldOf(state);
      const item = DECOR.find((d) => d.id === action.itemId);
      if (!item || (item.slot !== 'shelf' && item.slot !== 'collectible') || item.model === 'none' || !ownsDecor(world, item)) return state;
      const extras = (world.extras ?? []).filter((e) => e.id !== item.id);
      if (extras.length >= MAX_EXTRAS) return state;
      return { ...state, world: { ...world, extras: [...extras, { id: item.id, x: Math.round(action.x), y: Math.round(action.y) }] } };
    }

    case 'WORLD_EXTRA_REMOVE': {
      const world = worldOf(state);
      return { ...state, world: { ...world, extras: (world.extras ?? []).filter((_, i) => i !== action.index) } };
    }


    case 'WORLD_FEATURE': {
      const world = worldOf(state);
      if (!owns(world, action.vehicleId)) return state;
      return { ...state, world: { ...world, vehicle: action.vehicleId } };
    }


    case 'WORLD_PAINT': {
      const world = worldOf(state);
      if (!owns(world, action.vehicleId) || !owns(world, action.paint)) return state;
      return { ...state, world: { ...world, paints: { ...(world.paints ?? {}), [action.vehicleId]: action.paint } } };
    }


    case 'WORLD_MOD': {
      const world = worldOf(state);
      const vehicle = VEHICLES.find((v) => v.id === action.vehicleId);
      const p = PARTS.find((x) => x.id === action.partId);
      if (!vehicle || !isCar(vehicle) || !p || !owns(world, vehicle.id) || !canFit(world, vehicle, p)) return state;
      const mods = { ...(world.mods ?? {}), [vehicle.id]: { ...(world.mods?.[vehicle.id] ?? {}), [p.kind]: p.value } };
      return { ...state, world: { ...world, mods } };
    }


    case 'WORLD_TINT': {
      const world = worldOf(state);
      if (action.color !== null && !/^#[0-9a-f]{6}$/i.test(action.color)) return state;
      const tints = { ...world.tints, [action.part]: action.color ?? undefined };
      return { ...state, world: { ...world, tints } };
    }

    case 'WORLD_SIZE': {
      const world = worldOf(state);
      return { ...state, world: { ...world, sizes: { ...world.sizes, [action.slot]: action.size } } };
    }

    case 'WORLD_GARAGE': {
      const world = worldOf(state);
      if (!GARAGE_ENVS.some((g) => g.id === action.id) || !owns(world, action.id)) return state;
      return { ...state, world: { ...world, garage: action.id } };
    }


    case 'LEGENDARY_PICK': {
      const world = worldOf(state);
      const pick = LEGENDARY_PICKS.find((p) => p.id === action.pickId);
      const stats = computeDerivedStats(state);
      if (!pick || (world.picks ?? []).includes(pick.id) || stats[pick.stat] < pick.target) return state;
      if (!legendaryPool(world).some((v) => v.id === action.vehicleId)) return state;
      // Legendaries never need a free garage spot: they get their own plinth.
      return { ...state, world: { ...world, picks: [...(world.picks ?? []), pick.id], paid: { ...world.paid, [action.vehicleId]: 0 }, vehicle: action.vehicleId } };
    }


    case 'EQUIP_COSMETIC': {
      const item = findItem(action.itemId);
      if (!item || item.slot !== action.slot) return state;
      if (!isOwned(item, ownership(state, computeDerivedStats(state)))) return state;
      return { ...state, character: { ...normalizeLook(state.character), [action.slot]: action.itemId } };
    }


    case 'OPEN_CHEST': {
      const stats = computeDerivedStats(state);
      if (stats.chestsAvailable <= 0) return state;
      const chestsOpened = (state.chestsOpened ?? 0) + 1;
      if (action.skip) return { ...state, chestsOpened, skipPasses: (state.skipPasses ?? 0) + 1 };
      if (action.worldId) {
        const world = worldOf(state);
        if (!worldChestPool(world).some((d) => d.id === action.worldId) && !legendaryPool(world).some((v) => v.id === action.worldId)) return state;
        // Chest drops cost nothing: they're stored as paid with 0 coins.
        return { ...state, chestsOpened, world: { ...world, paid: { ...world.paid, [action.worldId]: 0 } } };
      }
      if (action.itemId === null) {
        return { ...state, chestsOpened, bonusShards: (state.bonusShards ?? 0) + CHEST_DUPLICATE_SHARDS };
      }
      const valid = chestPool(ownership(state, stats)).some((i) => i.id === action.itemId);
      if (!valid) return state;
      return { ...state, chestsOpened, wonCosmeticIds: [...(state.wonCosmeticIds ?? []), action.itemId] };
    }

    default:
      return undefined;
  }
}
