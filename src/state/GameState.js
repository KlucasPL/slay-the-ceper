import { weatherLibrary } from '../data/weather.js';
import { relicLibrary } from '../data/relics.js';
import {
  generateCardRewardChoices as generateDeckCardRewardChoices,
  getCardDamageBonus as getDeckCardDamageBonus,
  getUpgradeableAttackCards as getDeckUpgradeableAttackCards,
  removeCardFromDeck as removeDeckCard,
  upgradeCardDamage as upgradeDeckCardDamage,
} from './DeckManager.js';
import * as battleLifecycle from './BattleLifecycle.js';
import * as combatEngine from './CombatEngine.js';
import * as enemyState from './EnemyState.js';
import * as eventSystem from './EventSystem.js';
import * as mapEngine from './MapEngine.js';
import * as marynaSystem from './MarynaSystem.js';
import * as navigationState from './NavigationState.js';
import * as playerState from './PlayerState.js';
import * as relicSystem from './RelicSystem.js';
import * as shopSystem from './ShopSystem.js';
import { defaultStatus, tickStatus } from './StatusEffects.js';
import { createEventBuffer, emit as engineEmit } from '../engine/EngineEvents.js';
import { applyPoolFilter } from '../engine/PoolOverrides.js';
import { mulberry32, parseSeed } from '../engine/Rng.js';

const RARITY_WEIGHTS = {
  common: 0.7,
  uncommon: 0.25,
  rare: 0.05,
};

const MIN_ELITE_LEVEL = 4;
const EVENT_OUTCOME_EVENT_CHANCE = 0.68;
const EVENT_OUTCOME_FIGHT_CHANCE = 0.12;

/**
 * @typedef {import('../data/cards.js').StatusDef} StatusDef
 * @typedef {{ name: string, hp: number, maxHp: number, block: number, energy: number, maxEnergy: number, status: StatusDef, stunned: boolean, cardsPlayedThisTurn: number }} PlayerState
 * @typedef {import('../data/enemies.js').EnemyMoveDef} EnemyMoveDef
 * @typedef {import('../data/weather.js').WeatherId} WeatherId
 * @typedef {'fight' | 'elite' | 'shop' | 'treasure' | 'event' | 'campfire' | 'boss'} MapNodeType
 * @typedef {{ x: number, y: number, type: MapNodeType, label: string, emoji: string, weather: WeatherId, connections: number[] }} MapNode
 * @typedef {import('../data/events.js').GameEventDef} GameEventDef
 * @typedef {{ id: string, name: string, emoji: string, hp: number, maxHp: number, block: number, nextAttack: number, baseAttack: number, status: StatusDef, rachunek: number, ped: number, spriteSvg: string, phase2SpriteSvg?: string, patternType: 'random'|'loop', pattern: EnemyMoveDef[], phaseTwoPattern: EnemyMoveDef[], patternIndex: number, currentIntent: EnemyMoveDef, tookHpDamageThisTurn: boolean, bossArtifact?: number, passive: string | null, isElite: boolean, isBoss: boolean, stunnedTurns: number, lichwaTriggeredThisTurn: boolean, hartDuchaTriggered: boolean, portraitShameTurns: number, phaseTwoTriggered: boolean, evasionCharges: number }} EnemyState
 * @typedef {{ success: false, reason?: string } | { success: true, effect: import('../data/cards.js').CardEffectResult }} PlayCardResult
 * @typedef {{ enemyAttack: { raw: number, blocked: number, dealt: number }, enemyPassiveHeal: { amount: number, text: string } | null, playerPassiveHeal: { amount: number, text: string } | null }} EndTurnResult
 * @typedef {{ cards: string[], relic: string | null }} ShopStock
 */

