import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('scheduling-lab-tour-v1', 'seen'); } catch { /* storage failure tests */ } });
});

test('process highlighting links every RR slice and metrics without changing results', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'RR', exact: true }).click();
  await page.getByRole('button', { name: 'P1: 6–8', exact: true }).click();
  await expect(page.locator('.timeline-segment.highlighted-process')).toHaveCount(4);
  await expect(page.locator('.metrics-panel tr.highlighted-process')).toHaveAttribute('data-process-id', 'P1');
  await expect(page.locator('.decision-time')).toContainText('t = 6');
  await page.getByRole('button', { name: 'Highlight P2', exact: true }).click();
  await expect(page.locator('.timeline-segment.highlighted-process')).toHaveCount(2);
  await expect(page.locator('.metrics-panel tr.highlighted-process')).toHaveAttribute('data-process-id', 'P2');
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Highlight P2', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.averages-strip')).toContainText('8.5');
  await page.screenshot({ path: 'test-results/highlight-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Clear highlight' }).click();
  await expect(page.locator('.highlighted-process')).toHaveCount(0);
  await page.getByRole('group', { name: 'Highlight a process', exact: true }).getByRole('button', { name: 'P3', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Highlight P3', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Load workload B' }).click();
  await expect(page.locator('.highlighted-process')).toHaveCount(0);
});

