---
name: run-mcp
description: Start MCP stdio server for Claude integration
compatibility: opencode
metadata:
  audience: developers
  workflow: integration
---
## What I do

Start MCP server:
```bash
npm run mcp
```

Server exposes game engine methods via MCP protocol.

## When to use me

- Testing MCP integration
- Building AI agent that plays the game
- Debugging RPC/MCP methods

## MCP Methods Available

See `src/mcp/tools.js` for exposed methods.

## Alternative: RPC Server

```bash
npm run rpc  # JSON-RPC 2.0 stdio server
```

## Testing Methods

```bash
echo '{"jsonrpc":"2.0","method":"play","params":{}}' | npm run rpc
```