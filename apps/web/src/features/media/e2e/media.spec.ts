import { expect, test } from '@e2e/support/fixtures';

test.describe('photo manager (S-MED-01)', () => {
  test('library upload and listing photos with a UGC report', async ({ authed }) => {
    await authed.goto('/dashboard/media');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('media-library').locator('li').first()).toBeVisible();

    await main.getByTestId('media-upload-open').click();
    const dialog = authed.getByTestId('media-upload-dialog');
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'store.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      )
    });
    await dialog.getByTestId('media-upload-submit').click();
    await expect(authed.getByText('Фото загружено')).toBeVisible();

    await main.getByRole('tab', { name: 'На площадках' }).click();
    await expect(authed).toHaveURL(/tab=listings/);
    await main.getByTestId('media-filter-origin').click();
    await authed.getByRole('option', { name: 'UGC', exact: true }).click();
    const card = main
      .getByTestId('media-listings')
      .locator('li[data-origin="user_generated"]')
      .first();
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Пожаловаться' }).click();
    await authed.getByTestId('media-flag-dialog').getByLabel('Причина').fill('Фото не наше');
    await authed.getByTestId('media-flag-submit').click();
    await expect(authed.getByText('Жалоба отправлена площадке')).toBeVisible();
  });
});
