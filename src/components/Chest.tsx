import { useId } from 'react';

/**
 * A 3D-looking treasure chest (three-quarter view): wooden planks, bevelled gold bands with
 * rivets, a lock with a gem in the prize's colour, and a barrel lid that swings open with light
 * pouring out. `glow` is the gem / light colour, `shine` adds idle sparkles.
 */
export function ChestArt({
  open = false,
  glow = '#fbbf24',
  size = 160,
  shine = false,
}: {
  open?: boolean;
  glow?: string;
  size?: number;
  shine?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const u = (n: string) => `url(#${n}${id})`;
  const LID = 'M14 68 V57 C14 39 36 28 62 28 C88 28 110 39 110 57 V68 Z';
  return (
    <svg viewBox="0 0 140 130" width={size} height={size * (130 / 140)} aria-hidden="true" className="overflow-visible">
      <defs>
        <linearGradient id={`wood${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b5652b" />
          <stop offset="1" stopColor="#6b3410" />
        </linearGradient>
        <linearGradient id={`woodSide${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7a3d14" />
          <stop offset="1" stopColor="#40200a" />
        </linearGradient>
        <linearGradient id={`lid${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9843f" />
          <stop offset=".6" stopColor="#a4561f" />
          <stop offset="1" stopColor="#7a3d14" />
        </linearGradient>
        <linearGradient id={`gold${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff4c2" />
          <stop offset=".4" stopColor="#f6c552" />
          <stop offset="1" stopColor="#b7791f" />
        </linearGradient>
        <linearGradient id={`goldSide${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d99a2b" />
          <stop offset="1" stopColor="#8a5a12" />
        </linearGradient>
        <radialGradient id={`gem${id}`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".35" stopColor={glow} />
          <stop offset="1" stopColor="#1e1b4b" />
        </radialGradient>
        <radialGradient id={`aura${id}`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={glow} stopOpacity=".7" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`beam${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff7d6" stopOpacity=".95" />
          <stop offset=".5" stopColor={glow} stopOpacity=".45" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </linearGradient>
        <clipPath id={`lidClip${id}`}>
          <path d={LID} />
        </clipPath>
      </defs>

      {(open || shine) && <circle cx="64" cy="70" r="66" fill={u('aura')} className={open ? '' : 'glow-pulse'} style={{ transformOrigin: '64px 70px' }} />}
      <ellipse cx="68" cy="120" rx="56" ry="6.5" fill="#000" opacity=".4" />

      {/* light pouring out when open */}
      {open && <path d="M22 66 L-6 -20 H134 L104 66 Z" fill={u('beam')} />}

      {/* body: side, then front */}
      <path d="M108 66 L126 58 V104 L108 114 Z" fill={u('woodSide')} />
      <path d="M108 66 L126 58 V62 L108 71 Z" fill={u('goldSide')} />
      <path d="M108 108 L126 99 V104 L108 114 Z" fill={u('goldSide')} />
      <path d="M116 62 L121 59.8 V101.6 L116 104 Z" fill={u('goldSide')} />
      <rect x="16" y="66" width="92" height="48" rx="4" fill={u('wood')} />
      {/* planks + grain */}
      <path d="M16 82 H108 M16 98 H108" stroke="#3d1d07" strokeWidth="1.4" opacity=".55" />
      <path d="M16 83.4 H108 M16 99.4 H108" stroke="#fff" strokeWidth=".8" opacity=".1" />
      <path d="M42 74 q8 2 16 0 M64 90 q10 2 18 0 M44 106 q8 2 14 0" stroke="#3d1d07" strokeWidth=".7" fill="none" opacity=".35" />
      {/* gold bands */}
      <rect x="16" y="66" width="92" height="5" fill={u('gold')} />
      <rect x="16" y="108.5" width="92" height="5.5" rx="2" fill={u('gold')} />
      <rect x="29" y="66" width="9" height="48" fill={u('gold')} />
      <rect x="86" y="66" width="9" height="48" fill={u('gold')} />
      <path d="M29.6 66 V114 M86.6 66 V114" stroke="#fff" strokeWidth=".9" opacity=".55" />
      <path d="M37.4 66 V114 M94.4 66 V114" stroke="#7c4a03" strokeWidth=".9" opacity=".55" />
      {[76, 92, 104].map((y) => (
        <g key={y}>
          <circle cx="33.5" cy={y} r="1.8" fill="#8a5a12" />
          <circle cx="33" cy={y - 0.5} r="1.1" fill="#fff4c2" />
          <circle cx="90.5" cy={y} r="1.8" fill="#8a5a12" />
          <circle cx="90" cy={y - 0.5} r="1.1" fill="#fff4c2" />
        </g>
      ))}

      {/* inside glow (seen when the lid is up) */}
      {open && (
        <g>
          <path d="M18 66 L108 66 L124 59 L34 59 Z" fill="#2a1405" />
          <ellipse cx="66" cy="64" rx="34" ry="4.5" fill="#fde68a" opacity=".9" />
          {[48, 58, 70, 82].map((x, i) => (
            <ellipse key={x} cx={x} cy={63 - (i % 2)} rx="3.2" ry="1.6" fill="#fbbf24" stroke="#b7791f" strokeWidth=".5" />
          ))}
        </g>
      )}

      {/* lock with gem */}
      <g>
        <path d="M52 69 H72 V84 C72 90 67 94 62 96 C57 94 52 90 52 84 Z" fill="#000" opacity=".25" transform="translate(1.5 2)" />
        <path d="M52 69 H72 V84 C72 90 67 94 62 96 C57 94 52 90 52 84 Z" fill={u('gold')} stroke="#8a5a12" strokeWidth="1" />
        <circle cx="62" cy="77" r="4.6" fill={u('gem')} stroke="#8a5a12" strokeWidth=".8" />
        <circle cx="60.6" cy="75.6" r="1.2" fill="#fff" opacity=".9" />
        <path d="M62 85 v5" stroke="#5a3608" strokeWidth="2.2" strokeLinecap="round" />
      </g>

      {/* lid (swings back on its hinge when opened) */}
      <g className={open ? 'chest-lid-open' : ''} style={{ transformOrigin: '62px 62px', transformBox: 'view-box' }}>
        {/* the lid's back edge, shifted back and up: gives the curved top its depth */}
        <path d={LID} transform="translate(18 -8)" fill={u('woodSide')} />
        <path d={LID} transform="translate(18 -8)" fill="none" stroke="#8a5a12" strokeWidth="1.2" />
        <path d="M110 68 L128 60 V54 L110 62 Z" fill={u('goldSide')} />
        <path d="M37 31 L55 23 M95 33 L113 25" stroke={u('goldSide')} strokeWidth="8" strokeLinecap="butt" />
        <path d={LID} fill={u('lid')} />
        <g clipPath={u('lidClip')}>
          <path d="M14 47 C22 37 40 33 62 33 C84 33 102 37 110 47" stroke="#3d1d07" strokeWidth="1.3" fill="none" opacity=".5" />
          <path d="M14 58 C26 50 44 48 62 48 C80 48 98 50 110 58" stroke="#3d1d07" strokeWidth="1.3" fill="none" opacity=".45" />
          <rect x="29" y="20" width="9" height="50" fill={u('gold')} />
          <rect x="86" y="20" width="9" height="50" fill={u('gold')} />
          <rect x="10" y="62" width="104" height="6" fill={u('gold')} />
          <path d="M22 44 C30 35 44 31.5 58 31" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".35" />
        </g>
        <path d={LID} fill="none" stroke="#8a5a12" strokeWidth="1.2" />
        <circle cx="33.5" cy="40" r="1.6" fill="#fff4c2" />
        <circle cx="90.5" cy="40" r="1.6" fill="#fff4c2" />
      </g>

      {shine &&
        [
          [14, 40, 0],
          [122, 26, 0.9],
          [130, 86, 1.6],
          [8, 96, 2.1],
        ].map(([x, y, d]) => (
          <path
            key={`${x}-${y}`}
            d={`M${x} ${y - 6} L${x + 1.6} ${y - 1.6} L${x + 6} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 6} L${x - 1.6} ${y + 1.6} L${x - 6} ${y} L${x - 1.6} ${y - 1.6}Z`}
            fill="#fde68a"
            className="twinkle"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
    </svg>
  );
}
