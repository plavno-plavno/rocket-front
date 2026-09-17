import { expect, test } from '@e2e/support/fixtures';

test.describe('interface language', () => {
  // A user no other spec touches: the profile locale is mirrored into the session cookie, so
  // switching the shared owner would flip parallel specs into Belarusian.
  test.use({ user: 'manager2' });
  test('Belarusian is offered in the profile and applies to the whole UI', async ({ authed }) => {
    await authed.goto('/dashboard/settings/profile');
    const profile = authed.locator('#main-content').getByTestId('profile-card');
    await profile.getByRole('combobox', { name: /Язык интерфейса/ }).click();
    await authed.getByRole('option', { name: 'Беларуская' }).click();
    await profile.getByRole('button', { name: 'Сохранить' }).click();
    await expect(
      authed.locator('#main-content').getByRole('heading', { name: 'Профіль' })
    ).toBeVisible();
    await expect(authed.getByRole('link', { name: 'Мае кампаніі' })).toBeVisible();

    // Chromium has no Belarusian ICU data — the FormatJS polyfill must format numbers / dates like the server.
    await authed.goto('/dashboard/presence');
    await expect(authed.locator('#main-content').getByText('Паказы').first()).toBeVisible();
    await expect
      .poll(() =>
        authed.evaluate(() => ({
          num: new Intl.NumberFormat('be').format(239540).replace(/[\u00a0\u202f]/g, ' '),
          date: new Intl.DateTimeFormat('be', { day: 'numeric', month: 'short' }).format(
            new Date('2026-09-17T12:00:00Z')
          )
        }))
      )
      .toEqual({ num: '239 540', date: '17 вер' });
    await expect(authed.locator('#main-content').getByTestId('period-picker')).not.toContainText(
      /Sep|Aug/
    );

    await authed.goto('/dashboard/reviews');
    await expect(
      authed.locator('#main-content').getByRole('heading', { name: 'Апрацоўка водгукаў' })
    ).toBeVisible();
    // Mock data stays Russian — only the interface is translated.
    await expect(authed.locator('#main-content').getByText('Спортэксперт').first()).toBeVisible();

    // Back to Russian so the shared mock user does not leak the locale into other specs.
    await authed.goto('/dashboard/settings/profile');
    const be = authed.locator('#main-content').getByTestId('profile-card');
    await be.getByRole('combobox', { name: /Мова інтэрфейсу/ }).click();
    await authed.getByRole('option', { name: 'Русский' }).click();
    await be.getByRole('button', { name: 'Захаваць' }).click();
    await expect(
      authed.locator('#main-content').getByRole('heading', { name: 'Профиль' })
    ).toBeVisible();
  });
});
