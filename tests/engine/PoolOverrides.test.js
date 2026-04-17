import { describe, it, expect } from 'vitest';
import {
  filterPool,
  resolveFilter,
  applyPoolFilter,
  validateOverrides,
} from '../../src/engine/PoolOverrides.js';

const ALL_IDS = ['a', 'b', 'c', 'd'];

describe('filterPool', () => {
  it('shouldReturnAllIdsWhenNoFilter', () => {
    expect(filterPool(null, ALL_IDS)).toEqual(ALL_IDS);
  });

  it('shouldReturnEmptyWhenDisabled', () => {
    expect(filterPool({ disable: true }, ALL_IDS)).toEqual([]);
  });

  it('shouldWhitelistWithInclude', () => {
    expect(filterPool({ include: ['a', 'c'] }, ALL_IDS)).toEqual(['a', 'c']);
  });

  it('shouldApplyExcludeAfterInclude', () => {
    expect(filterPool({ include: ['a', 'b', 'c'], exclude: ['b'] }, ALL_IDS)).toEqual(['a', 'c']);
  });

  it('shouldLetExcludeWinOverInclude', () => {
    expect(filterPool({ include: ['a', 'b'], exclude: ['a'] }, ALL_IDS)).toEqual(['b']);
  });

  it('shouldApplyExcludeAloneOnNullInclude', () => {
    expect(filterPool({ include: null, exclude: ['a', 'd'] }, ALL_IDS)).toEqual(['b', 'c']);
  });
});

describe('resolveFilter', () => {
  it('shouldReturnNullWhenNoOverrides', () => {
    expect(resolveFilter(null, 'cards')).toBeNull();
  });

  it('shouldResolveEnemyTiers', () => {
    const overrides = { enemies: { regular: { exclude: ['cepr'] } } };
    expect(resolveFilter(overrides, 'enemy_regular')).toEqual({ exclude: ['cepr'] });
    expect(resolveFilter(overrides, 'enemy_elite')).toBeNull();
  });
});

describe('applyPoolFilter', () => {
  it('shouldPassThroughAllWhenNoOverrides', () => {
    expect(applyPoolFilter(null, 'cards', ALL_IDS)).toEqual(ALL_IDS);
  });

  it('shouldApplyCardFilter', () => {
    const overrides = { cards: { include: ['a'] } };
    expect(applyPoolFilter(overrides, 'cards', ALL_IDS)).toEqual(['a']);
  });
});

describe('validateOverrides', () => {
  it('shouldNotThrowWhenAllIdsValid', () => {
    const overrides = { cards: { include: ['a'], exclude: ['b'] } };
    expect(() => validateOverrides(overrides, { cards: ALL_IDS })).not.toThrow();
  });

  it('shouldThrowOnUnknownIncludeId', () => {
    const overrides = { cards: { include: ['z'] } };
    expect(() => validateOverrides(overrides, { cards: ALL_IDS })).toThrow(
      'unknown cards.include id "z"'
    );
  });
});
