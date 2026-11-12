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
    <div className="mood-card rounded-2xl p-4">
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
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={t(`mood.${m.value}` as 'mood.1')}
              // Tap a face to pick it; tap the picked one again to clear it.
              onClick={() => dispatch({ type: 'SET_MOOD', date: key, mood: on ? null : m.value })}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 transition-[transform,opacity,background-color,border-color,box-shadow,filter] duration-200 [-webkit-tap-highlight-color:transparent] ${
                on ? `${m.chosen} -translate-y-0.5` : mood ? 'border-transparent opacity-45 grayscale-[60%]' : 'border-white/10'
              }`}
            >
              <Icon name={m.icon} size={26} className={`${m.color} ${on ? 'animate-check' : ''}`} strokeWidth={on ? 2.4 : 2} />
              <span className={`text-[10px] font-semibold ${on ? 'text-white' : 'text-slate-400'}`}>{t(`mood.${m.value}` as 'mood.1')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
