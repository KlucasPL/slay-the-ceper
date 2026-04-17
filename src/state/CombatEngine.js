import { getBaseCardId, getCardDefinition } from '../data/cards.js';

/** @param {any} state @param {string} kind @param {Record<string, unknown>} payload */
function emitS(state, kind, payload) {
  state.emit(kind, payload);
}

/** @param {any} state @param {string} kind @param {Record<string, unknown>} payload */
function emitF(state, kind, payload) {
  if (state._eventVerbosity === 'full') state.emit(kind, payload);
}

/** @returns {number} */
export function drawPerTurn() {
  return 5;
}

/**
 * @param {any} state
 */
export function applyBattleStartRelics(state) {
  if (state.hasRelic('flaszka_sliwowicy')) {
    state.player.status.strength += 4;
  }

  if (state.hasRelic('papryczka_marka')) {
    state.player.status.strength += 3;
  }

  if (state.hasRelic('blacha_przewodnika')) {
    state.player.status.lans = 1;
  }

  if (state.hasRelic('krzywy_portret')) {
    state.enemy.portraitShameTurns = 1;
    state._refreshEnemyIntent();
  }

  if (state.hasRelic('relic_boon_zloty_rozaniec')) {
    state.player.status.next_double = true;
  }

  if (state.hasRelic('relic_boon_tajny_skladnik')) {
    state.applyEnemyDebuff('weak', 1);
    state.applyEnemyDebuff('fragile', 1);
  }

  if (
    state.hasRelic('relic_boon_sloik_rosolu') &&
    (state.maryna.counters.rosolBattlesLeft ?? 3) > 0
  ) {
    state.maryna.counters.rosolBattlesLeft = (state.maryna.counters.rosolBattlesLeft ?? 3) - 1;
    state.gainPlayerBlockFromCard(6);
    state.player.status.strength += 1;
  }
}

/**
 * @param {any} state
 * @param {number} amount
 * @returns {string[]}
 */
export function drawCards(state, amount) {
  const drawn = [];
  const effectiveAmount = amount;
  for (let i = 0; i < effectiveAmount; i++) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) break;
      state.deck = [...state.discard];
      state.discard = [];
      state._shuffle(state.deck);
    }
    const cardId = state.deck.pop();
    if (typeof cardId === 'string') {
      state.hand.push(cardId);
      drawn.push(cardId);
      emitF(state, 'card_drawn', { card: { kind: 'card', id: getBaseCardId(cardId) } });
    }
  }
  return drawn;
}

/**
 * @param {any} state
 */
export function resetBattleScopedFlags(state) {
  state.nextAttackCardBonus = 0;
  state.currentAttackCardBonus = 0;
  state.enemyEvasionEvent = false;
  state.enemyPhaseTransitionMessage = null;
}

/**
 * @param {any} state
 * @param {number} dmg
 * @returns {{ raw: number, blocked: number, dealt: number }}
 */
export function applyDamageToEnemy(state, dmg) {
  if (
    state.currentWeather === 'fog' &&
    state.combat.activeSide === 'player' &&
    state.combat.playerAttackMissCheck
  ) {
    if (!state.combat.playerAttackMissRolled) {
      state.combat.playerAttackMissRolled = true;
      state.combat.playerAttackMissed = state.rng() < 0.25;
      if (state.combat.playerAttackMissed) {
        state._registerWeatherMiss('enemy');
      }
    }
    if (state.combat.playerAttackMissed) {
      return { raw: 0, blocked: 0, dealt: 0 };
    }
  }

  if (state.combat.activeSide === 'player' && state.enemy.evasionCharges > 0) {
    state.enemy.evasionCharges -= 1;
    state.enemyEvasionEvent = true;
    return { raw: 0, blocked: 0, dealt: 0 };
  }

  const hpBefore = state.enemy.hp;
  const blocked = Math.min(state.enemy.block, dmg);
  const dealt = dmg - blocked;
  state.enemy.block -= blocked;
  state.enemy.hp -= dealt;

  if (state.enemy.hp < hpBefore) {
    state.enemy.tookHpDamageThisTurn = true;

    if (
      state.enemy.passive === 'lichwa' &&
      state.combat.activeSide === 'player' &&
      !state.enemy.lichwaTriggeredThisTurn
    ) {
      state.dutki = Math.max(0, state.dutki - 3);
      state.enemy.lichwaTriggeredThisTurn = true;
    }

    if (
      state.enemy.passive === 'hart_ducha' &&
      !state.enemy.hartDuchaTriggered &&
      state.enemy.hp > 0 &&
      state.enemy.hp < state.enemy.maxHp * 0.5
    ) {
      state.enemy.status.strength += 3;
      state.enemy.block += 10;
      state.enemy.hartDuchaTriggered = true;
    }

    state._handleEnemyPhaseTransitions();
  }

  state._checkEnemyBankruptcy();
  if (
    dmg > 0 &&
    state.enemy.passive === 'ochrona_wizerunku' &&
    state.combat.activeSide === 'player'
  ) {
    if (state.player.block > 0) {
      state.player.block -= 1;
    } else {
      state.player.hp -= 1;
    }
  }
  return { raw: dmg, blocked, dealt };
}

