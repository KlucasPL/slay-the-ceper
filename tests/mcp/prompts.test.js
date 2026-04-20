import { describe, it, expect } from 'vitest';

// Exercise prompts by importing the registration functions and running their handlers
// without needing a live McpServer — we mock a minimal server to capture registrations.

function makeCapturingServer() {
  const registered = { prompts: [] };
  return {
    registered,
    prompt(name, description, handler) {
      registered.prompts.push({ name, description, handler });
    },
    // stub unused methods
    tool() {},
    resource() {},
  };
}

describe('MCP prompts', () => {
  it('shouldRegisterThreePrompts', async () => {
    // given
    const { registerPrompts } = await import('../../src/mcp/prompts.js');
    const server = makeCapturingServer();
    // when
    registerPrompts(server);
    // then
    expect(server.registered.prompts).toHaveLength(3);
  });

  it('shouldIncludeAllExpectedPromptNames', async () => {
    // given
    const { registerPrompts } = await import('../../src/mcp/prompts.js');
    const server = makeCapturingServer();
    registerPrompts(server);
    // when
    const names = server.registered.prompts.map((p) => p.name);
    // then
    expect(names).toContain('balance/play-run');
    expect(names).toContain('balance/probe-card');
    expect(names).toContain('balance/qa-smoke');
  });

  it('shouldRenderPlayRunPrompt', async () => {
    // given
    const { registerPrompts } = await import('../../src/mcp/prompts.js');
    const server = makeCapturingServer();
    registerPrompts(server);
    const prompt = server.registered.prompts.find((p) => p.name === 'balance/play-run');
    // when
    const result = await prompt.handler();
    // then
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[0].content.type).toBe('text');
    expect(result.messages[0].content.text).toContain('Usiec Cepra');
    expect(result.messages[0].content.text).toContain('WORKFLOW');
  });

  it('shouldRenderProbeCardPrompt', async () => {
    // given
    const { registerPrompts } = await import('../../src/mcp/prompts.js');
    const server = makeCapturingServer();
    registerPrompts(server);
    const prompt = server.registered.prompts.find((p) => p.name === 'balance/probe-card');
    // when
    const result = await prompt.handler();
    // then
    expect(result.messages[0].content.text).toContain('BASELINE');
    expect(result.messages[0].content.text).toContain('VARIANT');
  });

  it('shouldRenderQaSmokePrompt', async () => {
    // given
    const { registerPrompts } = await import('../../src/mcp/prompts.js');
    const server = makeCapturingServer();
    registerPrompts(server);
    const prompt = server.registered.prompts.find((p) => p.name === 'balance/qa-smoke');
    // when
    const result = await prompt.handler();
    // then
    expect(result.messages[0].content.text).toContain('CHECKLIST');
    expect(result.messages[0].content.text).toContain('battle');
    expect(result.messages[0].content.text).toContain('shop');
    expect(result.messages[0].content.text).toContain('terminal');
  });

  it('shouldHaveNonEmptyDescriptionsForAllPrompts', async () => {
    // given
    const { registerPrompts } = await import('../../src/mcp/prompts.js');
    const server = makeCapturingServer();
    registerPrompts(server);
    // then
    for (const { name, description } of server.registered.prompts) {
      expect(description, `prompt "${name}" missing description`).toBeTruthy();
    }
  });
});
