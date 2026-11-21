# Putting Squzo in the App Store and Google Play (C2)

Squzo is wrapped with **Capacitor 7**: the same web app runs inside a real Android / iPhone app.
Config: `capacitor.config.ts`. The Capacitor packages are dev-only, so the website doesn't get bigger.

## ⚠️ Fix these before submitting (otherwise the apps get rejected or features break)

1. **Google sign-in doesn't work inside an app's web view.** Google blocks it (`disallowed_useragent`).
   Needed: a native sign-in plugin, e.g. `@capacitor-firebase/authentication` (Google provider), then
   pass its ID token to Squzo's existing Firebase sign-in. Until then, the store app works fully
   offline but without Google backup, Friends, Squads and invite rewards.
2. **Web push doesn't work in the iPhone app.** Daily motivation needs `@capacitor/push-notifications`
   (Firebase Cloud Messaging) in the app. The current web push keeps working for the website/PWA.
3. **Apple rule 4.2 (minimum functionality):** Apple rejects apps that are "just a website". Squzo
   has a lot of its own features, but add at least one native thing (notifications, Apple Health
   steps via a HealthKit plugin instead of the Shortcut, haptics) before the first iOS review.
4. **appId** in `capacitor.config.ts` (`app.squzo.squzo`) can never change after the first upload.
5. **Payments:** selling Premium inside the iPhone app must use Apple's in-app purchase (see
   docs/PAYMENTS.md: RevenueCat).

## Accounts (one-time)

| | Google Play | Apple App Store |
|---|---|---|
| Cost | $25 once | $99 per year |
| Age | Owner must be **18+**: a parent/guardian opens the account (you can be added as a user) | Same: 18+, parent's Apple ID or an organisation |
| Computer | Any (Windows, Mac, Linux) with Android Studio | **A Mac with Xcode** is required to build and upload |
| New personal accounts | Must test with **12 testers for 14 days** (closed test) before going public | TestFlight beta is optional |

## Build steps

```bash
npm install
CAPACITOR=1 npm run build     # web build served from the app's root
npx cap add android           # first time only (creates android/)
npx cap add ios               # first time only, on a Mac (creates ios/)
npm run build:app             # every time: build + copy into both apps
npm run app:android           # opens Android Studio → Build → Generate Signed App Bundle (.aab)
npm run app:ios               # opens Xcode → Product → Archive → Distribute App
```

Commit the `android/` and `ios/` folders once created (that's normal for Capacitor). **Never commit
the Android signing key (`.jks`) or its passwords**: keep them in a password manager. Losing the key
means you can't update the app.

Icons and splash: put a 1024×1024 `icon.png` and a 2732×2732 `splash.png` in `assets/`, then run
`npx @capacitor/assets generate`.

## Store listing checklist

- [ ] Name: *Squzo: Habits, Goals & Money* (30 characters max on both stores)
- [ ] Short description (Play, 80 chars): *Level up your real life: daily quests, streaks, stats and savings goals.*
- [ ] Screenshots: at least 2 phone screenshots (Play), 6.7" and 6.5" iPhone sizes (Apple)
- [ ] Privacy policy URL: the About page (or the landing page `/privacy` section)
- [ ] **Play Data safety / Apple privacy labels**, answered from SECURITY.md's data map:
  - Collected: name (optional, friends), email (Google sign-in), photos (optional challenge proof),
    app activity (quests, for friends/backups), device ID (random install id for usage counts)
  - Not sold, not used for ads or tracking; encrypted in transit; users can delete (Settings → Account)
- [ ] Age rating questionnaire: no violence, user-generated content = **yes** (friends, squads, photos)
  → needs a way to report and block (already there: Report, Block)
- [ ] Content: "Not medical or financial advice" (already in About → Terms)
- [ ] Contact email for the store page

## Money tip

Store apps get found through search. Pick 2–3 words people actually type ("habit tracker",
"daily planner", "savings goal") and use them in the title and first line of the description.
