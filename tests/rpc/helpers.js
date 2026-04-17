import { Readable, Writable } from 'stream';
import { JsonRpcServer } from '../../src/rpc/JsonRpcServer.js';

/**
 * Create a test harness for JsonRpcServer.
 * `call(method, params)` sends a request and resolves when a response matching the id arrives.
 * `notifications` collects all server-push messages (no id).
 */
export function makeTestServer() {
  let _idCounter = 1;
  const _pendingCalls = new Map(); // id → { resolve, reject }
  const notifications = [];

  // Server reads from clientToServer, writes to serverToClient
  const clientToServer = new Readable({ read() {} });
  const serverToClient = new Writable({
    write(chunk, _enc, cb) {
      // Parse Content-Length frame inline
      const text = chunk.toString('utf8');
      const sep = text.indexOf('\r\n\r\n');
      if (sep === -1) {
        cb();
        return;
      }
      const body = text.slice(sep + 4);
      let msg;
      try {
        msg = JSON.parse(body);
      } catch {
        cb();
        return;
      }

      if (msg.id !== undefined && msg.id !== null) {
        const pending = _pendingCalls.get(msg.id);
        if (pending) {
          _pendingCalls.delete(msg.id);
          if (msg.error) {
            pending.reject(
              Object.assign(new Error(msg.error.message), {
                code: msg.error.code,
                data: msg.error.data,
              })
            );
          } else {
            pending.resolve(msg.result);
          }
        }
      } else {
        notifications.push(msg);
      }
      cb();
    },
  });

  new JsonRpcServer(clientToServer, serverToClient);

  /**
   * @param {string} method
   * @param {object} [params]
   * @returns {Promise<any>}
   */
  function call(method, params) {
    const id = _idCounter++;
    return new Promise((resolve, reject) => {
      _pendingCalls.set(id, { resolve, reject });
      const body = JSON.stringify({ jsonrpc: '2.0', id, method, params: params ?? {} });
      const frame = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
      clientToServer.push(frame);
    });
  }

  /**
   * Send a notification (no id, no response expected).
   * @param {string} method
   * @param {object} [params]
   */
  function notify(method, params) {
    const body = JSON.stringify({ jsonrpc: '2.0', method, params: params ?? {} });
    const frame = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
    clientToServer.push(frame);
  }

  return { call, notify, notifications };
}
