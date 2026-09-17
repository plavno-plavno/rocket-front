import { expect, test } from '@e2e/support/fixtures';

test.describe('review analytics (S-ANL-01…08)', () => {
  test('panel: KPI, period preset, region filter from the list, compare toggle', async ({
    authed
  }) => {
    await authed.goto('/dashboard/analytics/reviews');
    const main = authed.locator('#main-content');
    await expect(main.getByText('Всего отзывов', { exact: true })).toBeVisible();
    await expect(main.getByTestId('regions-card')).toBeVisible();
    await expect(main.getByTestId('rating-trend')).toBeVisible();
    await expect(main.getByTestId('negative-locations')).toContainText('Спортэксперт');

    await main.getByRole('button', { name: 'Неделя' }).click();
    await expect(authed).toHaveURL(/from=/);

    await main.getByTestId('regions-list').getByRole('button').first().click();
    await expect(authed).toHaveURL(/region=/);
    await expect(main.getByTestId('filter-region')).not.toContainText('Регион: все');
    await main.getByRole('button', { name: 'Сбросить' }).click();
    await expect(authed).not.toHaveURL(/region=/);

    await main.getByRole('button', { name: 'Сравнить периоды' }).click();
    await expect(authed).toHaveURL(/compare_from=/);
  });

  test('ranking: sort by negative and search', async ({ authed }) => {
    await authed.goto('/dashboard/analytics/reviews/locations');
    const table = authed.locator('#main-content').getByTestId('ranking-locations');
    await expect(table.getByRole('row').nth(1)).toBeVisible();
    await table.getByRole('button', { name: /Негативных/ }).click();
    await expect(authed).toHaveURL(/sort=-negative/);
    await table.getByRole('textbox').fill('Афимолл');
    await expect(table.getByRole('row').filter({ hasText: 'Афимолл' }).first()).toBeVisible();
    await expect(table.getByRole('row').filter({ hasText: 'Галерея' })).toHaveCount(0);
  });

  test('phrases link to the concordance which opens a review', async ({ authed }) => {
    await authed.goto('/dashboard/analytics/reviews/phrases');
    const main = authed.locator('#main-content');
    await main.getByTestId('ranking-phrases').getByRole('link').first().click();
    await expect(authed).toHaveURL(/concordance\?keyword=/);
    await expect(main.getByTestId('concordance')).toBeVisible();
    await main.getByTestId('concordance-input').fill('персонал');
    await main.getByRole('button', { name: 'Найти' }).click();
    await expect(authed).toHaveURL(/keyword=%D0%BF/);
    const row = main.getByRole('row').nth(1);
    await expect(row).toContainText(/персонал/i);
    await row.click();
    await expect(authed.getByRole('dialog')).toBeVisible();
  });

  test('staff table lists team members with replies', async ({ authed }) => {
    await authed.goto('/dashboard/analytics/reviews/staff');
    const table = authed.locator('#main-content').getByTestId('staff-table');
    await expect(table.getByRole('row').filter({ hasText: 'Алина Морозова' })).toBeVisible();
  });
});
