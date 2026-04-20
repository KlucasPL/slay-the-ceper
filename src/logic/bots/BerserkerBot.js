/**
 * BerserkerBot — reckless archetype.
 * Extreme damage focus, low draw weight, punishes exhaust minimally —
 * burns cards for burst instead of cycling. Provides a useful tail-case
 * datapoint for card balance: "what wins if you never defend?"
 */

import { makeHeuristicBot } from './HeuristicBase.js';

export const BerserkerBot = makeHeuristicBot({
  cardScore: {
    damagePerEnergy: 3.0,
    blockPerEnergy: 0.0,
    statusPerEnergy: 0.2,
    drawPerEnergy: 0.8,
    exhaustPenalty: 0.05,
    lethalBonus: 2000,
  },
  blockUrgency: {
    hpDiscount: 0,
    panicThreshold: 0,
  },
  endTurn: {
    minPositiveScore: 0.2,
  },
});