export class GameState {
  /**
   * @param {import('../data/characters.js').CharacterDef} character
   * @param {import('../data/enemies.js').EnemyDef} enemy
   */
  constructor(character, enemy) {
    /** @type {import('../data/characters.js').CharacterDef} */
    this.baseCharacter = { ...character };
    /** @type {PlayerState} */
    this.player = {
      ...character,
      status: defaultStatus(),
      stunned: false,
      cardsPlayedThisTurn: 0,
      lansHitsAbsorbed: 0,
    };
    /** @type {number} */
    this.dutki = 50;
    /** @type {number} Total DUTKI gained during the current run (excludes starting 50). */
    this.totalDutkiEarned = 0;
    /** @type {number} Number of won battles used for scaling */
    this.battleWins = 0;
    /** @type {string[]} */
    this.deck = [];
    /** @type {string[]} */
    this.hand = [];
    /** @type {string[]} */
    this.discard = [];
    /** @type {string[]} Exhausted cards — removed from combat */
    this.exhaust = [];
    /** @type {string[]} */
    this.relics = [];
    /** @type {string[]} Relics that have already appeared as offers/rewards in this run */
    this.seenRelicOffers = [];
    /** @type {boolean} Whether the first hard-mode shop guarantee has been consumed */
    this.hardFirstShopRolled = false;
    /** @type {number} Certyfikowany Oscypek: number of shop-entry max HP boosts applied this run */
    this.certyfikowanyOscypekShopProcs = 0;
    /** @type {Record<string, number>} */
    this.cardDamageBonus = {};
    /** @type {number} */
    this.nextRuntimeCardInstanceId = 1;
    /** @type {(MapNode | null)[][]} */
    this.map = [];
    /** @type {number} */
    this.currentLevel = 0;
    /** @type {number} */
    this.currentNodeIndex = 0;
    /** @type {number} Highest floor reached in this run (1-indexed). */
    this.maxFloorReached = 1;
    /** @type {{ x: number, y: number }} */
    this.currentNode = { x: 0, y: 0 };
    /** @type {number} */
    this.debugMapRows = 15;
    /** @type {MapNodeType | null} */
    this.debugForcedNextNodeType = null;
    /** @type {boolean} */
    this.debugRevealAllMap = false;
    /** @type {boolean} */
    this.debugGodMode = false;
    /** @type {boolean} */
    this.pendingBattleDutki = true;
    /** @type {boolean} Global interaction lock used by cinematic overlays */
    this.isInputLocked = false;
    /** @type {'normal' | 'hard'} */
    this.difficulty = 'normal';
    /** @type {number} Cumulative HP/damage multiplier for hard mode scaling */
    this.enemyScaleFactor = 1.0;
    /** @type {number} Attack cards played this battle (bilet_tpn) */
    this.attackCardsPlayedThisBattle = 0;
    /** @type {number} Count of cards triggered by pocztowka_giewont this battle (max 2) */
    this.pocztowkaCardsTriggeredThisBattle = 0;
    // ── Per-turn relic counters (reset at startTurn) ──
    /** @type {number} muffin_oscypkowy: attack cards played this turn (for every-2nd trigger) */
    this.muffinAttackCountThisTurn = 0;
    /** @type {number} muffin_oscypkowy: energy granted this turn (max 2) */
    this.muffinEnergyGrantedThisTurn = 0;
    /** @type {number} dzban_mleka: heal-based energy granted this turn (max 2) */
    this.dzbanEnergyGrantedThisTurn = 0;
    /** @type {boolean} kedziorek_na_energie: penalty already queued this turn */
    this.kedziorekPenaltyTriggeredThisTurn = false;
    /** @type {boolean} ciupaga_ekspresowa: free-skill discount used this turn */
    this.ciupagaExpresowaTurnUsed = false;
    // ── Cross-battle relic flags ──
    /** @type {boolean} portfel_turysty: pending +1 energy for next battle start */
    this.portfelTurystyPendingEnergy = false;
    /** @type {boolean} portfel_turysty: first-purchase bonus already used this shop visit */
    this.portfelTurystyUsedThisShop = false;
    /** @type {boolean} zaszczyt_upadku: draw-2 pending for next turn start (after Lans break) */
    this.zaszytUpadkuDrawPending = false;
    // ── Per-card / per-turn card mechanics ──
    /** @type {boolean} schowek_za_pazucha: player chose to retain a card this turn */
    this.schowekRetainPending = false;
    /** @type {number} goralski_upor (skill blur): block amount to preserve into next turn */
    this.blurBlockAmount = 0;
    /** @type {boolean} zasieki_z_gubalowki: counter-attack active this turn */
    this.zasiekiActive = false;
    /** @type {number} goralski_upor_moc (power): draws queued for next turn start */
    this.goralskiUporDrawPending = 0;
    /** @type {boolean} szal_bacy: flag marking that the normal start-of-turn draw is done */
    this.szalBacyTurnDrawDone = false;
    /** @type {number} */
    this.currentAct = 1;
    /** @type {string} */
    this.currentActName = 'KRUPÓWKI';
    /** @type {string | null} Card ID queued by smycz_zakopane for next turn */
    this.smyczKeptCardId = null;
    /** @type {number | null} Exact hand slot selected for smycz_zakopane */
    this.smyczKeptHandIndex = null;
    /** @type {Record<string, number>} Random cost overrides for cards in hand (flaszka_sliwowicy) */
    this.flaszkaCostSeed = {};
    /** @type {number} Parity for zepsuty_termometr: 0=tick enemy status, 1=skip */
    this.termometerTurnParity = 0;
    /** @type {number} Turns elapsed in current battle (incremented at start of each player turn) */
    this.battleTurnsElapsed = 0;
    /** @type {number} Total player turns played in this run */
    this.totalTurnsPlayed = 0;
    /** @type {boolean} Góralski Zegarek: free skill available this turn */
    this.zegarekFreeSkillAvailable = false;
    /** @type {ShopStock} */
    this.shopStock = { cards: [], relic: null };
    /** @type {string} */
    this.lastShopMessage = '';
    /** @type {string} */
    this.lastVictoryMessage = '';
    /** @type {'title' | 'map' | 'battle' | 'event'} */
    this.currentScreen = 'title';
    /** @type {'map' | 'event' | 'debug' | 'tutorial'} */
    this.battleContext = 'map';
    /** @type {string | null} Last regular enemy ID picked for random encounters */
    this.lastRegularEnemyId =
      enemy.id !== 'boss' && enemy.id !== 'fiakier' && enemy.id !== 'pomocnik_fiakra'
        ? enemy.id
        : null;
    /** @type {string | null} */
    this.activeEventId = null;
    /** @type {string[]} Recently selected event IDs (up to pool-size − 1) to prevent repeated picks */
    this.recentEventIds = [];
    /** @type {{ offeredIds: string[], pickedId: string | null, flags: Record<string, boolean>, counters: Record<string, number> }} */
    this.maryna = { offeredIds: [], pickedId: null, flags: {}, counters: {} };
    /** @type {string | null} */
    this.pendingEventBattleEnemyId = null;
    /** @type {string | null} */
    this.pendingEventVictoryRelicId = null;
    /** @type {boolean} */
    this.jumpToBoss = false;
    /** @type {boolean} */
    this.forceMainBossNextBattle = false;
    /** @type {WeatherId} */
    this.currentWeather = 'clear';
    /** @type {{ firstAttackUsed: boolean, activeSide: 'player' | 'enemy', playerAttackMissCheck: boolean, playerAttackMissRolled: boolean, playerAttackMissed: boolean, missEventTarget: 'player' | 'enemy' | null }} */
    this.combat = {
      firstAttackUsed: false,
      activeSide: 'player',
      playerAttackMissCheck: false,
      playerAttackMissRolled: false,
      playerAttackMissed: false,
      missEventTarget: null,
    };
    /** @type {boolean} */
    this.enemyBankruptFlag = false;
    /** @type {boolean} */
    this.enemyBankruptcyPending = false;
    /** @type {number} */
    this.enemyBankruptcyBonus = 0;
    /** @type {boolean} */
    this.lansBreakEvent = false;
    /** @type {boolean} One-shot flag for UI messaging when Lans becomes active */
    this.lansActivatedEvent = false;
    /** @type {number} One-shot accumulator for Dutki consumed by active Lans */
    this.lansDutkiSpentEvent = 0;
    /** @type {boolean} One-shot flag for messaging when enemy resists rachunek win condition */
    this.rachunekResistEvent = false;
    /** @type {boolean} Global audio mute flag */
    this.isMuted = false;
    /** @type {boolean} */
    this.hasStartedFirstBattle = false;
    /** @type {boolean} Rare power: reflect damage when enough block is lost */
    this.dumaPodhalaActive = false;
    /** @type {number} One-shot bonus consumed by the next played attack card */
    this.nextAttackCardBonus = 0;
    /** @type {number} Temporary attack bonus bound to the currently resolving attack card */
    this.currentAttackCardBonus = 0;
    /** @type {string | null} Exact runtime card ID currently being resolved */
    this.activeRuntimeCardId = null;
    /** @type {boolean} */
    this.enemyEvasionEvent = false;
    /** @type {string | null} */
    this.enemyPhaseTransitionMessage = null;
    /** @type {number | null} */
    this.guaranteedTreasureRow = null;
    /** @type {number} */
    this.guaranteedTreasureColumn = 1;
    /** @type {number | null} */
    this.midCampfireLevel = null;
    /** @type {{ outcome: 'player_win' | 'enemy_win', finalDeck: import('../data/cards.js').CardDef[], finalRelics: import('../data/relics.js').RelicDef[], killerName: string | null, runStats: { totalDutkiEarned: number, floorReached: number, totalTurnsPlayed: number } } | null} */
    this.runSummary = null;
    /** @type {{ buffer: import('../engine/EngineEvents.js').EngineEvent[], seq: number }} */
    this._engineEvents = createEventBuffer();
    /** @type {import('../engine/PoolOverrides.js').PoolOverrides | null} */
    this._poolOverrides = null;
    /** @type {'summary' | 'full'} */
    this._eventVerbosity = 'summary';
    /** @type {() => number} Seeded PRNG for this run; defaults to Math.random until EngineController seeds it */
    // eslint-disable-next-line no-restricted-syntax
    this.rng = () => Math.random(); // nondeterminism-ok: unseeded default, replaced by EngineController.startRun
    /** @type {Array<Object>} Telemetry: per-floor log entries for this run */
    this.runLog = [];
    /** @type {Object | null} Telemetry: log being built for the current floor */
    this.currentFloorLog = null;
    /** @type {string | null} Telemetry: run identifier; set by UIManager or beginSeededRun, stays null until a run starts */
    this.runSeed = null;
    /** @type {string | null} Telemetry: id/type of boss encountered */
    this.bossEncountered = null;
    /** @type {number | null} Telemetry: floor level where the player died */
    this.deathLevel = null;
    /** @type {EnemyState} */
    this.enemy = this._createEnemyState(enemy);
    this.generateMap();
  }

