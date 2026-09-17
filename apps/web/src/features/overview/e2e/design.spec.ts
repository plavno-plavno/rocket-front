import { expect, test } from '@e2e/support/fixtures';

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test.describe(`dashboard motion: ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    test('hydrates, settles and preserves KPI navigation', async ({ authed }) => {
      const errors: string[] = [];
      authed.on('pageerror', (error) => errors.push(error.message));
      await authed.goto('/dashboard/overview');
      const main = authed.locator('#main-content');
      const synced = main.locator('.lp-stat-card').filter({ hasText: 'Синхронизированы' });
      await expect(synced.locator('[data-slot="skeleton"]')).toHaveCount(0);
      await expect(synced).toHaveCSS('opacity', '1');
      await expect(synced).toHaveCSS('transform', 'none');
      await expect(main.locator('.lp-health-panel')).toContainText(/\d+\s*%/);
      await synced.getByRole('button').click();
      await expect(authed).toHaveURL(/locations\?syncStatus=synced/);
      await authed.goBack();
      await expect(main.locator('.lp-welcome-panel')).toBeVisible();
      await expect(main.locator('.lp-dashboard-content')).toHaveCSS('opacity', '1');
      expect(errors).toEqual([]);
    });
  });
}

test('mobile overview fits the viewport in both themes', async ({ authed }) => {
  await authed.setViewportSize({ width: 390, height: 844 });
  await authed.emulateMedia({ reducedMotion: 'reduce' });
  await authed.goto('/dashboard/overview');
  const main = authed.locator('#main-content');
  await expect(main.locator('.lp-health-panel')).toContainText(/\d+\s*%/);
  for (const theme of ['light', 'dark'] as const) {
    await authed.emulateMedia({ colorScheme: theme });
    await expect(main.getByRole('link', { name: 'Открыть компании' })).toBeVisible();
    expect(await authed.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390
    );
  }
});
