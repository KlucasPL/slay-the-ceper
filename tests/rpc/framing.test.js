import { describe, it, expect } from 'vitest';
import { Readable, Writable } from 'stream';
import { attachFramedReader, writeFramed } from '../../src/rpc/JsonRpcServer.js';

function makeReadable(chunks) {
  const r = new Readable({ read() {} });
  for (const chunk of chunks) r.push(chunk);
  r.push(null);
  return r;
}

describe('Content-Length framing', () => {
  it('shouldParseCompleteFrame', async () => {
    // given
    const msg = { jsonrpc: '2.0', id: 1, method: 'ping' };
    const body = JSON.stringify(msg);
    const frame = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
    const readable = makeReadable([Buffer.from(frame)]);
    // when
    const received = [];
    await new Promise((resolve) => {
      attachFramedReader(readable, (m) => received.push(m));
      readable.on('end', resolve);
    });
    // then
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(msg);
  });

  it('shouldParseMultipleFramesInOneChunk', async () => {
    // given
    const msgs = [
      { jsonrpc: '2.0', id: 1, method: 'a' },
      { jsonrpc: '2.0', id: 2, method: 'b' },
    ];
    const combined = msgs
      .map((m) => {
        const body = JSON.stringify(m);
        return `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
      })
      .join('');
    const readable = makeReadable([Buffer.from(combined)]);
    // when
    const received = [];
    await new Promise((resolve) => {
      attachFramedReader(readable, (m) => received.push(m));
      readable.on('end', resolve);
    });
    // then
    expect(received).toHaveLength(2);
    expect(received[0]).toEqual(msgs[0]);
    expect(received[1]).toEqual(msgs[1]);
  });

  it('shouldParseFrameSplitAcrossChunks', async () => {
    // given
    const msg = { jsonrpc: '2.0', id: 3, method: 'split' };
    const body = JSON.stringify(msg);
    const frame = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
    const mid = Math.floor(frame.length / 2);
    const readable = makeReadable([
      Buffer.from(frame.slice(0, mid)),
      Buffer.from(frame.slice(mid)),
    ]);
    // when
    const received = [];
    await new Promise((resolve) => {
      attachFramedReader(readable, (m) => received.push(m));
      readable.on('end', resolve);
    });
    // then
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(msg);
  });

  it('shouldMarkMalformedJsonAsParseError', async () => {
    // given
    const body = '{not valid json';
    const frame = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
    const readable = makeReadable([Buffer.from(frame)]);
    // when
    const received = [];
    await new Promise((resolve) => {
      attachFramedReader(readable, (m) => received.push(m));
      readable.on('end', resolve);
    });
    // then
    expect(received).toHaveLength(1);
    expect(received[0]._parseError).toBe(true);
  });

  it('shouldWriteFramedMessage', () => {
    // given
    const parts = [];
    const writable = new Writable({
      write(chunk, _enc, cb) {
        parts.push(chunk);
        cb();
      },
    });
    const msg = { jsonrpc: '2.0', id: 1, result: {} };
    // when
    writeFramed(writable, msg);
    // then
    const written = Buffer.concat(parts).toString('utf8');
    const body = JSON.stringify(msg);
    expect(written).toBe(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
  });
});
