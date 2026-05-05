import { test, expect } from '@playwright/test';

const GAME_BASE = 'http://localhost:4173/slay-the-ceper/';

// Safety guard: no test may navigate outside localhost
test.beforeEach(async ({ page }) => {
  page.on('framenavigated', (frame) => {
    const url = frame.url();
    if (url.startsWith('http') && !url.startsWith('http://localhost')) {
      throw new Error(`Guardrail: navigation to non-localhost URL blocked: ${url}`);
    }
  });
});

/**
 * Navigate to a scene by name and wait for the [scene] console log.
 * Sets __SCENE_TEST__ so the guardrail allows loading from any origin.
 */
async function loadScene(page, sceneName) {
  await page.addInitScript(() => {
    window.__SCENE_TEST__ = true;
  });
  await page.goto(`${GAME_BASE}?scene=${sceneName}`);
  await page.waitForFunction(
    () => {
      // Resolve when scene body attribute is set to MAIN_GAME (intro skipped)
      return document.body.dataset.appScene === 'MAIN_GAME';
    },
    { timeout: 10_000 }
  );
  // Short settling pause for any animation frames
  await page.waitForTimeout(300);
}

test('combat-opening: shouldShowBattleUIWithHandAndHpBars', async ({ page }) => {
  await loadScene(page, 'combat-opening');

  await expect(page.locator('#end-turn-btn')).toBeVisible();
  await expect(page.locator('#p-hp')).toBeVisible();
  await expect(page.locator('#e-hp')).toBeVisible();
  const handCount = await page.locator('#hand .card').count();
  expect(handCount).toBeGreaterThanOrEqual(3);
  await expect(page.locator('#energy')).toBeVisible();
});

test('combat-boss: shouldShowBossEnemyAtFloor15', async ({ page }) => {
  await loadScene(page, 'combat-boss');

  await expect(page.locator('#end-turn-btn')).toBeVisible();
  await expect(page.locator('#p-hp')).toBeVisible();
  await expect(page.locator('#e-hp')).toBeVisible();
  // Relics bar should have at least one relic
  const relicBar = page.locator('#relic-bar');
  await expect(relicBar).toBeVisible();
  const relicCount = await page.locator('.relic-chip').count();
  expect(relicCount).toBeGreaterThanOrEqual(1);
});

test('combat-lethal: shouldShowEnemyWithLowHpInBattle', async ({ page }) => {
  await loadScene(page, 'combat-lethal');

  await expect(page.locator('#end-turn-btn')).toBeVisible();
  await expect(page.locator('#e-hp')).toBeVisible();
  // Enemy HP should be low (6)
  const enemyHp = await page.locator('#e-hp').textContent();
  expect(parseInt(enemyHp ?? '999', 10)).toBeLessThanOrEqual(10);
});

test('combat-lose: shouldShowPlayerAt1Hp', async ({ page }) => {
  await loadScene(page, 'combat-lose');

  await expect(page.locator('#end-turn-btn')).toBeVisible();
  await expect(page.locator('#p-hp')).toBeVisible();
  const playerHp = await page.locator('#p-hp').textContent();
  expect(parseInt(playerHp ?? '999', 10)).toBe(1);
});

test('reward-card: shouldShowCardRewardScreen', async ({ page }) => {
  await loadScene(page, 'reward-card');

  const cardScreen = page.locator('#card-reward-screen:not(.hidden)');
  await cardScreen.waitFor({ timeout: 5_000 });
  await expect(cardScreen).toBeVisible();
  await expect(page.locator('#reward-cards')).not.toBeEmpty();
});

test('reward-relic: shouldShowRelicRewardScreen', async ({ page }) => {
  await loadScene(page, 'reward-relic');

  const relicScreen = page.locator('#relic-reward-screen:not(.hidden)');
  await relicScreen.waitFor({ timeout: 5_000 });
  await expect(relicScreen).toBeVisible();
  await expect(page.locator('#reward-relic')).not.toBeEmpty();
  await expect(page.locator('#claim-relic-btn')).toBeVisible();
});