/**
 * @param {any} state
 * @param {number} dmg
 * @returns {{ raw: number, blocked: number, dealt: number }}
 */
export function applyDamageToPlayer(state, dmg) {
  return state.takeDamage(dmg);
}

/**
 * @param {any} state
 * @returns {{ raw: number, blocked: number, dealt: number }}
 */
export function applyEnemyIntent(state) {
  const intent = state.enemy.currentIntent;

  if (state.enemy.stunnedTurns > 0) {
    state.enemy.stunnedTurns -= 1;
    return { raw: 0, blocked: 0, dealt: 0 };
  }

  if (intent.type === 'block') {
    state.enemy.block += intent.block;
    if (intent.gainEvasion && intent.gainEvasion > 0) {
      state.enemy.evasionCharges += intent.gainEvasion;
    }
    if (intent.heal && intent.heal > 0) {
      state.enemy.hp = Math.min(state.enemy.maxHp, state.enemy.hp + intent.heal);
    }
    return { raw: 0, blocked: 0, dealt: 0 };
  }

  if (intent.type === 'buff') {
    if (intent.strengthGain && intent.strengthGain > 0) {
      state.enemy.status.strength += intent.strengthGain;
    }
    if (intent.block && intent.block > 0) {
      state.enemy.block += intent.block;
    }
    return { raw: 0, blocked: 0, dealt: 0 };
  }

  if (intent.type === 'status') {
    if (intent.addStatusCard) {
      const amount = intent.amount ?? 1;
      for (let i = 0; i < amount; i++) {
        state.discard.push(intent.addStatusCard);
      }
    }
    if (intent.applyStun) {
      state.player.stunned = true;
    }
    return { raw: 0, blocked: 0, dealt: 0 };
  }

  if (!state.combat.firstAttackUsed) {
    state.combat.firstAttackUsed = true;
    if (state.currentWeather === 'fog' && state.rng() < 0.25) {
      state._registerWeatherMiss('player');
      return { raw: 0, blocked: 0, dealt: 0 };
    }
  }

  let raw = 0;
  let blocked = 0;
  let dealt = 0;
  const hits = intent.hits ?? 1;

  const intentDamage = intent.usePed ? intent.damage + (state.enemy.ped ?? 0) : intent.damage;
  if (intent.usePed) state.enemy.ped = 0;

  for (let hitIndex = 0; hitIndex < hits; hitIndex++) {
    const hitDamage = state.calculateDamage(intentDamage, state.enemy, state.player);
    const result = state._applyDamageToPlayer(hitDamage);
    raw += result.raw;
    blocked += result.blocked;
    dealt += result.dealt;
  }

  if (intent.applyWeak && intent.applyWeak > 0) {
    state.player.status.weak += intent.applyWeak;
    emitF(state, 'status_applied', { target: 'player', status: 'weak', amount: intent.applyWeak });
  }

  if (intent.applyFrail && intent.applyFrail > 0) {
    state.player.status.fragile += intent.applyFrail;
    emitF(state, 'status_applied', {
      target: 'player',
      status: 'fragile',
      amount: intent.applyFrail,
    });
  }

  if (intent.applyVulnerable && intent.applyVulnerable > 0) {
    state.player.status.vulnerable += intent.applyVulnerable;
    emitF(state, 'status_applied', {
      target: 'player',
      status: 'vulnerable',
      amount: intent.applyVulnerable,
    });
  }

  if (intent.gainPed && intent.gainPed > 0) {
    state.enemy.ped = (state.enemy.ped ?? 0) + intent.gainPed;
  }

  if (intent.stealDutki && intent.stealDutki > 0 && dealt > 0) {
    if (state.dutki >= intent.stealDutki) {
      state.dutki -= intent.stealDutki;
    } else {
      state.dutki = 0;
      state.player.status.weak += 2;
    }
  }

  return { raw, blocked, dealt };
}

/**
 * @param {any} state
 * @returns {number}
 */
