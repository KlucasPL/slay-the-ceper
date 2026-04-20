/**
 * Paired A/B sim expansion module.
 *
 * Given a list of seeds and a pairing spec, expands each seed into two RunSpecs:
 *   - World A: entity forced present
 *   - World B: entity forced absent
 *
 * Injection matrix per §4.9:
 *   card    A: startingDeck appends id + pools.cards.exclude prevents reroll
 *           B: pools.cards.exclude has id
 *   relic   A: startingRelics has id + pools.relics.exclude prevents reroll
 *           B: pools.relics.exclude has id
 *   boon    A: marynaEnabled=true + forcedBoonOffer has id
 *           B: pools.boons.exclude has id
 *   event   A: forceEvent = id
 *           B: pools.events.exclude has id
 *   weather A: forceWeather = id
 *           B: pools.weathers.weights zeros id, renormalises
 *   enemy   A: forceEnemy.<tier> = id
 *           B: pools.enemies.<tier>.exclude has id
 *
 * All enemy kinds default to 'regular' unless `enemyTier` is specified in pairing.
 */

/**
 * @typedef {'card'|'relic'|'boon'|'event'|'weather'|'enemy'} PairableKind
 * @typedef {{ kind: PairableKind, id: string }} EntityRef
 * @typedef {{ entity: EntityRef, mode: 'include_vs_exclude', enemyTier?: 'regular'|'elite'|'boss' }} PairingSpec
 *
 * @typedef {{
 *   seed: number,
 *   world: 'A' | 'B',
 *   pairKey: string,
 *   pairIndex: number,
 *   overrides: import('./runOneGame.js').PairOverrides,
 * }} PairedRunSpec
 */

/**
 * @typedef {{
 *   pools?: import('../../src/engine/PoolOverrides.js').PoolOverrides,
 *   startingRelics?: string[],
 *   startingDeck?: string[],
 *   forceEnemy?: { regular?: string, elite?: string, boss?: string },
 *   forceEvent?: string | null,
 *   forceWeather?: string | null,
 *   marynaEnabled?: boolean,
 *   forcedBoonOffer?: string | null,
 * }} PairOverrides
 */

const WEATHER_IDS = ['clear', 'halny', 'frozen', 'fog'];

/**
 * Build injection overrides for one world of a paired A/B run.
 *
 * @param {PairableKind} kind
 * @param {string} id
 * @param {'A' | 'B'} world
 * @param {PairOverrides} [baseOverrides]
 * @param {{ enemyTier?: 'regular'|'elite'|'boss' }} [opts]
 * @returns {PairOverrides}
 */
export function injectPairedOverrides(kind, id, world, baseOverrides = {}, opts = {}) {
  // Deep-clone base to avoid mutation across sibling worlds
  const overrides = _deepCloneOverrides(baseOverrides);

  if (world === 'A') {
    return _injectPresent(kind, id, overrides, opts);
  }
  return _injectAbsent(kind, id, overrides, opts);
}

/**
 * Expand a list of seeds into paired A+B RunSpecs.
 *
 * @param {number[]} seeds
 * @param {PairingSpec} pairing
 * @param {PairOverrides} [baseOverrides]
 * @returns {PairedRunSpec[]}
 */
export function buildPairedRuns(seeds, pairing, baseOverrides = {}) {
  const { entity, enemyTier } = pairing;
  const runs = [];

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const pairKey = `${entity.kind}:${entity.id}:${i}`;

    runs.push({
      seed,
      world: 'A',
      pairKey,
      pairIndex: i,
      overrides: injectPairedOverrides(entity.kind, entity.id, 'A', baseOverrides, { enemyTier }),
    });

    runs.push({
      seed,
      world: 'B',
      pairKey,
      pairIndex: i,
      overrides: injectPairedOverrides(entity.kind, entity.id, 'B', baseOverrides, { enemyTier }),
    });
  }

  return runs;
}

// ---------------------------------------------------------------------------
// World A — entity forced present
// ---------------------------------------------------------------------------

function _injectPresent(kind, id, overrides, opts) {
  switch (kind) {
    case 'card':
      overrides.startingDeck = [...(overrides.startingDeck ?? []), id];
      overrides.pools = _excludeFrom(overrides.pools, 'cards', id);
      break;

    case 'relic':
      overrides.startingRelics = [...(overrides.startingRelics ?? []), id];
      overrides.pools = _excludeFrom(overrides.pools, 'relics', id);
      break;

    case 'boon':
      overrides.marynaEnabled = true;
      overrides.forcedBoonOffer = id;
      break;

    case 'event':
      overrides.forceEvent = id;
      break;

    case 'weather':
      overrides.forceWeather = id;
      break;

    case 'enemy': {
      const tier = opts.enemyTier ?? 'regular';
      overrides.forceEnemy = { ...(overrides.forceEnemy ?? {}), [tier]: id };
      break;
    }
  }
  return overrides;
}

