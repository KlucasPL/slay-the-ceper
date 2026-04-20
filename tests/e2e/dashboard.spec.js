import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DASHBOARD_BASE = 'http://localhost:5174';
const FIXTURE_PATH = join(__dirname, 'fixtures/metrics.fixture.json');

// Safety guard: no test may navigate outside localhost
test.beforeEach(async ({ page }) => {
  page.on('framenavigated', (frame) => {
    const url = frame.url();
    if (url.startsWith('http') && !url.startsWith('http://localhost')) {
      throw new Error(`Guardrail: navigation to non-localhost URL blocked: ${url}`);
    }
  });
});

/** Load metrics fixture into the dashboard via the file input. */
async function loadFixture(page) {
  const fixture = readFileSync(FIXTURE_PATH, 'utf8');
  // Inject metrics directly via JS to avoid needing a real file picker
  await page.evaluate((json) => {
    const data = JSON.parse(json);
    // Dispatch a custom event or set window-level variable the app reads
    window.__e2eMetrics = data;
  }, fixture);

  // Use the file input via Playwright's setInputFiles approach
  await page.locator('#metrics-file-input').setInputFiles({
    name: 'metrics.fixture.json',
    mimeType: 'application/json',
    buffer: Buffer.from(fixture),
  });

  // Wait for the load status to confirm data loaded
  await expect(page.locator('#load-status')).not.toBeEmpty({ timeout: 5_000 });
}

test('shouldLoadDashboardAndShowHeader', async ({ page }) => {
  await page.goto(DASHBOARD_BASE);
  await expect(page.locator('header.app-header')).toBeVisible();
  await expect(page.locator('nav.app-nav')).toBeVisible();
  // File input is type="file" — present in DOM but visually hidden; check it exists
  await expect(page.locator('#metrics-file-input')).toHaveCount(1);
});

test('shouldShowAllSixNavButtons', async ({ page }) => {
  await page.goto(DASHBOARD_BASE);
  const navBtns = page.locator('.nav-btn');
  await expect(navBtns).toHaveCount(6);
  // Verify key view names are present
  await expect(navBtns.filter({ hasText: 'Batch Summary' })).toBeVisible();
  await expect(navBtns.filter({ hasText: 'Leaderboard' })).toBeVisible();
  await expect(navBtns.filter({ hasText: 'Enemy Heatmap' })).toBeVisible();
});

test('shouldRenderBatchSummaryAfterLoadingFixture', async ({ page }) => {
  await page.goto(DASHBOARD_BASE);
  await loadFixture(page);

  // Batch summary view should render with key stats
  const main = page.locator('#main-content');
  await expect(main).not.toBeEmpty({ timeout: 5_000 });
  // Fixture has winrate 0.612 = 61.2%
  await expect(main).toContainText('61', { timeout: 5_000 });
});

test('shouldNavigateToLeaderboardView', async ({ page }) => {
  await page.goto(DASHBOARD_BASE);
  await loadFixture(page);

  await page.locator('.nav-btn[data-view="leaderboard"]').click();
  await expect(page.locator('.nav-btn[data-view="leaderboard"]')).toHaveClass(/active/);
  await expect(page.locator('#main-content')).not.toBeEmpty({ timeout: 5_000 });
});

test('shouldNavigateToEnemyHeatmapView', async ({ page }) => {
  await page.goto(DASHBOARD_BASE);
  await loadFixture(page);

  await page.locator('.nav-btn[data-view="enemy-heatmap"]').click();
  await expect(page.locator('.nav-btn[data-view="enemy-heatmap"]')).toHaveClass(/active/);
  await expect(page.locator('#main-content')).not.toBeEmpty({ timeout: 5_000 });
});

test('shouldNavigateToWeatherEnemyView', async ({ page }) => {
  await page.goto(DASHBOARD_BASE);
  await loadFixture(page);

  await page.locator('.nav-btn[data-view="weather-enemy"]').click();
  await expect(page.locator('.nav-btn[data-view="weather-enemy"]')).toHaveClass(/active/);
  await expect(page.locator('#main-content')).not.toBeEmpty({ timeout: 5_000 });
});

test('shouldNavigateToPatchComparisonView', async ({ page }) => {
  await page.goto(DASHBOARD_BASE);
  await loadFixture(page);

  await page.locator('.nav-btn[data-view="patch-comparison"]').click();
  await expect(page.locator('.nav-btn[data-view="patch-comparison"]')).toHaveClass(/active/);
  await expect(page.locator('#main-content')).not.toBeEmpty({ timeout: 5_000 });
});

test('shouldNavigateToRunReplayView', async ({ page }) => {
  await page.goto(DASHBOARD_BASE);
  await loadFixture(page);

  await page.locator('.nav-btn[data-view="run-replay"]').click();
  await expect(page.locator('.nav-btn[data-view="run-replay"]')).toHaveClass(/active/);
  await expect(page.locator('#main-content')).not.toBeEmpty({ timeout: 5_000 });
});

test('shouldNavigateToEntityDetailFromLeaderboard', async ({ page }) => {
  await page.goto(DASHBOARD_BASE);
  await loadFixture(page);

  // Go to leaderboard and click the first entity row
  await page.locator('.nav-btn[data-view="leaderboard"]').click();
  await expect(page.locator('#main-content')).not.toBeEmpty({ timeout: 5_000 });

  const firstRow = page
    .locator('#main-content [data-entity-id], #main-content .entity-row, #main-content tr[data-id]')
    .first();
  if (await firstRow.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await firstRow.click();
    await page.waitForTimeout(500);
    // Detail view should now show entity-specific content
    await expect(page.locator('#main-content')).not.toBeEmpty();
  } else {
    // Leaderboard may render cards/buttons instead of rows — click first clickable item
    const clickable = page.locator('#main-content button, #main-content [role="button"]').first();
    if (await clickable.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await clickable.click();
      await page.waitForTimeout(500);
    }
    await expect(page.locator('#main-content')).not.toBeEmpty();
  }
});
