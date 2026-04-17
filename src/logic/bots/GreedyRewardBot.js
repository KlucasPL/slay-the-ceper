/**
 * GreedyRewardBot — big-deck archetype.
 * Same combat as HeuristicBot but aggressively acquires cards (targetDeckSize 25).
 */

import { makeHeuristicBot } from './HeuristicBase.js';

export const GreedyRewardBot = makeHeuristicBot({
  reward: {
    targetDeckSize: 25,
    rareMultiplier: 2.0,
    shopRelicRatio: 0.8,
    shopRemovalStarterThreshold: 20,
  },
});
