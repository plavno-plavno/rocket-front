import { expect, test } from '@e2e/support/fixtures';

test.describe('interface language', () => {
  test('Belarusian is offered in the profile and applies to the whole UI', async ({ authed }) => {
    await authed.goto('/dashboard/settings/profile');
    const profile = authed.locator('#main-content').getByTestId('profile-card');
    await profile.getByRole('combobox', { name: /Язык интерфейса/ }).click();
    await authed.getByRole('option', { name: 'Беларуская' }).click();
    await profile.getByRole('button', { name: 'Сохранить' }).click();
    await expect(authed.locator('#main-content').getByRole('heading', { name: 'Профіль' })).toBeVisible();
    await expect(authed.getByRole('link', { name: 'Мае кампаніі' })).toBeVisible();

    await authed.goto('/dashboard/reviews');
    await expect(authed.locator('#main-content').getByRole('heading', { name: 'Апрацоўка водгукаў' })).toBeVisible();
    // Mock data stays Russian — only the interface is translated.
    await expect(authed.locator('#main-content').getByText('Спортэксперт').first()).toBeVisible();

    // Back to Russian so the shared mock user does not leak the locale into other specs.
    await authed.goto('/dashboard/settings/profile');
    const be = authed.locator('#main-content').getByTestId('profile-card');
    await be.getByRole('combobox', { name: /Мова інтэрфейсу/ }).click();
    await authed.getByRole('option', { name: 'Русский' }).click();
    await be.getByRole('button', { name: 'Захаваць' }).click();
    await expect(authed.locator('#main-content').getByRole('heading', { name: 'Профиль' })).toBeVisible();
  });
});
