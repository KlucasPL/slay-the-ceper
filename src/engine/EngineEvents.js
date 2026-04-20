/**
 * @typedef {'run_started'|'run_ended'|'map_generated'|'node_entered'|'weather_entered'|
 *   'battle_started'|'battle_ended'|'phase_transition'|'turn_started'|'turn_ended'|
 *   'card_drawn'|'card_played'|'card_skipped'|'card_exhausted'|'enemy_move'|
 *   'status_applied'|'shop_opened'|'shop_purchase'|'event_entered'|'event_resolved'|
 *   'reward_offered'|'reward_picked'|'campfire_choice'|'relic_gained'|'boon_offered'|
 *   'boon_picked'|'deck_mutation'} EngineEventKind
 *
 * @typedef {{ kind: string, id: string }} EntityRef
 *
 * @typedef {{
 *   seq: number,
 *   t: number,
 *   kind: EngineEventKind,
 *   turn: number,
 *   floor: number,
 *   act: number,
 *   payload: Record<string, unknown>,
 * }} EngineEvent
 */

/**
 * Create a fresh event buffer to be stored on GameState.
 * @returns {{ buffer: EngineEvent[], seq: number }}
 */
export function createEventBuffer() {
  return { buffer: [], seq: 0 };
}

/**
 * Emit one engine event into the buffer.
 * @param {{ _engineEvents: { buffer: EngineEvent[], seq: number }, battleTurnsElapsed: number, currentLevel: number, currentAct: number }} state
 * @param {EngineEventKind} kind
 * @param {Record<string, unknown>} payload
 */
export function emit(state, kind, payload) {
  const eb = state._engineEvents;
  const event = {
    seq: eb.seq++,
    t: Date.now(),
    kind,
    turn: state.battleTurnsElapsed ?? 0,
    floor: (state.currentLevel ?? 0) + 1,
    act: state.currentAct ?? 1,
    payload,
  };
  eb.buffer.push(event);
}

/**
 * Drain all buffered events, clearing the buffer.
 * @param {{ _engineEvents: { buffer: EngineEvent[], seq: number } }} state
 * @returns {EngineEvent[]}
 */
export function drain(state) {
  const events = state._engineEvents.buffer;
  state._engineEvents.buffer = [];
  return events;
}
