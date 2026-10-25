import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('scheduling-lab-tour-v1','seen'));
});

test('CPU rail and Process lanes preserve the schedule, step, highlight and zoom', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button',{name:'RR',exact:true}).click();
  const labels = await page.locator('.timeline-segment').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')).sort());
  await page.getByRole('button',{name:'P1: 6–8',exact:true}).click();
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await page.getByRole('button',{name:'Process lanes',exact:true}).click();
  await expect(page.locator('.process-lane')).toHaveCount(4);
  expect(await page.locator('.timeline-segment').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')).sort())).toEqual(labels);
  await expect(page.locator('.decision-time')).toContainText('t = 6');
  await expect(page.getByLabel('Timeline scale',{exact:true})).toHaveText('200%');
  await expect(page.locator('.timeline-segment.highlighted-process')).toHaveCount(4);
  await expect(page.locator('.metrics-panel tr.highlighted-process')).toHaveAttribute('data-process-id','P1');
  await page.getByRole('button',{name:'Highlight lane P2',exact:true}).click();
  await expect(page.locator('.timeline-segment.highlighted-process')).toHaveCount(2);
  await page.getByRole('button',{name:'CPU rail',exact:true}).click();
  await expect(page.locator('.decision-time')).toContainText('t = 6');
  await expect(page.getByLabel('Timeline scale',{exact:true})).toHaveText('200%');
  await expect(page.locator('.metrics-panel tr.highlighted-process')).toHaveAttribute('data-process-id','P2');
  await expect(page.locator('.averages-strip')).toContainText('8.5');
});

test('lane time coordinates remain proportional through zoom and idle intervals', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Process lanes',exact:true}).click();
  await page.getByRole('button',{name:'Load workload B',exact:true}).click();
  await expect(page.getByRole('button',{name:'Process lanes',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.process-lane')).toHaveCount(5);
  await expect(page.getByRole('button',{name:'Idle: 0–2',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Idle: 6–8',exact:true})).toBeVisible();
  for (const zoom of [1,2]) {
    if (zoom === 2) await page.getByRole('button',{name:'Zoom in',exact:true}).click();
    const track = await page.locator('.process-lane-track').first().boundingBox();
    const block = await page.getByRole('button',{name:'P1: 2–5',exact:true}).boundingBox();
    expect(block!.width/track!.width).toBeCloseTo(3/11,2);
    expect((block!.x-track!.x)/track!.width).toBeCloseTo(2/11,2);
  }
  await page.getByLabel('Decision step',{exact:true}).fill('5');
  await expect(page.locator('.decision-time')).toContainText('t = 10');
  // Read both rectangles in one frame and wait for layout/scroll effects to settle.
  // Keep the visibility requirement: a persistently clipped cursor must still fail.
  await expect.poll(() => page.locator('.timeline-scroll').evaluate(chart => {
    const cursor = chart.querySelector('.time-cursor')!.getBoundingClientRect();
    const bounds = chart.getBoundingClientRect();
    return cursor.left >= bounds.left && cursor.right <= bounds.right;
  })).toBe(true);
});

test('zoomed cursor stays visible before delayed resize notifications arrive', async ({ page }) => {
  // A fast interaction can precede ResizeObserver delivery. Hold only the timeline
  // notification to reproduce that ordering deterministically on every platform.
  await page.addInitScript(() => {
    const NativeObserver = window.ResizeObserver;
    window.ResizeObserver = class extends NativeObserver {
      constructor(callback: ResizeObserverCallback) {
        super((entries, observer) => {
          if (entries.some(entry => entry.target.classList.contains('timeline-canvas'))) return;
          callback(entries, observer);
        });
      }
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Process lanes', exact: true }).click();
  await page.getByRole('button', { name: 'Load workload B', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByLabel('Decision step', { exact: true }).fill('5');
  await expect(page.locator('.decision-time')).toContainText('t = 10');
  await expect.poll(() => page.locator('.timeline-scroll').evaluate(chart => {
    const cursor = chart.querySelector('.time-cursor')!.getBoundingClientRect();
    const bounds = chart.getBoundingClientRect();
    return cursor.left >= bounds.left && cursor.right <= bounds.right;
  })).toBe(true);
  await page.getByLabel('Decision step', { exact: true }).fill('0');
  await expect.poll(() => page.locator('.timeline-scroll').evaluate(chart => chart.scrollLeft)).toBe(0);
});

test('Rules sits between the guide and theme, explains boundary rules and restores focus', async ({ page }) => {
  await page.goto('/');
  const order = await page.locator('.header-tools').evaluate(el => {
    const elements = Array.from(el.children); return elements.map(e => e.textContent?.trim());
  });
  expect(order[0]).toBe('Getting started'); expect(order[1]).toBe('Rules');
  expect(order[2]).toContain('Light'); expect(order[2]).toContain('Dark');
  await page.getByRole('button',{name:'Rules',exact:true}).click();
  const dialog = page.getByRole('dialog',{name:'Scheduling rules'});
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('strictly shorter');
  await expect(dialog).toContainText('before re-enqueuing');
  await expect(dialog).toContainText('Process ID does not decide');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('.rules-dialog'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Rules',exact:true})).toBeFocused();
  await expect(page.locator('.averages-strip')).toContainText('10.5');
});

for (const width of [390,1920]) test(`final lane view and Rules at ${width}px in both themes`, async ({ page }) => {
  await page.setViewportSize({width,height:width===390?844:1080});
  await page.goto('/');
  await page.getByRole('button',{name:'SRTF',exact:true}).click();
  await page.getByRole('button',{name:'Process lanes',exact:true}).click();
  await page.getByRole('button',{name:'P2: 1–2',exact:true}).click();
  for (const theme of ['Light','Dark']) {
    await page.getByRole('button',{name:theme,exact:true}).click();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({path:`output/design-previews/final-lanes-${width}-${theme.toLowerCase()}.png`,fullPage:true});
  }
  await page.getByRole('button',{name:'Rules',exact:true}).click();
  await expect(page.getByRole('button',{name:'Close rules',exact:true})).toBeInViewport();
  await expect(page.getByRole('button',{name:'Back to the lab',exact:true})).toBeInViewport();
  await page.screenshot({path:`output/design-previews/rules-${width}.png`});
  await page.getByRole('button',{name:'Back to the lab',exact:true}).click();
  await expect(page.locator('.decision-time')).toContainText('t = 1');
});