export function getEnemyIntentDamage(state) {
  const intent = state.enemy.currentIntent;
  if (intent.type !== 'attack') return 0;

  let baseDmg = intent.damagePerCardInHand ? intent.damage + state.hand.length : intent.damage;
  if (intent.usePed) baseDmg += state.enemy.ped ?? 0;
  const hits = intent.hits ?? 1;
  const perHit = state.calculateDamage(baseDmg, state.enemy, state.player);
  return Math.max(0, perHit * hits - state.player.block);
}

/**
 * @param {any} state
 * @returns {string}
 */
export function getEnemyIntentText(state) {
  const intent = state.enemy.currentIntent;
  if (state.enemy.stunnedTurns > 0) {
    return `Zamiar: Ogłuszony (😵 ${state.enemy.stunnedTurns})`;
  }
  if (intent.type === 'block') {
    const evasionPart = intent.gainEvasion ? `, 🌀 ${intent.gainEvasion}` : '';
    return `Zamiar: ${intent.name} (🛡️ ${intent.block}${evasionPart})`;
  }

  if (intent.type === 'buff') {
    return `Zamiar: ${intent.name} (💪)`;
  }

  if (intent.type === 'status') {
    if (intent.applyStun) {
      return `Zamiar: ${intent.name} (😵)`;
    }
    return `Zamiar: ${intent.name} (📄 ×${intent.amount ?? 1})`;
  }

  const hits = intent.hits ?? 1;

  if (hits === 0) {
    const parts = [];
    if (intent.applyFrail) parts.push(`🫧 ×${intent.applyFrail}`);
    if (intent.applyWeak) parts.push(`🤢 ×${intent.applyWeak}`);
    if (intent.applyVulnerable) parts.push(`💥 ×${intent.applyVulnerable}`);
    if (intent.stealDutki) parts.push(`💰 -${intent.stealDutki}`);
    return `Zamiar: ${intent.name} (${parts.join(', ') || 'efekt'})`;
  }

  const totalDamage = state.getEnemyIntentDamage();
  const stealPart = intent.stealDutki ? `, 💰 -${intent.stealDutki}` : '';
  if (hits > 1) {
    return `Zamiar: ${intent.name} (⚔️ ${totalDamage}, ${hits}x${stealPart})`;
  }

  return `Zamiar: ${intent.name} (⚔️ ${totalDamage}${stealPart})`;
}

/**
 * @param {any} state
 */
export function startTurn(state) {
  state.combat.activeSide = 'player';
  state.combat.firstAttackUsed = false;
  state.combat.playerAttackMissCheck = false;
  state.combat.playerAttackMissRolled = false;
  state.combat.playerAttackMissed = false;

  state.enemy.tookHpDamageThisTurn = false;
  state.enemy.lichwaTriggeredThisTurn = false;
  state.player.cardsPlayedThisTurn = 0;
  state.nextAttackCardBonus = 0;
  state.currentAttackCardBonus = 0;

  state.battleTurnsElapsed += 1;
  state.totalTurnsPlayed += 1;

  state.zegarekFreeSkillAvailable =
    state.hasRelic('goralski_zegarek') && state.battleTurnsElapsed % 2 === 0;

  state.player.energy = state.player.maxEnergy + state.player.status.energy_next_turn;
  state.player.status.energy_next_turn = 0;
  state.player.block = 0;
  state._drawCards(state._drawPerTurn());

  if (state.smyczKeptCardId) {
    state.hand.unshift(state.smyczKeptCardId);
    state.smyczKeptCardId = null;
  }

  if (state.hasRelic('wiatr_halny')) {
    state._drawCards(1);
  }

  if (state.hasRelic('flaszka_sliwowicy')) {
    state.flaszkaCostSeed = {};
    for (const cardId of state.hand) {
      if (!(cardId in state.flaszkaCostSeed)) {
        state.flaszkaCostSeed[cardId] = Math.floor(state.rng() * 4);
      }
    }
  } else {
    state.flaszkaCostSeed = {};
  }

  if (state.hasRelic('papryczka_marka')) {
    state.player.hp = Math.max(1, state.player.hp - 2);
  }

  if (state.player.koncesja_na_oscypki && state.enemy.rachunek >= 25) {
    state.player.energy += 1;
    state._drawCards(1);
  }

  if (state.player.weather_fog_garda && state.currentWeather === 'fog') {
    state.gainPlayerBlockFromCard(5);
  }

  if (state.player.weather_frozen_vulnerable && state.currentWeather === 'frozen') {
    state.applyEnemyDebuff('vulnerable', 1);
  }

  emitF(state, 'turn_started', { battleTurn: state.battleTurnsElapsed });
}

/**
 * @param {any} state
 * @param {number} handIndex
 * @returns {import('./GameState.js').PlayCardResult}
 */
