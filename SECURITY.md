# Squzo security

Last checked: 2026-11-21 (round 2: PRs for parts A1–A11).

## Report a problem

Found a security bug? Please **don't** open a public issue. Use GitHub's private report instead:
https://github.com/noxonej/daily-achievment-app/security/advisories/new
(Repository → Security → Report a vulnerability). We answer within a week.

## What is stored where, and who can read it

| What | Where | Who can read it | Encrypted? |
|---|---|---|---|
| Everything you do in the app (quests, diary, money, plan, character) | Your phone: `localStorage` keys `dayforge-*` | Only this phone (and its PIN, if you set one) | No (phone storage) |
| Safety snapshots (last few days) | Your phone: IndexedDB `squzo-safety` | Only this phone | No |
| Automatic cloud backup | Firestore `backups/{uid}` | Only you | **Yes, end-to-end** (AES-GCM, key only on your phones + your Google Drive's hidden app folder). Google/Firebase can't read it. |
| Backup key / Drive backup | Google Drive hidden "app data" folder | Only your Google account | Key file is the key; backup file is the same encrypted backup |
| Friend card: name, friend code, look, level, streak, weekly XP, active days, Google photo | Firestore `profiles/{uid}` | Signed-in people who know your uid (your friends); profiles can't be listed | No (shared on purpose) |
| Friend code → uid | Firestore `codes/{code}` | Anyone signed in, one code at a time | No |
| Friends, requests, blocks | `friends/`, `requests/`, `blocks/` | You (and the other person for friends/requests); blocks only you | No |
| What you finished (quests, runs, badges) | `activity/{uid}/items` | You and your friends | No |
| Cheers | `cheers/{uid}/items` | Only you | No |
| Public weekly board (only if you turn it on) | `boards/{week}/players/{uid}` | Anyone signed in | No |
| Cheating reports | `reports/{player}/from/{reporter}` | Only the admin (push sender) | No |
| Notification plan + push address | `pushQueue/{random token}` | Only the push sender | No (no name or account in it) |
| Apple Health steps (if you set up the Shortcut) | `stepsInbox/{random token}` | Whoever has the 32-character token (your app and Shortcut) | No (one number) |
| Push keys, rules hash | `private/*` | Only the push sender | — |

Never sent anywhere: your money numbers, savings, crypto, week plan, diary and notes (except inside
the encrypted backup).

"Delete my cloud data" (Settings → Account) removes all of the above for your account, then the
Firebase sign-in itself.

## How it's protected

- **Database rules** (`firestore.rules`): every write is checked field by field (names, sizes, number
  ranges, times close to the server clock). Tested in the Firestore emulator by `tests/rules` (runs in CI).
- **Push sender** only sends to real push services (Google, Mozilla, Apple, Microsoft), max 2,000
  phones per run, forgets phones after 30 days (`functions/pushSafety.js`).
- **Content Security Policy** in the built `index.html`: scripts only from Squzo, Google sign-in and
  reCAPTCHA; connections only to Firebase/Google APIs and CoinGecko.
- **Links and pictures** from other people or backup files: only `http(s)` links, only Google
  account photos (`src/lib/url.ts`).
- **Fair play**: impossible leaderboard scores are hidden, players can be reported, friends can be
  blocked, one cheer per friend per item.
- **No secrets in the code.** The Firebase web API key and the Google OAuth client ID are public by
  design; the rules decide what they may do.

## Console checklist (things only Jonas can do)

Status as far as the code can tell on 2026-11-21. ✅ = done, ❌ = still to do, ❓ = check yourself.

| | Setting | Why |
|---|---|---|
| ✅ | `FIREBASE_SERVICE_ACCOUNT` secret (push works) | Sends notifications, publishes the rules |
| ❌ | Least-privilege service account (below) | A leaked key can do much less |
| ❌ | App Check registered (reCAPTCHA Enterprise) + site key and app id sent to Claude | Blocks bots |
| ❌ | App Check **enforced** for Firestore | Only after the Shortcut question below |
| ❓ | API key restricted to your website | Others can't use your key from their sites |
| ❓ | Billing: Spark (free) plan, or a €5 budget alert on Blaze | Nobody can run up a bill |
| ❌ | Report a vulnerability turned on in GitHub (Settings → Code security → Private vulnerability reporting → Enable) | So the link above works |

### Least-privilege service account (A9)

The push job today uses Firebase's admin key, which can do *everything* in the project. It only
needs two things: read/write Firestore and publish rules.

1. Open https://console.cloud.google.com/iam-admin/serviceaccounts?project=squzo-861ad
2. **+ Create service account**. Name: `squzo-push-sender` → **Create and continue**.
3. Role: type **Cloud Datastore User**, pick it. **+ Add another role** → **Firebase Rules Admin**.
   → **Continue** → **Done**.
4. Click the new `squzo-push-sender@…` row → **Keys** tab → **Add key** → **Create new key** → **JSON** →
   **Create**. A file downloads. Treat it like a password.
5. GitHub → https://github.com/noxonej/daily-achievment-app/settings/secrets/actions → click
   `FIREBASE_SERVICE_ACCOUNT` → **Update** → paste the whole new file → **Update secret**.
6. https://github.com/noxonej/daily-achievment-app/actions/workflows/push.yml → **Run workflow**.
   Wait for the green ✓ and check the log says `Push round:` with no "permission" errors.
7. Only when step 6 is green: back in the service accounts list, click the old
   `firebase-adminsdk-…@squzo-861ad.iam.gserviceaccount.com` → **Keys** → delete the key whose ID matches
   `private_key_id` in your *old* downloaded file (if you don't have it any more, delete every key on
   that account; Firebase itself doesn't need them). **Don't delete the account itself.**
8. Delete both downloaded `.json` files from your computer.

### App Check (A2)

The code is ready (`src/lib/appCheck.ts`) and does nothing until it has two public values.

1. https://console.cloud.google.com/security/recaptcha?project=squzo-861ad → enable the API if asked →
   **Create key**. Name `Squzo web`, platform **Website**, domains `noxonej.github.io` (and later your own
   domain). Under extra settings, leave the checkbox challenge **off**. **Create**. Copy the **key ID**.
2. https://console.firebase.google.com/project/squzo-861ad/settings/general → **Your apps**. If there is no
   web app (`</>`), click **Add app → Web**, name it `Squzo web`, don't tick Hosting, **Register app**.
   Copy the **App ID** (looks like `1:505583941780:web:abc123…`).
3. Firebase → **Build → App Check → Apps** → your web app → **reCAPTCHA Enterprise** → paste the key ID →
   **Save**.
4. Send Claude both values (they're public). Claude puts them in `src/lib/appCheck.ts`.
5. Leave **App Check → APIs → Cloud Firestore** on **Unenforced** (= monitor mode) and watch the chart for
   a few days. "Verified requests" should become nearly all requests.
6. **Before enforcing, read this:** enforcement is for the whole of Firestore. The iPhone steps Shortcut
   can't get an App Check token, so enforcing would stop step sync, and so would anyone on an old
   cached version of the app. On the free Spark plan a bot can't cost you money; the worst case is
   using up the free daily quota (the app would pause until midnight Pacific time). So: keep monitor
   mode for now; enforce only if you see abuse, or once step sync moves somewhere else.

### API key restriction

How to check: https://console.cloud.google.com/apis/credentials?project=squzo-861ad → **API keys** →
the "Browser key (auto created by Firebase)" (starts with `AIzaSyDUDT`). If *Application restrictions*
says **None**, it isn't done yet.

1. Click the key. **Application restrictions → Websites** → **Add**: `https://noxonej.github.io/*`
   (add `http://localhost:5173/*` if you run the app on your computer).
2. **API restrictions → Restrict key** → tick: Cloud Firestore API, Identity Toolkit API, Token
   Service API, Firebase App Check API. **Save**.
3. **Shortcut**: website-restricted keys only answer requests that say they come from your site. In
   the Shortcut, open **Get Contents of URL → Show More → Headers → Add new header**: key `Referer`,
   value `https://noxonej.github.io/`. Run it once, then in Squzo tap **Test** in the steps setup.
   Do this step *before* step 1, so step sync never breaks. (The app's setup screen now shows it too.)

### Billing / budget alert

How to check: https://console.cloud.google.com/billing/linkedaccount?project=squzo-861ad. If it says
the project has **no billing account**, you're on the free Spark plan and nothing can be charged. Done.

If you ever switch to Blaze: Billing → **Budgets & alerts** → **Create budget** → project
`squzo-861ad` → amount **€5** → alerts at 50%, 90%, 100% → email → **Finish**. (A budget *warns*, it
doesn't stop spending.)

## Leaderboard server check (A7, proposal, not built)

Idea: in the push job (it has admin access), once an hour, for each player on this week's board, add up
their `activity/{uid}/items` for the week and delete the board entry if `weekXp` is far above what the
activity explains.

- Pro: cheaters can't stay on the board even if they edit their app.
- Con 1: activity items don't carry XP today (only a text and kind), so the check could only be rough
  ("40 quests ≈ at most 40 × 135 XP"). Honest players who share less (sharing switched off) would look
  like cheaters, so they'd need to be skipped.
- Con 2: it reads every item of every board player every hour: more Firestore reads (fine now, matters
  with thousands of players).
- Con 3: cheaters can also post fake activity, so it raises the bar but doesn't make cheating impossible.

Recommendation: the in-app filter + reports are enough until the board has real traffic. Then build
the check, starting with players who were reported.
