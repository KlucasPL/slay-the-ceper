/**
 * ElitistBot — relic-farming archetype.
 * Aggressively routes toward elite/treasure nodes on the map to front-load relics.
 * Useful for measuring lift of individual relics vs. the healthier "avoid risk" path.
 */

import { makeHeuristicBot } from './HeuristicBase.js';

export const ElitistBot = makeHeuristicBot({
  mapScore: {
    eliteHealthyHp: 30,
    elitePenaltyLowHp: -10,
    shopIfAffordable: 3,
    campfireLowHp: 8,
    treasure: 20,
    event: 2,
    fight: 1,
  },
  cardScore: {
    damagePerEnergy: 1.3,
    blockPerEnergy: 1.1,
    statusPerEnergy: 1.0,
    drawPerEnergy: 2.2,
    exhaustPenalty: 0.4,
  },
});
