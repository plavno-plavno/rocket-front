import { expect, test } from '@e2e/support/fixtures';

test.describe('questions inbox (S-QA-01)', () => {
  test('answers a question and filters', async ({ authed }) => {
    await authed.goto('/dashboard/questions?hasAnswer=false');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('question-detail')).toBeVisible();
    await main.getByLabel('Напишите ответ…').fill('Да, есть в наличии.');
    await main.getByTestId('publish-answer').click();
    await expect(main.locator('[data-testid=answer][data-state=published]')).toBeVisible({
      timeout: 15_000
    });
    // 1440px: the filter panel is a Sheet (pinned only from 1536px).
    await main.getByRole('button', { name: 'Фильтры' }).click();
    await authed
      .getByTestId('questions-filters')
      .getByRole('button', { name: 'С ответом' })
      .click();
    await expect(authed).toHaveURL(/hasAnswer=true/);
  });
});
