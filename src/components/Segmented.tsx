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
  // With four or more options the icons only fit on wide screens; otherwise words only, with room around them.
  const iconClass = tight ? 'hidden min-[520px]:block' : crowded ? 'hidden min-[420px]:block' : '';
  return (
    <div className="seg relative grid rounded-full bg-white/[0.05] p-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      <span
        className="seg-pill absolute top-1.5 bottom-1.5 left-1.5 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
        style={{ width: `calc((100% - 0.75rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          aria-pressed={o.id === value}
          className={`seg-btn relative min-w-0 flex items-center justify-center gap-1.5 px-2 py-2.5 font-bold transition-colors ${tight ? 'seg-tight text-[13px] min-[400px]:text-sm' : 'text-sm'} ${
            o.id === value ? 'seg-on' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {o.icon && <Icon name={o.icon} size={15} className={`shrink-0 ${iconClass}`} />}
          <span className="min-w-0 leading-tight text-center">{o.label}</span>
          {!!o.badge && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center">{o.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
