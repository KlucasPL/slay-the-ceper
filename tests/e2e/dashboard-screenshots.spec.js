import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DASHBOARD_BASE = 'http://localhost:5174';
const BASELINE_PATH = join(__dirname, '..', '..', 'baselines', 'main.metrics.json');
const OUT_DIR = join(__dirname, '..', '..', 'docs', 'screenshots', 'dashboard');

test.beforeEach(async ({ page }) => {
  page.on('framenavigated', (frame) => {
    const url = frame.url();
    if (url.startsWith('http') && !url.startsWith('http://localhost')) {
      throw new Error(`Guardrail: non-localhost navigation blocked: ${url}`);
    }
  });
  await page.setViewportSize({ width: 1440, height: 900 });
});

async function loadBaseline(page) {
  const buffer = readFileSync(BASELINE_PATH);
  await page.goto(DASHBOARD_BASE);
  await page.locator('#metrics-file-input').setInputFiles({
    name: 'main.metrics.json',
    mimeType: 'application/json',
    buffer,
  });
  await expect(page.locator('#load-status')).not.toBeEmpty({ timeout: 5_000 });
}

async function snap(page, name) {
  await page.waitForTimeout(300); // let Chart.js animations settle
  await page.screenshot({
    path: join(OUT_DIR, `${name}.png`),
    fullPage: true,
  });
}

test('01-batch-summary', async ({ page }) => {
  await loadBaseline(page);
  // batch-summary is the default view after load — no click needed
  await expect(page.locator('#main-content')).not.toBeEmpty();
  await snap(page, '01-batch-summary');
});

test('02-leaderboard', async ({ page }) => {
  await loadBaseline(page);
  await page.click('.nav-btn[data-view="leaderboard"]');
  await expect(page.locator('#main-content')).not.toBeEmpty();
  await snap(page, '02-leaderboard');
});

test('03-entity-detail', async ({ page }) => {
  await loadBaseline(page);
  await page.click('.nav-btn[data-view="leaderboard"]');
  await expect(page.locator('#main-content')).not.toBeEmpty();
  const firstRow = page.locator('table tbody tr').first();
  if (await firstRow.count()) await firstRow.click();
  await page.waitForTimeout(300);
  await snap(page, '03-entity-detail');
});

test('04-enemy-heatmap', async ({ page }) => {
  await loadBaseline(page);
  await page.click('.nav-btn[data-view="enemy-heatmap"]');
  await expect(page.locator('#main-content')).not.toBeEmpty();
  await snap(page, '04-enemy-heatmap');
});

test('05-weather-enemy', async ({ page }) => {
  await loadBaseline(page);
  await page.click('.nav-btn[data-view="weather-enemy"]');
  await expect(page.locator('#main-content')).not.toBeEmpty();
  await snap(page, '05-weather-enemy');
});

test('06-patch-comparison', async ({ page }) => {
  await loadBaseline(page);
  await page.click('.nav-btn[data-view="patch-comparison"]');
  await expect(page.locator('#main-content')).not.toBeEmpty();
  await snap(page, '06-patch-comparison');
});

test('07-run-replay', async ({ page }) => {
  await loadBaseline(page);
  await page.click('.nav-btn[data-view="run-replay"]');
  await expect(page.locator('#main-content')).not.toBeEmpty();
  await snap(page, '07-run-replay');
});
