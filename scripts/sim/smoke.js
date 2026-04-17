/**
 * Smoke test: runs a full game with RandomBot from seed to terminal state.
 * Usage: node scripts/sim/smoke.js [--seed <hex>]
 * Exits 0 on a valid terminal outcome, non-zero otherwise.
 */

import { EngineController, mulberry32, parseSeed } from '../../src/engine/index.js';
import { RandomBot } from '../../src/logic/bots/RandomBot.js';

const MAX_ACTIONS = 2000;
const DEFAULT_SEED = 'deadbeef';

function parseSeedArg() {
  const idx = process.argv.indexOf('--seed');
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : DEFAULT_SEED;
}

function main() {
  const seedStr = parseSeedArg();
  const seedNum = parseSeed(seedStr);
  console.log(`[smoke] seed=0x${seedNum.toString(16)}`);

  const engine = EngineController.create({
    characterId: 'jedrek',
    seed: seedStr,
    rules: { skipIntro: true },
  });

  // Independent bot RNG — same seed value, separate stream from the engine's RNG
  const botRng = mulberry32(seedNum);

  let observation = engine.startRun();
  let actionCount = 0;

  while (!observation.done) {
    if (actionCount >= MAX_ACTIONS) {
      console.error(`[smoke] ABORT: exceeded ${MAX_ACTIONS} actions — possible infinite loop`);
      process.exit(2);
    }

    const action = RandomBot(observation, botRng);
    const result = engine.applyAction(action);
    observation = result.observation;
    actionCount++;
  }

  const summary = engine.getRunSummary();

  if (!summary || !['player_win', 'enemy_win'].includes(summary.outcome)) {
    console.error('[smoke] FAIL: runSummary missing or invalid outcome');
    console.error(JSON.stringify(summary, null, 2));
    process.exit(1);
  }

  console.log('[smoke] RunSummary:');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`[smoke] PASS: outcome=${summary.outcome} actions=${actionCount}`);
  process.exit(0);
}

try {
  main();
} catch (err) {
  console.error('[smoke] FATAL:', err);
  process.exit(1);
}
