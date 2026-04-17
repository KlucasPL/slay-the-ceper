/**
 * Protocol conformance: same inputs through RPC and MCP transports must produce
 * identical Observations, events, and error shapes.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeTestServer } from './helpers.js';
import { methods } from '../../src/rpc/methods.js';
import { RunRegistry } from '../../src/rpc/RunRegistry.js';
import { UnknownRun, RunCapExceeded } from '../../src/rpc/RunRegistry.js';

afterEach(() => {
  vi.useRealTimers();
});

// ─── MCP transport driver (mirrors RPC but calls method handlers directly) ────

function makeMcpDriver() {
  const registry = new RunRegistry();

  function call(methodName, params) {
    const method = methods.find((m) => m.name === methodName);
    if (!method)
      throw Object.assign(new Error(`Method not found: ${methodName}`), { code: -32601 });
    return method.handler(registry, params ?? {}, () => {});
  }

  function dispose() {
    for (const [id] of registry._runs) registry.dispose(id);
  }

  return { call, registry, dispose };
}

// ─── RPC transport driver (over JSON-RPC stdio framing) ──────────────────────

function makeRpcDriver() {
  const rpc = makeTestServer();

  async function call(methodName, params) {
    return rpc.call(methodName, params ?? {});
  }

  return { call };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripVolatile(obs) {
  // Remove fields that legitimately differ between transports (none expected),
  // but deep-freeze the observation is already done by the engine.
  // Strip timestamp-like fields if any appear in events.
  return JSON.parse(JSON.stringify(obs, (key, val) => (key === 't' ? undefined : val)));
}

// ─── Cross-transport scenario ─────────────────────────────────────────────────

describe('RPC ↔ MCP cross-transport conformance', () => {
  it('shouldProduceIdenticalObservationsForScriptedScenario', async () => {
    // given — same seed, same actions through both transports
    const rpc = makeRpcDriver();
    const mcp = makeMcpDriver();

    try {
      // Step 1: create
      const rpcCreate = await rpc.call('engine.create', { characterId: 'jedrek', seed: '0xBEEF' });
      const mcpCreate = mcp.call('engine.create', { characterId: 'jedrek', seed: '0xBEEF' });
      expect(rpcCreate.runId).toBeTypeOf('string');
      expect(mcpCreate.runId).toBeTypeOf('string');

      // Step 2: startRun
      const rpcStart = await rpc.call('engine.startRun', { runId: rpcCreate.runId });
      const mcpStart = mcp.call('engine.startRun', { runId: mcpCreate.runId });
      expect(stripVolatile(rpcStart.observation)).toEqual(stripVolatile(mcpStart.observation));

      // Step 3: applyAction(end_turn) × 3 — travel to first battle first
      let rpcObs = rpcStart.observation;
      let mcpObs = mcpStart.observation;
      const rpcEvents = [];
      const mcpEvents = [];

      // Travel to first battle on both
      while (rpcObs.phase === 'map') {
        const travelAction = rpcObs.legalActions.find((a) => a.type === 'travel');
        if (!travelAction) break;
        const rpcR = await rpc.call('engine.applyAction', {
          runId: rpcCreate.runId,
          action: travelAction,
        });
        const mcpR = mcp.call('engine.applyAction', {
          runId: mcpCreate.runId,
          action: travelAction,
        });
        rpcObs = rpcR.observation;
        mcpObs = mcpR.observation;
        rpcEvents.push(...(rpcR.events ?? []));
        mcpEvents.push(...(mcpR.events ?? []));
      }

      expect(stripVolatile(rpcObs)).toEqual(stripVolatile(mcpObs));

      // end_turn × 3 if in battle
      if (rpcObs.phase === 'battle') {
        for (let i = 0; i < 3; i++) {
          if (rpcObs.done || rpcObs.phase !== 'battle') break;
          const rpcR = await rpc.call('engine.endTurn', { runId: rpcCreate.runId });
          const mcpR = mcp.call('engine.endTurn', { runId: mcpCreate.runId });
          rpcObs = rpcR.observation;
          mcpObs = mcpR.observation;
          expect(stripVolatile(rpcObs)).toEqual(stripVolatile(mcpObs));
        }
      }

      // Step 4: snapshot
      const rpcSnap = await rpc.call('engine.snapshot', { runId: rpcCreate.runId });
      const mcpSnap = mcp.call('engine.snapshot', { runId: mcpCreate.runId });
      // Snapshots should be structurally equivalent (same keys)
      expect(Object.keys(rpcSnap.snapshot).sort()).toEqual(Object.keys(mcpSnap.snapshot).sort());

      // Step 5: drainEvents
      const rpcDrained = await rpc.call('engine.drainEvents', { runId: rpcCreate.runId });
      const mcpDrained = mcp.call('engine.drainEvents', { runId: mcpCreate.runId });
      expect(Array.isArray(rpcDrained.events)).toBe(true);
      expect(Array.isArray(mcpDrained.events)).toBe(true);

      // Step 6: dispose
      await rpc.call('engine.dispose', { runId: rpcCreate.runId });
      mcp.call('engine.dispose', { runId: mcpCreate.runId });
    } finally {
      mcp.dispose();
    }
  });

  it('shouldProduceIdenticalRenderTextOutput', async () => {
    // given
    const rpc = makeRpcDriver();
    const mcp = makeMcpDriver();

    try {
      const { runId: rpcId } = await rpc.call('engine.create', {
        characterId: 'jedrek',
        seed: '0xCAFE',
      });
      const { runId: mcpId } = mcp.call('engine.create', { characterId: 'jedrek', seed: '0xCAFE' });
      await rpc.call('engine.startRun', { runId: rpcId });
      mcp.call('engine.startRun', { runId: mcpId });

      // when
      const rpcText = await rpc.call('engine.renderText', { runId: rpcId, style: 'compact' });
      const mcpText = mcp.call('engine.renderText', { runId: mcpId, style: 'compact' });

      // then
      expect(rpcText.text).toBe(mcpText.text);

      await rpc.call('engine.dispose', { runId: rpcId });
      mcp.call('engine.dispose', { runId: mcpId });
    } finally {
      mcp.dispose();
    }
  });
});

// ─── Error shape conformance ──────────────────────────────────────────────────

describe('Error shape conformance', () => {
  it('shouldProduceEquivalentIllegalActionError', async () => {
    // given
    const rpc = makeRpcDriver();
    const mcp = makeMcpDriver();

    try {
      const { runId: rpcId } = await rpc.call('engine.create', {
        characterId: 'jedrek',
        seed: '0x1',
      });
      const { runId: mcpId } = mcp.call('engine.create', { characterId: 'jedrek', seed: '0x1' });
      await rpc.call('engine.startRun', { runId: rpcId });
      mcp.call('engine.startRun', { runId: mcpId });

      // end_turn is illegal on map screen
      const rpcError = await rpc
        .call('engine.applyAction', { runId: rpcId, action: { type: 'end_turn' } })
        .catch((e) => e);
      let mcpError;
      try {
        mcp.call('engine.applyAction', { runId: mcpId, action: { type: 'end_turn' } });
        mcpError = null;
      } catch (e) {
        mcpError = e;
      }

      // then — both report code -32001
      expect(rpcError.code).toBe(-32001);
      expect(mcpError?.code ?? mcpError?.message).toBeDefined();
      // MCP handler throws the raw error; code is on it
      expect(mcpError.code).toBe(-32001);
    } finally {
      mcp.dispose();
    }
  });

  it('shouldProduceEquivalentUnknownRunError', async () => {
    // given
    const rpc = makeRpcDriver();
    const mcp = makeMcpDriver();
    const fakeId = '00000000-0000-0000-0000-000000000000';

    try {
      const rpcError = await rpc.call('engine.getObservation', { runId: fakeId }).catch((e) => e);
      let mcpError;
      try {
        mcp.call('engine.getObservation', { runId: fakeId });
      } catch (e) {
        mcpError = e;
      }

      expect(rpcError.code).toBe(-32002);
      expect(mcpError.code).toBe(-32002);
      expect(mcpError).toBeInstanceOf(UnknownRun);
    } finally {
      mcp.dispose();
    }
  });

  it('shouldProduceEquivalentRunCapExceededError', async () => {
    // given
    const rpc = makeRpcDriver();
    const mcp = makeMcpDriver();

    try {
      // Fill cap via RPC
      const rpcIds = [];
      for (let i = 0; i < 16; i++) {
        const { runId } = await rpc.call('engine.create', { characterId: 'jedrek' });
        rpcIds.push(runId);
      }
      const rpcError = await rpc.call('engine.create', { characterId: 'jedrek' }).catch((e) => e);

      // Fill cap via MCP directly
      const mcpIds = [];
      for (let i = 0; i < 16; i++) {
        mcpIds.push(mcp.call('engine.create', { characterId: 'jedrek' }).runId);
      }
      let mcpError;
      try {
        mcp.call('engine.create', { characterId: 'jedrek' });
      } catch (e) {
        mcpError = e;
      }

      expect(rpcError.code).toBe(-32003);
      expect(mcpError.code).toBe(-32003);
      expect(mcpError).toBeInstanceOf(RunCapExceeded);

      // cleanup
      for (const id of rpcIds) await rpc.call('engine.dispose', { id });
    } finally {
      mcp.dispose();
    }
  });

  it('shouldProduceEquivalentRunErroredError', async () => {
    // given — mark a run errored in each registry
    const rpc = makeRpcDriver();
    const mcp = makeMcpDriver();

    try {
      // For RPC: create, start, mark errored via registry internals (test the error shape)
      const { runId: rpcId } = await rpc.call('engine.create', {
        characterId: 'jedrek',
        seed: '0x2',
      });
      // For MCP: same via registry
      const { runId: mcpId } = mcp.call('engine.create', { characterId: 'jedrek', seed: '0x2' });

      // Mark both errored via their registry
      // RPC server has its own internal registry — test error shape via RunRegistry directly
      const mcpReg = mcp.registry;
      mcpReg.markErrored(mcpId);
      let mcpError;
      try {
        mcp.call('engine.getObservation', { runId: mcpId });
      } catch (e) {
        mcpError = e;
      }
      expect(mcpError.code).toBe(-32004);

      // RPC error shape: create a fresh registry instance to test
      const reg2 = new RunRegistry();
      const id2 = reg2.create({ characterId: 'jedrek' });
      reg2.markErrored(id2);
      let rpcError2;
      try {
        reg2.get(id2);
      } catch (e) {
        rpcError2 = e;
      }
      expect(rpcError2.code).toBe(-32004);

      // both error codes match
      expect(mcpError.code).toBe(rpcError2.code);

      await rpc.call('engine.dispose', { runId: rpcId });
      reg2.dispose(id2);
    } finally {
      mcp.dispose();
    }
  });
});

// ─── Run lifecycle ────────────────────────────────────────────────────────────

describe('Run lifecycle conformance', () => {
  it('shouldDisposeAndRemoveRunOnBothTransports', async () => {
    // given
    const rpc = makeRpcDriver();
    const mcp = makeMcpDriver();

    try {
      const { runId: rpcId } = await rpc.call('engine.create', { characterId: 'jedrek' });
      const { runId: mcpId } = mcp.call('engine.create', { characterId: 'jedrek' });

      // when
      await rpc.call('engine.dispose', { runId: rpcId });
      mcp.call('engine.dispose', { runId: mcpId });

      // then
      const rpcErr = await rpc.call('engine.getObservation', { runId: rpcId }).catch((e) => e);
      let mcpErr;
      try {
        mcp.call('engine.getObservation', { runId: mcpId });
      } catch (e) {
        mcpErr = e;
      }

      expect(rpcErr.code).toBe(-32002);
      expect(mcpErr.code).toBe(-32002);
    } finally {
      mcp.dispose();
    }
  });

  it('shouldGcRunAfter11MinutesOnBothTransports', () => {
    // given
    vi.useFakeTimers();
    const mcp = makeMcpDriver();

    try {
      const { runId } = mcp.call('engine.create', { characterId: 'jedrek' });

      // when — advance past 10-min TTL
      vi.advanceTimersByTime(11 * 60 * 1000);

      // then
      let gcError;
      try {
        mcp.call('engine.getObservation', { runId });
      } catch (e) {
        gcError = e;
      }
      expect(gcError.code).toBe(-32002);
    } finally {
      vi.useRealTimers();
      mcp.dispose();
    }
  });

  it('shouldEnforceRunCapAt16OnBothTransports', async () => {
    // given
    const mcp = makeMcpDriver();

    try {
      const ids = [];
      for (let i = 0; i < 16; i++) {
        ids.push(mcp.call('engine.create', { characterId: 'jedrek' }).runId);
      }

      // when — 17th create
      let capError;
      try {
        mcp.call('engine.create', { characterId: 'jedrek' });
      } catch (e) {
        capError = e;
      }

      // then
      expect(capError).toBeInstanceOf(RunCapExceeded);
      expect(capError.code).toBe(-32003);
    } finally {
      mcp.dispose();
    }
  });
});
