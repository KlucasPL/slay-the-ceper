import { cardLibrary, getCardDefinition } from '../data/cards.js';
import { enemyLibrary } from '../data/enemies.js';
import { relicLibrary } from '../data/relics.js';
import { getRunDeckCardIds as getDeckRunCardIds } from './DeckManager.js';
import { defaultStatus } from './StatusEffects.js';

/**
 * @param {any} state
 * @param {string[]} startingDeck
 */
export function initGame(state, startingDeck) {
  state.deck = [...startingDeck];
  state._shuffle(state.deck);
  state.attackCardsPlayedThisBattle = 0;
  state.pocztowkaCardsTriggeredThisBattle = 0;
  state.smyczKeptCardId = null;
  state.flaszkaCostSeed = {};
  state.termometerTurnParity = 0;
  state.battleTurnsElapsed = 0;
  state.zegarekFreeSkillAvailable = false;
  state.activeRuntimeCardId = null;
  state._resetBattleScopedFlags();
  state._setCurrentWeatherFromNode();
  state.startTurn();
  state._applyBattleStartRelics();
  state.pendingBattleDutki = true;
  state.isInputLocked = false;
}

/**
 * @param {any} state
 */
export function resetBattle(state) {
  state.battleWins += 1;

  if (state.difficulty === 'hard') {
    state.enemyScaleFactor = Math.round(state.enemyScaleFactor * 1.1 * 100) / 100;
  }

  state.player.block = 0;

  state.attackCardsPlayedThisBattle = 0;
  state.pocztowkaCardsTriggeredThisBattle = 0;
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
  state.lansActivatedEvent = false;
  state.lansDutkiSpentEvent = 0;
  state.rachunekResistEvent = false;
  state.dumaPodhalaActive = false;
  state._resetBattleScopedFlags();
  state.lastVictoryMessage = '';

  state.player.lansHitsAbsorbed = 0;
  state.player.weather_fog_garda = false;
  state.player.weather_frozen_vulnerable = false;
  state.player.pan_na_wlosciach = false;
  state.player.zimna_krew = false;
  state.player.czas_na_fajke = false;
  state.player.goralska_goscinnosc = false;
  state.player.koncesja_na_oscypki = false;
  state.player.status = defaultStatus();
  state._setLansActive(false);
  state.player.stunned = false;

  clearStatusCardsFromPiles(state);

  const currentNode = state.getCurrentMapNode();
  const isBossNode = currentNode?.type === 'boss';
  const isEliteNode = currentNode?.type === 'elite';
  const forcedId = currentNode?.forcedEnemyId ?? null;
  let nextEnemy;
  if (forcedId && enemyLibrary[forcedId]) {
    nextEnemy = enemyLibrary[forcedId];
  } else if (isBossNode) {
    nextEnemy = state.forceMainBossNextBattle ? enemyLibrary.boss : state._pickFinalBossDef();
  } else {
    nextEnemy = state._pickRandomEnemyDef(isEliteNode);
  }
  if (isBossNode) {
    state.forceMainBossNextBattle = false;
  }
  state.enemy = state._createEnemyState(nextEnemy);
  state.battleContext = 'map';
  state._setCurrentWeatherFromNode();
  state.pendingBattleDutki = true;

  state.startTurn();
  state._applyBattleStartRelics();
}

/**
 * Removes temporary status cards from all player piles immediately.
 * Keeps non-status cards by merging piles back into deck and shuffling.
 * @param {any} state
 */
export function clearStatusCardsFromPiles(state) {
  const allCards = [...state.hand, ...state.discard, ...state.exhaust, ...state.deck];
  state.deck = allCards.filter((id) => getCardDefinition(id)?.type !== 'status');
  state.hand = [];
  state.discard = [];
  state.exhaust = [];
  state._shuffle(state.deck);
}

/**
 * @param {any} state
 * @returns {'player_win' | 'enemy_win' | null}
 */
export function checkWinCondition(state) {
  if (state.enemyBankruptFlag || state.enemy.hp <= 0) return 'player_win';
  if (state.player.hp <= 0) return 'enemy_win';
  return null;
}

/**
 * @param {any} state
 * @returns {string[]}
 */
export function getRunDeckCardIds(state) {
  return getDeckRunCardIds(state);
}

