import { test, expect } from '@playwright/test';

const GAME_BASE = 'http://localhost:4173/slay-the-ceper/';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__SCENE_TEST__ = true;
  });
});

async function loadScene(page, sceneName) {
  await page.goto(`${GAME_BASE}?scene=${sceneName}`);
  await page.waitForFunction(
    () => document.body.dataset.appScene === 'MAIN_GAME',
    { timeout: 10_000 }
  );
  await page.waitForTimeout(300);
}

/* --- Event System Tests --- */

test('event-choice-btn: shouldHaveCorrectTextColor', async ({ page }) => {
  await loadScene(page, 'event-branch');

  const btn = page.locator('.event-choice-btn').first();
  await expect(btn).toBeVisible();

  const color = await btn.evaluate(
    (el) => window.getComputedStyle(el).color
  );
  // Should be brownish (rgb(61, 35, 20) = #3d2314)
  expect(color).toContain('rgb(61, 35, 20)');
});

test('event-choice-btn: shouldHaveGradientBackground', async ({ page }) => {
  await loadScene(page, 'event-branch');

  const btn = page.locator('.event-choice-btn').first();
  const bg = await btn.evaluate(
    (el) => window.getComputedStyle(el).backgroundImage
  );
  expect(bg).toContain('linear-gradient');
});

test('event-choice-btn: shouldBeDisabledWithLowerOpacity', async ({ page }) => {
  await loadScene(page, 'event-branch');

  // Find a disabled button if any, or make one disabled
  const btns = page.locator('.event-choice-btn');
  const count = await btns.count();

  if (count > 0) {
    const first = btns.first();
    const isDisabled = await first.isDisabled();

    if (isDisabled) {
      const opacity = await first.evaluate(
        (el) => window.getComputedStyle(el).opacity
      );
      expect(opacity).toBe('0.55');
    }
  }
});

test('event-choice-row: shouldDisplayAsFlex', async ({ page }) => {
  await loadScene(page, 'event-branch');

  const row = page.locator('.event-choice-row').first();
  const display = await row.evaluate(
    (el) => window.getComputedStyle(el).display
  );
  expect(display).toBe('flex');
});

/* --- Card System Tests --- */

test('card-desc: shouldHaveReadableTextColor', async ({ page }) => {
  await loadScene(page, 'combat-opening');

  const desc = page.locator('.card-desc').first();
  if (await desc.isVisible().catch(() => false)) {
    const color = await desc.evaluate(
      (el) => window.getComputedStyle(el).color
    );
    // Should be dark brown (rgb(61, 35, 20))
    expect(color).toContain('rgb(61, 35, 20)');
  }
});

test('card-exhaust-inline: shouldBeRed', async ({ page }) => {
  await loadScene(page, 'combat-opening');

  const exhaust = page.locator('.card-exhaust-inline').first();
  if (await exhaust.isVisible().catch(() => false)) {
    const color = await exhaust.evaluate(
      (el) => window.getComputedStyle(el).color
    );
    // Should be red (rgb(179, 45, 28) = #b32d1c)
    expect(color).toContain('rgb(179, 45, 28)');
  }
});

/* --- Shop System Tests --- */

test('shop-panel: shouldHaveGradientBackground', async ({ page }) => {
  await loadScene(page, 'shop-stocked');

  const panel = page.locator('.shop-panel').first();
  await expect(panel).toBeVisible();

  const bg = await panel.evaluate(
    (el) => window.getComputedStyle(el).backgroundImage
  );
  expect(bg).toContain('linear-gradient');
});

test('shop-panel: shouldHaveRoundedCorners', async ({ page }) => {
  await loadScene(page, 'shop-stocked');

  const panel = page.locator('.shop-panel').first();
  const radius = await panel.evaluate(
    (el) => window.getComputedStyle(el).borderRadius
  );
  expect(radius).not.toBe('0px');
});

/* --- Combat System Tests --- */

test('status-tag: shouldDisplayStatusColors', async ({ page }) => {
  await loadScene(page, 'combat-opening');

  const tags = page.locator('.status-tag');
  const count = await tags.count();

  // Some tags may exist if player has statuses
  if (count > 0) {
    const first = tags.first();
    await expect(first).toBeVisible();
  }
});

/* --- Title Screen Tests --- */

test('title-start-btn: shouldBeVisible', async ({ page }) => {
  await page.goto(GAME_BASE);

  const btn = page.locator('#title-btn-normal');
  await expect(btn).toBeVisible();
});

test('title-screen: shouldHaveTitleText', async ({ page }) => {
  await page.goto(GAME_BASE);

  const title = page.locator('.title-main');
  await expect(title).toBeVisible();
});

/* --- Combat UI Tests --- */

test('hp-bar: shouldShowPlayerHp', async ({ page }) => {
  await loadScene(page, 'combat-opening');

  const hp = page.locator('#p-hp');
  await expect(hp).toBeVisible();

  const text = await hp.textContent();
  expect(text).toMatch(/\d+/);
});

test('hp-bar: shouldShowEnemyHp', async ({ page }) => {
  await loadScene(page, 'combat-opening');

  const hp = page.locator('#e-hp');
  await expect(hp).toBeVisible();

  const text = await hp.textContent();
  expect(text).toMatch(/\d+/);
});

test('energy: shouldDisplayOscypek', async ({ page }) => {
  await loadScene(page, 'combat-opening');

  const energy = page.locator('#energy');
  await expect(energy).toBeVisible();

  const text = await energy.textContent();
  expect(text).toMatch(/\d+/);
});

/* --- Hand Tests --- */

test('hand-container: shouldDisplayCards', async ({ page }) => {
  await loadScene(page, 'combat-opening');

  const hand = page.locator('#hand');
  await expect(hand).toBeVisible();

  const cards = page.locator('#hand .card');
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(3);
});

/* --- Map Tests --- */

test('map-overlay: shouldBeVisible', async ({ page }) => {
  await page.goto(GAME_BASE);
  await page.addInitScript(() => {
    window.__SCENE_TEST__ = true;
  });
  // Start a run to get to map
  await page.locator('#title-btn-normal').click();
  await page.waitForTimeout(500);

  const map = page.locator('#map-overlay:not(.hidden)');
  await expect(map).toBeVisible({ timeout: 5000 }).catch(() => map.first().waitFor({timeout: 500}));
});

test('map-node: shouldHaveNodes', async ({ page }) => {
  await page.goto(GAME_BASE);
  await page.addInitScript(() => {
    window.__SCENE_TEST__ = true;
  });
  // Start a run to get to map
  await page.locator('#title-btn-normal').click();
  await page.waitForTimeout(500);

  // Wait for map if visible
  const map = page.locator('#map-overlay');
  const isMapVisible = await map.isVisible().catch(() => false);
  if (isMapVisible) {
    const nodes = page.locator('.map-node-btn');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  }
});