import { expect, test } from '@e2e/support/fixtures';

test.describe('AI replies (S-REV-05)', () => {
  test('sandbox streams a reply; composer button streams into the textarea', async ({ authed }) => {
    await authed.goto('/dashboard/reviews/ai');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('ai-profile')).toContainText('Основной профиль');
    await main.getByTestId('sandbox-generate').click();
    await expect(main.getByTestId('sandbox-result')).toContainText('здравствуйте', {
      timeout: 20_000
    });
    await expect(main.getByTestId('sandbox-result')).toContainText('Команда', { timeout: 30_000 });

    await authed.goto('/dashboard/reviews?platform=plt_google&hasReply=false');
    await expect(main.getByTestId('review-detail')).toBeVisible();
    await main.getByTestId('ai-reply-button').click();
    await expect(main.getByTestId('reply-composer').getByRole('textbox')).toHaveValue(/Команда/, {
      timeout: 30_000
    });
  });

  test('profile is saved', async ({ authed }) => {
    await authed.goto('/dashboard/reviews/ai');
    const main = authed.locator('#main-content');
    await main.getByLabel('Подпись').fill('С уважением, команда');
    await main.getByTestId('ai-profile-save').click();
    await expect(authed.getByText('Профиль сохранён')).toBeVisible();
  });
});
