/**
 * DrawEngineBot — card-cycling archetype.
 * Values draw effects extremely high, willing to exhaust freely to cycle the deck.
 * Surfaces the lift of draw-based cards like Góralskie Hej in combos.
 */

import { makeHeuristicBot } from './HeuristicBase.js';

export const DrawEngineBot = makeHeuristicBot({
  cardScore: {
    damagePerEnergy: 0.8,
    blockPerEnergy: 0.7,
    statusPerEnergy: 0.8,
    drawPerEnergy: 5.0,
    exhaustPenalty: 0.15,
  },
  reward: {
    targetDeckSize: 18,
    rareMultiplier: 1.6,
    shopRelicRatio: 0.5,
    shopRemovalStarterThreshold: 12,
  },
});
