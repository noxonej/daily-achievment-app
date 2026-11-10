/**
 * The one on/off switch used everywhere. Sizes are in pixels on purpose, so Easy reading (which
 * grows every gap) can't push the knob out of its track.
 */
export function Switch({
  on,
  onChange,
  label,
  color = 'bg-amber-500',
  className = '',
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  color?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative shrink-0 w-[48px] h-[28px] p-0 rounded-full transition-colors duration-200 ${on ? color : 'bg-white/15'} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-[#fff] shadow transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${on ? 'translate-x-[20px]' : 'translate-x-0'}`}
      />
    </button>
  );
}
