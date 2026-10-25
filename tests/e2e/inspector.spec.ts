import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('scheduling-lab-tour-v1', 'seen'));
});

test('Decision Inspector follows RR queue order, boundaries and idle decisions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'RR', exact: true }).click();
  await page.getByRole('button', { name: 'P1: 6–8', exact: true }).click();
  const inspector = page.getByRole('region', { name: 'Decision Inspector' });
  await expect(inspector).toBeVisible();
  await expect(inspector.locator('.decision-selected')).toHaveText('P1 selected');
  await expect(inspector.locator('.queue-chip')).toHaveText(['P16 selected', 'P41', 'P22']);
  await expect(inspector.locator('.queue-arrow')).toHaveCount(2);
  await expect(inspector.locator('.decision-boundary')).toContainText('At t = 8');
  await expect(inspector.locator('.decision-outcome')).toContainText('4 units left');
  await page.getByRole('button', { name: 'Next decision' }).click();
  await expect(inspector.locator('.decision-selected')).toHaveText('P4 selected');
  await expect(inspector.locator('.queue-chip')).toHaveText(['P41 selected', 'P22', 'P14']);
  await expect(inspector.locator('.decision-outcome')).toContainText('P4 completes');
  await page.getByRole('button', { name: 'Load workload B', exact: true }).click();
  await expect(inspector.locator('.decision-selected')).toHaveText('CPU idle');
  await expect(inspector.locator('.queue-empty')).toHaveText('No ready processes.');
  await expect(inspector.locator('.queue-chip')).toHaveCount(0);
});

test('SRTF candidates are not presented as a FIFO queue', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'SRTF', exact: true }).click();
  await page.getByRole('button', { name: 'P2: 1–2', exact: true }).click();
  const inspector = page.locator('.decision-view');
  await expect(inspector.locator('.queue-label')).toHaveText('Ready candidates · before selection');
  await expect(inspector.locator('.queue-arrow')).toHaveCount(0);
  await expect(inspector.locator('.queue-chip')).toHaveText(['P24 selected', 'P17']);
  await expect(inspector.locator('.decision-explanation')).toContainText('P1 is preempted');
});

test('Inspector stays readable at narrow and desktop widths in both themes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'RR', exact: true }).click();
  await page.getByRole('button', { name: 'P1: 6–8', exact: true }).click();
  for (const width of [320, 390, 1024, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: theme, exact: true }).click();
      const inspector = page.locator('.decision-view');
      expect(await inspector.evaluate(el => el.scrollWidth - el.clientWidth)).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await inspector.screenshot({ path: `output/design-previews/inspector-${width}-${theme.toLowerCase()}.png` });
    }
  }
});
