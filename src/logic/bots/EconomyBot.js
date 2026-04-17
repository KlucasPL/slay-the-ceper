/**
 * EconomyBot — economy-curve archetype.
 * Prioritises dutki income and shop purchases; prefers shop and treasure nodes.
 */

import { makeHeuristicBot } from './HeuristicBase.js';

export const EconomyBot = makeHeuristicBot({
  mapScore: {
    eliteHealthyHp: 6,
    elitePenaltyLowHp: -30,
    shopIfAffordable: 15,
    campfireLowHp: 12,
    treasure: 12,
    event: 6,
    fight: 2,
  },
  reward: {
    targetDeckSize: 15,
    rareMultiplier: 2.0,
    shopRelicRatio: 1.0,
    shopRemovalStarterThreshold: 8,
  },
  blockUrgency: {
    hpDiscount: 0.2,
    panicThreshold: 0.35,
  },
});
