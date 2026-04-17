import { describe, it, expect, afterEach } from 'vitest';
import { EngineController } from '../../src/engine/EngineController.js';

// Track all controllers created per test and dispose them to prevent Math.random leaks
/** @type {EngineController[]} */
let _activeControllers = [];
afterEach(() => {
  for (const ctrl of _activeControllers) ctrl.dispose();
  _activeControllers = [];
});

function makeController(opts = {}) {
  const ctrl = EngineController.create({ characterId: 'jedrek', seed: '0x1234', ...opts });
  _activeControllers.push(ctrl);
  return ctrl;
}

/** Navigate to the first battle node so tests can call play_card / end_turn. */
function travelToFirstBattle(ctrl) {
  let obs = ctrl.getObservation();
  while (obs.phase === 'map') {
    const travelAction = obs.legalActions.find((a) => a.type === 'travel');
    if (!travelAction) break;
    const result = ctrl.applyAction(travelAction);
    obs = result.observation;
  }
  return obs;
}

describe('EngineController', () => {
  it('shouldCreateControllerWithoutStarting', () => {
    // given / when
    const ctrl = makeController();
    // then
    expect(ctrl).toBeDefined();
  });

  it('shouldStartRunAndReturnObservation', () => {
    // given
    const ctrl = makeController();
    // when
    const obs = ctrl.startRun();
    // then — after resetForNewRun the engine starts on the map screen
    expect(obs).toBeDefined();
    expect(obs.phase).toBe('map');
    expect(obs.player).toBeDefined();
    expect(obs.legalActions.length).toBeGreaterThan(0);
    expect(Object.isFrozen(obs)).toBe(true);
  });

  it('shouldThrowWhenStartCalledTwice', () => {
    // given
    const ctrl = makeController();
    ctrl.startRun();
    // when / then
    expect(() => ctrl.startRun()).toThrow('Run already started');
  });

  it('shouldReturnConsistentObservation', () => {
    // given
    const ctrl = makeController();
    ctrl.startRun();
    travelToFirstBattle(ctrl);
    // when
    const a = ctrl.getObservation();
    const b = ctrl.getObservation();
    // then — both reflect same state (hand, hp, etc.)
    expect(a.player.hp).toBe(b.player.hp);
    expect(a.hand.length).toBe(b.hand.length);
  });

  it('shouldReturnLegalActionsMatchingObservation', () => {
    // given
    const ctrl = makeController();
    ctrl.startRun();
    // when — legal actions are consistent at any phase (map or battle)
    const obs = ctrl.getObservation();
    const legal = ctrl.getLegalActions();
    // then
    expect(legal).toEqual(obs.legalActions);
  });

  it('shouldApplyEndTurnAndUpdateObservation', () => {
    // given
    const ctrl = makeController();
    ctrl.startRun();
    travelToFirstBattle(ctrl);
    // when
    const result = ctrl.endTurn();
    // then
    expect(result.observation).toBeDefined();
    expect(result.done).toBe(false);
  });

  it('shouldDrainEventsAndClearBuffer', () => {
    // given
    const ctrl = makeController();
    ctrl.startRun();
    travelToFirstBattle(ctrl);
    ctrl.endTurn();
    // when
    const events = ctrl.drainEvents();
    const second = ctrl.drainEvents();
    // then
    expect(Array.isArray(events)).toBe(true);
    expect(second.length).toBe(0);
  });

  it('shouldReturnNullRunSummaryBeforeTerminal', () => {
    // given
    const ctrl = makeController();
    ctrl.startRun();
    // when / then
    expect(ctrl.getRunSummary()).toBeNull();
  });

  it('shouldSnapshotAndRestoreState', () => {
    // given
    const ctrl = makeController();
    ctrl.startRun();
    travelToFirstBattle(ctrl);
    const obsBefore = ctrl.getObservation();
    // when
    const snap = ctrl.snapshot();
    const ctrl2 = EngineController.restore(snap);
    const obsAfter = ctrl2.getObservation();
    // then
    expect(obsAfter.player.hp).toBe(obsBefore.player.hp);
    expect(obsAfter.hand.length).toBe(obsBefore.hand.length);
    expect(obsAfter.phase).toBe(obsBefore.phase);
  });

  it('shouldProduceDeterministicRunWithSameSeed', () => {
    // given
    const runToTurn3 = (seed) => {
      const ctrl = EngineController.create({ characterId: 'jedrek', seed });
      _activeControllers.push(ctrl);
      ctrl.startRun();
      travelToFirstBattle(ctrl);
      ctrl.endTurn();
      ctrl.endTurn();
      return ctrl.getObservation();
    };
    // when
    const obs1 = runToTurn3('0xdeadbeef');
    const obs2 = runToTurn3('0xdeadbeef');
    // then
    expect(obs1.player.hp).toBe(obs2.player.hp);
    expect(obs1.battleTurn).toBe(obs2.battleTurn);
  });
});
