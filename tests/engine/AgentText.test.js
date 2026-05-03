import { describe, it, expect, afterEach } from 'vitest';
import { EngineController } from '../../src/engine/EngineController.js';
import { renderObservation } from '../../src/engine/text/AgentText.js';

/** @type {EngineController[]} */
let _activeControllers = [];
afterEach(() => {
  for (const ctrl of _activeControllers) ctrl.dispose();
  _activeControllers = [];
});

function makeController(opts = {}) {
  const ctrl = EngineController.create({ characterId: 'jedrek', seed: '0xABCD', ...opts });
  _activeControllers.push(ctrl);
  return ctrl;
}

function travelToFirstBattle(ctrl) {
  let obs = ctrl.getObservation();
  while (obs.phase === 'map') {
    const action = obs.legalActions.find((a) => a.type === 'travel');
    if (!action) break;
    const result = ctrl.applyAction(action);
    obs = result.observation;
  }
  return obs;
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Build a minimal synthetic battle observation for unit-level checks. */
function makeBattleObs(overrides = {}) {
  return {
    phase: 'battle',
    turn: 3,
    battleTurn: 2,
    floor: 2,
    act: 1,
    weather: { id: 'clear', name: 'Słoneczna', description: 'Brak efektów.' },
    player: {
      hp: 45,
      maxHp: 80,
      block: 10,
      energy: 2,
      maxEnergy: 3,
      status: { strength: 2, weak: 1 },
      stunned: false,
      cardsPlayedThisTurn: 1,
    },
    enemy: {
      id: 'cepr',
      name: 'Cepr',
      hp: 30,
      maxHp: 50,
      block: 5,
      status: { vulnerable: 2 },
      passive: null,
      isElite: false,
      isBoss: false,
      rachunek: 0,
      ped: 0,
      intent: { type: 'attack', name: 'Cios', hits: 1, expectedDamageToPlayer: 8, text: 'Cios 8' },
      phaseTwoTriggered: false,
      stunnedTurns: 0,
      evasionCharges: 0,
      bossArtifact: null,
    },
    hand: [
      {
        id: 'cios_ciupaga',
        name: 'Cios Ciupagą',
        type: 'attack',
        cost: 1,
        effectiveCost: 1,
        desc: 'Zadaj 6.',
        emoji: '⚔️',
        unplayable: false,
        exhaust: false,
      },
      {
        id: 'goralska_obrona',
        name: 'Góralska Obrona',
        type: 'skill',
        cost: 1,
        effectiveCost: 1,
        desc: 'Zyskaj 5 Gardy.',
        emoji: '🛡️',
        unplayable: false,
        exhaust: false,
      },
    ],
    deckCount: 8,
    discardCount: 3,
    exhaustCount: 0,
    combat: { firstAttackUsed: false, activeSide: 'player', attackCardsPlayedThisBattle: 0 },
    run: {
      character: 'jedrek',
      difficulty: 'normal',
      dutki: 120,
      relics: ['pas_bacowski'],
      marynaBoon: null,
      cardDamageBonus: {},
      acquired: { cards: [], relics: [], boons: [] },
    },
    legalActions: [
      { type: 'play_card', handIndex: 0 },
      { type: 'play_card', handIndex: 1 },
      { type: 'end_turn' },
    ],
    done: false,
    ...overrides,
  };
}

/** @returns {import('../../src/engine/Observation.js').Observation} */
function makeMapObs() {
  return {
    phase: 'map',
    turn: 0,
    battleTurn: 0,
    floor: 1,
    act: 1,
    weather: { id: 'clear', name: 'Słoneczna', description: '' },
    player: {
      hp: 80,
      maxHp: 80,
      block: 0,
      energy: 3,
      maxEnergy: 3,
      status: {},
      stunned: false,
      cardsPlayedThisTurn: 0,
    },
    enemy: null,
    hand: [],
    deckCount: 10,
    discardCount: 0,
    exhaustCount: 0,
    combat: { firstAttackUsed: false, activeSide: 'none', attackCardsPlayedThisBattle: 0 },
    run: {
      character: 'jedrek',
      difficulty: 'normal',
      dutki: 99,
      relics: [],
      marynaBoon: null,
      cardDamageBonus: {},
      acquired: { cards: [], relics: [], boons: [] },
    },
    map: {
      currentLevel: 0,
      currentNodeIndex: 0,
      totalLevels: 15,
      currentNode: { type: 'battle', weather: null },
      reachableNodes: [{ level: 1, nodeIndex: 0 }],
    },
    legalActions: [{ type: 'travel', level: 1, nodeIndex: 0 }],
    done: false,
  };
}

/** @returns {import('../../src/engine/Observation.js').Observation} */
function makeRewardObs() {
  return {
    phase: 'reward',
    turn: 1,
    battleTurn: 5,
    floor: 2,
    act: 1,
    weather: { id: 'clear', name: 'Słoneczna', description: '' },
    player: {
      hp: 60,
      maxHp: 80,
      block: 0,
      energy: 3,
      maxEnergy: 3,
      status: {},
      stunned: false,
      cardsPlayedThisTurn: 0,
    },
    enemy: null,
    hand: [],
    deckCount: 10,
    discardCount: 0,
    exhaustCount: 0,
    combat: { firstAttackUsed: false, activeSide: 'none', attackCardsPlayedThisBattle: 0 },
    run: {
      character: 'jedrek',
      difficulty: 'normal',
      dutki: 150,
      relics: [],
      marynaBoon: null,
      cardDamageBonus: {},
      acquired: { cards: [], relics: [], boons: [] },
    },
    rewardOffer: { cards: ['cios_ciupaga', 'goralska_obrona', 'zawierka'], relicId: null },
    legalActions: [
      { type: 'reward_pick_card', cardId: 'cios_ciupaga' },
      { type: 'reward_pick_card', cardId: 'goralska_obrona' },
      { type: 'reward_pick_card', cardId: 'zawierka' },
      { type: 'reward_pick_card', cardId: null },
    ],
    done: false,
  };
}

/** @returns {import('../../src/engine/Observation.js').Observation} */
function makeShopObs() {
  return {
    phase: 'shop',
    turn: 5,
    battleTurn: 0,
    floor: 5,
    act: 1,
    weather: { id: 'clear', name: 'Słoneczna', description: '' },
    player: {
      hp: 70,
      maxHp: 80,
      block: 0,
      energy: 3,
      maxEnergy: 3,
      status: {},
      stunned: false,
      cardsPlayedThisTurn: 0,
    },
    enemy: null,
    hand: [],
    deckCount: 12,
    discardCount: 0,
    exhaustCount: 0,
    combat: { firstAttackUsed: false, activeSide: 'none', attackCardsPlayedThisBattle: 0 },
    run: {
      character: 'jedrek',
      difficulty: 'normal',
      dutki: 200,
      relics: [],
      marynaBoon: null,
      cardDamageBonus: {},
      acquired: { cards: [], relics: [], boons: [] },
    },
    shopStock: { cards: ['cios_ciupaga', 'redyk', 'zawierka'], relic: 'pas_bacowski' },
    legalActions: [{ type: 'shop_buy_card', cardId: 'cios_ciupaga' }, { type: 'shop_leave' }],
    done: false,
  };
}

/** @returns {import('../../src/engine/Observation.js').Observation} */
function makeTerminalObs(outcome = 'win') {
  return {
    phase: 'terminal',
    turn: 42,
    battleTurn: 0,
    floor: 15,
    act: 3,
    weather: { id: 'clear', name: 'Słoneczna', description: '' },
    player: {
      hp: 20,
      maxHp: 80,
      block: 0,
      energy: 3,
      maxEnergy: 3,
      status: {},
      stunned: false,
      cardsPlayedThisTurn: 0,
    },
    enemy: null,
    hand: [],
    deckCount: 0,
    discardCount: 0,
    exhaustCount: 0,
    combat: { firstAttackUsed: false, activeSide: 'none', attackCardsPlayedThisBattle: 0 },
    run: {
      character: 'jedrek',
      difficulty: 'normal',
      dutki: 50,
      relics: [],
      marynaBoon: null,
      cardDamageBonus: {},
      acquired: { cards: [], relics: [], boons: [] },
    },
    legalActions: [],
    done: true,
    outcome,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('renderObservation', () => {
  describe('battle screen', () => {
    it('shouldRenderBattleInPolish', () => {
      // given
      const obs = makeBattleObs();
      // when
      const text = renderObservation(obs, 'pl');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## BITKA');
      expect(text).toContain('Góral');
      expect(text).toContain('Krzepa');
      expect(text).toContain('Garda');
      expect(text).toContain('Oscypki');
      expect(text).toContain('## RĘKA');
      expect(text).toContain('## AKCJE');
      expect(text).toContain('end_turn');
    });

    it('shouldRenderBattleInEnglish', () => {
      // given
      const obs = makeBattleObs();
      // when
      const text = renderObservation(obs, 'en');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## WALKA');
      expect(text).toContain('Gracz');
      expect(text).toContain('Krzepa');
      expect(text).toContain('Garda');
      expect(text).toContain('Oscypki');
      expect(text).toContain('## RĘKA');
      expect(text).toContain('## DOZWOLONE');
    });

    it('shouldRenderBattleCompact', () => {
      // given
      const obs = makeBattleObs();
      // when
      const text = renderObservation(obs, 'compact');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## WALKA');
      // compact should be shorter than pl
      expect(text.length).toBeLessThan(renderObservation(obs, 'pl').length);
    });

    it('shouldIncludeStatusEffectsInBattle', () => {
      // given
      const obs = makeBattleObs();
      // when
      const plText = renderObservation(obs, 'pl');
      const enText = renderObservation(obs, 'en');
      // then — player has strength:2 and weak:1; enemy has vulnerable:2
      expect(plText).toContain('Siła:2');
      expect(plText).toContain('Słabość:1');
      expect(plText).toContain('Podatność:2');
      expect(enText).toContain('Siła:2');
      expect(enText).toContain('Słabość:1');
      expect(enText).toContain('Podatność:2');
    });

    it('shouldShowStunnedPlayer', () => {
      // given
      const obs = makeBattleObs({ player: { ...makeBattleObs().player, stunned: true } });
      // when
      const text = renderObservation(obs, 'pl');
      // then
      expect(text).toContain('OGŁUSZONY');
    });

    it('shouldRenderLiveObservationFromEngine', () => {
      // given
      const ctrl = makeController();
      ctrl.startRun();
      const battleObs = travelToFirstBattle(ctrl);
      // when
      const text = renderObservation(battleObs, 'pl');
      // then
      expect(text).toContain('## BITKA');
      expect(text).toContain('## AKCJE');
      expect(text.length).toBeGreaterThan(50);
    });
  });

  describe('map screen', () => {
    it('shouldRenderMapInPolish', () => {
      // given
      const obs = makeMapObs();
      // when
      const text = renderObservation(obs, 'pl');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## MAPA');
      expect(text).toContain('Piętro');
      expect(text).toContain('Dutki');
      expect(text).toContain('## AKCJE');
      expect(text).toContain('travel');
    });

    it('shouldRenderMapInEnglish', () => {
      // given
      const obs = makeMapObs();
      // when
      const text = renderObservation(obs, 'en');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## MAPA');
      expect(text).toContain('Piętro');
      expect(text).toContain('Dutki');
    });

    it('shouldRenderMapCompact', () => {
      // given
      const obs = makeMapObs();
      // when
      const text = renderObservation(obs, 'compact');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## MAPA');
    });
  });

  describe('reward screen', () => {
    it('shouldRenderRewardInPolish', () => {
      // given
      const obs = makeRewardObs();
      // when
      const text = renderObservation(obs, 'pl');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## NAGRODA');
      expect(text).toContain('reward_pick_card');
    });

    it('shouldRenderRewardInEnglish', () => {
      // given
      const obs = makeRewardObs();
      // when
      const text = renderObservation(obs, 'en');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## NAGRODA');
    });

    it('shouldRenderRewardCompact', () => {
      // given
      const obs = makeRewardObs();
      // when
      const text = renderObservation(obs, 'compact');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## NAGRODA');
    });
  });

  describe('shop screen', () => {
    it('shouldRenderShopInPolish', () => {
      // given
      const obs = makeShopObs();
      // when
      const text = renderObservation(obs, 'pl');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## JARMARK');
      expect(text).toContain('Dutki');
      expect(text).toContain('shop_leave');
    });

    it('shouldRenderShopInEnglish', () => {
      // given
      const obs = makeShopObs();
      // when
      const text = renderObservation(obs, 'en');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## SKLEP');
      expect(text).toContain('Dutki');
    });

    it('shouldRenderShopCompact', () => {
      // given
      const obs = makeShopObs();
      // when
      const text = renderObservation(obs, 'compact');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## SKLEP');
    });
  });

  describe('terminal screen', () => {
    it('shouldRenderWinInPolish', () => {
      // given
      const obs = makeTerminalObs('win');
      // when
      const text = renderObservation(obs, 'pl');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## KONIEC');
      expect(text).toContain('Zwycięstwo');
    });

    it('shouldRenderLossInPolish', () => {
      // given
      const obs = makeTerminalObs('loss');
      // when
      const text = renderObservation(obs, 'pl');
      // then
      expect(text).toContain('## KONIEC');
      expect(text).toContain('Porażka');
    });

    it('shouldRenderTerminalInEnglish', () => {
      // given
      const obs = makeTerminalObs('win');
      // when
      const text = renderObservation(obs, 'en');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## TERMINAL');
      expect(text).toContain('Zwycięstwo');
    });

    it('shouldRenderTerminalCompact', () => {
      // given
      const obs = makeTerminalObs('loss');
      // when
      const text = renderObservation(obs, 'compact');
      // then
      expect(text).toMatchSnapshot();
      expect(text).toContain('## TERMINAL');
      expect(text).toContain('LOSS');
    });
  });

  describe('default style', () => {
    it('shouldDefaultToPolishStyle', () => {
      // given
      const obs = makeBattleObs();
      // when
      const defaultText = renderObservation(obs);
      const plText = renderObservation(obs, 'pl');
      // then
      expect(defaultText).toBe(plText);
    });
  });

  describe('section delimiters', () => {
    it('shouldHaveConsistentSectionHeadersAcrossStyles', () => {
      // given
      const obs = makeBattleObs();
      // when
      const pl = renderObservation(obs, 'pl');
      const en = renderObservation(obs, 'en');
      const compact = renderObservation(obs, 'compact');
      // then — all have ## prefixed headers (LLM parseability)
      expect(pl).toMatch(/^## /m);
      expect(en).toMatch(/^## /m);
      expect(compact).toMatch(/^## /m);
    });
  });
});
