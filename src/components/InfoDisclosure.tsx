import { useState } from 'react';

interface InfoDisclosureProps {
  text: string;
  className?: string;
}

/**
 * A small "i" affordance that expands inline on tap (mobile) or click (desktop)
 * to reveal a longer clarifying explanation. Stops click propagation so it can
 * sit inside cards that are themselves clickable without triggering them.
 */
export function InfoDisclosure({ text, className = '' }: InfoDisclosureProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Hide more info' : 'Show more info'}
        title="More info"
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full border text-[10px] font-bold leading-none transition ${
          open
            ? 'border-amber-400 text-amber-300 bg-amber-500/10'
            : 'border-slate-500 text-slate-500 hover:text-slate-300 hover:border-slate-300'
        }`}
      >
        i
      </button>
      {open && (
        <p className="mt-2 text-xs text-slate-300 leading-relaxed bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
          {text}
        </p>
      )}
    </div>
  );
}
