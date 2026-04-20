import { EngineController } from '../engine/EngineController.js';
import { IllegalActionError } from '../engine/LegalActions.js';
import { renderObservation } from '../engine/text/AgentText.js';

/**
 * @typedef {{ name: string, summary: string, handler: (registry: RunRegistry, params: any, write: (msg: object) => void) => any }} MethodDef
 */

/** @type {MethodDef[]} */
export const methods = [
  {
    name: 'engine.create',
    summary: 'Create a new run, returns { runId }.',
    handler(registry, params) {
      const runId = registry.create(params ?? {});
      return { runId };
    },
  },
  {
    name: 'engine.startRun',
    summary: 'Start the run, returns first observation.',
    handler(registry, params) {
      const { engine } = registry.get(params.runId);
      return { observation: engine.startRun() };
    },
  },
  {
    name: 'engine.getObservation',
    summary: 'Get current observation without advancing state.',
    handler(registry, params) {
      const { engine } = registry.get(params.runId);
      return { observation: engine.getObservation() };
    },
  },
  {
    name: 'engine.getLegalActions',
    summary: 'Get legal actions for the current state.',
    handler(registry, params) {
      const { engine } = registry.get(params.runId);
      return { legalActions: engine.getLegalActions() };
    },
  },
  {
    name: 'engine.applyAction',
    summary: 'Apply an action, returns ActionResult.',
    handler(registry, params) {
      const entry = registry.get(params.runId);
      let result;
      try {
        result = entry.engine.applyAction(params.action);
      } catch (err) {
        if (err instanceof IllegalActionError) throw err;
        registry.markErrored(params.runId);
        throw err;
      }
      return result;
    },
  },
  {
    name: 'engine.endTurn',
    summary: 'Shorthand for applyAction({ type: "end_turn" }).',
    handler(registry, params) {
      const entry = registry.get(params.runId);
      let result;
      try {
        result = entry.engine.endTurn();
      } catch (err) {
        if (err instanceof IllegalActionError) throw err;
        registry.markErrored(params.runId);
        throw err;
      }
      return result;
    },
  },
  {
    name: 'engine.snapshot',
    summary: 'Serialize run state to JSON-safe object.',
    handler(registry, params) {
      const { engine } = registry.get(params.runId);
      return { snapshot: engine.snapshot() };
    },
  },
  {
    name: 'engine.restore',
    summary: 'Restore a run from snapshot, returns new { runId }.',
    handler(registry, params) {
      const engine = EngineController.restore(params.snapshot);
      const runId = registry.createFromEngine(engine);
      return { runId };
    },
  },
  {
    name: 'engine.drainEvents',
    summary: 'Drain and return buffered events.',
    handler(registry, params) {
      const { engine } = registry.get(params.runId);
      return { events: engine.drainEvents() };
    },
  },
  {
    name: 'engine.getRunSummary',
    summary: 'Get run summary (null if not terminal).',
    handler(registry, params) {
      const { engine } = registry.get(params.runId);
      return { summary: engine.getRunSummary() };
    },
  },
  {
    name: 'engine.seed',
    summary: 'Re-seed the RNG for MCTS rollouts.',
    handler(registry, params) {
      const { engine } = registry.get(params.runId);
      engine.seed(params.hex);
      return {};
    },
  },
  {
    name: 'engine.renderText',
    summary: 'Render current observation as agent-friendly text.',
    handler(registry, params) {
      const { engine } = registry.get(params.runId);
      const obs = engine.getObservation();
      const text = renderObservation(obs, params.style ?? 'pl');
      return { text };
    },
  },
  {
    name: 'engine.subscribe',
    summary: 'Subscribe to event push notifications for a run.',
    handler(registry, params, write) {
      registry.subscribe(params.runId, (events) => {
        write({
          jsonrpc: '2.0',
          method: 'engine.events',
          params: { runId: params.runId, events },
        });
      });
      return {};
    },
  },
  {
    name: 'engine.dispose',
    summary: 'Dispose a run and free resources.',
    handler(registry, params) {
      registry.dispose(params.runId);
      return {};
    },
  },
];

/** @type {Map<string, MethodDef>} */
export const methodMap = new Map(methods.map((m) => [m.name, m]));
