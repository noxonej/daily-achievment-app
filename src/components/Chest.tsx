/** A treasure chest drawing. `open` lifts the lid; `glow` tints the light that spills out. */
export function ChestArt({ open = false, glow = '#fbbf24', size = 160 }: { open?: boolean; glow?: string; size?: number }) {
  return (
    <svg viewBox="0 0 120 110" width={size} height={size * (110 / 120)} aria-hidden="true">
      <defs>
        <linearGradient id="chestWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b45309" />
          <stop offset="1" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="chestLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d97706" />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="chestGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <radialGradient id="chestLight" cx=".5" cy="1" r=".9">
          <stop offset="0" stopColor={glow} stopOpacity=".95" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="104" rx="46" ry="5" fill="#000" opacity=".35" />
      {open && <path d="M18 58 L-10 -10 H130 L102 58 Z" fill="url(#chestLight)" />}
      {/* body */}
      <rect x="14" y="56" width="92" height="46" rx="6" fill="url(#chestWood)" />
      <path d="M14 70 H106 M14 86 H106" stroke="#5c2d0c" strokeWidth="1.2" opacity=".6" />
      <rect x="14" y="56" width="92" height="46" rx="6" fill="none" stroke="url(#chestGold)" strokeWidth="4" />
      <rect x="28" y="56" width="7" height="46" fill="url(#chestGold)" />
      <rect x="85" y="56" width="7" height="46" fill="url(#chestGold)" />
      {/* lock */}
      <rect x="51" y="58" width="18" height="20" rx="3" fill="url(#chestGold)" stroke="#92400e" strokeWidth="1" />
      <circle cx="60" cy="66" r="2.6" fill="#78350f" />
      <path d="M60 67 V72" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round" />
      {/* lid */}
      <g
        style={{
          transformOrigin: '60px 56px',
          transform: open ? 'translateY(-18px) rotate(-12deg)' : 'none',
          transition: 'transform .45s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        <path d="M12 58 Q12 26 60 26 Q108 26 108 58 Z" fill="url(#chestLid)" />
        <path d="M12 58 Q12 26 60 26 Q108 26 108 58 Z" fill="none" stroke="url(#chestGold)" strokeWidth="4" strokeLinejoin="round" />
        <path d="M28 58 Q28 32 31.5 30.5 M92 58 Q92 32 88.5 30.5" stroke="url(#chestGold)" strokeWidth="7" fill="none" />
        <path d="M24 40 Q40 32 56 32" stroke="#fff" strokeOpacity=".3" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