  /**
   * Emit one engine event into the buffer.
   * S-tier kinds always emit; F-tier kinds only emit when verbosity is 'full'.
   * @param {import('../engine/EngineEvents.js').EngineEventKind} kind
   * @param {Record<string, unknown>} payload
   */
  emit(kind, payload) {
    engineEmit(this, kind, payload);
  }

  /**
   * Filter a pool of entity IDs using the current pool overrides.
   * @param {'cards'|'relics'|'boons'|'events'|'enemy_regular'|'enemy_elite'|'enemy_boss'} kind
   * @param {string[]} ids
   * @returns {string[]}
   */
  filterPool(kind, ids) {
    return applyPoolFilter(this._poolOverrides, kind, ids);
  }

  /** @returns {(MapNode | null)[][]} */
  generateMap(rows = this.debugMapRows) {
    return mapEngine.generateMap(this, rows);
  }

  /**
   * @param {MapNodeType} type
   * @param {number} x
   * @param {number} y
   * @returns {MapNode}
   */
  _createMapNode(type, x, y) {
    return mapEngine.createMapNode(this, type, x, y);
  }

  /**
   * Force all row-1 nodes to be Cepr fights after Maryna.
   * @param {(import('./GameState.js').MapNode | null)[][]} map
   */
  _forceRow1CeprFights(map) {
    mapEngine.forceRow1CeprFights(this, map);
  }

  /**
   * Rolls 3 unique Maryna boon IDs and stores them in state.
   * @param {number} [count]
   * @returns {string[]}
   */
  rollMarynaChoices(count = 3) {
    return marynaSystem.rollMarynaChoices(this, count);
  }

  /**
   * Pick a Maryna boon, store it, add corresponding relic, apply immediate effects.
   * @param {string} boonId
   * @returns {boolean}
   */
  pickMarynaBoon(boonId) {
    return marynaSystem.pickMarynaBoon(this, boonId);
  }

  /**
   * Applies immediate (one-shot) effects for the chosen boon.
   * @param {string} boonId
   */
  _applyMarynaBoonImmediateEffects(boonId) {
    marynaSystem.applyMarynaBoonImmediateEffects(this, boonId);
    // kiesa delayed bonus, zloty_rozaniec, lista_zakupow, tajny_skladnik: handled in hooks
  }

  /**
   * @param {MapNodeType} type
   * @returns {{ label: string, emoji: string }}
   */
  getMapNodeMeta(type) {
    return navigationState.getMapNodeMeta(type);
  }

  /** @returns {MapNodeType} */
  _rollMidNodeType(level = MIN_ELITE_LEVEL) {
    return mapEngine.rollMidNodeType(level, this.rng);
  }

  /**
   * @param {MapNodeType} nodeType
   * @returns {WeatherId}
   */
  _rollNodeWeather(nodeType) {
    return mapEngine.rollNodeWeather(nodeType, this);
  }

  /**
   * @param {(MapNode | null)[][]} map
   */
  _seedRequiredPaths(map) {
    mapEngine.seedRequiredPaths(this, map);
  }

  /**
   * @param {(MapNode | null)[][]} map
   */
  _connectOptionalGridNodes(map) {
    mapEngine.connectOptionalGridNodes(this, map);
  }

  /**
   * Removes crossing edges between adjacent map levels.
   * For any pair of edges (a->t1, b->t2) where a < b and t1 > t2,
   * targets are swapped to (a->t2, b->t1). This preserves edge count and
   * inbound totals while eliminating local crossings.
   * @param {(MapNode | null)[][]} map
   */
  _removeCrossingConnections(map) {
    mapEngine.removeCrossingConnections(this, map);
  }

  /**
   * @param {(MapNode | null)[][]} map
   */
  _ensureGuaranteedPathRewards(map) {
    mapEngine.ensureGuaranteedPathRewards(this, map);
  }

  /**
   * @param {(MapNode | null)[][]} map
   */
  _enforceSpecialNodeLimits(map) {
    mapEngine.enforceSpecialNodeLimits(this, map);
  }

  /**
   * @param {number} level
   * @param {number} mapLength
   * @returns {MapNodeType | null}
   */
  _forcedNodeTypeForLevel(level, mapLength) {
    if (level === mapLength - 1) return 'boss';
    if (level === mapLength - 2) return 'campfire';
    if (this.midCampfireLevel !== null && level === this.midCampfireLevel) return 'campfire';
    if (this.guaranteedTreasureRow !== null && level === this.guaranteedTreasureRow) {
      return 'treasure';
    }
    return null;
  }

  /**
   * @param {(MapNode | null)[][]} map
   */
  _ensureReachableElite(map) {
    mapEngine.ensureReachableElite(this, map);
  }

  /**
   * Guarantees that at least one reachable `event` node resolves to a real event window
   * (eventOutcome === 'event') during a run.
   * @param {(MapNode | null)[][]} map
   */
  _ensureReachableTrueEvent(map) {
    mapEngine.ensureReachableTrueEvent(this, map);
  }

  /**
   * @param {(MapNode | null)[][]} map
   * @param {MapNodeType} type
   * @param {number} maxCount
   * @param {Set<string>} protectedKeys
   * @param {Set<string>} reachableKeys
   */
  _trimNodeType(map, type, maxCount, protectedKeys, reachableKeys) {
    mapEngine.trimNodeType(this, map, type, maxCount, protectedKeys, reachableKeys);
  }

