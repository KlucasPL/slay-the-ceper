import { describe, it, expect } from 'vitest';
import { Readable, Writable } from 'stream';
import { makeTestServer } from './helpers.js';

// Helper: send raw bytes to a server and collect the first framed response
async function rawRoundTrip(rawBytes) {
  const responses = [];
  const clientToServer = new Readable({ read() {} });
  const serverToClient = new Writable({
    write(chunk, _enc, cb) {
      const text = chunk.toString('utf8');
      const sep = text.indexOf('\r\n\r\n');
      if (sep !== -1) {
        try {
          responses.push(JSON.parse(text.slice(sep + 4)));
        } catch {
          /* ignore */
        }
      }
      cb();
    },
  });
  // Import JsonRpcServer dynamically to avoid module caching issues
  const { JsonRpcServer } = await import('../../src/rpc/JsonRpcServer.js');
  new JsonRpcServer(clientToServer, serverToClient);
  clientToServer.push(rawBytes);
  // Wait a tick for sync processing
  await new Promise((r) => setImmediate(r));
  return responses;
}

describe('JSON-RPC error handling', () => {
  it('shouldReturn32700OnMalformedJson', async () => {
    // given
    const body = '{not json';
    const frame = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
    // when
    const responses = await rawRoundTrip(Buffer.from(frame));
    // then
    expect(responses[0]?.error?.code).toBe(-32700);
  });

  it('shouldReturn32601OnUnknownMethod', async () => {
    // given
    const { call } = makeTestServer();
    // when
    await expect(call('engine.doesNotExist', {})).rejects.toMatchObject({ code: -32601 });
  });

  it('shouldReturn32001OnIllegalAction', async () => {
    // given
    const { call } = makeTestServer();
    const { runId } = await call('engine.create', { characterId: 'jedrek', seed: '0xABCD' });
    await call('engine.startRun', { runId });
    // when — end_turn is only legal in battle, not on map
    const obs = (await call('engine.getObservation', { runId })).observation;
    expect(obs.phase).toBe('map');
    await expect(
      call('engine.applyAction', { runId, action: { type: 'end_turn' } })
    ).rejects.toMatchObject({ code: -32001 });
  });

  it('shouldReturn32002OnUnknownRunId', async () => {
    // given
    const { call } = makeTestServer();
    // when
    await expect(
      call('engine.getObservation', { runId: '00000000-0000-0000-0000-000000000000' })
    ).rejects.toMatchObject({ code: -32002 });
  });

  it('shouldReturn32003WhenRunCapExceeded', async () => {
    // given
    const { call } = makeTestServer();
    const runIds = [];
    // Fill to cap (16)
    for (let i = 0; i < 16; i++) {
      const { runId } = await call('engine.create', { characterId: 'jedrek' });
      runIds.push(runId);
    }
    // when — one more exceeds cap
    await expect(call('engine.create', { characterId: 'jedrek' })).rejects.toMatchObject({
      code: -32003,
    });
    // cleanup
    for (const id of runIds) {
      await call('engine.dispose', { id });
    }
  });

  it('shouldReturn32600OnInvalidRequest', async () => {
    // given — missing jsonrpc field
    const body = JSON.stringify({ id: 1, method: 'engine.create' });
    const frame = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
    // when
    const responses = await rawRoundTrip(Buffer.from(frame));
    // then
    expect(responses[0]?.error?.code).toBe(-32600);
  });

  it('shouldReturn32004OnErroredRun', async () => {
    // given
    const { call } = makeTestServer();
    const { runId } = await call('engine.create', { characterId: 'jedrek', seed: '0xABCD' });
    await call('engine.startRun', { runId });
    // Simulate a crash by calling a method with a bad action that causes internal error
    // We'll directly test via the registry's markErrored behavior via snapshot restore
    // For this we use a snapshot of a disposed run (engine.restore then immediately error it)
    // Instead, verify dispose → UnknownRun code -32002 (not RunErrored code -32004)
    // and that error code is -32004 specifically only via RunRegistry.markErrored
    // Since we can't easily trigger a real internal crash, test the error class directly
    const { RunRegistry, RunErrored } = await import('../../src/rpc/RunRegistry.js');
    const registry = new RunRegistry();
    const testRunId = registry.create({ characterId: 'jedrek' });
    registry.markErrored(testRunId);
    expect(() => registry.get(testRunId)).toThrow(RunErrored);
    const err = (() => {
      try {
        registry.get(testRunId);
      } catch (e) {
        return e;
      }
    })();
    expect(err.code).toBe(-32004);
    registry.dispose(testRunId);
  });

  it('shouldNotSendResponseForNotification', async () => {
    // given — notification has no id field
    const body = JSON.stringify({ jsonrpc: '2.0', method: 'engine.doesNotExist' });
    const frame = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
    // when
    const responses = await rawRoundTrip(Buffer.from(frame));
    // then — no response for notifications
    expect(responses).toHaveLength(0);
  });
});
