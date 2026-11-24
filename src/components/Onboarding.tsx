import { useMemo, useState, type ReactNode } from 'react';
import { useApp } from '../store/AppContext';
import type { FocusArea, Profile } from '../lib/types';
import { FOCUS_AREAS, buildRoutine } from '../lib/routine';
import { Icon } from './Icon';
import { DEFAULT_LOOK, normalizeLook } from '../data/avatar';
import { untwisted } from '../lib/dailyTwist';
import { starterQuestTitles } from '../store/state';
import { questStats, STATS } from '../lib/irlStats';
import { FIRST_WIN, FIRST_WIN_TITLE, FIRST_WIN_XP } from '../lib/firstWin';
import { L, isLt } from '../lib/lang';
import { logEvent } from '../lib/analytics';
import { useIrlStats } from './stats/useIrlStats';
import { StatsRadar } from './stats/StatsRadar';
import { Burst } from './fx/Burst';
import { PixelAvatar } from './PixelAvatar';

// Round 2 (B5): three screens, and you finish a real quest before the app even opens.
// 1. what you want to level up, 2. pick 3 daily quests, 3. do your first quest right now.
// Wake/bed times and school hours use sensible defaults (07:00, 22:30, 8–15); change them in Plan.
type Step = 'goal' | 'quests' | 'first';
const STEPS: Step[] = ['goal', 'quests', 'first'];

/** First-run setup: pick a goal, pick 3 quests, finish your first quest. About 30 seconds. */
// 2026-11-24: the character is never made a girl or a guy for you. You pick Male, Female or
// "Choose later"; the pick only sets the starting hair once, and nothing switches it afterwards.
const GENDERS: Array<{ id: NonNullable<Profile['gender']>; label: string; lt: string; hair?: string }> = [
  { id: 'male', label: 'Male', lt: 'Vyras', hair: 'hair-quiff' },
  { id: 'female', label: 'Female', lt: 'Moteris', hair: 'hair-ponytail' },
  { id: 'unsaid', label: 'Choose later', lt: 'Vėliau' },
];

