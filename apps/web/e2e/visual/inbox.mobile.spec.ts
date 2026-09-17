import { expect, test } from '../support/fixtures';

/** 390px baseline of the inbox (SDD-01T §6.2 «390px для инбокса»). Runs with VISUAL=1. */
test.skip(!process.env.VISUAL, 'set VISUAL=1 to run visual regression');

for (const theme of ['light', 'dark'] as const) {
  test(`inbox mobile ${theme}`, async ({ authed }) => {
    await authed.emulateMedia({ colorScheme: theme });
    await authed.goto('/dashboard/reviews');
    await authed.locator('#main-content').locator('[data-review-id]').first().waitFor();
    await authed.waitForTimeout(1000);
    await expect(authed).toHaveScreenshot(`inbox-mobile-${theme}.png`, {
      fullPage: true,
      animations: 'disabled',
      mask: [authed.locator('time')]
    });
  });
}
