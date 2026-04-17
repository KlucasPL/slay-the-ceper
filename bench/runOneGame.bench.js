/**
 * Performance benchmark for runOneGame.
 * Run: node bench/runOneGame.bench.js
 *
 * Acceptance targets (from plan §5 Phase B):
 *   RandomBot:    ≥ 500 games/sec
 *   HeuristicBot: ≥ 200 games/sec
 */

import { runOneGame } from '../scripts/sim/runOneGame.js';
import { RandomBot } from '../src/logic/bots/RandomBot.js';
import { HeuristicBot } from '../src/logic/bots/HeuristicBot.js';

const WARMUP = 20;
const SAMPLES = 200;
const SEED_START = 1;

/**
 * @param {string} name
 * @param {(obs: any, rng: () => number) => any} bot
 * @param {string} agentName
 */
function bench(name, bot, agentName) {
  // Warmup
  for (let i = 0; i < WARMUP; i++) {
    runOneGame({ characterId: 'jedrek', seed: SEED_START + i, bot, agentName, batchName: 'bench' });
  }

  const t0 = performance.now();
  for (let i = 0; i < SAMPLES; i++) {
    runOneGame({ characterId: 'jedrek', seed: SEED_START + i, bot, agentName, batchName: 'bench' });
  }
  const elapsed = performance.now() - t0;

  const gps = (SAMPLES / (elapsed / 1000)).toFixed(0);
  const msEach = (elapsed / SAMPLES).toFixed(2);
  const pass = parseFloat(gps) >= (agentName === 'random' ? 500 : 200);

  console.log(`${name}: ${gps} games/sec (${msEach}ms/game) [${pass ? 'PASS' : 'FAIL'}]`);
  return { gps: parseFloat(gps), pass };
}

console.log(`Benchmarking ${SAMPLES} games each (after ${WARMUP} warmup)...\n`);

const rBench = bench('RandomBot   ', RandomBot, 'random');
const hBench = bench('HeuristicBot', HeuristicBot, 'heuristic');

console.log('');
if (!rBench.pass) console.log(`FAIL RandomBot below 500 g/s (got ${rBench.gps})`);
if (!hBench.pass) console.log(`FAIL HeuristicBot below 200 g/s (got ${hBench.gps})`);
if (rBench.pass && hBench.pass) console.log('All targets met.');
