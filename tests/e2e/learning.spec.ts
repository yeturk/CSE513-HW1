import { test, expect } from '@playwright/test';

test('first visit guide supports all steps, keyboard dismissal, persistence and reopening', async ({ page }) => {
  await page.goto('/');
  const guide = page.getByRole('dialog');
  await expect(guide).toBeVisible();
  await expect(guide).toContainText('Step 1 of 4');
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(guide).toContainText('Step 2 of 4');
  await expect(guide).toContainText('Open Rules in the header');
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(guide).toContainText('Step 3 of 4');
  await expect(guide).toContainText('CPU rail');
  await expect(guide).toContainText('Process lanes');
  await expect(guide).toContainText('same single-CPU schedule');
  await guide.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(guide).toContainText('Step 2 of 4');
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(guide).toContainText('Step 4 of 4');
  await guide.getByRole('button', { name: 'Start exploring' }).click();
  await expect(guide).toHaveCount(0);
  await page.reload();
  await expect(guide).toHaveCount(0);
  await page.getByRole('button', { name: 'Getting started', exact: true }).click();
  await expect(guide).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(guide).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Getting started', exact: true })).toBeFocused();
});

test('every guide step fits a small mobile screen and can be skipped', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip guide' })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeInViewport();
  for (let step = 1; step <= 4; step++) {
    await expect(page.getByRole('dialog')).toContainText(`Step ${step} of 4`);
    await expect(page.getByRole('button', { name: 'Close guide' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Skip guide' })).toBeInViewport();
    const next = page.getByRole('button', { name: step === 4 ? 'Start exploring' : 'Next', exact: true });
    await expect(next).toBeInViewport();
    if (step < 4) await next.click();
  }
  await page.screenshot({ path: 'test-results/guide-mobile.png' });
  await page.getByRole('button', { name: 'Skip guide' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test.describe('workload library and responsive workspace', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('scheduling-lab-tour-v1', 'seen'));
  });

  test('teaching presets produce their independently expected decisions', async ({ page }) => {
    await page.goto('/');
    const library = page.getByLabel('Workload library', { exact: true });
    await library.selectOption('idle');
    await expect(page.getByRole('button', { name: 'Idle: 0–3', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Idle: 4–7', exact: true })).toBeVisible();
    await expect(page.locator('.averages-strip')).toContainText('1.5');
    await library.selectOption('ties');
    await expect(page.locator('.algorithm-tag')).toHaveText('SJF');
    await expect(page.locator('.timeline-segment').first()).toHaveAttribute('aria-label', 'Z: 0–1');
    await library.selectOption('preemption');
    await expect(page.locator('.algorithm-tag')).toHaveText('SRTF');
    await page.getByRole('button', { name: 'Next decision' }).click();
    await expect(page.locator('.decision-explanation')).toContainText('L is preempted');
    await library.selectOption('boundary');
    await expect(page.locator('.algorithm-tag')).toHaveText('RR / q = 2');
    await page.getByRole('button', { name: 'Next decision' }).click();
    expect(await page.locator('.queue-chip').allTextContents()).toEqual(['P31 selected', 'P21', 'P12']);
  });

  test('named custom workloads survive reload, reject collisions, and can be removed', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('spinbutton', { name: 'Process 1 burst', exact: true }).fill('6');
    await page.getByRole('button', { name: 'RR', exact: true }).click();
    await page.getByRole('button', { name: 'q = 4', exact: true }).click();
    await page.getByText('Save or manage workloads', { exact: true }).click();
    await page.getByLabel('Name this workload').fill('My exam practice');
    await page.getByRole('button', { name: 'Save copy', exact: true }).click();
    await expect(page.locator('.save-message')).toContainText('Saved “My exam practice”');
    await page.getByLabel('Name this workload').fill('my exam practice');
    await page.getByRole('button', { name: 'Save copy', exact: true }).click();
    await expect(page.locator('.save-message')).toContainText('already saved');
    await page.reload();
    await page.getByLabel('Workload library').selectOption({ label: 'My exam practice' });
    await expect(page.getByRole('spinbutton', { name: 'Process 1 burst', exact: true })).toHaveValue('6');
    await expect(page.locator('.algorithm-tag')).toHaveText('RR / q = 4');
    await page.getByText('Save or manage workloads', { exact: true }).click();
    await page.getByRole('button', { name: 'Remove saved copy' }).click();
    await expect(page.locator('.save-message')).toContainText('Current inputs are kept');
    await expect(page.getByRole('spinbutton', { name: 'Process 1 burst', exact: true })).toHaveValue('6');
    await page.reload();
    await expect(page.locator('#workload-library option').filter({ hasText: 'My exam practice' })).toHaveCount(0);
  });

  test('storage failures do not report a successful save', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Full'); }; });
    await page.getByText('Save or manage workloads', { exact: true }).click();
    await page.getByLabel('Name this workload').fill('Cannot save');
    await page.getByRole('button', { name: 'Save copy', exact: true }).click();
    await expect(page.locator('.save-message')).toContainText('unavailable or full');
    await expect(page.locator('#workload-library option').filter({ hasText: 'Cannot save' })).toHaveCount(0);
    await expect(page.locator('.averages-strip')).toContainText('10.5');
  });

  for (const width of [320, 390, 768, 1024, 1440, 1920, 2560]) {
    test(`workspace uses the available width at ${width}px without page overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 1080 });
      await page.goto('/');
      await page.getByRole('button', { name: width === 1920 ? 'Dark' : 'Light', exact: true }).click();
      await page.getByRole('button', { name: 'Compare algorithms' }).click();
      const layout = await page.locator('.app-layout').boundingBox();
      expect(layout!.width).toBe(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      if (width >= 1024) {
        const editor = await page.locator('.editor').boundingBox();
        const results = await page.locator('.results-workspace').boundingBox();
        expect(editor!.x).toBeLessThanOrEqual(36);
        expect(width - results!.x - results!.width).toBeLessThanOrEqual(37);
      }
      if ([390, 1440, 1920, 2560].includes(width)) await page.screenshot({ path: `test-results/redesign-${width}.png`, fullPage: true });
    });
  }
});
