import { Icon } from './Icon';

/** Pill-style segmented control used to switch sections inside a tab. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ id: T; label: string; icon?: string; badge?: number }>;
  onChange: (v: T) => void;
}) {
  const index = Math.max(0, options.findIndex((o) => o.id === value));
  // Four or more options get tight on small phones: drop the icons there and use slightly smaller text.
  const tight = options.length >= 4;
  // Long labels or many options: on small phones show the words only, so nothing collides.
  const crowded = tight || options.some((o) => o.label.length > 9);
  return (
    <div className="relative grid rounded-2xl bg-white/[0.04] border border-white/10 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      <span
        className="absolute top-1 bottom-1 left-1 rounded-xl bg-amber-500 shadow transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
        style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          aria-pressed={o.id === value}
          className={`relative min-w-0 flex items-center justify-center gap-1.5 px-1 py-2.5 font-bold transition-colors ${tight ? 'text-[13px] min-[400px]:text-sm' : 'text-sm'} ${
            o.id === value ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {o.icon && <Icon name={o.icon} size={15} className={`shrink-0 ${crowded ? 'hidden min-[400px]:block' : ''}`} />}
          <span className="min-w-0 leading-tight text-center">{o.label}</span>
          {!!o.badge && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center">{o.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
