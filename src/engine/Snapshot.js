import { GameState } from '../state/GameState.js';
import { enemyLibrary } from '../data/enemies.js';
import { characters } from '../data/characters.js';
import { createEventBuffer } from './EngineEvents.js';

/**
 * @typedef {{
 *   schemaVersion: 2,
 *   engineEventsSeq: number,
 *   rngState: number | null,
 *   characterId: string,
 *   difficulty: 'normal' | 'hard',
 *   state: string,
 * }} SerializedRun
 */

/**
 * Serialize game state to a plain object. Includes RNG + event buffer.
 * The serialized form is JSON-safe (no functions, no circular refs).
 * @param {import('../state/GameState.js').GameState} state
 * @returns {SerializedRun}
 */
export function serialize(state) {
  const snap = _extractSerializableState(state);
  return {
    schemaVersion: 2,
    engineEventsSeq: state._engineEvents?.seq ?? 0,
    rngState: null, // Math.random-swap model: RNG state not capturable; determinism via seed replay
    characterId: state.baseCharacter?.id ?? 'jedrek',
    difficulty: state.difficulty,
    state: JSON.stringify(snap),
  };
}

/**
 * Restore a GameState from a SerializedRun snapshot.
 * Returns a fully reconstructed GameState; event buffer seq is restored.
 * @param {SerializedRun} snap
 * @returns {import('../state/GameState.js').GameState}
 */
export function restore(snap) {
  if (snap.schemaVersion !== 2) {
    throw new Error(`Unsupported snapshot schemaVersion: ${snap.schemaVersion}`);
  }

  const raw = JSON.parse(snap.state);
  const character = characters[snap.characterId] ?? characters.jedrek;

  // Pick a placeholder enemy (we restore enemy state fully from raw)
  const placeholderEnemy = enemyLibrary[raw.enemy?.id] ?? Object.values(enemyLibrary)[0];

  const state = new GameState(character, placeholderEnemy);

  // Restore all scalar + array fields
  _applySerializableState(state, raw);

  // Restore event buffer seq (buffer itself stays empty on restore)
  if (!state._engineEvents) state._engineEvents = createEventBuffer();
  state._engineEvents.seq = snap.engineEventsSeq;
  state._engineEvents.buffer = [];

  return state;
}

/**
 * Extract a plain-object representation of all serializable state.
 * Functions (card effects, etc.) are not serialized — they are reconstructed from
 * data libraries on restore.
 * @param {import('../state/GameState.js').GameState} state
 * @returns {Record<string, unknown>}
 */
function _extractSerializableState(state) {
  // Collect all own enumerable fields, skipping functions and known non-serializable refs
  const skip = new Set(['_engineEvents']);
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const key of Object.keys(state)) {
    if (skip.has(key)) continue;
    const val = /** @type {any} */ (state)[key];
    if (typeof val === 'function') continue;
    out[key] = _deepClone(val);
  }
  return out;
}

/**
 * Apply a plain-object snapshot back onto a GameState instance.
 * @param {import('../state/GameState.js').GameState} state
 * @param {Record<string, unknown>} raw
 */
function _applySerializableState(state, raw) {
  for (const key of Object.keys(raw)) {
    const val = raw[key];
    if (val !== null && typeof val === 'object') {
      /** @type {any} */ (state)[key] = _deepClone(val);
    } else {
      /** @type {any} */ (state)[key] = val;
    }
  }
}

/**
 * Deep-clone a JSON-safe value (no functions, no circular refs).
 * @param {unknown} val
 * @returns {unknown}
 */
function _deepClone(val) {
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(_deepClone);
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const k of Object.keys(val)) {
    out[k] = _deepClone(/** @type {any} */ (val)[k]);
  }
  return out;
}
