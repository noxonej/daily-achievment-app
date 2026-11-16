# Turn on real push notifications

Squzo's reminders now come from a tiny server (`functions/index.js`), so they arrive even when the app is closed. You set it up once. It takes about 15 minutes and works from a laptop browser (no installs).

## 1. Switch Firebase to pay-as-you-go (Blaze)
1. Open https://console.firebase.google.com and pick **squzo-861ad**.
2. Bottom left: **Upgrade** → **Blaze**. Add a card.
3. Set a **budget alert** of $1 so you get an email if anything ever costs money.

At Squzo's size this is normally **$0**: the server runs 96 times a day, and the free amount is 2 million runs a month. At most you might see a few cents for storing the server code.

## 2. Send the server up (Google Cloud Shell, in your browser)
1. Open https://shell.cloud.google.com, signed in with the same Google account.
2. Paste these lines one by one:

```bash
git clone -b claude/squzo-retention-pack https://github.com/noxonej/daily-achievment-app
cd daily-achievment-app/functions && npm install && cd ..
npx firebase-tools login --no-localhost
npx firebase-tools deploy --only functions,firestore:rules --project squzo-861ad
```

The login step shows a link: open it, allow, and paste the code back. If deploy asks to turn on APIs (Cloud Functions, Cloud Build, Artifact Registry, Cloud Scheduler), answer **Y**. If it fails the very first time, wait 2 minutes and run the deploy line again (Google is still switching the APIs on).

This also publishes `firestore.rules`, so you don't need to paste them by hand.

## 3. Try it
1. Wait 15 minutes (the server makes its push keys on its first run).
2. iPhone: add Squzo to the home screen first, then open it from there. Android: any Chrome works.
3. Open Squzo, make sure you are signed in with Google and notifications are allowed.
4. Close the app. You will get the next reminder (morning, 12:30, 16:00, evening, last call) on time.

To check that it runs: Firebase console → **Functions** → `sendReminders` → **Logs**.
