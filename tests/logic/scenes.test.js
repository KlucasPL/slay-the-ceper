import { describe, it, expect } from 'vitest';
import { GameState } from '../../src/state/GameState.js';
import { characters } from '../../src/data/characters.js';
import { enemyLibrary } from '../../src/data/enemies.js';
import { startingDeck } from '../../src/data/cards.js';
import { sceneLibrary } from '../../src/logic/scenes/index.js';

/** @returns {GameState} */
function freshState() {
  const state = new GameState(characters.jedrek, enemyLibrary.cepr);
  state.initGame([...startingDeck]);
  return state;
}

describe('scenes — build() produces correct state', () => {
  it('shouldSetCombatOpeningToBattleScreenWithFullHand', () => {
    // given
    const state = freshState();

    // when
    sceneLibrary['combat-opening'].build(state);

    // then
    expect(state.currentScreen).toBe('battle');
    expect(state.hand.length).toBeGreaterThanOrEqual(3);
    expect(state.player.hp).toBe(state.player.maxHp);
    expect(state.player.energy).toBe(state.player.maxEnergy);
  });

  it('shouldSetCombatBossToFloor15WithRelics', () => {
    // given
    const state = freshState();

    // when
    sceneLibrary['combat-boss'].build(state);

    // then
    expect(state.currentScreen).toBe('battle');
    expect(state.currentLevel).toBe(14);
    expect(state.relics.length).toBeGreaterThanOrEqual(1);
    expect(state.enemy.isBoss).toBe(true);
  });

  it('shouldSetCombatLethalWithEnemyAt6Hp', () => {
    // given
    const state = freshState();

    // when
    sceneLibrary['combat-lethal'].build(state);

    // then
    expect(state.currentScreen).toBe('battle');
    expect(state.enemy.hp).toBe(6);
    expect(state.enemy.block).toBe(0);
    expect(state.hand.length).toBeGreaterThanOrEqual(1);
  });

  it('shouldSetCombatLoseWithPlayerAt1Hp', () => {
    // given
    const state = freshState();

    // when
    sceneLibrary['combat-lose'].build(state);

    // then
    expect(state.currentScreen).toBe('battle');
    expect(state.player.hp).toBe(1);
  });

  it('shouldSetRewardCardWithEnemyDeadAndPendingScene', () => {
    // given
    const state = freshState();

    // when
    sceneLibrary['reward-card'].build(state);

    // then
    expect(state.currentScreen).toBe('battle');
    expect(state.enemy.hp).toBe(0);
    expect(state._pendingScene).toBe('reward-card');
  });

  it('shouldSetRewardRelicWithPendingScene', () => {
    // given
    const state = freshState();

    // when
    sceneLibrary['reward-relic'].build(state);

    // then
    expect(state._pendingScene).toBe('reward-relic');
    expect(state.enemy.hp).toBe(0);
  });

  it('shouldSetShopStockedWith200DutkilAndPendingScene', () => {
    // given
    const state = freshState();

    // when
    sceneLibrary['shop-stocked'].build(state);

    // then
    expect(state.dutki).toBe(200);
    expect(state._pendingScene).toBe('shop-stocked');
  });

  it('shouldSetShopBrokeWith0Dutki', () => {
    // given
    const state = freshState();

    // when
    sceneLibrary['shop-broke'].build(state);

    // then
    expect(state.dutki).toBe(0);
    expect(state._pendingScene).toBe('shop-broke');
  });

  it('shouldSetCampfireReadyWithHalfHp', () => {
    // given
    const state = freshState();

    // when
    sceneLibrary['campfire-ready'].build(state);

    // then
    expect(state.player.hp).toBeLessThan(state.player.maxHp);
    expect(state._pendingScene).toBe('campfire-ready');
  });

  it('shouldSetEventBranchWithActiveEventId', () => {
    // given
    const state = freshState();

    // when
    sceneLibrary['event-branch'].build(state);

    // then
    expect(state.activeEventId).toBeTruthy();
    expect(state._pendingScene).toBe('event-branch');
    expect(state.currentScreen).toBe('event');
  });

  it('shouldSetMapMidwayAtFloor6', () => {
    // given
    const state = freshState();

    // when
    sceneLibrary['map-midway'].build(state);

    // then
    expect(state.currentScreen).toBe('map');
    expect(state.currentLevel).toBe(5);
    expect(state.maxFloorReached).toBe(6);
  });

  it('shouldSetMarynaOfferWithThreeOfferedIds', () => {
    // given
    const state = freshState();

    // when
    sceneLibrary['maryna-offer'].build(state);

    // then
    expect(state.maryna.offeredIds.length).toBe(3);
    expect(state.maryna.pickedId).toBeNull();
    expect(state._pendingScene).toBe('maryna-offer');
  });

  it('shouldSetRunEndedWinWithPlayerWinSummary', () => {
    // given
    const state = freshState();

    // when
    sceneLibrary['run-ended-win'].build(state);

    // then
    expect(state.runSummary).not.toBeNull();
    expect(state.runSummary.outcome).toBe('player_win');
    expect(state.runSummary.runStats.floorReached).toBe(15);
    expect(state._pendingScene).toBe('run-ended-win');
  });

  it('shouldSetRunEndedLossWithEnemyWinSummary', () => {
    // given
    const state = freshState();

    // when
    sceneLibrary['run-ended-loss'].build(state);

    // then
    expect(state.runSummary).not.toBeNull();
    expect(state.runSummary.outcome).toBe('enemy_win');
    expect(state.runSummary.killerName).toBeTruthy();
    expect(state._pendingScene).toBe('run-ended-loss');
  });

  it('shouldHaveAllRequiredScenesInLibrary', () => {
    // given
    const requiredScenes = [
      'combat-opening',
      'combat-boss',
      'combat-lethal',
      'combat-lose',
      'reward-card',
      'reward-relic',
      'shop-stocked',
      'shop-broke',
      'campfire-ready',
      'event-branch',
      'map-midway',
      'maryna-offer',
      'run-ended-win',
      'run-ended-loss',
    ];

    // then
    for (const name of requiredScenes) {
      expect(sceneLibrary[name], `scene '${name}' missing`).toBeDefined();
      expect(typeof sceneLibrary[name].build).toBe('function');
    }
  });
});
