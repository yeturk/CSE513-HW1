import { chromium, expect } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Uses an anonymous browser and the independent hand references verified by the exporter.
const address = process.argv[2];
if (!address || !/^https?:\/\//.test(address)) throw new Error('Usage: node scripts/verify-live.mjs <website-url>');
const { examples } = JSON.parse(await readFile('output/report-data/results.json', 'utf8'));
assert.equal(examples.length, 8, 'Run the report exporter before this check.');
const browser = await chromium.launch({ channel: process.env.E2E_BROWSER_CHANNEL || undefined });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const failures = [];
page.on('pageerror', error => failures.push(error.message));
page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
try {
  const response = await page.goto(address);
  assert.equal(response.status(), 200);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Skip guide', exact: true }).click();
  for (const example of examples) {
    await page.getByRole('button', { name: `Load workload ${example.workload}`, exact: true }).click();
    await page.getByRole('button', { name: example.algorithm, exact: true }).click();
    const expectedRows = example.manual.processes.map(p => [p.id, p.arrival, p.burst, p.firstStart, p.completion, p.turnaround, p.waiting, p.response].map(String));
    await expect.poll(() => page.locator('.metrics-panel tbody tr').evaluateAll(rows => rows.map(row => [...row.children].map(cell => cell.textContent.trim())))).toEqual(expectedRows);
    await expect(page.locator('.timeline-segment')).toHaveCount(example.manual.segments.length);
    const labels = await page.locator('.timeline-segment').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
    assert.deepEqual(labels, example.manual.segments.map(s => `${s.processId ?? 'Idle'}: ${s.start}–${s.end}`));
  }
  await page.getByRole('button', { name: 'Add Random Process', exact: true }).click();
  await expect(page.locator('.metrics-panel tbody tr')).toHaveCount(5);
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await page.getByRole('button', { name: 'Process lanes', exact: true }).click();
  await expect(page.locator('button.lane-process-label')).toHaveCount(5);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await page.evaluate(() => document.fonts.ready);
  assert.ok(await page.evaluate(() => [...document.fonts].some(font => font.family.includes('Source Sans 3') && font.status === 'loaded')));
  await mkdir('output/deployment', { recursive: true });
  await page.screenshot({ path: 'output/deployment/live-mobile.png', fullPage: true });
  assert.deepEqual(failures, []);
  console.log(`Verified anonymously: ${address}\n8 A/B schedules and metric tables, random addition, both timeline views, dark theme, mobile width, bundled fonts and asset responses.`);
} finally { await browser.close(); }
