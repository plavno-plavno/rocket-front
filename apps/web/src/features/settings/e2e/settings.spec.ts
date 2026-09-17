import { expect, test } from '@e2e/support/fixtures';

test.describe('settings (S-SET-02…06)', () => {
  test('profile: saves the name and rejects a wrong current password', async ({ authed }) => {
    await authed.goto('/dashboard/settings/profile');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('settings-nav')).toBeVisible();
    const profile = main.getByTestId('profile-card');
    await profile.getByLabel('Имя *').fill('Ирина Соколова (e2e)');
    await profile.getByRole('button', { name: 'Сохранить' }).click();
    await expect(authed.getByText('Профиль сохранён')).toBeVisible();

    const password = main.getByTestId('password-card');
    await password.getByLabel('Текущий пароль *').fill('wrong');
    await password.getByLabel('Новый пароль *', { exact: true }).fill('password2');
    await password.getByLabel('Повторите новый пароль *').fill('password2');
    await password.getByRole('button', { name: 'Сменить пароль' }).click();
    await expect(password.getByText('Неверный текущий пароль')).toBeVisible();

    await expect(main.getByTestId('tenant-card')).toContainText('Pro');
  });

  test.describe('accounts (isolated empty tenant)', () => {
    test.use({ scenario: 'empty_tenant' });
    test('connects a platform with a partner key and re-checks it', async ({ authed }) => {
      await authed.goto('/dashboard/settings/accounts');
      const main = authed.locator('#main-content');
      await expect(main.getByText('Площадки не подключены')).toBeVisible();
      await main.getByTestId('connect-open').click();
      const dialog = authed.getByTestId('connect-dialog');
      await dialog.getByTestId('connect-submit').click();
      await expect(dialog.getByRole('alert')).toHaveText('Выберите площадку');
      await dialog.getByRole('combobox', { name: 'Площадка' }).click();
      await authed.getByRole('option', { name: /Navitel/ }).click();
      await dialog.getByRole('combobox', { name: 'Способ подключения' }).click();
      await authed.getByRole('option', { name: 'Партнёрский ключ' }).click();
      await dialog.getByLabel('Название аккаунта').fill('Navitel e2e');
      await dialog.getByTestId('connect-submit').click();
      await expect(dialog.getByText('Введите ключ')).toBeVisible();
      await dialog.getByLabel('Ключ', { exact: true }).fill('nvt-secret');
      await dialog.getByTestId('connect-submit').click();
      await expect(authed.getByText('Аккаунт подключён')).toBeVisible();
      const row = main.getByRole('row').filter({ hasText: 'Navitel e2e' });
      await expect(row).toContainText('Работает');
      await row.getByRole('button', { name: 'Проверить' }).click();
      await expect(authed.getByText('Доступ проверен')).toBeVisible();
      await row.getByRole('button', { name: 'Отключить аккаунт' }).click();
      await authed.getByRole('dialog').getByRole('button', { name: 'Удалить' }).first().click();
      await expect(authed.getByText('Аккаунт отключён')).toBeVisible();
    });
  });

  test('notifications: toggles a rule and saves', async ({ authed }) => {
    await authed.goto('/dashboard/settings/notifications');
    const main = authed.locator('#main-content');
    const matrix = main.getByTestId('rules-matrix');
    await expect(matrix).toBeVisible();
    const save = main.getByTestId('notification-settings-save');
    await expect(save).toBeDisabled();
    await matrix.locator('[data-rule="system"]').getByRole('switch').click();
    await matrix.locator('[data-rule="system"]').getByRole('checkbox', { name: /Email/ }).click();
    await expect(save).toBeEnabled();
    await save.click();
    await expect(authed.getByText('Настройки уведомлений сохранены')).toBeVisible();
    await authed.reload();
    await expect(
      main.getByTestId('rules-matrix').locator('[data-rule="system"]').getByRole('switch')
    ).toHaveAttribute('aria-checked', 'true');
  });

  test('integrations: creates an API key (secret once) and a webhook with a test delivery', async ({
    authed
  }) => {
    await authed.goto('/dashboard/settings/integrations');
    const main = authed.locator('#main-content');
    await main.getByTestId('key-create').click();
    const keyDialog = authed.getByTestId('key-dialog');
    await keyDialog.getByLabel('Название').fill('CRM e2e');
    await keyDialog.getByTestId('key-submit').click();
    await expect(keyDialog.getByTestId('key-secret')).toContainText('lp_live_');
    await keyDialog.getByRole('button', { name: 'Готово' }).click();
    await expect(main.getByTestId('api-keys')).toContainText('CRM e2e');

    await main.getByTestId('webhook-create').click();
    const whDialog = authed.getByTestId('webhook-dialog');
    await whDialog.getByLabel('Адрес').fill('http://insecure.example.ru');
    await whDialog.getByTestId('webhook-submit').click();
    await expect(whDialog.getByText('Адрес должен начинаться с https://')).toBeVisible();
    await whDialog.getByLabel('Адрес').fill('https://e2e.example.ru/hook');
    await whDialog.getByRole('checkbox', { name: /Ответ опубликован/ }).click();
    await whDialog.getByTestId('webhook-submit').click();
    await expect(authed.getByText('Вебхук добавлен')).toBeVisible();
    const row = main.getByRole('row').filter({ hasText: 'e2e.example.ru/hook' });
    await row.getByRole('button', { name: 'Тест' }).click();
    await expect(authed.getByText(/Тестовое событие доставлено/)).toBeVisible();
    await row.getByRole('button', { name: 'Журнал доставок' }).click();
    await expect(authed.getByTestId('deliveries-sheet')).toContainText('test');
  });

  test('sources: changes a field policy and saves', async ({ authed }) => {
    await authed.goto('/dashboard/settings/sources');
    const main = authed.locator('#main-content');
    const table = main.getByTestId('policies-table');
    await expect(table).toBeVisible();
    await table.locator('[data-field="website"]').getByRole('combobox').click();
    await authed.getByRole('option', { name: /Спросить/ }).click();
    await main.getByTestId('sources-settings-save').click();
    await expect(authed.getByText('Настройки источников сохранены')).toBeVisible();
    await authed.reload();
    await expect(
      main.getByTestId('policies-table').locator('[data-field="website"]').getByRole('combobox')
    ).toContainText('Спросить');
  });
});
