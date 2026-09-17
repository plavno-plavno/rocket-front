import { expect, test } from '@e2e/support/fixtures';

test.describe('online presence (S-PRS-01)', () => {
  test('overview: KPI, platforms without data, platform filter and platform page', async ({
    authed
  }) => {
    await authed.goto('/dashboard/presence');
    const main = authed.locator('#main-content');
    await expect(main.getByText('Показы').first()).toBeVisible();
    await expect(main.getByTestId('platforms-without-data')).toContainText('Zoon');
    await expect(main.getByTestId('impressions-card')).toBeVisible();

    await main.getByTestId('presence-platform').click();
    await authed.getByRole('option', { name: /Яндекс Бизнес/ }).click();
    await expect(authed).toHaveURL(/platform=plt_yandex/);

    await main.getByTestId('platform-links').getByRole('link', { name: /Zoon/ }).click();
    await expect(authed).toHaveURL(/presence\/platform\/plt_zoon/);
    await expect(main.getByTestId('platform-no-data')).toBeVisible();
  });

  test('sync matrix and keywords month switch', async ({ authed }) => {
    await authed.goto('/dashboard/presence/sync');
    const main = authed.locator('#main-content');
    await expect(
      main.getByTestId('sync-matrix').getByRole('row').filter({ hasText: 'Все площадки' })
    ).toBeVisible();

    await authed.goto('/dashboard/presence/keywords');
    await expect(main.getByTestId('keywords-table').getByRole('row').nth(1)).toContainText(
      /кроссовки|спорт/
    );
    await main.getByTestId('keywords-month').click();
    await authed.getByRole('option').nth(1).click();
    await expect(authed).toHaveURL(/month=\d{4}-\d{2}/);
  });
});
