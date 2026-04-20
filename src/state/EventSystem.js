import { getCardDefinition } from '../data/cards.js';
import { enemyLibrary } from '../data/enemies.js';
import { eventLibrary } from '../data/events.js';
import { defaultStatus } from './StatusEffects.js';

/** @returns {'I' | 'II' | 'III'} */
function getCurrentAct(state) {
  const rows = Math.max(1, state.map.length);
  const ratio = state.currentLevel / rows;
  if (ratio < 1 / 3) return 'I';
  if (ratio < 2 / 3) return 'II';
  return 'III';
}

/**
 * @param {{ map: any[], currentLevel: number, recentEventIds: string[] }} state
 * @returns {import('../data/events.js').GameEventDef | null}
 */
export function pickRandomEventDef(state) {
  const currentAct = getCurrentAct(state);
  const baseEventIds = Object.keys(eventLibrary).filter((id) => {
    const eventDef = eventLibrary[id];
    return !eventDef?.act || eventDef.act === currentAct;
  });
  const allEventIds = state.filterPool('events', baseEventIds);
  if (allEventIds.length === 0) return null;

  const historyWindow = Math.max(0, allEventIds.length - 1);
  const recentSlice = state.recentEventIds.slice(-historyWindow);
  const filtered = allEventIds.filter((id) => !recentSlice.includes(id));
  const pool = filtered.length > 0 ? filtered : allEventIds;

  const eventId = pool[Math.floor(state.rng() * pool.length)];
  state.recentEventIds.push(eventId);
  if (state.recentEventIds.length > historyWindow) {
    state.recentEventIds = state.recentEventIds.slice(-historyWindow);
  }
  return eventLibrary[eventId] ?? null;
}

/**
 * @param {{ activeEventId: string | null }} state
 * @param {string | null} eventId
 */
export function setActiveEvent(state, eventId) {
  state.activeEventId = eventId;
  if (eventId) {
    state.emit('event_entered', { event: { kind: 'event', id: eventId } });
  }
}

/**
 * @param {{ activeEventId: string | null }} state
 * @returns {import('../data/events.js').GameEventDef | null}
 */
export function getActiveEventDef(state) {
  if (!state.activeEventId) return null;
  return eventLibrary[state.activeEventId] ?? null;
}

/**
 * @param {{ activeEventId: string | null }} state
 */
export function clearActiveEvent(state) {
  state.activeEventId = null;
}

/**
 * @param {{ dutki: number, getActiveEventDef: () => import('../data/events.js').GameEventDef | null }} state
 * @param {number} choiceIndex
 * @returns {{ success: boolean, message: string }}
 */
export function applyActiveEventChoice(state, choiceIndex) {
  const eventDef = state.getActiveEventDef();
  if (!eventDef) {
    return { success: false, message: 'To wydarzenie już się skończyło.' };
  }

  const choice = eventDef.choices[choiceIndex];
  if (!choice) {
    return { success: false, message: 'Nieprawidłowy wybór.' };
  }

  if (state.dutki < choice.cost) {
    return { success: false, message: 'Nie masz tylu dutków.' };
  }

  state.dutki -= choice.cost;
  const result = choice.effect(state);
  state.emit('event_resolved', { event: { kind: 'event', id: state.activeEventId }, choiceIndex });
  return { success: true, message: result };
}

/**
 * @param {{ pendingEventBattleEnemyId: string | null, pendingEventVictoryRelicId: string | null }} state
 * @param {string} enemyId
 * @param {string | null} [victoryRelicId]
 */
export function queueEventBattle(state, enemyId, victoryRelicId = null) {
  const enemyDef = enemyLibrary[enemyId];
  if (!enemyDef || enemyDef.tutorialOnly) return;
  state.pendingEventBattleEnemyId = enemyId;
  state.pendingEventVictoryRelicId = victoryRelicId;
}

/**
 * @param {{ pendingEventBattleEnemyId: string | null, pendingEventVictoryRelicId: string | null }} state
 * @returns {{ enemyId: string, rewardRelicId: string | null } | null}
 */
export function consumeQueuedEventBattle(state) {
  if (!state.pendingEventBattleEnemyId) return null;
  const payload = {
    enemyId: state.pendingEventBattleEnemyId,
    rewardRelicId: state.pendingEventVictoryRelicId,
  };
  state.pendingEventBattleEnemyId = null;
  state.pendingEventVictoryRelicId = null;
  return payload;
}

