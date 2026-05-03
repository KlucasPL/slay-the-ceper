import { cardLibrary } from '../data/cards.js';
import { marynaBoonLibrary } from '../data/marynaBoons.js';

/**
 * @param {{ maryna: { offeredIds: string[] }, filterPool: (kind: string, ids: string[]) => string[] }} state
 * @param {number} [count=3]
 * @returns {string[]}
 */
export function rollMarynaChoices(state, count = 3) {
  const basePool = Object.keys(marynaBoonLibrary);
  let pool = state.filterPool('boons', basePool);

  // Exclude previously picked boon (from Act 1) to prevent duplicates across acts
  if (state.maryna.pickedId && pool.includes(state.maryna.pickedId)) {
    pool = pool.filter((id) => id !== state.maryna.pickedId);
  }

  const result = [];
  const remaining = [...pool];
  const n = Math.min(count, remaining.length);
  for (let i = 0; i < n; i += 1) {
    const idx = Math.floor(state.rng() * remaining.length);
    result.push(remaining.splice(idx, 1)[0]);
  }
  state.maryna.offeredIds = result;
  if (result.length > 0) {
    state.emit('boon_offered', { boons: result.map((id) => ({ kind: 'boon', id })) });
  }
  return result;
}

/**
 * @param {{ maryna: { pickedId: string | null }, addRelic: (relicId: string) => boolean, _applyMarynaBoonImmediateEffects: (boonId: string) => void }} state
 * @param {string} boonId
 * @returns {boolean}
 */
export function pickMarynaBoon(state, boonId) {
  if (state.maryna.pickedId) return false;
  const boon = marynaBoonLibrary[boonId];
  if (!boon) return false;

  state.maryna.pickedId = boonId;
  state.addRelic(boon.relicId);
  state._applyMarynaBoonImmediateEffects(boonId);
  state.emit('boon_picked', { boon: { kind: 'boon', id: boonId } });
  return true;
}

/**
 * @param {{
 *   gainMaxHp: (amount: number) => void,
 *   addDutki: (amount: number) => void,
 *   deck: string[],
 *   removeCardFromDeck: (cardId: string) => boolean,
 *   maryna: { counters: { rosolBattlesLeft?: number } }
 * }} state
 * @param {string} boonId
 */
export function applyMarynaBoonImmediateEffects(state, boonId) {
  if (boonId === 'mokra_sciera') {
    state.gainMaxHp(7);
  } else if (boonId === 'kiesa') {
    state.addDutki(100);
  } else if (boonId === 'przeglad_plecaka') {
    const starterIds = ['ciupaga', 'gasior', 'kierpce', 'hej'];
    const startersInDeck = state.deck.filter((id) => starterIds.includes(id));
    if (startersInDeck.length > 0) {
      const toRemove = startersInDeck[Math.floor(state.rng() * startersInDeck.length)];
      state.removeCardFromDeck(toRemove);
    }
    const uncommonPool = Object.keys(cardLibrary).filter(
      (id) =>
        cardLibrary[id]?.rarity === 'uncommon' &&
        !cardLibrary[id]?.isStarter &&
        !cardLibrary[id]?.eventOnly &&
        !cardLibrary[id]?.tutorialOnly
    );
    if (uncommonPool.length > 0) {
      const pick = uncommonPool[Math.floor(state.rng() * uncommonPool.length)];
      state.deck.push(pick);
    }
    state.addDutki(80);
  } else if (boonId === 'sloik_rosolu') {
    state.maryna.counters.rosolBattlesLeft = 4;
  } else if (boonId === 'lista_zakupow') {
    state.addDutki(50);
    state.maryna.counters.listaFreeRemovalsLeft = 1;
  }
}
