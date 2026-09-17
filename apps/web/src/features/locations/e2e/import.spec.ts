import path from 'node:path';
import { expect, test } from '@e2e/support/fixtures';

/**
 * 10 rows: 8 seeded branch codes (hours change → update), one new store (999) and one broken row
 * (998, no city / bad phone). The mock ignores the file and fabricates the same shape; the real
 * core-api parses it, so both produce «создать 1 / обновить 8 / ошибок 1».
 */
const template = path.resolve(__dirname, '../../../../e2e/fixtures/locations-import.csv');

test.describe('locations import wizard (S-LOC-02)', () => {
  test('upload → mapping → preview → apply → report', async ({ authed }) => {
    await authed.goto('/dashboard/locations/import');
    const main = authed.locator('#main-content');
    await expect(main.getByRole('heading', { name: 'Импорт компаний' })).toBeVisible();
    await authed.setInputFiles('input[type=file]', template);
    await main.getByRole('button', { name: 'Далее' }).click();

    await expect(main.getByText(/Файл разобран: строк — 10/)).toBeVisible();
    await expect(main.getByRole('combobox', { name: 'Поле' }).first()).toContainText('Код филиала');
    await main.getByRole('button', { name: 'Далее' }).click();

    await expect(main.getByText('Создать: 1')).toBeVisible();
    await expect(main.getByText('Ошибок: 1')).toBeVisible();
    await main.getByRole('button', { name: 'Применить' }).click();

    await expect(main.getByText('Импорт завершён')).toBeVisible({ timeout: 20_000 });
    // one broken row is known at once; the platform sync may still be running on the real chain
    await expect(main.getByText(/Готово с ошибками|Синхронизация с площадками/)).toBeVisible();
    await expect(main.getByRole('button', { name: 'Повторить неуспешные' })).toBeVisible();
  });
});
