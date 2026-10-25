import { test, expect } from '@playwright/test';

test('workload B, RR boundaries, comparison and decision navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Workload B yükle' }).click();
  await page.getByRole('button', { name: 'RR', exact: true }).click();
  await expect(page.getByText('Girdiler değişti.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Yeniden çalıştır', exact: true }).click();
  await expect(page.getByText('Girdiler değişti.', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Idle: 0–2', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Idle: 6–8', exact: true })).toBeVisible();
  await expect(page.locator('.averages-strip')).toContainText('2,75');
  await expect(page.locator('.averages-strip')).toContainText('0,75');
  await page.getByRole('button', { name: 'P1: 5–6', exact: true }).click();
  await expect(page.locator('.decision-time')).toContainText('t = 5');
  await page.getByRole('button', { name: 'Sonraki karar' }).click();
  await expect(page.locator('.decision-explanation')).toContainText('Hazır process yok');
  await page.getByRole('button', { name: 'Algoritmaları karşılaştır' }).click();
  await expect(page.locator('.comparison-table tbody tr')).toHaveCount(4);
  await expect(page.locator('.comparison-table')).toContainText('2,25');
  expect(errors).toEqual([]);
});

test('invalid and edited inputs do not silently change the last results', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('spinbutton', { name: '1. process burst', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Yeniden çalıştır', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Burst');
  await expect(page.locator('.averages-strip')).toContainText('10,5');
  await page.getByRole('spinbutton', { name: '1. process burst', exact: true }).fill('8');
  await page.getByRole('textbox', { name: '2. process ID', exact: true }).fill('P1');
  await page.getByRole('button', { name: 'Yeniden çalıştır', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('tekrar');
  await page.getByRole('textbox', { name: '2. process ID', exact: true }).fill('P2');
  await page.getByRole('spinbutton', { name: '1. process arrival', exact: true }).fill('');
  await page.getByRole('button', { name: 'Yeniden çalıştır', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Arrival');
});

test('process add/remove and adjacent RR slices remain visible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Process ekle' }).click();
  await expect(page.getByRole('textbox', { name: '5. process ID', exact: true })).toHaveValue('P5');
  await page.getByRole('button', { name: '5. process sil', exact: true }).click();
  await page.getByRole('button', { name: 'RR', exact: true }).click();
  await page.getByRole('button', { name: 'Yeniden çalıştır', exact: true }).click();
  await expect(page.getByRole('button', { name: 'P1: 11–13', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'P1: 13–15', exact: true })).toBeVisible();
  await page.getByLabel('RR time quantum', { exact: false }).fill('0');
  await page.getByRole('button', { name: 'Yeniden çalıştır', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Quantum');
});

test('mobile layout has no page-wide overflow and exports a result snapshot', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Scheduling Lab' })).toBeVisible();
  const widths = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Sonuçları indir' }).click();
  expect((await download).suggestedFilename()).toBe('scheduling-fcfs.json');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});

test('desktop visual review', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'SRTF', exact: true }).click();
  await page.getByRole('button', { name: 'Yeniden çalıştır', exact: true }).click();
  await page.getByRole('button', { name: 'Sonraki karar' }).click();
  await page.getByRole('button', { name: 'Algoritmaları karşılaştır' }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
});
