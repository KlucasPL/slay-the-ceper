/**
 * SearchBot — 1-ply lookahead (default) with optional MCTS rollouts.
 *
 * Default mode (mctsN=0):
 *   For each legal action, snapshot the engine, apply the action, score the
 *   resulting observation with HeuristicBot's static evaluator, restore.
 *   Pick the action with the highest 1-ply score.
 *
 * MCTS mode (mctsN>0):
 *   For each legal action, run mctsN random rollouts from the post-action state
 *   and average the leaf values. More expensive but less biased than static eval.
 *
 * Per plan §6 D8: uses rules.revealAllPiles=true so rollouts see real pile
 * contents. This inflates winrates vs HeuristicBot — document the tradeoff, not hide it.
 *
 * Dependency: src/engine/ only (EngineController, mulberry32). Never src/state/ or src/ui/.
 */

import { mulberry32 } from '../../engine/index.js';
import { RandomBot } from './RandomBot.js';

/**
 * @typedef {import('../../engine/Observation.js').Observation} Observation
 * @typedef {import('../../engine/ActionDispatcher.js').Action} Action
 * @typedef {import('../../engine/EngineController.js').EngineController} EngineController
 */

/** Maximum actions per rollout — prevents hangs on degenerate states */
const MAX_ROLLOUT_ACTIONS = 500;

/**
 * @typedef {{
 *   mctsN?: number,       // rollouts per action (0 = pure 1-ply static eval, default)
 *   rolloutSeed?: number, // base seed for rollout RNGs (default: 0xcafe)
 * }} SearchBotOptions
 */

/**
 * Factory that binds an EngineController to the search policy.
 * Returns a bot function compatible with the standard (observation, rng?) → Action signature.
 *
 * @param {EngineController} engine
 * @param {SearchBotOptions} [opts]
 * @returns {(observation: Observation) => Action}
 */
export function makeSearchBot(engine, opts = {}) {
  const mctsN = opts.mctsN ?? 0;
  const rolloutSeed = opts.rolloutSeed ?? 0xcafe;

  return function SearchBot(observation) {
    const { legalActions } = observation;
    if (legalActions.length === 0) throw new Error('SearchBot: no legal actions');
    if (legalActions.length === 1) return legalActions[0];

    // Snapshot before any evaluation so we can restore Math.random state fully
    // after the search loop. Without this, Math.random advances during lookahead
    // apply/restore cycles and diverges two engines running the same seed.
    const rootSnap = engine.snapshot();

    let bestAction = legalActions[0];
    let bestScore = -Infinity;

    for (let i = 0; i < legalActions.length; i++) {
      const action = legalActions[i];
      const score =
        mctsN > 0
          ? _rolloutScore(engine, action, mctsN, rolloutSeed ^ i)
          : _onePlyScore(engine, action);

      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    // Restore engine to pre-search state so the caller's subsequent applyAction
    // uses the same Math.random position as if no lookahead had occurred.
    EngineController_restore(engine, rootSnap);

    return bestAction;
  };
}

// ---------------------------------------------------------------------------
// 1-ply static evaluation
// ---------------------------------------------------------------------------

/**
 * Snapshot → apply action → evaluate with HeuristicBot's static scorer → restore.
 * @param {EngineController} engine
 * @param {Action} action
 * @returns {number}
 */
function _onePlyScore(engine, action) {
  const snap = engine.snapshot();
  const result = engine.applyAction(action);
  const score = _evalObservation(result.observation);
  EngineController_restore(engine, snap);
  return score;
}

// ---------------------------------------------------------------------------
// MCTS rollout evaluation
// ---------------------------------------------------------------------------

/**
 * Snapshot → apply action → run mctsN random rollouts → average leaf value → restore.
 * @param {EngineController} engine
 * @param {Action} action
 * @param {number} mctsN
 * @param {number} seed
 * @returns {number}
 */
function _rolloutScore(engine, action, mctsN, seed) {
  const snap = engine.snapshot();
  engine.applyAction(action);

  const rng = mulberry32(seed >>> 0);
  let total = 0;

  for (let r = 0; r < mctsN; r++) {
    const rolloutSnap = engine.snapshot();
    // Re-seed engine RNG for this rollout so results are deterministic per (action, r)
    engine.seed((seed ^ r).toString(16));

    let obs = engine.getObservation();
    let steps = 0;

    while (!obs.done && steps < MAX_ROLLOUT_ACTIONS) {
      if (obs.legalActions.length === 0) break;
      const rolloutAction = RandomBot(obs, rng);
      obs = engine.applyAction(rolloutAction).observation;
      steps++;
    }

    total += _evalObservation(obs);
    EngineController_restore(engine, rolloutSnap);
  }

  EngineController_restore(engine, snap);
  return mctsN > 0 ? total / mctsN : 0;
}

// ---------------------------------------------------------------------------
// Leaf value estimator
// ---------------------------------------------------------------------------

/**
 * Static evaluation of a terminal or mid-game observation.
 * Terminal: player_win=1, enemy_win=0.
 * Non-terminal: interpolates based on enemy HP fraction + player HP margin.
 * @param {Observation} obs
 * @returns {number}
 */
function _evalObservation(obs) {
  if (obs.done) {
    return obs.outcome === 'player_win' ? 1.0 : 0.0;
  }

  const { player, enemy } = obs;
  if (!enemy) return 0.5;

  // Enemy HP fraction (lower = better for player)
  const enemyHpFraction = enemy.hp / Math.max(enemy.maxHp, 1);
  // Player HP fraction (higher = better)
  const playerHpFraction = player.hp / Math.max(player.maxHp, 1);
  // Player survival margin including block
  const playerSurvival = Math.min((player.hp + player.block) / Math.max(player.maxHp, 1), 1);

  // Blend: 50% weight on killing enemy, 50% on player surviving
  return 0.5 * (1 - enemyHpFraction) + 0.5 * playerSurvival * playerHpFraction;
}

// ---------------------------------------------------------------------------
// Snapshot restore helper — mutates engine in-place via static restore
// ---------------------------------------------------------------------------

/**
 * In-place snapshot restore on an existing engine instance.
 * EngineController.restore() is static and returns a new instance, so we
 * copy the restored state's internals back onto the original object.
 * This avoids GC pressure from allocating a new EngineController per node.
 *
 * @param {EngineController} engine
 * @param {import('../../engine/Snapshot.js').SerializedRun} snap
 */
function EngineController_restore(engine, snap) {
  const { restore } = /** @type {{ restore: (s: any) => EngineController }} */ (
    Object.getPrototypeOf(engine).constructor
  );
  const fresh = restore(snap);
  // Shallow-copy all own properties from the fresh instance back onto the live one
  for (const key of Object.keys(fresh)) {
    /** @type {any} */ (engine)[key] = /** @type {any} */ (fresh)[key];
  }
  // Restore Math.random position: rewind the existing rng closure to the snapshotted state.
  // Without this, lookahead applyAction calls consume RNG entropy that isn't replayed.
  if (snap.rngState != null && typeof (/** @type {any} */ (engine)._rng?.setState) === 'function') {
    /** @type {any} */ (engine)._rng.setState(snap.rngState);
    Math.random = /** @type {any} */ (engine)._rng;
  }
}
