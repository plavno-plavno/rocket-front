import { expect, test } from '@e2e/support/fixtures';

test.describe('help centre', () => {
  test('search narrows the knowledge base and an article opens with a link to its screen', async ({
    authed
  }) => {
    await authed.goto('/dashboard/help');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('help-sections').locator('[data-section]')).toHaveCount(6);
    await expect(main.getByTestId('help-hotkeys')).toContainText('Горячие клавиши');

    await main.getByTestId('help-search').fill('вебхук');
    await expect(main.getByTestId('help-sections').locator('[data-section]')).toHaveCount(1);
    await main.locator('[data-article="integrations"]').click();
    const article = authed.getByTestId('help-article');
    await expect(article).toContainText('API-ключи и вебхуки');
    await article.getByRole('link', { name: 'Открыть экран' }).click();
    await expect(authed).toHaveURL(/\/dashboard\/settings\/integrations/);

    await authed.goto('/dashboard/help?q=xyzzy');
    await expect(main.getByText('По запросу «xyzzy» ничего не найдено')).toBeVisible();
  });
});
