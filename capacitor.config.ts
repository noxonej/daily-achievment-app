import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Phone app wrapper (C2). The web build (CAPACITOR=1 npm run build) is copied into the Android and
 * iOS projects by `npx cap sync`. See STORE-RELEASE.md.
 *
 * appId can NEVER change after the first store upload. Pick it once, ideally from a domain you own
 * (squzo.app → app.squzo.squzo).
 */
const config: CapacitorConfig = {
  appId: 'app.squzo.squzo',
  appName: 'Squzo',
  webDir: 'dist',
  backgroundColor: '#0c0a09',
  android: { allowMixedContent: false },
  ios: { contentInset: 'always' },
};

export default config;