  /**
   * @param {(MapNode | null)[][]} map
   * @returns {Array<{ x: number, y: number }>}
   */
  _getReachableCoordinates(map) {
    return mapEngine.getReachableCoordinates(map);
  }

  /**
   * @param {MapNode | null} node
   * @param {MapNodeType} type
   */
  _setNodeType(node, type) {
    mapEngine.setNodeType(this, node, type);
  }

  /**
   * @param {number} x
   * @returns {number[]}
   */
  _getAdjacentColumns(x) {
    return mapEngine.getAdjacentColumns(x);
  }

  /**
   * @param {number} x
   * @returns {number}
   */
  _pickNextColumn(x) {
    return mapEngine.pickNextColumn(this, x);
  }

  /**
   * @param {MapNode | null} node
   * @param {number} targetX
   */
  _linkNode(node, targetX) {
    mapEngine.linkNode(node, targetX);
  }

  /**
   * @param {(MapNode | null)[][]} map
   * @param {number} y
   * @param {number} x
   * @returns {boolean}
   */
  _hasInbound(map, y, x) {
    return mapEngine.hasInbound(map, y, x);
  }

  /**
   * @param {(MapNode | null)[][]} map
   */
  _pruneUnreachableNodes(map) {
    mapEngine.pruneUnreachableNodes(this, map);
  }

  /** @returns {number[]} */
  getReachableNodes() {
    return navigationState.getReachableNodes(this);
  }

  /**
   * @param {number} level
   * @param {number} nodeIndex
   * @returns {boolean}
   */
  canTravelTo(level, nodeIndex) {
    return navigationState.canTravelTo(this, level, nodeIndex);
  }

  /**
   * @param {number} level
   * @param {number} nodeIndex
   * @returns {MapNode | null}
   */
  travelTo(level, nodeIndex) {
    return navigationState.travelTo(this, level, nodeIndex);
  }

  /**
   * @returns {MapNode | null}
   */
  getCurrentMapNode() {
    return navigationState.getCurrentMapNode(this);
  }

  /** @returns {GameEventDef | null} */
  pickRandomEventDef() {
    return eventSystem.pickRandomEventDef(this);
  }

  /** @returns {'I' | 'II' | 'III'} */
  _getCurrentAct() {
    return navigationState.getCurrentAct(this);
  }

  /** @returns {number} */
  getPrestizNaKredytBlock() {
    return shopSystem.getPrestizNaKredytBlock(this);
  }

  /** @returns {'event' | 'fight' | 'shop'} */
  rollEventNodeOutcome() {
    const roll = this.rng();
    if (roll < EVENT_OUTCOME_EVENT_CHANCE) return 'event';
    if (roll < EVENT_OUTCOME_EVENT_CHANCE + EVENT_OUTCOME_FIGHT_CHANCE) return 'fight';
    return 'shop';
  }

  /**
   * @param {string | null} eventId
   */
  setActiveEvent(eventId) {
    eventSystem.setActiveEvent(this, eventId);
  }

  /** @returns {GameEventDef | null} */
  getActiveEventDef() {
    return eventSystem.getActiveEventDef(this);
  }

  clearActiveEvent() {
    eventSystem.clearActiveEvent(this);
  }

  /**
   * @param {number} choiceIndex
   * @returns {{ success: boolean, message: string }}
   */
  applyActiveEventChoice(choiceIndex) {
    return eventSystem.applyActiveEventChoice(this, choiceIndex);
  }

  /** @returns {boolean} */
  applyJumpToBossShortcut() {
    return navigationState.applyJumpToBossShortcut(this);
  }

  /** @returns {import('../data/weather.js').WeatherDef} */
  getCurrentWeather() {
    return weatherLibrary[this.currentWeather] ?? weatherLibrary.clear;
  }

  _setCurrentWeatherFromNode() {
    navigationState.setCurrentWeatherFromNode(this);
  }

  /**
   * @param {number} amount
   * @returns {string}
   */
  getDutkiLabel(amount) {
    const abs = Math.abs(amount);
    const lastTwo = abs % 100;
    const last = abs % 10;

    if (lastTwo >= 12 && lastTwo <= 14) return 'dutków';
    if (last === 1) return 'dutka';
    if (last >= 2 && last <= 4) return 'dutki';
    return 'dutków';
  }

  /**
   * @param {'player' | 'enemy'} side
   */
  _registerWeatherMiss(side) {
    this.combat.missEventTarget = side;
  }

  /** @returns {{ target: 'player' | 'enemy', text: string } | null} */
  consumeWeatherMissEvent() {
    if (!this.combat.missEventTarget) return null;
    const target = this.combat.missEventTarget;
    this.combat.missEventTarget = null;
    return { target, text: 'PUDŁO!' };
  }

  /** @returns {string | null} */
  consumeLansBreakEvent() {
    if (!this.lansBreakEvent) return null;
    this.lansBreakEvent = false;
    return 'BANKRUT!';
  }

  /** @returns {boolean} */
  consumeLansActivatedEvent() {
    if (!this.lansActivatedEvent) return false;
    this.lansActivatedEvent = false;
    return true;
  }

  /** @returns {number} */
  consumeLansDutkiSpentEvent() {
    const spent = this.lansDutkiSpentEvent;
    this.lansDutkiSpentEvent = 0;
    return spent;
  }

  /** @returns {{ target: 'enemy', text: string } | null} */
  consumeRachunekResistEvent() {
    if (!this.rachunekResistEvent) return null;
    this.rachunekResistEvent = false;
    return { target: 'enemy', text: 'ODPORNA NA RACHUNEK!' };
  }

  /** @returns {boolean} */
  consumeEnemyEvasionEvent() {
    if (!this.enemyEvasionEvent) return false;
    this.enemyEvasionEvent = false;
    return true;
  }

  /** @returns {string | null} */
  consumeEnemyPhaseTransitionMessage() {
    if (!this.enemyPhaseTransitionMessage) return null;
    const message = this.enemyPhaseTransitionMessage;
    this.enemyPhaseTransitionMessage = null;
    return message;
  }

  /**
   * @param {number} amount
   */
  queueNextAttackCardBonus(amount) {
    playerState.queueNextAttackCardBonus(this, amount);
  }

  /**
   * @param {string} enemyId
   * @param {string | null} [victoryRelicId]
   */
  queueEventBattle(enemyId, victoryRelicId = null) {
    eventSystem.queueEventBattle(this, enemyId, victoryRelicId);
  }

  /** @returns {{ enemyId: string, rewardRelicId: string | null } | null} */
  consumeQueuedEventBattle() {
    return eventSystem.consumeQueuedEventBattle(this);
  }

  /** @returns {string | null} */
  consumePendingEventVictoryRelicReward() {
    return eventSystem.consumePendingEventVictoryRelicReward(this);
  }

