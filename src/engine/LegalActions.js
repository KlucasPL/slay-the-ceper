import { getCardDefinition, cardLibrary } from '../data/cards.js';
import { relicLibrary } from '../data/relics.js';

/**
 * @typedef {import('./ActionDispatcher.js').Action} Action
 */

/**
 * Custom error for illegal actions — transports map this to JSON-RPC -32001.
 */
export class IllegalActionError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = 'IllegalActionError';
    this.code = -32001;
  }
}

/**
 * Compute the complete list of legal actions for the current game state.
 * Returns only actions that are guaranteed to succeed when dispatched.
 * @param {import('../state/GameState.js').GameState} state
 * @returns {Action[]}
 */
export function getLegalActions(state) {
  if (state.runSummary) return [];

  switch (state.currentScreen) {
    case 'battle':
      return _battleActions(state);
    case 'map':
      return _mapActions(state);
    default:
      return _screenActions(state);
  }
}

/**
 * @param {import('../state/GameState.js').GameState} state
 * @returns {Action[]}
 */
function _battleActions(state) {
  if (state.combat.activeSide !== 'player') return [];
  if (state.player.stunned) return [{ type: 'end_turn' }];

  /** @type {Action[]} */
  const actions = [];

  const hasSmycz = state.hasRelic('smycz_zakopane');
  const blokadaBlocked =
    state.enemy?.passive === 'blokada_parkingowa' && state.player.cardsPlayedThisTurn >= 3;

  for (let i = 0; i < state.hand.length; i++) {
    const cardId = state.hand[i];
    const cost = state.getCardCostInHand(cardId);
    const card = getCardDefinition(cardId);
    if (!card) continue;
    if (card.unplayable) continue;
    if (!blokadaBlocked && cost <= state.player.energy) {
      actions.push({ type: 'play_card', handIndex: i });
    }
    if (hasSmycz) {
      actions.push({ type: 'smycz_toggle', handIndex: i });
    }
  }

  if (hasSmycz) {
    actions.push({ type: 'smycz_toggle', handIndex: null });
  }

  actions.push({ type: 'end_turn' });
  return actions;
}

/**
 * @param {import('../state/GameState.js').GameState} state
 * @returns {Action[]}
 */
function _mapActions(state) {
  /** @type {Action[]} */
  const actions = [];

  const currentNode = state.getCurrentMapNode();
  if (!currentNode) return actions;

  for (const nodeIndex of currentNode.connections) {
    const level = state.currentLevel + 1;
    if (state.canTravelTo(level, nodeIndex)) {
      actions.push({ type: 'travel', level, nodeIndex });
    }
  }

  return actions;
}

/**
 * @param {import('../state/GameState.js').GameState} state
 * @returns {Action[]}
 */
function _screenActions(state) {
  /** @type {Action[]} */
  const actions = [];

  // Reward screen — _rewardOffer is set by EngineController after victory
  if (state._rewardOffer) {
    for (const cardId of state._rewardOffer.cards ?? []) {
      actions.push({ type: 'reward_pick_card', cardId });
    }
    if (state._rewardOffer.relicId) {
      actions.push({ type: 'reward_pick_relic', relicId: state._rewardOffer.relicId });
    }
    actions.push({ type: 'reward_pick_card', cardId: null });
    return actions;
  }

  // Shop screen — only include purchases the player can currently afford
  if (state._inShop) {
    const dutki = state.dutki ?? 0;
    for (const cardId of state.shopStock.cards ?? []) {
      const price = cardLibrary[cardId]?.price ?? Infinity;
      if (dutki >= price) actions.push({ type: 'shop_buy_card', cardId });
    }
    if (state.shopStock.relic) {
      const relicPrice = relicLibrary[state.shopStock.relic]?.price ?? Infinity;
      if (dutki >= relicPrice)
        actions.push({ type: 'shop_buy_relic', relicId: state.shopStock.relic });
    }
    const removalPrice = state.getShopRemovalPrice?.() ?? Infinity;
    if (dutki >= removalPrice) {
      const runDeck = state.getRunDeckCardIds?.() ?? [];
      for (const cardId of runDeck) {
        actions.push({ type: 'shop_remove_card', cardId });
      }
    }
    actions.push({ type: 'shop_leave' });
    return actions;
  }

  // Campfire screen
  if (state._inCampfire) {
    actions.push({ type: 'campfire', option: 'rest' });
    actions.push({ type: 'campfire', option: 'leave' });
    const upgradeable = state.getUpgradeableAttackCards?.() ?? [];
    for (const cardId of upgradeable) {
      actions.push({ type: 'campfire', option: 'upgrade', cardId });
    }
    return actions;
  }

  // Event screen
  if (state.activeEventId) {
    const def = state.getActiveEventDef();
    if (def) {
      for (let i = 0; i < def.choices.length; i++) {
        actions.push({ type: 'event_choice', choiceIndex: i });
      }
    }
    return actions;
  }

  // Maryna boon pick
  if (state.maryna?.offeredIds?.length && !state.maryna.pickedId) {
    for (const boonId of state.maryna.offeredIds) {
      actions.push({ type: 'maryna_pick', boonId });
    }
    return actions;
  }

  return actions;
}
