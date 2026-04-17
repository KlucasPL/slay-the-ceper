import { describe, it, expect } from 'vitest';
import { makeTestServer } from './helpers.js';

describe('JSON-RPC method round-trip', () => {
  it('shouldCreateRunAndReturnRunId', async () => {
    // given
    const { call } = makeTestServer();
    // when
    const result = await call('engine.create', { characterId: 'jedrek', seed: '0xABCD' });
    // then
    expect(result.runId).toBeTypeOf('string');
    expect(result.runId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('shouldStartRunAndReturnObservation', async () => {
    // given
    const { call } = makeTestServer();
    const { runId } = await call('engine.create', { characterId: 'jedrek', seed: '0xABCD' });
    // when
    const result = await call('engine.startRun', { runId });
    // then
    expect(result.observation).toBeDefined();
    expect(result.observation.phase).toBe('map');
    expect(result.observation.player).toBeDefined();
  });

  it('shouldGetObservationWithoutAdvancingState', async () => {
    // given
    const { call } = makeTestServer();
    const { runId } = await call('engine.create', { characterId: 'jedrek', seed: '0xABCD' });
    await call('engine.startRun', { runId });
    // when
    const a = await call('engine.getObservation', { runId });
    const b = await call('engine.getObservation', { runId });
    // then
    expect(a.observation.player.hp).toBe(b.observation.player.hp);
    expect(a.observation.phase).toBe(b.observation.phase);
  });

  it('shouldGetLegalActionsMatchingObservation', async () => {
    // given
    const { call } = makeTestServer();
    const { runId } = await call('engine.create', { characterId: 'jedrek', seed: '0xABCD' });
    await call('engine.startRun', { runId });
    // when
    const obsResult = await call('engine.getObservation', { runId });
    const actResult = await call('engine.getLegalActions', { runId });
    // then
    expect(actResult.legalActions).toEqual(obsResult.observation.legalActions);
  });

  it('shouldApplyActionAndReturnNewObservation', async () => {
    // given
    const { call } = makeTestServer();
    const { runId } = await call('engine.create', { characterId: 'jedrek', seed: '0xABCD' });
    await call('engine.startRun', { runId });
    const obsResult = await call('engine.getObservation', { runId });
    const travelAction = obsResult.observation.legalActions.find((a) => a.type === 'travel');
    // when
    const result = await call('engine.applyAction', { runId, action: travelAction });
    // then
    expect(result.observation).toBeDefined();
    expect(result.done).toBe(false);
  });

  it('shouldEndTurnViaConvenienceMethod', async () => {
    // given
    const { call } = makeTestServer();
    const { runId } = await call('engine.create', { characterId: 'jedrek', seed: '0xABCD' });
    await call('engine.startRun', { runId });
    // travel to first battle
    let obs = (await call('engine.getObservation', { runId })).observation;
    while (obs.phase === 'map') {
      const travel = obs.legalActions.find((a) => a.type === 'travel');
      if (!travel) break;
      const r = await call('engine.applyAction', { runId, action: travel });
      obs = r.observation;
    }
    // when — end turn from battle
    const result = await call('engine.endTurn', { runId });
    // then
    expect(result.observation).toBeDefined();
  });

  it('shouldDrainEventsAndClearBuffer', async () => {
    // given
    const { call } = makeTestServer();
    const { runId } = await call('engine.create', { characterId: 'jedrek', seed: '0xABCD' });
    await call('engine.startRun', { runId });
    // when
    const first = await call('engine.drainEvents', { runId });
    const second = await call('engine.drainEvents', { runId });
    // then
    expect(Array.isArray(first.events)).toBe(true);
    expect(second.events).toHaveLength(0);
  });

  it('shouldReturnNullSummaryBeforeTerminal', async () => {
    // given
    const { call } = makeTestServer();
    const { runId } = await call('engine.create', { characterId: 'jedrek', seed: '0xABCD' });
    await call('engine.startRun', { runId });
    // when
    const result = await call('engine.getRunSummary', { runId });
    // then
    expect(result.summary).toBeNull();
  });

  it('shouldSnapshotAndRestoreRun', async () => {
    // given
    const { call } = makeTestServer();
    const { runId } = await call('engine.create', { characterId: 'jedrek', seed: '0xABCD' });
    await call('engine.startRun', { runId });
    const obsBefore = (await call('engine.getObservation', { runId })).observation;
    // when
    const snapResult = await call('engine.snapshot', { runId });
    const restoreResult = await call('engine.restore', { snapshot: snapResult.snapshot });
    const obsAfter = (await call('engine.getObservation', { runId: restoreResult.runId }))
      .observation;
    // then
    expect(restoreResult.runId).toBeTypeOf('string');
    expect(restoreResult.runId).not.toBe(runId);
    expect(obsAfter.player.hp).toBe(obsBefore.player.hp);
    expect(obsAfter.phase).toBe(obsBefore.phase);
    // cleanup
    await call('engine.dispose', { runId: restoreResult.runId });
  });

  it('shouldReSeedRng', async () => {
    // given
    const { call } = makeTestServer();
    const { runId } = await call('engine.create', { characterId: 'jedrek', seed: '0xABCD' });
    await call('engine.startRun', { runId });
    // when / then — should not throw
    const result = await call('engine.seed', { runId, hex: '0xDEAD' });
    expect(result).toEqual({});
  });

  it('shouldRenderTextForAllStyles', async () => {
    // given
    const { call } = makeTestServer();
    const { runId } = await call('engine.create', { characterId: 'jedrek', seed: '0xABCD' });
    await call('engine.startRun', { runId });
    // when
    const pl = await call('engine.renderText', { runId, style: 'pl' });
    const en = await call('engine.renderText', { runId, style: 'en' });
    const compact = await call('engine.renderText', { runId, style: 'compact' });
    // then
    expect(pl.text).toContain('## MAPA');
    expect(en.text).toContain('## MAP');
    expect(compact.text).toContain('## MAP');
  });

  it('shouldDisposeRun', async () => {
    // given
    const { call } = makeTestServer();
    const { runId } = await call('engine.create', { characterId: 'jedrek', seed: '0xABCD' });
    await call('engine.startRun', { runId });
    // when
    await call('engine.dispose', { runId });
    // then — subsequent call should return UnknownRun error
    await expect(call('engine.getObservation', { runId })).rejects.toMatchObject({ code: -32002 });
  });
});
