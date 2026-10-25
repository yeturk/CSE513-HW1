import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('scheduling-lab-tour-v1', 'seen'));
  await page.goto('/');
});

test('metrics sort by every column, restore input order and preserve the schedule', async ({ page }) => {
  await page.getByRole('button', { name: 'RR', exact: true }).click();
  const ids = () => page.locator('.metrics-panel tbody tr').evaluateAll(rows => rows.map(r => r.getAttribute('data-process-id')));
  expect(await ids()).toEqual(['P1', 'P2', 'P3', 'P4']);
  const chart = await page.locator('.timeline-segment').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')));
  const averages = await page.locator('.metrics-panel tfoot').innerText();
  for (const [column, order] of Object.entries({
    Process: ['P4', 'P3', 'P2', 'P1'], Arrival: ['P4', 'P3', 'P2', 'P1'], Burst: ['P1', 'P2', 'P3', 'P4'],
    'First start': ['P4', 'P3', 'P2', 'P1'], Completion: ['P1', 'P2', 'P4', 'P3'],
    Turnaround: ['P1', 'P2', 'P4', 'P3'], Waiting: ['P1', 'P2', 'P4', 'P3'], Response: ['P4', 'P3', 'P2', 'P1'],
  })) {
    await page.getByRole('button', { name: `Sort by ${column} descending`, exact: true }).click();
    expect(await ids()).toEqual(order);
    await expect(page.locator('.metrics-panel th[aria-sort="descending"]')).toHaveCount(1);
  }
  await page.getByRole('button', { name: 'Sort by Waiting descending', exact: true }).click();
  await page.getByRole('button', { name: 'Sort by Waiting ascending', exact: true }).click();
  expect(await ids()).toEqual(['P3', 'P4', 'P2', 'P1']);
  await page.getByRole('button', { name: 'Highlight P4', exact: true }).click();
  await expect(page.locator('.metrics-panel tr.highlighted-process')).toHaveAttribute('data-process-id', 'P4');
  expect(await page.locator('.timeline-segment').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')))).toEqual(chart);
  expect(await page.locator('.metrics-panel tfoot').innerText()).toBe(averages);
  await page.getByRole('button', { name: 'Restore input order' }).click();
  expect(await ids()).toEqual(['P1', 'P2', 'P3', 'P4']);
  await page.getByRole('button', { name: 'FCFS', exact: true }).click();
  await page.getByRole('button', { name: 'Sort by Waiting descending', exact: true }).click();
  expect(await ids()).toEqual(['P3', 'P4', 'P2', 'P1']); // Stable ties preserve input order.
});

test('switch count updates with the workload and explains its zero-cost convention', async ({ page }) => {
  const value = page.locator('.context-switch-summary strong');
  await expect(value).toHaveText('3switches');
  await page.getByRole('button', { name: 'RR', exact: true }).click();
  await expect(value).toHaveText('6switches');
  await page.getByRole('button', { name: 'Load workload B', exact: true }).click();
  await expect(value).toHaveText('3switches');
  await page.getByRole('button', { name: 'Explain context switches' }).focus();
  await expect(page.getByRole('tooltip')).toContainText('transitions to/from idle');
  await expect(page.getByRole('tooltip')).toContainText('0 time units');
});

test('disabled controls retain a name, disabled semantics and keyboard tooltip access', async ({ page }) => {
  const zoom = page.getByRole('button', { name: 'Zoom out', exact: true });
  await expect(zoom).toHaveCount(1);
  await expect(zoom).toBeDisabled();
  await zoom.focus();
  await expect(page.getByRole('tooltip')).toContainText('Already showing the full timeline');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Timeline scale', { exact: true })).toHaveText('100%');
  await expect(page.getByRole('button', { name: 'Previous decision', exact: true })).toBeDisabled();
});
