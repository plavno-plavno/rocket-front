import { expect, openMenu, test } from '@e2e/support/fixtures';

test.describe('locations list (S-LOC-01)', () => {
  test('renders KPIs, tabs and 25 rows, paginates and searches', async ({ authed }) => {
    await authed.goto('/dashboard/locations');
    await expect(authed.getByRole('heading', { name: /Мои компании/ })).toBeVisible();
    await expect(authed.getByRole('tab', { name: 'Навигаторы' })).toBeVisible();
    await expect(authed.getByText('Синхронизированы', { exact: true }).first()).toBeVisible();
    await expect(authed.getByRole('row')).toHaveCount(26); // header + 25
    await expect(authed.locator('#main-content').getByText(/Всего строк: 10[0-9]/)).toBeVisible();

    await authed.getByRole('button', { name: 'Следующая страница' }).click();
    await expect(authed).toHaveURL(/page=2/);
    await expect(authed.locator('#main-content').getByText('Страница 2 из 5')).toBeVisible();

    await authed.getByPlaceholder('Поиск по названию, адресу, коду').fill('Сочи');
    await expect(authed).toHaveURL(/name=/);
    await expect(authed.locator('#main-content').getByText(/Всего строк: [1-3]$/)).toBeVisible();
  });

  test('KPI card toggles the sync-status filter', async ({ authed }) => {
    await authed.goto('/dashboard/locations');
    await authed.getByRole('button', { name: /Требуется действие/ }).click();
    await expect(authed).toHaveURL(/syncStatus=action_required/);
    await expect(authed.locator('#main-content').getByText(/Всего строк: [0-9]+/)).toBeVisible();
    await authed.getByRole('button', { name: /Требуется действие/ }).click();
    await expect(authed).not.toHaveURL(/syncStatus=/);
  });

  test('navigator tab changes the KPI totals', async ({ authed }) => {
    await authed.goto('/dashboard/locations');
    const ofTotal = authed.getByText(/из \d+ карточек/).first();
    await expect(ofTotal).toBeVisible();
    const before = await ofTotal.textContent();
    await authed.getByRole('tab', { name: 'Навигаторы' }).click();
    await expect(authed).toHaveURL(/tab=navigators/);
    await expect(ofTotal).not.toHaveText(before ?? '');
    // navigators = 2 platforms per location → far fewer listings than all platforms
    await expect(ofTotal).toHaveText(/из [12]\d\d карточек/);
  });

  test('row actions: delete asks for confirmation', async ({ authed }) => {
    await authed.goto('/dashboard/locations');
    await openMenu(authed, authed.getByRole('button', { name: 'Открыть меню' }).first());
    await authed.getByRole('menuitem', { name: 'Удалить' }).click();
    await expect(authed.getByRole('dialog')).toContainText('Вы уверены?');
    await authed.getByRole('button', { name: 'Отмена' }).click();
    await expect(authed.getByRole('dialog')).toHaveCount(0);
  });
});
