# Quest Log — Daily Achievement App

Turn your daily habits into a game. Track daily quests (read, journal,
meditate, move, ...), bigger weekly quests, and long-term goals you're
chasing across months and years — all with XP, levels, streaks, and
unlockable achievements.

## Features

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

React + TypeScript + Vite + Tailwind CSS. No backend — everything runs
client-side and persists to `localStorage`.
