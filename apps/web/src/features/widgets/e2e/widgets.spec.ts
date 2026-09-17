import { expect, test } from '@e2e/support/fixtures';

test.describe('widgets (S-WID-01)', () => {
  test('reviews widget: settings, snippet copy, key rotation, create', async ({ authed }) => {
    await authed.goto('/dashboard/widgets/reviews');
    const main = authed.locator('#main-content');
    const cfg = main.getByTestId('widget-configurator-reviews');
    await expect(cfg.getByTestId('widget-snippet')).toContainText('wk_live_');
    await expect(cfg.getByTestId('widget-preview')).toContainText('Отзывы клиентов');

    const save = cfg.getByTestId('widget-save');
    await expect(save).toBeDisabled();
    await cfg.getByLabel('Сколько отзывов').fill('20');
    await expect(save).toBeEnabled();
    await save.click();
    await expect(authed.getByText('Виджет сохранён')).toBeVisible();

    const before = await cfg.getByTestId('widget-snippet').textContent();
    await cfg.getByTestId('widget-rotate').click();
    await authed.getByRole('dialog').getByRole('button', { name: 'Перевыпустить ключ' }).click();
    await expect(authed.getByText('Ключ перевыпущен')).toBeVisible();
    await expect(cfg.getByTestId('widget-snippet')).not.toHaveText(before ?? '');

    await cfg.getByTestId('widget-create').click();
    await cfg.getByLabel('Название').fill('Лендинг (e2e)');
    const domains = cfg.getByTestId('widget-domains').getByRole('textbox');
    await domains.fill('landing.example.ru');
    await domains.press('Enter');
    await cfg.getByTestId('widget-save').click();
    await expect(authed.getByText('Виджет создан')).toBeVisible();
    await expect(cfg.getByTestId('widget-select')).toContainText('Лендинг (e2e)');
  });

  test('store locator shows the locator preview', async ({ authed }) => {
    await authed.goto('/dashboard/store-locator');
    const cfg = authed.locator('#main-content').getByTestId('widget-configurator-store_locator');
    await expect(cfg.getByTestId('widget-preview')).toContainText('Карта с точками магазинов');
    await expect(cfg.getByLabel('Город по умолчанию')).toHaveValue('Москва');
  });
});
