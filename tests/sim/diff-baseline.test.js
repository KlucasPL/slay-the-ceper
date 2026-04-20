import { describe, it, expect } from 'vitest';
import { diffMetrics, renderMarkdown } from '../../scripts/sim/tools/diff-baseline.js';

// ---------------------------------------------------------------------------
// Minimal metrics.json fixture factory
// ---------------------------------------------------------------------------

function makeMetrics(overrides = {}) {
  return {
    schemaVersion: 1,
    batchId: 'batch-a',
    batchName: 'batch-a',
    gitSha: 'abc123',
    runCount: 1000,
    dateRun: '2026-01-01T00:00:00.000Z',
    configHash: 'cfg1',
    poolOverridesHash: 'po1',
    agentMix: { heuristic: 1000 },
    overall: { winrate: { rate: 0.5, lo: 0.47, hi: 0.53, n: 1000 } },
    bySlice: {},
    byEntity: {},
    ...overrides,
  };
}

function makeEntity(winrate, liftPp = null, pickRate = null, n = 1000, sampleTier = 'green') {
  return {
    offeredCount: pickRate != null ? 500 : 0,
    acquiredCount: pickRate != null ? Math.round(500 * pickRate) : 0,
    runsWithEntity: n,
    pickRate,
    winrateWithEntity: { rate: winrate, lo: winrate - 0.02, hi: winrate + 0.02, n },
    winrateWithout: null,
    winrateLiftPp: liftPp,
    liftCi: null,
    matchedPairCount: 0,
    bySlice: {},
    acquisitionSources: {},
    sampleTier,
  };
}

const LOOSE_THRESHOLDS = {
  winratePp: 1,
  liftPp: 1,
  pickRatePp: 5,
  pValue: 0.05,
};

// ---------------------------------------------------------------------------
// Hash guardrail
// ---------------------------------------------------------------------------

