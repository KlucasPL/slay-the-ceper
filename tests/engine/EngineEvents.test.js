import { describe, it, expect } from 'vitest';
import { createEventBuffer, emit, drain } from '../../src/engine/EngineEvents.js';

function makeState() {
  return {
    _engineEvents: createEventBuffer(),
    battleTurnsElapsed: 2,
    currentLevel: 3,
    currentAct: 1,
  };
}

describe('EngineEvents', () => {
  it('shouldEmitEventWithCorrectEnvelope', () => {
    // given
    const state = makeState();
    // when
    emit(state, 'card_played', { card: { kind: 'card', id: 'ciupaga' } });
    const [ev] = drain(state);
    // then
    expect(ev.kind).toBe('card_played');
    expect(ev.seq).toBe(0);
    expect(ev.turn).toBe(2);
    expect(ev.floor).toBe(4);
    expect(ev.act).toBe(1);
    expect(ev.payload.card).toEqual({ kind: 'card', id: 'ciupaga' });
  });

  it('shouldIncrementSeqMonotonically', () => {
    // given
    const state = makeState();
    // when
    emit(state, 'run_started', {});
    emit(state, 'battle_started', {});
    emit(state, 'card_played', {});
    const events = drain(state);
    // then
    expect(events.map((e) => e.seq)).toEqual([0, 1, 2]);
  });

  it('shouldDrainAndClearBuffer', () => {
    // given
    const state = makeState();
    emit(state, 'run_started', {});
    // when
    const first = drain(state);
    const second = drain(state);
    // then
    expect(first.length).toBe(1);
    expect(second.length).toBe(0);
  });

  it('shouldContinueSeqAfterDrain', () => {
    // given
    const state = makeState();
    emit(state, 'run_started', {});
    drain(state);
    // when
    emit(state, 'battle_started', {});
    const [ev] = drain(state);
    // then
    expect(ev.seq).toBe(1);
  });
});
