/**
 * @typedef {{ include?: string[] | null, exclude?: string[] | null, disable?: boolean }} PoolFilter
 * @typedef {{
 *   cards?: PoolFilter,
 *   relics?: PoolFilter,
 *   boons?: PoolFilter,
 *   events?: PoolFilter,
 *   enemies?: { regular?: PoolFilter, elite?: PoolFilter, boss?: PoolFilter },
 *   weathers?: {
 *     weights?: Record<'clear'|'halny'|'frozen'|'fog', number>,
 *     force?: 'clear'|'halny'|'frozen'|'fog'|null,
 *     forcePerFloor?: Record<number, 'clear'|'halny'|'frozen'|'fog'>,
 *   },
 * }} PoolOverrides
 */

/**
 * Filter a pool of entity IDs according to a PoolFilter.
 * - include: null → keep all; array → whitelist
 * - exclude: applied after include; exclude wins on conflict
 * - disable: true → return []
 * @param {PoolFilter | null | undefined} filter
 * @param {string[]} ids
 * @returns {string[]}
 */
export function filterPool(filter, ids) {
  if (!filter) return ids;
  if (filter.disable) return [];

  let result = ids;

  if (filter.include != null) {
    const includeSet = new Set(filter.include);
    result = result.filter((id) => includeSet.has(id));
  }

  if (filter.exclude && filter.exclude.length > 0) {
    const excludeSet = new Set(filter.exclude);
    result = result.filter((id) => !excludeSet.has(id));
  }

  return result;
}

/**
 * Resolve the PoolFilter for a given pool kind from a PoolOverrides object.
 * Handles the nested enemy sub-tiers.
 * @param {PoolOverrides | null | undefined} overrides
 * @param {'cards'|'relics'|'boons'|'events'|'enemy_regular'|'enemy_elite'|'enemy_boss'} kind
 * @returns {PoolFilter | null}
 */
export function resolveFilter(overrides, kind) {
  if (!overrides) return null;
  if (kind === 'enemy_regular') return overrides.enemies?.regular ?? null;
  if (kind === 'enemy_elite') return overrides.enemies?.elite ?? null;
  if (kind === 'enemy_boss') return overrides.enemies?.boss ?? null;
  return overrides[kind] ?? null;
}

/**
 * Apply filterPool using overrides resolved for the given kind.
 * Convenience used at pick sites: state.filterPool(kind, ids).
 * @param {PoolOverrides | null | undefined} overrides
 * @param {'cards'|'relics'|'boons'|'events'|'enemy_regular'|'enemy_elite'|'enemy_boss'} kind
 * @param {string[]} ids
 * @returns {string[]}
 */
export function applyPoolFilter(overrides, kind, ids) {
  return filterPool(resolveFilter(overrides, kind), ids);
}

/**
 * Validate that all IDs in every include list exist in the provided full pools.
 * Throws loudly at batch-load time if any ID is invalid.
 * @param {PoolOverrides} overrides
 * @param {Record<string, string[]>} knownPools - map from kind key to all valid IDs
 */
export function validateOverrides(overrides, knownPools) {
  /** @param {string[]|null|undefined} ids @param {string[]} valid @param {string} ctx */
  function check(ids, valid, ctx) {
    if (!ids) return;
    const validSet = new Set(valid);
    for (const id of ids) {
      if (!validSet.has(id)) throw new Error(`PoolOverrides: unknown ${ctx} id "${id}"`);
    }
  }

  if (overrides.cards) {
    check(overrides.cards.include, knownPools.cards ?? [], 'cards.include');
    check(overrides.cards.exclude, knownPools.cards ?? [], 'cards.exclude');
  }
  if (overrides.relics) {
    check(overrides.relics.include, knownPools.relics ?? [], 'relics.include');
    check(overrides.relics.exclude, knownPools.relics ?? [], 'relics.exclude');
  }
  if (overrides.boons) {
    check(overrides.boons.include, knownPools.boons ?? [], 'boons.include');
    check(overrides.boons.exclude, knownPools.boons ?? [], 'boons.exclude');
  }
  if (overrides.events) {
    check(overrides.events.include, knownPools.events ?? [], 'events.include');
    check(overrides.events.exclude, knownPools.events ?? [], 'events.exclude');
  }
  if (overrides.enemies) {
    for (const tier of ['regular', 'elite', 'boss']) {
      const f = overrides.enemies[tier];
      if (f) {
        check(f.include, knownPools[`enemy_${tier}`] ?? [], `enemies.${tier}.include`);
        check(f.exclude, knownPools[`enemy_${tier}`] ?? [], `enemies.${tier}.exclude`);
      }
    }
  }
}
