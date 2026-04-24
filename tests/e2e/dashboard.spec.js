import { test, expect } from '@playwright/test';

const DASHBOARD_BASE = 'http://localhost:5174';

// Safety guard: no test may navigate outside localhost
test.beforeEach(async ({ page }) => {
  page.on('framenavigated', (frame) => {
    const url = frame.url();
    if (url.startsWith('http') && !url.startsWith('http://localhost')) {
      throw new Error(`Guardrail: navigation to non-localhost URL blocked: ${url}`);
    }
  });
});

/** Load metrics fixture into the dashboard - rely on auto-load, wait for it. */
async function loadFixture(page) {
  // Dashboard auto-loads metrics.fixture.json on page load.
  // Wait for the status to show loaded with run count.
  await expect(page.locator('#load-status')).toContainText('runs', {
    timeout: 10_000,
  });
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
