import { describe, it, expect } from 'vitest';
import { analyze } from '../scripts/analyze.js';

// ---------------------------------------------------------------------------
// Minimal record factory
// ---------------------------------------------------------------------------

function makeRecord(overrides = {}) {
  return {
    schemaVersion: 2,
    batch: 'test-batch',
    gitSha: 'abc123',
    configHash: 'cfg1',
    poolOverridesHash: 'po1',
    seed: 'deadbeef',
    agent: 'heuristic',
    agentParams: {},
    character: 'jedrek',
    difficulty: 'normal',
    poolOverrides: null,
    outcome: 'enemy_win',
    floorReached: 4,
    turnsPlayed: 10,
    totalDutkiEarned: 50,
    killerEnemyId: 'cepr',
    killerName: 'Cepr',
    finalDeck: [],
    finalRelics: [],
    finalBoons: [],
    durationMs: 200,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Empty input
// ---------------------------------------------------------------------------

describe('analyze', () => {
  it('shouldReturnEmptyMetricsWhenNoRecords', () => {
    // given
    const records = [];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.schemaVersion).toBe(1);
    expect(metrics.runCount).toBe(0);
    expect(metrics.overall.winrate.n).toBe(0);
    expect(metrics.bySlice).toEqual({});
    expect(metrics.byEntity).toEqual({});
    expect(metrics.diagnostic.coverage.runs).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Overall winrate
  // ---------------------------------------------------------------------------

  it('shouldComputeOverallWinrate', () => {
    // given
    const records = [
      makeRecord({ outcome: 'player_win' }),
      makeRecord({ outcome: 'player_win' }),
      makeRecord({ outcome: 'enemy_win' }),
      makeRecord({ outcome: 'enemy_win' }),
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.runCount).toBe(4);
    expect(metrics.overall.winrate.rate).toBe(0.5);
    expect(metrics.overall.winrate.n).toBe(4);
  });

  it('shouldSkipCrashedRecords', () => {
    // given
    const records = [
      makeRecord({ outcome: 'player_win' }),
      makeRecord({ outcome: 'player_win', errorStack: 'TypeError: boom' }),
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.runCount).toBe(1);
    expect(metrics.overall.winrate.rate).toBe(1.0);
  });

  // ---------------------------------------------------------------------------
  // bySlice
  // ---------------------------------------------------------------------------

  it('shouldGroupRunsIntoBySlice', () => {
    // given
    const records = [
      makeRecord({
        outcome: 'player_win',
        character: 'jedrek',
        difficulty: 'normal',
        floorReached: 3,
      }),
      makeRecord({
        outcome: 'enemy_win',
        character: 'jedrek',
        difficulty: 'normal',
        floorReached: 3,
      }),
      makeRecord({
        outcome: 'player_win',
        character: 'jedrek',
        difficulty: 'hard',
        floorReached: 3,
      }),
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.bySlice['jedrek/normal/1'].runCount).toBe(2);
    expect(metrics.bySlice['jedrek/normal/1'].winrate.rate).toBe(0.5);
    expect(metrics.bySlice['jedrek/hard/1'].runCount).toBe(1);
    expect(metrics.bySlice['jedrek/hard/1'].winrate.rate).toBe(1.0);
  });

  // ---------------------------------------------------------------------------
  // byEntity — finalDeck / finalRelics / finalBoons
  // ---------------------------------------------------------------------------

  it('shouldTrackEntityWinrateFromFinalInventory', () => {
    // given
    const records = [
      makeRecord({
        outcome: 'player_win',
        finalDeck: ['ciupaga', 'gasior'],
        finalRelics: ['pas_bacowski'],
      }),
      makeRecord({ outcome: 'enemy_win', finalDeck: ['ciupaga'], finalRelics: [] }),
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.byEntity['card:ciupaga'].runsWithEntity).toBe(2);
    expect(metrics.byEntity['card:ciupaga'].winsWithEntity).toBeUndefined(); // internal
    expect(metrics.byEntity['card:ciupaga'].winrateWithEntity.rate).toBe(0.5);
    expect(metrics.byEntity['card:gasior'].runsWithEntity).toBe(1);
    expect(metrics.byEntity['card:gasior'].winrateWithEntity.rate).toBe(1.0);
    expect(metrics.byEntity['relic:pas_bacowski'].runsWithEntity).toBe(1);
    expect(metrics.byEntity['relic:pas_bacowski'].winrateWithEntity.rate).toBe(1.0);
  });

  it('shouldTrackCharacterEntity', () => {
    // given
    const records = [
      makeRecord({ outcome: 'player_win', character: 'jedrek' }),
      makeRecord({ outcome: 'enemy_win', character: 'jedrek' }),
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.byEntity['character:jedrek'].runsWithEntity).toBe(2);
    expect(metrics.byEntity['character:jedrek'].winrateWithEntity.rate).toBe(0.5);
  });

  // ---------------------------------------------------------------------------
  // entityEvents — reward_offered / reward_picked
  // ---------------------------------------------------------------------------

  it('shouldComputePickRateFromEntityEvents', () => {
    // given
    const records = [
      makeRecord({
        entityEvents: [
          {
            kind: 'reward_offered',
            payload: {
              entities: [
                { kind: 'card', id: 'ciupaga' },
                { kind: 'card', id: 'gazda' },
              ],
            },
          },
          { kind: 'reward_picked', payload: { entity: { kind: 'card', id: 'ciupaga' } } },
        ],
      }),
      makeRecord({
        entityEvents: [
          { kind: 'reward_offered', payload: { entities: [{ kind: 'card', id: 'ciupaga' }] } },
          // no pick
        ],
      }),
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.byEntity['card:ciupaga'].offeredCount).toBe(2);
    expect(metrics.byEntity['card:ciupaga'].acquiredCount).toBe(1);
    expect(metrics.byEntity['card:ciupaga'].pickRate).toBe(0.5);
    expect(metrics.byEntity['card:gazda'].offeredCount).toBe(1);
    expect(metrics.byEntity['card:gazda'].acquiredCount).toBe(0);
    expect(metrics.byEntity['card:gazda'].pickRate).toBe(0.0);
  });

  it('shouldTrackAcquisitionSources', () => {
    // given
    const records = [
      makeRecord({
        entityEvents: [
          { kind: 'reward_picked', payload: { entity: { kind: 'relic', id: 'pas_bacowski' } } },
          { kind: 'shop_purchase', payload: { entity: { kind: 'relic', id: 'pas_bacowski' } } },
        ],
      }),
    ];

    // when
    const metrics = analyze(records);

    // then
    const sources = metrics.byEntity['relic:pas_bacowski'].acquisitionSources;
    expect(sources.reward).toBe(1);
    expect(sources.shop).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Paired A/B — lift
  // ---------------------------------------------------------------------------

  it('shouldComputePairedLiftFromMatchedPairs', () => {
    // given: 4 pairs, entity always wins when present, always loses when absent
    const records = [];
    for (let i = 0; i < 4; i++) {
      records.push(
        makeRecord({
          outcome: 'player_win',
          pairKey: `relic:pas_bacowski:${i}`,
          world: 'present',
          pairStatus: 'ok',
        })
      );
      records.push(
        makeRecord({
          outcome: 'enemy_win',
          pairKey: `relic:pas_bacowski:${i}`,
          world: 'absent',
          pairStatus: 'ok',
        })
      );
    }

    // when
    const metrics = analyze(records);

    // then
    const entity = metrics.byEntity['relic:pas_bacowski'];
    expect(entity.matchedPairCount).toBe(4);
    expect(entity.pairedLift).toBe(1.0);
  });

  it('shouldExcludeBrokenPairs', () => {
    // given: one valid pair, one broken (only present side)
    const records = [
      makeRecord({
        outcome: 'player_win',
        pairKey: 'relic:x:0',
        world: 'present',
        pairStatus: 'ok',
      }),
      makeRecord({ outcome: 'enemy_win', pairKey: 'relic:x:0', world: 'absent', pairStatus: 'ok' }),
      makeRecord({
        outcome: 'player_win',
        pairKey: 'relic:x:1',
        world: 'present',
        pairStatus: 'broken',
      }),
    ];

    // when
    const metrics = analyze(records);

    // then
    const entity = metrics.byEntity['relic:x'];
    expect(entity.matchedPairCount).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // sampleTier
  // ---------------------------------------------------------------------------

  it('shouldAssignGreenSampleTierAtThreshold', () => {
    // given
    const records = Array.from({ length: 2000 }, () => makeRecord({ finalDeck: ['ciupaga'] }));

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.byEntity['card:ciupaga'].sampleTier).toBe('green');
  });

  it('shouldAssignYellowSampleTierBelowGreen', () => {
    // given
    const records = Array.from({ length: 500 }, () => makeRecord({ finalDeck: ['ciupaga'] }));

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.byEntity['card:ciupaga'].sampleTier).toBe('yellow');
  });

  it('shouldAssignRedSampleTierBelowYellow', () => {
    // given
    const records = [makeRecord({ finalDeck: ['ciupaga'] })];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.byEntity['card:ciupaga'].sampleTier).toBe('red');
    expect(metrics.diagnostic.belowMinSample).toBeGreaterThanOrEqual(1);
  });

  // ---------------------------------------------------------------------------
  // Schema drift detection
  // ---------------------------------------------------------------------------

  it('shouldFlagUnknownEventKindsInSchemaDrift', () => {
    // given
    const records = [
      makeRecord({
        entityEvents: [{ kind: 'unknown_future_event', payload: {} }],
      }),
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.diagnostic.schemaDrift.unknownEventKinds).toContain('unknown_future_event');
  });

  // ---------------------------------------------------------------------------
  // configHash + poolOverridesHash passthrough
  // ---------------------------------------------------------------------------

  it('shouldCopyConfigHashAndPoolOverridesHashFromFirstRecord', () => {
    // given
    const records = [makeRecord({ configHash: 'abc', poolOverridesHash: 'def' })];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.configHash).toBe('abc');
    expect(metrics.poolOverridesHash).toBe('def');
  });

  // ---------------------------------------------------------------------------
  // agentMix
  // ---------------------------------------------------------------------------

  it('shouldCountAgentMix', () => {
    // given
    const records = [
      makeRecord({ agent: 'heuristic' }),
      makeRecord({ agent: 'heuristic' }),
      makeRecord({ agent: 'random' }),
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.agentMix.heuristic).toBe(2);
    expect(metrics.agentMix.random).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Card kind-specific: avgPlaysPerBattle
  // ---------------------------------------------------------------------------

  it('shouldComputeAvgPlaysPerBattleForCards', () => {
    // given: 3 card_played events and 1 battle_started for ciupaga
    const records = [
      makeRecord({
        entityEvents: [
          { kind: 'battle_started', payload: { enemy: { kind: 'enemy', id: 'cepr' } } },
          { kind: 'card_played', payload: { card: { kind: 'card', id: 'ciupaga' }, cost: 1 } },
          { kind: 'card_played', payload: { card: { kind: 'card', id: 'ciupaga' }, cost: 1 } },
          { kind: 'card_played', payload: { card: { kind: 'card', id: 'ciupaga' }, cost: 1 } },
        ],
      }),
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.byEntity['card:ciupaga'].avgPlaysPerBattle).toBe(3.0);
  });

  // ---------------------------------------------------------------------------
  // Verbosity 'off' — no entityEvents field
  // ---------------------------------------------------------------------------

  it('shouldHandleOffTierWithNoEntityEvents', () => {
    // given: records without entityEvents (off verbosity tier)
    const records = [
      makeRecord({ outcome: 'player_win', finalDeck: ['ciupaga'] }),
      makeRecord({ outcome: 'enemy_win', finalDeck: ['ciupaga'] }),
    ];
    // ensure no entityEvents key
    for (const r of records) delete r.entityEvents;

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.runCount).toBe(2);
    expect(metrics.byEntity['card:ciupaga'].runsWithEntity).toBe(2);
    expect(metrics.diagnostic.coverage.withEntityEvents).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // F1 — finalDeck duplicates dedupe (ciupaga ×3 in deck still counts as 1 run)
  // ---------------------------------------------------------------------------

  it('shouldDedupeFinalDeckDuplicatesPerRun', () => {
    // given: ciupaga appears 3x in the same run's finalDeck
    const records = [
      makeRecord({ outcome: 'player_win', finalDeck: ['ciupaga', 'ciupaga', 'ciupaga'] }),
      makeRecord({ outcome: 'enemy_win', finalDeck: ['ciupaga'] }),
    ];

    // when
    const metrics = analyze(records);

    // then — runsWithEntity counts unique runs, not deck slots
    expect(metrics.byEntity['card:ciupaga'].runsWithEntity).toBe(2);
    expect(metrics.byEntity['card:ciupaga'].runsWithEntity).toBeLessThanOrEqual(metrics.runCount);
  });

  // ---------------------------------------------------------------------------
  // F3 — winrateWithout / winrateLiftPp populate from global marginal
  // ---------------------------------------------------------------------------

  it('shouldPopulateWinrateWithoutAndLiftFromMarginalCounts', () => {
    // given: 4 runs, ciupaga in 2 wins; 2 losses without ciupaga
    const records = [
      makeRecord({ outcome: 'player_win', finalDeck: ['ciupaga'] }),
      makeRecord({ outcome: 'player_win', finalDeck: ['ciupaga'] }),
      makeRecord({ outcome: 'enemy_win', finalDeck: ['gasior'] }),
      makeRecord({ outcome: 'enemy_win', finalDeck: ['gasior'] }),
    ];

    // when
    const metrics = analyze(records);

    // then
    const ciupaga = metrics.byEntity['card:ciupaga'];
    expect(ciupaga.runsWithoutEntity).toBe(2);
    expect(ciupaga.winrateWithEntity.rate).toBe(1.0);
    expect(ciupaga.winrateWithout.rate).toBe(0.0);
    expect(ciupaga.winrateLiftPp).toBe(1.0);
    expect(ciupaga.liftCi).not.toBeNull();
  });

  // ---------------------------------------------------------------------------
  // F4 — byFloor / byWeather populate from battle_started + battle_ended
  // ---------------------------------------------------------------------------

  it('shouldPopulateEnemyByFloorAndByWeatherFromEvents', () => {
    // given: cepr fought on floor 2, sunny weather, player wins
    const records = [
      makeRecord({
        outcome: 'player_win',
        entityEvents: [
          {
            kind: 'weather_entered',
            payload: { weather: { kind: 'weather', id: 'clear' } },
            floor: 2,
          },
          { kind: 'battle_started', payload: { enemy: { kind: 'enemy', id: 'cepr' } }, floor: 2 },
          {
            kind: 'battle_ended',
            payload: { outcome: 'player_win', enemy: { kind: 'enemy', id: 'cepr' }, turnCount: 3 },
            floor: 2,
            turn: 3,
          },
        ],
      }),
    ];

    // when
    const metrics = analyze(records);

    // then
    const cepr = metrics.byEntity['enemy:cepr'];
    expect(cepr.byFloor['2']).toBeDefined();
    expect(cepr.byFloor['2'].wins).toBe(1);
    expect(cepr.byFloor['2'].total).toBe(1);
    expect(cepr.byFloor['2'].winrate).toBe(1.0);
    expect(cepr.byWeather.clear).toBeDefined();
    expect(cepr.byWeather.clear.wins).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // F5 — avgTurnsToKill populates from battle_ended.turnCount
  // ---------------------------------------------------------------------------

  it('shouldComputeAvgTurnsToKillFromBattleEndedTurnCount', () => {
    // given: 2 cepr kills, turn counts 3 and 5 → avg 4
    const records = [
      makeRecord({
        outcome: 'player_win',
        entityEvents: [
          { kind: 'battle_started', payload: { enemy: { kind: 'enemy', id: 'cepr' } }, floor: 1 },
          {
            kind: 'battle_ended',
            payload: { outcome: 'player_win', enemy: { kind: 'enemy', id: 'cepr' }, turnCount: 3 },
            floor: 1,
            turn: 3,
          },
        ],
      }),
      makeRecord({
        outcome: 'player_win',
        entityEvents: [
          { kind: 'battle_started', payload: { enemy: { kind: 'enemy', id: 'cepr' } }, floor: 1 },
          {
            kind: 'battle_ended',
            payload: { outcome: 'player_win', enemy: { kind: 'enemy', id: 'cepr' }, turnCount: 5 },
            floor: 1,
            turn: 5,
          },
        ],
      }),
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.byEntity['enemy:cepr'].avgTurnsToKill).toBe(4.0);
  });

  it('shouldNullGuardAvgTurnsToKillWhenZero', () => {
    // given: kill recorded but no turn count (legacy data)
    const records = [
      makeRecord({
        outcome: 'player_win',
        entityEvents: [
          { kind: 'battle_started', payload: { enemy: { kind: 'enemy', id: 'cepr' } }, floor: 1 },
          {
            kind: 'battle_ended',
            payload: { outcome: 'player_win', enemy: { kind: 'enemy', id: 'cepr' } },
            floor: 1,
            turn: 0,
          },
        ],
      }),
    ];

    // when
    const metrics = analyze(records);

    // then — 0 turns recorded is uninformative; render as null not 0
    expect(metrics.byEntity['enemy:cepr'].avgTurnsToKill).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // T3 — relic / boon pickRate uses run-fraction formula
  // ---------------------------------------------------------------------------

  it('shouldComputeRelicPickRateAsAcquiredOverRunCount', () => {
    // given: 3 runs, pas_bacowski acquired in 2 (no offered events emitted at all)
    const records = [
      makeRecord({ outcome: 'player_win', finalRelics: ['pas_bacowski'] }),
      makeRecord({ outcome: 'enemy_win', finalRelics: ['pas_bacowski'] }),
      makeRecord({ outcome: 'enemy_win', finalRelics: [] }),
    ];

    // when
    const metrics = analyze(records);

    // then — 2 acquired / 3 runs
    expect(metrics.byEntity['relic:pas_bacowski'].pickRate).toBeCloseTo(2 / 3, 3);
    expect(metrics.byEntity['relic:pas_bacowski'].pickRate).toBeLessThanOrEqual(1.0);
  });

  // ---------------------------------------------------------------------------
  // T7 — overall.floorReached distribution + per-entity floor lift
  // ---------------------------------------------------------------------------

  it('shouldExposeFloorReachedDistributionInOverall', () => {
    // given: 5 runs at floors 1..5
    const records = [1, 2, 3, 4, 5].map((f) =>
      makeRecord({ floorReached: f, outcome: 'enemy_win' })
    );

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.overall.floorReached).toBeDefined();
    expect(metrics.overall.floorReached.p50).toBe(3);
    expect(metrics.overall.floorReached.max).toBe(5);
    expect(metrics.overall.floorReached.mean).toBe(3);
  });

  it('shouldComputePerEntityFloorReachedLift', () => {
    // given: ciupaga runs reach floor 6 on average; non-ciupaga reach floor 2
    const records = [
      makeRecord({ outcome: 'enemy_win', floorReached: 6, finalDeck: ['ciupaga'] }),
      makeRecord({ outcome: 'enemy_win', floorReached: 6, finalDeck: ['ciupaga'] }),
      makeRecord({ outcome: 'enemy_win', floorReached: 2, finalDeck: ['gasior'] }),
      makeRecord({ outcome: 'enemy_win', floorReached: 2, finalDeck: ['gasior'] }),
    ];

    // when
    const metrics = analyze(records);

    // then
    const ciupaga = metrics.byEntity['card:ciupaga'];
    expect(ciupaga.avgFloorReachedWith).toBe(6);
    expect(ciupaga.avgFloorReachedWithout).toBe(2);
    expect(ciupaga.floorReachedLift).toBe(4);
  });

  it('shouldAggregateHpAtDeathAndSurvivalScoreIntoOverall', () => {
    // given: two runs with explicit survival scores
    const records = [
      makeRecord({ floorReached: 4, hpAtDeath: 20, maxHpAtDeath: 40, survivalScore: 4.5 }),
      makeRecord({ floorReached: 6, hpAtDeath: 0, maxHpAtDeath: 40, survivalScore: 6.0 }),
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.overall.avgHpAtDeath.mean).toBe(10);
    expect(metrics.overall.avgSurvivalScore.mean).toBeCloseTo(5.25, 2);
    expect(metrics.overall.hpAtDeath.max).toBe(20);
    expect(metrics.overall.survivalScore.p50).toBeCloseTo(5.25, 2);
  });

  it('shouldFallBackToDerivedSurvivalScoreForLegacyRecords', () => {
    // given: a record without survivalScore but with hpAtDeath/maxHpAtDeath
    const records = [
      makeRecord({ floorReached: 3, hpAtDeath: 10, maxHpAtDeath: 40 }), // derived: 3.25
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.overall.avgSurvivalScore.mean).toBeCloseTo(3.25, 2);
  });

  it('shouldReportAgentDivergenceWhenMultipleAgentsParticipate', () => {
    // given: heuristic wins everything, random loses everything
    const records = [
      makeRecord({ agent: 'heuristic', outcome: 'player_win', floorReached: 10 }),
      makeRecord({ agent: 'heuristic', outcome: 'player_win', floorReached: 10 }),
      makeRecord({ agent: 'random', outcome: 'enemy_win', floorReached: 2 }),
      makeRecord({ agent: 'random', outcome: 'enemy_win', floorReached: 2 }),
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.agentStats.heuristic.winrate.rate).toBe(1);
    expect(metrics.agentStats.random.winrate.rate).toBe(0);
    expect(metrics.agentDivergence.agents).toBe(2);
    expect(metrics.agentDivergence.winrateSpread).toBe(1);
    expect(metrics.agentDivergence.floorSpread).toBe(8);
    expect(metrics.agentDivergence.winrateStdDev).toBeGreaterThan(0);
  });

  it('shouldReportZeroDivergenceWhenOnlyOneAgentPresent', () => {
    // given
    const records = [makeRecord({ agent: 'heuristic' }), makeRecord({ agent: 'heuristic' })];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.agentDivergence.agents).toBe(1);
    expect(metrics.agentDivergence.winrateStdDev).toBe(0);
    expect(metrics.agentDivergence.floorSpread).toBe(0);
  });
});
