# Dayforge: Planner, Habits & Money

Turn your daily habits into a game. Track daily quests (read, journal,
meditate, move, ...), bigger weekly quests, and long-term goals you're
chasing across months and years — all with XP, levels, streaks, and
unlockable achievements.

## Features

- **First-run setup** — a one-minute walkthrough (name, what you want to
  get better at, wake/bed time, school or work hours) that builds a
  personal Monday–Sunday plan.
- **Today home screen** — a greeting, a "Right now / Next" card from your
  plan with one-tap Done and Focus, quick actions, and a daily mood
  check-in.
- **Focus timer** — 15/25/45/60-minute sessions that keep running when
  the app is closed, with a chime, vibration and notification at the end;
  focus minutes show up in Stats.
- **Mood insights** — mood this week, and once there's enough data, what
  seems to lift it (finishing your quests, focus time).
- **Avatar & wardrobe** — a drawn character with 155 items across faces &
  expressions (including "Match my mood", which follows your daily mood
  check-in), skin, hair, hair colour, outfits, hats, eyewear, scenes and
  shoulder pets,
  each Common, Rare, Epic or Legendary. Try anything on, buy with shards
  (earned from XP), unlock milestone gear through levels and streaks, and
  win chest-only items from reward chests (one per perfect day, perfect
  week and level-up).
- **Appearance** — the futuristic Nebula look by default (with a Space
  Grotesk heading font), six accent colours and four backgrounds (Nebula,
  Graphite, Midnight, true Black) in Settings, applied before first paint.
- **Five tabs** — Today, Plan, Money, Quests (weekly quests + long-term
  goals) and You (profile, stats, badges, settings).
- **Accounts on the device** — create an account with an optional 4-digit
  PIN, "remember me", several accounts per phone (each with its own data),
  switch / sign out / delete. Existing saves move into the first account.
- **Number quests & running** — step, water, push-up, page and minute
  goals that complete at their target, plus a GPS run tracker (distance,
  time, pace, keeps the screen awake, filters GPS jumps) that feeds
  distance quests; runs can also be added by hand.
- **Real answers for written quests** — "Gratitude x3" needs three
  different answers with real words, journals need 10 real words, so a
  "." no longer completes them.
- **Daily box** — unlocks after your first quest of the day, opens once a
  day: shards, an XP boost for the day (+50% or double), a Quest Swap
  token, a Streak Shield (covers a missed day automatically), a bonus
  chest, or (about 2%) a Mythic daily-box-exclusive cosmetic.
- **Weekly recap** — your week in numbers in Stats, and last week's recap
  on Today every Monday.
- **Undo** for deletes, **offline support** and an **install guide** for
  putting the app on your home screen, plus home-screen shortcuts.

- **Daily quests** that reset every day — small, repeatable habits worth
  quick XP.
- **Week Plan** — a reusable Monday–Sunday routine (no dates). Add
  timed items like "7:00 Wake up", "7:15 Meditation", tap any item to
  edit it, copy a whole day to other days, and tick things off — ticks
  clear automatically each new week while the plan stays. Today's slice
  shows up on the Today tab. Colour-code items (Health, Mind, Study,
  Work, Personal), start from a ready-made routine, and get reminders:
  export the plan to your phone's calendar as weekly repeating events
  with alerts, or get pop-up alerts while the app is open.
- **Money** — enter what you have in spending money, savings, and
  investments and see it as a ring chart with the total in the middle,
  split into "can spend" and "don't touch". Set a daily spending limit
  (or have it worked out from how many days your money must last),
  split across categories like food, transport, and fun; log what you
  spend and see what's left today, a warning before you go over, a
  7-day history, and a one-tap "move today's leftover to savings".
  Savings goals (like a car) each get their own fund in savings, with a
  progress bar and an estimate of when you'll reach them at your weekly
  saving rate.
- **Weekly quests** — bigger challenges you have all week to finish.
- **Long-term goals** — track progress toward yearly/monthly/custom
  targets (books read, meditation days, savings, anything with a number).
- **XP, levels, and titles** that grow as you complete quests.
- **Streaks** for consecutive "perfect days" (every daily quest done).
- **21 unlockable achievements** for streaks, totals, levels, and goals.
- **Activity heatmap** and stats dashboard to see your history at a
  glance, even months later.
- **Fully customizable** — add, edit, archive, or delete quests and
  goals to fit your own habits.
- **Local-first** — all progress is saved in your browser's storage.
  Export a JSON backup any time from the Manage tab, and import it to
  restore or move to another device.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Build

```bash
npm run build
```

Outputs a static site to `dist/` — deployable anywhere that serves
static files (Netlify, Vercel, GitHub Pages, etc).

## Tech

React + TypeScript + Vite + Tailwind CSS, with Lucide line icons. No backend — everything runs
client-side and persists to `localStorage`.
