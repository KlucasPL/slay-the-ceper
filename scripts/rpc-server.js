#!/usr/bin/env node
/**
 * JSON-RPC 2.0 stdio server for Usiec Cepra engine.
 * Usage: npm run rpc
 * Protocol: Content-Length framed JSON-RPC 2.0 over stdin/stdout.
 */
import { JsonRpcServer } from '../src/rpc/JsonRpcServer.js';

// Suppress Vite/browser-targeted console noise that may leak from imported modules
process.stderr.write('[rpc-server] starting\n');

new JsonRpcServer(process.stdin, process.stdout);
