import { describe, it, expect } from 'vitest';
import { getLegalActions } from '../../src/engine/LegalActions.js';
import { GameState } from '../../src/state/GameState.js';
import { characters } from '../../src/data/characters.js';
import { enemyLibrary } from '../../src/data/enemies.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBattleState(overrides = {}) {
  const state = new GameState(characters.jedrek, enemyLibrary.cepr);
  state.currentScreen = 'battle';
  state.combat = {
    activeSide: 'player',
    firstAttackUsed: false,
    playerAttackMissCheck: false,
    playerAttackMissRolled: false,
    playerAttackMissed: false,
    missEventTarget: null,
  };
  state.player.energy = 3;
  state.player.stunned = false;
  state.player.cardsPlayedThisTurn = 0;
  state.hand = ['ciupaga', 'gasior', 'ciupaga'];
  state.runSummary = null;
  Object.assign(state, overrides);
  return state;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getLegalActions — battle phase', () => {
  it('shouldIncludePlayableCardsAndEndTurn', () => {
    // given
    const state = makeBattleState();

    // when
    const actions = getLegalActions(state);

    // then
    const playCards = actions.filter((a) => a.type === 'play_card');
    expect(playCards).toHaveLength(3);
    expect(actions.some((a) => a.type === 'end_turn')).toBe(true);
  });

  it('shouldExcludeCardsWhenEnergyInsufficient', () => {
    // given
    const state = makeBattleState();
    state.player.energy = 0;

    // when
    const actions = getLegalActions(state);

    // then
    expect(actions.filter((a) => a.type === 'play_card')).toHaveLength(0);
    expect(actions.some((a) => a.type === 'end_turn')).toBe(true);
  });

  it('shouldReturnOnlyEndTurnWhenPlayerIsStunned', () => {
    // given
    const state = makeBattleState();
    state.player.stunned = true;

    // when
    const actions = getLegalActions(state);

    // then
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('end_turn');
  });

  it('shouldExcludeAllPlayCardActionsWhenBlokadaParkingowaNaIsActiveAndThreeCardsPlayed', () => {
    // given — enemy with blokada_parkingowa passive, player has played 3 cards
    const state = makeBattleState();
    state.enemy = { ...enemyLibrary.cepr, passive: 'blokada_parkingowa' };
    state.player.cardsPlayedThisTurn = 3;

    // when
    const actions = getLegalActions(state);

    // then — no play_card actions, only end_turn
    const playCards = actions.filter((a) => a.type === 'play_card');
    expect(playCards).toHaveLength(0);
    expect(actions.some((a) => a.type === 'end_turn')).toBe(true);
  });

  it('shouldAllowPlayCardWhenBlokadaActiveButOnlyTwoCardsPlayed', () => {
    // given
    const state = makeBattleState();
    state.enemy = { ...enemyLibrary.cepr, passive: 'blokada_parkingowa' };
    state.player.cardsPlayedThisTurn = 2;

    // when
    const actions = getLegalActions(state);

    // then — cards still allowed (limit is >= 3)
    expect(actions.filter((a) => a.type === 'play_card').length).toBeGreaterThan(0);
  });

  it('shouldAllowPlayCardWhenEnemyHasNoBlokadaPassiveRegardlessOfCardsPlayed', () => {
    // given — no blokada, player played many cards
    const state = makeBattleState();
    state.player.cardsPlayedThisTurn = 10;

    // when
    const actions = getLegalActions(state);

    // then — still legal to play cards
    expect(actions.filter((a) => a.type === 'play_card').length).toBeGreaterThan(0);
  });
});

describe('getLegalActions — Act 2 transition reward screen', () => {
  function makeAct2TransitionState(relicIds = ['relic_a', 'relic_b', 'relic_c']) {
    const state = new GameState(characters.jedrek, enemyLibrary.cepr);
    state.currentScreen = 'reward';
    state.runSummary = null;
    state._rewardOffer = { cards: [], relicIds };
    state._pendingAct2Transition = true;
    return state;
  }

  it('shouldExposeOneActionPerRelicChoice', () => {
    // given
    const state = makeAct2TransitionState(['zasluzony_portfel', 'bilet_tpn', 'baca_hat']);

    // when
    const actions = getLegalActions(state);

    // then — 3 relic picks, no skip
    const relicPicks = actions.filter((a) => a.type === 'reward_pick_relic');
    expect(relicPicks).toHaveLength(3);
    expect(relicPicks.map((a) => a.relicId)).toEqual([
      'zasluzony_portfel',
      'bilet_tpn',
      'baca_hat',
    ]);
  });

  it('shouldNotIncludeSkipActionDuringTransition', () => {
    // given
    const state = makeAct2TransitionState(['zasluzony_portfel']);

    // when
    const actions = getLegalActions(state);

    // then — no reward_pick_card (skip) action
    expect(actions.some((a) => a.type === 'reward_pick_card')).toBe(false);
  });

  it('shouldIncludeSkipActionOnNormalRewardScreen', () => {
    // given — normal post-battle reward, no transition flag
    const state = new GameState(characters.jedrek, enemyLibrary.cepr);
    state.currentScreen = 'reward';
    state.runSummary = null;
    state._rewardOffer = { cards: ['ciupaga'], relicId: null };
    // _pendingAct2Transition not set (undefined = falsy)

    // when
    const actions = getLegalActions(state);

    // then — skip (null cardId) IS present
    expect(actions.some((a) => a.type === 'reward_pick_card' && a.cardId === null)).toBe(true);
  });
});
