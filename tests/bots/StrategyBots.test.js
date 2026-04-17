import { describe, it, expect } from 'vitest';
import { AggressiveBot } from '../../src/logic/bots/AggressiveBot.js';
import { DefensiveBot } from '../../src/logic/bots/DefensiveBot.js';
import { StatusStackBot } from '../../src/logic/bots/StatusStackBot.js';
import { GreedyRewardBot } from '../../src/logic/bots/GreedyRewardBot.js';
import { MinimalistBot } from '../../src/logic/bots/MinimalistBot.js';
import { EconomyBot } from '../../src/logic/bots/EconomyBot.js';
import { BOT_REGISTRY, resolveBot, isBotFactory } from '../../src/logic/bots/index.js';

// ---------------------------------------------------------------------------
// Shared test helpers (mirrors HeuristicBot.test.js)
// ---------------------------------------------------------------------------

function makeEnemy(overrides = {}) {
  return {
    id: 'cepr',
    name: 'Cepr',
    hp: 30,
    maxHp: 30,
    block: 0,
    status: { weak: 0, fragile: 0, vulnerable: 0, strength: 0 },
    intent: { type: 'attack', expectedDamageToPlayer: 8 },
    passive: null,
    isElite: false,
    isBoss: false,
    rachunek: 0,
    ped: 0,
    phaseTwoTriggered: false,
    stunnedTurns: 0,
    evasionCharges: 0,
    bossArtifact: null,
    ...overrides,
  };
}

function makePlayer(overrides = {}) {
  return {
    hp: 50,
    maxHp: 50,
    block: 0,
    energy: 3,
    maxEnergy: 3,
    status: {
      strength: 0,
      weak: 0,
      fragile: 0,
      vulnerable: 0,
      next_double: false,
      energy_next_turn: 0,
      lans: 0,
      duma_podhala: 0,
      furia_turysty: 0,
    },
    stunned: false,
    cardsPlayedThisTurn: 0,
    ...overrides,
  };
}

function makeCard(overrides = {}) {
  return {
    id: 'ciupaga',
    name: 'Cios ciupagą',
    type: 'attack',
    cost: 1,
    effectiveCost: 1,
    desc: 'Zadaje 6 obrażeń.',
    emoji: '🪓',
    unplayable: false,
    exhaust: false,
    ...overrides,
  };
}

