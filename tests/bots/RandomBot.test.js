import { describe, it, expect } from 'vitest';
import { RandomBot } from '../../src/logic/bots/RandomBot.js';

/** Mulberry32 — same PRNG used by Rng.js, seeded for test stability */
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('RandomBot', () => {
  it('shouldSelectLegalActionWhenObservationHasThreeChoices', () => {
    // given
    const actions = [
      { type: 'play_card', handIndex: 0 },
      { type: 'play_card', handIndex: 1 },
      { type: 'end_turn' },
    ];
    const observation = { legalActions: actions };
    const rng = mulberry32(1);

    // when
    const result = RandomBot(observation, rng);

    // then
    expect(actions).toContainEqual(result);
  });

  it('shouldProduceStableSelectionForFixedSeed', () => {
    // given
    const actions = [
      { type: 'play_card', handIndex: 0 },
      { type: 'play_card', handIndex: 1 },
      { type: 'end_turn' },
    ];
    const observation = { legalActions: actions };

    // when — two identical RNG streams must yield identical picks
    const rngA = mulberry32(1);
    const rngB = mulberry32(1);
    const picksA = Array.from({ length: 10 }, () => RandomBot(observation, rngA));
    const picksB = Array.from({ length: 10 }, () => RandomBot(observation, rngB));

    // then
    expect(picksA).toEqual(picksB);
  });

  it('shouldThrowWhenNoLegalActionsAvailable', () => {
    // given
    const observation = { legalActions: [] };
    const rng = mulberry32(1);

    // when / then
    expect(() => RandomBot(observation, rng)).toThrow(
      'RandomBot: observation has no legal actions'
    );
  });

  it('shouldReturnSingleActionWhenOnlyOneAvailable', () => {
    // given
    const onlyAction = { type: 'end_turn' };
    const observation = { legalActions: [onlyAction] };
    const rng = mulberry32(42);

    // when
    const result = RandomBot(observation, rng);

    // then
    expect(result).toEqual(onlyAction);
  });
});
