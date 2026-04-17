import { describe, it, expect } from 'vitest';
import {
  resolveScenario,
  loadScenarioFile,
  SCENARIO_REGISTRY,
} from '../../scripts/sim/scenarios/index.js';
import testerCorpus from '../../scripts/sim/scenarios/tester-corpus.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('scenario registry', () => {
  it('shouldContainTesterCorpus', () => {
    // given / when / then
    expect(SCENARIO_REGISTRY).toHaveProperty('tester-corpus');
  });

  it('shouldResolveTesterCorpusByName', () => {
    // given / when
    const scenario = resolveScenario('tester-corpus');
    // then
    expect(scenario).toBe(testerCorpus);
    expect(scenario.name).toBe('tester-corpus');
    expect(Array.isArray(scenario.seeds)).toBe(true);
    expect(scenario.seeds.length).toBeGreaterThanOrEqual(20);
    expect(scenario.description).toBeTruthy();
  });

  it('shouldThrowForUnknownScenario', () => {
    // given / when / then
    expect(() => resolveScenario('nonexistent-scenario')).toThrow(
      'Unknown scenario "nonexistent-scenario"'
    );
  });

  it('shouldThrowErrorListingKnownScenarios', () => {
    // given / when / then
    expect(() => resolveScenario('bogus')).toThrow('tester-corpus');
  });
});

describe('tester-corpus scenario', () => {
  it('shouldHaveValidSeedsArray', () => {
    // given / when
    const { seeds } = testerCorpus;
    // then — all seeds are positive integers
    expect(seeds.every((s) => Number.isInteger(s) && s > 0)).toBe(true);
  });

  it('shouldHaveUniqueSeeds', () => {
    // given / when
    const { seeds } = testerCorpus;
    // then
    expect(new Set(seeds).size).toBe(seeds.length);
  });

  it('shouldContainAt least40Seeds', () => {
    // given / when / then
    expect(testerCorpus.seeds.length).toBeGreaterThanOrEqual(40);
  });
});

describe('loadScenarioFile', () => {
  it('shouldLoadTesterCorpusFromFilePath', async () => {
    // given
    const filePath = join(__dirname, '../../scripts/sim/scenarios/tester-corpus.js');
    // when
    const scenario = await loadScenarioFile(filePath);
    // then
    expect(scenario.name).toBe('tester-corpus');
    expect(Array.isArray(scenario.seeds)).toBe(true);
  });

  it('shouldThrowForNonExistentScenarioFile', async () => {
    // given
    const badPath = join(__dirname, '../../scripts/sim/scenarios/does-not-exist.js');
    // when / then
    await expect(loadScenarioFile(badPath)).rejects.toThrow();
  });
});
