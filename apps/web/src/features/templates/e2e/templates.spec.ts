import { expect, test } from '@e2e/support/fixtures';

test.describe('reply templates (S-REV-02)', () => {
  test('creates a template with a live preview, manages groups, bulk-selects', async ({
    authed
  }) => {
    await authed.goto('/dashboard/reviews/templates');
    const main = authed.locator('#main-content');
    await expect(main.getByText('Спасибо за оценку')).toBeVisible();

    await main.getByTestId('template-add').click();
    const editor = authed.getByTestId('template-editor');
    await editor.getByLabel('Название').fill('Благодарность за 5 звёзд');
    await editor
      .getByRole('textbox', { name: /Текст/ })
      .fill('{{author_name}}, спасибо за отзыв о {{location_name}}!');
    await expect(editor.getByTestId('template-preview')).not.toContainText('{{');
    await editor.getByTestId('template-save').click();
    await expect(authed.getByText('Шаблон создан')).toBeVisible();
    await expect(main.getByText('Благодарность за 5 звёзд')).toBeVisible();

    await main.getByRole('button', { name: 'Настроить группы' }).click();
    const groups = authed.getByTestId('groups-dialog');
    await groups.getByLabel('Название группы').fill('Сезонные');
    await groups.getByRole('button', { name: 'Создать' }).click();
    await expect(authed.getByText('Группа создана')).toBeVisible();
    await authed.keyboard.press('Escape');

    await main.getByRole('checkbox').nth(1).click();
    await main.getByRole('checkbox').nth(2).click();
    await expect(authed.getByTestId('templates-bulk-bar')).toContainText('Выбрано: 2');
  });
});
