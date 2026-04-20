/**
 * MinimalistBot — thin-deck archetype.
 * Refuses most card rewards; targetDeckSize 10 to keep deck tight and consistent.
 */

import { makeHeuristicBot } from './HeuristicBase.js';

export const MinimalistBot = makeHeuristicBot({
  reward: {
    targetDeckSize: 10,
    rareMultiplier: 1.2,
    shopRelicRatio: 0.4,
    shopRemovalStarterThreshold: 8,
  },
});
