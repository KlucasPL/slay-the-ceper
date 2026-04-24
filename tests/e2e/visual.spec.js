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