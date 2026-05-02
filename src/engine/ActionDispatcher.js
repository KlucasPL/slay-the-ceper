import { getLegalActions, IllegalActionError } from './LegalActions.js';
import { cardLibrary } from '../data/cards.js';
import { relicLibrary } from '../data/relics.js';

/**
 * @typedef {{ type: 'play_card', handIndex: number }} PlayCardAction
 * @typedef {{ type: 'end_turn' }} EndTurnAction
 * @typedef {{ type: 'smycz_toggle', handIndex: number | null }} SmyczToggleAction
 * @typedef {{ type: 'travel', level: number, nodeIndex: number }} TravelAction
 * @typedef {{ type: 'reward_pick_card', cardId: string | null }} RewardPickCardAction
 * @typedef {{ type: 'reward_pick_relic', relicId: string }} RewardPickRelicAction
 * @typedef {{ type: 'shop_buy_card', cardId: string }} ShopBuyCardAction
 * @typedef {{ type: 'shop_buy_relic', relicId: string }} ShopBuyRelicAction
 * @typedef {{ type: 'shop_remove_card', cardId: string }} ShopRemoveCardAction
 * @typedef {{ type: 'shop_leave' }} ShopLeaveAction
 * @typedef {{ type: 'campfire', option: 'rest' | 'leave' } | { type: 'campfire', option: 'upgrade', cardId: string }} CampfireAction
 * @typedef {{ type: 'event_choice', choiceIndex: number }} EventChoiceAction
 * @typedef {{ type: 'maryna_pick', boonId: string }} MarynaPickAction
 *
 * @typedef {PlayCardAction | EndTurnAction | SmyczToggleAction | TravelAction |
 *   RewardPickCardAction | RewardPickRelicAction |
 *   ShopBuyCardAction | ShopBuyRelicAction | ShopRemoveCardAction | ShopLeaveAction |
 *   CampfireAction | EventChoiceAction | MarynaPickAction} Action
 *
 * @typedef {{ observation: import('./Observation.js').Observation, events: import('./EngineEvents.js').EngineEvent[], done: boolean, outcome?: 'player_win' | 'enemy_win' }} ActionResult
 */

/**
 * Dispatch an action to the appropriate GameState method(s).
 * Throws IllegalActionError if the action is not in the current legal set.
 * @param {import('../state/GameState.js').GameState} state
 * @param {Action} action
 * @param {(state: import('../state/GameState.js').GameState) => import('./Observation.js').Observation} buildObservation
 * @param {(state: import('../state/GameState.js').GameState) => import('./EngineEvents.js').EngineEvent[]} drainEvents
 * @returns {ActionResult}
 */
export function dispatch(state, action, buildObservation, drainEvents) {
  _assertLegal(state, action);
  _execute(state, action);

  const done = !!state.runSummary;
  const outcome = state.runSummary?.outcome ?? undefined;
  return {
    observation: buildObservation(state),
    events: drainEvents(state),
    done,
    outcome,
  };
}

/**
 * @param {import('../state/GameState.js').GameState} state
 * @param {Action} action
 */
function _assertLegal(state, action) {
  const legal = getLegalActions(state);
  const match = legal.find((a) => _actionsEqual(a, action));
  if (!match) {
    throw new IllegalActionError(
      `Action ${JSON.stringify(action)} is not legal in phase "${state.currentScreen}"`
    );
  }
}

/**
 * @param {Action} a
 * @param {Action} b
 * @returns {boolean}
 */
