import type { CarMods } from '../lib/types';
import type { Vehicle } from './catalog';
import { vehicleSprite } from './px/sprite';

/**
 * Any vehicle as pixel art (2026-11-16). `crop` trims empty space for cards; without it every
 * vehicle sits on the same canvas so cars, motorcycles and scooters keep their true sizes.
 */
export function VehicleDraw({
  vehicle,
  hex,
  parts,
  className = '',
  crop = true,
  spin = false,
}: {
  vehicle: Vehicle;
  hex: string;
  parts?: CarMods;
  className?: string;
  crop?: boolean;
  /** Little reveal bounce (chest prizes). */
  spin?: boolean;
  shadow?: boolean;
}) {
  const s = vehicleSprite(vehicle, hex, parts, { crop });
  return <img src={s.url} width={s.w} height={s.h} alt={vehicle.name} draggable={false} className={`px-art ${spin ? 'veh-pop' : ''} ${className}`} />;
}
