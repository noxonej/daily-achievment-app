import { PixelChest } from './PixelArt';

/** The reward chest (pixel art, matches the character). `glow` is the prize colour. */
export function ChestArt(props: { open?: boolean; glow?: string; size?: number; shine?: boolean }) {
  return <PixelChest {...props} />;
}
