import { getBaseCardId, getCardDefinition } from '../data/cards.js';

/**
 * @typedef {import('../data/cards.js').StatusDef} StatusDef
 * @typedef {{ hp: number, maxHp: number, block: number, energy: number, maxEnergy: number, status: StatusDef, stunned: boolean, cardsPlayedThisTurn: number, szal_bacy?: boolean, goralski_upor_moc?: boolean, koncesja_na_oscypki?: boolean, zimna_krew?: boolean, czas_na_fajke?: boolean, goralska_goscinnosc?: boolean, pan_na_wlosciach?: boolean, weather_fog_garda?: boolean, weather_frozen_vulnerable?: boolean, lans?: number }} PlayerState
 * @typedef {{ id: string, hp: number, block: number, status: StatusDef, passive: string | null, portraitShameTurns: number }} EnemyState
 */

/**
 * @param {{ nextAttackCardBonus: number }} state
 * @param {number} amount
 */
export function queueNextAttackCardBonus(state, amount) {
  if (amount <= 0) return;
  state.nextAttackCardBonus += amount;
}

/**
 * @param {{ currentWeather: string }} state
 * @param {PlayerState | EnemyState} entity
 */
export function applyHalnyBlockDrain(state, entity) {
  if (state.currentWeather !== 'halny') return;
  const drain = entity === state.player && state.hasRelic('goralska_skora') ? 1 : 2;
  entity.block = Math.max(0, entity.block - drain);
}

/**
 * @param {{ player: PlayerState }} state
 * @param {number} amount
 */
export function gainMaxHp(state, amount) {
  if (amount <= 0) return;
  state.player.maxHp += amount;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + amount);
}

/**
 * @param {{ player: PlayerState, hasRelic: (relicId: string) => boolean }} state
 * @param {number} amount
 */
export function healPlayer(state, amount) {
  const effectiveAmount = state.hasRelic('dzwonek_owcy') ? Math.min(2, amount) : amount;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + effectiveAmount);
  // dzban_mleka: gain +1 energy per 3 HP healed (max 2/turn)
  if (state.hasRelic('dzban_mleka') && effectiveAmount > 0) {
    const grant = Math.min(
      Math.floor(effectiveAmount / 3),
      2 - (state.dzbanEnergyGrantedThisTurn ?? 0)
    );
    if (grant > 0) {
      state.player.energy += grant;
      state.dzbanEnergyGrantedThisTurn = (state.dzbanEnergyGrantedThisTurn ?? 0) + grant;
    }
  }
}

/**
 * @param {{ hasRelic: (relicId: string) => boolean, flaszkaCostSeed: Record<string, number>, zegarekFreeSkillAvailable: boolean }} state
 * @param {string} cardId
 * @returns {number}
 */
export function getCardCostInHand(state, cardId) {
  if (state.hasRelic('flaszka_sliwowicy') && cardId in state.flaszkaCostSeed) {
    return state.flaszkaCostSeed[cardId];
  }
  const card = getCardDefinition(cardId);
  const baseCardId = getBaseCardId(cardId);
  if (state.zegarekFreeSkillAvailable && card?.type === 'skill') {
    return 0;
  }
  if (
    state.hasRelic('ciupaga_ekspresowa') &&
    !state.ciupagaExpresowaTurnUsed &&
    card?.type === 'skill'
  ) {
    return 0;
  }
  if (baseCardId === 'lawina_z_morskiego_oka' && state.currentWeather === 'frozen') {
    return 1;
  }
  if (baseCardId === 'paragon_grozy' && state.enemy?.rachunek >= 24) {
    return 0;
  }
  return card?.cost ?? 0;
}

/**
 * @param {{ hasRelic: (relicId: string) => boolean, maryna: { flags: { listaDiscountActive: boolean } } }} state
 * @param {string} cardId
 * @returns {number}
 */
export function getCardShopPrice(state, cardId) {
  const base = getCardDefinition(cardId)?.price ?? 0;
  if (state.hasRelic('zlota_karta_zakopianczyka')) {
    return Math.floor(base * 0.8);
  }
  if (state.maryna.flags.listaDiscountActive) {
    return Math.floor(base * 0.75);
  }
  return base;
}

