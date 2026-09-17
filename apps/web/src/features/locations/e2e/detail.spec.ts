import { expect, test } from '@e2e/support/fixtures';

test.describe('location card (S-LOC-03)', () => {
  test('opens from the list, shows tabs and saves via preview', async ({ authed }) => {
    // Sochi rows are untouched by the other specs (bulk edits the first rows, import codes 100–107).
    await authed.goto('/dashboard/locations?name=Сочи');
    await authed
      .getByRole('link', { name: /Спортэксперт/ })
      .first()
      .click();
    await expect(authed).toHaveURL(/\/dashboard\/locations\/loc_/);
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('location-form')).toBeVisible();
    for (const tab of ['Площадки', 'История', 'Отзывы']) {
      await main.getByRole('tab', { name: tab }).click();
    }
    await expect(authed).toHaveURL(/tab=reviews/);
    await main.getByRole('tab', { name: 'Данные' }).click();

    const name = main.getByRole('textbox', { name: 'Название *' });
    await name.fill((await name.inputValue()) + ' · тест');
    await main.getByRole('button', { name: 'Сохранить' }).click();
    const dialog = authed.getByRole('dialog');
    await expect(dialog).toContainText('Что уйдёт на площадки');
    await dialog.getByRole('button', { name: 'Отправить и сохранить' }).click();
    await expect(main.getByRole('heading', { level: 2 }).first()).toContainText('· тест');
  });

  test('listings tab lists platforms with sync status', async ({ authed }) => {
    // Sochi rows are untouched by the other specs (bulk edits the first rows, import codes 100–107).
    await authed.goto('/dashboard/locations?name=Сочи');
    await authed
      .getByRole('link', { name: /Спортэксперт/ })
      .first()
      .click();
    await authed.locator('#main-content').getByRole('tab', { name: 'Площадки' }).click();
    const rows = authed.locator('#main-content').getByRole('row');
    await expect(rows.nth(1)).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(5);
  });
});
