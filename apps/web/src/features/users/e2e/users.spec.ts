import { expect, test } from '@e2e/support/fixtures';

test.describe('users (S-SET-01)', () => {
  test('invites colleagues with a role and access rule', async ({ authed }) => {
    await authed.goto('/dashboard/settings/users');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('users-table')).toBeVisible();
    await expect(main.getByRole('row').filter({ hasText: 'owner@example.ru' })).toContainText('Вы');

    await main.getByTestId('users-invite').click();
    const sheet = authed.getByTestId('user-sheet');
    await sheet.getByTestId('user-sheet-submit').click();
    await expect(sheet.getByText('Введите хотя бы один email')).toBeVisible();

    const emails = sheet.getByTestId('invite-emails').getByRole('textbox');
    await emails.fill('e2e-one@example.ru, bad-email');
    await emails.press('Enter');
    await sheet.getByTestId('user-sheet-submit').click();
    await expect(sheet.getByText('Некорректный email')).toBeVisible();
    await sheet.getByRole('button', { name: 'Убрать bad-email' }).click();

    await sheet.getByRole('radio', { name: /Выбранные компании/ }).click();
    await sheet.getByTestId('user-sheet-submit').click();
    await expect(sheet.getByText('Выберите хотя бы одну компанию или группу')).toBeVisible();
    await sheet.getByRole('radio', { name: /Все компании/ }).click();

    await sheet.getByTestId('user-sheet-submit').click();
    await expect(authed.getByText('Приглашение отправлено')).toBeVisible();
    await expect(main.getByTestId('invitations')).toContainText('e2e-one@example.ru');
  });

  test('changes a member role from the row menu', async ({ authed }) => {
    await authed.goto('/dashboard/settings/users');
    const main = authed.locator('#main-content');
    const row = main.getByRole('row').filter({ hasText: 'observer@example.ru' });
    await row.getByRole('button', { name: /Открыть меню/ }).click();
    await authed.getByRole('menuitem', { name: 'Изменить роль и доступ' }).click();
    const sheet = authed.getByTestId('user-sheet');
    await sheet.getByTestId('user-role').click();
    await authed.getByRole('option', { name: /Репутационный менеджер/ }).click();
    await sheet.getByTestId('user-sheet-submit').click();
    await expect(authed.getByText('Доступ обновлён')).toBeVisible();
    await expect(row).toContainText('Репутационный менеджер');
  });

  test.describe('observer', () => {
    test.use({ user: 'observer' });
    test('has no access to the users screen', async ({ authed }) => {
      await authed.goto('/dashboard/settings/users');
      await expect(authed.locator('#main-content')).toContainText('нет доступа');
    });
  });
});
