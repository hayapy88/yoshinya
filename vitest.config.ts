import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Vitest deliberately does not load vite.config.ts: the React Router and
// Cloudflare plugins are meant for the app build and break under the test runner.
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    include: ['app/**/*.test.{ts,tsx}'],
  },
})
