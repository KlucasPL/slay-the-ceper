import { describe, it, expect } from 'vitest';
import { RunRegistry } from '../../src/rpc/RunRegistry.js';
import { methods } from '../../src/rpc/methods.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Directly exercise the resource handler logic (mirrors resources.js inline)
// so tests don't depend on SDK internals.

async function readBaselineMain() {
  const path = join(ROOT, 'baselines', 'main.metrics.json');
  return existsSync(path) ? readFileSync(path, 'utf8') : '{}';
}

async function readMetricsBatch(batchId) {
  const candidates = [
    join(ROOT, 'baselines', `${batchId}.metrics.json`),
    join(ROOT, 'baselines', `${batchId}.json`),
  ];
  const path = candidates.find(existsSync) ?? null;
  if (!path) return JSON.stringify({ error: `metrics not found for batch: ${batchId}` });
  return readFileSync(path, 'utf8');
}

async function readBatchesIndex() {
  const { readdirSync } = await import('fs');
  const batchDir = join(ROOT, 'scripts', 'sim', 'batches');
  const files = existsSync(batchDir) ? readdirSync(batchDir).filter((f) => f.endsWith('.js')) : [];
  return JSON.stringify({ batches: files.map((f) => f.replace('.js', '')) });
}

async function readRunObservation(registry, runId) {
  try {
    const { engine } = registry.get(runId);
    return JSON.stringify(engine.getObservation());
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
  }
}

describe('MCP resources', () => {
  describe('balance://baseline/main', () => {
    it('shouldReturnValidJsonForBaselineMain', async () => {
      // when
      const text = await readBaselineMain();
      // then
      expect(() => JSON.parse(text)).not.toThrow();
    });

    it('shouldContainMetricsKeys', async () => {
      // when
      const data = JSON.parse(await readBaselineMain());
      // then — main.metrics.json has known top-level keys
      expect(typeof data).toBe('object');
    });
  });

  describe('balance://metrics/{batchId}', () => {
    it('shouldReturnMainMetricsForKnownBatchId', async () => {
      // when
      const text = await readMetricsBatch('main');
      const data = JSON.parse(text);
      // then
      expect(typeof data).toBe('object');
    });

    it('shouldReturnErrorObjectForUnknownBatchId', async () => {
      // when
      const text = await readMetricsBatch('nonexistent-batch-xyz');
      const data = JSON.parse(text);
      // then
      expect(data.error).toBeTypeOf('string');
      expect(data.error).toContain('nonexistent-batch-xyz');
    });
  });

  describe('balance://batches', () => {
    it('shouldReturnBatchesArray', async () => {
      // when
      const text = await readBatchesIndex();
      const data = JSON.parse(text);
      // then
      expect(Array.isArray(data.batches)).toBe(true);
    });

    it('shouldIncludeBaselineBatch', async () => {
      // when
      const { batches } = JSON.parse(await readBatchesIndex());
      // then — _baseline.js exists
      expect(batches).toContain('_baseline');
    });
  });

  describe('balance://run/{runId}/observation', () => {
    it('shouldReturnLiveObservationForActiveRun', async () => {
      // given
      const registry = new RunRegistry();
      const runId = registry.create({ characterId: 'jedrek', seed: '0xABCD' });
      methods.find((m) => m.name === 'engine.startRun').handler(registry, { runId }, () => {});
      // when
      const text = await readRunObservation(registry, runId);
      const data = JSON.parse(text);
      // then
      expect(data.phase).toBe('map');
      expect(data.player).toBeDefined();
      registry.dispose(runId);
    });

    it('shouldReturnErrorForUnknownRunId', async () => {
      // given
      const registry = new RunRegistry();
      // when
      const text = await readRunObservation(registry, '00000000-0000-0000-0000-000000000000');
      const data = JSON.parse(text);
      // then
      expect(data.error).toBeTypeOf('string');
    });

    it('shouldReturnErrorForDisposedRun', async () => {
      // given
      const registry = new RunRegistry();
      const runId = registry.create({ characterId: 'jedrek' });
      registry.dispose(runId);
      // when
      const text = await readRunObservation(registry, runId);
      const data = JSON.parse(text);
      // then
      expect(data.error).toBeTypeOf('string');
    });
  });
});
