import { expect, test } from '@e2e/support/fixtures';

test.describe('notifications (S-NOT-01)', () => {
  test('lists notifications, filters unread and marks all as read', async ({ authed }) => {
    await authed.goto('/dashboard/notifications');
    const main = authed.locator('#main-content');
    const list = main.getByTestId('notifications-list');
    await expect(list).toBeVisible();
    await expect(list.locator('[data-read="false"]').first()).toBeVisible();

    await main.getByRole('tab', { name: 'Непрочитанные' }).click();
    await expect(main.getByTestId('notifications-list').locator('[data-read="true"]')).toHaveCount(
      0
    );

    await main.getByTestId('notifications-mark-all').click();
    await expect(main.getByText('Непрочитанных уведомлений нет')).toBeVisible();
    await expect(main.getByTestId('notifications-mark-all')).toBeDisabled();
  });

  test('bell opens the popover and links to the page', async ({ authed }) => {
    await authed.goto('/dashboard/overview');
    await authed.getByRole('button', { name: /Уведомления, непрочитанных/ }).click();
    await authed.getByRole('link', { name: 'Все уведомления' }).click();
    await expect(authed).toHaveURL(/\/dashboard\/notifications$/);
  });
});
