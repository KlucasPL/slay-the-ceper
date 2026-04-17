import { describe, it, expect, afterEach } from 'vitest';
import { EngineController } from '../../src/engine/index.js';
import { HeuristicBot } from '../../src/logic/bots/HeuristicBot.js';
import { makeReplayBot, ReplayDesyncError } from '../../src/logic/bots/ReplayBot.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const _originalMathRandom = Math.random;
/** @type {EngineController[]} */
let _engines = [];

afterEach(() => {
  for (const e of _engines) e.dispose();
  _engines = [];
  Math.random = _originalMathRandom;
});

/** @returns {EngineController} */
function makeEngine(seed = 'deadbeef') {
  const e = EngineController.create({
    characterId: 'jedrek',
    seed,
    rules: { skipIntro: true },
  });
  _engines.push(e);
  return e;
}

/**
 * Record an agentTrace by running HeuristicBot on a fresh engine.
 * @param {string} seed
 * @returns {{ trace: import('../../src/logic/bots/ReplayBot.js').TraceEntry[], outcome: string }}
 */
function recordTrace(seed) {
  const engine = makeEngine(seed);
  let observation = engine.startRun();
  /** @type {import('../../src/logic/bots/ReplayBot.js').TraceEntry[]} */
  const trace = [];
  let step = 0;
  while (!observation.done) {
    const action = HeuristicBot(observation);
    trace.push({
      step,
      phase: observation.phase,
      floor: observation.floor,
      turn: observation.turn,
      action,
    });
    const result = engine.applyAction(action);
    observation = result.observation;
    step++;
    if (step > 5000) throw new Error('recordTrace: exceeded 5000 steps');
  }
  const outcome = engine.getRunSummary()?.outcome ?? 'unknown';
  return { trace, outcome };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReplayBot', () => {
  it('shouldReplayKnownTraceToSameOutcome', () => {
    // given
    const { trace, outcome: originalOutcome } = recordTrace('cafebabe');

    // when
    const replayEngine = makeEngine('cafebabe');
    const bot = makeReplayBot(trace);
    let obs = replayEngine.startRun();
    while (!obs.done) {
      const action = bot(obs);
      obs = replayEngine.applyAction(action).observation;
    }

    // then
    const replayOutcome = replayEngine.getRunSummary()?.outcome;
    expect(replayOutcome).toBe(originalOutcome);
  });

  it('shouldReplayEntireTraceWithoutThrowingOnMultipleSeeds', () => {
    // given / when / then
    for (const seed of ['deadbeef', '12345678', 'aabbccdd']) {
      const { trace } = recordTrace(seed);
      const engine = makeEngine(seed);
      const bot = makeReplayBot(trace);
      let obs = engine.startRun();
      expect(() => {
        while (!obs.done) {
          const action = bot(obs);
          obs = engine.applyAction(action).observation;
        }
      }).not.toThrow();
    }
  });

  it('shouldThrowReplayDesyncErrorOnWrongActionType', () => {
    // given
    const { trace } = recordTrace('deadbeef');
    // Corrupt the first entry so its action type can never be legal
    const corruptTrace = [
      { ...trace[0], action: { type: '__invalid_action_type__' } },
      ...trace.slice(1),
    ];

    // when
    const engine = makeEngine('deadbeef');
    const bot = makeReplayBot(corruptTrace);
    const obs = engine.startRun();

    // then
    expect(() => bot(obs)).toThrowError(ReplayDesyncError);
  });

  it('shouldIncludeDesyncDetailInError', () => {
    // given
    const { trace } = recordTrace('deadbeef');
    const corruptTrace = [{ ...trace[0], action: { type: '__bad__' } }, ...trace.slice(1)];

    // when
    const engine = makeEngine('deadbeef');
    const bot = makeReplayBot(corruptTrace);
    const obs = engine.startRun();

    let caught = null;
    try {
      bot(obs);
    } catch (e) {
      caught = e;
    }

    // then
    expect(caught).toBeInstanceOf(ReplayDesyncError);
    expect(caught.detail.step).toBe(0);
    expect(Array.isArray(caught.detail.legalActions)).toBe(true);
    expect(caught.detail.legalActions.length).toBeGreaterThan(0);
  });

  it('shouldThrowWhenTraceIsExhaustedButGameContinues', () => {
    // given — trace truncated to 1 entry
    const { trace } = recordTrace('deadbeef');
    const shortTrace = trace.slice(0, 1);

    // when
    const engine = makeEngine('deadbeef');
    const bot = makeReplayBot(shortTrace);
    let obs = engine.startRun();

    // Apply one valid action (drains the single trace entry)
    obs = engine.applyAction(bot(obs)).observation;

    // then — next call must throw since trace is empty
    if (!obs.done) {
      expect(() => bot(obs)).toThrowError(ReplayDesyncError);
    }
  });

  it('shouldThrowOnEmptyTrace', () => {
    // given / when / then
    expect(() => makeReplayBot([])).toThrow();
  });

  it('shouldProduceIdenticalFinalDeckOnReplay', () => {
    // given
    const { trace } = recordTrace('f00dcafe');

    // when — replay with a fresh engine at same seed
    const engine = makeEngine('f00dcafe');
    const bot = makeReplayBot(trace);
    let obs = engine.startRun();
    while (!obs.done) {
      obs = engine.applyAction(bot(obs)).observation;
    }

    // then
    const origEngine = makeEngine('f00dcafe');
    let obs2 = origEngine.startRun();
    while (!obs2.done) {
      obs2 = origEngine.applyAction(HeuristicBot(obs2)).observation;
    }

    const replayDeck = engine.getRunSummary()?.finalDeck ?? [];
    const origDeck = origEngine.getRunSummary()?.finalDeck ?? [];
    expect(replayDeck).toEqual(origDeck);
  });
});