function makeObs(overrides = {}) {
  return {
    phase: 'battle',
    turn: 1,
    battleTurn: 1,
    floor: 1,
    act: 1,
    weather: { id: 'clear', name: 'Pogodnie', description: '' },
    player: makePlayer(),
    enemy: makeEnemy(),
    hand: [],
    deckCount: 4,
    discardCount: 0,
    exhaustCount: 0,
    combat: { firstAttackUsed: false, activeSide: 'player', attackCardsPlayedThisBattle: 0 },
    run: {
      character: 'jedrek',
      difficulty: 'normal',
      dutki: 50,
      relics: [],
      marynaBoon: null,
      cardDamageBonus: {},
      acquired: { cards: [], relics: [], boons: [] },
    },
    legalActions: [{ type: 'end_turn' }],
    done: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// AggressiveBot
// ---------------------------------------------------------------------------

describe('AggressiveBot', () => {
  it('shouldPreferHighDamageCardOverBlockCard', () => {
    // given — attack card (6 dmg) vs block card (10 block)
    // AggressiveBot: attack score = 6/1 * 2.0 = 12.0; block score = 10/1 * 0 = 0 → attack wins
    const attackCard = makeCard({
      id: 'ciupaga',
      desc: 'Zadaje 6 obrażeń.',
      type: 'attack',
      effectiveCost: 1,
    });
    const blockCard = makeCard({
      id: 'gasior',
      desc: 'Zyskujesz 10 Gardy.',
      type: 'skill',
      effectiveCost: 1,
    });
    const obs = makeObs({
      hand: [attackCard, blockCard],
      legalActions: [
        { type: 'play_card', handIndex: 0 },
        { type: 'play_card', handIndex: 1 },
        { type: 'end_turn' },
      ],
    });
    // when
    const result = AggressiveBot(obs);
    // then — attack wins (pinned)
    expect(result).toEqual({ type: 'play_card', handIndex: 0 });
  });

  it('shouldIgnoreBlockCardEvenWhenLowHp', () => {
    // given — player at 10% HP; panicThreshold=0 so no block boost applies
    // attack: 6/1 * 2.0 = 12.0; block: 10/1 * 0 = 0
    const attackCard = makeCard({
      id: 'ciupaga',
      desc: 'Zadaje 6 obrażeń.',
      type: 'attack',
      effectiveCost: 1,
    });
    const blockCard = makeCard({
      id: 'gasior',
      desc: 'Zyskujesz 10 Gardy.',
      type: 'skill',
      effectiveCost: 1,
    });
    const obs = makeObs({
      player: makePlayer({ hp: 5, maxHp: 50 }),
      hand: [attackCard, blockCard],
      legalActions: [
        { type: 'play_card', handIndex: 0 },
        { type: 'play_card', handIndex: 1 },
        { type: 'end_turn' },
      ],
    });
    // when
    const result = AggressiveBot(obs);
    // then — attack wins despite low HP (pinned)
    expect(result).toEqual({ type: 'play_card', handIndex: 0 });
  });

  it('shouldReturnSingleLegalActionWithoutError', () => {
    // given
    const obs = makeObs({ legalActions: [{ type: 'end_turn' }] });
    // when
    const result = AggressiveBot(obs);
    // then
    expect(result).toEqual({ type: 'end_turn' });
  });

  it('shouldThrowWhenNoLegalActions', () => {
    // given
    const obs = makeObs({ legalActions: [] });
    // when / then
    expect(() => AggressiveBot(obs)).toThrow('no legal actions');
  });
});

// ---------------------------------------------------------------------------
// DefensiveBot
// ---------------------------------------------------------------------------

describe('DefensiveBot', () => {
  it('shouldPreferBlockCardOverAttackCardAtFullHealth', () => {
    // given — block card (10 block) vs attack card (6 dmg)
    // DefensiveBot: block score = 10/1 * 2.0 = 20.0; attack score = 6/1 * 0.4 = 2.4
    const attackCard = makeCard({
      id: 'ciupaga',
      desc: 'Zadaje 6 obrażeń.',
      type: 'attack',
      effectiveCost: 1,
    });
    const blockCard = makeCard({
      id: 'gasior',
      desc: 'Zyskujesz 10 Gardy.',
      type: 'skill',
      effectiveCost: 1,
    });
    const obs = makeObs({
      hand: [attackCard, blockCard],
      legalActions: [
        { type: 'play_card', handIndex: 0 },
        { type: 'play_card', handIndex: 1 },
        { type: 'end_turn' },
      ],
    });
    // when
    const result = DefensiveBot(obs);
    // then — block wins (pinned)
    expect(result).toEqual({ type: 'play_card', handIndex: 1 });
  });

  it('shouldRestAtCampfireAtLowerPanicThreshold', () => {
    // given — player at 60% HP (above standard 40% but below DefensiveBot's 70% threshold)
    const obs = makeObs({
      phase: 'campfire',
      player: makePlayer({ hp: 30, maxHp: 50 }), // 60% < 70% panic threshold
      legalActions: [
        { type: 'campfire', option: 'rest' },
        { type: 'campfire', option: 'upgrade', cardId: 'ciupaga' },
        { type: 'campfire', option: 'leave' },
      ],
    });
    // when
    const result = DefensiveBot(obs);
    // then — rest chosen because 60% < 70% panicThreshold (pinned)
    expect(result).toEqual({ type: 'campfire', option: 'rest' });
  });

  it('shouldReturnSingleLegalActionWithoutError', () => {
    // given
    const obs = makeObs({ legalActions: [{ type: 'end_turn' }] });
    // when
    const result = DefensiveBot(obs);
    // then
    expect(result).toEqual({ type: 'end_turn' });
  });
});

// ---------------------------------------------------------------------------
// StatusStackBot
// ---------------------------------------------------------------------------

describe('StatusStackBot', () => {
  it('shouldPreferStatusCardOverPureAttackCard', () => {
    // given — status skill (applies Słabość = weak=5 pts) vs attack card (6 dmg)
    // StatusStackBot: status score = 5/1 * 2.5 = 12.5; attack score = 6/1 * 0.6 = 3.6
    const statusCard = makeCard({
      id: 'sandaly',
      type: 'skill',
      desc: 'Nakłada Słabość 2 na wroga.',
      effectiveCost: 1,
    });
    const attackCard = makeCard({
      id: 'ciupaga',
      desc: 'Zadaje 6 obrażeń.',
      type: 'attack',
      effectiveCost: 1,
    });
    const obs = makeObs({
      hand: [attackCard, statusCard],
      legalActions: [
        { type: 'play_card', handIndex: 0 },
        { type: 'play_card', handIndex: 1 },
        { type: 'end_turn' },
      ],
    });
    // when
    const result = StatusStackBot(obs);
    // then — status card wins (pinned)
    expect(result).toEqual({ type: 'play_card', handIndex: 1 });
  });

  it('shouldReturnSingleLegalActionWithoutError', () => {
    // given
    const obs = makeObs({ legalActions: [{ type: 'end_turn' }] });
    // when / then
    expect(DefensiveBot(obs)).toEqual({ type: 'end_turn' });
  });
});

// ---------------------------------------------------------------------------
// GreedyRewardBot
// ---------------------------------------------------------------------------

describe('GreedyRewardBot', () => {
  it('shouldPickCardEvenWhenDeckIsLarge', () => {
    // given — deck at 20 cards; targetDeckSize=25 so no size penalty yet
    // sizePenalty = max(0, 20-25)*0.5 = 0; rarityBonus=1 → score=1 > skipThreshold(-0.1)
    const bigDeck = Array.from({ length: 20 }, (_, i) => `ciupaga_${i}`);
    const obs = makeObs({
      phase: 'reward',
      run: {
        character: 'jedrek',
        difficulty: 'normal',
        dutki: 50,
        relics: [],
        marynaBoon: null,
        cardDamageBonus: {},
        acquired: { cards: bigDeck, relics: [], boons: [] },
      },
      legalActions: [
        { type: 'reward_pick_card', cardId: 'ciupaga' },
        { type: 'reward_pick_card', cardId: null },
      ],
    });
    // when
    const result = GreedyRewardBot(obs);
    // then — picks card because deck < targetDeckSize 25 (pinned)
    expect(result).toEqual({ type: 'reward_pick_card', cardId: 'ciupaga' });
  });

  it('shouldSkipCardWhenDeckExceedsGreedyTarget', () => {
    // given — deck at 26 cards; targetDeckSize=25 → sizePenalty = (26-25)*0.5 = 0.5
    // rarityBonus=1 → score=0.5; skipThreshold = 0.5 (because deckSize>=25) → no card beats it
    const bigDeck = Array.from({ length: 26 }, (_, i) => `ciupaga_${i}`);
    const obs = makeObs({
      phase: 'reward',
      run: {
        character: 'jedrek',
        difficulty: 'normal',
        dutki: 50,
        relics: [],
        marynaBoon: null,
        cardDamageBonus: {},
        acquired: { cards: bigDeck, relics: [], boons: [] },
      },
      legalActions: [
        { type: 'reward_pick_card', cardId: 'ciupaga' },
        { type: 'reward_pick_card', cardId: null },
      ],
    });
    // when
    const result = GreedyRewardBot(obs);
    // then — skips (pinned) because score(0.5) <= skipThreshold(0.5)
    expect(result).toEqual({ type: 'reward_pick_card', cardId: null });
  });
});

// ---------------------------------------------------------------------------
// MinimalistBot
// ---------------------------------------------------------------------------

describe('MinimalistBot', () => {
  it('shouldSkipRewardEvenWithSmallDeck', () => {
    // given — deck at 12 cards (> targetDeckSize 10) → skipThreshold = 0.5
    // sizePenalty = (12-10)*0.5 = 1; rarityBonus=1 → score=0 < skipThreshold(0.5) → skip
    const deck = Array.from({ length: 12 }, (_, i) => `ciupaga_${i}`);
    const obs = makeObs({
      phase: 'reward',
      run: {
        character: 'jedrek',
        difficulty: 'normal',
        dutki: 50,
        relics: [],
        marynaBoon: null,
        cardDamageBonus: {},
        acquired: { cards: deck, relics: [], boons: [] },
      },
      legalActions: [
        { type: 'reward_pick_card', cardId: 'ciupaga' },
        { type: 'reward_pick_card', cardId: null },
      ],
    });
    // when
    const result = MinimalistBot(obs);
    // then — skips (pinned)
    expect(result).toEqual({ type: 'reward_pick_card', cardId: null });
  });

  it('shouldPickCardWhenDeckBelowMinimalistTarget', () => {
    // given — deck at 8 cards (< targetDeckSize 10) → skipThreshold = -0.1
    // sizePenalty = max(0, 8-10)*0.5 = 0; rarityBonus=1 → score=1 > -0.1 → pick
    const deck = Array.from({ length: 8 }, (_, i) => `ciupaga_${i}`);
    const obs = makeObs({
      phase: 'reward',
      run: {
        character: 'jedrek',
        difficulty: 'normal',
        dutki: 50,
        relics: [],
        marynaBoon: null,
        cardDamageBonus: {},
        acquired: { cards: deck, relics: [], boons: [] },
      },
      legalActions: [
        { type: 'reward_pick_card', cardId: 'ciupaga' },
        { type: 'reward_pick_card', cardId: null },
      ],
    });
    // when
    const result = MinimalistBot(obs);
    // then — picks card (pinned)
    expect(result).toEqual({ type: 'reward_pick_card', cardId: 'ciupaga' });
  });
});

// ---------------------------------------------------------------------------
// EconomyBot
// ---------------------------------------------------------------------------

describe('EconomyBot', () => {
  it('shouldPreferRelicOverCardAtShop', () => {
    // given — shop with relic (score 8) and card (score 1*shopRelicRatio 1.0 = 1)
    const obs = makeObs({
      phase: 'shop',
      run: {
        character: 'jedrek',
        difficulty: 'normal',
        dutki: 100,
        relics: [],
        marynaBoon: null,
        cardDamageBonus: {},
        acquired: { cards: Array(5).fill('ciupaga'), relics: [], boons: [] },
      },
      legalActions: [
        { type: 'shop_buy_relic', relicId: 'bilet_tpn' },
        { type: 'shop_buy_card', cardId: 'ciupaga' },
        { type: 'shop_leave' },
      ],
    });
    // when
    const result = EconomyBot(obs);
    // then — relic wins (pinned: 8 > card score)
    expect(result).toEqual({ type: 'shop_buy_relic', relicId: 'bilet_tpn' });
  });

  it('shouldReturnSingleLegalActionWithoutError', () => {
    // given
    const obs = makeObs({ legalActions: [{ type: 'end_turn' }] });
    // when / then
    expect(EconomyBot(obs)).toEqual({ type: 'end_turn' });
  });
});

// ---------------------------------------------------------------------------
// Bot registry
// ---------------------------------------------------------------------------

describe('BOT_REGISTRY', () => {
  it('shouldContainAllExpectedBots', () => {
    // given / when
    const names = Object.keys(BOT_REGISTRY);
    // then
    expect(names).toContain('heuristic');
    expect(names).toContain('random');
    expect(names).toContain('aggressive');
    expect(names).toContain('defensive');
    expect(names).toContain('status');
    expect(names).toContain('greedy');
    expect(names).toContain('minimalist');
    expect(names).toContain('economy');
  });

  it('shouldResolveBotByName', () => {
    // given / when / then
    expect(resolveBot('aggressive')).toBe(AggressiveBot);
    expect(resolveBot('defensive')).toBe(DefensiveBot);
    expect(resolveBot('status')).toBe(StatusStackBot);
    expect(resolveBot('greedy')).toBe(GreedyRewardBot);
    expect(resolveBot('minimalist')).toBe(MinimalistBot);
    expect(resolveBot('economy')).toBe(EconomyBot);
  });

  it('shouldThrowWhenResolvingUnknownBot', () => {
    // given / when / then
    expect(() => resolveBot('nonexistent')).toThrow('Unknown agent "nonexistent"');
  });

  it('shouldProduceValidActionsForAllBotsOnStandardObs', () => {
    // given — one attack card, one block card, end_turn
    const obs = makeObs({
      hand: [
        makeCard({ id: 'ciupaga', desc: 'Zadaje 6 obrażeń.', type: 'attack', effectiveCost: 1 }),
        makeCard({ id: 'gasior', desc: 'Zyskujesz 10 Gardy.', type: 'skill', effectiveCost: 1 }),
      ],
      legalActions: [
        { type: 'play_card', handIndex: 0 },
        { type: 'play_card', handIndex: 1 },
        { type: 'end_turn' },
      ],
    });
    // when / then — each stateless bot returns a valid action from legalActions.
    // Engine-bound factory bots (SearchBot variants) need live engine context,
    // so they're exercised in tests/bots/SearchBot.test.js instead.
    for (const [name, bot] of Object.entries(BOT_REGISTRY)) {
      if (isBotFactory(bot)) continue;
      const result = bot(obs);
      expect(obs.legalActions).toContainEqual(result, `${name} returned invalid action`);
    }
  });
});
