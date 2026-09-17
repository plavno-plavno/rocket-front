import { expect, test } from '@e2e/support/fixtures';

test.describe('auto-reply rules (S-REV-04)', () => {
  test('creates a rule and toggles it', async ({ authed }) => {
    await authed.goto('/dashboard/reviews/auto-replies');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('rules-table')).toBeVisible();
    await main.getByTestId('rule-add').click();
    const editor = authed.getByTestId('rule-editor');
    await editor.getByLabel('Название').fill('Спасибо за 5★ (e2e)');
    await editor.getByRole('button', { name: '5', exact: true }).click();
    await editor.getByTestId('rule-save').click();
    await expect(editor.getByText('Выберите шаблоны или профиль нейросети')).toBeVisible();
    await editor.getByRole('checkbox', { name: /Спасибо за оценку/ }).click();
    await editor.getByTestId('rule-save').click();
    await expect(authed.getByText('Правило создано')).toBeVisible();
    const row = main.getByRole('row').filter({ hasText: 'Спасибо за 5★ (e2e)' });
    await expect(row).toContainText('Оценки 5');
    await row.getByRole('switch').click();
    await expect(authed.getByText('Правило выключено')).toBeVisible();
  });
});
