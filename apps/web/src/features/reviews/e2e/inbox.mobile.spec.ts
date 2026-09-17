import { expect, test } from '@e2e/support/fixtures';

test.describe('reviews inbox on a phone (390px)', () => {
  test('list → detail → back', async ({ authed }) => {
    await authed.goto('/dashboard/reviews');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('review-list')).toBeVisible();
    await expect(authed).not.toHaveURL(/review=/);
    await main.locator('[data-review-id]').first().click();
    await expect(main.getByTestId('review-detail')).toBeVisible();
    await main.getByTestId('inbox-back').click();
    await expect(main.getByTestId('review-list')).toBeVisible();
    expect(await authed.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390
    );
  });
});
