import { expect, test } from '@e2e/support/fixtures';

test.describe('duplicates & fakes (S-DUP-01)', () => {
  test('queue KPI filter, case details with comparison, dismiss', async ({ authed }) => {
    await authed.goto('/dashboard/duplicates');
    const main = authed.locator('#main-content');
    const queue = main.getByTestId('duplicates-queue');
    await expect(queue.getByRole('row').nth(1)).toBeVisible();

    await main.getByRole('button', { name: /Фейки/ }).click();
    await expect(authed).toHaveURL(/kind=fake/);
    await expect(queue.getByRole('row').nth(1)).toContainText('Фейк');

    await queue.getByRole('row').nth(1).click();
    const sheet = authed.getByTestId('duplicate-sheet');
    await expect(sheet.getByTestId('duplicate-map')).toBeVisible();
    await expect(sheet.getByTestId('duplicate-comparison').getByRole('row')).toHaveCount(4);
    await expect(sheet.getByTestId('duplicate-score')).toContainText('%');
    await sheet.getByTestId('dup-action-dismiss').click();
    await expect(authed.getByText('Кейс отклонён')).toBeVisible();
    await expect(sheet).toBeHidden();
  });

  test('resolved tab shows closed cases', async ({ authed }) => {
    await authed.goto('/dashboard/duplicates?state=resolved');
    const queue = authed.locator('#main-content').getByTestId('duplicates-queue');
    await expect(queue.locator('tr[data-state="open"]')).toHaveCount(0);
    await expect(queue.getByRole('row').nth(1)).toBeVisible();
  });
});
