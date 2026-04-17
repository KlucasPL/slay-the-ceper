/**
 * Canonical baseline batch config used by CI drift gate.
 * 1000 games, HeuristicBot, seeds 1–1000.
 * Change this only via an explicit baseline-update PR.
 */

import { HeuristicBot } from '../../../src/logic/bots/HeuristicBot.js';

/** @type {import('../batch.js').BatchConfig} */
const baseline = {
  schemaVersion: 2,
  name: 'baseline',
  games: 1000,
  seedStart: 1,
  character: 'jedrek',
  difficulty: 'normal',
  agent: HeuristicBot,
  agentName: 'heuristic',
  verbosity: 'summary',
  workers: 'auto',
  marynaEnabled: true,
  output: {
    path: 'metrics/baseline.jsonl',
    compress: false,
  },
};

export default baseline;
