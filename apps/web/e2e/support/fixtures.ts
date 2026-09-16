import { test as base, expect, type Page } from '@playwright/test';

export type SeedUser = 'owner' | 'admin' | 'manager' | 'manager2' | 'observer';

export const SEED_CREDENTIALS: Record<
  SeedUser,
  { email: string; password: string; totp?: string }
> = {
  owner: { email: 'owner@example.ru', password: 'password' },
  admin: { email: 'admin@example.ru', password: 'password', totp: '000000' },
  manager: { email: 'manager@example.ru', password: 'password' },
  manager2: { email: 'manager2@example.ru', password: 'password' },
  observer: { email: 'observer@example.ru', password: 'password' }
};

export type MockScenario =
  | 'seed_default'
  | 'empty_tenant'
  | 'challenge_required'
  | 'connector_degraded';

/**
 * Logs in through the same-origin API (no UI) and stores the cookie in the context.
 * Use `signInViaUi` in the auth spec itself.
 */
export async function signInAs(
  page: Page,
  user: SeedUser = 'owner',
  scenario: MockScenario = 'seed_default',
  baseURL = 'http://localhost'
) {
  const creds = SEED_CREDENTIALS[user];
  const headers = scenario !== 'seed_default' ? { 'x-mock-scenario': scenario } : undefined;
  if (scenario !== 'seed_default') {
    // Browsers cannot add headers to navigations; the mock also reads the scenario from a cookie.
    await page.context().addCookies([{ name: 'x-mock-scenario', value: scenario, url: baseURL }]);
  }
  const res = await page.request.post('/api/core/auth/sign-in', {
    data: { email: creds.email, password: creds.password },
    headers
  });
  expect(res.ok(), `sign-in ${user}`).toBeTruthy();
  const body = (await res.json()) as { status: string; challenge_token?: string };
  if (body.status === 'two_factor_required') {
    const r2 = await page.request.post('/api/core/auth/2fa', {
      data: { challenge_token: body.challenge_token, code: creds.totp },
      headers
    });
    expect(r2.ok()).toBeTruthy();
  }
}

export const test = base.extend<{ user: SeedUser; scenario: MockScenario; authed: Page }>({
  user: ['owner', { option: true }],
  scenario: ['seed_default', { option: true }],
  authed: async ({ page, baseURL, user, scenario }, provide) => {
    await signInAs(page, user, scenario, baseURL);
    await provide(page);
  }
});

export { expect };

/**
 * Opens a dropdown/popover and waits for its content; retries the click if a background re-render
 * closed it (tables re-render once facet data arrives).
 */
export async function openMenu(
  page: Page,
  trigger: import('@playwright/test').Locator,
  role: 'menu' | 'dialog' | 'listbox' = 'menu'
) {
  await expect(async () => {
    await trigger.click();
    await expect(page.getByRole(role).first()).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 10_000 });
}
