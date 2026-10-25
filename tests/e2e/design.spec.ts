import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('scheduling-lab-tour-v1','seen'));
});

test('process editor has no unnecessary horizontal scrollbar, even with many rows', async ({ page }) => {
  for (const width of [390, 1100, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const table = page.locator('.input-table-wrap');
    await expect.poll(() => table.evaluate(e => e.scrollWidth - e.clientWidth)).toBe(0);
    for (let i=0;i<5;i++) await page.getByRole('button',{name:'Add process'}).click();
    await expect.poll(() => table.evaluate(e => e.scrollHeight - e.clientHeight)).toBeGreaterThan(0);
    await expect.poll(() => table.evaluate(e => e.scrollWidth - e.clientWidth)).toBe(0);
    const scrollbar = await table.evaluate(e => ({ height: getComputedStyle(e,'::-webkit-scrollbar').height, width: getComputedStyle(e,'::-webkit-scrollbar').width }));
    expect(scrollbar).toEqual({ height: '8px', width: '8px' });
  }
});

test('bundled Source Sans 3 loads locally and averages follow the chart', async ({ page }) => {
  const fontResponses: string[] = [];
  page.on('response', response => { if (response.url().includes('.woff2') && response.ok()) fontResponses.push(response.url()); });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => [...document.fonts].some(font => font.family.includes('Source Sans 3') && font.status === 'loaded'))).toBe(true);
  expect(fontResponses.length).toBeGreaterThan(0);
  for (const url of fontResponses) expect(new URL(url).origin).toBe(new URL(page.url()).origin);
  expect(await page.locator('body').evaluate(e => getComputedStyle(e).fontFamily)).toContain('Source Sans 3');
  const chart = await page.locator('.timeline-panel').boundingBox();
  const averages = await page.locator('.averages-strip').boundingBox();
  expect(averages!.y).toBeGreaterThanOrEqual(chart!.y + chart!.height);
});

test('tooltips work on hover, focus and disabled controls without swallowing clicks', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Explain CPU burst',exact:true}).hover();
  await expect(page.getByRole('tooltip')).toContainText('total CPU time');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.getByRole('button',{name:'Explain arrival time',exact:true}).focus();
  await expect(page.getByRole('tooltip')).toContainText('becomes ready');
  await page.getByRole('button',{name:'RR',exact:true}).hover();
  await expect(page.getByRole('tooltip').last()).toContainText('Round Robin');
  await page.getByRole('button',{name:'RR',exact:true}).click();
  await expect(page.locator('.algorithm-tag')).toHaveText('RR / q = 2');
  await page.locator('.zoom-controls .disabled-tooltip-trigger').focus();
  await expect(page.getByRole('tooltip')).toContainText('Already showing the full timeline');
  await page.screenshot({path:'test-results/control-tooltip.png',fullPage:true});
});

test('three mockups use the same RR intervals and respond to selection and idle workload', async ({ page }) => {
  await page.goto('/?preview=gantt');
  await expect(page.locator('.mock-option')).toHaveCount(3);
  const labels = await page.locator('.mock-rail .mock-block').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')));
  expect(labels).toEqual(['P1: 0–2','P2: 2–4','P3: 4–6','P1: 6–8','P4: 8–9','P2: 9–11','P5: 11–13','P1: 13–15','P5: 15–16','P1: 16–18']);
  expect(await page.locator('.mock-outline .mock-block').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')))).toEqual(labels);
  expect((await page.locator('.mock-lanes .mock-block').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')))).sort()).toEqual([...labels].sort());
  await page.locator('.mock-lanes').getByRole('button',{name:'P5: 11–13',exact:true}).click();
  for (const option of ['rail','lanes','outline']) await expect(page.locator(`.mock-${option} .mock-selected`)).toContainText('P5 [11, 13)');
  await page.getByLabel('Workload',{exact:true}).selectOption('B');
  for (const option of ['rail','lanes','outline']) await expect(page.locator(`.mock-${option}`).getByRole('button',{name:'Idle: 6–8',exact:true})).toBeVisible();
  expect(await page.locator('.gantt-preview').evaluate(e => getComputedStyle(e).fontFamily)).toContain('Source Sans 3');
});

test('mockup visual comparison in both themes and on mobile', async ({ page }) => {
  await page.setViewportSize({width:1440,height:1080});
  await page.goto('/?preview=gantt');
  for (const theme of ['Light','Dark']) {
    await page.getByRole('button',{name:theme,exact:true}).click();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({path:`output/design-previews/gantt-options-${theme.toLowerCase()}.png`,fullPage:true});
    for (const option of ['rail','lanes','outline']) await page.locator(`.mock-${option}`).screenshot({path:`output/design-previews/gantt-${option}-${theme.toLowerCase()}.png`});
  }
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(page.locator('.mock-rail .mock-scroll')).toBeVisible();
});
