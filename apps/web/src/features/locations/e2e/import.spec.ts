import path from 'node:path';
import { expect, test } from '@e2e/support/fixtures';

const template = path.resolve(
  __dirname,
  '../../../../public/templates/locations-import-template.csv'
);

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
    await expect(main.getByText('Готово с ошибками')).toBeVisible();
    await expect(main.getByRole('button', { name: 'Повторить неуспешные' })).toBeVisible();
  });
});
