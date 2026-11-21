import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { DEFAULT_APP_URL } from './src/site.ts'
import { landingHtml, landingPath, robotsTxt, sitemapXml } from './landing/landing.ts'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

/**
 * Writes asset-manifest.json: every built file in assets/. The service worker (public/sw.js) reads it
 * after each update and deletes cached files that the new version no longer uses.
 */
function assetManifest(): Plugin {
  return {
    name: 'squzo-asset-manifest',
    apply: 'build',
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle).filter((f) => f.startsWith('assets/')).sort()
      this.emitFile({ type: 'asset', fileName: 'asset-manifest.json', source: JSON.stringify({ assets }) })
    },
  }
}

/**
 * Content Security Policy (A10, round 2): the browser only runs scripts and talks to servers listed
 * here, so injected code can't load anything else or send your data somewhere. Added at build time
 * because the inline boot script in index.html is allowed by its exact SHA-256 hash (no
 * 'unsafe-inline' for scripts). Not added in dev, where Vite's live reload needs inline code.
 *
 * Styles keep 'unsafe-inline': index.html's boot logo and Google's sign-in button use style
 * attributes. Style injection can't run code, so that's the usual, accepted trade-off.
 * frame-ancestors can't be set from a <meta> tag (GitHub Pages can't send headers either).
 */
export const CSP_SOURCES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", 'https://accounts.google.com/gsi/client', 'https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://accounts.google.com/gsi/style'],
  'img-src': ["'self'", 'data:', 'blob:', 'https://*.googleusercontent.com'],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    'https://firestore.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://firebaseappcheck.googleapis.com',
    'https://www.googleapis.com',
    'https://accounts.google.com/gsi/',
    'https://api.coingecko.com',
  ],
  'frame-src': ['https://accounts.google.com/gsi/', 'https://www.google.com/recaptcha/', 'https://recaptcha.google.com/recaptcha/'],
  'worker-src': ["'self'"],
  'manifest-src': ["'self'"],
  'media-src': ["'self'", 'data:', 'blob:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
} as const

function csp(): Plugin {
  return {
    name: 'squzo-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`)
        const parts = Object.entries(CSP_SOURCES).map(([k, v]) => `${k} ${(k === 'script-src' ? [...v, ...hashes] : v).join(' ')}`)
        const tag = `<meta http-equiv="Content-Security-Policy" content="${parts.join('; ')}" />`
        return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    ${tag}`)
      },
    },
  }
}

/** C3: writes the EN/LT landing pages, robots.txt and sitemap.xml next to the app. */
function landing(appUrl: string): Plugin {
  return {
    name: 'squzo-landing',
    apply: 'build',
    generateBundle() {
      if (process.env.CAPACITOR === '1') return
      for (const lang of ['en', 'lt'] as const) this.emitFile({ type: 'asset', fileName: `${landingPath(lang)}index.html`, source: landingHtml(lang, appUrl) })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(appUrl) })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(appUrl) })
    },
  }
}

// https://vite.dev/config/
// The base path comes from the one app URL (src/site.ts or VITE_APP_URL). The phone apps
// (Capacitor, CAPACITOR=1) are served from the root of the app instead.
const APP_URL = new URL(process.env.VITE_APP_URL || DEFAULT_APP_URL)
const APP_PATH = APP_URL.pathname.replace(/\/*$/, '/')
export default defineConfig({
  base: process.env.CAPACITOR === '1' ? '/' : APP_PATH,
  plugins: [react(), tailwindcss(), assetManifest(), csp(), landing(`${APP_URL.origin}${APP_PATH}`)],
  // The app's version (package.json), shown in Settings → About.
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
})
