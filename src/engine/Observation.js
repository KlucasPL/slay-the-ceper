import { getCardDefinition } from '../data/cards.js';
import { getLegalActions } from './LegalActions.js';

/**
 * @typedef {{
 *   phase: string,
 *   turn: number,
 *   battleTurn: number,
 *   floor: number,
 *   act: number,
 *   weather: { id: string, name: string, description: string },
 *   player: {
 *     hp: number, maxHp: number, block: number, energy: number, maxEnergy: number,
 *     status: import('../data/cards.js').StatusDef, stunned: boolean, cardsPlayedThisTurn: number,
 *   },
 *   enemy: object | null,
 *   hand: CardView[],
 *   deckCount: number,
 *   discardCount: number,
 *   exhaustCount: number,
 *   fullDeck?: string[],
 *   discardContents?: string[],
 *   exhaustContents?: string[],
 *   combat: { firstAttackUsed: boolean, activeSide: string, attackCardsPlayedThisBattle: number },
 *   run: object,
 *   map?: object,
 *   activeEvent?: object | null,
 *   shopStock?: object | null,
 *   campfire?: object | null,
 *   marynaOffer?: string[] | null,
 *   rewardOffer?: object | null,
 *   legalActions: import('./LegalActions.js').Action[],
 *   done: boolean,
 *   outcome?: string,
 * }} Observation
 *
 * @typedef {{ id: string, name: string, type: string, cost: number, effectiveCost: number, desc: string, emoji: string, unplayable: boolean, exhaust?: boolean, tags: string[] }} CardView
 */

/**
 * Project a GameState into a deep-frozen, JSON-serializable Observation.
 * @param {import('../state/GameState.js').GameState} state
 * @param {{ revealAllPiles?: boolean }} [rules]
 * @returns {Observation}
 */
export function buildObservation(state, rules = {}) {
  const weather = state.getCurrentWeather();
  const legalActions = getLegalActions(state);

  /** @type {CardView[]} */
  const hand = state.hand.map((cardId) => {
    const def = getCardDefinition(cardId);
    const effectiveCost = state.getCardCostInHand(cardId);
    return {
      id: cardId,
      name: def?.name ?? cardId,
      type: def?.type ?? 'unknown',
      cost: def?.cost ?? 0,
      effectiveCost,
      desc: def?.desc ?? '',
      emoji: def?.emoji ?? '',
      unplayable: !!def?.unplayable,
      exhaust: !!def?.exhaust,
      tags: def?.tags ? [...def.tags] : [],
    };
  });

  const enemy = state.enemy ? _buildEnemyView(state) : null;

  const done = !!state.runSummary;
  const outcome = state.runSummary?.outcome;

  /** @type {Observation} */
  const obs = {
    phase: state.currentScreen,
    turn: state.totalTurnsPlayed ?? 0,
    battleTurn: state.battleTurnsElapsed ?? 0,
    floor: (state.currentLevel ?? 0) + 1,
    act: state.currentAct ?? 1,
    weather: {
      id: weather.id,
      name: weather.name,
      description: weather.desc,
    },
    player: {
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      block: state.player.block,
      energy: state.player.energy,
      maxEnergy: state.player.maxEnergy,
      status: { ...state.player.status },
      stunned: state.player.stunned,
      cardsPlayedThisTurn: state.player.cardsPlayedThisTurn,
    },
    enemy,
    hand,
    deckCount: state.deck.length,
    discardCount: state.discard.length,
    exhaustCount: state.exhaust.length,
    combat: {
      firstAttackUsed: state.combat.firstAttackUsed,
      activeSide: state.combat.activeSide,
      attackCardsPlayedThisBattle: state.attackCardsPlayedThisBattle,
    },
    run: _buildRunView(state),
    legalActions,
    done,
  };

  if (outcome) obs.outcome = outcome;

  if (rules.revealAllPiles) {
    obs.fullDeck = [...state.deck];
    obs.discardContents = [...state.discard];
    obs.exhaustContents = [...state.exhaust];
  }

  if (state.map) obs.map = _buildMapView(state);
  if (state.activeEventId) obs.activeEvent = _buildEventView(state);
  if (state._inShop) obs.shopStock = state.shopStock ? { ...state.shopStock } : null;
  if (state._inCampfire) obs.campfire = { upgradeable: state.getUpgradeableAttackCards?.() ?? [] };
  if (state.maryna?.offeredIds?.length && !state.maryna.pickedId) {
    obs.marynaOffer = [...state.maryna.offeredIds];
  }
  if (state._rewardOffer) obs.rewardOffer = { ...state._rewardOffer };

  return deepFreeze(obs);
}

