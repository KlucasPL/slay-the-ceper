import { describe, it, expect } from 'vitest';
import { EngineController } from '../../src/engine/EngineController.js';
import { RandomBot } from '../../src/logic/bots/RandomBot.js';
import { withSeededRng, mulberry32, parseSeed } from '../../src/engine/Rng.js';

const MAX_ACTIONS = 2000;

/**
 * Run a full game from seed to terminal state inside a single withSeededRng scope.
 * The bot uses a separate mulberry32 stream (same seed value, independent state).
 * Returns observations and events with `t` timestamps stripped for stable comparison.
 *
 * @param {string} seedStr - hex seed string
 * @returns {{ trace: string, summary: import('../../src/engine/EngineController.js').RunSummary }}
 */
function runSeeded(seedStr) {
  const seedNum = parseSeed(seedStr);
  let engine, summary;
  const observations = [];
  const events = [];

  // Single withSeededRng scope — PRNG advances continuously across the whole run
  withSeededRng(seedStr, () => {
    const botRng = mulberry32(seedNum);
    engine = EngineController.create({
      characterId: 'jedrek',
      seed: null,
      rules: { skipIntro: true },
    });

    let obs = engine.startRun();
    observations.push(obs);
    events.push(...engine.drainEvents());

    let actionCount = 0;
    while (!obs.done && actionCount < MAX_ACTIONS) {
      const action = RandomBot(obs, botRng);
      const result = engine.applyAction(action);
      events.push(...(result.events ?? []));
      obs = result.observation;
      observations.push(obs);
      actionCount++;
    }
  });

  summary = engine.getRunSummary();

  // Strip non-deterministic timestamp field before serializing
  const trace = JSON.stringify({ observations, events }, (key, val) =>
    key === 't' ? undefined : val
  );

  return { trace, summary };
}

// ─────────────────────────────────────────────
// withSeededRng throw-safety
// ─────────────────────────────────────────────

describe('withSeededRng throw-safety', () => {
  it('shouldRestoreMathRandomWhenWrappedFunctionThrows', () => {
    // given
    const originalMathRandom = Math.random;

    // when
    let threw = false;
    try {
      withSeededRng('deadbeef', () => {
        throw new Error('intentional test throw');
      });
    } catch {
      threw = true;
    }

    // then
    expect(threw).toBe(true);
    expect(Math.random).toBe(originalMathRandom);
  });

  it('shouldRestoreMathRandomAfterNormalCompletion', () => {
    // given
    const originalMathRandom = Math.random;

    // when
    withSeededRng('cafebabe', () => 42);

    // then
    expect(Math.random).toBe(originalMathRandom);
  });

  it('shouldProduceDifferentSequencesForDifferentSeeds', () => {
    // given / when
    const seq1 = withSeededRng('00000001', (rng) => [rng(), rng(), rng()]);
    const seq2 = withSeededRng('00000002', (rng) => [rng(), rng(), rng()]);

    // then
    expect(seq1).not.toEqual(seq2);
  });

  it('shouldProduceIdenticalSequencesForSameSeedRunTwice', () => {
    // given / when
    const seq1 = withSeededRng('aabbccdd', (rng) => [rng(), rng(), rng(), rng(), rng()]);
    const seq2 = withSeededRng('aabbccdd', (rng) => [rng(), rng(), rng(), rng(), rng()]);

    // then
    expect(seq1).toEqual(seq2);
  });
});

// ─────────────────────────────────────────────
// 20-seed byte-identical JSONL determinism
// ─────────────────────────────────────────────

describe('engine determinism — 20 seeds', () => {
  const SEEDS = [
    '00000001',
    '00000002',
    '00000003',
    '00000004',
    '00000005',
    '00000006',
    '00000007',
    '00000008',
    '00000009',
    '0000000a',
    'deadbeef',
    'cafebabe',
    'feedface',
    'aabbccdd',
    '12345678',
    '87654321',
    'abcdef01',
    '10203040',
    'ffffffff',
    '00abcdef',
  ];

  for (const seed of SEEDS) {
    it(`shouldProduceByteIdenticalTraceForSeed_${seed}`, () => {
      // given — two independent runs with the same seed
      // when
      const run1 = runSeeded(seed);
      const run2 = runSeeded(seed);

      // then — observation + event trace must be identical
      expect(run1.trace).toBe(run2.trace);
      // and the run must terminate with a valid outcome
      expect(['player_win', 'enemy_win']).toContain(run1.summary?.outcome);
    });
  }
});
