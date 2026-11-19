import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/space-grotesk/latin-700.css'
import '@fontsource-variable/manrope'
import '@fontsource-variable/outfit'
import '@fontsource/jersey-15/latin-400.css'
import '@fontsource/silkscreen/latin-400.css'
import './index.css'
import './lib/startupCleanup'
import './lib/install'
import { requestPersistentStorage } from './lib/persist'
import App from './App.tsx'
import { AuthGate } from './components/AuthGate.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { AppCrash } from './components/AppCrash.tsx'

// Errors nobody caught: written to the console (nothing is sent anywhere).
window.addEventListener('error', (e) => console.error('[Squzo] Uncaught error:', e.error ?? e.message))
window.addEventListener('unhandledrejection', (e) => console.error('[Squzo] Unhandled promise rejection:', e.reason))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary name="App" fallback={() => <AppCrash />}>
      <AuthGate>
        <App />
      </AuthGate>
    </ErrorBoundary>
  </StrictMode>,
)

// Ask the browser not to clear Squzo's data when it's short on space (Safari can otherwise).
void requestPersistentStorage()

// No pinch-zoom (iPhone ignores user-scalable=no, so block the gesture itself) and no trackpad
// pinch on computers. Scrolling and every tap work as normal.
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false })
}
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length > 1) e.preventDefault()
  },
  { passive: false },
)
window.addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey) e.preventDefault()
  },
  { passive: false },
)

// Offline support + Android notifications. Only in the built app, so local development never caches stale files.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined)
  })
}
