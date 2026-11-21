# Squzo Premium: how to take payments (B7)

Premium is built but **switched off**. `src/lib/premium.ts` → `PREMIUM_ON` is only true when the
build sets `VITE_PREMIUM=1`. While it's off nothing is locked and the paywall can't open.

Prices in the paywall: **€2.99 / month** or **€19.99 / year** (−44%), **7-day free trial**.
Free forever: quests, streaks, stats, friends, joining squads and challenges.
Premium: smart coach chat, creating squads, hosting challenges.

## The options

| | Stripe (web) | RevenueCat (app stores) |
|---|---|---|
| Where people pay | A Stripe Checkout page in the browser (PWA on GitHub Pages) | Apple App Store / Google Play, inside the Capacitor app |
| Fees | ~1.5% + €0.25 per EU card payment (more for non-EU cards) | Apple/Google take **15%** (Small Business Program, under $1M/year) + RevenueCat free up to $2.5k/month revenue, then 1% |
| Needs a server? | **Yes**: a small function to create the checkout session and receive the "paid" webhook (Firebase needs the Blaze plan for Cloud Functions, or use a free Cloudflare Worker) | No own server: RevenueCat's SDK tells the app "premium: yes/no" |
| Allowed in the iPhone app? | **No** for digital goods sold inside an iOS app (Apple rules). OK on the website. | Yes, this is the normal way |
| Trial | Stripe supports `trial_period_days: 7` | Set up as an "introductory offer" in App Store Connect / Play Console |
| Age | Under 18 you can't open a Stripe account yourself: a parent/guardian must own it | Apple/Google developer accounts also need an adult (parent) as the legal owner |

**Recommendation:** start with **RevenueCat** once the app is in the stores (C2): it handles both stores,
receipts, trials, refunds and "restore purchases", and needs no server. Add Stripe later only if many
people use the web version.

## What to change in code when you're ready

1. `hasPremium()` in `src/lib/premium.ts`: return the real subscription status (RevenueCat:
   `Purchases.getCustomerInfo()` → `entitlements.active.premium`).
2. The "Start 7-day free trial" button in `src/components/Paywall.tsx`: call the purchase
   (`Purchases.purchasePackage(...)`) instead of showing "coming soon".
3. Build with `VITE_PREMIUM=1`.

## Money tip

At €19.99/year, after Apple's 15% you keep about €17 per yearly subscriber. 100 paying users ≈
€1,700/year. Most apps convert 2–5% of active users to paid, so 100 payers needs roughly 2,000–5,000
active users. Growth (invites, share cards) matters more than the price.
