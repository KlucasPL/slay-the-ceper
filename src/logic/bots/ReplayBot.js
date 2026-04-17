/**
 * @typedef {import('../../engine/Observation.js').Observation} Observation
 * @typedef {import('../../engine/ActionDispatcher.js').Action} Action
 *
 * @typedef {{
 *   step: number,
 *   phase: string,
 *   floor: number,
 *   turn: number,
 *   action: Action,
 * }} TraceEntry
 */

/**
 * Error thrown when a replay trace desynchronises from the live game state.
 */
export class ReplayDesyncError extends Error {
  /**
   * @param {string} message
   * @param {{ step: number, expected: Action, legalActions: Action[] }} detail
   */
  constructor(message, detail) {
    super(message);
    this.name = 'ReplayDesyncError';
    this.detail = detail;
  }
}

/**
 * Create a stateful bot that replays a recorded agentTrace[].
 *
 * Returns a bot function `(observation) => Action` that steps through the
 * trace sequentially, validating each action is present in legalActions before
 * returning it. Throws ReplayDesyncError on mismatch or trace exhaustion.
 *
 * @param {TraceEntry[]} trace - agentTrace[] from a full-verbosity JSONL record
 * @returns {(observation: Observation) => Action}
 */
export function makeReplayBot(trace) {
  if (!Array.isArray(trace) || trace.length === 0) {
    throw new Error('ReplayBot: trace must be a non-empty array');
  }

  let cursor = 0;

  return function replayBot(observation) {
    if (cursor >= trace.length) {
      throw new ReplayDesyncError(
        `ReplayBot: trace exhausted at step ${cursor} but game is not done`,
        { step: cursor, expected: null, legalActions: observation.legalActions }
      );
    }

    const entry = trace[cursor];
    const action = entry.action;

    // Validate the recorded action appears in the current legal set
    const isLegal = observation.legalActions.some((a) => _actionsEqual(a, action));
    if (!isLegal) {
      throw new ReplayDesyncError(
        `ReplayBot: desync at step ${cursor} — recorded action ${JSON.stringify(action)} is not legal. Phase: ${observation.phase}, floor: ${observation.floor}, turn: ${observation.turn}`,
        { step: cursor, expected: action, legalActions: observation.legalActions }
      );
    }

    cursor++;
    return action;
  };
}

/**
 * Deep equality for Action objects (all action types are flat or one-level deep).
 * @param {Action} a
 * @param {Action} b
 * @returns {boolean}
 */
function _actionsEqual(a, b) {
  if (a.type !== b.type) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}
