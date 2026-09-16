import { expect, test } from './support/fixtures';

/** Design-system showcase smoke (UI-DS): every section renders, interactive primitives respond. */
test('components showcase renders all sections and reacts', async ({ authed }) => {
  await authed.goto('/dashboard/dev/components');
  const main = authed.locator('#main-content');
  for (const id of [
    'tokens',
    'statuses',
    'rating',
    'stat-cards',
    'distribution',
    'period',
    'diff',
    'template-editor',
    'sortable',
    'virtual-table',
    'kwic',
    'choropleth',
    'heatmap',
    'primitives'
  ]) {
    await expect(main.locator(`[data-section="${id}"]`), id).toBeVisible();
  }
  // virtualised table renders a window, not 1 000 rows
  const rows = main.locator('[data-virtualized] tbody tr[data-index]');
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeLessThan(120);
  // choropleth: 85 regions, click selects
  const svg = main.locator('[data-choropleth="svg"]');
  await expect(svg.locator('path')).toHaveCount(85);
  await svg.locator('path[aria-label^="Краснодарский"]').click({ force: true });
  await expect(svg.locator('path[aria-label^="Краснодарский"]')).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  // template editor autocomplete
  const ta = main.locator('[data-section="template-editor"] textarea');
  await ta.click();
  await ta.press('End');
  await ta.type(' {{man');
  await expect(authed.getByRole('option', { name: '{{manager_name}}' })).toBeVisible();
  await ta.press('Enter');
  await expect(ta).toHaveValue(/\{\{manager_name\}\}$/);
  // period picker calendar opens in Russian
  await main.locator('[data-testid="period-picker"] button[aria-label="Период"]').click();
  await expect(authed.getByRole('grid').first()).toBeVisible();
  await expect(authed.getByText(/^пн$/).first()).toBeVisible();
});
