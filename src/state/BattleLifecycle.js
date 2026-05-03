import { cardLibrary, getCardDefinition } from '../data/cards.js';
import { enemyLibrary } from '../data/enemies.js';
import { relicLibrary } from '../data/relics.js';
import { getRunDeckCardIds as getDeckRunCardIds } from './DeckManager.js';
import { defaultStatus } from './StatusEffects.js';

/** @param {any} state @param {string} kind @param {Record<string, unknown>} payload */
function emitS(state, kind, payload) {
  state.emit(kind, payload);
}

/**
 * @param {any} state
 * @param {string[]} startingDeck
 */
export function initGame(state, startingDeck) {
  state._battleEndedEmitted = false;
  state.deck = [...startingDeck];
  state._shuffle(state.deck);
  emitS(state, 'battle_started', { enemy: { kind: 'enemy', id: state.enemy.id } });
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

  // Return any cards stolen by the duck (or other enemies) back to the deck
  if (Array.isArray(state.enemy.stolenCards) && state.enemy.stolenCards.length > 0) {
    state.deck.push(...state.enemy.stolenCards);
    state.enemy.stolenCards = [];
  }

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
  state._battleEndedEmitted = false;
  state.enemy = state._createEnemyState(nextEnemy);
  if (state.currentFloorLog) {
    state.currentFloorLog.battle = {
      enemyId: state.enemy.id,
      enemyName: state.enemy.name,
      context: 'map',
      weather: state.currentWeather ?? null,
      outcome: null,
      turns: null,
    };
  }
  // Telemetry: record which boss variant was actually selected.
  if (isBossNode) {
    state.bossEncountered = state.enemy.id;
  }
  state.battleContext = 'map';
  state._setCurrentWeatherFromNode();
  state.pendingBattleDutki = true;
  if (state.currentFloorLog?.battle) {
    state.currentFloorLog.battle.weather = state.currentWeather ?? null;
  }

  emitS(state, 'battle_started', { enemy: { kind: 'enemy', id: state.enemy.id } });

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
  if (state._battleEndedEmitted) {
    if (state.enemyBankruptFlag || state.enemy.hp <= 0) return 'player_win';
    if (state.player.hp <= 0) return 'enemy_win';
    return null;
  }
  let outcome = null;
  if (state.enemyBankruptFlag || state.enemy.hp <= 0) outcome = 'player_win';
  else if (state.player.hp <= 0) outcome = 'enemy_win';
  if (outcome) {
    state._battleEndedEmitted = true;
    if (state.currentFloorLog?.battle) {
      state.currentFloorLog.battle.outcome = outcome;
      state.currentFloorLog.battle.turns = state.battleTurnsElapsed ?? 0;
    }
    emitS(state, 'battle_ended', {
      outcome,
      enemy: { kind: 'enemy', id: state.enemy.id },
      turnCount: state.battleTurnsElapsed ?? 0,
    });
  }
  return outcome;
}

/**
 * Checks whether the player just won the Act 1 boss fight.
 * Does NOT call startAct2() — callers must do that after showing the relic reward.
 * @param {any} state
 * @returns {boolean}
 */
export function tryAdvanceActAfterBossVictory(state) {
  const currentNode = state.getCurrentMapNode();
  return state.currentAct === 1 && currentNode?.type === 'boss';
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
  const snapshotDutki = state.dutki;
  const snapshotTotalDutkiEarned = state.totalDutkiEarned;

  // Telemetry: record death level and finalise the current floor log.
  if (outcome === 'enemy_win') {
    state.deathLevel = state.currentLevel;
  }
  if (state.endFloorLog) state.endFloorLog();

  // hpAtDeath is the player's HP at run-end, clamped to ≥0 (engine_win runs
  // reach this with hp ≤ 0 but we report 0 as the floor, not a negative value).
  // maxHp is captured separately so downstream analysis can build a survival
  // score `floorReached + hpAtDeath/maxHp` even when hpAtDeath is 0.
  const hpAtDeath = Math.max(0, state.player?.hp ?? 0);
  const maxHp = Math.max(1, state.player?.maxHp ?? state.baseCharacter?.maxHp ?? 1);

  state.runSummary = {
    outcome,
    finalDeck,
    finalRelics,
    killerName,
    // Snapshot dutki values at run-end to keep telemetry immutable.
    snapshotDutki,
    snapshotTotalDutkiEarned,
    runStats: {
      totalDutkiEarned: state.totalDutkiEarned,
      floorReached: Math.max(
        state.maxFloorReached,
        (state.floorOffset ?? 0) + state.currentLevel + 1
      ),
      totalTurnsPlayed: state.totalTurnsPlayed,
      hpAtDeath,
      maxHp,
    },
  };

  emitS(state, 'run_ended', {
    outcome,
    killerEnemy: killerName ? { kind: 'enemy', id: state.enemy.id } : null,
  });

  if (typeof state.publishRunTelemetryIfReady === 'function') {
    state.publishRunTelemetryIfReady();
  }

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
  state.floorOffset = 0;
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
  // Telemetry: reset run-level tracking for the new run.
  state.runLog = [];
  state.currentFloorLog = null;
  // runSeed is set by the caller (UIManager regular run, beginSeededRun for seeded runs);
  // do NOT overwrite it here or seeded runs lose their seed.
  state.bossEncountered = null;
  state.deathLevel = null;
  state._runTelemetryPublished = false;

  state.enemy = state._createEnemyState(enemyLibrary.cepr);
  state.generateMap();
  emitS(state, 'run_started', {
    character: { kind: 'character', id: state.baseCharacter.id ?? 'jedrek' },
    difficulty: state.difficulty,
  });
  state.initGame(startingDeck);
}
