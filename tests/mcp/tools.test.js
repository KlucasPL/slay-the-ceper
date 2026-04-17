import { describe, it, expect } from 'vitest';
import { methods } from '../../src/rpc/methods.js';
import { getToolDescriptors } from '../../src/mcp/tools.js';
import { RunRegistry } from '../../src/rpc/RunRegistry.js';
import { createMcpServer } from '../../src/mcp/McpServer.js';

// ─── Drift check ─────────────────────────────────────────────────────────────

describe('MCP ↔ RPC surface drift check', () => {
  it('shouldHaveOneToolPerRpcMethod', () => {
    // given
    const rpcMethodNames = methods.map((m) => m.name);
    const toolDescriptors = getToolDescriptors();
    const toolRpcMethods = toolDescriptors.map((t) => t.rpcMethod);
    // then — every RPC method has exactly one MCP tool
    expect(toolRpcMethods.sort()).toEqual(rpcMethodNames.sort());
  });

  it('shouldDeriveToolNameByStrippingEnginePrefix', () => {
    // given
    const descriptors = getToolDescriptors();
    // then
    for (const { name, rpcMethod } of descriptors) {
      expect(rpcMethod).toBe(`engine.${name}`);
    }
  });

  it('shouldHaveExactly14Tools', () => {
    // given
    const descriptors = getToolDescriptors();
    // then
    expect(descriptors).toHaveLength(14);
  });

  it('shouldIncludeAllExpectedToolNames', () => {
    // given
    const names = getToolDescriptors().map((t) => t.name);
    // then
    const expected = [
      'create',
      'startRun',
      'getObservation',
      'getLegalActions',
      'applyAction',
      'endTurn',
      'snapshot',
      'restore',
      'drainEvents',
      'getRunSummary',
      'seed',
      'renderText',
      'subscribe',
      'dispose',
    ];
    for (const name of expected) {
      expect(names).toContain(name);
    }
  });
});

// ─── Tool call round-trips ────────────────────────────────────────────────────

describe('MCP tool call round-trips', () => {
  function makeRegistry() {
    return new RunRegistry();
  }

  it('shouldCreateRunViaTool', () => {
    // given — createMcpServer wires registry + tools together end-to-end
    const { registry } = createMcpServer();
    const createMethod = methods.find((m) => m.name === 'engine.create');
    // when
    const result = createMethod.handler(
      registry,
      { characterId: 'jedrek', seed: '0xABCD' },
      () => {}
    );
    // then
    expect(result.runId).toBeTypeOf('string');
    registry.dispose(result.runId);
  });

  it('shouldStartRunAndReturnObservation', () => {
    // given
    const registry = makeRegistry();
    const createFn = methods.find((m) => m.name === 'engine.create').handler;
    const startFn = methods.find((m) => m.name === 'engine.startRun').handler;
    const { runId } = createFn(registry, { characterId: 'jedrek', seed: '0xABCD' }, () => {});
    // when
    const result = startFn(registry, { runId }, () => {});
    // then
    expect(result.observation).toBeDefined();
    expect(result.observation.phase).toBe('map');
    registry.dispose(runId);
  });

  it('shouldRenderTextViaTool', () => {
    // given
    const registry = makeRegistry();
    const { runId } = methods
      .find((m) => m.name === 'engine.create')
      .handler(registry, { characterId: 'jedrek', seed: '0xABCD' }, () => {});
    methods.find((m) => m.name === 'engine.startRun').handler(registry, { runId }, () => {});
    // when
    const result = methods
      .find((m) => m.name === 'engine.renderText')
      .handler(registry, { runId, style: 'en' }, () => {});
    // then
    expect(result.text).toContain('## MAP');
    registry.dispose(runId);
  });

  it('shouldReturnIsErrorOnIllegalAction', () => {
    // given — the tools.js handler catches errors and returns isError
    const registry = makeRegistry();
    const { runId } = methods
      .find((m) => m.name === 'engine.create')
      .handler(registry, { characterId: 'jedrek', seed: '0xABCD' }, () => {});
    methods.find((m) => m.name === 'engine.startRun').handler(registry, { runId }, () => {});

    // Simulate what tools.js does: catch error → isError: true
    const applyMethod = methods.find((m) => m.name === 'engine.applyAction');
    let isError = false;
    try {
      applyMethod.handler(registry, { runId, action: { type: 'end_turn' } }, () => {});
    } catch {
      isError = true;
    }
    // then — handler should throw (wrapped to isError by tool wrapper)
    expect(isError).toBe(true);
    registry.dispose(runId);
  });
});