export function playCard(state, handIndex) {
  const cardId = state.hand[handIndex];
  const card = getCardDefinition(cardId);
  const isLansTaggedCard = Array.isArray(card?.tags) && card.tags.includes('lans');
  const lansWasActiveBeforePlay = state._isLansActive();
  const activateLansOnly = isLansTaggedCard && !lansWasActiveBeforePlay;
  const actualCost = state.getCardCostInHand(cardId);
  if (!card || state.player.energy < actualCost) return { success: false };
  if (card.unplayable) return { success: false };

  if (state.player.stunned && card.type === 'attack') {
    return { success: false, reason: 'stunned_attack' };
  }

  if (state.enemy.passive === 'blokada_parkingowa' && state.player.cardsPlayedThisTurn >= 3) {
    return { success: false, reason: 'blokada' };
  }

  if (state.smyczKeptHandIndex !== null) {
    if (handIndex === state.smyczKeptHandIndex) {
      state.smyczKeptHandIndex = null;
    } else if (handIndex < state.smyczKeptHandIndex) {
      state.smyczKeptHandIndex -= 1;
    }
  }

  state.player.energy -= actualCost;

  const isFirstCardThisBattle =
    state.hasRelic('pocztowka_giewont') && !state.pocztowkaUsedThisBattle;
  state.pocztowkaUsedThisBattle = true;
  const isAttackCard = card.type === 'attack';

  if (isAttackCard) {
    if (state.nextAttackCardBonus > 0) {
      state.currentAttackCardBonus = state.nextAttackCardBonus;
      state.nextAttackCardBonus = 0;
    }
    state.combat.playerAttackMissCheck =
      state.currentWeather === 'fog' && !state.combat.firstAttackUsed;
    state.combat.playerAttackMissRolled = false;
    state.combat.playerAttackMissed = false;
    state.combat.firstAttackUsed = true;
  } else {
    state.combat.playerAttackMissCheck = false;
  }

  state.hand.splice(handIndex, 1);
  if (card.exhaust) {
    state.exhaust.push(cardId);
    emitF(state, 'card_exhausted', { card: { kind: 'card', id: getBaseCardId(cardId) } });
  } else {
    state.discard.push(cardId);
  }

  let effect;
  state.activeRuntimeCardId = cardId;
  try {
    if (activateLansOnly) {
      state._setLansActive(true);
      state.lansActivatedEvent = true;
      effect = { playerAnim: 'anim-block' };
    } else {
      effect = card.effect(state);
    }

    if (isFirstCardThisBattle && state.enemy.hp > 0 && !activateLansOnly) {
      card.effect(state);
    }
  } finally {
    state.activeRuntimeCardId = null;
  }

  if (card.type === 'attack' && state.player.goralska_goscinnosc) {
    state.addEnemyRachunek(2);
  }

  if (state.hasRelic('ciupaga_dlugopis') && card.type === 'skill') {
    state._applyDamageToEnemy(4);
  }

  if (state.zegarekFreeSkillAvailable && card.type === 'skill') {
    state.zegarekFreeSkillAvailable = false;
  }

  if (card.type === 'attack') {
    state.attackCardsPlayedThisBattle += 1;
    if (state.attackCardsPlayedThisBattle % 3 === 0 && state.hasRelic('bilet_tpn')) {
      state.player.energy += 1;
    }
  }

  state.combat.playerAttackMissCheck = false;
  state.combat.playerAttackMissRolled = false;
  state.combat.playerAttackMissed = false;
  state.currentAttackCardBonus = 0;

  state.player.cardsPlayedThisTurn += 1;

  emitS(state, 'card_played', {
    card: { kind: 'card', id: getBaseCardId(cardId) },
    cost: actualCost,
  });

  return { success: true, effect };
}

/**
 * @param {any} state
 * @returns {import('./GameState.js').EndTurnResult}
 */
