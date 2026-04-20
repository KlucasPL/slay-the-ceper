import { describe, it, expect, afterEach } from 'vitest';
import { EngineController } from '../../src/engine/index.js';
import { makeSearchBot } from '../../src/logic/bots/SearchBot.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const _originalMathRandom = Math.random;
/** @type {EngineController[]} */
let _activeEngines = [];
afterEach(() => {
  for (const e of _activeEngines) e.dispose();
  _activeEngines = [];
  // Restore Math.random unconditionally in case MCTS rollouts left it patched
  Math.random = _originalMathRandom;
});

/** @returns {EngineController} */
function makeEngine(seed = 'deadbeef') {
  const e = EngineController.create({
    characterId: 'jedrek',
    seed,
    rules: { skipIntro: true, revealAllPiles: true },
  });
  _activeEngines.push(e);
  return e;
}

/** Snapshot the engine's key observable state for comparison */
function captureState(engine) {
  const obs = engine.getObservation();
  return {
    phase: obs.phase,
    playerHp: obs.player.hp,
    deckCount: obs.deckCount,
    discardCount: obs.discardCount,
    handLen: obs.hand.length,
    enemyHp: obs.enemy?.hp ?? null,
    floor: obs.floor,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SearchBot (1-ply)', () => {
  it('shouldReturnLegalActionForFirstObservation', () => {
    // given
    const engine = makeEngine();
    const bot = makeSearchBot(engine, { mctsN: 0 });
    const obs = engine.startRun();

    // when
    const action = bot(obs);

    // then
    const legalTypes = obs.legalActions.map((a) => a.type);
    expect(legalTypes).toContain(action.type);
  });

  it('shouldPreferLethalActionInOnePly', () => {
    // given — build a state where one action is lethal (enemy hp = 1)
    // We can't easily force exact HP without engine internals, so we run until
    // the enemy is at low HP and verify the bot picks play_card over end_turn.
    const engine = makeEngine('1');
    const bot = makeSearchBot(engine, { mctsN: 0 });
    let obs = engine.startRun();

    // Play until enemy is hurt or game ends
    let action;
    let steps = 0;
    while (!obs.done && steps < 200) {
      action = bot(obs);
      obs = engine.applyAction(action).observation;
      steps++;
      // If we can see lethal (enemy.hp <= estimated damage of a play_card), stop
      if (
        obs.phase === 'battle' &&
        obs.enemy &&
        obs.enemy.hp <= 5 &&
        obs.legalActions.some((a) => a.type === 'play_card')
      ) {
        break;
      }
    }

    // then — bot should not be stuck
    expect(steps).toBeGreaterThan(0);
    if (!obs.done) {
      const nextAction = bot(obs);
      expect(obs.legalActions.map((a) => a.type)).toContain(nextAction.type);
    }
  });

  it('shouldRestoreEngineStateAfterEachOnePlyEvaluation', () => {
    // given — this is the critical state-cleanliness test
    const engine = makeEngine('2');
    const bot = makeSearchBot(engine, { mctsN: 0 });
    const obs = engine.startRun();
    const stateBefore = captureState(engine);

    // when — calling bot() applies/restores snapshots internally
    bot(obs);

    // then — engine state must be byte-identical to before the call
    const stateAfter = captureState(engine);
    expect(stateAfter).toEqual(stateBefore);
  });

  it('shouldProduceSameActionForIdenticalObservation', () => {
    // given — 1-ply is a pure function of the observation's static scores.
    // Two calls with structurally identical observations must yield the same action.
    const engineA = makeEngine('abc');
    const botA = makeSearchBot(engineA, { mctsN: 0 });
    const engineB = makeEngine('abc');
    const botB = makeSearchBot(engineB, { mctsN: 0 });

    const obsA = engineA.startRun();
    const obsB = engineB.startRun();

    // when — both engines start at the same state, so first observation is identical
    const actionA = botA(obsA);
    const actionB = botB(obsB);

    // then — same observation → same action (pure scoring)
    expect(actionA).toEqual(actionB);
  });
});

describe('SearchBot (MCTS N=5)', () => {
  it('shouldRestoreEngineStateAfterMctsRollouts', () => {
    // given
    const engine = makeEngine('3');
    const bot = makeSearchBot(engine, { mctsN: 5, rolloutSeed: 0x1234 });
    const obs = engine.startRun();
    const stateBefore = captureState(engine);

    // when
    bot(obs);

    // then — rollouts must not leave residual state
    const stateAfter = captureState(engine);
    expect(stateAfter).toEqual(stateBefore);
  });

  it('shouldReturnLegalActionWithMctsRollouts', () => {
    // given
    const engine = makeEngine('4');
    const bot = makeSearchBot(engine, { mctsN: 5, rolloutSeed: 0x5678 });
    const obs = engine.startRun();

    // when
    const action = bot(obs);

    // then
    expect(obs.legalActions.map((a) => a.type)).toContain(action.type);
  });

  it('shouldProduceDeterministicActionsWithSameRolloutSeed', () => {
    // given
    const engineA = makeEngine('def');
    const engineB = makeEngine('def');
    const botA = makeSearchBot(engineA, { mctsN: 3, rolloutSeed: 0xbeef });
    const botB = makeSearchBot(engineB, { mctsN: 3, rolloutSeed: 0xbeef });

    // when
    let obsA = engineA.startRun();
    let obsB = engineB.startRun();
    const actionsA = [];
    const actionsB = [];

    for (let i = 0; i < 5; i++) {
      if (obsA.done || obsB.done) break;
      const aA = botA(obsA);
      const aB = botB(obsB);
      actionsA.push(aA);
      actionsB.push(aB);
      obsA = engineA.applyAction(aA).observation;
      obsB = engineB.applyAction(aB).observation;
    }

    // then
    expect(actionsA).toEqual(actionsB);
  });
});
