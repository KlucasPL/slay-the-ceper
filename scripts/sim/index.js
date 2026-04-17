/**
 * CLI entry point for the sim harness.
 *
 * Usage:
 *   node scripts/sim/index.js --batch <path> [--seed <n>] [--games <n>] [--workers auto|<n>] [--out <path>] [--verbosity off|summary|full] [--agent heuristic|random|aggressive|defensive|status|greedy|minimalist|economy|search|search-mcts] [--agentParams '{"mctsN":20}'] [--scenario <name>] [--paired <kind>:<id>]
 *
 * If --batch is omitted, runs the built-in _baseline batch.
 * --scenario <name> overrides seeds from a named scenario (see scripts/sim/scenarios/).
 */

import { writeToStdout } from './writer.js';
import { runBatchParallel } from './batch.js';
import { resolveBot } from '../../src/logic/bots/index.js';
import { resolveScenario, loadScenarioFile } from './scenarios/index.js';

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const argv = process.argv.slice(2);
  /** @type {Record<string, string>} */
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--') && argv[i + 1] !== undefined) {
      args[argv[i].slice(2)] = argv[++i];
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs();

  // Load batch config
  let batchModule;
  const batchPath = args.batch;
  if (batchPath) {
    batchModule = await import(/* @vite-ignore */ batchPath);
  } else {
    batchModule = await import('./batches/_baseline.js');
  }

  const batchConfig = { ...batchModule.default };

  // CLI overrides
  if (args.games) batchConfig.games = parseInt(args.games, 10);
  if (args.seed) batchConfig.seedStart = parseInt(args.seed, 10);
  if (args.workers)
    batchConfig.workers = args.workers === 'auto' ? 'auto' : parseInt(args.workers, 10);
  if (args.verbosity) batchConfig.verbosity = args.verbosity;
  if (args.out) batchConfig.output = { ...batchConfig.output, path: args.out };
  if (args.agent) {
    batchConfig.agent = resolveBot(args.agent);
    batchConfig.agentName = args.agent;
  }
  if (args.agentParams) {
    try {
      batchConfig.agentParams = JSON.parse(args.agentParams);
    } catch {
      console.error(`[sim] --agentParams expected JSON object, got: ${args.agentParams}. Ignored.`);
    }
  }
  if (args.maryna != null)
    batchConfig.marynaEnabled = args.maryna !== 'false' && args.maryna !== '0';

  // --scenario <name> — load seeds from a named scenario
  if (args.scenario) {
    let scenario;
    if (args.scenario.includes('/') || args.scenario.endsWith('.js')) {
      scenario = await loadScenarioFile(args.scenario);
    } else {
      scenario = resolveScenario(args.scenario);
    }
    batchConfig.seeds = scenario.seeds;
    batchConfig.games = scenario.seeds.length;
    delete batchConfig.seedStart;
    console.error(
      `[sim] scenario="${scenario.name}" seeds=${scenario.seeds.length} (${scenario.description})`
    );
  }

  // --paired <kind>:<id> — expand each seed into A+B pair
  if (args.paired) {
    const colonIdx = args.paired.indexOf(':');
    if (colonIdx < 1) {
      console.error(
        '[sim] --paired requires format <kind>:<id>, e.g. --paired relic:flaszka_sliwowicy'
      );
      process.exit(1);
    }
    const kind = args.paired.slice(0, colonIdx);
    const id = args.paired.slice(colonIdx + 1);
    batchConfig.paired = { entity: { kind, id }, mode: 'include_vs_exclude' };
  }

  const verbosity = batchConfig.verbosity ?? 'summary';
  const t0 = Date.now();

  console.error(
    `[sim] batch=${batchConfig.name} games=${batchConfig.games ?? 1} agent=${batchConfig.agentName}`
  );

  const results = await runBatchParallel(batchConfig);

  // Write output
  const outPath = batchConfig.output?.path;
  if (outPath) {
    const { createWriter } = await import('./writer.js');
    const writer = await createWriter({
      path: outPath,
      verbosity,
      compress: batchConfig.output?.compress ?? false,
    });
    for (const r of results) writer.write(r);
    await writer.close();
    console.error(`[sim] wrote ${results.length} records to ${outPath}`);
  } else {
    for (const r of results) writeToStdout(r, verbosity);
  }

  const wins = results.filter((r) => r.outcome === 'player_win').length;
  const winrate = results.length > 0 ? ((wins / results.length) * 100).toFixed(1) : '0.0';
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.error(`[sim] done: ${results.length} games, winrate=${winrate}%, elapsed=${elapsed}s`);
}

main().catch((err) => {
  console.error('[sim] FATAL:', err);
  process.exit(1);
});
