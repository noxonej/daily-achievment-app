# Squzo steps demo (not in the live app yet)

A tiny phone app that shows **one thing**: counting steps all day, even when the app is closed.
It is separate from Squzo on purpose. The live website and the main app code are not changed.
When it works well on real phones, it can move into Squzo (see "Moving it into Squzo" below).

## Why a phone app can do this and the website can't

A website only runs while its tab is open, so Squzo's website counts steps with the motion sensor
only while you look at it. Phones have a small **step chip** that counts every step all day for free
(very little battery). Only a real app is allowed to read it:

| | iPhone | Android |
|---|---|---|
| What we read | CoreMotion pedometer (`CMPedometer`) | Step counter sensor (`TYPE_STEP_COUNTER`) |
| App closed? | Fine: iPhone keeps the last **7 days** of steps | Fine: the app checks the chip about every 15 minutes in the background (WorkManager) |
| Permission | "Motion & Fitness" pop-up | "Physical activity" pop-up (Android 10+) |
| First day | Shows today's steps from midnight | Starts from 0 when you first open it |

The code:
- `www/index.html`: the demo screen (today, goal bar, last 7 days).
- `ios/App/App/SquzoStepsPlugin.swift`: the iPhone side.
- `android/app/src/main/java/app/squzo/stepsdemo/`: the Android side (`SquzoStepsPlugin`, `StepStore`, `StepWorker`).
- `integration/nativeSteps.ts`: ready-made bridge for the real app later (not used yet).

## Try it on an Android phone (free, no Google account needed)

1. Open the repository on GitHub → **Actions** → **Steps demo app** → the newest green run.
2. Scroll to **Artifacts**, download `squzo-steps-demo-android`, unzip it: you get `app-debug.apk`.
3. Send the `.apk` to the phone (Google Drive, email, cable) and open it. Android asks to allow
   "install unknown apps" for that app (Drive, Files…): allow it once.
4. Open **Squzo Steps Demo**, tap **Allow step counting**, then put the phone in your pocket, close
   the app, walk, and open it again later.

The **$25 Google Play account** is only needed to publish to the Play Store, not for testing like this.

## Try it on an iPhone

Apple is stricter: installing your own app on an iPhone needs **a Mac with Xcode** (free download).

- **Free way (Mac + free Apple ID):** on the Mac run the steps below, plug in the iPhone, pick your
  Apple ID as "Team" in Xcode (Signing & Capabilities), and press ▶. The app works for 7 days, then
  you press ▶ again. You may need to trust yourself on the iPhone in Settings → General → VPN & Device
  Management.
- **$99/year Apple Developer account:** needed for TestFlight (send to friends' iPhones without a
  cable) and the App Store. With it, a cloud Mac (GitHub Actions macOS, Codemagic, Ionic Appflow) can
  build and upload for you, so you don't need your own Mac.
- No Mac and no account: the GitHub run still checks that the iPhone code compiles, but it can't be
  installed.

```bash
cd steps-demo
npm install
npx cap sync ios
npx cap open ios      # opens Xcode
```

## Building it yourself

```bash
cd steps-demo
npm install
npx cap sync          # copies www/ into both apps
npx cap open android  # Android Studio (any computer): press ▶ with a phone plugged in
npx cap open ios      # Xcode (Mac only)
```

## Moving it into Squzo later

1. In the main app run `npx cap add android` / `npx cap add ios` (see STORE-RELEASE.md).
2. Copy the plugin files: the three Java files (change `package app.squzo.stepsdemo` to
   `app.squzo.squzo`), the `registerPlugin` line in MainActivity, the WorkManager line in
   `app/build.gradle`, the two manifest lines, and on iOS the two Swift files, the storyboard class and
   `NSMotionUsageDescription`.
3. Copy `integration/nativeSteps.ts` to `src/lib/` and use it in `AutoSteps.tsx` as its comment shows.
   On the website it does nothing, so the website keeps counting the way it does now.

Possible upgrades after that: Apple Health (HealthKit) for Apple Watch steps and longer history, and
Android Health Connect for exact totals from Samsung Health / Google Fit. Both need more permissions
and store review notes, so they are a second step.
