import { cardLibrary } from '../data/cards.js';
import { marynaBoonLibrary, rollMarynaChoices as rollMarynaBoonIds } from '../data/marynaBoons.js';

/**
 * @param {{ maryna: { offeredIds: string[] } }} state
 * @param {number} [count=3]
 * @returns {string[]}
 */
export function rollMarynaChoices(state, count = 3) {
  const ids = rollMarynaBoonIds(count);
  state.maryna.offeredIds = ids;
  return ids;
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
    state.gainMaxHp(12);
  } else if (boonId === 'kiesa') {
    state.addDutki(80);
  } else if (boonId === 'przeglad_plecaka') {
    const starterIds = ['ciupaga', 'gasior', 'kierpce', 'hej'];
    const startersInDeck = state.deck.filter((id) => starterIds.includes(id));
    if (startersInDeck.length > 0) {
      const toRemove = startersInDeck[Math.floor(Math.random() * startersInDeck.length)];
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
      const pick = uncommonPool[Math.floor(Math.random() * uncommonPool.length)];
      state.deck.push(pick);
    }
  } else if (boonId === 'sloik_rosolu') {
    state.maryna.counters.rosolBattlesLeft = 3;
  }
}
