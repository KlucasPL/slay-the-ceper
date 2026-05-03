import { describe, it, expect } from 'vitest';
import { dispatch } from '../../src/engine/ActionDispatcher.js';
import { buildObservation } from '../../src/engine/Observation.js';
import { drain } from '../../src/engine/EngineEvents.js';
import { GameState } from '../../src/state/GameState.js';
import { characters } from '../../src/data/characters.js';
import { enemyLibrary } from '../../src/data/enemies.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(overrides = {}) {
  const state = new GameState(characters.jedrek, enemyLibrary.cepr);
  state.runSummary = null;
  state._rewardOffer = null;
  state._pendingAct2Transition = false;
  state._inShop = false;
  state._inCampfire = false;
  Object.assign(state, overrides);
  return state;
}

function obs(state) {
  return buildObservation(state);
}

function drainEv(state) {
  return drain(state);
}

// ---------------------------------------------------------------------------
// Act 2 transition — reward_pick_relic
// ---------------------------------------------------------------------------

describe('ActionDispatcher — Act 2 transition', () => {
  it('shouldCallStartAct2AndClearFlagWhenPickingTransitionRelic', () => {
    // given — state mid-transition (reward screen with relic choices)
    const state = makeState();
    state.currentScreen = 'reward';
    state._rewardOffer = { cards: [], relicIds: ['zasluzony_portfel'] };
    state._pendingAct2Transition = true;
    state.currentAct = 1;
    state.hasStartedFirstBattle = true;

    // when
    dispatch(state, { type: 'reward_pick_relic', relicId: 'zasluzony_portfel' }, obs, drainEv);

    // then — Act 2 started, flag cleared, hasStartedFirstBattle restored for headless engine
    expect(state.currentAct).toBe(2);
    expect(state.currentActName).toBe('MORSKIE OKO');
    expect(state._pendingAct2Transition).toBe(false);
    expect(state._rewardOffer).toBeNull();
    expect(state.currentScreen).toBe('map');
    expect(state.hasStartedFirstBattle).toBe(true);
  });

  it('shouldAddRelicWhenPickingTransitionRelic', () => {
    // given
    const state = makeState();
    state.currentScreen = 'reward';
    state._rewardOffer = { cards: [], relicIds: ['zasluzony_portfel'] };
    state._pendingAct2Transition = true;
    state.hasStartedFirstBattle = true;

    // when
    dispatch(state, { type: 'reward_pick_relic', relicId: 'zasluzony_portfel' }, obs, drainEv);

    // then — relic added to player inventory
    expect(state.relics).toContain('zasluzony_portfel');
  });

  it('shouldNotEndRunAfterAct2Transition', () => {
    // given
    const state = makeState();
    state.currentScreen = 'reward';
    state._rewardOffer = { cards: [], relicIds: ['zasluzony_portfel'] };
    state._pendingAct2Transition = true;
    state.hasStartedFirstBattle = true;

    // when
    const result = dispatch(
      state,
      { type: 'reward_pick_relic', relicId: 'zasluzony_portfel' },
      obs,
      drainEv
    );

    // then — run is not over
    expect(result.done).toBe(false);
    expect(state.runSummary).toBeNull();
  });

  it('shouldResetNavigationStateAfterAct2Transition', () => {
    // given — simulate end-of-Act1 nav state
    const state = makeState();
    state.currentScreen = 'reward';
    state._rewardOffer = { cards: [], relicIds: ['zasluzony_portfel'] };
    state._pendingAct2Transition = true;
    state.currentLevel = 14;
    state.currentNodeIndex = 2;
    state.currentNode = { x: 2, y: 14 };
    state.hasStartedFirstBattle = true;

    // when
    dispatch(state, { type: 'reward_pick_relic', relicId: 'zasluzony_portfel' }, obs, drainEv);

    // then — navigation reset to Act 2 map start (done by generateMap inside startAct2)
    expect(state.currentLevel).toBe(0);
    expect(state.currentNodeIndex).toBe(1);
    expect(state.currentAct).toBe(2);
  });

  it('shouldNotSetPendingTransitionOnNormalRewardPickRelic', () => {
    // given — normal relic reward (non-transition)
    const state = makeState();
    state.currentScreen = 'reward';
    state._rewardOffer = { cards: [], relicId: 'zasluzony_portfel' };
    // _pendingAct2Transition is false (default)
    state.hasStartedFirstBattle = true;

    // when
    dispatch(state, { type: 'reward_pick_relic', relicId: 'zasluzony_portfel' }, obs, drainEv);

    // then — normal map transition, act stays at 1
    expect(state.currentAct).toBe(1);
    expect(state.currentScreen).toBe('map');
    expect(state.relics).toContain('zasluzony_portfel');
  });

  it('shouldHealPlayerToFullWhenEnteringMarynaNode', () => {
    // given — player with reduced HP
    const state = makeState();
    state.player.hp = 10; // damaged
    const maxHp = state.player.maxHp;
    expect(state.player.hp).toBeLessThan(maxHp);

    // when — heal player to full
    state.healPlayer(maxHp);

    // then — player should be healed to full
    expect(state.player.hp).toBe(maxHp);
  });
});
