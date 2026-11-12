import type { Vehicle } from './catalog';

/** Side view of a vehicle in its paint colour. viewBox 200 × 90, wheels resting on y = 80. */
export function VehicleArt({ vehicle, paint, className = '', spin = false }: { vehicle: Vehicle; paint: string; className?: string; spin?: boolean }) {
  const dark = shade(paint, 0.35);
  const light = shade(paint, -0.35);
  const glass = '#1d2a36';
  const k = vehicle.kind;
  return (
    <svg viewBox="0 0 200 90" className={className} role="img" aria-label={vehicle.name}>
      <ellipse cx="100" cy="84" rx={k === 'bike' || k === 'racebike' || k === 'scooter' ? 52 : 82} ry="4" fill="#000" opacity="0.35" />
      {(k === 'bike' || k === 'racebike') && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Wheel cx={56} r={22} spokes spin={spin} thin />
          <Wheel cx={144} r={22} spokes spin={spin} thin />
          <path d="M56 80 L84 48 L132 48 L144 80 M84 48 L100 80 L132 48 M100 80 L56 80" stroke={paint} strokeWidth={k === 'racebike' ? 5 : 4} />
          <path d={k === 'racebike' ? 'M132 48 L128 36 L142 34 Q150 36 146 44' : 'M132 48 L128 34 L140 32'} stroke="#2a2a2e" strokeWidth="3" />
          <path d="M84 48 L80 38 M72 36 h16" stroke="#2a2a2e" strokeWidth="4" />
          {k === 'bike' && <path d="M40 60 Q 56 52 72 60" stroke={dark} strokeWidth="3" />}
        </g>
      )}
      {k === 'scooter' && (
        <g strokeLinecap="round">
          <Wheel cx={50} r={12} spin={spin} />
          <Wheel cx={150} r={12} spin={spin} />
          <path d="M50 76 H150" stroke={paint} strokeWidth="8" />
          <path d="M146 76 L136 20" stroke={paint} strokeWidth="5" />
          <path d="M128 20 h18" stroke="#2a2a2e" strokeWidth="5" />
          <rect x="70" y="70" width="60" height="5" rx="2" fill={light} />
        </g>
      )}
      {k === 'moto' && (
        <g strokeLinecap="round" strokeLinejoin="round">
          <Wheel cx={48} r={20} spin={spin} />
          <Wheel cx={152} r={20} spin={spin} />
          <path d="M48 80 L80 54 H128 L152 80" stroke="#2a2a2e" strokeWidth="5" fill="none" />
          <path d="M74 52 Q 92 32 122 38 L134 50 Q 110 60 74 56 Z" fill={paint} />
          <path d="M60 48 Q 74 42 92 46 L90 52 H62 Z" fill="#1d1e22" />
          <path d="M134 50 L142 30 M136 28 h14" stroke="#2a2a2e" strokeWidth="4" />
          <rect x="90" y="58" width="26" height="12" rx="3" fill="#6b6f78" />
          <path d="M60 66 h22" stroke="#b9c0c9" strokeWidth="4" />
        </g>
      )}
      {(k === 'hatch' || k === 'coupe' || k === 'classic' || k === 'super') && (
        <g>
          <path d={BODY[k]} fill={paint} />
          <path d={BODY[k]} fill="none" stroke={dark} strokeWidth="1.5" />
          {k !== 'classic' && <path d={GLASS[k]} fill={glass} />}
          {k === 'classic' && (
            <>
              <path d="M70 44 L82 34 L86 44 Z" fill={glass} opacity="0.7" />
              <circle cx="96" cy="40" r="5" fill="#3a2a1a" />
              <path d="M24 60 H178" stroke="#e8e6e1" strokeWidth="2" />
            </>
          )}
          {/* shine */}
          <path d={`M${k === 'super' ? 40 : 30} ${k === 'super' ? 54 : 50} Q 100 ${k === 'super' ? 44 : 40} ${k === 'super' ? 168 : 170} 52`} stroke={light} strokeWidth="2.5" fill="none" opacity="0.7" />
          {/* lights */}
          <rect x={k === 'super' ? 176 : 176} y={k === 'super' ? 58 : 54} width="8" height="4" rx="2" fill="#fff6d6" />
          <rect x="12" y={k === 'super' ? 60 : 56} width="7" height="4" rx="2" fill="#ff4d5a" />
          <Wheel cx={k === 'hatch' ? 50 : 52} r={k === 'super' ? 15 : 14} spin={spin} sport={k === 'super' || k === 'coupe'} />
          <Wheel cx={k === 'hatch' ? 150 : 150} r={k === 'super' ? 15 : 14} spin={spin} sport={k === 'super' || k === 'coupe'} />
          {k === 'super' && <path d="M14 46 L30 44 L28 50 Z" fill={dark} />}
        </g>
      )}
    </svg>
  );
}

