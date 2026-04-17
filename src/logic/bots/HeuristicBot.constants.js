/**
 * Tuning weights for HeuristicBot. These are starting seeds, not optima.
 * Change proposals require ≥1000-seed before/after winrate delta.
 */
export const HEURISTIC_WEIGHTS = {
  statusValue: {
    weak: 3,
    vulnerable: 4,
    fragile: 2,
    strength: 5,
    nextDouble: 8,
    lans: 6,
    dumaPodhala: 4,
    furiaTurysty: 5,
  },
  blockUrgency: {
    hpDiscount: 0.3,
    panicThreshold: 0.4,
  },
  cardScore: {
    damagePerEnergy: 1.0,
    blockPerEnergy: 0.9,
    statusPerEnergy: 1.0,
    drawPerEnergy: 2.5,
    exhaustPenalty: 0.5,
    lethalBonus: 1000,
  },
  mapScore: {
    eliteHealthyHp: 10,
    elitePenaltyLowHp: -20,
    shopIfAffordable: 5,
    campfireLowHp: 15,
    treasure: 8,
    event: 4,
    fight: 2,
  },
  reward: {
    targetDeckSize: 15,
    rareMultiplier: 1.5,
    shopRelicRatio: 0.6,
    shopRemovalStarterThreshold: 10,
  },
  endTurn: {
    // Lower means the bot keeps playing low-value cards before ending turn —
    // burning extra energy is almost always better than letting it expire.
    minPositiveScore: 0.1,
  },
};
