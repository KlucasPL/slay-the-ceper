/**
 * AggressiveBot — glass-cannon archetype.
 * Maximises damage per energy; ignores block entirely.
 */

import { makeHeuristicBot } from './HeuristicBase.js';

export const AggressiveBot = makeHeuristicBot({
  cardScore: {
    damagePerEnergy: 2.0,
    blockPerEnergy: 0,
    statusPerEnergy: 0.5,
    drawPerEnergy: 1.5,
    exhaustPenalty: 0.2,
  },
  blockUrgency: {
    hpDiscount: 0,
    panicThreshold: 0,
  },
});