const BODY: Record<string, string> = {
  hatch: 'M14 70 Q 12 56 26 54 L56 50 L72 30 Q 78 26 90 26 H128 Q 138 26 146 36 L156 50 Q 184 52 186 64 L186 72 Q 186 76 180 76 H20 Q 14 76 14 70 Z',
  coupe: 'M12 70 Q 12 58 30 56 L64 52 Q 82 34 104 32 H124 Q 140 34 154 50 Q 184 52 188 64 L188 72 Q 188 76 182 76 H18 Q 12 76 12 70 Z',
  classic: 'M10 70 Q 10 58 26 56 L66 52 L78 44 H92 L104 52 L150 52 Q 186 54 190 64 L190 72 Q 190 76 184 76 H16 Q 10 76 10 70 Z',
  super: 'M10 72 Q 8 62 20 60 L60 54 Q 92 36 116 36 Q 138 38 160 54 Q 190 58 192 66 L192 72 Q 192 76 186 76 H16 Q 10 76 10 72 Z',
};

const GLASS: Record<string, string> = {
  hatch: 'M62 50 L76 32 Q 80 30 88 30 H106 V50 Z M110 50 V30 H128 Q 136 30 142 38 L150 50 Z',
  coupe: 'M70 52 Q 86 38 104 36 H112 V52 Z M116 52 V36 H124 Q 136 38 146 52 Z',
  super: 'M68 54 Q 92 40 114 40 Q 132 42 148 54 Z',
};

function Wheel({ cx, r, spokes = false, spin = false, thin = false, sport = false }: { cx: number; r: number; spokes?: boolean; spin?: boolean; thin?: boolean; sport?: boolean }) {
  const cy = 80 - r;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={thin ? 'none' : '#16171a'} stroke="#16171a" strokeWidth={thin ? 3 : 0} />
      {!thin && <circle cx={cx} cy={cy} r={r * 0.6} fill={sport ? '#2b2d33' : '#b9c0c9'} />}
      <g className={spin ? 'wheel-spin' : ''} style={{ transformOrigin: `${cx}px ${cy}px` }}>
        {(spokes ? [0, 30, 60, 90, 120, 150] : sport ? [0, 72, 144, 216, 288] : [0, 90]).map((a) => (
          <line
            key={a}
            x1={cx - Math.cos((a * Math.PI) / 180) * r * (spokes ? 0.95 : 0.55)}
            y1={cy - Math.sin((a * Math.PI) / 180) * r * (spokes ? 0.95 : 0.55)}
            x2={cx + Math.cos((a * Math.PI) / 180) * r * (spokes ? 0.95 : 0.55)}
            y2={cy + Math.sin((a * Math.PI) / 180) * r * (spokes ? 0.95 : 0.55)}
            stroke={spokes ? '#9aa1ad' : sport ? '#d4a63a' : '#6b6f78'}
            strokeWidth={spokes ? 0.8 : 2.2}
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={thin ? 2 : r * 0.15} fill="#2a2a2e" />
    </g>
  );
}

/** Darken (f > 0) or lighten (f < 0) a hex colour. */
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const t = f > 0 ? 0 : 255;
  const p = Math.abs(f);
  const c = (s: number) => Math.round(((n >> s) & 255) * (1 - p) + t * p);
  return `#${((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, '0')}`;
}
