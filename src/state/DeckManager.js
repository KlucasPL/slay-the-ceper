import {
  cardLibrary,
  createRuntimeCardId,
  getBaseCardId,
  getCardDefinition,
} from '../data/cards.js';

const CARD_REWARD_RARITY_WEIGHTS = {
  common: 0.6,
  uncommon: 0.25,
  rare: 0.15,
};

/**
 * @param {{ _pickUniqueItems: (pool: string[], library: Record<string, { rarity?: 'common' | 'uncommon' | 'rare' }>, count: number, rarityWeights?: { common: number, uncommon: number, rare: number }) => string[] }} state
 * @param {number} count
 * @returns {string[]}
 */
export function generateCardRewardChoices(state, count) {
  const basePool = Object.keys(cardLibrary).filter(
    (id) =>
      !cardLibrary[id]?.isStarter && !cardLibrary[id]?.eventOnly && !cardLibrary[id]?.tutorialOnly
  );
  const pool = state.filterPool('cards', basePool);
  const choices = state._pickUniqueItems(pool, cardLibrary, count, CARD_REWARD_RARITY_WEIGHTS);
  if (choices.length > 0) {
    state.emit('reward_offered', { entities: choices.map((id) => ({ kind: 'card', id })) });
  }
  return choices;
}

/**
 * @param {{ deck: string[], hand: string[], discard: string[], exhaust: string[] }} state
 * @param {string} cardId
 * @returns {boolean}
 */
export function removeCardFromDeck(state, cardId) {
  const targetBaseId = getBaseCardId(cardId);

  const removeFrom = (arr) => {
    const idx = arr.findIndex((entry) => getBaseCardId(entry) === targetBaseId);
    if (idx >= 0) {
      arr.splice(idx, 1);
      return true;
    }
    return false;
  };

  const removed =
    removeFrom(state.deck) ||
    removeFrom(state.hand) ||
    removeFrom(state.discard) ||
    removeFrom(state.exhaust);

  if (removed) {
    state.emit('deck_mutation', { mutation: 'remove', card: { kind: 'card', id: targetBaseId } });
  }
  return removed;
}

/**
 * @param {{ deck: string[], hand: string[], discard: string[], exhaust: string[], cardDamageBonus: Record<string, number>, nextRuntimeCardInstanceId: number }} state
 * @param {string} cardId
 * @param {number} amount
 */
export function upgradeCardDamage(state, cardId, amount = 3) {
  const targetBaseId = getBaseCardId(cardId);
  const piles = [state.deck, state.hand, state.discard, state.exhaust];
  let runtimeCardId = null;

  for (const pile of piles) {
    const pileIndex = pile.findIndex((entry) => getBaseCardId(entry) === targetBaseId);
    if (pileIndex < 0) continue;

    runtimeCardId = pile[pileIndex];
    if (runtimeCardId === targetBaseId) {
      runtimeCardId = createRuntimeCardId(targetBaseId, state.nextRuntimeCardInstanceId);
      state.nextRuntimeCardInstanceId += 1;
      pile[pileIndex] = runtimeCardId;
    }
    break;
  }

  if (!runtimeCardId) return;

  state.cardDamageBonus[runtimeCardId] = (state.cardDamageBonus[runtimeCardId] ?? 0) + amount;
  state.emit('deck_mutation', {
    mutation: 'upgrade',
    card: { kind: 'card', id: getBaseCardId(runtimeCardId) },
    amount,
  });
}

/**
 * @param {{ cardDamageBonus: Record<string, number>, activeRuntimeCardId?: string | null }} state
 * @param {string} cardId
 * @returns {number}
 */
export function getCardDamageBonus(state, cardId) {
  if (state.cardDamageBonus[cardId] !== undefined) {
    return state.cardDamageBonus[cardId];
  }

  const activeRuntimeCardId = state.activeRuntimeCardId ?? null;
  if (activeRuntimeCardId && getBaseCardId(activeRuntimeCardId) === getBaseCardId(cardId)) {
    return state.cardDamageBonus[activeRuntimeCardId] ?? 0;
  }

  return 0;
}

/**
 * @param {{ deck: string[], hand: string[], discard: string[], exhaust: string[] }} state
 * @returns {string[]}
 */
export function getUpgradeableAttackCards(state) {
  const pool = [...state.deck, ...state.hand, ...state.discard, ...state.exhaust];
  return [
    ...new Set(
      pool
        .map((id) => getBaseCardId(id))
        .filter((id) => {
          const card = cardLibrary[id];
          return (
            card &&
            card.type === 'attack' &&
            !card.unplayable &&
            !card.eventOnly &&
            !card.tutorialOnly
          );
        })
    ),
  ];
}

/**
 * @param {{ deck: string[], hand: string[], discard: string[], exhaust: string[] }} state
 * @returns {string[]}
 */
export function getRunDeckCardIds(state) {
  const all = [...state.deck, ...state.hand, ...state.discard, ...state.exhaust];
  return all
    .map((id) => getBaseCardId(id))
    .filter((id) => {
      const card = getCardDefinition(id);
      return card && card.type !== 'status';
    });
}
