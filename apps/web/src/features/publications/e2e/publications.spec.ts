import { expect, test } from '@e2e/support/fixtures';

test.describe('publications (S-PUB-01)', () => {
  test('creates a publication with preview and sees per-listing results', async ({ authed }) => {
    await authed.goto('/dashboard/publications');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('publications-list').getByRole('row').nth(1)).toBeVisible();

    await main.getByTestId('publication-create').click();
    const composer = authed.getByTestId('publication-composer');
    await composer.getByTestId('pub-submit').click();
    await expect(composer.getByRole('alert')).toHaveText('Введите текст публикации');
    await composer.getByTestId('pub-type-offer').click();
    await composer.getByLabel('Заголовок').fill('Скидка 20 % (e2e)');
    await composer.getByLabel('Текст *').fill('Только до конца недели во всех магазинах сети.');
    await expect(composer.getByTestId('pub-preview')).toContainText('Скидка 20 % (e2e)');
    await composer.getByTestId('pub-submit').click();
    await expect(composer.getByRole('alert')).toHaveText('Выберите хотя бы одну площадку');
    await composer.getByTestId('pub-platforms').getByRole('checkbox').first().click();
    await composer.getByTestId('pub-submit').click();
    await expect(authed.getByText('Публикация отправлена на площадки')).toBeVisible();

    const row = main.getByRole('row').filter({ hasText: 'Скидка 20 % (e2e)' });
    await expect(row).toContainText(/Опубликована|Частично|Публикуется/, { timeout: 10_000 });
    await row.click();
    const sheet = authed.getByTestId('publication-sheet');
    await expect(sheet.getByTestId('publication-results').getByRole('row').nth(1)).toBeVisible({
      timeout: 10_000
    });
  });

  test('filters by state and type', async ({ authed }) => {
    await authed.goto('/dashboard/publications');
    const main = authed.locator('#main-content');
    await main.getByRole('tab', { name: 'Черновик' }).click();
    await expect(authed).toHaveURL(/state=draft/);
    await expect(main.locator('tr[data-state="draft"]').first()).toBeVisible();
    await expect(main.locator('tr[data-state="published"]')).toHaveCount(0);
  });
});