/**
 * @param {import('../state/GameState.js').GameState} state
 * @returns {object}
 */
function _buildEnemyView(state) {
  const e = state.enemy;
  const intentText = state.getEnemyIntentText?.() ?? '';
  const intentDmg = state.getEnemyIntentDamage?.() ?? 0;
  return {
    id: e.id,
    name: e.name,
    hp: e.hp,
    maxHp: e.maxHp,
    block: e.block,
    status: { ...e.status },
    passive: e.passive ?? null,
    isElite: e.isElite,
    isBoss: e.isBoss,
    rachunek: e.rachunek,
    rachunekImmune: e.passive === 'targowanie_sie',
    ped: e.ped ?? 0,
    intent: {
      type: e.currentIntent?.type ?? 'unknown',
      name: e.currentIntent?.name ?? '',
      hits: e.currentIntent?.hits ?? 1,
      expectedDamageToPlayer: intentDmg,
      text: intentText,
    },
    phaseTwoTriggered: e.phaseTwoTriggered,
    stunnedTurns: e.stunnedTurns ?? 0,
    evasionCharges: e.evasionCharges ?? 0,
    bossArtifact: e.bossArtifact ?? null,
  };
}

/**
 * @param {import('../state/GameState.js').GameState} state
 * @returns {object}
 */
function _buildRunView(state) {
  return {
    character: state.baseCharacter?.id ?? state.baseCharacter?.name ?? 'unknown',
    difficulty: state.difficulty,
    dutki: state.dutki,
    relics: [...state.relics],
    marynaBoon: state.maryna?.pickedId ?? null,
    cardDamageBonus: { ...state.cardDamageBonus },
    acquired: {
      cards: _getRunDeckIds(state),
      relics: [...state.relics],
      boons: state.maryna?.pickedId ? [state.maryna.pickedId] : [],
    },
  };
}

/**
 * @param {import('../state/GameState.js').GameState} state
 */
function _getRunDeckIds(state) {
  try {
    return (
      state.getRunDeckCardIds?.() ?? [
        ...state.deck,
        ...state.discard,
        ...state.exhaust,
        ...state.hand,
      ]
    );
  } catch {
    return [...state.deck, ...state.discard, ...state.exhaust, ...state.hand];
  }
}

/**
 * @param {import('../state/GameState.js').GameState} state
 * @returns {object}
 */
function _buildMapView(state) {
  const node = state.getCurrentMapNode?.();
  return {
    currentLevel: state.currentLevel,
    currentNodeIndex: state.currentNodeIndex,
    totalLevels: state.map.length,
    currentNode: node ? { type: node.type, weather: node.weather } : null,
    reachableNodes: state.getReachableNodes?.() ?? [],
  };
}

/**
 * @param {import('../state/GameState.js').GameState} state
 * @returns {object | null}
 */
function _buildEventView(state) {
  const def = state.getActiveEventDef?.();
  if (!def) return null;
  return {
    id: def.id,
    name: def.name,
    description: def.description ?? def.desc ?? '',
    choices: (def.choices ?? []).map((/** @type {any} */ c, /** @type {number} */ i) => ({
      index: i,
      text: c.text ?? c.label ?? '',
    })),
  };
}

/**
 * Deep-freeze an object (recursively).
 * @template T
 * @param {T} obj
 * @returns {T}
 */
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = /** @type {any} */ (obj)[key];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}
