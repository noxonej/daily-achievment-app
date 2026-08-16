# Quest Log — Daily Achievement App

Turn your daily habits into a game. Track daily quests (read, journal,
meditate, move, ...), bigger weekly quests, and long-term goals you're
chasing across months and years — all with XP, levels, streaks, and
unlockable achievements.

## Features

- **Daily quests** that reset every day — small, repeatable habits worth
  quick XP.
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