/**
 * @param {any} state
 * @param {'player_win' | 'enemy_win'} outcome
 * @returns {NonNullable<any>}
 */
export function captureRunSummary(state, outcome) {
  const finalDeck = state.getRunDeckCardIds().map((id) => ({ ...cardLibrary[id] }));
  const finalRelics = state.relics
    .map((id) => relicLibrary[id])
    .filter(Boolean)
    .map((relic) => ({ ...relic }));
  const killerName = outcome === 'enemy_win' ? `${state.enemy.name} ${state.enemy.emoji}` : null;

  state.runSummary = {
    outcome,
    finalDeck,
    finalRelics,
    killerName,
    runStats: {
      totalDutkiEarned: state.totalDutkiEarned,
      floorReached: Math.max(state.maxFloorReached, state.currentLevel + 1),
      totalTurnsPlayed: state.totalTurnsPlayed,
    },
  };

  return state.runSummary;
}

/**
 * @param {any} state
 * @param {string[]} startingDeck
 */
export function resetForNewRun(state, startingDeck) {
  state.player = {
    ...state.baseCharacter,
    status: defaultStatus(),
    stunned: false,
    cardsPlayedThisTurn: 0,
    lansHitsAbsorbed: 0,
    weather_fog_garda: false,
    weather_frozen_vulnerable: false,
    pan_na_wlosciach: false,
    zimna_krew: false,
    czas_na_fajke: false,
    goralska_goscinnosc: false,
    koncesja_na_oscypki: false,
  };

  state.dutki = 50;
  state.totalDutkiEarned = 0;
  state.battleWins = 0;
  state.deck = [];
  state.hand = [];
  state.discard = [];
  state.exhaust = [];
  state.relics = [];
  state.seenRelicOffers = [];
  state.hardFirstShopRolled = false;
  state.certyfikowanyOscypekShopProcs = 0;
  state.cardDamageBonus = {};
  state.nextRuntimeCardInstanceId = 1;
  state.currentLevel = 0;
  state.currentNodeIndex = 1;
  state.currentNode = { x: 1, y: 0 };
  state.maxFloorReached = 1;
  state.currentAct = 1;
  state.currentActName = 'KRUPÓWKI';
  state.debugForcedNextNodeType = null;
  state.debugRevealAllMap = false;
  state.debugGodMode = false;
  state.pendingBattleDutki = true;
  state.isInputLocked = false;
  state.enemyScaleFactor = 1.0;
  state.attackCardsPlayedThisBattle = 0;
  state.pocztowkaCardsTriggeredThisBattle = 0;
  state.smyczKeptCardId = null;
  state.smyczKeptHandIndex = null;
  state.flaszkaCostSeed = {};
  state.termometerTurnParity = 0;
  state.battleTurnsElapsed = 0;
  state.totalTurnsPlayed = 0;
  state.zegarekFreeSkillAvailable = false;
  state.activeRuntimeCardId = null;
  state.shopStock = { cards: [], relic: null };
  state.lastShopMessage = '';
  state.lastVictoryMessage = '';
  state.currentScreen = 'map';
  state.lastRegularEnemyId = 'cepr';
  state.activeEventId = null;
  state.recentEventIds = [];
  state.maryna = { offeredIds: [], pickedId: null, flags: {}, counters: {} };
  state.jumpToBoss = false;
  state.forceMainBossNextBattle = false;
  state.currentWeather = 'clear';
  state.combat = {
    firstAttackUsed: false,
    activeSide: 'player',
    playerAttackMissCheck: false,
    playerAttackMissRolled: false,
    playerAttackMissed: false,
    missEventTarget: null,
  };
  state.enemyBankruptFlag = false;
  state.enemyBankruptcyPending = false;
  state.enemyBankruptcyBonus = 0;
  state.lansBreakEvent = false;
  state.lansActivatedEvent = false;
  state.lansDutkiSpentEvent = 0;
  state.rachunekResistEvent = false;
  state.hasStartedFirstBattle = false;
  state.dumaPodhalaActive = false;
  state._resetBattleScopedFlags();
  state.battleContext = 'map';
  state.pendingEventBattleEnemyId = null;
  state.pendingEventVictoryRelicId = null;
  state.runSummary = null;

  state.enemy = state._createEnemyState(enemyLibrary.cepr);
  state.generateMap();
  state.initGame(startingDeck);
}
