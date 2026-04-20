/**
 * @typedef {import('../../engine/Observation.js').Observation} Observation
 * @typedef {import('../../engine/LegalActions.js').Action} Action
 */

/**
 * Stateless bot that picks uniformly at random from legalActions.
 * Must be passed a seeded RNG — never calls Math.random() directly.
 *
 * @param {Observation} observation
 * @param {() => number} rng - returns a float in [0, 1)
 * @returns {Action}
 */
export function RandomBot(observation, rng) {
  const actions = observation.legalActions;
  if (actions.length === 0) {
    throw new Error('RandomBot: observation has no legal actions');
  }
  return actions[Math.floor(rng() * actions.length)];
}
