/** The whole-app crash screen (top-level error boundary in main.tsx). Plain styles so it works even if the app's CSS failed. */
export function AppCrash() {
  return (
    <div
      role="alert"
      style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center', background: '#0b0d12', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}
    >
      <div style={{ fontSize: 40 }} aria-hidden="true">🛟</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Something went wrong</h1>
      <p style={{ fontSize: 16, color: '#cbd5e1', maxWidth: 320, margin: 0 }}>Your data is safe. It's still saved on this phone. Reloading usually fixes this.</p>
      <button
        onClick={() => window.location.reload()}
        style={{ marginTop: 8, fontSize: 16, fontWeight: 700, padding: '12px 28px', borderRadius: 999, border: 0, background: '#f59e0b', color: '#fff', cursor: 'pointer' }}
      >
        Reload
      </button>
    </div>
  );
}
