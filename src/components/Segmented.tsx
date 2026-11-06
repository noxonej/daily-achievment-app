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
          className={`relative flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold transition-colors ${
            o.id === value ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {o.icon && <Icon name={o.icon} size={15} />}
          {o.label}
          {!!o.badge && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center">{o.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
