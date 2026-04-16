import { cardLibrary } from '../data/cards.js';

const UPGRADEABLE_ATTACK_CARD_IDS = new Set([
  'ciupaga',
  'kierpce',
  'redyk',
  'zadyma',
  'janosik',
  'sandaly',
  'giewont',
]);

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
  const pool = Object.keys(cardLibrary).filter(
    (id) =>
      !cardLibrary[id]?.isStarter && !cardLibrary[id]?.eventOnly && !cardLibrary[id]?.tutorialOnly
  );
  return state._pickUniqueItems(pool, cardLibrary, count, CARD_REWARD_RARITY_WEIGHTS);
}

/**
 * @param {{ deck: string[], hand: string[], discard: string[], exhaust: string[] }} state
 * @param {string} cardId
 * @returns {boolean}
 */
export function removeCardFromDeck(state, cardId) {
  const removeFrom = (arr) => {
    const idx = arr.indexOf(cardId);
    if (idx >= 0) {
      arr.splice(idx, 1);
      return true;
    }
    return false;
  };

  return (
    removeFrom(state.deck) ||
    removeFrom(state.hand) ||
    removeFrom(state.discard) ||
    removeFrom(state.exhaust)
  );
}

/**
 * @param {{ cardDamageBonus: Record<string, number> }} state
 * @param {string} cardId
 * @param {number} amount
 */
export function upgradeCardDamage(state, cardId, amount = 3) {
  state.cardDamageBonus[cardId] = (state.cardDamageBonus[cardId] ?? 0) + amount;
}

/**
 * @param {{ cardDamageBonus: Record<string, number> }} state
 * @param {string} cardId
 * @returns {number}
 */
export function getCardDamageBonus(state, cardId) {
  return state.cardDamageBonus[cardId] ?? 0;
}

/**
 * @param {{ deck: string[], hand: string[], discard: string[], exhaust: string[] }} state
 * @returns {string[]}
 */
export function getUpgradeableAttackCards(state) {
  const pool = [...state.deck, ...state.hand, ...state.discard, ...state.exhaust];
  return [...new Set(pool.filter((id) => UPGRADEABLE_ATTACK_CARD_IDS.has(id)))];
}

/**
 * @param {{ deck: string[], hand: string[], discard: string[], exhaust: string[] }} state
 * @returns {string[]}
 */
export function getRunDeckCardIds(state) {
  const all = [...state.deck, ...state.hand, ...state.discard, ...state.exhaust];
  return all.filter((id) => cardLibrary[id] && cardLibrary[id].type !== 'status');
}