  // ── Telemetry ─────────────────────────────────────────────────────────────

  /**
   * Starts a new per-floor telemetry log for the given map node.
   * @param {{ type?: string, label?: string }} node
   */
  startFloorLog(node) {
    this.currentFloorLog = {
      level: this.currentLevel || 1,
      act: this.currentAct || 1,
      nodeType: node.type || 'unknown',
      nodeLabel: node.label || '',
      startingHp: this.player.hp,
      startingDutki: this.dutki,
      purchases: [],
      rewards: [],
      events: [],
      campfire: [],
      upgrades: [],
      removals: [],
    };
  }

  /**
   * Records an action item into the current floor log under the given category.
   * @param {'purchases'|'rewards'|'events'|'campfire'|'upgrades'|'removals'} category
   * @param {any} item
   */
  logAction(category, item) {
    if (
      this.currentFloorLog &&
      Object.prototype.hasOwnProperty.call(this.currentFloorLog, category)
    ) {
      this.currentFloorLog[category].push(item);
    }
  }

  /**
   * Finalises the current floor log and appends it to runLog.
   */
  endFloorLog() {
    if (this.currentFloorLog) {
      this.currentFloorLog.endingHp = this.player.hp;
      this.currentFloorLog.endingDutki = this.dutki;
      this.runLog.push({ ...this.currentFloorLog });
      this.currentFloorLog = null;
    }
  }

  /**
   * Returns the complete run telemetry as a JSON string.
   * @returns {string}
   */
  getRunTelemetryJSON() {
    const summary = this.runSummary;
    const currentDutki = summary?.snapshotDutki ?? this.dutki;
    const finalDutki =
      summary?.snapshotTotalDutkiEarned ?? summary?.runStats?.totalDutkiEarned ?? currentDutki;
    const finalDeck = summary?.finalDeck ?? [...this.deck];
    const finalRelics = summary?.finalRelics ?? [...this.relics];
    const finalHp = summary ? this.player.hp : this.player.hp;
    const maxHp = this.player.maxHp;

    return JSON.stringify(
      {
        seed: this.runSeed,
        bossEncountered: this.bossEncountered,
        deathLevel: this.deathLevel,
        finalHp,
        maxHp,
        finalDutki,
        currentDutki,
        deckSize: finalDeck.length,
        finalDeck,
        finalRelics,
        floorHistory: this.runLog,
      },
      null,
      2
    );
  }

  // ── End Telemetry ──────────────────────────────────────────────────────────

  _checkEnemyBankruptcy() {
    enemyState.checkEnemyBankruptcy(this);
  }

  /** @returns {boolean} */
  _isEnemyBankruptcyConditionMet() {
    return enemyState.isEnemyBankruptcyConditionMet(this);
  }

  /** @returns {boolean} */
  _resolveEnemyBankruptcyAtTurnStart() {
    return enemyState.resolveEnemyBankruptcyAtTurnStart(this);
  }

  enemyBankrupt() {
    enemyState.enemyBankrupt(this);
  }

  /**
   * @param {number} amount
   */
  addDutki(amount) {
    shopSystem.addDutki(this, amount);
  }

  /**
   * @param {number} amount
   */
  addEnemyRachunek(amount) {
    enemyState.addEnemyRachunek(this, amount);
  }

  /**
   * @param {PlayerState | EnemyState} entity
   */
  _applyHalnyBlockDrain(entity) {
    playerState.applyHalnyBlockDrain(this, entity);
  }

  /** @returns {string | null} */
  grantTreasureRelic() {
    return relicSystem.grantTreasureRelic(this);
  }

  /**
   * @param {boolean} [forceDrop=false]
   * @returns {string | null}
   */
  generateRelicReward(forceDrop = false) {
    return relicSystem.generateRelicReward(this, forceDrop);
  }

  /**
   * Builds a multi-choice relic offer (e.g. elite reward screen) from the same
   * global pool rules as other relic rewards.
   * @param {number} count
   * @returns {string[]}
   */
  generateRelicChoices(count) {
    return relicSystem.generateRelicChoices(this, count);
  }

  /**
   * Builds a 3-choice offer from the Act 2 boss-only relic pool.
   * Called after Act 1 boss victory before transitioning to Act 2.
   * @param {number} [count=3]
   * @returns {string[]}
   */
  generateAct2TransitionRelicChoices(count = 3) {
    const pool = relicSystem.buildAct2TransitionRelicPool(this);
    if (pool.length === 0) return [];
    return this._pickUniqueItems(pool, relicLibrary, Math.min(count, pool.length));
  }

  /**
   * @param {number} count
   * @returns {string[]}
   */
  generateCardRewardChoices(count) {
    return generateDeckCardRewardChoices(this, count);
  }

  /**
   * Emit reward_picked for a card or relic chosen from a reward screen.
   * Called by ActionDispatcher after the player accepts a reward.
   * @param {'card'|'relic'} kind
   * @param {string} id
   */
  notifyRewardPicked(kind, id) {
    this.emit('reward_picked', { entity: { kind, id } });
  }

  /**
   * Emit campfire_choice.
   * Called by ActionDispatcher after a campfire option is taken.
   * @param {'rest'|'upgrade'|'leave'} option
   * @param {string | null} [cardId]
   */
  notifyCampfireChoice(option, cardId = null) {
    this.emit('campfire_choice', { option, card: cardId ? { kind: 'card', id: cardId } : null });
  }

  /**
   * Emit deck_mutation add + reward_picked for a card added via reward screen.
   * Called by ActionDispatcher after the player takes a card reward.
   * @param {string} cardId
   */
  notifyCardRewardPicked(cardId) {
    this.deck.push(cardId);
    this.emit('deck_mutation', { mutation: 'add', card: { kind: 'card', id: cardId } });
    this.emit('reward_picked', { entity: { kind: 'card', id: cardId } });
  }

  /**
   * @returns {string[]}
   */
  _buildAvailableRelicPool() {
    return relicSystem.buildAvailableRelicPool(this);
  }

  /**
   * @param {string} relicId
   */
  _markRelicAsSeen(relicId) {
    relicSystem.markRelicAsSeen(this, relicId);
  }

  /**
   * @param {string[]} pool
   * @param {Record<string, { rarity?: 'common' | 'uncommon' | 'rare' }>} library
   * @param {{ common: number, uncommon: number, rare: number }} [rarityWeights]
   * @returns {string | null}
   */
  getRandomItem(pool, library, rarityWeights = RARITY_WEIGHTS) {
    return relicSystem.getRandomItem(pool, library, rarityWeights, this.rng);
  }