export function Onboarding() {
  const { state, dispatch, stats } = useApp();
  const [step, setStep] = useState<Step>('goal');
  const [dir, setDir] = useState<'right' | 'left'>('right');
  const [name, setName] = useState(state.profile?.name ?? '');
  const [askName] = useState(() => !state.profile?.name);
  const [areas, setAreas] = useState<FocusArea[]>([]);
  const [gender, setGender] = useState<NonNullable<Profile['gender']> | undefined>(state.profile?.gender);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [won, setWon] = useState(() => (state.gifts ?? []).includes(FIRST_WIN));
  const [started] = useState(() => Date.now());
  const index = STEPS.indexOf(step);

  // Quests to pick from: the ones that match the goals first, then other built-in daily quests.
  const options = useMemo(() => {
    const daily = state.quests.filter((q) => q.frequency === 'daily' && !q.custom && !q.wildcardDate);
    const titles = new Map(daily.map((q) => [untwisted(q).title, q]));
    const first = starterQuestTitles(areas).filter((t) => titles.has(t));
    const rest = [...titles.keys()].filter((t) => !first.includes(t));
    return [...first, ...rest].slice(0, 9).map((t) => titles.get(t)!);
  }, [state.quests, areas]);
  const chosen = picked ?? options.slice(0, 3).map((q) => untwisted(q).title);

  function go(next: Step) {
    setDir(STEPS.indexOf(next) > index ? 'right' : 'left');
    setStep(next);
  }

  /** The starting hair for the picked character, set once here (only if it's still the default). */
  function matchLook() {
    const hair = GENDERS.find((g) => g.id === gender)?.hair;
    if (hair && normalizeLook(state.character).hair === DEFAULT_LOOK.hair) {
      dispatch({ type: 'EQUIP_COSMETIC', slot: 'hair', itemId: hair });
    }
  }

  function finish(skip = false) {
    // Reminders are on by default: this tap counts as the go-ahead to ask the phone.
    if (!skip && typeof Notification !== 'undefined') {
      try {
        if (Notification.permission === 'granted') dispatch({ type: 'SET_PREFS', prefs: { nudges: true } });
        else if (Notification.permission === 'default')
          void Notification.requestPermission().then((p) => {
            if (p === 'granted') dispatch({ type: 'SET_PREFS', prefs: { nudges: true } });
          });
      } catch {
        // notifications are optional
      }
    }
    const wakeTime = '07:00';
    const bedTime = '22:30';
    const plan = buildRoutine({ focusAreas: areas, wakeTime, bedTime, busy: { start: '08:00', end: '15:00' } });
    dispatch({
      type: 'COMPLETE_ONBOARDING',
      profile: { name: name.trim(), focusAreas: areas, wakeTime, bedTime, ...(gender ? { gender } : {}) },
      plan,
      keep: skip ? undefined : chosen,
    });
    logEvent('onboarding_done', { secs: Math.round((Date.now() - started) / 1000), skip });
  }

  function toggleArea(a: FocusArea) {
    setAreas((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]));
    setPicked(null);
  }
  function toggleQuest(title: string) {
    setPicked(chosen.includes(title) ? chosen.filter((t) => t !== title) : [...chosen, title].slice(-3));
  }

  return (
    <div className="fixed inset-0 z-[90] bg-canvas bg-grid overflow-y-auto">
      <div className="min-h-full max-w-md mx-auto px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => go(STEPS[Math.max(0, index - 1)])}
            aria-label="Back"
            disabled={index === 0 || won}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10 disabled:opacity-0"
          >
            <Icon name="⬅" size={20} />
          </button>
          <div className="flex-1 flex gap-1.5" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
            {STEPS.map((s, i) => (
              <span key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i <= index ? 'bg-amber-400' : 'bg-white/10'}`} />
            ))}
          </div>
          <button onClick={() => finish(true)} className="text-sm font-semibold text-slate-500 hover:text-slate-300 px-1">
            {L('Skip', 'Praleisti')}
          </button>
        </div>

        <div key={step} className={`flex-1 flex flex-col ${dir === 'right' ? 'animate-view-right' : 'animate-view-left'}`}>
          {step === 'goal' && (
            <>
              <Title
                title={name.trim() ? L(`What do you want to level up, ${name.trim()}?`, `Ką nori patobulinti, ${name.trim()}?`) : L('What do you want to level up?', 'Ką nori patobulinti?')}
                sub={L('Pick one or more. Squzo turns it into daily quests.', 'Pasirink vieną ar kelis. Squzo pavers tai kasdienėmis užduotimis.')}
              />
              {askName && (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={L('Your first name (optional)', 'Tavo vardas (nebūtina)')}
                  aria-label={L('Your first name', 'Tavo vardas')}
                  maxLength={24}
                  autoComplete="given-name"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 h-12 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 mb-4"
                />
              )}
              <div className="grid grid-cols-2 gap-2.5">
                {FOCUS_AREAS.map((a) => {
                  const on = areas.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleArea(a.id)}
                      aria-pressed={on}
                      className={`relative text-left rounded-2xl border p-3.5 transition ${on ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}
                    >
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition ${on ? 'bg-amber-500 text-white' : 'bg-white/5 text-amber-300'}`}>
                        <Icon name={a.icon} size={20} />
                      </span>
                      <span className="block text-sm font-bold text-white leading-tight">{a.label}</span>
                      <span className="block text-xs text-slate-400 mt-0.5">{a.hint}</span>
                      {on && (
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                          <Icon name="✓" size={12} strokeWidth={3} className="animate-check" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-5 text-xs font-semibold text-slate-400">{L('Your character', 'Tavo veikėjas')}</p>
              <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label={L('Your character', 'Tavo veikėjas')}>
                {GENDERS.map((g) => {
                  const on = gender === g.id;
                  const look = { ...normalizeLook(state.character), ...(g.hair ? { hair: g.hair } : {}) };
                  return (
                    <button
                      key={g.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setGender(g.id)}
                      className={`relative flex flex-col items-center gap-1 rounded-2xl border pt-2 pb-2.5 transition active:scale-[0.97] ${on ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}
                    >
                      {g.hair ? (
                        <PixelAvatar look={look} size={56} framing="bust" shape="circle" />
                      ) : (
                        <span className="w-14 h-14 rounded-full bg-white/[0.06] border border-dashed border-white/20 flex items-center justify-center text-slate-400">
                          <Icon name="🕒" size={22} />
                        </span>
                      )}
                      <span className={`text-xs font-bold ${on ? 'text-white' : 'text-slate-300'}`}>{isLt() ? g.lt : g.label}</span>
                      {on && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                          <Icon name="✓" size={10} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">{L('Only sets your starting look. Change anything later in the wardrobe.', 'Tik pradinė išvaizda. Viską pakeisi vėliau drabužinėje.')}</p>
              <div className="flex-1 min-h-6" />
              <Primary
                onClick={() => {
                  matchLook();
                  go('quests');
                }}
                disabled={areas.length === 0}
              >
                {areas.length === 0 ? L('Pick at least one', 'Pasirink bent vieną') : L('Continue', 'Toliau')}
              </Primary>
            </>
          )}

          {step === 'quests' && (
            <>
              <Title title={L('Pick 3 daily quests', 'Pasirink 3 kasdienes užduotis')} sub={L('Small and doable. You can add more later.', 'Mažos ir įmanomos. Daugiau pridėsi vėliau.')} />
              <ul className="space-y-2">
                {options.map((q) => {
                  const title = untwisted(q).title;
                  const on = chosen.includes(title);
                  const st = questStats(q)[0];
                  return (
                    <li key={q.id}>
                      <button
                        onClick={() => toggleQuest(title)}
                        aria-pressed={on}
                        className={`w-full flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${on ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 bg-white/[0.03]'}`}
                      >
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${on ? 'bg-amber-500 text-white' : 'bg-white/5 text-amber-300'}`}>
                          <Icon name={q.icon} size={18} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[15px] font-bold text-white truncate">{title}</span>
                          <span className="block text-xs font-semibold" style={{ color: STATS[st].color }}>
                            +{STATS[st].label}
                          </span>
                        </span>
                        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${on ? 'bg-amber-500 border-amber-500 text-white' : 'border-white/20'}`}>{on && <Icon name="✓" size={13} strokeWidth={3} />}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="flex-1 min-h-6" />
              <Primary onClick={() => go('first')} disabled={chosen.length === 0}>
                {L(`Continue with ${chosen.length}`, `Toliau su ${chosen.length}`)}
              </Primary>
            </>
          )}

          {step === 'first' && <FirstWin won={won} level={stats.level} onWin={() => {
            dispatch({ type: 'FIRST_WIN', title: FIRST_WIN_TITLE });
            setWon(true);
            logEvent('quest_done');
          }} onFinish={() => finish()} />}
        </div>
      </div>
    </div>
  );
}

/** Screen 3: do one tiny quest right now, see the XP land, level 2 and your stats appear. */
function FirstWin({ won, level, onWin, onFinish }: { won: boolean; level: number; onWin: () => void; onFinish: () => void }) {
  const irl = useIrlStats();
  return (
    <>
      <Title
        title={won ? L(`Level ${level}! You're on your way.`, `${level} lygis! Pradėjai.`) : L('Your first quest, right now', 'Tavo pirma užduotis, dabar')}
        sub={won ? L('Every real quest grows these stats.', 'Kiekviena tikra užduotis augina šiuos rodiklius.') : L('Go get a glass of water. Tap when it’s done.', 'Atsigerk stiklinę vandens. Paspausk, kai baigsi.')}
      />
      {!won ? (
        <button
          onClick={onWin}
          className="relative mx-auto mt-4 w-56 h-56 rounded-full bg-gradient-to-b from-sky-400 to-sky-600 text-white flex flex-col items-center justify-center gap-2 shadow-[0_20px_60px_-15px_rgba(56,189,248,0.8)] active:scale-95 transition-transform"
        >
          <Icon name="💧" size={64} />
          <span className="font-display text-lg font-bold">{L('I drank it', 'Išgėriau')}</span>
          <span className="text-sm font-bold opacity-90">+15 XP · +{L('Body', 'Kūnas')}</span>
        </button>
      ) : (
        <div className="relative flex flex-col items-center">
          <Burst size={2} sparks={14} color="#fbbf24" />
          <p className="font-display text-5xl font-black text-amber-300 animate-num-pop">+{FIRST_WIN_XP + 15} XP</p>
          <div className="text-slate-300 mt-1">
            <StatsRadar stats={irl} size={290} />
          </div>
        </div>
      )}
      <div className="flex-1 min-h-6" />
      {won && <Primary onClick={onFinish}>{L('Start my day', 'Pradėti dieną')}</Primary>}
      <p className="text-xs text-slate-500 mt-3 text-center leading-relaxed">
        <Icon name="🏆" size={12} className="inline -mt-0.5 mr-1 text-amber-300" />
        {L("Play fair: only tick a quest when you really did it. The only person you'd fool is you.", 'Žaisk sąžiningai: pažymėk tik tai, ką tikrai padarei.')}
      </p>
    </>
  );
}


function Title({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[26px] leading-tight font-extrabold text-white">{title}</h1>
      <p className="text-slate-400 mt-2">{sub}</p>
    </div>
  );
}

function Primary({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-white/10 disabled:text-slate-500 text-white text-base font-bold py-4 shadow-[0_10px_30px_-10px_rgba(245,158,11,0.6)] disabled:shadow-none transition"
    >
      {children}
    </button>
  );
}


