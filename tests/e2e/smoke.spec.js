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

test('shouldLoadTitleScreenAndShowStartButton', async ({ page }) => {
  await page.goto(GAME_BASE);
  await expect(page.locator('#title-btn-normal')).toBeVisible();
  await expect(page.locator('#title-screen')).toBeVisible();
});

test('shouldStartNormalRunAndReachCombat', async ({ page }) => {
  await page.goto(GAME_BASE);
  await page.evaluate(() => localStorage.setItem('stc_skip_intro', 'true'));
  await page.reload();
  await page.locator('#title-btn-normal').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('#title-btn-normal').click();

  // Map overlay should appear (or combat starts immediately via first node)
  const mapOrCombat = page.locator('#map-overlay:not(.hidden), #end-turn-btn:not([disabled])');
  await mapOrCombat.first().waitFor({ timeout: 15_000 });

  // If on map, click the first available node
  const mapOverlay = page.locator('#map-overlay:not(.hidden)');
  if (await mapOverlay.isVisible().catch(() => false)) {
    await page.locator('.map-node-btn.available').first().click();
    await page.waitForTimeout(500);
  }

  // Combat UI should now be visible
  await expect(page.locator('#end-turn-btn')).toBeVisible();
  await expect(page.locator('#p-hp')).toBeVisible();
  await expect(page.locator('#e-hp')).toBeVisible();
});

/**
 * Lightweight smoke: start a seeded run with seed 0xcafe, play through a few turns,
 * and verify the game doesn't crash. Budget: 30s.
 */
test('shouldCompleteSeededRunWithoutCrashing', async ({ page }) => {
  test.setTimeout(30_000);

  await page.goto(GAME_BASE);
  await page.evaluate(() => localStorage.setItem('stc_skip_intro', 'true'));
  await page.reload();
  await page.locator('#title-btn-normal').waitFor({ state: 'visible', timeout: 10_000 });

  // Open seeded run modal
  const seededBtn = page.locator('#title-btn-seeded');
  if (await seededBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await seededBtn.click();
    await page.locator('#seeded-run-input').fill('cafe');
    await page.locator('#seeded-run-confirm-btn').click();
  } else {
    // Fallback: start a normal run
    await page.locator('#title-btn-normal').click();
  }

  // Wait for map or combat
  const mapOrCombat = page.locator('#map-overlay:not(.hidden), #end-turn-btn:not([disabled])');
  await mapOrCombat.first().waitFor({ timeout: 10_000 });

  // Play up to 20 iterations without crashing
  for (let i = 0; i < 20; i++) {
    const state = await page.evaluate(() => ({
      map: !document.getElementById('map-overlay')?.classList.contains('hidden'),
      endEnabled: !document.getElementById('end-turn-btn')?.disabled,
      summary: !document.getElementById('run-summary-overlay')?.classList.contains('hidden'),
      cardReward: !document.getElementById('card-reward-screen')?.classList.contains('hidden'),
      relicReward: !document.getElementById('relic-reward-screen')?.classList.contains('hidden'),
      maryna: !document.getElementById('maryna-boon-overlay')?.classList.contains('hidden'),
      shop: !document.getElementById('shop-overlay')?.classList.contains('hidden'),
      camp: !document.getElementById('campfire-overlay')?.classList.contains('hidden'),
      event: !document.getElementById('random-event-overlay')?.classList.contains('hidden'),
    }));

    if (state.summary) break; // run ended cleanly

    if (state.maryna) {
      await page
        .locator('#maryna-boon-overlay .maryna-boon-card')
        .first()
        .click({ timeout: 1_000 })
        .catch(() => {});
    } else if (state.map) {
      const available = page.locator('.map-node-btn.available');
      if ((await available.count()) > 0) {
        await available
          .first()
          .click({ timeout: 1_000 })
          .catch(() => {});
      }
    } else if (state.relicReward) {
      await page
        .locator('#claim-relic-btn')
        .click({ timeout: 1_000 })
        .catch(() => {});
    } else if (state.cardReward) {
      const skip = page.locator('#reward-skip-btn:not(.hidden)');
      if (await skip.isVisible({ timeout: 500 }).catch(() => false)) {
        await skip.click({ timeout: 1_000 }).catch(() => {});
      } else {
        await page
          .locator('#reward-cards .reward-card')
          .first()
          .click({ timeout: 1_000 })
          .catch(() => {});
      }
    } else if (state.shop) {
      await page
        .locator('#shop-exit-btn')
        .click({ timeout: 1_000 })
        .catch(() => {});
    } else if (state.camp) {
      await page
        .locator('#camp-exit-btn')
        .click({ timeout: 1_000 })
        .catch(() => {});
    } else if (state.event) {
      const cont = page.locator('#random-event-continue-btn:not(.hidden)');
      if (await cont.isVisible({ timeout: 500 }).catch(() => false)) {
        await cont.click({ timeout: 1_000 }).catch(() => {});
      } else {
        await page
          .locator('#random-event-choices button')
          .first()
          .click({ timeout: 1_000 })
          .catch(() => {});
      }
    } else if (state.endEnabled) {
      // Play any playable cards then end turn
      const playable = page.locator('#hand .card:not(.disabled)');
      const count = await playable.count();
      for (let j = count - 1; j >= 0; j--) {
        const card = playable.nth(j);
        if (await card.isVisible().catch(() => false)) {
          await card.click({ timeout: 500 }).catch(() => {});
          await page.waitForTimeout(60);
        }
      }
      await page
        .locator('#end-turn-btn:not([disabled])')
        .click({ timeout: 1_000 })
        .catch(() => {});
    }
    await page.waitForTimeout(100);
  }

  // Verify game is still responsive — title should be hidden, game body should exist
  const gameWrapper = page.locator('#game-wrapper');
  await expect(gameWrapper).toBeVisible();
});
