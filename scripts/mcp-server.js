#!/usr/bin/env node
/**
 * MCP server for Usiec Cepra engine.
 * Usage: npm run mcp
 * Transport: stdio (compatible with Claude Desktop and MCP clients).
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from '../src/mcp/McpServer.js';

process.stderr.write('[mcp-server] starting\n');

const { server } = createMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
