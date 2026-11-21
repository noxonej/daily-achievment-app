# Moving Squzo to its own domain (C4)

The app's web address is **one value**: `DEFAULT_APP_URL` in `src/site.ts`
(today `https://noxonej.github.io/daily-achievment-app/`). The build's base path, invite links,
challenge links, share cards and the Shortcut's Referer header all come from it.

## Steps (example: squzo.app)

1. **Buy the domain** (Cloudflare Registrar, Porkbun or Namecheap; a `.app` is about €12–15 a year).
   `.app` domains always need https, which GitHub Pages gives you for free.
2. **Point it at GitHub Pages.** At your domain's DNS settings add:
   - four `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - one `CNAME` record: `www` → `noxonej.github.io`
3. **GitHub:** repository → Settings → Pages → Custom domain → type `squzo.app` → Save. Wait until
   the DNS check is green, then tick **Enforce HTTPS** (can take up to an hour).
4. **Code:** in `src/site.ts` change the line to `export const DEFAULT_APP_URL = 'https://squzo.app/';`,
   commit, and let the deploy run. (Also add a file `public/CNAME` containing just `squzo.app`.)
5. **Google sign-in:** Google Cloud console → APIs & Services → Credentials → your OAuth client →
   add `https://squzo.app` to *Authorized JavaScript origins*. Keep the old one for a while.
6. **Firebase:** console → Authentication → Settings → Authorized domains → Add `squzo.app`.
   If you restricted the API key (SECURITY.md), add `https://squzo.app/*` to its website list.
7. **Apple Health Shortcut:** the Referer header must become `https://squzo.app/` (Settings → Steps
   shows the right value after the update).

## Things to know

- **Phones keep their data only on the same address.** Saved progress lives in the browser for one
  website. People who installed the old address must open it once and move: Settings → Data →
  Export backup on the old address, then Import on the new one (or use Google backup, which
  restores on any address). Keep the old GitHub Pages address working for a few months.
- The landing page (`/` on your own domain) and the app (`/app/` or `/`) can share the domain:
  if you want the app at `https://squzo.app/app/`, set the URL to that.
