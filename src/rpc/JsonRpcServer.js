import { methodMap } from './methods.js';
import { RunRegistry, UnknownRun, RunCapExceeded, RunErrored } from './RunRegistry.js';
import { IllegalActionError } from '../engine/LegalActions.js';

const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const MAX_MESSAGE_BYTES = 10 * 1024 * 1024;

/**
 * Parse Content-Length framed JSON-RPC messages from a readable stream.
 * Calls `onMessage` for each complete message object.
 *
 * @param {import('stream').Readable} readable
 * @param {(msg: object) => void} onMessage
 */
export function attachFramedReader(readable, onMessage) {
  let buf = Buffer.alloc(0);

  readable.on('data', (/** @type {Buffer} */ chunk) => {
    if (buf.length + chunk.length > MAX_MESSAGE_BYTES) {
      onMessage({ _parseError: true, _raw: 'message too large' });
      buf = Buffer.alloc(0);
      return;
    }
    buf = Buffer.concat([buf, chunk]);
    while (true) {
      // Look for header terminator \r\n\r\n
      const sep = buf.indexOf('\r\n\r\n');
      if (sep === -1) break;

      const header = buf.slice(0, sep).toString('utf8');
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        // Malformed header — discard up to and including separator
        buf = buf.slice(sep + 4);
        continue;
      }

      const contentLength = parseInt(match[1], 10);
      const bodyStart = sep + 4;
      if (buf.length < bodyStart + contentLength) break; // wait for more data

      const body = buf.slice(bodyStart, bodyStart + contentLength).toString('utf8');
      buf = buf.slice(bodyStart + contentLength);

      let msg;
      try {
        msg = JSON.parse(body);
      } catch {
        onMessage({ _parseError: true, _raw: body });
        continue;
      }
      onMessage(msg);
    }
  });
}

/**
 * Serialize and write one JSON-RPC message with Content-Length framing.
 * @param {import('stream').Writable} writable
 * @param {object} msg
 */
export function writeFramed(writable, msg) {
  const body = JSON.stringify(msg);
  const header = `Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n`;
  writable.write(header + body, 'utf8');
}

/**
 * Build a JSON-RPC error response object.
 * @param {number | string | null} id
 * @param {number} code
 * @param {string} message
 * @param {any} [data]
 */
function errorResponse(id, code, message, data) {
  const resp = { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
  if (data !== undefined) resp.error.data = data;
  return resp;
}

/**
 * @param {number | string | null} id
 * @param {any} result
 */
function successResponse(id, result) {
  return { jsonrpc: '2.0', id, result };
}

/**
 * Map a thrown error to a JSON-RPC error response.
 * @param {number | string | null} id
 * @param {unknown} err
 */
function errorFromThrown(id, err) {
  if (err instanceof IllegalActionError) {
    return errorResponse(id, err.code, err.message);
  }
  if (err instanceof UnknownRun || err instanceof RunCapExceeded || err instanceof RunErrored) {
    return errorResponse(id, err.code, err.message);
  }
  const msg = err instanceof Error ? err.message : String(err);
  return errorResponse(id, -32000, msg);
}

export class JsonRpcServer {
  /**
   * @param {import('stream').Readable} input
   * @param {import('stream').Writable} output
   */
  constructor(input, output) {
    this._output = output;
    this._registry = new RunRegistry();
    this._write = (msg) => writeFramed(output, msg);

    attachFramedReader(input, (msg) => this._handleMessage(msg));
  }

  /** @param {object} msg */
  _handleMessage(msg) {
    // Parse error from framed reader
    if (/** @type {any} */ (msg)._parseError) {
      this._write(errorResponse(null, PARSE_ERROR, 'Parse error'));
      return;
    }

    // Batch not supported — treat as invalid request
    if (Array.isArray(msg)) {
      this._write(errorResponse(null, INVALID_REQUEST, 'Batch requests not supported'));
      return;
    }

    const req = /** @type {any} */ (msg);
    const id = req.id ?? null;

    if (req.jsonrpc !== '2.0' || typeof req.method !== 'string') {
      this._write(errorResponse(id, INVALID_REQUEST, 'Invalid Request'));
      return;
    }

    const methodDef = methodMap.get(req.method);
    if (!methodDef) {
      // Notifications (no id) get no response
      if (id === null || id === undefined) return;
      this._write(errorResponse(id, METHOD_NOT_FOUND, `Method not found: ${req.method}`));
      return;
    }

    // Notifications — execute but send no response
    const isNotification = id === null || id === undefined;

    let result;
    try {
      result = methodDef.handler(this._registry, req.params ?? {}, this._write);
    } catch (err) {
      if (!isNotification) {
        this._write(errorFromThrown(id, err));
      }
      return;
    }

    if (!isNotification) {
      this._write(successResponse(id, result));
    }
  }
}
