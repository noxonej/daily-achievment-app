import { useApp } from '../store/AppContext';
import { t } from '../lib/prefs';
import { todayKey } from '../lib/date';
import { MOODS } from '../lib/mood';
import { Icon } from './Icon';


/** One-tap daily mood check-in. Seeing mood next to habits over time shows what actually helps. */
export function MoodCheckIn() {
  const { state, dispatch } = useApp();
  const key = todayKey();
  const mood = state.moods?.[key];
  const picked = MOODS.find((m) => m.value === mood);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white mb-3">
        {picked ? (
          <>
            Feeling <span className={picked.color}>{picked.label.toLowerCase()}</span> today
          </>
        ) : (
          t('mood.question')
        )}
      </p>
      <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Mood">
        {MOODS.map((m) => {
          const on = m.value === mood;
          return (
            <button
              key={m.value}
              role="radio"
              aria-checked={on}
              aria-label={t(`mood.${m.value}` as 'mood.1')}
              onClick={() => dispatch({ type: 'SET_MOOD', date: key, mood: on ? null : m.value })}
              className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 transition ${
                on ? 'border-white/30 bg-white/10' : mood ? 'border-transparent opacity-40 hover:opacity-80' : 'border-white/10 hover:border-white/25'
              }`}
            >
              <Icon name={m.icon} size={26} className={`${m.color} ${on ? 'animate-check' : ''}`} />
              <span className="text-[10px] font-semibold text-slate-400">{t(`mood.${m.value}` as 'mood.1')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