/**
 * @param {{ battleContext: 'map' | 'event' | 'debug' | 'tutorial', pendingEventVictoryRelicId: string | null }} state
 * @returns {string | null}
 */
export function consumePendingEventVictoryRelicReward(state) {
  if (state.battleContext !== 'event') return null;
  if (!state.pendingEventVictoryRelicId) return null;
  const relicId = state.pendingEventVictoryRelicId;
  state.pendingEventVictoryRelicId = null;
  return relicId;
}

/**
 * @param {{
 *   player: { block: number, status: import('../data/cards.js').StatusDef, stunned: boolean },
 *   attackCardsPlayedThisBattle: number,
 *   pocztowkaUsedThisBattle: boolean,
 *   smyczKeptCardId: string | null,
 *   smyczKeptHandIndex: number | null,
 *   flaszkaCostSeed: Record<string, number>,
 *   termometerTurnParity: number,
 *   battleTurnsElapsed: number,
 *   zegarekFreeSkillAvailable: boolean,
 *   enemyBankruptFlag: boolean,
 *   enemyBankruptcyPending: boolean,
 *   enemyBankruptcyBonus: number,
 *   lansBreakEvent: boolean,
 *   lansDutkiSpentEvent: number,
 *   rachunekResistEvent: boolean,
 *   dumaPodhalaActive: boolean,
 *   lastVictoryMessage: string,
 *   hand: string[],
 *   discard: string[],
 *   exhaust: string[],
 *   deck: string[],
 *   enemy: any,
 *   battleContext: 'map' | 'event' | 'debug' | 'tutorial',
 *   pendingEventVictoryRelicId: string | null,
 *   pendingBattleDutki: boolean,
 *   _resetBattleScopedFlags: () => void,
 *   _setLansActive: (active: boolean) => void,
 *   _shuffle: (cards: string[]) => void,
 *   _createEnemyState: (enemyDef: import('../data/enemies.js').EnemyDef) => any,
 *   _setCurrentWeatherFromNode: () => void,
 *   _applyBattleStartRelics: () => void,
 *   startTurn: () => void
 * }} state
 * @param {string} enemyId
 * @param {{ battleContext?: 'map' | 'event' | 'debug' | 'tutorial', rewardRelicId?: string | null }} [options]
 * @returns {boolean}
 */
export function startBattleWithEnemyId(state, enemyId, options = {}) {
  const enemyDef = enemyLibrary[enemyId];
  if (!enemyDef) return false;

  const { battleContext = 'map', rewardRelicId = null } = options;
  if (enemyDef.tutorialOnly && battleContext !== 'tutorial') {
    return false;
  }
  if (enemyDef.eventOnly && battleContext !== 'event' && battleContext !== 'tutorial') {
    return false;
  }

  state.player.block = 0;
  state.attackCardsPlayedThisBattle = 0;
  state.pocztowkaUsedThisBattle = false;
  state.smyczKeptCardId = null;
  state.smyczKeptHandIndex = null;
  state.flaszkaCostSeed = {};
  state.termometerTurnParity = 0;
  state.battleTurnsElapsed = 0;
  state.zegarekFreeSkillAvailable = false;
  state.enemyBankruptFlag = false;
  state.enemyBankruptcyPending = false;
  state.enemyBankruptcyBonus = 0;
  state.lansBreakEvent = false;
  state.lansDutkiSpentEvent = 0;
  state.rachunekResistEvent = false;
  state.dumaPodhalaActive = false;
  state._resetBattleScopedFlags();
  state.lastVictoryMessage = '';

  state.player.status = defaultStatus();
  state._setLansActive(false);
  state.player.stunned = false;

  const allCards = [...state.hand, ...state.discard, ...state.exhaust, ...state.deck];
  state.deck = allCards.filter((id) => getCardDefinition(id)?.type !== 'status');
  state.hand = [];
  state.discard = [];
  state.exhaust = [];
  state._shuffle(state.deck);

  state._battleEndedEmitted = false;
  state.enemy = state._createEnemyState(enemyDef);
  state.battleContext = battleContext;
  state.pendingEventVictoryRelicId = rewardRelicId;
  state._setCurrentWeatherFromNode();
  state.pendingBattleDutki = true;

  state.emit('battle_started', { enemy: { kind: 'enemy', id: state.enemy.id } });

  state.startTurn();
  state._applyBattleStartRelics();
  return true;
}
