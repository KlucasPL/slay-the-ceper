/**
 * RachunekBot — bankruptcy-race archetype.
 *
 * Rachunek is the enemy bankruptcy counter: when it meets or exceeds current
 * enemy HP the enemy loses outright. This archetype over-weights rachunek
 * accumulation versus raw damage to prefer bankrupting bosses over killing them.
 */

import { makeHeuristicBot } from './HeuristicBase.js';

export const RachunekBot = makeHeuristicBot({
  cardScore: {
    damagePerEnergy: 0.7,
    blockPerEnergy: 0.9,
    statusPerEnergy: 0.9,
    drawPerEnergy: 2.3,
    exhaustPenalty: 0.4,
    rachunekPerEnergy: 2.5,
  },
});
