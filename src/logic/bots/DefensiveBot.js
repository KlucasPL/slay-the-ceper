/**
 * DefensiveBot — tank archetype.
 * Prioritises block; attacks only when block opportunities are exhausted.
 */

import { makeHeuristicBot } from './HeuristicBase.js';

export const DefensiveBot = makeHeuristicBot({
  cardScore: {
    damagePerEnergy: 0.4,
    blockPerEnergy: 2.0,
    statusPerEnergy: 1.2,
    drawPerEnergy: 2.0,
    exhaustPenalty: 0.5,
  },
  blockUrgency: {
    hpDiscount: 0.6,
    panicThreshold: 0.7,
  },
});
