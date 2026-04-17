import { relicLibrary } from '../data/relics.js';

const RARITY_WEIGHTS = {
  common: 0.7,
  uncommon: 0.25,
  rare: 0.05,
};

/**
 * @param {{ relics: string[] }} state
 * @param {string} relicId
 * @returns {boolean}
 */
export function hasRelic(state, relicId) {
  return state.relics.includes(relicId);
}

/**
 * @param {{ _buildAvailableRelicPool: () => string[], getRandomItem: (pool: string[], library: Record<string, { rarity?: 'common' | 'uncommon' | 'rare' }>) => string | null, _markRelicAsSeen: (relicId: string) => void, addRelic: (relicId: string) => boolean }} state
 * @returns {string | null}
 */
export function grantTreasureRelic(state) {
  const pool = state._buildAvailableRelicPool();
  if (pool.length === 0) return null;
  const relicId = state.getRandomItem(pool, relicLibrary);
  if (!relicId) return null;
  state._markRelicAsSeen(relicId);
  state.addRelic(relicId);
  return relicId;
}

/**
 * @param {{ _buildAvailableRelicPool: () => string[], getRandomItem: (pool: string[], library: Record<string, { rarity?: 'common' | 'uncommon' | 'rare' }>) => string | null, _markRelicAsSeen: (relicId: string) => void }} state
 * @param {boolean} [forceDrop=false]
 * @returns {string | null}
 */
export function generateRelicReward(state, forceDrop = false) {
  const relicChance = 0.33;
  if (!forceDrop && state.rng() >= relicChance) return null;

  const pool = state._buildAvailableRelicPool();
  if (pool.length === 0) return null;
  const relicId = state.getRandomItem(pool, relicLibrary);
  if (!relicId) return null;
  state._markRelicAsSeen(relicId);
  state.emit('reward_offered', { entities: [{ kind: 'relic', id: relicId }] });
  return relicId;
}

/**
 * @param {{ _buildAvailableRelicPool: () => string[], _pickUniqueItems: (pool: string[], library: Record<string, { rarity?: 'common' | 'uncommon' | 'rare' }>, count: number, rarityWeights?: { common: number, uncommon: number, rare: number }) => string[], _markRelicAsSeen: (relicId: string) => void }} state
 * @param {number} count
 * @returns {string[]}
 */
export function generateRelicChoices(state, count) {
  const pool = state._buildAvailableRelicPool();
  if (pool.length < count) return [];

  const choices = state._pickUniqueItems(pool, relicLibrary, count);
  choices.forEach((relicId) => state._markRelicAsSeen(relicId));
  return choices;
}

/**
 * @param {{ relics: string[], seenRelicOffers: string[] }} state
 * @returns {string[]}
 */
export function buildAvailableRelicPool(state) {
  const basePool = Object.keys(relicLibrary).filter(
    (id) =>
      !state.relics.includes(id) &&
      !state.seenRelicOffers.includes(id) &&
      !relicLibrary[id]?.eventOnly &&
      !relicLibrary[id]?.tutorialOnly &&
      !relicLibrary[id]?.marynaOnly
  );
  return state.filterPool('relics', basePool);
}

/**
 * @param {{ seenRelicOffers: string[] }} state
 * @param {string} relicId
 */
export function markRelicAsSeen(state, relicId) {
  if (!state.seenRelicOffers.includes(relicId)) {
    state.seenRelicOffers.push(relicId);
  }
}

/**
 * @param {string[]} pool
 * @param {Record<string, { rarity?: 'common' | 'uncommon' | 'rare' }>} library
 * @param {{ common: number, uncommon: number, rare: number }} [rarityWeights]
 * @param {() => number} [rng]
 * @returns {string | null}
 */
export function getRandomItem(pool, library, rarityWeights = RARITY_WEIGHTS, rng = Math.random) {
  if (!pool || pool.length === 0) return null;

  const byRarity = {
    common: [],
    uncommon: [],
    rare: [],
  };

  pool.forEach((id) => {
    const rarity = library[id]?.rarity ?? 'common';
    byRarity[rarity].push(id);
  });

  const rarityPool = /** @type {Array<'common' | 'uncommon' | 'rare'>} */ (
    Object.keys(byRarity).filter((rarity) => byRarity[rarity].length > 0)
  );
  if (rarityPool.length === 0) return null;

  const weightSum = rarityPool.reduce((sum, rarity) => sum + rarityWeights[rarity], 0);
  let roll = rng() * weightSum;

  let selectedRarity = rarityPool[rarityPool.length - 1];
  for (const rarity of rarityPool) {
    roll -= rarityWeights[rarity];
    if (roll < 0) {
      selectedRarity = rarity;
      break;
    }
  }

  const rarityItems = byRarity[selectedRarity];
  return rarityItems[Math.floor(rng() * rarityItems.length)] ?? null;
}

/**
 * @param {{ getRandomItem: (pool: string[], library: Record<string, { rarity?: 'common' | 'uncommon' | 'rare' }>, rarityWeights?: { common: number, uncommon: number, rare: number }) => string | null }} state
 * @param {string[]} pool
 * @param {Record<string, { rarity?: 'common' | 'uncommon' | 'rare' }>} library
 * @param {number} count
 * @param {{ common: number, uncommon: number, rare: number }} [rarityWeights]
 * @returns {string[]}
 */
export function pickUniqueItems(state, pool, library, count, rarityWeights = RARITY_WEIGHTS) {
  const remaining = [...pool];
  const picks = [];

  while (remaining.length > 0 && picks.length < count) {
    const id = state.getRandomItem(remaining, library, rarityWeights);
    if (!id) break;
    picks.push(id);
    const idx = remaining.indexOf(id);
    if (idx >= 0) remaining.splice(idx, 1);
  }

  return picks;
}

/**
 * @param {{ relics: string[], _markRelicAsSeen: (relicId: string) => void, gainMaxHp: (amount: number) => void, hasRelic: (relicId: string) => boolean }} state
 * @param {string} relicId
 * @returns {boolean}
 */
export function addRelic(state, relicId) {
  if (!relicLibrary[relicId] || state.hasRelic(relicId)) return false;

  state.relics.push(relicId);
  state._markRelicAsSeen(relicId);

  if (relicId === 'pas_bacowski') {
    state.gainMaxHp(6);
  }

  state.emit('relic_gained', { relic: { kind: 'relic', id: relicId } });

  return true;
}
