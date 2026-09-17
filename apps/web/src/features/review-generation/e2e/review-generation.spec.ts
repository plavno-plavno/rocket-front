import { expect, test } from '@e2e/support/fixtures';

test.describe('review generation (S-GEN-01)', () => {
  test('campaigns: create with validation, pause, send requests', async ({ authed }) => {
    await authed.goto('/dashboard/review-generation/campaigns');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('campaigns-list').getByRole('row').nth(1)).toBeVisible();

    await main.getByTestId('campaign-create').click();
    const sheet = authed.getByTestId('campaign-sheet');
    await sheet.getByTestId('campaign-submit').click();
    await expect(sheet.getByRole('alert').filter({ hasText: 'Укажите название' })).toBeVisible();
    await sheet.getByLabel('Название *').fill('WhatsApp после визита (e2e)');
    await expect(sheet.getByText('review gating')).toBeVisible();
    await sheet.getByTestId('campaign-submit').click();
    await expect(
      sheet.getByRole('alert').filter({ hasText: 'Выберите хотя бы одну площадку' })
    ).toBeVisible();
    await sheet.getByTestId('campaign-platforms').getByRole('checkbox').first().click();
    await sheet.getByTestId('campaign-submit').click();
    await expect(authed.getByText('Кампания создана')).toBeVisible();
    const row = main.getByRole('row').filter({ hasText: 'WhatsApp после визита (e2e)' });
    await expect(row).toContainText('Активна');

    await row.getByRole('switch').click();
    await expect(authed.getByText('Кампания на паузе')).toBeVisible();

    const smsRow = main.getByRole('row').filter({ hasText: 'SMS после покупки' });
    await smsRow.getByTestId('campaign-send').click();
    const dialog = authed.getByTestId('campaign-send-dialog');
    await dialog.getByRole('combobox', { name: 'Компания' }).click();
    await authed.getByRole('option').first().click();
    await dialog.getByLabel('Получатели').fill('+79991234567\n+79997654321');
    await dialog.getByTestId('campaign-send-submit').click();
    await expect(authed.getByText('Отправлено 2 запроса')).toBeVisible();
  });

  test('QR export downloads a PDF and analytics shows the funnel', async ({ authed }) => {
    await authed.goto('/dashboard/review-generation/qr');
    const main = authed.locator('#main-content');
    await main.getByTestId('qr-layout-sticker').click();
    await expect(main.getByTestId('qr-preview')).toContainText('Наклейка');
    await main.getByTestId('qr-download').click();
    await expect(authed.getByText('PDF готов')).toBeVisible({ timeout: 15_000 });

    await authed.goto('/dashboard/review-generation/analytics');
    await expect(main.getByTestId('funnel-chart')).toBeVisible();
    await main.getByTestId('analytics-campaign').click();
    await authed.getByRole('option', { name: 'SMS после покупки' }).click();
    await expect(authed).toHaveURL(/campaign=/);
    await expect(main.getByTestId('daily-chart')).toBeVisible();
  });
});
