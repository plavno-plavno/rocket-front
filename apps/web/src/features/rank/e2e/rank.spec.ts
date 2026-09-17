import { expect, test } from '@e2e/support/fixtures';

test.describe('rank tracker (S-RNK-01)', () => {
  test('shows the heatmap, switches keyword, runs a measurement, creates a project', async ({
    authed
  }) => {
    await authed.goto('/dashboard/rank');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('rank-project-card')).toContainText('Москва — кроссовки');
    await expect(main.getByTestId('rank-heatmap-card').getByRole('gridcell').first()).toBeVisible();
    await expect(main.getByTestId('rank-competitors').getByRole('row').nth(1)).toBeVisible();

    await main.getByTestId('rank-keyword').click();
    await authed.getByRole('option', { name: 'кроссовки', exact: true }).click();
    await expect(authed).toHaveURL(/keyword=/);

    await main.getByTestId('rank-run').click();
    await expect(authed.getByText('Замер запущен')).toBeVisible();

    await main.getByTestId('rank-project-create').click();
    const dialog = authed.getByTestId('rank-project-dialog');
    await dialog.getByTestId('rank-project-submit').click();
    await expect(dialog.getByRole('alert')).toHaveText('Укажите название');
    await dialog.getByLabel('Название').fill('Казань — лыжи (e2e)');
    await dialog.getByRole('checkbox', { name: /Яндекс Бизнес/ }).click();
    const kw = dialog.getByTestId('rank-keywords').getByRole('textbox');
    await kw.fill('лыжи');
    await kw.press('Enter');
    await dialog.getByTestId('rank-project-submit').click();
    await expect(authed.getByText('Проект создан')).toBeVisible();
    await expect(main.getByTestId('rank-project-card')).toContainText('Казань — лыжи (e2e)');
  });
});
