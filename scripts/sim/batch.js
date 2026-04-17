/**
 * Batch runner: sequential mode (default) and worker_threads parallel mode.
 *
 * Sequential: runBatch(config) → GameResult[]
 * Parallel:   runBatchParallel(config) → GameResult[]  (workers=auto or number)
 *
 * Seed partitioning: seed S runs on worker W = ((S - seedStart) % workerCount).
 * Paired siblings (A and B for same S) share the same worker.
 */

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runOneGame } from './runOneGame.js';
import { buildPairedRuns } from './pairing.js';

const __filename = fileURLToPath(import.meta.url);

/**
 * @typedef {import('./runOneGame.js').GameResult} GameResult
 * @typedef {import('./runOneGame.js').RunConfig} RunConfig
 *
 * @typedef {{
 *   schemaVersion: 2,
 *   name: string,
 *   games?: number,
 *   gamesPerCell?: number,
 *   seedStart?: number,
 *   seeds?: number[],
 *   character: string,
 *   difficulty?: 'normal' | 'hard',
 *   agent: (obs: import('../../src/engine/Observation.js').Observation) => import('../../src/engine/ActionDispatcher.js').Action,
 *   agentName: string,
 *   agentParams?: Record<string, unknown>,
 *   verbosity?: 'off' | 'summary' | 'full',
 *   output?: { path?: string, compress?: boolean },
 *   workers?: 'auto' | number,
 *   timeoutMs?: number,
 *   marynaEnabled?: boolean,
 *   paired?: { entity: { kind: string, id: string }, mode: 'include_vs_exclude', enemyTier?: 'regular'|'elite'|'boss' },
 * }} BatchConfig
 */

/**
 * Run a batch sequentially. Returns all results.
 * @param {BatchConfig} config
 * @returns {GameResult[]}
 */
export function runBatch(config) {
  const seeds = _resolveSeeds(config);
  const results = [];

  if (config.paired) {
    // Paired mode: expand each seed into A+B runs
    const pairedRuns = buildPairedRuns(seeds, config.paired);
    for (const spec of pairedRuns) {
      const result = runOneGame({
        characterId: config.character,
        seed: spec.seed,
        difficulty: config.difficulty ?? 'normal',
        bot: config.agent,
        agentName: config.agentName,
        agentParams: config.agentParams,
        batchName: config.name,
        verbosity: config.verbosity ?? 'summary',
        marynaEnabled: config.marynaEnabled ?? false,
        pairKey: spec.pairKey,
        world: spec.world,
        pairStatus: 'ok',
        ...spec.overrides,
      });
      results.push(result);
    }
  } else {
    for (const seed of seeds) {
      const result = runOneGame({
        characterId: config.character,
        seed,
        difficulty: config.difficulty ?? 'normal',
        bot: config.agent,
        agentName: config.agentName,
        agentParams: config.agentParams,
        batchName: config.name,
        verbosity: config.verbosity ?? 'summary',
        marynaEnabled: config.marynaEnabled ?? false,
      });
      results.push(result);
    }
  }

  return results;
}

/**
 * Run a batch in parallel using worker_threads.
 * @param {BatchConfig} config
 * @returns {Promise<GameResult[]>}
 */
export async function runBatchParallel(config) {
  const seeds = _resolveSeeds(config);
  const workerCount = _resolveWorkerCount(config.workers);

  if (workerCount <= 1 || seeds.length < workerCount) {
    return runBatch(config);
  }

  if (config.paired) {
    // Paired mode: partition by pairIndex so A+B siblings share the same worker
    const pairedRuns = buildPairedRuns(seeds, config.paired);
    /** @type {Array<import('./pairing.js').PairedRunSpec[]>} */
    const partitions = Array.from({ length: workerCount }, () => []);
    for (const spec of pairedRuns) {
      partitions[spec.pairIndex % workerCount].push(spec);
    }
    const workerPromises = partitions
      .filter((p) => p.length > 0)
      .map((partition) => _spawnWorkerPaired(config, partition));
    const partitionResults = await Promise.all(workerPromises);
    return partitionResults.flat();
  }

  // Unpaired: partition seeds by worker index
  /** @type {number[][]} */
  const partitions = Array.from({ length: workerCount }, () => []);
  const seedStart = config.seedStart ?? 1;
  for (const seed of seeds) {
    const workerIdx = (((seed - seedStart) % workerCount) + workerCount) % workerCount;
    partitions[workerIdx].push(seed);
  }

  const workerPromises = partitions
    .filter((p) => p.length > 0)
    .map((partition) => _spawnWorker(config, partition));

  const partitionResults = await Promise.all(workerPromises);
  return partitionResults.flat();
}

