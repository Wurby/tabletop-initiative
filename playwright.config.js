import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  globalSetup: './tests/global-setup.js',
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:5174',
    storageState: 'playwright/.auth/state.json',
    headless: true,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
    timeout: 15_000,
  },
})
