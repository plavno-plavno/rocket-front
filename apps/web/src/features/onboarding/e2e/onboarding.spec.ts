import { expect, test } from '@e2e/support/fixtures';

test.describe('onboarding (S-ONB-01)', () => {
  test('walks through the three steps and opens the invite sheet', async ({ authed }) => {
    await authed.goto('/dashboard/onboarding');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('onboarding-step-locations')).toContainText('Добавлено');
    await main.getByTestId('onboarding-next').click();
    await expect(authed).toHaveURL(/step=1/);
    await expect(main.getByTestId('onboarding-step-platforms')).toContainText(
      'Google Business Profile'
    );
    await main.getByTestId('onboarding-connect').click();
    await expect(authed.getByTestId('connect-dialog')).toBeVisible();
    await authed.getByTestId('connect-dialog').getByRole('button', { name: 'Отмена' }).click();
    await main.getByTestId('onboarding-next').click();
    await expect(main.getByTestId('onboarding-step-team')).toContainText('В команде');
    await main.getByTestId('onboarding-invite').click();
    await expect(authed.getByTestId('user-sheet')).toBeVisible();
    await authed.getByTestId('user-sheet').getByRole('button', { name: 'Отмена' }).click();
    await main.getByTestId('onboarding-finish').click();
    await expect(authed).toHaveURL(/\/dashboard\/overview/);
  });
});