  /**
   * @param {string[]} pool
   * @param {Record<string, { rarity?: 'common' | 'uncommon' | 'rare' }>} library
   * @param {number} count
   * @param {{ common: number, uncommon: number, rare: number }} [rarityWeights]
   * @returns {string[]}
   */
  _pickUniqueItems(pool, library, count, rarityWeights = RARITY_WEIGHTS) {
    return relicSystem.pickUniqueItems(this, pool, library, count, rarityWeights);
  }

  /**
   * @param {string} relicId
   * @returns {boolean}
   */
  hasRelic(relicId) {
    return relicSystem.hasRelic(this, relicId);
  }

  /**
   * @param {number} cost
   * @returns {boolean}
   */
  spendDutki(cost) {
    return shopSystem.spendDutki(this, cost);
  }

  /**
   * @returns {ShopStock}
   */
  generateShopStock() {
    return shopSystem.generateShopStock(this);
  }

  /**
   * @param {import('../data/cards.js').CardDef | import('../data/relics.js').RelicDef} item
   * @param {'card' | 'relic'} type
   * @returns {{ success: boolean, message: string }}
   */
  buyItem(item, type) {
    return shopSystem.buyItem(this, item, type);
  }

  /**
   * @param {string} cardId
   * @returns {boolean}
   */
  removeCardFromDeck(cardId) {
    return removeDeckCard(this, cardId);
  }

  /**
   * @param {string} relicId
   * @returns {boolean}
   */
  addRelic(relicId) {
    return relicSystem.addRelic(this, relicId);
  }

  /**
   * Permanently increases player's maximum HP and heals by the same amount.
   * @param {number} amount
   */
  gainMaxHp(amount) {
    playerState.gainMaxHp(this, amount);
  }

  /**
   * @param {number} amount
   */
  healPlayer(amount) {
    playerState.healPlayer(this, amount);
  }

  /**
   * Applies negative status to enemy, consuming boss artifact charges first.
   * @param {'weak' | 'fragile'} key
   * @param {number} amount
   */
  applyEnemyDebuff(key, amount) {
    const bonus = key === 'weak' && this.player.zimna_krew ? 1 : 0;
    enemyState.applyEnemyDebuff(this, key, amount + bonus);
  }

  /**
   * @param {string} cardId
   * @param {number} amount
   */
  upgradeCardDamage(cardId, amount = 3) {
    upgradeDeckCardDamage(this, cardId, amount);
  }

  /**
   * @param {string} cardId
   * @returns {number}
   */
  getCardDamageBonus(cardId) {
    return getDeckCardDamageBonus(this, cardId);
  }

  /**
   * @returns {string[]}
   */
  getUpgradeableAttackCards() {
    return getDeckUpgradeableAttackCards(this);
  }

  /**
   * Returns the effective cost of a card in hand, accounting for flaszka_sliwowicy overrides.
   * @param {string} cardId
   * @returns {number}
   */
  getCardCostInHand(cardId) {
    return playerState.getCardCostInHand(this, cardId);
  }

  /**
   * Returns the shop purchase price for a card, applying active relic discounts.
   * @param {string} cardId
   * @returns {number}
   */
  getCardShopPrice(cardId) {
    return playerState.getCardShopPrice(this, cardId);
  }

  /**
   * Returns the current cost to remove a card in the shop.
   * @returns {number}
   */
  getShopRemovalPrice() {
    return playerState.getShopRemovalPrice(this);
  }

  /**
   * Called after a card is removed in the shop.
   * Marks lista_zakupow free removal as used and ends the discount.
   */
  afterShopCardRemoval() {
    playerState.afterShopCardRemoval(this);
  }

  /**
   * Marks a hand slot to be kept for next turn (smycz_zakopane).
   * Toggles off when the same slot is selected again.
   * @param {number} handIndex
   */
  setSmyczKeptCard(handIndex) {
    playerState.setSmyczKeptCard(this, handIndex);
  }

  /**
   * @returns {number}
   */
  grantBattleDutki() {
    return shopSystem.grantBattleDutki(this);
  }

  /**
   * @returns {number}
   */
  _drawPerTurn() {
    return combatEngine.drawPerTurn(this);
  }

  /**
   * Applies one-time effects that should trigger at the start of each battle.
   */
  _applyBattleStartRelics() {
    combatEngine.applyBattleStartRelics(this);
  }

  /** @returns {boolean} */
  _isLansActive() {
    return playerState.isLansActive(this);
  }

  /**
   * @param {boolean} active
   */
  _setLansActive(active) {
    playerState.setLansActive(this, active);
  }

  /**
   * @param {number} amount
   */
  gainPlayerBlockFromCard(amount) {
    playerState.gainPlayerBlockFromCard(this, amount);
  }

  /**
   * @param {import('../data/enemies.js').EnemyDef} enemyDef
   * @returns {EnemyState}
   */
  _createEnemyState(enemyDef) {
    return enemyState.createEnemyState(this, enemyDef);
  }

  /** @returns {import('../data/enemies.js').EnemyDef} */
  _pickRandomEnemyDef(isElite = false) {
    return enemyState.pickRandomEnemyDef(this, isElite);
  }

  /** @returns {import('../data/enemies.js').EnemyDef} */
  _pickFinalBossDef() {
    return enemyState.pickFinalBossDef(this);
  }

  /**
   * Seeds the deck, shuffles, and runs the first turn.
   * @param {string[]} startingDeck
   */
  initGame(startingDeck) {
    battleLifecycle.initGame(this, startingDeck);
  }

  /**
   * @param {string[]} array
   */
  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * @param {number} amount
   * @returns {string[]}
   */
  _drawCards(amount) {
    return combatEngine.drawCards(this, amount);
  }

  /**
   * Rolls enemy intent around baseAttack with a spread of 6 values.
   * Base 8 yields range 5..10.
   * @returns {number}
   */
  _rollEnemyAttack(enemyEntity = this.enemy) {
    return enemyState.rollEnemyAttack(this, enemyEntity);
  }

  /**
   * @param {EnemyState} enemyEntity
   * @returns {EnemyMoveDef}
   */
  _buildEnemyIntent(enemyEntity) {
    return enemyState.buildEnemyIntent(this, enemyEntity);
  }

  /**
   * Refreshes the enemy intent after state changes.
   */
  _refreshEnemyIntent() {
    enemyState.refreshEnemyIntent(this);
  }

  /**
   * Calculates final outgoing damage with status modifiers.
   * Rules:
   * - weak: -25% outgoing damage (floor)
   * - strength: flat bonus
   * - next_double: only for player attacking enemy, then consumed
   * @param {number} baseDmg
   * @param {PlayerState | EnemyState} sourceEntity
   * @param {PlayerState | EnemyState} targetEntity
   * @returns {number}
   */
  calculateDamage(baseDmg, sourceEntity, targetEntity) {
    return playerState.calculateDamage(this, baseDmg, sourceEntity, targetEntity);
  }