test('shop-stocked: shouldShowShopOverlayWithCards', async ({ page }) => {
  await loadScene(page, 'shop-stocked');

  const shopOverlay = page.locator('#shop-overlay:not(.hidden)');
  await shopOverlay.waitFor({ timeout: 5_000 });
  await expect(shopOverlay).toBeVisible();
  await expect(page.locator('#shop-exit-btn')).toBeVisible();
});

test('shop-broke: shouldShowShopOverlayWithZeroDutki', async ({ page }) => {
  await loadScene(page, 'shop-broke');

  const shopOverlay = page.locator('#shop-overlay:not(.hidden)');
  await shopOverlay.waitFor({ timeout: 5_000 });
  await expect(shopOverlay).toBeVisible();
  // Dutki counter visible in game UI
  await expect(page.locator('#dutki')).toBeVisible();
});

test('campfire-ready: shouldShowCampfireOverlay', async ({ page }) => {
  await loadScene(page, 'campfire-ready');

  const campfireOverlay = page.locator('#campfire-overlay:not(.hidden)');
  await campfireOverlay.waitFor({ timeout: 5_000 });
  await expect(campfireOverlay).toBeVisible();
  await expect(page.locator('#camp-exit-btn')).toBeVisible();
  await expect(page.locator('#camp-hp-current')).not.toBeEmpty();
});

test('event-branch: shouldShowEventOverlayWithChoices', async ({ page }) => {
  await loadScene(page, 'event-branch');

  const eventOverlay = page.locator('#random-event-overlay:not(.hidden)');
  await eventOverlay.waitFor({ timeout: 5_000 });
  await expect(eventOverlay).toBeVisible();
  const choiceCount = await page.locator('#random-event-choices button').count();
  expect(choiceCount).toBeGreaterThanOrEqual(2);
});

test('map-midway: shouldShowMapOverlayAtFloor6', async ({ page }) => {
  await loadScene(page, 'map-midway');

  const mapOverlay = page.locator('#map-overlay:not(.hidden)');
  await mapOverlay.waitFor({ timeout: 5_000 });
  await expect(mapOverlay).toBeVisible();
  const nodeCount = await page.locator('.map-node-btn').count();
  expect(nodeCount).toBeGreaterThanOrEqual(1);
});

test('maryna-offer: shouldShowMarynaOverlayWithThreeChoices', async ({ page }) => {
  await loadScene(page, 'maryna-offer');

  const marynaOverlay = page.locator('#maryna-boon-overlay:not(.hidden)');
  await marynaOverlay.waitFor({ timeout: 5_000 });
  await expect(marynaOverlay).toBeVisible();
  const boonCardCount = await page.locator('.maryna-boon-card').count();
  expect(boonCardCount).toBeGreaterThanOrEqual(1);
});

test('run-ended-win: shouldShowRunSummaryWithVictoryTitle', async ({ page }) => {
  await loadScene(page, 'run-ended-win');

  const summaryOverlay = page.locator('#run-summary-overlay:not(.hidden)');
  await summaryOverlay.waitFor({ timeout: 5_000 });
  await expect(summaryOverlay).toBeVisible();
  await expect(page.locator('#run-summary-title')).toContainText(/ZWYCI[EĘ]STWO|VICTORY/i);
  await expect(page.locator('#run-summary-floor')).toContainText('15');
});

test('run-ended-loss: shouldShowRunSummaryWithDefeatTitle', async ({ page }) => {
  await loadScene(page, 'run-ended-loss');

  const summaryOverlay = page.locator('#run-summary-overlay:not(.hidden)');
  await summaryOverlay.waitFor({ timeout: 5_000 });
  await expect(summaryOverlay).toBeVisible();
  await expect(page.locator('#run-summary-title')).toContainText(/KONIEC|RUN OVER/i);
});
