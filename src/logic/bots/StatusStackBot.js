/**
 * StatusStackBot — status-synergy archetype.
 * Maximises status-effect application (weak/vulnerable/fragile/strength).
 */

import { makeHeuristicBot } from './HeuristicBase.js';

export const StatusStackBot = makeHeuristicBot({
  cardScore: {
    damagePerEnergy: 0.6,
    blockPerEnergy: 0.7,
    statusPerEnergy: 2.5,
    drawPerEnergy: 2.0,
    exhaustPenalty: 0.3,
  },
  statusValue: {
    weak: 5,
    vulnerable: 7,
    fragile: 4,
    strength: 8,
    nextDouble: 10,
    lans: 8,
    dumaPodhala: 6,
    furiaTurysty: 7,
  },
});