  /**
   * Calculates effective attack damage: applies strength bonus, next_double, and weak penalty.
   * Mutates attacker.status.next_double (resets it when consumed).
   * @param {PlayerState | EnemyState} attacker
   * @param {number} baseDmg
   * @returns {number}
   */
  _calcAttackDamage(attacker, baseDmg) {
    const target = attacker === this.player ? this.enemy : this.player;
    const attackBonus =
      attacker === this.player && target === this.enemy ? this.currentAttackCardBonus : 0;
    return this.calculateDamage(baseDmg + attackBonus, attacker, target);
  }

  _handleEnemyPhaseTransitions() {
    enemyState.handleEnemyPhaseTransitions(this);
  }

  _resetBattleScopedFlags() {
    combatEngine.resetBattleScopedFlags(this);
  }

  /**
   * Applies damage to the Ceper (enemy), accounting for their Garda.
   * @param {number} dmg
   * @returns {{ raw: number, blocked: number, dealt: number }}
   */
  _applyDamageToEnemy(dmg) {
    return combatEngine.applyDamageToEnemy(this, dmg);
  }

  /**
   * Applies damage to the Góral (player), accounting for their Garda.
   * @param {number} dmg
   * @returns {{ raw: number, blocked: number, dealt: number }}
   */
  _applyDamageToPlayer(dmg) {
    return combatEngine.applyDamageToPlayer(this, dmg);
  }

  /**
   * @param {number} amount
   * @returns {{ raw: number, blocked: number, dealt: number }}
   */
  takeDamage(amount) {
    return playerState.takeDamage(this, amount);
  }

  /**
   * @returns {{ raw: number, blocked: number, dealt: number }}
   */
  _applyEnemyIntent() {
    return combatEngine.applyEnemyIntent(this);
  }

  /**
   * @returns {number}
   */
  getEnemyIntentDamage() {
    return combatEngine.getEnemyIntentDamage(this);
  }

  /**
   * @returns {string}
   */
  getEnemyIntentText() {
    return combatEngine.getEnemyIntentText(this);
  }

  /**
   * @returns {Array<{ text: string, tooltip: string }>}
   */
  getEnemySpecialStatuses() {
    /** @type {Array<{ icon: string, label: string, value: string|number|null, tooltip: string }>} */
    const specials = [
      {
        icon: '🧾',
        label: 'Rachunek',
        value: this.enemy.rachunek,
        tooltip:
          'Gdy rachunek osiągnie lub przebije aktualną Krzepę wroga, przeciwnik bankrutuje i przegrywa walkę.',
      },
    ];

    if (this.enemy.id === 'baba') {
      specials.push({
        icon: '🧀',
        label: 'Świeży oscypek',
        value: null,
        tooltip:
          'Na końcu tury gracza Gaździna leczy 3 Krzepy, jeśli nie dostała obrażeń w tej turze.',
      });
    }

    if (this.enemy.id === 'boss') {
      specials.push({
        icon: '🛡️',
        label: 'Artefakt',
        value: this.enemy.bossArtifact ?? 0,
        tooltip: 'Blokuje pierwsze 2 negatywne statusy nałożone przez gracza.',
      });
    }

    if (this.enemy.passive === 'brak_reszty') {
      specials.push({
        icon: '💸',
        label: 'Brak Reszty',
        value: null,
        tooltip: 'Gdy zadaje obrażenia Krzepie, kradnie 3 dutki.',
      });
    }

    if (this.enemy.passive === 'targowanie_sie') {
      specials.push({
        icon: '🤝',
        label: 'Targowanie się',
        value: null,
        tooltip: 'Odporny na Rachunek — nie może zbankrutować.',
      });
    }

    if (this.enemy.passive === 'ochrona_wizerunku') {
      specials.push({
        icon: '🪞',
        label: 'Ochrona Wizerunku',
        value: 1,
        tooltip: 'Każde trafienie zadaje graczowi 1 obrażenie zwrotne.',
      });
    }

    if (this.enemy.passive === 'parcie_na_szklo') {
      specials.push({
        icon: '🤳',
        label: 'Parcie na Szkło',
        value: null,
        tooltip: 'Gdy gracz ma Lans, na początku tury wroga zyskuje +2 Siły.',
      });
    }

    if (this.enemy.passive === 'blokada_parkingowa') {
      specials.push({
        icon: '🚧',
        label: 'Blokada Parkingowa',
        value: null,
        tooltip: 'Gracz może zagrać maksymalnie 3 karty na turę.',
      });
    }

    if (this.enemy.id === 'fiakier') {
      specials.push({
        icon: '🧾',
        label: 'Twardy Taryfikator',
        value: '70%',
        tooltip: 'Fiakier przyjmuje tylko 70% nakładanego Rachunku (minimum 1).',
      });
    }

    if ((this.enemy.ped ?? 0) > 0) {
      specials.push({
        icon: '💨',
        label: 'Pęd',
        value: this.enemy.ped,
        tooltip: 'Fiakier nabrał pędu. Następny atak „Przyspieszenie" zada o tyle więcej obrażeń.',
      });
    }

    if (this.enemy.stunnedTurns > 0) {
      specials.push({
        icon: '😵',
        label: 'Ogłuszony',
        value: this.enemy.stunnedTurns,
        tooltip: 'Pominie najbliższą akcję za każdy poziom ogłuszenia.',
      });
    }

    if (this.enemy.evasionCharges > 0) {
      specials.push({
        icon: '🌀',
        label: 'Unik',
        value: this.enemy.evasionCharges,
        tooltip: 'Anuluje najbliższy atak gracza i zużywa 1 ładunek.',
      });
    }

    return specials;
  }

  /**
   * Ticks down duration-based status debuffs (weak, fragile) by 1 each.
   * @param {StatusDef} status
   */
  _tickStatus(status) {
    tickStatus(status);
  }

  /**
   * Restores Oscypki (+energy_next_turn bonus), ticks player statuses, resets Garda, draws 5 cards.
   */
  startTurn() {
    combatEngine.startTurn(this);
  }

  /**
   * Plays the card at handIndex. Returns success=false if not enough Oscypki.
   * Exhausted cards are removed from combat; others go to discard.
   * @param {number} handIndex
   * @returns {PlayCardResult}
   */
  playCard(handIndex) {
    return combatEngine.playCard(this, handIndex);
  }

  /**
   * Discards hand, Ceper attacks Góral, ticks enemy statuses, rolls next enemy attack.
   * @returns {EndTurnResult}
   */
  endTurn() {
    return combatEngine.endTurn(this);
  }

