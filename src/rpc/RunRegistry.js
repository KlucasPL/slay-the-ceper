import { EngineController } from '../engine/EngineController.js';

const RUN_CAP = 16;
const IDLE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class UnknownRun extends Error {
  /** @param {string} runId */
  constructor(runId) {
    super(`Unknown run: ${runId}`);
    this.name = 'UnknownRun';
    this.code = -32002;
  }
}

export class RunCapExceeded extends Error {
  constructor() {
    super(`Run cap of ${RUN_CAP} reached`);
    this.name = 'RunCapExceeded';
    this.code = -32003;
  }
}

export class RunErrored extends Error {
  /** @param {string} runId */
  constructor(runId) {
    super(`Run ${runId} is in errored state`);
    this.name = 'RunErrored';
    this.code = -32004;
  }
}

/**
 * @typedef {{
 *   engine: EngineController,
 *   errored: boolean,
 *   lastTouched: number,
 *   gcTimer: ReturnType<typeof setTimeout> | null,
 *   subscribers: Set<(events: import('../engine/EngineEvents.js').EngineEvent[]) => void>,
 * }} RunEntry
 */

export class RunRegistry {
  constructor() {
    /** @type {Map<string, RunEntry>} */
    this._runs = new Map();
  }

  /**
   * @param {Parameters<typeof EngineController.create>[0]} opts
   * @returns {string} runId
   */
  create(opts) {
    return this.createFromEngine(EngineController.create(opts));
  }

  /**
   * Register an already-constructed EngineController (used by `engine.restore`).
   * Single source of truth for RUN_CAP + GC scheduling.
   * @param {EngineController} engine
   * @returns {string} runId
   */
  createFromEngine(engine) {
    if (this._runs.size >= RUN_CAP) throw new RunCapExceeded();
    const runId = crypto.randomUUID();
    this._runs.set(runId, {
      engine,
      errored: false,
      lastTouched: Date.now(),
      gcTimer: null,
      subscribers: new Set(),
    });
    this._scheduleGc(runId);
    return runId;
  }

  /**
   * Retrieve an entry, throwing if unknown or errored.
   * @param {string} runId
   * @returns {RunEntry}
   */
  get(runId) {
    const entry = this._runs.get(runId);
    if (!entry) throw new UnknownRun(runId);
    if (entry.errored) throw new RunErrored(runId);
    this._touch(runId, entry);
    return entry;
  }

  /**
   * Retrieve an entry without errored check (for subscribe/dispose).
   * @param {string} runId
   * @returns {RunEntry}
   */
  getRaw(runId) {
    const entry = this._runs.get(runId);
    if (!entry) throw new UnknownRun(runId);
    this._touch(runId, entry);
    return entry;
  }

  /**
   * Mark a run as errored (keeps the entry for diagnostics but blocks future calls).
   * @param {string} runId
   */
  markErrored(runId) {
    const entry = this._runs.get(runId);
    if (entry) entry.errored = true;
  }

  /**
   * Dispose and remove a run.
   * @param {string} runId
   */
  dispose(runId) {
    const entry = this._runs.get(runId);
    if (!entry) return;
    if (entry.gcTimer) clearTimeout(entry.gcTimer);
    entry.engine.dispose();
    this._runs.delete(runId);
  }

  /**
   * Add a subscriber to receive events pushed out of a run.
   * @param {string} runId
   * @param {(events: import('../engine/EngineEvents.js').EngineEvent[]) => void} fn
   */
  subscribe(runId, fn) {
    const entry = this.getRaw(runId);
    entry.subscribers.add(fn);
  }

  /**
   * Push drained events to all subscribers of a run.
   * @param {string} runId
   */
  pushEvents(runId) {
    const entry = this._runs.get(runId);
    if (!entry || entry.subscribers.size === 0) return;
    const events = entry.engine.drainEvents();
    if (events.length === 0) return;
    for (const fn of entry.subscribers) {
      fn(events);
    }
  }

  /** @param {string} runId @param {RunEntry} entry */
  _touch(runId, entry) {
    entry.lastTouched = Date.now();
    this._scheduleGc(runId);
  }

  /** @param {string} runId */
  _scheduleGc(runId) {
    const entry = this._runs.get(runId);
    if (!entry) return;
    if (entry.gcTimer) clearTimeout(entry.gcTimer);
    entry.gcTimer = setTimeout(() => {
      this.dispose(runId);
    }, IDLE_TTL_MS);
    // Don't block Node.js from exiting
    if (entry.gcTimer?.unref) entry.gcTimer.unref();
  }
}
