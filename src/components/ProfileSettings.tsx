import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { FOCUS_AREAS } from '../lib/routine';
import type { FocusArea } from '../lib/types';
import { InstallCard } from './InstallCard';
import { Icon } from './Icon';
import { Logo, Wordmark } from './Logo';

export function ProfileSettings() {
  const { state, dispatch } = useApp();
  const profile = state.profile ?? { name: '', focusAreas: [], wakeTime: '07:00', bedTime: '22:30' };
  const [name, setName] = useState(profile.name);

  function toggle(a: FocusArea) {
    const areas = profile.focusAreas.includes(a) ? profile.focusAreas.filter((x) => x !== a) : [...profile.focusAreas, a];
    dispatch({ type: 'SET_PROFILE', profile: { focusAreas: areas } });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
        <p className="text-sm font-semibold text-white">
          <Icon name="👨" size="1.15em" className="icon-inline text-amber-300" />
          Your profile
        </p>
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

      <InstallCard always />

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div>
            <Wordmark className="text-base" />
            <p className="text-xs text-slate-500">Planner, habits & money · version 1.0</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
          <li className="flex gap-2.5">
            <Icon name="🔐" size={17} className="shrink-0 mt-0.5 text-emerald-300" />
            <span>
              <b className="text-white">Private by design.</b> No account, no ads, no tracking. Everything you enter stays on
              this device unless you export a backup or turn on sync.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="ℹ" size={17} className="shrink-0 mt-0.5 text-sky-300" />
            <span>
              The Money tab helps you count and plan your own money. It isn't financial advice.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
