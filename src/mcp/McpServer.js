import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RunRegistry } from '../rpc/RunRegistry.js';
import { registerTools } from './tools.js';
import { registerResources } from './resources.js';
import { registerPrompts } from './prompts.js';

/**
 * Create and configure an McpServer with all engine tools, resources, and prompts.
 * @returns {{ server: McpServer, registry: RunRegistry }}
 */
export function createMcpServer() {
  const server = new McpServer({
    name: 'usiec-cepra',
    version: '1.0.0',
  });

  const registry = new RunRegistry();

  registerTools(server, registry);
  registerResources(server, registry);
  registerPrompts(server);

  return { server, registry };
}
