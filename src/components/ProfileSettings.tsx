import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { FOCUS_AREAS } from '../lib/routine';
import type { FocusArea } from '../lib/types';
import { Icon } from './Icon';
import { ACCENTS, BACKGROUNDS } from '../lib/theme';

/** Name and the areas you're working on (the starter plan was built from these). */
export function ProfileCard() {
  const { state, dispatch } = useApp();
  const profile = state.profile ?? { name: '', focusAreas: [], wakeTime: '07:00', bedTime: '22:30' };
  const [name, setName] = useState(profile.name);

  function toggle(a: FocusArea) {
    const areas = profile.focusAreas.includes(a) ? profile.focusAreas.filter((x) => x !== a) : [...profile.focusAreas, a];
    dispatch({ type: 'SET_PROFILE', profile: { focusAreas: areas } });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
      <label className="block">
        <span className="text-xs font-semibold text-slate-400">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => dispatch({ type: 'SET_PROFILE', profile: { name: name.trim() } })}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          placeholder="Your first name"
          maxLength={24}
          className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-3 h-11 text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
        />
      </label>
      <div>
        <span className="text-xs font-semibold text-slate-400">I'm a</span>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          {(
            [
              ['female', 'Girl'],
              ['male', 'Guy'],
              ['unsaid', 'Rather not say'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => dispatch({ type: 'SET_PROFILE', profile: { gender: id } })}
              aria-pressed={profile.gender === id}
              className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                profile.gender === id ? 'bg-amber-500/15 border-amber-400/60 text-amber-100' : 'border-white/10 text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="block text-[11px] text-slate-500 mt-1.5">Used for a few health tips (like iron or protein) and your water goal.</span>
      </div>
      <div>
        <span className="text-xs font-semibold text-slate-400">What you're working on</span>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {FOCUS_AREAS.map((a) => {
            const on = profile.focusAreas.includes(a.id);
            return (
              <button
                key={a.id}
                onClick={() => toggle(a.id)}
                aria-pressed={on}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  on ? 'bg-amber-500/15 border-amber-400/60 text-amber-100' : 'border-white/10 text-slate-400'
                }`}
              >
                <Icon name={a.icon} size={14} />
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AccentPicker() {
  const { state, dispatch } = useApp();
  return (
    <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Accent colour">
      {ACCENTS.map((a) => {
        const on = (state.appearance?.accent ?? 'cyber') === a.id;
        return (
          <button
            key={a.id}
            role="radio"
            aria-checked={on}
            aria-label={a.label}
            title={a.label}
            onClick={() => dispatch({ type: 'SET_APPEARANCE', appearance: { accent: a.id } })}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${on ? 'ring-2 ring-white ring-offset-2 ring-offset-canvas scale-110' : 'hover:scale-105'}`}
            style={{ background: a.hex }}
          >
            {on && <Icon name="✓" size={16} strokeWidth={3} className="text-[#fff] animate-check" />}
          </button>
        );
      })}
    </div>
  );
}

export function BackgroundPicker() {
  const { state, dispatch } = useApp();
  return (
    <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Background">
      {BACKGROUNDS.map((b) => {
        const on = (state.appearance?.background ?? 'nebula') === b.id;
        return (
          <button
            key={b.id}
            role="radio"
            aria-checked={on}
            onClick={() => dispatch({ type: 'SET_APPEARANCE', appearance: { background: b.id } })}
            className={`rounded-xl border-2 p-1.5 text-left transition ${on ? 'border-amber-400' : 'border-white/10 hover:border-white/25'}`}
          >
            <span className="block h-12 rounded-lg p-1.5 space-y-1" style={{ background: b.glow ? `${b.glow}, ${b.bg}` : b.bg }}>
              <span className="block h-2.5 w-3/4 rounded" style={{ background: b.surface }} />
              <span className="block h-2.5 w-1/2 rounded" style={{ background: b.surface }} />
            </span>
            <span className="block text-xs font-bold text-white mt-1.5 px-0.5">{b.label}</span>
            <span className="block text-[10px] text-slate-500 px-0.5 leading-tight">{b.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