function _actionsEqual(a, b) {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case 'play_card':
      return a.handIndex === /** @type {PlayCardAction} */ (b).handIndex;
    case 'end_turn':
      return true;
    case 'smycz_toggle':
      return a.handIndex === /** @type {SmyczToggleAction} */ (b).handIndex;
    case 'travel':
      return (
        a.level === /** @type {TravelAction} */ (b).level &&
        a.nodeIndex === /** @type {TravelAction} */ (b).nodeIndex
      );
    case 'reward_pick_card':
      return a.cardId === /** @type {RewardPickCardAction} */ (b).cardId;
    case 'reward_pick_relic':
      return a.relicId === /** @type {RewardPickRelicAction} */ (b).relicId;
    case 'shop_buy_card':
      return a.cardId === /** @type {ShopBuyCardAction} */ (b).cardId;
    case 'shop_buy_relic':
      return a.relicId === /** @type {ShopBuyRelicAction} */ (b).relicId;
    case 'shop_remove_card':
      return a.cardId === /** @type {ShopRemoveCardAction} */ (b).cardId;
    case 'shop_leave':
      return true;
    case 'campfire': {
      const ba = /** @type {CampfireAction} */ (b);
      if (a.option !== ba.option) return false;
      if (a.option === 'upgrade')
        return (
          a.cardId ===
          /** @type {{ type: 'campfire', option: 'upgrade', cardId: string }} */ (ba).cardId
        );
      return true;
    }
    case 'event_choice':
      return a.choiceIndex === /** @type {EventChoiceAction} */ (b).choiceIndex;
    case 'maryna_pick':
      return a.boonId === /** @type {MarynaPickAction} */ (b).boonId;
    default:
      return false;
  }
}

/**
 * Execute the action — mutates state.
 * @param {import('../state/GameState.js').GameState} state
 * @param {Action} action
 */
function _execute(state, action) {
  switch (action.type) {
    case 'play_card':
      state.playCard(action.handIndex);
      _checkWin(state);
      break;

    case 'end_turn':
      state.endTurn();
      _checkWin(state);
      // Complete the turn cycle: advance to next player turn unless terminal
      if (!state.runSummary) state.startTurn();
      break;

    case 'smycz_toggle':
      state.setSmyczKeptCard(action.handIndex);
      break;

    case 'travel': {
      state.travelTo(action.level, action.nodeIndex);
      const node = state.getCurrentMapNode();
      if (node) _enterNode(state, node);
      break;
    }

    case 'reward_pick_card':
      if (action.cardId) {
        state.deck.push(action.cardId);
        state.notifyRewardPicked?.('card', action.cardId);
      }
      state._rewardOffer = null;
      state.currentScreen = 'map';
      break;

    case 'reward_pick_relic':
      state.addRelic(action.relicId);
      state.notifyRewardPicked?.('relic', action.relicId);
      state._rewardOffer = null;
      if (state._pendingAct2Transition) {
        state._pendingAct2Transition = false;
        state.startAct2?.();
        // generateMap() resets hasStartedFirstBattle=false for the UI intro gate,
        // but the headless engine skips intro — re-enable map travel immediately.
        state.hasStartedFirstBattle = true;
      } else {
        state.currentScreen = 'map';
      }
      break;

    case 'shop_buy_card': {
      const card = cardLibrary[action.cardId];
      if (card) state.buyItem(card, 'card');
      break;
    }

    case 'shop_buy_relic': {
      const relic = relicLibrary[action.relicId];
      if (relic) state.buyItem(relic, 'relic');
      break;
    }

    case 'shop_remove_card':
      if (state.spendDutki(state.getShopRemovalPrice())) {
        state.removeCardFromDeck(action.cardId);
        state.afterShopCardRemoval();
      }
      break;

    case 'shop_leave':
      state._inShop = false;
      state.currentScreen = 'map';
      break;

    case 'campfire':
      if (action.option === 'rest') {
        const heal = Math.floor(state.player.maxHp * 0.3);
        state.healPlayer(heal);
      } else if (action.option === 'upgrade') {
        state.upgradeCardDamage(action.cardId);
      }
      state.notifyCampfireChoice?.(
        action.option,
        action.option === 'upgrade' ? action.cardId : undefined
      );
      state._inCampfire = false;
      state.currentScreen = 'map';
      break;

    case 'event_choice':
      state.applyActiveEventChoice(action.choiceIndex);
      _checkWin(state);
      break;

    case 'maryna_pick':
      state.pickMarynaBoon(action.boonId);
      state.currentScreen = 'map';
      break;

    default:
      throw new IllegalActionError(`Unknown action type: ${/** @type {any} */ (action).type}`);
  }
}

