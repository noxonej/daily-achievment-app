import type { CarMods } from '../lib/types';
import type { Vehicle } from './catalog';
import { CarArt } from './cars/CarArt';
import { VehicleArt } from './VehicleArt';

/** Any vehicle: cars come from the car designer (with their parts), bikes from the bike drawings. */
export function VehicleDraw({ vehicle, hex, parts, className = '', spin = false, shadow = true }: { vehicle: Vehicle; hex: string; parts?: CarMods; className?: string; spin?: boolean; shadow?: boolean }) {
  if (vehicle.car) return <CarArt body={vehicle.car.body} paint={hex} parts={parts} className={className} spin={spin} shadow={shadow} />;
  return <VehicleArt vehicle={vehicle} paint={hex} className={className} spin={spin} />;
}
