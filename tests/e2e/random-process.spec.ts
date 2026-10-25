import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('scheduling-lab-tour-v1', 'seen'); Math.random = () => 0.999999; });
  await page.goto('/');
});

test('adds one random row, updates bounds and results, and remains manually editable', async ({ page }) => {
  const add = page.getByRole('button', { name: 'Add Random Process', exact: true });
  await add.focus();
  await expect(page.getByRole('tooltip')).toContainText('arrival 0–6, burst 1–16');
  await add.click();
  await expect(page.locator('.input-table tbody tr')).toHaveCount(5);
  await expect(page.getByLabel('Process 5 arrival', { exact: true })).toHaveValue('6');
  await expect(page.getByLabel('Process 5 burst', { exact: true })).toHaveValue('16');
  await expect(page.locator('.metrics-panel tbody tr')).toHaveCount(5);
  await add.click();
  await expect(page.locator('.input-table tbody tr')).toHaveCount(6);
  await expect(page.getByLabel('Process 6 arrival', { exact: true })).toHaveValue('9');
  await expect(page.getByLabel('Process 6 burst', { exact: true })).toHaveValue('32');
  await page.getByLabel('Process 6 burst', { exact: true }).fill('3');
  await expect(page.locator('.metrics-panel tbody tr').last().locator('td').nth(1)).toHaveText('3');
  await page.getByRole('button', { name: 'Export results' }).click();
});

test('empty editor recovers and invalid inputs disable random addition', async ({ page }) => {
  for (let i = 4; i >= 1; i--) await page.getByRole('button', { name: `Remove process ${i}`, exact: true }).click();
  await page.getByRole('button', { name: 'Add Random Process', exact: true }).click();
  await expect(page.getByLabel('Process 1 arrival', { exact: true })).toHaveValue('0');
  await expect(page.getByLabel('Process 1 burst', { exact: true })).toHaveValue('2');
  await page.getByLabel('Process 1 burst', { exact: true }).fill('0');
  await expect(page.getByRole('button', { name: 'Add Random Process', exact: true })).toBeDisabled();
  await page.getByLabel('Process 1 burst', { exact: true }).fill('1');
  await expect(page.getByRole('button', { name: 'Add Random Process', exact: true })).toBeEnabled();
});

test('random controls and updated guide fit small screens in both themes', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const theme of ['Light', 'Dark']) {
    await page.getByRole('button', { name: theme, exact: true }).click();
    await expect(page.getByRole('button', { name: 'Add Random Process', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    await page.locator('.add-process-actions').screenshot({ path: `test-results/random-${theme}.png` });
  }
  await page.getByRole('button', { name: 'Getting started', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Add Random Process');
  await expect(page.getByRole('dialog')).toContainText('Random burst: 1');
});
