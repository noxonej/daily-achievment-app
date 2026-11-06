# Turning on Google sign-in and Friends

Both use one free Google Cloud / Firebase project. Nothing here is a secret: the IDs are meant
to be in the app, and `firestore.rules` decides who can read what.

## 1. Google sign-in (backup to Google Drive)
1. Go to https://console.cloud.google.com and create a project called **Dayforge**.
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **OAuth consent screen**: app name *Dayforge*, your email, audience **External**.
   While it's in *Testing*, add your and your friends' Gmail addresses under **Test users**.
4. **Credentials → Create credentials → OAuth client ID** → *Web application*.
   Authorised JavaScript origins: `https://noxonej.github.io`
5. Copy the **Client ID** (ends in `.apps.googleusercontent.com`) into
   `GOOGLE_CLIENT_ID_DEFAULT` in `src/lib/google.ts`.

## 2. Friends (Firebase)
1. Go to https://console.firebase.google.com → **Add project** → pick the same **Dayforge**
   Google Cloud project.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
   Under **Settings → Authorised domains**, add `noxonej.github.io`.
3. **Build → Firestore Database → Create database** (production mode, a region near you).
4. In Firestore **Rules**, paste the contents of `firestore.rules` from this repo and **Publish**.
5. **Project settings → General → Your apps → Web (`</>`)**, register an app, and copy
   `apiKey` and `projectId` into `API_KEY_DEFAULT` and `PROJECT_ID_DEFAULT` in
   `src/lib/firebase.ts`.

Push, and the Google and Friends buttons switch from "coming soon" to working.

### What's stored online
Only: name, friend code, character, level, streak, weekly XP, and finished quests / runs /
badges (each can be switched off under *Friends → What friends can see*). Money, savings,
crypto, the week plan, the diary and notes never leave the phone.

The free Firebase plan covers roughly 50,000 reads a day, plenty for hundreds of users.
