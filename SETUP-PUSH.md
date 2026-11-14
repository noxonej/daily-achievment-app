# Switch on notifications + Apple Health steps (one-time, about 5 minutes)

Squzo's motivational notifications are sent by a small free job on GitHub (it runs every 15 minutes).
The same job also publishes `firestore.rules` to Firebase by itself, which the Apple Health step sync
needs. It only needs **one key** from Firebase. No credit card, no Blaze plan, no Cloud Shell.

## 1. Get the key from Firebase
1. Open https://console.firebase.google.com and pick **squzo-861ad**.
2. Click the gear ⚙ (top left) → **Project settings** → **Service accounts**.
3. Click **Generate new private key** → **Generate key**. A `.json` file downloads.

Treat this file like a password: never post it in a chat, an issue or the code.

## 2. Give it to GitHub as a secret
1. Open https://github.com/noxonej/daily-achievment-app/settings/secrets/actions
2. **New repository secret**.
3. Name: `FIREBASE_SERVICE_ACCOUNT`
4. Secret: open the downloaded `.json` file in a text editor, copy **everything**, paste it.
5. **Add secret**. You can delete the downloaded file now.

## 3. Start it
1. Open https://github.com/noxonej/daily-achievment-app/actions/workflows/push.yml
2. **Run workflow** → **Run workflow**. After a minute it should be green ✓.
   The log says `Published firestore.rules` the first time and `Push round: {...}` every time.

From then on it runs by itself every 15 minutes.

## 4. On your phone
- **iPhone:** open Squzo in Safari → Share → **Add to Home Screen**, then open it from the home screen
  (Apple only allows notifications for home-screen apps). **Android:** Chrome is enough.
- Settings → Notifications → **Daily motivation** on → **Allow**.
- When it says *"Delivered by Squzo's server"*, you're done. Close the app; the next message comes on time.

## Good to know
- GitHub sometimes starts the job a few minutes late. Messages may come up to ~15 minutes after the
  planned time, and never more than 45 minutes late (so never in the middle of the night).
- GitHub pauses scheduled jobs in a repository with no commits for 60 days. If that ever happens, it
  emails you; open the Actions tab and click **Enable workflow**.
- Cost: $0. Public repositories get GitHub Actions for free, and Firebase's free plan easily covers it.
- Already on the Blaze plan? `functions/index.js` is the same sender as a Firebase function; you can
  use that instead (`firebase deploy --only functions`), but don't run both.
