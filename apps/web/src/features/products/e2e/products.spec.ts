import { expect, test } from '@e2e/support/fixtures';

test.describe('products & prices (S-PRD-01)', () => {
  test('creates a product, filters by category, pushes to platforms', async ({ authed }) => {
    await authed.goto('/dashboard/products');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('products-catalog').getByRole('row').nth(1)).toBeVisible();

    await main.getByTestId('product-create').click();
    const sheet = authed.getByTestId('product-sheet');
    await sheet.getByTestId('product-submit').click();
    await expect(sheet.getByRole('alert')).toHaveText('Укажите название');
    await sheet.getByLabel('Название *').fill('Ракетка e2e');
    await sheet.getByLabel('Цена, ₽ *').fill('4990');
    await sheet.getByTestId('product-submit').click();
    await expect(authed.getByText('Товар добавлен')).toBeVisible();
    const row = main.getByRole('row').filter({ hasText: 'Ракетка e2e' });
    await expect(row).toContainText('4 990');

    await main.getByTestId('products-category').click();
    await authed.getByRole('option', { name: 'Велоспорт' }).click();
    await expect(authed).toHaveURL(/category=/);
    await expect(main.getByRole('row').filter({ hasText: 'Ракетка e2e' })).toHaveCount(0);

    await main.getByTestId('products-sync').click();
    await expect(authed.getByText(/отправлен/)).toBeVisible();
  });
});
