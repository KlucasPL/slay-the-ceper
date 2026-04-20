import { describe, it, expect } from 'vitest';
import { buildPairedRuns, injectPairedOverrides } from '../../scripts/sim/pairing.js';

// ---------------------------------------------------------------------------
// buildPairedRuns expansion
// ---------------------------------------------------------------------------

describe('buildPairedRuns', () => {
  it('shouldExpandEachSeedIntoTwoRunSpecs', () => {
    // given
    const seeds = [1, 2, 3];
    const pairing = { entity: { kind: 'relic', id: 'pas_bacowski' }, mode: 'include_vs_exclude' };

    // when
    const runs = buildPairedRuns(seeds, pairing);

    // then
    expect(runs).toHaveLength(6);
    const seedOneRuns = runs.filter((r) => r.seed === 1);
    expect(seedOneRuns).toHaveLength(2);
    expect(seedOneRuns.map((r) => r.world).sort()).toEqual(['A', 'B']);
  });

  it('shouldAssignMatchingPairKeyToSiblings', () => {
    // given
    const seeds = [42];
    const pairing = { entity: { kind: 'card', id: 'ciupaga' }, mode: 'include_vs_exclude' };

    // when
    const runs = buildPairedRuns(seeds, pairing);

    // then
    const [a, b] = runs;
    expect(a.pairKey).toBe(b.pairKey);
    expect(a.pairKey).toMatch(/^card:ciupaga:/);
  });

  it('shouldPreserveSeedAcrossBothWorlds', () => {
    // given
    const seeds = [99, 100];
    const pairing = { entity: { kind: 'event', id: 'fest' }, mode: 'include_vs_exclude' };

    // when
    const runs = buildPairedRuns(seeds, pairing);

    // then: each seed appears in exactly one A and one B
    for (const seed of seeds) {
      const seedRuns = runs.filter((r) => r.seed === seed);
      expect(seedRuns.map((r) => r.world).sort()).toEqual(['A', 'B']);
    }
  });

  it('shouldAssignSamePairIndexToSiblings', () => {
    // given
    const seeds = [1, 2];
    const pairing = { entity: { kind: 'relic', id: 'x' }, mode: 'include_vs_exclude' };

    // when
    const runs = buildPairedRuns(seeds, pairing);

    // then: pair index 0 = seed[0], index 1 = seed[1]
    const idx0 = runs.filter((r) => r.pairIndex === 0);
    expect(idx0).toHaveLength(2);
    expect(idx0.every((r) => r.seed === 1)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Injection per entity kind — World A (present)
// ---------------------------------------------------------------------------

describe('injectPairedOverrides — World A (present)', () => {
  it('shouldAppendCardToStartingDeck', () => {
    // given/when
    const overrides = injectPairedOverrides('card', 'ciupaga', 'A');

    // then
    expect(overrides.startingDeck).toContain('ciupaga');
    expect(overrides.pools?.cards?.exclude).toContain('ciupaga');
  });

  it('shouldAddRelicToStartingRelicsAndExclude', () => {
    // given/when
    const overrides = injectPairedOverrides('relic', 'pas_bacowski', 'A');

    // then
    expect(overrides.startingRelics).toContain('pas_bacowski');
    expect(overrides.pools?.relics?.exclude).toContain('pas_bacowski');
  });

  it('shouldEnableMarynaAndForceBoon', () => {
    // given/when
    const overrides = injectPairedOverrides('boon', 'mokra_sciera', 'A');

    // then
    expect(overrides.marynaEnabled).toBe(true);
    expect(overrides.forcedBoonOffer).toBe('mokra_sciera');
  });

  it('shouldSetForceEvent', () => {
    // given/when
    const overrides = injectPairedOverrides('event', 'fest', 'A');

    // then
    expect(overrides.forceEvent).toBe('fest');
  });

  it('shouldSetForceWeather', () => {
    // given/when
    const overrides = injectPairedOverrides('weather', 'halny', 'A');

    // then
    expect(overrides.forceWeather).toBe('halny');
  });

  it('shouldSetForceEnemyRegularByDefault', () => {
    // given/when
    const overrides = injectPairedOverrides('enemy', 'cepr', 'A');

    // then
    expect(overrides.forceEnemy?.regular).toBe('cepr');
    expect(overrides.forceEnemy?.elite).toBeUndefined();
  });

  it('shouldSetForceEnemyEliteWhenTierSpecified', () => {
    // given/when
    const overrides = injectPairedOverrides('enemy', 'cepr', 'A', {}, { enemyTier: 'elite' });

    // then
    expect(overrides.forceEnemy?.elite).toBe('cepr');
    expect(overrides.forceEnemy?.regular).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Injection per entity kind — World B (absent)
// ---------------------------------------------------------------------------

describe('injectPairedOverrides — World B (absent)', () => {
  it('shouldExcludeCardFromPool', () => {
    // given/when
    const overrides = injectPairedOverrides('card', 'ciupaga', 'B');

    // then: no startingDeck change, just exclude
    expect(overrides.startingDeck).toBeUndefined();
    expect(overrides.pools?.cards?.exclude).toContain('ciupaga');
  });

  it('shouldExcludeRelicFromPool', () => {
    // given/when
    const overrides = injectPairedOverrides('relic', 'pas_bacowski', 'B');

    // then
    expect(overrides.startingRelics).toBeUndefined();
    expect(overrides.pools?.relics?.exclude).toContain('pas_bacowski');
  });

  it('shouldExcludeBoonFromPool', () => {
    // given/when
    const overrides = injectPairedOverrides('boon', 'mokra_sciera', 'B');

    // then
    expect(overrides.pools?.boons?.exclude).toContain('mokra_sciera');
  });

  it('shouldExcludeEventFromPool', () => {
    // given/when
    const overrides = injectPairedOverrides('event', 'fest', 'B');

    // then
    expect(overrides.pools?.events?.exclude).toContain('fest');
  });

  it('shouldZeroWeatherWeightAndRenormalise', () => {
    // given/when
    const overrides = injectPairedOverrides('weather', 'halny', 'B');

    // then: halny weight is 0
    expect(overrides.pools?.weathers?.weights?.halny).toBe(0);
    // remaining weights sum to ~1
    const weights = overrides.pools?.weathers?.weights ?? {};
    const total = Object.values(weights).reduce((s, w) => s + w, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it('shouldExcludeEnemyFromRegularPoolByDefault', () => {
    // given/when
    const overrides = injectPairedOverrides('enemy', 'cepr', 'B');

    // then
    expect(overrides.pools?.enemies?.regular?.exclude).toContain('cepr');
  });

  it('shouldExcludeEnemyFromElitePoolWhenTierSpecified', () => {
    // given/when
    const overrides = injectPairedOverrides('enemy', 'naganiacz', 'B', {}, { enemyTier: 'elite' });

    // then
    expect(overrides.pools?.enemies?.elite?.exclude).toContain('naganiacz');
  });
});

// ---------------------------------------------------------------------------
// Base overrides are deep-cloned (no cross-world mutation)
// ---------------------------------------------------------------------------

describe('injectPairedOverrides — isolation', () => {
  it('shouldNotMutateBaseOverrides', () => {
    // given
    const base = {
      startingRelics: ['existing_relic'],
      pools: { relics: { exclude: ['already'] } },
    };

    // when
    injectPairedOverrides('relic', 'new_relic', 'A', base);

    // then: base unmodified
    expect(base.startingRelics).not.toContain('new_relic');
    expect(base.pools.relics.exclude).not.toContain('new_relic');
  });

  it('shouldNotShareMutationBetweenWorldAAndB', () => {
    // given
    const base = {};

    // when
    const worldA = injectPairedOverrides('relic', 'x', 'A', base);
    const worldB = injectPairedOverrides('relic', 'x', 'B', base);

    // then: worldA has startingRelics; worldB does not
    expect(worldA.startingRelics).toContain('x');
    expect(worldB.startingRelics).toBeUndefined();
  });

  it('shouldPreserveExistingExcludesWhenAddingNew', () => {
    // given
    const base = { pools: { cards: { exclude: ['gasior'] } } };

    // when
    const overrides = injectPairedOverrides('card', 'ciupaga', 'B', base);

    // then: both present
    expect(overrides.pools?.cards?.exclude).toContain('gasior');
    expect(overrides.pools?.cards?.exclude).toContain('ciupaga');
  });

  it('shouldNotDuplicateIdIfAlreadyExcluded', () => {
    // given
    const base = { pools: { cards: { exclude: ['ciupaga'] } } };

    // when
    const overrides = injectPairedOverrides('card', 'ciupaga', 'B', base);

    // then: appears exactly once
    const excludes = overrides.pools?.cards?.exclude ?? [];
    expect(excludes.filter((id) => id === 'ciupaga')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Analytics: brokenPairs in analyze()
// ---------------------------------------------------------------------------

describe('analyze — brokenPairs diagnostic', () => {
  it('shouldCountBrokenPairsInDiagnostic', async () => {
    // given
    const { analyze } = await import('../../scripts/analyze.js');
    const records = [
      // complete pair
      {
        schemaVersion: 2,
        batch: 'b',
        gitSha: '',
        configHash: '',
        poolOverridesHash: '',
        seed: 1,
        agent: 'r',
        agentParams: {},
        character: 'jedrek',
        difficulty: 'normal',
        poolOverrides: null,
        outcome: 'player_win',
        floorReached: 3,
        turnsPlayed: 5,
        totalDutkiEarned: 50,
        killerEnemyId: null,
        killerName: null,
        finalDeck: [],
        finalRelics: [],
        finalBoons: [],
        durationMs: 100,
        pairKey: 'relic:x:0',
        world: 'A',
        pairStatus: 'ok',
      },
      {
        schemaVersion: 2,
        batch: 'b',
        gitSha: '',
        configHash: '',
        poolOverridesHash: '',
        seed: 1,
        agent: 'r',
        agentParams: {},
        character: 'jedrek',
        difficulty: 'normal',
        poolOverrides: null,
        outcome: 'enemy_win',
        floorReached: 2,
        turnsPlayed: 4,
        totalDutkiEarned: 30,
        killerEnemyId: 'cepr',
        killerName: null,
        finalDeck: [],
        finalRelics: [],
        finalBoons: [],
        durationMs: 80,
        pairKey: 'relic:x:0',
        world: 'B',
        pairStatus: 'ok',
      },
      // broken pair — only A side present
      {
        schemaVersion: 2,
        batch: 'b',
        gitSha: '',
        configHash: '',
        poolOverridesHash: '',
        seed: 2,
        agent: 'r',
        agentParams: {},
        character: 'jedrek',
        difficulty: 'normal',
        poolOverrides: null,
        outcome: 'player_win',
        floorReached: 3,
        turnsPlayed: 5,
        totalDutkiEarned: 50,
        killerEnemyId: null,
        killerName: null,
        finalDeck: [],
        finalRelics: [],
        finalBoons: [],
        durationMs: 100,
        pairKey: 'relic:x:1',
        world: 'A',
        pairStatus: 'ok',
      },
      // B side marked broken
      {
        schemaVersion: 2,
        batch: 'b',
        gitSha: '',
        configHash: '',
        poolOverridesHash: '',
        seed: 2,
        agent: 'r',
        agentParams: {},
        character: 'jedrek',
        difficulty: 'normal',
        poolOverrides: null,
        outcome: 'enemy_win',
        floorReached: 1,
        turnsPlayed: 2,
        totalDutkiEarned: 10,
        killerEnemyId: 'cepr',
        killerName: null,
        finalDeck: [],
        finalRelics: [],
        finalBoons: [],
        durationMs: 50,
        pairKey: 'relic:x:1',
        world: 'B',
        pairStatus: 'broken',
      },
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.diagnostic.brokenPairs).toBe(1);
    // complete pair contributes to lift
    expect(metrics.byEntity['relic:x'].matchedPairCount).toBe(1);
  });

  it('shouldCountHalfMissingPairAsBroken', async () => {
    // given: only one side of a pair
    const { analyze } = await import('../../scripts/analyze.js');
    const records = [
      {
        schemaVersion: 2,
        batch: 'b',
        gitSha: '',
        configHash: '',
        poolOverridesHash: '',
        seed: 1,
        agent: 'r',
        agentParams: {},
        character: 'jedrek',
        difficulty: 'normal',
        poolOverrides: null,
        outcome: 'player_win',
        floorReached: 3,
        turnsPlayed: 5,
        totalDutkiEarned: 50,
        killerEnemyId: null,
        killerName: null,
        finalDeck: [],
        finalRelics: [],
        finalBoons: [],
        durationMs: 100,
        pairKey: 'card:y:0',
        world: 'A',
        pairStatus: 'ok',
      },
      // B side missing entirely
    ];

    // when
    const metrics = analyze(records);

    // then
    expect(metrics.diagnostic.brokenPairs).toBe(1);
  });
});
