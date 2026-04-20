import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GAME_BASE = 'http://localhost:4173/slay-the-ceper/';
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

async function loadScene(page, sceneName) {
  await page.addInitScript(() => {
    window.__SCENE_TEST__ = true;
  });
  await page.goto(`${GAME_BASE}?scene=${sceneName}`);
  await page.waitForFunction(() => document.body.dataset.appScene === 'MAIN_GAME', {
    timeout: 10_000,
  });
  await page.waitForTimeout(300);
}

function assertNoCriticalViolations(results, label) {
  const criticalViolations = results.violations.filter((v) => v.impact === 'critical');
  expect(
    criticalViolations,
    `Critical a11y violations on ${label}:\n${criticalViolations.map((v) => `  [${v.id}] ${v.description}`).join('\n')}`
  ).toHaveLength(0);
}

async function loadDashboardFixture(page) {
  const fixture = readFileSync(FIXTURE_PATH, 'utf8');
  await page.locator('#metrics-file-input').setInputFiles({
    name: 'metrics.fixture.json',
    mimeType: 'application/json',
    buffer: Buffer.from(fixture),
  });
  await expect(page.locator('#load-status')).not.toBeEmpty({ timeout: 5_000 });
}

test('shouldHaveNoCriticalA11yViolationsOnGameTitleScreen', async ({ page }) => {
  await page.goto(GAME_BASE);
  await page.locator('#title-btn-normal').waitFor({ state: 'visible', timeout: 15_000 });

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  assertNoCriticalViolations(results, 'game title screen');
});

test('shouldHaveNoCriticalA11yViolationsOnDashboardInitialLoad', async ({ page }) => {
  await page.goto(DASHBOARD_BASE);
  await expect(page.locator('nav.app-nav')).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  assertNoCriticalViolations(results, 'dashboard (no data)');
});

test('shouldHaveNoCriticalA11yViolationsOnDashboardBatchSummaryView', async ({ page }) => {
  await page.goto(DASHBOARD_BASE);
  await loadDashboardFixture(page);
  await expect(page.locator('#main-content')).not.toBeEmpty({ timeout: 5_000 });

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  assertNoCriticalViolations(results, 'dashboard batch summary');
});

test('shouldHaveNoCriticalA11yViolationsOnDashboardLeaderboardView', async ({ page }) => {
  await page.goto(DASHBOARD_BASE);
  await loadDashboardFixture(page);
  await page.locator('.nav-btn[data-view="leaderboard"]').click();
  await expect(page.locator('#main-content')).not.toBeEmpty({ timeout: 5_000 });

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  assertNoCriticalViolations(results, 'dashboard leaderboard');
});

test('shouldHaveNoCriticalA11yViolationsOnCombatOpeningScene', async ({ page }) => {
  await loadScene(page, 'combat-opening');
  await expect(page.locator('#end-turn-btn')).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  assertNoCriticalViolations(results, 'scene: combat-opening');
});

test('shouldHaveNoCriticalA11yViolationsOnRewardCardScene', async ({ page }) => {
  await loadScene(page, 'reward-card');
  await page.locator('#card-reward-screen:not(.hidden)').waitFor({ timeout: 5_000 });

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  assertNoCriticalViolations(results, 'scene: reward-card');
});

test('shouldHaveNoCriticalA11yViolationsOnShopStockedScene', async ({ page }) => {
  await loadScene(page, 'shop-stocked');
  await page.locator('#shop-overlay:not(.hidden)').waitFor({ timeout: 5_000 });

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  assertNoCriticalViolations(results, 'scene: shop-stocked');
});

test('shouldHaveNoCriticalA11yViolationsOnMapMidwayScene', async ({ page }) => {
  await loadScene(page, 'map-midway');
  await page.locator('#map-overlay:not(.hidden)').waitFor({ timeout: 5_000 });

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  assertNoCriticalViolations(results, 'scene: map-midway');
});
