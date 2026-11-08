import type { ReactNode } from 'react';
import { Logo, Wordmark } from './Logo';
import { Icon } from './Icon';
import { settings } from '../lib/settingsNav';

/**
 * Settings > About: what Dayforge is for, how it works, and the simple rules (privacy and terms) in
 * plain words. Sections fold open so the page stays short and easy to read.
 */
export function AboutPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/15 via-white/[0.03] to-fuchsia-500/10 p-5">
        <div className="flex items-center gap-3">
          <Logo size={48} />
          <div>
            <Wordmark className="text-lg" />
            <p className="text-xs text-slate-400">Planner, habits & money · version 1.2</p>
          </div>
        </div>
        <p className="text-[15px] text-slate-200 leading-relaxed mt-4">
          Dayforge turns your day into a game you can win. Small daily quests build habits, a simple week plan keeps you on
          track, and the money tab helps you save for what you really want.
        </p>
      </div>

      <Section icon="🎯" title="What is it good for?" open>
        <ul className="space-y-2.5">
          <Point icon="🔥" title="Building good habits">Drink water, read, move, study. Tick them off and keep your streak alive.</Point>
          <Point icon="📅" title="Planning your week">A routine for every day, built from your wake-up, school or work, and bed times.</Point>
          <Point icon="💰" title="Getting better with money">Daily spending limits, savings goals, a budget and a list of your subscriptions.</Point>
          <Point icon="🧘" title="Feeling calmer">Mood check-ins, a diary, breathing breaks and a focus timer.</Point>
          <Point icon="🎮" title="Making it fun">XP, levels, a daily prize box, a character you dress up and a shop for treats you choose yourself.</Point>
        </ul>
      </Section>

      <Section icon="🧭" title="Who is it for?">
        <p>
          Anyone who wants to get a little better every day: students, people starting their first job, or anyone building
          a routine. You don't need to be organised already. The app starts small and grows with you.
        </p>
      </Section>

      <Section icon="⚡" title="How it works, in 4 steps">
        <ol className="space-y-2.5">
          <Step n={1}>Each day you get a few quests. Tap one when it's done to earn XP and shards.</Step>
          <Step n={2}>Do at least one quest a day to keep your streak. Missed one day? One rest day a week is forgiven.</Step>
          <Step n={3}>XP levels you up and unlocks new clothes for your character. Shards buy outfits or your own treats.</Step>
          <Step n={4}>Every Sunday, look back at your week and plan the next one.</Step>
        </ol>
        <button onClick={() => settings.open('help')} className="mt-3 text-sm font-semibold text-amber-300 hover:text-amber-200">
          Every feature explained →
        </button>
      </Section>

      <Section icon="💡" title="Why it works">
        <p>
          Big changes come from small things done often. Tiny daily wins are easier to keep than big promises, seeing your
          progress keeps you going, and rewards make the hard part feel worth it. Dayforge is built around those ideas, and
          it's forgiving on purpose: a bad day doesn't erase your progress.
        </p>
      </Section>

      <Section icon="🔐" title="Your privacy">
        <ul className="space-y-2 list-disc pl-5 marker:text-slate-500">
          <li>No ads and no tracking. We don't sell or share your data.</li>
          <li>Everything you enter, including your diary, notes and money, is saved on this device only.</li>
          <li>
            Only if <b>you</b> turn it on: Google Drive backup saves a copy in your own Google Drive, and Friends shares your
            name, level and streak with the friends you add.
          </li>
          <li>You can export a backup or delete everything at any time in Settings → Data.</li>
          <li>If you clear your browser data or lose the phone without a backup, your progress can't be recovered. Make backups.</li>
        </ul>
      </Section>

      <Section icon="📄" title="Terms of use (the short version)">
        <ul className="space-y-2 list-disc pl-5 marker:text-slate-500">
          <li>Dayforge is free to use, for your own personal life.</li>
          <li>
            <b>Not financial advice.</b> The money tab helps you count and plan your own money. Prices and values of assets
            are what you type in. Decisions about money are yours.
          </li>
          <li>
            <b>Not medical advice.</b> Health quests (water, sleep, exercise) are general ideas. If you have a health
            condition, follow your doctor first. Stop any exercise that hurts.
          </li>
          <li>If you're under 13, use the app with a parent or guardian. Friends needs a Google account, which has its own age rules.</li>
          <li>Be kind in Friends: no bullying, nothing hurtful. Remove anyone who isn't kind to you.</li>
          <li>The app is given "as is". We work hard to keep it working, but we can't promise it will never have bugs.</li>
          <li>These terms may change as the app grows. Big changes will be shown in the app.</li>
        </ul>
      </Section>

      <Section icon="🏆" title="Fair play">
        <p>
          You can tick a quest you didn't really do. Nobody checks, because the only person you'd be fooling is you. Your
          streak means the most when it's honest.
        </p>
      </Section>

      <p className="text-center text-xs text-slate-500 pt-2 pb-4">Made with care to help you grow, one day at a time.</p>
    </div>
  );
}

function Section({ icon, title, open, children }: { icon: string; title: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group rounded-2xl border border-white/10 bg-white/[0.03] [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none list-none">
        <span className="shrink-0 w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
          <Icon name={icon} size={18} />
        </span>
        <span className="flex-1 text-[15px] font-bold text-white">{title}</span>
        <Icon name="▾" size={18} className="text-slate-500 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 text-[14px] text-slate-300 leading-relaxed">{children}</div>
    </details>
  );
}

function Point({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <Icon name={icon} size={17} className="shrink-0 mt-0.5 text-amber-300" />
      <span>
        <b className="text-white">{title}.</b> {children}
      </span>
    </li>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">{n}</span>
      <span>{children}</span>
    </li>
  );
}