/**
 * @param {{ hasRelic: (relicId: string) => boolean, maryna: { flags: { listaFreeRemovalAvailable: boolean, listaFreeRemovalUsed: boolean } } }} state
 * @returns {number}
 */
export function getShopRemovalPrice(state) {
  if (state.hasRelic('zlota_karta_zakopianczyka')) return 0;
  if (state.maryna.flags.listaFreeRemovalAvailable && !state.maryna.flags.listaFreeRemovalUsed) {
    return 0;
  }
  return 100;
}

/**
 * @param {{ maryna: { flags: { listaFreeRemovalAvailable: boolean, listaFreeRemovalUsed: boolean, listaDiscountActive: boolean } } }} state
 */
export function afterShopCardRemoval(state) {
  if (state.maryna.flags.listaFreeRemovalAvailable && !state.maryna.flags.listaFreeRemovalUsed) {
    state.maryna.flags.listaFreeRemovalUsed = true;
    state.maryna.counters.listaFreeRemovalsLeft = Math.max(
      0,
      (state.maryna.counters.listaFreeRemovalsLeft ?? 1) - 1
    );
    if (state.maryna.counters.listaFreeRemovalsLeft === 0) {
      state.maryna.flags.listaDiscountActive = false;
    }
  }
}

/**
 * @param {{ hasRelic: (relicId: string) => boolean, hand: string[], smyczKeptHandIndex: number | null }} state
 * @param {number} handIndex
 */
export function setSmyczKeptCard(state, handIndex) {
  if (!state.hasRelic('smycz_zakopane')) return;
  if (handIndex < 0 || handIndex >= state.hand.length) return;
  state.smyczKeptHandIndex = state.smyczKeptHandIndex === handIndex ? null : handIndex;
}

/**
 * @param {{ player: PlayerState }} state
 * @returns {boolean}
 */
export function isLansActive(state) {
  return state.player.status.lans > 0;
}

/**
 * @param {{ player: PlayerState, gainPlayerBlockFromCard: (amount: number) => void }} state
 * @param {boolean} active
 */
export function setLansActive(state, active) {
  const wasActive = state.player.status.lans > 0;
  state.player.status.lans = active ? 1 : 0;
  if (active && !wasActive && state.player.pan_na_wlosciach) {
    state.gainPlayerBlockFromCard(3);
  }
  if (active && !wasActive && state.hasRelic('wejscie_z_przytupem')) {
    state._applyDamageToEnemy(5);
  }
}

/**
 * @param {{ player: PlayerState, hasRelic: (relicId: string) => boolean, _isLansActive: () => boolean }} state
 * @param {number} amount
 */
export function gainPlayerBlockFromCard(state, amount) {
  let effective = state.player.status.fragile > 0 ? Math.floor(amount * 0.75) : amount;
  if (state.hasRelic('lustrzane_gogle') && state._isLansActive()) {
    effective += 2;
  }
  state.player.block += effective;
}

/**
 * @param {{ player: PlayerState, enemy: EnemyState, currentWeather: string }} state
 * @param {number} baseDmg
 * @param {PlayerState | EnemyState} sourceEntity
 * @param {PlayerState | EnemyState} targetEntity
 * @returns {number}
 */
export function calculateDamage(state, baseDmg, sourceEntity, targetEntity) {
  let dmg = baseDmg;

  if (sourceEntity.status.weak > 0) {
    const weakMultiplier = state.currentWeather === 'frozen' ? 0.5 : 0.75;
    dmg = Math.floor(dmg * weakMultiplier);
  }

  if (sourceEntity.status.strength > 0) {
    dmg += sourceEntity.status.strength;
  }

  if (
    sourceEntity === state.player &&
    targetEntity === state.enemy &&
    sourceEntity.status.next_double
  ) {
    dmg *= 2;
    sourceEntity.status.next_double = false;
  }

  if (
    sourceEntity === state.player &&
    targetEntity === state.enemy &&
    sourceEntity.status.furia_turysty > 0
  ) {
    dmg = Math.ceil(dmg * 1.5);
  }

  if (sourceEntity === state.enemy && state.enemy.portraitShameTurns > 0) {
    dmg = Math.max(0, dmg - 2);
  }

  if (targetEntity.status.vulnerable > 0) {
    dmg = Math.ceil(dmg * 1.5);
  }

  return Math.max(0, dmg);
}

