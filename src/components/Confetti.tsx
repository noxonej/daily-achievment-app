import { useMemo, type CSSProperties } from 'react';

const COLORS = ['#f59e0b', '#fb7185', '#38bdf8', '#34d399', '#fbbf24', '#a78bfa'];

type ConfettiStyle = CSSProperties & { '--drift': string; '--rotate': string };

interface ConfettiProps {
  count?: number;
}

// Purely decorative, so the particle layout is genuine randomness (not the
// deterministic hash used for app-state decisions) — it never needs to be
// reproduced the same way twice.
export function Confetti({ count = 28 }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.25,
        duration: 1.1 + Math.random() * 0.6,
        rotate: Math.round(Math.random() * 360),
        drift: Math.round((Math.random() - 0.5) * 140),
        color: COLORS[i % COLORS.length],
        size: 5 + Math.random() * 5,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-sm animate-confetti-fall"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 1.6,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
              '--rotate': `${p.rotate}deg`,
            } as ConfettiStyle
          }
        />
      ))}
    </div>
  );
}
