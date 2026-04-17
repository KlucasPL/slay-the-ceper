import { describe, it, expect } from 'vitest';
import { mulberry32, parseSeed, withSeededRng } from '../../src/engine/Rng.js';

describe('mulberry32', () => {
  it('shouldProduceNumbersInZeroOneRange', () => {
    // given
    const rng = mulberry32(42);
    // when
    const samples = Array.from({ length: 100 }, rng);
    // then
    expect(samples.every((n) => n >= 0 && n < 1)).toBe(true);
  });

  it('shouldProduceDeterministicOutputForSameSeed', () => {
    // given
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);
    // when
    const a = Array.from({ length: 20 }, rng1);
    const b = Array.from({ length: 20 }, rng2);
    // then
    expect(a).toEqual(b);
  });

  it('shouldProduceDifferentOutputForDifferentSeeds', () => {
    // given
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);
    // when
    const a = rng1();
    const b = rng2();
    // then
    expect(a).not.toBe(b);
  });
});

describe('parseSeed', () => {
  it('shouldParseHexString', () => {
    expect(parseSeed('0x2a')).toBe(42);
    expect(parseSeed('ff')).toBe(255);
  });

  it('shouldAcceptNumber', () => {
    expect(parseSeed(42)).toBe(42);
  });

  it('shouldThrowOnInvalidHex', () => {
    expect(() => parseSeed('xyz')).toThrow('Invalid seed');
  });
});

describe('withSeededRng', () => {
  it('shouldRestoreMathRandomAfterFn', () => {
    // given
    const original = Math.random;
    // when
    withSeededRng(1, () => {});
    // then
    expect(Math.random).toBe(original);
  });

  it('shouldRestoreMathRandomOnThrow', () => {
    // given
    const original = Math.random;
    // when
    try {
      withSeededRng(1, () => {
        throw new Error('oops');
      });
    } catch {
      /* expected */
    }
    // then
    expect(Math.random).toBe(original);
  });

  it('shouldMakeMathRandomDeterministic', () => {
    // given / when
    const a = withSeededRng('abcd', () => [Math.random(), Math.random()]);
    const b = withSeededRng('abcd', () => [Math.random(), Math.random()]);
    // then
    expect(a).toEqual(b);
  });

  it('shouldReturnFnResult', () => {
    expect(withSeededRng(1, () => 42)).toBe(42);
  });
});
