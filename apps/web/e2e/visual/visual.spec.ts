import { expect, test } from '../support/fixtures';

/**
 * Visual regression baselines (SDD-01T §6.2): ready screens in light and dark at 1440px.
 * Runs only with VISUAL=1 (font rendering differs between machines; CI runs it in the nightly
 * job on a pinned image). Update baselines: VISUAL=1 pnpm e2e e2e/visual --update-snapshots
 */
test.skip(!process.env.VISUAL, 'set VISUAL=1 to run visual regression');

const PAGES: { name: string; url: string; ready: string }[] = [
  { name: 'components', url: '/dashboard/dev/components', ready: '[data-section="primitives"]' },
  { name: 'locations', url: '/dashboard/locations', ready: 'text=Всего строк' },
  { name: 'overview', url: '/dashboard/overview', ready: 'text=Последние отзывы' },
  { name: 'sources', url: '/dashboard/sources', ready: '[data-testid="coverage-table"]' },
  { name: 'location-import', url: '/dashboard/locations/import', ready: 'text=Скачать шаблон' },
  { name: 'reviews', url: '/dashboard/reviews', ready: '[data-testid="review-detail"]' },
  { name: 'questions', url: '/dashboard/questions', ready: '[data-testid="question-detail"]' },
  { name: 'templates', url: '/dashboard/reviews/templates', ready: 'text=Спасибо за оценку' },
  {
    name: 'auto-replies',
    url: '/dashboard/reviews/auto-replies',
    ready: '[data-testid="rules-table"] tbody tr'
  },
  { name: 'ai', url: '/dashboard/reviews/ai', ready: '[data-testid="ai-sandbox"]' },
  { name: 'settings-users', url: '/dashboard/settings/users', ready: 'text=owner@example.ru' },
  {
    name: 'settings-accounts',
    url: '/dashboard/settings/accounts',
    ready: '[data-testid="accounts-table"] tbody tr'
  },
  {
    name: 'settings-integrations',
    url: '/dashboard/settings/integrations',
    ready: '[data-testid="webhooks"] tbody tr'
  },
  {
    name: 'notifications',
    url: '/dashboard/notifications',
    ready: '[data-testid="notifications-list"]'
  },
  { name: 'onboarding', url: '/dashboard/onboarding', ready: 'text=Добавлено' },
  {
    name: 'analytics',
    url: '/dashboard/analytics/reviews',
    ready: '[data-testid="negative-locations"] li'
  },
  {
    name: 'analytics-locations',
    url: '/dashboard/analytics/reviews/locations',
    ready: '[data-testid="ranking-locations"] tbody tr'
  },
  { name: 'presence', url: '/dashboard/presence', ready: '[data-testid="platform-links"] a' },
  { name: 'presence-sync', url: '/dashboard/presence/sync', ready: 'text=Все площадки' },
  { name: 'rank', url: '/dashboard/rank', ready: '[data-testid="rank-competitors"] tbody tr' }
];

for (const theme of ['light', 'dark'] as const) {
  test.describe(theme, () => {
    test.use({ colorScheme: theme });
    for (const p of PAGES) {
      test(`${p.name} ${theme}`, async ({ authed }) => {
        await authed.goto(p.url);
        await authed.locator('#main-content').locator(p.ready).first().waitFor();
        // let charts/maps settle
        await authed.waitForTimeout(1500);
        await expect(authed).toHaveScreenshot(`${p.name}-${theme}.png`, {
          fullPage: true,
          animations: 'disabled',
          mask: [authed.locator('[data-heatmap]'), authed.locator('time')]
        });
      });
    }
  });
}
