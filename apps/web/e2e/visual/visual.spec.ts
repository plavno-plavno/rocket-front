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
  { name: 'overview', url: '/dashboard/overview', ready: 'text=Последние отзывы' }
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
