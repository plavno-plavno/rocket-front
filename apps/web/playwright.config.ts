import { defineConfig, devices } from '@playwright/test';

/**
 * E2E against the mock core-api (SDD-01 §5.3, SDD-01T §3.10).
 * Ports come from .env.local of the worktree (WEB_PORT / MOCK_PORT) so tracks never collide.
 */
const WEB_PORT = Number(process.env.WEB_PORT ?? process.env.PORT ?? 3100);
const MOCK_PORT = Number(process.env.MOCK_PORT ?? 4100);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: '.',
  testMatch: ['e2e/**/*.spec.ts', 'src/features/**/e2e/**/*.spec.ts'],
  timeout: 30_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    extraHTTPHeaders: {}
  },
  projects: [
    { name: 'setup', testMatch: /e2e\/support\/global\.setup\.ts/ },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      dependencies: ['setup']
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
      dependencies: ['setup'],
      testMatch: /.*\.mobile\.spec\.ts/
    }
  ],
  webServer: [
    {
      command: `MOCK_PORT=${MOCK_PORT} MOCK_LATENCY=0 MOCK_STREAM=0 pnpm mock:api`,
      url: `http://localhost:${MOCK_PORT}/__mock/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    },
    {
      // Production build by default: no on-demand compilation stalls (clicks before hydration
      // made dev-mode runs flaky). E2E_DEV=1 uses `next dev` for quick local iteration.
      // E2E_SKIP_BUILD=1 (CI) starts the already built app.
      command: process.env.E2E_DEV
        ? `CORE_API_URL=http://localhost:${MOCK_PORT} PORT=${WEB_PORT} NEXT_PUBLIC_SENTRY_DISABLED=true NEXT_DEV_INDICATORS=false NEXT_PUBLIC_SHOW_DEV_PAGES=true pnpm exec next dev`
        : `${process.env.E2E_SKIP_BUILD ? '' : `CORE_API_URL=http://localhost:${MOCK_PORT} NEXT_PUBLIC_SENTRY_DISABLED=true NEXT_PUBLIC_SHOW_DEV_PAGES=true pnpm exec next build && `}CORE_API_URL=http://localhost:${MOCK_PORT} PORT=${WEB_PORT} pnpm exec next start -p ${WEB_PORT}`,
      url: `${BASE_URL}/auth/sign-in`,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000
    }
  ]
});
