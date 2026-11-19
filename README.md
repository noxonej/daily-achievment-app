# Squzo: Planner, Habits & Money

Squzo turns your day into a game you can win. Small daily quests build habits, a week plan keeps you
on track, the Money tab helps you save, and everything you do earns XP and coins for your character
and your pixel World.

Live app: https://noxonej.github.io/daily-achievment-app/ (a PWA: add it to your home screen).

## Features

The app has five tabs:

- **Today**: daily quests with streaks (one rest day a week is forgiven, Streak Shields cover more),
  XP and levels, quick add ("Dentist tomorrow 15:00", "spent 4.50 on lunch", "every day: read 10
  pages"), mood check-in, daily box and daily rewards.
- **Goals**: yearly and long-term goals, weekly quests, a goal journal and a rewards shop for your own
  real-life treats.
- **World**: your pixel room, homes, garage and cars, bought with the coins you earn.
- **Money**: balances, daily spending limits, savings goals, a monthly budget (envelopes), bills and
  subscriptions, a wishlist, and assets with prices you type in yourself.
- **You**: your character and wardrobe, stats and badges, diary and notes, friends and the weekly
  leaderboard.

Also: a week plan, sleep tool, breathing, focus timer, run tracker, step counter, notifications, a
built-in coach (rules on the phone, no AI service; its tab is hidden for now), English and Lithuanian.

The in-game currency is called **coins**.

## Development

Needs Node 20 or newer.

```bash
npm install
npm run dev      # local server
npm run build    # type-check + production build into dist/
npm run lint     # oxlint
npm test         # Vitest unit tests
```

React 19, TypeScript, Vite, Tailwind CSS 4. App state lives in `src/store` (one slice file per
feature in `src/store/slices`).

## Deploy

Every push to the default branch builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).
`.github/workflows/ci.yml` runs build, lint and tests on every push and pull request.

## Firebase setup

Squzo uses one Firebase project (`squzo-861ad`) through Firebase's REST APIs, without the Firebase SDK:
Google sign-in (Firebase Auth) and Firestore. The web API key and the Google OAuth client ID in
`src/lib/firebase.ts` and `src/lib/google.ts` are public by design; `firestore.rules` decides who can
read and write what.

- First-time setup of Google sign-in and Firebase: [SETUP-GOOGLE-AND-FRIENDS.md](SETUP-GOOGLE-AND-FRIENDS.md).
- Notifications and publishing `firestore.rules`: [SETUP-PUSH.md](SETUP-PUSH.md). A GitHub Actions job
  (`.github/workflows/push.yml`, `scripts/push`) publishes the rules when they change and sends the
  planned notifications. It needs the `FIREBASE_SERVICE_ACCOUNT` repository secret. Never commit that key.

## Privacy

Everything is saved on the phone first. What can leave it (the same list is in the app under
Settings → About → Your privacy):

| Where | What | When |
| --- | --- | --- |
| Firestore `backups` | Your whole save, **encrypted on the phone** (AES-GCM). The key is only on the phone and in your Google Drive. Until the key is set up, the backup leaves out diary and notes. | After you continue with Google |
| Google Drive (hidden app folder) | A full backup copy and the backup key | After you continue with Google |
| Firestore `profiles`, `codes`, `friends`, `requests`, `activity`, `cheers` | Name, Google photo, character, level, streak, weekly XP, active days, and what you choose to share | After you connect Friends |
| Firestore `boards` | First name, character, level, weekly XP | Only if you join the weekly leaderboard |
| Firestore `pushQueue` | Push address and the plan of upcoming messages, under a random code | With notifications on |
| Firestore `stepsInbox` | Today's step number, under a random code | Only with the Apple Health Shortcut |

No ads, no tracking, no analytics. Asset prices are typed in by you; no price website is used.
Settings → Account → **Delete my cloud data** removes everything above from Firestore and deletes the
Firebase sign-in.