/**
 * Check win condition and handle outcomes:
 * - enemy_win: always terminal → capture run summary.
 * - player_win on boss node: terminal → capture run summary.
 * - player_win on non-boss node: battle win only → grant dutki, build reward offer,
 *   set _rewardOffer, emit reward_offered, switch to reward screen.
 * @param {import('../state/GameState.js').GameState} state
 */
function _checkWin(state) {
  if (state.runSummary) return;
  const result = state.checkWinCondition?.();
  if (!result) return;

  if (result === 'enemy_win') {
    state.captureRunSummary('enemy_win');
    return;
  }

  // player_win — check if this is a boss node (run-ending victory)
  const currentNode = state.getCurrentMapNode?.();
  const isBoss =
    currentNode?.type === 'boss' || state.enemy?.id === 'boss' || state.enemy?.id === 'fiakier';

  if (isBoss) {
    // Act 1 boss: transition to Act 2 instead of ending the run
    if (state.tryAdvanceActAfterBossVictory?.()) {
      state.grantBattleDutki?.();
      const relicIds = state.generateAct2TransitionRelicChoices?.(3) ?? [];
      if (relicIds.length === 0) {
        state.startAct2?.();
        state.hasStartedFirstBattle = true;
        return;
      }
      state._rewardOffer = { cards: [], relicIds };
      state._pendingAct2Transition = true;
      state.currentScreen = 'reward';
      state.emit?.('reward_offered', {
        cards: [],
        relics: relicIds.map((id) => ({ kind: 'relic', id })),
      });
      return;
    }
    state.captureRunSummary('player_win');
    return;
  }

  // Non-boss battle win: grant dutki and present reward screen
  state.grantBattleDutki?.();
  const cards = state.generateCardRewardChoices?.(3) ?? [];
  const relicId = state.generateRelicReward?.() ?? null;
  state._rewardOffer = { cards, relicId };
  state.currentScreen = 'reward';
  state.emit?.('reward_offered', {
    cards: cards.map((id) => ({ kind: 'card', id })),
    relic: relicId ? { kind: 'relic', id: relicId } : null,
  });
}

/**
 * Handle entering a map node — sets appropriate screen/flags.
 * @param {import('../state/GameState.js').GameState} state
 * @param {{ type: string }} node
 */
function _enterNode(state, node) {
  switch (node.type) {
    case 'fight':
    case 'elite':
    case 'boss': {
      // First battle of a run was already initialized by resetForNewRun; subsequent
      // battles need resetBattle to rebuild deck, pick enemy, and start the turn.
      if (state._enginePendingBattle) {
        state._enginePendingBattle = false;
      } else {
        state.resetBattle();
      }
      state.currentScreen = 'battle';
      break;
    }
    case 'shop':
      state.generateShopStock();
      state._inShop = true;
      state.currentScreen = 'shop';
      break;
    case 'campfire':
      state._inCampfire = true;
      state.currentScreen = 'campfire';
      break;
    case 'treasure':
      state.grantTreasureRelic();
      state.currentScreen = 'map';
      break;
    case 'event': {
      const eventDef = state.pickRandomEventDef();
      if (eventDef) state.setActiveEvent(eventDef.id);
      state.currentScreen = 'event';
      break;
    }
    case 'maryna':
      // Player is always healed to full health when entering Maryna
      state.healPlayer(state.player.maxHp);
      state.rollMarynaChoices();
      state.currentScreen = 'maryna';
      break;
    default:
      state.currentScreen = 'map';
  }
}