describe('diffMetrics — hash guardrail', () => {
  it('shouldRejectDiffWhenConfigHashDiffers', () => {
    // given
    const baseline = makeMetrics({ configHash: 'cfg1' });
    const candidate = makeMetrics({ configHash: 'cfg2' });

    // when
    const result = diffMetrics(baseline, candidate);

    // then
    expect(result.ok).toBe(false);
    expect(result.hashMismatch).not.toBeNull();
    expect(result.hashMismatch.field).toBe('configHash');
    expect(result.hashMismatch.baseline).toBe('cfg1');
    expect(result.hashMismatch.candidate).toBe('cfg2');
    expect(result.entities).toHaveLength(0);
  });

  it('shouldRejectDiffWhenPoolOverridesHashDiffers', () => {
    // given
    const baseline = makeMetrics({ poolOverridesHash: 'po1' });
    const candidate = makeMetrics({ poolOverridesHash: 'po2' });

    // when
    const result = diffMetrics(baseline, candidate);

    // then
    expect(result.ok).toBe(false);
    expect(result.hashMismatch.field).toBe('poolOverridesHash');
  });

  it('shouldAllowDiffWhenHashesMatch', () => {
    // given
    const baseline = makeMetrics();
    const candidate = makeMetrics();

    // when
    const result = diffMetrics(baseline, candidate);

    // then
    expect(result.hashMismatch).toBeNull();
  });

  it('shouldAllowDiffWhenHashesAreAbsent', () => {
    // given: metrics without hashes (e.g. old format)
    const baseline = makeMetrics({ configHash: '', poolOverridesHash: '' });
    const candidate = makeMetrics({ configHash: '', poolOverridesHash: '' });

    // when
    const result = diffMetrics(baseline, candidate);

    // then
    expect(result.hashMismatch).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// NEW / REMOVED entities
// ---------------------------------------------------------------------------

describe('diffMetrics — NEW and REMOVED entities', () => {
  it('shouldFlagEntityPresentOnlyInCandidateAsNew', () => {
    // given
    const baseline = makeMetrics({ byEntity: {} });
    const candidate = makeMetrics({
      byEntity: { 'card:ciupaga': makeEntity(0.55) },
    });

    // when
    const result = diffMetrics(baseline, candidate);

    // then
    const diff = result.entities.find((e) => e.entityKey === 'card:ciupaga');
    expect(diff).toBeDefined();
    expect(diff.status).toBe('new');
    expect(diff.flags).toContain('NEW');
  });

  it('shouldFlagEntityPresentOnlyInBaselineAsRemoved', () => {
    // given
    const baseline = makeMetrics({
      byEntity: { 'relic:pas_bacowski': makeEntity(0.6) },
    });
    const candidate = makeMetrics({ byEntity: {} });

    // when
    const result = diffMetrics(baseline, candidate);

    // then
    const diff = result.entities.find((e) => e.entityKey === 'relic:pas_bacowski');
    expect(diff.status).toBe('removed');
    expect(diff.flags).toContain('REMOVED');
  });

  it('shouldNotCountNewRemovedAsDriftedEntities', () => {
    // given: one new, one removed
    const baseline = makeMetrics({
      byEntity: { 'relic:old': makeEntity(0.5) },
    });
    const candidate = makeMetrics({
      byEntity: { 'card:new': makeEntity(0.5) },
    });

    // when
    const result = diffMetrics(baseline, candidate);

    // then: NEW/REMOVED don't trigger the drift exit code
    expect(result.driftedEntities).toHaveLength(0);
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Drift detection
// ---------------------------------------------------------------------------

describe('diffMetrics — drift detection', () => {
  it('shouldFlagWinrateDriftAboveThreshold', () => {
    // given: large samples so significance test passes; big winrate change
    const baseline = makeMetrics({
      byEntity: { 'card:ciupaga': makeEntity(0.4, null, null, 5000) },
    });
    const candidate = makeMetrics({
      byEntity: { 'card:ciupaga': makeEntity(0.6, null, null, 5000) },
    });

    // when
    const result = diffMetrics(baseline, candidate, LOOSE_THRESHOLDS);

    // then
    const diff = result.entities.find((e) => e.entityKey === 'card:ciupaga');
    expect(diff.flags).toContain('▲WINRATE');
    expect(result.driftedEntities).toContain('card:ciupaga');
    expect(result.ok).toBe(false);
  });

  it('shouldFlagNegativeWinrateDrift', () => {
    // given
    const baseline = makeMetrics({
      byEntity: { 'card:ciupaga': makeEntity(0.6, null, null, 5000) },
    });
    const candidate = makeMetrics({
      byEntity: { 'card:ciupaga': makeEntity(0.4, null, null, 5000) },
    });

    // when
    const result = diffMetrics(baseline, candidate, LOOSE_THRESHOLDS);

    // then
    const diff = result.entities.find((e) => e.entityKey === 'card:ciupaga');
    expect(diff.flags).toContain('▼WINRATE');
  });

  it('shouldFlagLiftPpDriftAboveThreshold', () => {
    // given
    const baseline = makeMetrics({
      byEntity: { 'relic:x': makeEntity(0.5, 0.02) },
    });
    const candidate = makeMetrics({
      byEntity: { 'relic:x': makeEntity(0.5, 0.1) },
    });

    // when
    const result = diffMetrics(baseline, candidate, LOOSE_THRESHOLDS);

    // then
    const diff = result.entities.find((e) => e.entityKey === 'relic:x');
    expect(diff.flags).toContain('▲LIFT');
  });

  it('shouldFlagPickRateDriftAboveThreshold', () => {
    // given
    const baseline = makeMetrics({
      byEntity: { 'card:gasior': makeEntity(0.5, null, 0.3) },
    });
    const candidate = makeMetrics({
      byEntity: { 'card:gasior': makeEntity(0.5, null, 0.5) },
    });

    // when
    const result = diffMetrics(baseline, candidate, LOOSE_THRESHOLDS);

    // then
    const diff = result.entities.find((e) => e.entityKey === 'card:gasior');
    expect(diff.flags).toContain('▲PICKRATE');
  });

  it('shouldNotFlagSmallChangesBelowThreshold', () => {
    // given: tiny winrate change
    const baseline = makeMetrics({
      byEntity: { 'card:ciupaga': makeEntity(0.5) },
    });
    const candidate = makeMetrics({
      byEntity: { 'card:ciupaga': makeEntity(0.501) },
    });

    // when (use default thresholds which require ±2pp)
    const result = diffMetrics(baseline, candidate);

    // then
    const diff = result.entities.find((e) => e.entityKey === 'card:ciupaga');
    expect(diff.flags).toHaveLength(0);
    expect(result.ok).toBe(true);
  });

  it('shouldNotFlagWinrateDriftWhenSampleTooSmall', () => {
    // given: large winrate change but tiny sample (< 30) → not significant
    const baseline = makeMetrics({
      byEntity: { 'card:rare': makeEntity(0.3, null, null, 10) },
    });
    const candidate = makeMetrics({
      byEntity: { 'card:rare': makeEntity(0.8, null, null, 10) },
    });

    // when
    const result = diffMetrics(baseline, candidate, LOOSE_THRESHOLDS);

    // then: small sample → not significant → no WINRATE flag
    const diff = result.entities.find((e) => e.entityKey === 'card:rare');
    expect(diff.flags).not.toContain('▲WINRATE');
    expect(diff.flags).not.toContain('▼WINRATE');
  });
});

// ---------------------------------------------------------------------------
// Overall winrate delta
// ---------------------------------------------------------------------------

describe('diffMetrics — overall winrate delta', () => {
  it('shouldComputeOverallWinrateDelta', () => {
    // given
    const baseline = makeMetrics({ overall: { winrate: { rate: 0.4, n: 1000 } } });
    const candidate = makeMetrics({ overall: { winrate: { rate: 0.55, n: 1000 } } });

    // when
    const result = diffMetrics(baseline, candidate);

    // then
    expect(result.overallWinrateDelta).toBeCloseTo(0.15, 3);
  });
});

// ---------------------------------------------------------------------------
// Markdown rendering
// ---------------------------------------------------------------------------

describe('renderMarkdown', () => {
  it('shouldIncludeHashMismatchErrorInMarkdown', () => {
    // given
    const baseline = makeMetrics({ configHash: 'aaa' });
    const candidate = makeMetrics({ configHash: 'bbb' });
    const result = diffMetrics(baseline, candidate);

    // when
    const md = renderMarkdown(result, baseline, candidate);

    // then
    expect(md).toContain('ERROR');
    expect(md).toContain('configHash');
    expect(md).toContain('aaa');
    expect(md).toContain('bbb');
    expect(md).toContain('guardrail');
  });

  it('shouldIncludeEntityTableWithDriftFlags', () => {
    // given
    const baseline = makeMetrics({
      byEntity: { 'card:ciupaga': makeEntity(0.4, null, null, 5000) },
    });
    const candidate = makeMetrics({
      byEntity: { 'card:ciupaga': makeEntity(0.6, null, null, 5000) },
    });
    const result = diffMetrics(baseline, candidate, LOOSE_THRESHOLDS);

    // when
    const md = renderMarkdown(result, baseline, candidate);

    // then
    expect(md).toContain('card:ciupaga');
    expect(md).toContain('▲WINRATE');
    expect(md).toContain('drifted outside thresholds');
  });

  it('shouldShowAllWithinThresholdsMessageWhenClean', () => {
    // given: identical metrics
    const baseline = makeMetrics({ byEntity: { 'card:x': makeEntity(0.5) } });
    const candidate = makeMetrics({ byEntity: { 'card:x': makeEntity(0.5) } });
    const result = diffMetrics(baseline, candidate);

    // when
    const md = renderMarkdown(result, baseline, candidate);

    // then
    expect(md).toContain('within thresholds');
  });

  it('shouldMarkNewEntityInMarkdown', () => {
    // given
    const baseline = makeMetrics({ byEntity: {} });
    const candidate = makeMetrics({ byEntity: { 'boon:new_boon': makeEntity(0.55) } });
    const result = diffMetrics(baseline, candidate);

    // when
    const md = renderMarkdown(result, baseline, candidate);

    // then
    expect(md).toContain('boon:new_boon');
    expect(md).toContain('NEW');
  });
});

// ---------------------------------------------------------------------------
// Custom thresholds
// ---------------------------------------------------------------------------

describe('diffMetrics — custom thresholds', () => {
  it('shouldRespectCustomWinrateThreshold', () => {
    // given: 5pp change that would be flagged at 2pp but not 10pp threshold
    const baseline = makeMetrics({
      byEntity: { 'card:x': makeEntity(0.5, null, null, 5000) },
    });
    const candidate = makeMetrics({
      byEntity: { 'card:x': makeEntity(0.55, null, null, 5000) },
    });

    // when: strict threshold (1pp) — should drift
    const strictResult = diffMetrics(baseline, candidate, {
      winratePp: 1,
      liftPp: 99,
      pickRatePp: 99,
      pValue: 0.05,
    });
    // when: loose threshold (10pp) — should not drift
    const looseResult = diffMetrics(baseline, candidate, {
      winratePp: 10,
      liftPp: 99,
      pickRatePp: 99,
      pValue: 0.05,
    });

    // then
    expect(strictResult.ok).toBe(false);
    expect(looseResult.ok).toBe(true);
  });
});