/**
 * @param {{
 *   debugGodMode: boolean,
 *   player: PlayerState,
 *   dutki: number,
 *   lansBreakEvent: boolean,
 *   lansDutkiSpentEvent: number,
 *   enemy: EnemyState,
 *   combat: { activeSide: 'player' | 'enemy' },
 *   _isLansActive: () => boolean,
 *   _setLansActive: (active: boolean) => void,
 *   hasRelic: (relicId: string) => boolean,
 *   _drawCards: (amount: number) => void,
 *   _applyDamageToEnemy: (amount: number) => { raw: number, blocked: number, dealt: number }
 * }} state
 * @param {number} amount
 * @returns {{ raw: number, blocked: number, dealt: number }}
 */
export function takeDamage(state, amount) {
  if (state.debugGodMode) {
    return { raw: amount, blocked: amount, dealt: 0 };
  }

  const blockBeforeHit = state.player.block;
  const blocked = Math.min(state.player.block, amount);
  let dealt = amount - blocked;
  let lansSpent = 0;
  state.player.block -= blocked;

  if (dealt > 0 && state._isLansActive()) {
    const rate = 2 + state.player.lansHitsAbsorbed;
    const requiredDutki = dealt * rate;
    if (state.dutki >= requiredDutki) {
      state.dutki -= requiredDutki;
      lansSpent += requiredDutki;
      dealt = 0;
      state.player.lansHitsAbsorbed += 1;
    } else {
      const availableDutki = state.dutki;
      const prevented = Math.floor(availableDutki / rate);
      dealt = Math.max(0, dealt - prevented);
      lansSpent += availableDutki;
      state.dutki = 0;
      state._setLansActive(false);
      state.player.stunned = true;
      state.lansBreakEvent = true;
      // zaszczyt_upadku: when Lans breaks, queue draw+energy
      if (state.lansBreakEvent && state.hasRelic('zaszczyt_upadku')) {
        state.player.status.energy_next_turn += 2;
        state.zaszytUpadkuDrawPending = true;
      }
    }
  }

  if (lansSpent > 0) {
    state.lansDutkiSpentEvent += lansSpent;
  }

  // pancerz_z_lansu: Lans active reduces HP damage by 2
  if (dealt > 0 && state._isLansActive() && state.hasRelic('pancerz_z_lansu')) {
    dealt = Math.max(0, dealt - 2);
  }
  // kedziorek_na_energie: hit while at 0 block (before this attack) → lose 1 energy next turn
  if (amount > 0 && blockBeforeHit === 0 && dealt > 0 && state.hasRelic('kedziorek_na_energie')) {
    state.player.status.energy_next_turn -= 1;
  }
  state.player.hp -= dealt;
  if (dealt > 0 && state.hasRelic('kierpce_wyprzedazy')) {
    state._drawCards(1);
    state.gainPlayerBlockFromCard(3);
  }
  if (dealt > 0 && state.enemy.passive === 'brak_reszty') {
    state.dutki = Math.max(0, state.dutki - 3);
  }

  // zasieki_z_gubalowki: counter-attack 5 damage on any hit (including blocked)
  if (amount > 0 && state.zasiekiActive && state.enemy.hp > 0) {
    state._applyDamageToEnemy(5);
  }

  // goralski_upor_moc power: queue 1 draw for start of next turn on HP loss
  if (dealt > 0 && state.player.goralski_upor_moc) {
    state.goralskiUporDrawPending = (state.goralskiUporDrawPending ?? 0) + 1;
  }

  if (
    state.player.status.duma_podhala > 0 &&
    state.combat.activeSide === 'enemy' &&
    blocked >= 10
  ) {
    const reflected = Math.floor(blocked / 10) * 5;
    state._applyDamageToEnemy(reflected);
  }

  return { raw: amount, blocked, dealt };
}
