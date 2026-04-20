#!/usr/bin/env node
/**
 * replay.js — replay a single full-tier JSONL record through EngineController.
 *
 * Usage:
 *   node scripts/sim/replay.js <file.jsonl> [--line N] [--verbose]
 *
 * Reads the Nth line (default: 1) of the JSONL file, expects it to be a
 * full-verbosity record with agentTrace[]. Drives EngineController through
 * ReplayBot, printing the observation at each step.
 *
 * Exits 0 on clean replay, 1 on desync or error.
 */

import { readFileSync } from 'node:fs';
import { EngineController, parseSeed } from '../../src/engine/index.js';
import { makeReplayBot, ReplayDesyncError } from '../../src/logic/bots/ReplayBot.js';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  process.stdout.write(`Usage: node scripts/sim/replay.js <file.jsonl> [--line N] [--verbose]\n`);
  process.exit(0);
}

const filePath = args[0];
const lineArg = args.indexOf('--line');
const lineNum = lineArg !== -1 ? parseInt(args[lineArg + 1], 10) : 1;
const verbose = args.includes('--verbose');

// ── Load record ────────────────────────────────────────────────────────────

let record;
try {
  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  if (lineNum < 1 || lineNum > lines.length) {
    process.stderr.write(
      `Error: line ${lineNum} out of range (file has ${lines.length} records)\n`
    );
    process.exit(1);
  }
  record = JSON.parse(lines[lineNum - 1]);
} catch (err) {
  process.stderr.write(`Error reading file: ${err.message}\n`);
  process.exit(1);
}

if (!Array.isArray(record.agentTrace) || record.agentTrace.length === 0) {
  process.stderr.write(
    `Error: record on line ${lineNum} has no agentTrace[]. Re-run with verbosity=full.\n`
  );
  process.exit(1);
}

// ── Set up engine ──────────────────────────────────────────────────────────

const seedNum = typeof record.seed === 'number' ? record.seed : parseSeed(String(record.seed));
const engine = EngineController.create({
  characterId: record.character ?? 'jedrek',
  seed: seedNum.toString(16),
  difficulty: record.difficulty ?? 'normal',
  rules: { skipIntro: true },
});

const bot = makeReplayBot(record.agentTrace);
let observation = engine.startRun();
let step = 0;

process.stdout.write(
  `Replaying seed=${record.seed} agent=${record.agent} (${record.agentTrace.length} steps)\n`
);

// ── Replay loop ────────────────────────────────────────────────────────────

try {
  while (!observation.done) {
    let action;
    try {
      action = bot(observation);
    } catch (err) {
      if (err instanceof ReplayDesyncError) {
        process.stderr.write(`\nDesync at step ${err.detail.step}:\n`);
        process.stderr.write(`  Expected: ${JSON.stringify(err.detail.expected)}\n`);
        process.stderr.write(`  Legal:    ${JSON.stringify(err.detail.legalActions)}\n`);
        process.exit(1);
      }
      throw err;
    }

    if (verbose) {
      process.stdout.write(
        `[${String(step).padStart(4, '0')}] phase=${observation.phase} floor=${observation.floor} turn=${observation.turn} hp=${observation.player.hp}/${observation.player.maxHp} => ${JSON.stringify(action)}\n`
      );
    }

    const result = engine.applyAction(action);
    observation = result.observation;
    step++;
  }
} catch (err) {
  process.stderr.write(`Error during replay at step ${step}: ${err.message}\n`);
  process.exit(1);
}

// ── Final summary ──────────────────────────────────────────────────────────

const summary = engine.getRunSummary();
const outcome = summary?.outcome ?? observation.outcome ?? '?';

process.stdout.write(`\nReplay complete: ${step} steps, outcome=${outcome}\n`);

if (outcome !== record.outcome) {
  process.stderr.write(
    `Warning: replayed outcome "${outcome}" differs from recorded "${record.outcome}"\n`
  );
  process.exit(1);
}

process.stdout.write(
  JSON.stringify(
    {
      outcome,
      floorReached: summary?.floorReached,
      totalTurnsPlayed: summary?.totalTurnsPlayed,
      finalDeck: summary?.finalDeck,
    },
    null,
    2
  ) + '\n'
);

process.exit(0);
