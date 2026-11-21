import { useState, type ReactNode } from 'react';
import { Switch } from './Switch';
import { analyticsOn, setAnalyticsOn } from '../lib/analytics';
import { Logo, Wordmark } from './Logo';
import { Icon } from './Icon';
import { settings } from '../lib/settingsNav';

/**
 * Settings > About: what Squzo is for, how it works, and the simple rules (privacy and terms) in
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
            <p className="text-xs text-slate-400">Planner, habits & money · version {__APP_VERSION__}</p>
          </div>
        </div>
        <p className="text-[15px] text-slate-200 leading-relaxed mt-4">
          Squzo turns your day into a game you can win. Small daily quests build habits, a simple week plan keeps you on
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
          <Step n={1}>Each day you get a few quests. Tap one when it's done to earn XP and coins.</Step>
          <Step n={2}>Do at least one quest a day to keep your streak. Missed one day? One rest day a week is forgiven.</Step>
          <Step n={3}>XP levels you up and unlocks new clothes for your character. Coins buy outfits or your own treats.</Step>
          <Step n={4}>Every Sunday, look back at your week and plan the next one.</Step>
        </ol>
        <button onClick={() => settings.open('help')} className="mt-3 text-sm font-semibold text-amber-300 hover:text-amber-200">
          Every feature explained →
        </button>
      </Section>

      <Section icon="💡" title="Why it works">
        <p>
          Big changes come from small things done often. Tiny daily wins are easier to keep than big promises, seeing your
          progress keeps you going, and rewards make the hard part feel worth it. Squzo is built around those ideas, and
          it's forgiving on purpose: a bad day doesn't erase your progress.
        </p>
      </Section>

      <Section icon="🔐" title="Your privacy">
        <p className="mb-2.5">No ads and no tracking across other apps or websites. We don't sell your data. Here is every place your data can go, in plain words:</p>
        <ul className="space-y-2 list-disc pl-5 marker:text-slate-500">
          <li>
            <b>This phone.</b> Everything you enter is saved here first. Without Google sign-in, only the two optional
            items without a name (notifications and Apple Health steps) ever leave it.
          </li>
          <li>
            <b>Squzo's cloud backup</b> (Google Firebase, Firestore: backups). After you continue with Google, a full copy
            of your progress is saved there every few minutes. It is <b>locked (encrypted) on your phone</b> first, and
            the key is only on your phone and in your own Google Drive, so nobody at Squzo can read it. Until the key is
            set up, the backup leaves out your diary and notes.
          </li>
          <li>
            <b>Your Google Drive</b> (a hidden Squzo folder only this app can open): a full backup copy and the backup
            key. You can delete it in Drive → Settings → Manage apps.
          </li>
          <li>
            <b>Friends</b> (Firestore: profiles, codes, friends, requests, activity, cheers), only once you connect
            Friends: your name, Google photo, character, level, streak, weekly XP and active days, plus the quests, runs
            and badges you choose to share in Settings → Friends. Only your friends can read your activity.
          </li>
          <li>
            <b>Weekly leaderboard</b> (Firestore: boards), only if you turn it on: your first name, character, level and
            weekly XP. Everyone signed in can see it.
          </li>
          <li>
            <b>Notifications</b> (Firestore: pushQueue). With daily motivation on, the phone's push address and the plan
            of upcoming messages (times and texts, your quiet hours and time zone) are saved under a random code, so the
            server can send them. Your name isn't in it.
          </li>
          <li>
            <b>Apple Health steps</b> (Firestore: stepsInbox), only if you set up the Shortcut: one number, today's
            steps, under a random code.
          </li>
          <li>
            <b>Squads and challenges</b> (Firestore: squads, challenges), only if you create or join one while connected:
            your first name and your squad streak or challenge score. Challenge boards can be seen by anyone with the
            link. <b>Photo proof</b> is optional, only the challenge's players see it, and it's deleted after 7 days.
          </li>
          <li>
            <b>Invites</b> (Firestore: invitedBy, invites): who invited you, your first name and up to 3 day numbers, so
            you both get the invite reward.
          </li>
          <li>
            <b>Anonymous usage counts</b> (Firestore: stats). A random install number (not your name or account) and
            which of these happened: app opened, quest done, setup finished, invite sent, card shared. It tells us if
            people come back after 1, 7 and 30 days. Nobody can read it from the app. You can turn it off below.
            <AnalyticsSwitch />
          </li>
          <li>
            <b>Prices</b>: crypto, stock and other asset prices in Money are the ones you type in. The app doesn't ask
            any price website.
          </li>
          <li>
            <b>Delete it all:</b> Settings → Account → Delete my cloud data removes everything Squzo saved in the cloud.
            Settings → Data deletes what's on this phone.
          </li>
          <li>If you clear your browser data or lose the phone without a backup, your progress can't be recovered. Make backups.</li>
        </ul>
      </Section>

      <Section icon="📄" title="Terms of use (the short version)">
        <ul className="space-y-2 list-disc pl-5 marker:text-slate-500">
          <li>Squzo is free to use, for your own personal life.</li>
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

/** C1: the off switch for anonymous usage counts. */
function AnalyticsSwitch() {
  const [on, setOn] = useState(analyticsOn);
  return (
    <span className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2">
      <span className="text-sm font-semibold text-white">Send anonymous usage counts</span>
      <Switch
        on={on}
        label="Send anonymous usage counts"
        onChange={(v) => {
          setAnalyticsOn(v);
          setOn(v);
        }}
      />
    </span>
  );
}
