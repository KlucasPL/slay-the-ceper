/**
 * Bot registry — maps agent name strings to bot functions or engine-bound factories.
 * Used by the sim CLI --agent flag and multi-agent batch configs.
 *
 * Two registry entry shapes are supported:
 *   - plain BotFn: (obs, rng?) => action, called directly each turn.
 *   - factory object: { factory: (engine, params?) => BotFn }, constructed after
 *     engine creation so the bot can snapshot/replay via the controller. Used by
 *     SearchBot (1-ply and MCTS variants), where lookahead needs the engine.
 */

import { HeuristicBot } from './HeuristicBot.js';
import { RandomBot } from './RandomBot.js';
import { AggressiveBot } from './AggressiveBot.js';
import { DefensiveBot } from './DefensiveBot.js';
import { StatusStackBot } from './StatusStackBot.js';
import { GreedyRewardBot } from './GreedyRewardBot.js';
import { MinimalistBot } from './MinimalistBot.js';
import { EconomyBot } from './EconomyBot.js';
import { BerserkerBot } from './BerserkerBot.js';
import { DrawEngineBot } from './DrawEngineBot.js';
import { ElitistBot } from './ElitistBot.js';
import { LansBot } from './LansBot.js';
import { RachunekBot } from './RachunekBot.js';
import { makeSearchBot } from './SearchBot.js';

/**
 * @typedef {import('../../engine/Observation.js').Observation} Observation
 * @typedef {import('../../engine/ActionDispatcher.js').Action} Action
 * @typedef {import('../../engine/EngineController.js').EngineController} EngineController
 * @typedef {(obs: Observation, rng?: () => number) => Action} BotFn
 * @typedef {{ factory: (engine: EngineController, params?: Record<string, unknown>) => BotFn }} BotFactory
 * @typedef {BotFn | BotFactory} BotEntry
 */

/** Default MCTS rollouts when --agent search-mcts is invoked without params. */
const DEFAULT_MCTS_N = 20;

/** @type {Record<string, BotEntry>} */
export const BOT_REGISTRY = {
  heuristic: HeuristicBot,
  // RandomBot requires an rng arg; wrap it so it conforms to the (obs) => action signature
  random: (obs) => RandomBot(obs, Math.random),
  aggressive: AggressiveBot,
  defensive: DefensiveBot,
  status: StatusStackBot,
  greedy: GreedyRewardBot,
  minimalist: MinimalistBot,
  economy: EconomyBot,
  berserker: BerserkerBot,
  'draw-engine': DrawEngineBot,
  elitist: ElitistBot,
  lans: LansBot,
  rachunek: RachunekBot,
  // Search-based bots — engine-bound, produced by a factory after engine creation.
  search: {
    factory: (engine) => makeSearchBot(engine, { mctsN: 0 }),
  },
  'search-mcts': {
    factory: (engine, params) =>
      makeSearchBot(engine, {
        mctsN: Number(params?.mctsN ?? DEFAULT_MCTS_N),
        rolloutSeed: Number(params?.rolloutSeed ?? 0xcafe),
      }),
  },
};

/**
 * Resolve a bot entry by name. Throws if unknown.
 * @param {string} name
 * @returns {BotEntry}
 */
export function resolveBot(name) {
  const bot = BOT_REGISTRY[name];
  if (!bot) {
    throw new Error(
      `Unknown agent "${name}". Known agents: ${Object.keys(BOT_REGISTRY).join(', ')}`
    );
  }
  return bot;
}

/**
 * Returns true when the registry entry needs engine binding before use.
 * @param {BotEntry} entry
 * @returns {entry is BotFactory}
 */
export function isBotFactory(entry) {
  return typeof entry === 'object' && entry !== null && typeof entry.factory === 'function';
}

/**
 * Normalise a BotEntry into a BotFn, constructing search bots against the engine.
 * @param {BotEntry} entry
 * @param {EngineController} engine
 * @param {Record<string, unknown>} [params]
 * @returns {BotFn}
 */
export function bindBot(entry, engine, params) {
  return isBotFactory(entry) ? entry.factory(engine, params) : entry;
}
