/**
 * LansBot — lans-synergy archetype.
 *
 * Lans converts damage into dutki loss instead of Krzepa (HP) loss and gates
 * a family of tagged cards whose full effect only fires while Lans is active.
 * This archetype amplifies status value for Lans and favours lans-tagged
 * rewards so the bot stays in the combo once it activates.
 */

import { makeHeuristicBot } from './HeuristicBase.js';

export const LansBot = makeHeuristicBot({
  statusValue: {
    lans: 12,
  },
  cardScore: {
    damagePerEnergy: 1.1,
    blockPerEnergy: 0.7,
    statusPerEnergy: 1.4,
    drawPerEnergy: 2.2,
    exhaustPenalty: 0.5,
    lansActivationValue: 10,
  },
  blockUrgency: {
    hpDiscount: 0.25,
    panicThreshold: 0.35,
  },
});
