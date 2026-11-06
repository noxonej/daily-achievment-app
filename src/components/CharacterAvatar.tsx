import type { Character } from '../lib/types';
import { findCosmetic } from '../data/cosmetics';
import { Icon } from './Icon';

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
          <span className="absolute leading-none select-none text-amber-200 drop-shadow" style={{ top: -size * 0.3 }}>
            <Icon name={hat.value} size={size * 0.36} strokeWidth={2.2} />
          </span>
        )}
        {accessory?.value && (
          <span
            className="absolute leading-none select-none text-white drop-shadow rounded-full bg-[#0b0e17]/70 p-[3px]"
            style={{ bottom: -size * 0.08, right: -size * 0.12 }}
          >
            <Icon name={accessory.value} size={size * 0.22} strokeWidth={2.2} />
          </span>
        )}
      </div>
    </div>
  );
}
