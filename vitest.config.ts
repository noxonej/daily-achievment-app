import { defineConfig } from 'vitest/config'

// Tests run in Node with a fake localStorage / IndexedDB (src/test/setup.ts), in a time zone that has
// daylight-saving time, so date bugs around the clock change show up.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    env: { TZ: 'Europe/Vilnius' },
  },
})
