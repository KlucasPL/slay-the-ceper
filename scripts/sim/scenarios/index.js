/**
 * Scenario registry and loader for the sim harness.
 *
 * A scenario is a module with a default export of shape:
 *   { name: string, description: string, seeds: number[], notes?: string }
 *
 * Built-in scenarios are registered here; custom scenarios can be loaded by
 * file path via loadScenarioFile().
 */

import testerCorpus from './tester-corpus.js';

/**
 * @typedef {{ name: string, description: string, seeds: number[], notes?: string }} Scenario
 */

/** @type {Record<string, Scenario>} */
const SCENARIO_REGISTRY = {
  'tester-corpus': testerCorpus,
};

/**
 * Resolve a built-in scenario by name. Throws if unknown.
 * @param {string} name
 * @returns {Scenario}
 */
export function resolveScenario(name) {
  const scenario = SCENARIO_REGISTRY[name];
  if (!scenario) {
    throw new Error(
      `Unknown scenario "${name}". Known scenarios: ${Object.keys(SCENARIO_REGISTRY).join(', ')}`
    );
  }
  return scenario;
}

/**
 * Load a scenario from an arbitrary file path.
 * @param {string} filePath - absolute or relative path to scenario module
 * @returns {Promise<Scenario>}
 */
export async function loadScenarioFile(filePath) {
  const mod = await import(/* @vite-ignore */ filePath);
  const scenario = mod.default;
  if (!scenario || !Array.isArray(scenario.seeds) || !scenario.name) {
    throw new Error(
      `Scenario file "${filePath}" must export { name, description, seeds[] } as default`
    );
  }
  return scenario;
}

export { SCENARIO_REGISTRY };