test('Fit and zoom preserve proportional slices and prevent mobile page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'RR', exact: true }).click();
  await page.getByRole('button', { name: 'q = 1', exact: true }).click();
  const chart = page.locator('.timeline-scroll');
  await expect.poll(() => chart.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  const before = await page.locator('.timeline-segment').first().boundingBox();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.getByLabel('Timeline scale', { exact: true })).toHaveText('200%');
  await expect.poll(async () => (await page.locator('.timeline-segment').first().boundingBox())!.width / before!.width).toBeCloseTo(2, 1);
  await expect.poll(() => chart.evaluate(el => el.scrollWidth - el.clientWidth)).toBeGreaterThan(100);
  await page.getByLabel('Decision step', { exact: true }).fill('14');
  await expect.poll(() => chart.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  await expect.poll(async () => {
    const viewport = await chart.boundingBox();
    const cursor = await page.locator('.time-cursor').boundingBox();
    return cursor!.x >= viewport!.x && cursor!.x < viewport!.x + viewport!.width;
  }).toBe(true);
  await page.screenshot({ path: 'test-results/zoom-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button', { name: 'Fit', exact: true }).click();
  await expect(page.getByLabel('Timeline scale', { exact: true })).toHaveText('100%');
  await expect.poll(() => chart.evaluate(el => el.scrollLeft)).toBe(0);
  await expect(page.getByRole('button', { name: 'Zoom out', exact: true })).toBeDisabled();
  const labels = await page.locator('.timeline-ruler span').evaluateAll(nodes => nodes.filter(n => n.textContent).map(n => {
    const r = n.getBoundingClientRect(); return { left: r.left, right: r.right };
  }));
  for (let i = 1; i < labels.length; i++) expect(labels[i].left).toBeGreaterThan(labels[i - 1].right);
});

test('quantum presets recalculate RR and comparison while preserving the chosen algorithm', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Compare algorithms' }).click();
  await page.getByRole('button', { name: 'q = 4', exact: true }).click();
  await expect(page.locator('.algorithm-tag')).toHaveText('FCFS');
  await expect(page.locator('.comparison-table')).toContainText('q = 4');
  await page.getByRole('button', { name: 'RR', exact: true }).click();
  await expect(page.locator('.averages-strip')).toContainText('9.25');
  await page.getByRole('button', { name: 'q = 2', exact: true }).click();
  await expect(page.locator('.averages-strip')).toContainText('8.5');
  await expect(page.getByRole('button', { name: 'q = 2', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'q = 1', exact: true }).click();
  await expect(page.locator('.timeline-segment')).toHaveCount(15);
  await expect(page.locator('.comparison-table')).toContainText('q = 1');
});

test('algorithm and workload selections update results immediately', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.averages-strip')).toContainText('10.5');
  await page.getByRole('button', { name: 'SJF', exact: true }).click();
  await expect(page.locator('.algorithm-tag')).toHaveText('SJF');
  await expect(page.locator('.averages-strip')).toContainText('5.25');
  await page.getByRole('button', { name: 'SRTF', exact: true }).click();
  await expect(page.locator('.averages-strip')).toContainText('6.25');
  await page.getByRole('button', { name: 'RR', exact: true }).click();
  await expect(page.locator('.averages-strip')).toContainText('8.5');
  await page.getByRole('button', { name: 'Load workload B' }).click();
  await expect(page.getByRole('button', { name: 'Idle: 0–2', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Idle: 6–8', exact: true })).toBeVisible();
  await expect(page.locator('.averages-strip')).toContainText('2.75');
  await expect(page.locator('.averages-strip')).toContainText('0.75');
  await page.getByRole('button', { name: 'P1: 5–6', exact: true }).click();
  await expect(page.locator('.decision-time')).toContainText('t = 5');
  await page.getByRole('button', { name: 'Next decision' }).click();
  await expect(page.locator('.decision-explanation')).toContainText('No process is ready');
  await page.getByRole('button', { name: 'Compare algorithms' }).click();
  await expect(page.locator('.comparison-table tbody tr')).toHaveCount(4);
  await expect(page.locator('.comparison-table')).toContainText('2.25');
  expect(errors).toEqual([]);
});

test('invalid inputs clear results and recover without a run button', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('spinbutton', { name: 'Process 1 burst', exact: true }).fill('0');
  await expect(page.getByRole('alert')).toContainText('Burst must be');
  await expect(page.locator('.averages-strip')).toHaveCount(0);
  await expect(page.locator('.timeline-panel')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Export results' })).toBeDisabled();
  await expect(page.getByRole('heading', { name: 'Ready when your inputs are' })).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Process 1 burst', exact: true }).fill('8');
  await expect(page.locator('.averages-strip')).toContainText('10.5');
  await page.getByRole('textbox', { name: 'Process 2 ID', exact: true }).fill('P1');
  await expect(page.getByRole('alert')).toContainText('Duplicate');
  await expect(page.locator('.metrics-panel')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Process 2 ID', exact: true }).fill('P2');
  await page.getByRole('spinbutton', { name: 'Process 1 arrival', exact: true }).fill('');
  await expect(page.getByRole('alert')).toContainText('Arrival');
});

test('process changes and RR quantum update the chart, comparison and export together', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add process' }).click();
  await expect(page.getByRole('textbox', { name: 'Process 5 ID', exact: true })).toHaveValue('P5');
  await expect(page.locator('.results-table').first().locator('tbody tr')).toHaveCount(5);
  await page.getByRole('button', { name: 'Remove process 5', exact: true }).click();
  await page.getByRole('button', { name: 'RR', exact: true }).click();
  await expect(page.getByRole('button', { name: 'P1: 11–13', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'P1: 13–15', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Compare algorithms' }).click();
  await page.getByLabel('RR time quantum', { exact: false }).fill('4');
  await expect(page.locator('.algorithm-tag')).toHaveText('RR / q = 4');
  await expect(page.locator('.comparison-table')).toContainText('q = 4');
  await expect(page.locator('.averages-strip')).toContainText('9.25');
  await expect(page.locator('.comparison-table')).toContainText('9.25');
  await page.getByRole('button', { name: 'Load workload B' }).click();
  await expect(page.locator('.comparison-table')).toContainText('2.25');
  await expect(page.locator('.decision-time')).toContainText('t = 0');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export results' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let json = '';
  for await (const chunk of stream!) json += chunk.toString();
  const payload = JSON.parse(json);
  expect(payload.workload).toBe('Workload B');
  expect(payload.result.quantum).toBe(4);
  expect(payload.result.processes[0].arrival).toBe(2);
  expect(payload.comparison).toHaveLength(4);
  await page.getByLabel('RR time quantum', { exact: false }).fill('0');
  await expect(page.getByRole('alert')).toContainText('Quantum');
  await expect(page.locator('.comparison-table')).toHaveCount(0);
});

test('empty workload gives a clear empty state', async ({ page }) => {
  await page.goto('/');
  for (let i = 4; i > 0; i--) await page.getByRole('button', { name: `Remove process ${i}`, exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Add at least one process');
  await expect(page.locator('.timeline-panel')).toHaveCount(0);
  await page.getByRole('button', { name: 'Load workload A' }).click();
  await expect(page.locator('.averages-strip')).toContainText('10.5');
});

test('invalid RR quantum does not hide valid FCFS results but clears comparison', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Compare algorithms' }).click();
  await page.getByLabel('RR time quantum', { exact: false }).fill('0');
  await expect(page.locator('.averages-strip')).toContainText('10.5');
  await expect(page.locator('.comparison-table')).toHaveCount(0);
  await expect(page.getByRole('alert')).toContainText('Quantum');
  await page.getByLabel('RR time quantum', { exact: false }).fill('2');
  await expect(page.locator('.comparison-table tbody tr')).toHaveCount(4);
});

test('theme follows initial system preference and remembers explicit choice', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Next decision' }).click();
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.decision-time')).toContainText('t = 8');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Light', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('theme still works when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage unavailable'); };
    Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.averages-strip')).toContainText('10.5');
});

for (const theme of ['Light', 'Dark']) {
  test(`mobile ${theme} layout has no page-wide overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: theme, exact: true }).click();
    const widths = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(widths.content).toBeLessThanOrEqual(widths.viewport);
    await page.screenshot({ path: `test-results/mobile-${theme.toLowerCase()}.png`, fullPage: true });
  });
  test(`desktop ${theme} visual review`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: theme, exact: true }).click();
    await page.getByRole('button', { name: 'SRTF', exact: true }).click();
    await page.getByRole('button', { name: 'Next decision' }).click();
    await page.getByRole('button', { name: 'Compare algorithms' }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `test-results/desktop-${theme.toLowerCase()}.png`, fullPage: true });
  });
}
