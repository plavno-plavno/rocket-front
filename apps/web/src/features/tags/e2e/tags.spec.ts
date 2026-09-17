import { expect, test } from '@e2e/support/fixtures';

test.describe('tags (S-REV-03)', () => {
  test('creates and deletes a tag', async ({ authed }) => {
    await authed.goto('/dashboard/reviews/tags');
    const main = authed.locator('#main-content');
    await main.getByTestId('tag-add').click();
    const dialog = authed.getByTestId('tag-dialog');
    await dialog.getByLabel('Название').fill('VIP e2e');
    await dialog.getByRole('button', { name: 'Сохранить' }).click();
    await expect(authed.getByText('Тег создан')).toBeVisible();
    const row = main.getByRole('row').filter({ hasText: 'VIP e2e' });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Удалить' }).click();
    await authed.getByRole('dialog').getByRole('button', { name: 'Удалить' }).first().click();
    await expect(authed.getByText('Тег удалён')).toBeVisible();
  });
});
