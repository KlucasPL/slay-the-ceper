import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {import('../rpc/RunRegistry.js').RunRegistry} registry
 */
export function registerResources(server, registry) {
  // balance://baseline/main — read baselines/main.metrics.json
  server.resource('baseline-main', 'balance://baseline/main', async (uri) => {
    const path = join(ROOT, 'baselines', 'main.metrics.json');
    const text = existsSync(path) ? readFileSync(path, 'utf8') : '{}';
    return {
      contents: [{ uri: uri.href, mimeType: 'application/json', text }],
    };
  });

  // balance://metrics/{batchId} — read arbitrary committed metrics.json
  server.resource('metrics-batch', 'balance://metrics/{batchId}', async (uri, { batchId }) => {
    const candidates = [
      join(ROOT, 'baselines', `${batchId}.metrics.json`),
      join(ROOT, 'baselines', `${batchId}.json`),
      join(ROOT, 'metrics', `${batchId}.json`),
      join(ROOT, 'metrics', `${batchId}.metrics.json`),
    ];
    const path = candidates.find(existsSync) ?? null;
    if (!path) {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({ error: `metrics not found for batch: ${batchId}` }),
          },
        ],
      };
    }
    return {
      contents: [{ uri: uri.href, mimeType: 'application/json', text: readFileSync(path, 'utf8') }],
    };
  });

  // balance://batches — index of scripts/sim/batches/*.js
  server.resource('batches-index', 'balance://batches', async (uri) => {
    const batchDir = join(ROOT, 'scripts', 'sim', 'batches');
    let files = [];
    if (existsSync(batchDir)) {
      files = readdirSync(batchDir).filter((f) => f.endsWith('.js'));
    }
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ batches: files.map((f) => f.replace('.js', '')) }),
        },
      ],
    };
  });

  // balance://run/{runId}/observation — live observation from RunRegistry
  server.resource(
    'run-observation',
    'balance://run/{runId}/observation',
    async (uri, { runId }) => {
      let text;
      try {
        const { engine } = registry.get(runId);
        text = JSON.stringify(engine.getObservation());
      } catch (err) {
        text = JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
      }
      return {
        contents: [{ uri: uri.href, mimeType: 'application/json', text }],
      };
    }
  );
}
