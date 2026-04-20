import { describe, it, expect } from 'vitest';
import { runBatch, runBatchParallel } from '../../scripts/sim/batch.js';
import { RandomBot } from '../../src/logic/bots/RandomBot.js';

/** Minimal BatchConfig for smoke tests. */
function makeConfig(overrides = {}) {
  return {
    schemaVersion: 2,
    name: 'test-batch',
    character: 'jedrek',
    agent: RandomBot,
    agentName: 'random',
    games: 3,
    seedStart: 1,
    difficulty: 'normal',
    verbosity: 'off',
    ...overrides,
  };
}

describe('runBatch (sequential)', () => {
  it('shouldReturnOneResultPerGame', () => {
    // given
    const config = makeConfig({ games: 5 });

    // when
    const results = runBatch(config);

    // then
    expect(results).toHaveLength(5);
  });

  it('shouldHaveValidOutcomeOnEveryResult', () => {
    // given / when
    const results = runBatch(makeConfig({ games: 4, seedStart: 10 }));

    // then
    for (const r of results) {
      expect(['player_win', 'enemy_win']).toContain(r.outcome);
    }
  });

  it('shouldUseDifferentSeedsAcrossResults', () => {
    // given / when
    const results = runBatch(makeConfig({ games: 3, seedStart: 1 }));

    // then — seeds should be 1, 2, 3 (or at least distinct)
    const seeds = results.map((r) => r.seed);
    const unique = new Set(seeds);
    expect(unique.size).toBe(seeds.length);
  });

  it('shouldUseExplicitSeedsListWhenProvided', () => {
    // given
    const config = makeConfig({ seeds: [100, 200, 300] });

    // when
    const results = runBatch(config);

    // then
    expect(results).toHaveLength(3);
    const seeds = results.map((r) => r.seed);
    expect(seeds).toContain(100);
    expect(seeds).toContain(200);
    expect(seeds).toContain(300);
  });

  it('shouldPopulateSchemaVersionAndBatchName', () => {
    // given / when
    const [result] = runBatch(makeConfig({ games: 1, name: 'my-batch' }));

    // then
    expect(result.schemaVersion).toBe(2);
    expect(result.batch).toBe('my-batch');
  });

  it('shouldReturnEmptyArrayForZeroGames', () => {
    // given / when
    const results = runBatch(makeConfig({ games: 0 }));

    // then
    expect(results).toHaveLength(0);
  });
});

describe('runBatchParallel', () => {
  it('shouldReturnSameCountAsSequentialForSmallBatch', async () => {
    // given
    const config = makeConfig({ games: 4, seedStart: 1, workers: 1 });

    // when
    const results = await runBatchParallel(config);

    // then
    expect(results).toHaveLength(4);
  });

  it('shouldHaveValidOutcomesInParallelMode', async () => {
    // given / when
    const results = await runBatchParallel(makeConfig({ games: 3, seedStart: 1, workers: 1 }));

    // then
    for (const r of results) {
      expect(['player_win', 'enemy_win']).toContain(r.outcome);
    }
  });

  it('shouldProduceDeterministicResultsMatchingSequential', async () => {
    // given
    const config = makeConfig({ games: 3, seeds: [1, 2, 3] });

    // when
    const seqResults = runBatch(config);
    const parResults = await runBatchParallel({ ...config, workers: 1 });

    // then — same seeds → same outcomes (workers=1 keeps sequential ordering)
    const seqSeeds = seqResults.map((r) => r.seed).sort((a, b) => a - b);
    const parSeeds = parResults.map((r) => r.seed).sort((a, b) => a - b);
    expect(seqSeeds).toEqual(parSeeds);

    for (const seqR of seqResults) {
      const parR = parResults.find((r) => r.seed === seqR.seed);
      expect(parR).toBeDefined();
      expect(parR.outcome).toBe(seqR.outcome);
    }
  });
});
