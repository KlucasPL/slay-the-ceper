import { describe, it, expect, vi, afterEach } from 'vitest';
import { RunRegistry, UnknownRun, RunCapExceeded, RunErrored } from '../../src/rpc/RunRegistry.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('RunRegistry', () => {
  it('shouldCreateRunAndReturnUuid', () => {
    // given
    const registry = new RunRegistry();
    // when
    const runId = registry.create({ characterId: 'jedrek' });
    // then
    expect(runId).toMatch(/^[0-9a-f-]{36}$/);
    registry.dispose(runId);
  });

  it('shouldGetRunEntry', () => {
    // given
    const registry = new RunRegistry();
    const runId = registry.create({ characterId: 'jedrek' });
    // when
    const entry = registry.get(runId);
    // then
    expect(entry.engine).toBeDefined();
    expect(entry.errored).toBe(false);
    registry.dispose(runId);
  });

  it('shouldThrowUnknownRunForMissingId', () => {
    // given
    const registry = new RunRegistry();
    // when / then
    expect(() => registry.get('00000000-0000-0000-0000-000000000000')).toThrow(UnknownRun);
  });

  it('shouldThrowRunCapExceededAt16', () => {
    // given
    const registry = new RunRegistry();
    const ids = [];
    for (let i = 0; i < 16; i++) {
      ids.push(registry.create({ characterId: 'jedrek' }));
    }
    // when / then
    expect(() => registry.create({ characterId: 'jedrek' })).toThrow(RunCapExceeded);
    // cleanup
    for (const id of ids) registry.dispose(id);
  });

  it('shouldMarkRunAsErrored', () => {
    // given
    const registry = new RunRegistry();
    const runId = registry.create({ characterId: 'jedrek' });
    // when
    registry.markErrored(runId);
    // then
    expect(() => registry.get(runId)).toThrow(RunErrored);
    registry.dispose(runId);
  });

  it('shouldDisposeRunAndRemoveIt', () => {
    // given
    const registry = new RunRegistry();
    const runId = registry.create({ characterId: 'jedrek' });
    // when
    registry.dispose(runId);
    // then
    expect(() => registry.get(runId)).toThrow(UnknownRun);
  });

  it('shouldGcRunAfterIdleTimeout', () => {
    // given
    vi.useFakeTimers();
    const registry = new RunRegistry();
    const runId = registry.create({ characterId: 'jedrek' });
    // when — advance time past 10 minute TTL
    vi.advanceTimersByTime(11 * 60 * 1000);
    // then — run should be gone
    expect(() => registry.get(runId)).toThrow(UnknownRun);
  });

  it('shouldResetGcTimerOnTouch', () => {
    // given
    vi.useFakeTimers();
    const registry = new RunRegistry();
    const runId = registry.create({ characterId: 'jedrek' });
    // when — touch at 9 min (before TTL), then advance another 9 min
    vi.advanceTimersByTime(9 * 60 * 1000);
    registry.get(runId); // touches the entry
    vi.advanceTimersByTime(9 * 60 * 1000); // total 18 min but only 9 since last touch
    // then — still alive
    expect(registry.get(runId)).toBeDefined();
    registry.dispose(runId);
  });

  it('shouldAllowNewRunAfterDispose', () => {
    // given
    const registry = new RunRegistry();
    const ids = [];
    for (let i = 0; i < 16; i++) ids.push(registry.create({ characterId: 'jedrek' }));
    registry.dispose(ids[0]);
    // when — now one slot is free
    const newId = registry.create({ characterId: 'jedrek' });
    // then
    expect(newId).toBeTypeOf('string');
    for (const id of ids.slice(1)) registry.dispose(id);
    registry.dispose(newId);
  });

  it('shouldDeliverEventsToSubscribers', () => {
    // given
    const registry = new RunRegistry();
    const runId = registry.create({ characterId: 'jedrek' });
    const entry = registry.get(runId);
    entry.engine.startRun();
    const received = [];
    registry.subscribe(runId, (events) => received.push(...events));
    // when
    registry.pushEvents(runId);
    // then — startRun generates events, pushEvents drains and delivers them
    expect(received.length).toBeGreaterThan(0);
    registry.dispose(runId);
  });

  it('shouldNotDeliverToDisposedSubscriberSet', () => {
    // given
    const registry = new RunRegistry();
    const runId = registry.create({ characterId: 'jedrek' });
    registry.dispose(runId);
    // when / then — pushEvents on unknown run is a no-op
    expect(() => registry.pushEvents(runId)).not.toThrow();
  });
});
