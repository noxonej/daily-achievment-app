/**
 * The moment a quest is ticked (2026-11-14 redesign). Before: a rainbow of glowing dots and spinning
 * stars, which looked random. Now one colour (Squzo's "done" green) and three beats with a job each:
 * 1. a disc of colour fills the icon tile from the centre (the tap "lands"),
 * 2. one thin ring eases outward (confirms it, then gets out of the way),
 * 3. eight small chips fly out, slow down and drop a little, like real confetti with weight.
 * The card then gets a soft green sweep. Pure CSS (transform + opacity), so it's cheap on phones.
 */
const CHIPS = Array.from({ length: 8 }, (_, i) => ({
  a: i * 45 + 18 + (i % 2) * 9,
  r: 26 + (i % 3) * 7,
  w: i % 3 === 0 ? 3 : 4,
  h: i % 3 === 0 ? 7 : 4,
  c: i % 2 ? 'var(--color-emerald-300)' : '#eafff5',
  d: (i % 4) * 0.018,
}));

export function CompleteBurst() {
  return (
    <span className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <span className="qc-fill" />
      <span className="qc-ring" />
      {CHIPS.map((c, i) => (
        <span key={i} className="qc-chip-arm" style={{ transform: `rotate(${c.a}deg)` }}>
          <span className="qc-chip" style={{ ['--r' as string]: `${c.r}px`, width: c.w, height: c.h, marginLeft: -c.w / 2, background: c.c, animationDelay: `${0.06 + c.d}s` }} />
        </span>
      ))}
    </span>
  );
}
