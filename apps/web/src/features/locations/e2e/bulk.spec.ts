import { expect, test } from '@e2e/support/fixtures';

test.describe('locations bulk actions (S-LOC-01)', () => {
  test('bulk edit runs a batch and reports progress', async ({ authed }) => {
    await authed.goto('/dashboard/locations');
    const main = authed.locator('#main-content');
    const bar = authed.getByTestId('bulk-bar');
    await main.getByRole('checkbox').nth(1).click();
    await expect(bar).toContainText('Выбрано: 1');
    await main.getByRole('checkbox').nth(2).click();
    await expect(bar).toContainText('Выбрано: 2');

    await bar.getByRole('button', { name: 'Массовое редактирование' }).click();
    const sheet = authed.getByTestId('bulk-edit-sheet');
    await sheet.getByLabel('Сайт').fill('https://example.ru/new');
    await sheet.getByRole('button', { name: 'Применить' }).click();
    const progress = authed.getByTestId('batch-progress');
    await expect(progress).toBeVisible();
    // progress arrives from the platforms (mock: seconds; real chain: moderation takes minutes) — the dialog can be
    // closed at any time, the batch keeps running in the background
    await expect(progress).toContainText(/[1-9]\d* из \d+/, { timeout: 30_000 });
    await expect(progress).toContainText(/Готово|в фоне/);
    await progress.getByRole('button', { name: 'Закрыть' }).click();
    await expect(bar).toBeHidden();
  });

  test('assign to a group and export selected', async ({ authed }) => {
    await authed.goto('/dashboard/locations');
    const main = authed.locator('#main-content');
    const bar = authed.getByTestId('bulk-bar');
    await main.getByRole('checkbox').nth(1).click();
    await bar.getByRole('button', { name: 'Назначить группы' }).click();
    const dialog = authed.getByTestId('assign-groups-dialog');
    await dialog.getByRole('combobox').click();
    await authed.getByRole('option').first().click();
    await dialog.getByRole('button', { name: 'Назначить' }).click();
    await expect(authed.getByText('Группа назначена')).toBeVisible();
    await expect(bar).toBeHidden();

    await main.getByRole('checkbox').nth(1).click();
    await bar.getByRole('button', { name: 'Экспорт выбранных' }).click();
    await expect(authed.getByText('Экспорт готов')).toBeVisible({ timeout: 15_000 });
  });
});
