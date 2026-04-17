import { methods } from '../rpc/methods.js';

/**
 * Register all engine tools onto an McpServer from the shared methods registry.
 * Tool name = RPC method name with "engine." prefix stripped.
 *
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {import('../rpc/RunRegistry.js').RunRegistry} registry
 */
export function registerTools(server, registry) {
  for (const method of methods) {
    const toolName = method.name.replace(/^engine\./, '');

    server.tool(toolName, method.summary, {}, async (params) => {
      let result;
      try {
        result = method.handler(registry, params, () => {});
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const code = /** @type {any} */ (err)?.code ?? -32000;
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify({ error: { code, message: msg } }) }],
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
      };
    });
  }
}

/**
 * Return the list of tool descriptors derived from methods registry.
 * Used by tests for structural drift checks.
 *
 * @returns {{ name: string, summary: string, rpcMethod: string }[]}
 */
export function getToolDescriptors() {
  return methods.map((m) => ({
    name: m.name.replace(/^engine\./, ''),
    summary: m.summary,
    rpcMethod: m.name,
  }));
}