// ---------------------------------------------------------------------------
// World B — entity forced absent
// ---------------------------------------------------------------------------

function _injectAbsent(kind, id, overrides, opts) {
  switch (kind) {
    case 'card':
      overrides.pools = _excludeFrom(overrides.pools, 'cards', id);
      break;

    case 'relic':
      overrides.pools = _excludeFrom(overrides.pools, 'relics', id);
      break;

    case 'boon':
      overrides.pools = _excludeFrom(overrides.pools, 'boons', id);
      break;

    case 'event':
      overrides.pools = _excludeFrom(overrides.pools, 'events', id);
      break;

    case 'weather':
      overrides.pools = _zeroWeatherWeight(overrides.pools, id);
      break;

    case 'enemy': {
      const tier = opts.enemyTier ?? 'regular';
      overrides.pools = _excludeEnemyTier(overrides.pools, tier, id);
      break;
    }
  }
  return overrides;
}

// ---------------------------------------------------------------------------
// Pool mutation helpers (non-mutating — return new objects)
// ---------------------------------------------------------------------------

function _excludeFrom(pools, poolKind, id) {
  const base = pools ?? {};
  const existing = base[poolKind] ?? {};
  const currentExclude = existing.exclude ?? [];
  return {
    ...base,
    [poolKind]: {
      ...existing,
      exclude: currentExclude.includes(id) ? currentExclude : [...currentExclude, id],
    },
  };
}

function _zeroWeatherWeight(pools, id) {
  const base = pools ?? {};
  const existing = base.weathers ?? {};
  const baseWeights = existing.weights ?? {};

  // Start with all weather IDs at weight 1 if not already set
  const weights = { ...Object.fromEntries(WEATHER_IDS.map((w) => [w, 1])), ...baseWeights };
  weights[id] = 0;

  // Renormalise — if all weights become 0 after zeroing, leave as-is (degenerate case)
  const total = Object.values(weights).reduce((s, w) => s + w, 0);
  const finalWeights =
    total > 0
      ? Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / total]))
      : weights;

  return {
    ...base,
    weathers: { ...existing, weights: finalWeights },
  };
}

function _excludeEnemyTier(pools, tier, id) {
  const base = pools ?? {};
  const enemies = base.enemies ?? {};
  const tierFilter = enemies[tier] ?? {};
  const currentExclude = tierFilter.exclude ?? [];
  return {
    ...base,
    enemies: {
      ...enemies,
      [tier]: {
        ...tierFilter,
        exclude: currentExclude.includes(id) ? currentExclude : [...currentExclude, id],
      },
    },
  };
}

function _deepCloneOverrides(overrides) {
  // Shallow clone top-level, then deep-clone pools and arrays
  return {
    ...overrides,
    startingRelics: overrides.startingRelics ? [...overrides.startingRelics] : undefined,
    startingDeck: overrides.startingDeck ? [...overrides.startingDeck] : undefined,
    forceEnemy: overrides.forceEnemy ? { ...overrides.forceEnemy } : undefined,
    pools: overrides.pools ? _deepClonePools(overrides.pools) : undefined,
  };
}

function _deepClonePools(pools) {
  const clone = { ...pools };
  for (const key of ['cards', 'relics', 'boons', 'events']) {
    if (clone[key])
      clone[key] = {
        ...clone[key],
        exclude: clone[key].exclude ? [...clone[key].exclude] : undefined,
        include: clone[key].include ? [...clone[key].include] : undefined,
      };
  }
  if (clone.enemies) {
    clone.enemies = { ...clone.enemies };
    for (const tier of ['regular', 'elite', 'boss']) {
      if (clone.enemies[tier])
        clone.enemies[tier] = {
          ...clone.enemies[tier],
          exclude: clone.enemies[tier].exclude ? [...clone.enemies[tier].exclude] : undefined,
        };
    }
  }
  if (clone.weathers)
    clone.weathers = {
      ...clone.weathers,
      weights: clone.weathers.weights ? { ...clone.weathers.weights } : undefined,
    };
  return clone;
}
