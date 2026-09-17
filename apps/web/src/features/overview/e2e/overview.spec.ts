import { expect, test } from '@e2e/support/fixtures';

test.describe('overview (S-OVR-01)', () => {
  test('KPI cards, widgets and the period presets', async ({ authed }) => {
    await authed.goto('/dashboard/overview');
    const main = authed.locator('#main-content');
    await expect(main.getByText('Синхронизированы')).toBeVisible();
    await expect(main.getByText('Отзывы без ответа')).toBeVisible();
    await expect(main.getByTestId('widget-recent-reviews')).toBeVisible();
    await expect(main.getByTestId('widget-action-required')).toBeVisible();
    await expect(main.getByTestId('widget-welcome')).toHaveCount(0);

    await main.getByRole('button', { name: 'Неделя' }).click();
    await expect(authed).toHaveURL(/from=/);
    await expect(main.getByText(/по дням/).first()).toBeVisible();

    await main.getByText('Отзывы без ответа').click();
    await expect(authed).toHaveURL(/\/dashboard\/reviews\?has_reply=false/);
  });

  test.describe('empty tenant', () => {
    test.use({ scenario: 'empty_tenant' });
    test('shows the welcome card with first steps', async ({ authed }) => {
      await authed.goto('/dashboard/overview');
      const welcome = authed.locator('#main-content').getByTestId('widget-welcome');
      await expect(welcome).toBeVisible();
      await welcome.getByRole('link', { name: 'Первые шаги' }).click();
      await expect(authed).toHaveURL(/\/dashboard\/onboarding/);
    });
  });
});
