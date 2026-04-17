/**
 * Drive a single game from seed to terminal state using any bot function.
 * Returns a plain result object suitable for JSONL serialisation.
 */

import { EngineController, mulberry32, parseSeed } from '../../src/engine/index.js';
import { bindBot } from '../../src/logic/bots/index.js';

const MAX_ACTIONS = 2000;

/**
 * @typedef {import('../../src/engine/ActionDispatcher.js').Action} Action
 * @typedef {import('../../src/engine/Observation.js').Observation} Observation
 *
 * @typedef {{
 *   schemaVersion: 2,
 *   batch: string,
 *   gitSha: string,
 *   seed: number,
 *   agent: string,
 *   character: string,
 *   difficulty: 'normal' | 'hard',
 *   outcome: 'player_win' | 'enemy_win',
 *   floorReached: number,
 *   turnsPlayed: number,
 *   totalDutkiEarned: number,
 *   hpAtDeath: number,
 *   maxHpAtDeath: number,
 *   survivalScore: number,
 *   killerEnemyId: string | null,
 *   killerName: string | null,
 *   finalDeck: string[],
 *   finalRelics: string[],
 *   finalBoons: string[],
 *   durationMs: number,
 *   errorStack?: string,
 * }} GameResult
 */

/**
 * @typedef {import('./pairing.js').PairOverrides} PairOverrides
 *
 * @typedef {{
 *   characterId: string,
 *   seed: number | string,
 *   difficulty?: 'normal' | 'hard',
 *   bot: import('../../src/logic/bots/index.js').BotEntry,
 *   agentName: string,
 *   agentParams?: Record<string, unknown>,
 *   batchName: string,
 *   gitSha?: string,
 *   configHash?: string,
 *   poolOverridesHash?: string,
 *   cell?: string,
 *   verbosity?: 'off' | 'summary' | 'full',
 *   pools?: import('../../src/engine/PoolOverrides.js').PoolOverrides,
 *   startingRelics?: string[],
 *   startingDeck?: string[],
 *   forceEnemy?: { regular?: string, elite?: string, boss?: string },
 *   forceEvent?: string | null,
 *   forceWeather?: string | null,
 *   marynaEnabled?: boolean,
 *   forcedBoonOffer?: string | null,
 *   enemyScaleFactor?: number | null,
 *   pairKey?: string,
 *   world?: 'A' | 'B',
 *   pairStatus?: 'ok' | 'broken',
 * }} RunConfig
 */

/**
 * Run one game to completion and return a structured result.
 * @param {RunConfig} config
 * @returns {GameResult}
 */
export function runOneGame(config) {
  const {
    characterId,
    seed,
    difficulty = 'normal',
    bot,
    gitSha = '',
    pools,
    startingRelics,
    startingDeck,
    forceEnemy,
    forceEvent,
    forceWeather,
    marynaEnabled,
    forcedBoonOffer,
    enemyScaleFactor,
  } = config;

  const seedNum = typeof seed === 'string' ? parseSeed(seed) : seed >>> 0;
  const seedHex = seedNum.toString(16);
  const t0 = Date.now();

  const engine = EngineController.create({
    characterId,
    seed: seedHex,
    difficulty,
    rules: { skipIntro: true },
    pools,
    startingRelics,
    startingDeck,
    forceEnemy,
    forceEvent,
    forceWeather,
    marynaEnabled,
    forcedBoonOffer,
    enemyScaleFactor,
  });

  // Independent bot RNG seeded off the game seed — deterministic but separate from engine
  const botRng = mulberry32(seedNum ^ 0x5a5a5a5a);

  // Search-based bots need the engine for snapshot/restore lookahead. Plain bots
  // are passed through unchanged.
  const policy = bindBot(bot, engine, config.agentParams);

  const collectTrace = config.verbosity === 'full';
  /** @type {Array<{ step: number, phase: string, floor: number, turn: number, action: import('../../src/engine/ActionDispatcher.js').Action }>} */
  const agentTrace = [];

  let observation = engine.startRun();
  let actionCount = 0;
  // applyAction drains events per-call, so we accumulate them here for the analyzer.
  const entityEvents = engine.drainEvents();

  while (!observation.done) {
    if (actionCount >= MAX_ACTIONS) {
      const summary = _buildResult(engine, config, seedNum, gitSha, t0, 'enemy_win');
      summary.errorStack = `Exceeded ${MAX_ACTIONS} actions — probable infinite loop`;
      summary.entityEvents = entityEvents;
      return summary;
    }
    const action = policy(observation, botRng);
    if (collectTrace) {
      agentTrace.push({
        step: actionCount,
        phase: observation.phase,
        floor: observation.floor,
        turn: observation.turn,
        action,
      });
    }
    const result = engine.applyAction(action);
    if (Array.isArray(result.events) && result.events.length) {
      entityEvents.push(...result.events);
    }
    observation = result.observation;
    actionCount++;
  }

  const result = _buildResult(engine, config, seedNum, gitSha, t0);
  // Writer's field-filter trims by verbosity tier.
  result.entityEvents = entityEvents;
  if (collectTrace) result.agentTrace = agentTrace;
  return result;
}

/**
 * @param {EngineController} engine
 * @param {RunConfig} config
 * @param {number} seedNum
 * @param {string} gitSha
 * @param {number} t0
 * @param {'player_win' | 'enemy_win'} [fallbackOutcome]
 * @returns {GameResult}
 */
function _buildResult(engine, config, seedNum, gitSha, t0, fallbackOutcome) {
  const summary = engine.getRunSummary();
  const outcome = summary?.outcome ?? fallbackOutcome ?? 'enemy_win';

  const hpAtDeath = Math.max(0, summary?.hpAtDeath ?? 0);
  const maxHpAtDeath = Math.max(1, summary?.maxHp ?? 1);
  const floorReached = summary?.floorReached ?? 1;
  // Survival score (§4.11 planned metric): floor + fractional HP remaining.
  // Lets comparisons rank runs that died on the same floor by HP margin.
  const survivalScore = round4(floorReached + hpAtDeath / maxHpAtDeath);

  /** @type {Record<string, unknown>} */
  const result = {
    schemaVersion: 2,
    batch: config.batchName,
    gitSha,
    configHash: config.configHash ?? '',
    poolOverridesHash: config.poolOverridesHash ?? '',
    cell: config.cell ?? null,
    seed: seedNum,
    agent: config.agentName,
    agentParams: config.agentParams ?? {},
    character: config.characterId,
    difficulty: config.difficulty ?? 'normal',
    poolOverrides: config.pools ?? null,
    outcome,
    floorReached,
    turnsPlayed: summary?.totalTurnsPlayed ?? 0,
    totalDutkiEarned: summary?.totalDutkiEarned ?? 0,
    hpAtDeath,
    maxHpAtDeath,
    survivalScore,
    killerEnemyId: null,
    killerName: summary?.killerName ?? null,
    finalDeck: summary?.finalDeck ?? [],
    finalRelics: summary?.finalRelics ?? [],
    finalBoons: summary?.finalBoons ?? [],
    durationMs: Date.now() - t0,
  };

  // Paired A/B fields — only include when present
  if (config.pairKey != null) result.pairKey = config.pairKey;
  if (config.world != null) result.world = config.world;
  if (config.pairStatus != null) result.pairStatus = config.pairStatus;

  return result;
}

function round4(x) {
  return Math.round(x * 10000) / 10000;
}
