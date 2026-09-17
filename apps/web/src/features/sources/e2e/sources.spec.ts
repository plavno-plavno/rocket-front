import { expect, test } from '@e2e/support/fixtures';

test.describe('sources (S-SRC-01)', () => {
  test('platform cards, kind tabs, account check', async ({ authed }) => {
    await authed.goto('/dashboard/sources');
    const main = authed.locator('#main-content');
    await expect(main.getByRole('heading', { name: 'Источники' })).toBeVisible();
    await expect(main.getByTestId('platform-card')).toHaveCount(12);
    await expect(main.getByTestId('accounts-table').getByRole('row')).toHaveCount(12); // header + 11
    await expect(main.getByTestId('coverage-table')).toBeVisible();

    await main.getByRole('tab', { name: 'Навигаторы' }).click();
    await expect(authed).toHaveURL(/kind=navigator/);
    await expect(main.getByTestId('platform-card')).toHaveCount(2);

    await main
      .getByTestId('accounts-table')
      .getByRole('button', { name: 'Проверить' })
      .first()
      .click();
    await expect(authed.getByText('Аккаунт проверен')).toBeVisible();
  });

  test.describe('as observer', () => {
    test.use({ user: 'observer' });
    test('sees no account actions', async ({ authed }) => {
      await authed.goto('/dashboard/sources');
      await expect(authed.locator('#main-content').getByTestId('accounts-table')).toBeVisible();
      await expect(authed.getByRole('button', { name: 'Проверить' })).toHaveCount(0);
    });
  });
});
