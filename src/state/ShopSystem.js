import { cardLibrary } from '../data/cards.js';
import { relicLibrary } from '../data/relics.js';

/**
 * @param {{ dutki: number }} state
 * @returns {number}
 */
export function getPrestizNaKredytBlock(state) {
  const baseBlock = 6;
  const bonus = Math.min(14, Math.floor(state.dutki / 20) * 2);
  return baseBlock + bonus;
}

/**
 * @param {{ dutki: number, totalDutkiEarned: number }} state
 * @param {number} amount
 */
export function addDutki(state, amount) {
  if (amount <= 0) return;
  state.dutki += amount;
  state.totalDutkiEarned += amount;
}

/**
 * @param {{ dutki: number }} state
 * @param {number} cost
 * @returns {boolean}
 */
export function spendDutki(state, cost) {
  if (state.dutki < cost) return false;
  state.dutki -= cost;
  return true;
}

/**
 * @param {{
 *   hasRelic: (relicId: string) => boolean,
 *   certyfikowanyOscypekShopProcs: number,
 *   gainMaxHp: (amount: number) => void,
 *   maryna: { flags: { listaFirstShopUsed: boolean, listaDiscountActive: boolean, listaFreeRemovalAvailable: boolean } },
 *   difficulty: 'normal' | 'hard',
 *   hardFirstShopRolled: boolean,
 *   _buildAvailableRelicPool: () => string[],
 *   getRandomItem: (pool: string[], library: Record<string, { rarity?: 'common' | 'uncommon' | 'rare' }>) => string | null,
 *   _markRelicAsSeen: (relicId: string) => void,
 *   _pickUniqueItems: (pool: string[], library: Record<string, { rarity?: 'common' | 'uncommon' | 'rare' }>, count: number, rarityWeights?: { common: number, uncommon: number, rare: number }) => string[],
 *   shopStock: { cards: string[], relic: string | null },
 *   lastShopMessage: string
 * }} state
 * @returns {{ cards: string[], relic: string | null }}
 */
export function generateShopStock(state) {
  if (state.hasRelic('certyfikowany_oscypek') && state.certyfikowanyOscypekShopProcs < 3) {
    state.gainMaxHp(2);
    state.certyfikowanyOscypekShopProcs += 1;
  }

  const isListaFirstShopVisit =
    state.hasRelic('relic_boon_lista_zakupow') && !state.maryna.flags.listaFirstShopUsed;
  if (isListaFirstShopVisit) {
    state.maryna.flags.listaFirstShopUsed = true;
    state.maryna.flags.listaDiscountActive = true;
    state.maryna.flags.listaFreeRemovalAvailable = true;
  } else {
    state.maryna.flags.listaDiscountActive = false;
  }

  const cardPool = Object.keys(cardLibrary).filter(
    (id) =>
      !cardLibrary[id]?.isStarter && !cardLibrary[id]?.eventOnly && !cardLibrary[id]?.tutorialOnly
  );

  const relicPool = state
    ._buildAvailableRelicPool()
    .filter((id) => !relicLibrary[id]?.eventOnly && !relicLibrary[id]?.tutorialOnly);
  let relicId = null;
  const shouldForceHardPapryczka = state.difficulty === 'hard' && !state.hardFirstShopRolled;

  if (shouldForceHardPapryczka) {
    state.hardFirstShopRolled = true;
    if (relicPool.includes('papryczka_marka')) {
      relicId = 'papryczka_marka';
    }
  }

  if (!relicId) {
    relicId = state.getRandomItem(relicPool, relicLibrary);
  }

  if (relicId) {
    state._markRelicAsSeen(relicId);
  }

  state.shopStock = {
    cards: state._pickUniqueItems(cardPool, cardLibrary, 3),
    relic: relicId,
  };
  state.lastShopMessage = '';
  return state.shopStock;
}

/**
 * @param {{
 *   dutki: number,
 *   lastShopMessage: string,
 *   shopStock: { cards: string[], relic: string | null },
 *   deck: string[],
 *   hasRelic: (relicId: string) => boolean,
 *   addRelic: (relicId: string) => boolean
 * }} state
 * @param {import('../data/cards.js').CardDef | import('../data/relics.js').RelicDef} item
 * @param {'card' | 'relic'} type
 * @returns {{ success: boolean, message: string }}
 */
export function buyItem(state, item, type) {
  if (state.dutki < item.price) {
    state.lastShopMessage = 'Ni mos tela dutków, synek!';
    return { success: false, message: state.lastShopMessage };
  }

  if (type === 'card') {
    if (!state.shopStock.cards.includes(item.id)) {
      state.lastShopMessage = 'To już wykupione.';
      return { success: false, message: state.lastShopMessage };
    }
    state.dutki -= item.price;
    state.deck.push(item.id);
    state.shopStock.cards = state.shopStock.cards.filter((id) => id !== item.id);
    state.lastShopMessage = `Kupiono kartę: ${item.name}`;
    return { success: true, message: state.lastShopMessage };
  }

  if (state.shopStock.relic !== item.id || state.hasRelic(item.id)) {
    state.lastShopMessage = 'Tej pamiątki nie ma.';
    return { success: false, message: state.lastShopMessage };
  }
  state.dutki -= item.price;
  state.addRelic(item.id);
  state.shopStock.relic = null;
  state.lastShopMessage = `Kupiono pamiątkę: ${item.name}`;
  return { success: true, message: state.lastShopMessage };
}

/**
 * @param {{
 *   pendingBattleDutki: boolean,
 *   enemy: { isBankrupt?: boolean, isElite: boolean },
 *   hasRelic: (relicId: string) => boolean,
 *   player: { hp: number, maxHp: number },
 *   addDutki: (amount: number) => void,
 *   battleContext: 'map' | 'event' | 'debug' | 'tutorial',
 *   battleTurnsElapsed: number,
 *   healPlayer: (amount: number) => void,
 *   maryna: { flags: { kiesaFirstWinClaimed: boolean } }
 * }} state
 * @returns {number}
 */
export function grantBattleDutki(state) {
  if (!state.pendingBattleDutki) return 0;
  const base = 28 + Math.floor(Math.random() * 9);
  let drop =
    state.enemy.isBankrupt && state.hasRelic('magnes_na_lodowke') ? Math.floor(base * 1.5) : base;

  if (state.enemy.isElite) {
    drop = Math.floor(drop * 1.5);
  }

  if (
    state.hasRelic('szczegliwa_podkowa') &&
    state.player.hp <= Math.floor(state.player.maxHp * 0.4)
  ) {
    drop += 25;
  }

  state.addDutki(drop);
  state.pendingBattleDutki = false;

  if (state.hasRelic('zasluzony_portfel') && state.battleContext !== 'event') {
    state.addDutki(6);
    drop += 6;
  }

  if (state.hasRelic('termos_z_herbatka')) {
    if (state.battleTurnsElapsed <= 2) {
      state.healPlayer(4);
    } else {
      state.addDutki(15);
      drop += 15;
    }
  }

  if (
    state.hasRelic('relic_boon_kiesa') &&
    !state.maryna.flags.kiesaFirstWinClaimed &&
    state.battleContext !== 'event'
  ) {
    state.addDutki(20);
    drop += 20;
    state.maryna.flags.kiesaFirstWinClaimed = true;
  }

  return drop;
}
