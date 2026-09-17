import { test as setup } from '@playwright/test';

/**
 * Resets the dataset once per run so tests start from `seed_default`: the mock's `/__mock/reset`, or
 * `/__dev/reset` of a real core-api when `E2E_API_URL` points at one (≈10 s: truncate + seed).
 */
setup('reset seed data', async ({ request }) => {
  setup.setTimeout(180_000); // a real core-api rebuilds core + sync-engine + simulator: ~10 s locally, ~30 s on a small droplet
  const api = process.env.E2E_API_URL?.replace(/\/+$/, '');
  if (api) {
    const res = await request.post(`${api}/__dev/reset`, { timeout: 120_000 });
    if (!res.ok()) throw new Error(`core-api reset failed: ${res.status()} ${await res.text()}`);
    return;
  }
  const mock = process.env.MOCK_URL ?? `http://localhost:${process.env.MOCK_PORT ?? 4100}`;
  await request.post(`${mock}/__mock/reset`);
});
