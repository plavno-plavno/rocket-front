import { expect, test } from '@e2e/support/fixtures';

test.describe('communication (S-COM-01)', () => {
  test('opens a thread, sends a message, closes and reopens it', async ({ authed }) => {
    await authed.goto('/dashboard/communication');
    const main = authed.locator('#main-content');
    const list = main.getByTestId('conversations-list');
    await expect(list.locator('[data-conversation]').first()).toBeVisible();
    await expect(main.getByText('Выберите диалог')).toBeVisible();

    await list.locator('[data-conversation]').first().click();
    await expect(authed).toHaveURL(/conversation=/);
    const detail = main.getByTestId('conversation-detail');
    await expect(detail.getByTestId('conversation-messages').locator('li').first()).toBeVisible();

    await detail.getByTestId('conversation-input').fill('Здравствуйте! Да, есть в наличии (e2e).');
    await detail.getByTestId('conversation-send').click();
    await expect(
      detail.getByTestId('conversation-messages').locator('li[data-direction="outbound"]').last()
    ).toContainText('(e2e)');

    await detail.getByTestId('conversation-close').click();
    await expect(authed.getByText('Диалог закрыт')).toBeVisible();
    await expect(detail.getByTestId('conversation-input')).toHaveCount(0);
    await detail.getByTestId('conversation-reopen').click();
    await expect(authed.getByText('Диалог открыт')).toBeVisible();

    // Filters are pinned only from 1536px; on the desktop project they live in the Sheet.
    await main.getByRole('button', { name: 'Фильтры' }).click();
    await authed.getByRole('dialog').getByRole('radio', { name: 'Закрытые' }).click();
    await expect(authed).toHaveURL(/status=closed/);
  });
});
