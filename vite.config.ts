import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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

// https://vite.dev/config/
export default defineConfig({
  base: '/daily-achievment-app/',
  plugins: [react(), tailwindcss(), assetManifest()],
})