/**
 * @param {BatchConfig} config
 * @returns {number[]}
 */
function _resolveSeeds(config) {
  if (config.seeds) return config.seeds;
  const count = config.games ?? 1;
  const start = config.seedStart ?? 1;
  return Array.from({ length: count }, (_, i) => start + i);
}

/**
 * @param {'auto' | number | undefined} workers
 * @returns {number}
 */
function _resolveWorkerCount(workers) {
  if (workers === 'auto' || workers == null) return Math.max(1, cpus().length - 1);
  return Math.max(1, Math.floor(workers));
}

/**
 * @param {BatchConfig} config
 * @param {number[]} seeds
 * @returns {Promise<GameResult[]>}
 */
function _spawnWorker(config, seeds) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: {
        _isWorker: true,
        character: config.character,
        difficulty: config.difficulty ?? 'normal',
        agentName: config.agentName,
        agentParams: config.agentParams,
        batchName: config.name,
        verbosity: config.verbosity ?? 'summary',
        marynaEnabled: config.marynaEnabled ?? false,
        seeds,
      },
    });

    const results = [];
    worker.on('message', (msg) => results.push(msg));
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
      else resolve(results);
    });
  });
}

/**
 * @param {BatchConfig} config
 * @param {import('./pairing.js').PairedRunSpec[]} pairedSpecs
 * @returns {Promise<GameResult[]>}
 */
function _spawnWorkerPaired(config, pairedSpecs) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: {
        _isWorker: true,
        _isPaired: true,
        character: config.character,
        difficulty: config.difficulty ?? 'normal',
        agentName: config.agentName,
        agentParams: config.agentParams,
        batchName: config.name,
        verbosity: config.verbosity ?? 'summary',
        marynaEnabled: config.marynaEnabled ?? false,
        pairedSpecs,
      },
    });

    const results = [];
    worker.on('message', (msg) => results.push(msg));
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
      else resolve(results);
    });
  });
}

// ---------------------------------------------------------------------------
// Worker thread entry point
// ---------------------------------------------------------------------------

if (!isMainThread && workerData?._isWorker) {
  const {
    character,
    difficulty,
    agentName,
    agentParams,
    batchName,
    verbosity,
    seeds,
    pairedSpecs,
    _isPaired,
    marynaEnabled,
  } = workerData;

  // Workers receive only serialisable data — re-import the bot by name
  const bot = await _resolveBot(agentName);

  if (_isPaired && pairedSpecs) {
    for (const spec of pairedSpecs) {
      const result = runOneGame({
        characterId: character,
        seed: spec.seed,
        difficulty,
        bot,
        agentName,
        agentParams,
        batchName,
        verbosity,
        marynaEnabled: marynaEnabled ?? false,
        pairKey: spec.pairKey,
        world: spec.world,
        pairStatus: 'ok',
        ...spec.overrides,
      });
      parentPort?.postMessage(result);
    }
  } else {
    for (const seed of seeds) {
      const result = runOneGame({
        characterId: character,
        seed,
        difficulty,
        bot,
        agentName,
        agentParams,
        batchName,
        verbosity,
        marynaEnabled: marynaEnabled ?? false,
      });
      parentPort?.postMessage(result);
    }
  }
}

/**
 * Re-import a bot entry by agent name (workers can't receive functions cross-thread).
 * Returns either a plain BotFn or an engine-bound factory object — runOneGame
 * normalises both via bindBot().
 * @param {string} name
 * @returns {Promise<import('../../src/logic/bots/index.js').BotEntry>}
 */
async function _resolveBot(name) {
  const { BOT_REGISTRY } = await import('../../src/logic/bots/index.js');
  const bot = BOT_REGISTRY[name];
  if (!bot) {
    const known = Object.keys(BOT_REGISTRY).join(', ');
    throw new Error(`Unknown agent name for worker: "${name}". Known: ${known}`);
  }
  return bot;
}
