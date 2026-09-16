import { test as setup } from '@playwright/test';

/** Resets the mock dataset once per run so tests start from `seed_default`. */
setup('reset mock data', async ({ request }) => {
  const mock = process.env.MOCK_URL ?? `http://localhost:${process.env.MOCK_PORT ?? 4100}`;
  await request.post(`${mock}/__mock/reset`);
});
