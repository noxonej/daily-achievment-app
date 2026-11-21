import { useState } from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { L, isLt } from '../lib/lang';
import { paywall, usePaywall } from '../lib/paywall';
import { PLANS, PREMIUM_ON, TRIAL_DAYS, euro, perMonth, yearlySaving, type Plan, type PremiumFeature } from '../lib/premium';

const WHY: Record<PremiumFeature, [string, string]> = {
  'coach-chat': ['Chat with your smart coach', 'Kalbėkis su savo išmaniuoju treneriu'],
  'create-squad': ['Start your own squads', 'Kurk savo komandas'],
  'create-challenge': ['Host your own challenges', 'Rengk savo iššūkius'],
};

const PERKS: Array<[string, string, string]> = [
  ['💬', 'Smart coach that knows your week', 'Išmanus treneris, kuris žino tavo savaitę'],
  ['⚔', 'Create squads and challenges', 'Kurk komandas ir iššūkius'],
  ['❤', 'Support a small indie app (no ads, ever)', 'Paremk mažą nepriklausomą programėlę (jokių reklamų)'],
];

/**
 * Premium screen (B7). Only reachable when PREMIUM_ON (it stays off). Payments aren't built: the button
 * explains that instead of charging anything. Free stays free: quests, streaks, stats, friends, joining.
 */
export function Paywall() {
  const feature = usePaywall();
  const [plan, setPlan] = useState<Plan['id']>('yearly');
  const [note, setNote] = useState<string | null>(null);
  const open = PREMIUM_ON && feature !== null;
  const lang = isLt() ? 'lt' : 'en';

  return (
    <Modal open={open} onClose={() => paywall.close()} title="Squzo Premium">
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-amber-400/20 via-violet-500/15 to-transparent border border-amber-300/25 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-300 flex items-center gap-1.5">
            <Icon name="🔒" size={12} /> Premium
          </p>
          <p className="mt-1 font-display text-xl font-bold text-white">
            {feature && feature !== 'browse' ? L(...WHY[feature]) : L('Level up faster with Premium', 'Kelk lygį greičiau su Premium')}
          </p>
          <p className="mt-1 text-xs text-slate-300">
            {L(`Try it free for ${TRIAL_DAYS} days. Cancel any time before and you pay nothing.`, `Išbandyk ${TRIAL_DAYS} dienas nemokamai. Atšauk bet kada iki tol ir nieko nemokėsi.`)}
          </p>
        </div>

        <ul className="space-y-2">
          {PERKS.map(([icon, en, lt]) => (
            <li key={en} className="flex items-center gap-2.5 text-sm text-slate-200">
              <span className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                <Icon name={icon} size={14} />
              </span>
              {L(en, lt)}
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label={L('Plan', 'Planas')}>
          {PLANS.map((p) => {
            const on = plan === p.id;
            return (
              <button
                key={p.id}
                role="radio"
                aria-checked={on}
                onClick={() => setPlan(p.id)}
                className={`relative text-left rounded-2xl border p-3.5 transition ${on ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 bg-white/[0.03]'}`}
              >
                {p.id === 'yearly' && (
                  <span className="absolute -top-2 right-2 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5">
                    −{yearlySaving()}%
                  </span>
                )}
                <span className="block text-xs font-semibold text-slate-400">{p.id === 'yearly' ? L('Yearly', 'Metinis') : L('Monthly', 'Mėnesinis')}</span>
                <span className="block font-display text-lg font-bold text-white">{euro(p.cents, lang)}</span>
                <span className="block text-[11px] text-slate-400">
                  {p.id === 'yearly' ? L(`${euro(perMonth(p), lang)} a month`, `${euro(perMonth(p), lang)} per mėn.`) : L('per month', 'per mėnesį')}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setNote(L('Payments are coming soon. Nothing was charged.', 'Mokėjimai netrukus. Niekas nenuskaičiuota.'))}
          className="w-full rounded-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-black py-3.5"
        >
          {L(`Start ${TRIAL_DAYS}-day free trial`, `Pradėti ${TRIAL_DAYS} d. nemokamai`)}
        </button>
        {note && <p className="text-center text-xs text-slate-300">{note}</p>}
        <p className="text-center text-[11px] text-slate-500 leading-relaxed">
          {L(
            'Quests, streaks, stats, friends and joining squads stay free forever.',
            'Užduotys, serijos, statistika, draugai ir prisijungimas prie komandų lieka nemokami visada.',
          )}
        </p>
      </div>
    </Modal>
  );
}

/** Small "Premium" tag on a locked button. Renders nothing while premium is off. */
export function PremiumTag({ locked }: { locked: boolean }) {
  if (!locked) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 text-amber-300 text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5">
      <Icon name="🔒" size={10} /> Premium
    </span>
  );
}
