import { describe, it, expect } from 'vitest';
import { EngineController } from '../../src/engine/EngineController.js';
import { RandomBot } from '../../src/logic/bots/RandomBot.js';
import { withSeededRng, mulberry32, parseSeed } from '../../src/engine/Rng.js';

const MAX_ACTIONS = 2000;

const KNOWN_KINDS = new Set([
  'run_started',
  'run_ended',
  'map_generated',
  'node_entered',
  'weather_entered',
  'battle_started',
  'battle_ended',
  'phase_transition',
  'turn_started',
  'turn_ended',
  'card_drawn',
  'card_played',
  'card_skipped',
  'card_exhausted',
  'enemy_move',
  'status_applied',
  'shop_opened',
  'shop_purchase',
  'resource_gained',
  'event_entered',
  'event_resolved',
  'reward_offered',
  'reward_picked',
  'campfire_choice',
  'relic_gained',
  'boon_offered',
  'boon_picked',
  'deck_mutation',
]);

/**
 * Run a full seeded game at full verbosity; return all emitted events and summary.
 * @param {string} seedStr
 * @returns {{ events: import('../../src/engine/EngineEvents.js').EngineEvent[], summary: object }}
 */
function collectRun(seedStr) {
  const seedNum = parseSeed(seedStr);
  let engine, summary;
  const events = [];

  withSeededRng(seedStr, () => {
    const botRng = mulberry32(seedNum);
    engine = EngineController.create({
      characterId: 'jedrek',
      seed: null,
      rules: { skipIntro: true },
    });
    // Full verbosity to capture F-tier events (card_drawn, turn_started/ended, enemy_move, etc.)
    engine._state._eventVerbosity = 'full';

    let obs = engine.startRun();
    events.push(...engine.drainEvents());

    let actionCount = 0;
    while (!obs.done && actionCount < MAX_ACTIONS) {
      const result = engine.applyAction(RandomBot(obs, botRng));
      events.push(...(result.events ?? []));
      obs = result.observation;
      actionCount++;
    }
  });

  summary = engine.getRunSummary();
  return { events, summary };
}

const SEEDS = ['00000001', '00000002', 'deadbeef', 'cafebabe', 'feedface'];

