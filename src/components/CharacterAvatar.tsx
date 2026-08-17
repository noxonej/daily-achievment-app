import type { Character } from '../lib/types';
import { findCosmetic } from '../data/cosmetics';

interface CharacterAvatarProps {
  character: Character;
  size?: number;
}

export function CharacterAvatar({ character, size = 96 }: CharacterAvatarProps) {
  const outfit = findCosmetic(character.outfit) ?? findCosmetic('outfit-violet')!;
  const hat = findCosmetic(character.hat);
  const accessory = findCosmetic(character.accessory);
  const aura = findCosmetic(character.aura);
  const bodySize = size * 0.68;
  const eye = Math.max(2, size * 0.055);

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      {aura?.value && (
        <div
          className="absolute rounded-full blur-md"
          style={{
            width: size * 0.95,
            height: size * 0.95,
            background: `radial-gradient(circle, ${aura.value}99, transparent 70%)`,
          }}
        />
      )}
      <div
        className="relative flex items-center justify-center shadow-lg"
        style={{ width: bodySize, height: bodySize, background: outfit.value, borderRadius: '32%' }}
      >
        <div className="absolute flex" style={{ top: '36%', gap: size * 0.11 }}>
          <span className="rounded-full bg-[#0b0e17]" style={{ width: eye, height: eye }} />
          <span className="rounded-full bg-[#0b0e17]" style={{ width: eye, height: eye }} />
        </div>
        <div
          className="absolute rounded-full bg-[#0b0e17]"
          style={{ width: size * 0.16, height: Math.max(2, size * 0.03), top: '56%' }}
        />
        {hat?.value && (
          <span
            className="absolute leading-none select-none"
            style={{ top: -size * 0.24, fontSize: size * 0.36 }}
          >
            {hat.value}
          </span>
        )}
        {accessory?.value && (
          <span
            className="absolute leading-none select-none"
            style={{ bottom: -size * 0.06, right: -size * 0.1, fontSize: size * 0.26 }}
          >
            {accessory.value}
          </span>
        )}
      </div>
    </div>
  );
}