export function endTurn(state) {
  const playerHandSizeBeforeDiscard = state.hand.length;

  if (state.hasRelic('smycz_zakopane') && state.smyczKeptHandIndex !== null) {
    if (state.smyczKeptHandIndex >= 0 && state.smyczKeptHandIndex < state.hand.length) {
      const [keptCardId] = state.hand.splice(state.smyczKeptHandIndex, 1);
      state.smyczKeptCardId = keptCardId ?? null;
    } else {
      state.smyczKeptCardId = null;
    }
    state.smyczKeptHandIndex = null;
  }

  if (state.hand.some((entry) => getBaseCardId(entry) === 'spam_tagami')) {
    state.dutki = Math.max(0, state.dutki - 2);
  }

  if (
    state.enemy.currentIntent.type === 'attack' &&
    state.enemy.currentIntent.damagePerCardInHand
  ) {
    state.enemy.currentIntent = {
      ...state.enemy.currentIntent,
      damage: state.enemy.currentIntent.damage + state.hand.length,
    };
  }

  for (const skippedId of state.hand) {
    emitF(state, 'card_skipped', { card: { kind: 'card', id: getBaseCardId(skippedId) } });
  }
  state.discard.push(...state.hand);
  state.hand = [];

  if (state.player.stunned) {
    state.player.stunned = false;
  }

  state._tickStatus(state.player.status);

  /** @type {{ amount: number, text: string } | null} */
  let playerPassiveHeal = null;
  if (state.hasRelic('krokus') && state.player.block > 10) {
    const hpBefore = state.player.hp;
    state.healPlayer(2);
    const healed = state.player.hp - hpBefore;
    if (healed > 0) {
      playerPassiveHeal = { amount: healed, text: `+${healed} Krzepy (Krokus)` };
    }
  }

  if (state.hasRelic('papucie_po_babci') && state._isLansActive()) {
    const hpBefore = state.player.hp;
    state.healPlayer(2);
    const healed = state.player.hp - hpBefore;
    if (healed > 0 && !playerPassiveHeal) {
      playerPassiveHeal = { amount: healed, text: `+${healed} Krzepy (Papucie)` };
    }
  }

  if (state.player.czas_na_fajke && state.player.block > 10) {
    const hpBefore = state.player.hp;
    state.healPlayer(2);
    const healed = state.player.hp - hpBefore;
    if (healed > 0 && !playerPassiveHeal) {
      playerPassiveHeal = { amount: healed, text: `+${healed} Krzepy (Czas na Fajkę)` };
    }
  }

  state._applyHalnyBlockDrain(state.player);

  /** @type {{ amount: number, text: string } | null} */
  let enemyPassiveHeal = null;
  if (state.enemy.id === 'baba' && !state.enemy.tookHpDamageThisTurn) {
    const hpBefore = state.enemy.hp;
    state.enemy.hp = Math.min(state.enemy.maxHp, state.enemy.hp + 3);
    const healedAmount = state.enemy.hp - hpBefore;
    if (healedAmount > 0) {
      enemyPassiveHeal = {
        amount: healedAmount,
        text: `+${healedAmount} Krzepy (Świeży oscypek)`,
      };
    }
    state._checkEnemyBankruptcy();
  }

  state.combat.activeSide = 'enemy';
  state.combat.firstAttackUsed = false;

  if (state._resolveEnemyBankruptcyAtTurnStart()) {
    return {
      enemyAttack: { raw: 0, blocked: 0, dealt: 0 },
      enemyPassiveHeal,
      playerPassiveHeal,
    };
  }

  state.enemy.block = 0;

  if (state.enemy.passive === 'parcie_na_szklo' && state._isLansActive()) {
    state.enemy.status.strength += 2;
  }

  if (state.enemy.passive === 'influencer_aura' && playerHandSizeBeforeDiscard >= 3) {
    state.enemy.block += 5;
  }

  const enemyAttack = state._applyEnemyIntent();

  if (state.enemy.portraitShameTurns > 0) {
    state.enemy.portraitShameTurns -= 1;
  }

  if (!state.hasRelic('zepsuty_termometr') || state.termometerTurnParity === 0) {
    state._tickStatus(state.enemy.status);
    state._checkEnemyBankruptcy();
  }
  if (state.hasRelic('zepsuty_termometr')) {
    state.termometerTurnParity = 1 - state.termometerTurnParity;
  }

  if (state.enemy.id === 'busiarz') {
    state.enemy.status.strength += 1;
    state._checkEnemyBankruptcy();
  }

  if (state.enemy.patternType === 'loop') {
    const activePattern =
      state.enemy.phaseTwoTriggered && state.enemy.phaseTwoPattern.length > 0
        ? state.enemy.phaseTwoPattern
        : state.enemy.pattern;
    state.enemy.patternIndex = (state.enemy.patternIndex + 1) % activePattern.length;
  }

  state._applyHalnyBlockDrain(state.enemy);

  state._refreshEnemyIntent();

  emitF(state, 'turn_ended', { battleTurn: state.battleTurnsElapsed });
  emitF(state, 'enemy_move', {
    enemy: { kind: 'enemy', id: state.enemy.id },
    intentType: state.enemy.currentIntent.type,
    intentName: state.enemy.currentIntent.name,
  });

  return { enemyAttack, enemyPassiveHeal, playerPassiveHeal };
}
