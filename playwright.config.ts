import { defineConfig, devices } from '@playwright/test'

// End-to-end smoke tests run against the production build served by the
// Cloudflare Workers runtime (vite preview).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4199',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Pixel 7 keeps the mobile viewport on Chromium so a single browser
      // download covers both projects.
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4199 --strictPort',
    url: 'http://localhost:4199',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
