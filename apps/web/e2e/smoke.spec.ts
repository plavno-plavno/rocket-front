import { expect, openMenu, test } from './support/fixtures';
import scaffold from '../scripts/scaffold/features.json' with { type: 'json' };

/**
 * Foundation smoke (SDD-01T §3.10): every registered route opens, navigation is filtered by role,
 * auth gate works. Feature behaviour is tested in features/<f>/e2e.
 */
const ROUTES = Object.keys(scaffold.routes)
  .filter((r) => !r.startsWith('$'))
  .map((r) => r.replace('[platformId]', 'plt_google').replace('[id]', 'loc_smoke'));

test.describe('auth gate', () => {
  test('redirects anonymous users to sign-in with next=', async ({ page }) => {
    await page.goto('/dashboard/locations');
    await expect(page).toHaveURL(/\/auth\/sign-in\?next=%2Fdashboard%2Flocations/);
    await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
  });

  test('signs in through the form and lands on the requested page', async ({ page }) => {
    await page.goto('/auth/sign-in?next=%2Fdashboard%2Flocations');
    await page.getByLabel('Email').fill('owner@example.ru');
    await page.getByLabel('Пароль').fill('password');
    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page).toHaveURL(/\/dashboard\/locations/);
    await expect(page.getByRole('heading', { name: /Мои компании/ })).toBeVisible();
  });

  test('shows an error for wrong credentials', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.getByLabel('Email').fill('owner@example.ru');
    await page.getByLabel('Пароль').fill('wrong');
    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page.getByText('Неверный email или пароль')).toBeVisible();
  });

  test('2FA flow for the admin user', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.getByLabel('Email').fill('admin@example.ru');
    await page.getByLabel('Пароль').fill('password');
    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page).toHaveURL(/\/auth\/2fa/);
    await page.locator('input[data-input-otp]').fill('000000');
    await page.getByRole('button', { name: 'Подтвердить' }).click();
    await expect(page).toHaveURL(/\/dashboard\/overview/);
  });
});

test.describe('shell', () => {
  test('every registered route opens without an error boundary', async ({ authed }) => {
    test.setTimeout(120_000);
    for (const route of ROUTES) {
      const res = await authed.goto(route);
      expect(res?.status(), route).toBe(200);
      await expect(authed.locator('#main-content'), route).toBeVisible();
      await expect(
        authed.locator('#main-content').getByText('Произошла ошибка'),
        route
      ).toHaveCount(0);
    }
  });

  test('sidebar shows tenant, user and registry navigation', async ({ authed }) => {
    await authed.goto('/dashboard/overview');
    await expect(authed.getByRole('button', { name: 'Сменить аккаунт' })).toContainText(
      'Спортэксперт'
    );
    await expect(authed.getByRole('button', { name: 'Меню пользователя' })).toContainText(
      'Ирина Соколова'
    );
    await expect(authed.getByRole('link', { name: 'Мои компании' })).toBeVisible();
  });

  test('language switch to English re-renders the shell', async ({ authed }) => {
    await authed.goto('/dashboard/overview');
    await openMenu(authed, authed.getByRole('button', { name: 'Меню пользователя' }));
    await authed.getByRole('menuitem', { name: 'Язык' }).hover();
    const english = authed.getByRole('menuitem', { name: /English/ });
    await expect(english).toBeVisible();
    await english.click({ force: true }); // submenu slide-in animation keeps the item "unstable" for Playwright
    await expect(authed.getByRole('link', { name: 'Locations', exact: true })).toBeVisible();
    await expect(authed.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('scope selector filters the location list', async ({ authed }) => {
    await authed.goto('/dashboard/locations');
    await openMenu(authed, authed.getByTestId('scope-selector'), 'listbox');
    await authed.getByRole('option', { name: /Спортэксперт Outlet/ }).click();
    await authed.keyboard.press('Escape');
    await expect(authed).toHaveURL(/scope=grp_BRAND00000000000000000000B/);
    await expect(authed.locator('#main-content').getByText(/Всего строк: 19/)).toBeVisible();
  });

  test('sign out returns to the sign-in page', async ({ authed }) => {
    await authed.goto('/dashboard/overview');
    await openMenu(authed, authed.getByRole('button', { name: 'Меню пользователя' }));
    await authed.getByRole('menuitem', { name: 'Выйти' }).click();
    await expect(authed).toHaveURL(/\/auth\/sign-in/);
  });
});

test.describe('roles (admin)', () => {
  test.use({ user: 'admin' });

  test('admin sees settings and locations actions', async ({ authed }) => {
    await authed.goto('/dashboard/locations');
    await expect(authed.getByRole('link', { name: 'Добавить компанию' })).toBeVisible();
    await expect(authed.getByRole('button', { name: 'Меню пользователя' })).toContainText(
      'Павел Кузнецов'
    );
  });
});

test.describe('roles', () => {
  test.use({ user: 'observer' });

  test('observer has no add/import actions on locations', async ({ authed }) => {
    await authed.goto('/dashboard/locations');
    await expect(authed.getByRole('heading', { name: /Мои компании/ })).toBeVisible();
    await expect(authed.getByRole('link', { name: 'Добавить компанию' })).toHaveCount(0);
    await expect(authed.getByRole('button', { name: 'Меню пользователя' })).toContainText(
      'Ольга Лебедева'
    );
  });
});

test.describe('scenarios', () => {
  test.use({ scenario: 'empty_tenant' });

  test('empty tenant shows the empty state', async ({ authed }) => {
    await authed.goto('/dashboard/locations');
    // Scoped to main: React streaming keeps late Suspense HTML in a hidden div for a moment.
    await expect(authed.locator('#main-content').getByText('Компаний пока нет')).toBeVisible();
  });
});