  /**
   * Resets combat after victory with fixed enemy stats from enemyLibrary.
   * - Keep player HP between battles (no auto-heal)
   * - Boss node: spawn random final boss variant (Król Krupówek or Fiakier)
   * - Clear blocks and statuses
   * - Move hand/discard/exhaust back to deck and shuffle
   * - Start a fresh turn
   */
  resetBattle() {
    battleLifecycle.resetBattle(this);
  }

  /**
   * Starts Act 2 while preserving run progress (deck, relics, HP, Dutki).
   * Rebuilds map state and clears combat-scoped runtime flags.
   */
  startAct2() {
    this.currentAct = 2;
    this.currentActName = 'MORSKIE OKO';

    // Rebuild a clean deck state from all piles and strip temporary status cards.
    this.clearStatusCardsFromPiles();

    this.player.block = 0;
    this.player.status = defaultStatus();
    this.player.stunned = false;
    this.player.cardsPlayedThisTurn = 0;
    this.attackCardsPlayedThisBattle = 0;
    this.pocztowkaCardsTriggeredThisBattle = 0;
    this.smyczKeptCardId = null;
    this.smyczKeptHandIndex = null;
    this.flaszkaCostSeed = {};
    this.termometerTurnParity = 0;
    this.battleTurnsElapsed = 0;
    this.zegarekFreeSkillAvailable = false;
    this.enemyBankruptFlag = false;
    this.enemyBankruptcyPending = false;
    this.enemyBankruptcyBonus = 0;
    this.lansBreakEvent = false;
    this.lansActivatedEvent = false;
    this.lansDutkiSpentEvent = 0;
    this.rachunekResistEvent = false;
    this.dumaPodhalaActive = false;
    this.schowekRetainPending = false;
    this.blurBlockAmount = 0;
    this.zasiekiActive = false;
    this.goralskiUporDrawPending = 0;
    this.szalBacyTurnDrawDone = false;
    this._setLansActive(false);
    this._resetBattleScopedFlags();

    this.lastVictoryMessage = '';
    this.pendingBattleDutki = true;
    this.battleContext = 'map';
    this.enemy = this._createEnemyState(this.enemy);

    this.generateMap();
    this.currentScreen = 'map';
  }

  /**
   * Returns true if current victory should transition into Act 2.
   * @returns {boolean}
   */
  tryAdvanceActAfterBossVictory() {
    return battleLifecycle.tryAdvanceActAfterBossVictory(this);
  }

  /**
   * Removes temporary status cards from hand/discard/exhaust/deck immediately.
   * Useful right after a battle win, before opening map/shop overlays.
   */
  clearStatusCardsFromPiles() {
    battleLifecycle.clearStatusCardsFromPiles(this);
  }

  /**
   * Starts a fresh battle against a specific enemy ID without entering the random encounter pool.
   * Intended for scripted transitions (e.g., event fallback fights).
   * @param {string} enemyId
   * @param {{ battleContext?: 'map' | 'event' | 'debug' | 'tutorial', rewardRelicId?: string | null }} [options]
   * @returns {boolean}
   */
  startBattleWithEnemyId(enemyId, options = {}) {
    return eventSystem.startBattleWithEnemyId(this, enemyId, options);
  }

  /**
   * @returns {'player_win' | 'enemy_win' | null}
   */
  checkWinCondition() {
    return battleLifecycle.checkWinCondition(this);
  }

  /**
   * @returns {string[]}
   */
  getRunDeckCardIds() {
    return battleLifecycle.getRunDeckCardIds(this);
  }

  /**
   * Captures end-of-run data used by the post-game summary screen.
   * @param {'player_win' | 'enemy_win'} outcome
   * @returns {NonNullable<GameState['runSummary']>}
   */
  captureRunSummary(outcome) {
    return battleLifecycle.captureRunSummary(this, outcome);
  }

  /**
   * Resets all run-wide progress and prepares a fresh run state.
   * Callers should set state.runSeed before calling this when a specific seed is desired.
   * @param {string[]} startingDeck
   */
  resetForNewRun(startingDeck) {
    battleLifecycle.resetForNewRun(this, startingDeck);
  }

  /**
   * Start a new run under a specific hex seed — all RNG (map, enemies, rewards) will
   * be deterministic for that seed. Stores the seed as state.runSeed.
   * @param {string} seedHex  1–8 hex characters
   * @param {string[]} startingDeck
   */
  beginSeededRun(seedHex, startingDeck) {
    const normalised = seedHex.toLowerCase().padStart(8, '0');
    this.runSeed = normalised;
    // Install the seeded RNG directly on state.rng so every post-init call
    // (combat, rewards, shop rolls) consumes the same deterministic stream.
    // withSeededRng only patches Math.random for the duration of its callback,
    // which left state.rng delegating back to the unseeded global.
    this.rng = mulberry32(parseSeed(normalised));
    this.resetForNewRun(startingDeck);
  }

  /**
   * @param {number} rows
   */
  setDebugMapRows(rows) {
    this.debugMapRows = Math.min(25, Math.max(10, Math.floor(rows)));
  }

  /**
   * @param {MapNodeType | null} type
   */
  setDebugNextNodeType(type) {
    this.debugForcedNextNodeType = type;
  }

  /**
   * @param {boolean} enabled
   */
  setDebugRevealAllMap(enabled) {
    this.debugRevealAllMap = Boolean(enabled);
  }

  /**
   * @param {boolean} enabled
   */
  setDebugGodMode(enabled) {
    this.debugGodMode = Boolean(enabled);
  }

  resetCurrentTurnActions() {
    this.player.cardsPlayedThisTurn = 0;
    this.combat.playerAttackMissCheck = false;
    this.combat.playerAttackMissRolled = false;
    this.combat.playerAttackMissed = false;
  }

  /**
   * @param {'weak' | 'vulnerable' | 'fragile' | 'stun'} status
   * @param {number} amount
   */
  applyEnemyDebugStatus(status, amount) {
    enemyState.applyEnemyDebugStatus(this, status, amount);
  }

  /**
   * @param {'strength' | 'weak' | 'fragile' | 'vulnerable' | 'next_double' | 'energy_next_turn' | 'lans' | 'duma_podhala' | 'furia_turysty'} status
   * @param {number} amount
   */
  applyPlayerDebugStatus(status, amount) {
    if (status === 'lans') {
      const wasActive = this._isLansActive();
      const willBeActive = amount > 0;
      this._setLansActive(willBeActive);
      if (!wasActive && willBeActive) this.lansActivatedEvent = true;
      if (wasActive && !willBeActive) {
        this.player.stunned = true;
        this.lansBreakEvent = true;
      }
      return;
    }
    if (status === 'next_double') {
      this.player.status.next_double = amount > 0;
      return;
    }
    if (Object.prototype.hasOwnProperty.call(this.player.status, status)) {
      this.player.status[status] = Math.max(0, Number(amount));
    }
  }
}
