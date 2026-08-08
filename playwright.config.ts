import { defineConfig, devices } from '@playwright/test'

// End-to-end smoke tests run against the production build served by the
// Cloudflare Workers runtime (vite preview).

// The tools lean on APIs whose support differs by engine — OffscreenCanvas,
// module workers, WebP encoding — so Chromium alone is not evidence. Gecko and
// WebKit are still kept out of the default run: they double its length, and
// Playwright ships no WebKit build for macOS 13, so merely listing that project
// fails the whole suite on this machine. `ALL_BROWSERS=1 npm run e2e` opts in,
// and `--project=firefox` picks one. Note that naming a project on the command
// line cannot resurrect one this array leaves out, which is why the switch is
// here rather than left to the caller.
const allBrowsers = Boolean(process.env.ALL_BROWSERS)

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
    ...(allBrowsers
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
          {
            // Safari is the engine most likely to differ here, and the one this
            // machine cannot run. It is left in so CI and newer macOS cover it.
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
        ]
      : []),
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4199 --strictPort',
    url: 'http://localhost:4199',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