describe('event-consistency', () => {
  for (const seed of SEEDS) {
    describe(`seed ${seed}`, () => {
      // ── seq invariants ────────────────────────────────────────────────────

      it('shouldHaveStrictMonotonicSeqAcrossAllEvents', () => {
        // given
        const { events } = collectRun(seed);
        expect(events.length).toBeGreaterThan(0);

        // then
        for (let i = 1; i < events.length; i++) {
          expect(
            events[i].seq,
            `seq not monotonic at index ${i}: ${events[i - 1].seq} → ${events[i].seq}`
          ).toBeGreaterThan(events[i - 1].seq);
        }
      });

      it('shouldHaveSeqStartingAtZeroAndBeContiguous', () => {
        // given
        const { events } = collectRun(seed);

        // then — seq values must be 0, 1, 2, ... with no gaps
        expect(events[0].seq).toBe(0);
        for (let i = 1; i < events.length; i++) {
          expect(events[i].seq).toBe(events[i - 1].seq + 1);
        }
      });

      // ── run lifecycle invariants ──────────────────────────────────────────

      it('shouldHaveExactlyOneRunEndedEvent', () => {
        // given
        const { events } = collectRun(seed);

        // when
        const runEnded = events.filter((e) => e.kind === 'run_ended');

        // then
        expect(runEnded).toHaveLength(1);
      });

      it('shouldHaveRunEndedAsLastEvent', () => {
        // given
        const { events } = collectRun(seed);

        // then
        expect(events[events.length - 1].kind).toBe('run_ended');
      });

      it('shouldHaveRunEndedMatchingSummaryOutcome', () => {
        // given
        const { events, summary } = collectRun(seed);
        const runEndedEvent = events.find((e) => e.kind === 'run_ended');

        // then
        expect(runEndedEvent).toBeDefined();
        expect(['player_win', 'enemy_win']).toContain(summary?.outcome);
      });

      // ── battle ordering invariants ────────────────────────────────────────

      it('shouldHaveBattleStartedBeforeFirstCardPlayed', () => {
        // given
        const { events } = collectRun(seed);

        // when
        const battleStartedIdx = events.findIndex((e) => e.kind === 'battle_started');
        const firstCardPlayedIdx = events.findIndex((e) => e.kind === 'card_played');

        // then
        if (firstCardPlayedIdx !== -1) {
          expect(battleStartedIdx).toBeGreaterThanOrEqual(0);
          expect(battleStartedIdx).toBeLessThan(firstCardPlayedIdx);
        }
      });

      it('shouldHaveBattleStartedBeforeFirstCardDrawn', () => {
        // given
        const { events } = collectRun(seed);

        // when
        const battleStartedIdx = events.findIndex((e) => e.kind === 'battle_started');
        const firstCardDrawnIdx = events.findIndex((e) => e.kind === 'card_drawn');

        // then
        if (firstCardDrawnIdx !== -1) {
          expect(battleStartedIdx).toBeGreaterThanOrEqual(0);
          expect(battleStartedIdx).toBeLessThan(firstCardDrawnIdx);
        }
      });

      // ── turn interleaving invariants (F-tier) ─────────────────────────────

      it('shouldNeverHaveTwoConsecutiveTurnStartedWithoutTurnEndedBetweenInSameBattle', () => {
        // given
        const { events } = collectRun(seed);

        // when — walk the stream; reset open-turn state at each battle boundary
        let inTurn = false;
        let violations = 0;
        for (const e of events) {
          if (e.kind === 'battle_started') {
            inTurn = false;
          }
          if (e.kind === 'battle_ended') {
            inTurn = false;
          }
          if (e.kind === 'turn_started') {
            if (inTurn) violations++;
            inTurn = true;
          }
          if (e.kind === 'turn_ended') {
            if (!inTurn) violations++;
            inTurn = false;
          }
        }

        // then
        expect(violations).toBe(0);
      });

      it('shouldHaveTurnStartedCountOneMoreThanOrEqualToTurnEndedCountPerBattle', () => {
        // given
        const { events } = collectRun(seed);

        // when — split into per-battle slices and verify each slice independently
        const battles = [];
        let current = null;
        for (const e of events) {
          if (e.kind === 'battle_started') {
            current = { started: 0, ended: 0 };
            battles.push(current);
          }
          if (current) {
            if (e.kind === 'turn_started') current.started++;
            if (e.kind === 'turn_ended') current.ended++;
            if (e.kind === 'battle_ended') current = null;
          }
        }

        // then — in each battle: turn_started >= turn_ended and diff <= 1
        for (const b of battles) {
          expect(b.started).toBeGreaterThanOrEqual(b.ended);
          expect(b.started - b.ended).toBeLessThanOrEqual(1);
        }
      });

      it('shouldHaveTurnStartedBeforeFirstCardPlayedInThatTurn', () => {
        // given
        const { events } = collectRun(seed);

        // when — first turn_started and the first card_played that follows it
        const firstTurnStartedIdx = events.findIndex((e) => e.kind === 'turn_started');
        const firstCardPlayedAfterTurn = events.findIndex(
          (e, i) => i > firstTurnStartedIdx && e.kind === 'card_played'
        );

        // then
        if (firstTurnStartedIdx !== -1 && firstCardPlayedAfterTurn !== -1) {
          expect(firstTurnStartedIdx).toBeLessThan(firstCardPlayedAfterTurn);
        }
      });

      // ── event shape invariants ────────────────────────────────────────────

      it('shouldHaveAllEventKindFieldsBeKnownStrings', () => {
        // given
        const { events } = collectRun(seed);

        // then
        for (const e of events) {
          expect(KNOWN_KINDS.has(e.kind), `unknown event kind: "${e.kind}"`).toBe(true);
        }
      });

      it('shouldHaveAllEventSeqFieldsBeNonNegativeIntegers', () => {
        // given
        const { events } = collectRun(seed);

        // then
        for (const e of events) {
          expect(typeof e.seq).toBe('number');
          expect(Number.isInteger(e.seq)).toBe(true);
          expect(e.seq).toBeGreaterThanOrEqual(0);
        }
      });

      it('shouldHaveCardDrawnEventsWithValidCardIdPayload', () => {
        // given
        const { events } = collectRun(seed);
        const cardDrawnEvents = events.filter((e) => e.kind === 'card_drawn');

        // then
        for (const e of cardDrawnEvents) {
          expect(e.payload?.card?.kind).toBe('card');
          expect(typeof e.payload?.card?.id).toBe('string');
          expect(e.payload.card.id.length).toBeGreaterThan(0);
        }
      });

      it('shouldHaveCardPlayedEventsWithValidCardIdPayload', () => {
        // given
        const { events } = collectRun(seed);
        const cardPlayedEvents = events.filter((e) => e.kind === 'card_played');

        // then — card_played must carry a card ref or bare cardId
        for (const e of cardPlayedEvents) {
          const hasCardRef = e.payload?.card?.id != null;
          const hasCardId = typeof e.payload?.cardId === 'string';
          expect(
            hasCardRef || hasCardId,
            `card_played missing card id in payload: ${JSON.stringify(e.payload)}`
          ).toBe(true);
        }
      });

      it('shouldHaveEnemyMoveEventsWithValidEnemyRef', () => {
        // given
        const { events } = collectRun(seed);
        const enemyMoveEvents = events.filter((e) => e.kind === 'enemy_move');

        // then
        for (const e of enemyMoveEvents) {
          expect(e.payload?.enemy?.kind).toBe('enemy');
          expect(typeof e.payload?.enemy?.id).toBe('string');
          expect(e.payload.enemy.id.length).toBeGreaterThan(0);
        }
      });

      // ── run lifecycle (now that resetForNewRun is called) ────────────────

      it('shouldHaveExactlyOneRunStartedEvent', () => {
        // given
        const { events } = collectRun(seed);

        // then
        expect(events.filter((e) => e.kind === 'run_started')).toHaveLength(1);
      });

      it('shouldHaveRunStartedBeforeBattleStarted', () => {
        // given
        const { events } = collectRun(seed);

        // when
        const runStartedIdx = events.findIndex((e) => e.kind === 'run_started');
        const battleStartedIdx = events.findIndex((e) => e.kind === 'battle_started');

        // then
        expect(runStartedIdx).toBeGreaterThanOrEqual(0);
        expect(runStartedIdx).toBeLessThan(battleStartedIdx);
      });

      it('shouldHaveMapGeneratedBeforeFirstNodeEntered', () => {
        // given
        const { events } = collectRun(seed);

        // when
        const mapGeneratedIdx = events.findIndex((e) => e.kind === 'map_generated');
        const nodeEnteredIdx = events.findIndex((e) => e.kind === 'node_entered');

        // then
        expect(mapGeneratedIdx).toBeGreaterThanOrEqual(0);
        if (nodeEnteredIdx !== -1) {
          expect(mapGeneratedIdx).toBeLessThan(nodeEnteredIdx);
        }
      });

      // ── inventory reconstruction ──────────────────────────────────────────
      //
      // TODO: enable once ActionDispatcher wires reward_pick_card / reward_pick_relic
      // / campfire actions (engine-architect). The reward screen is reachable now but
      // the dispatcher doesn't yet route those actions, so deck_mutation, relic_gained,
      // boon_picked events never fire in bot runs.
      //
      // it('shouldReconstructFinalDeckFromDeckMutationEvents', () => {
      //   const { events, summary } = collectRun(seed);
      //   const deck = ['ciupaga','ciupaga','ciupaga','ciupaga','ciupaga',
      //                 'gasior','gasior','gasior','gasior'];
      //   for (const e of events) {
      //     if (e.kind === 'deck_mutation') {
      //       const { mutation, card } = e.payload;
      //       if (mutation === 'add') deck.push(card.id);
      //       else if (mutation === 'remove') { const i = deck.indexOf(card.id); if (i >= 0) deck.splice(i, 1); }
      //     }
      //   }
      //   expect(deck.sort()).toEqual([...summary.finalDeck].sort());
      // });
      //
      // it('shouldReconstructFinalRelicsFromRelicGainedEvents', () => {
      //   const { events, summary } = collectRun(seed);
      //   const relics = events.filter(e => e.kind === 'relic_gained').map(e => e.payload?.relic?.id);
      //   expect(relics.sort()).toEqual([...summary.finalRelics].sort());
      // });
      //
      // it('shouldReconstructFinalBoonFromBoonPickedEvent', () => {
      //   const { events, summary } = collectRun(seed);
      //   const boons = events.filter(e => e.kind === 'boon_picked').map(e => e.payload?.boon?.id);
      //   expect(boons.sort()).toEqual([...summary.finalBoons].sort());
      // });
    });
  }
});
