/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function registerPrompts(server) {
  server.prompt(
    'balance/play-run',
    'Preamble and instructions for running an end-to-end game via the engine tools.',
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              'You are playing Usiec Cepra (Slay the Ceper), a Polish highlander roguelike deckbuilder.',
              '',
              'GOAL: Complete a full run (reach the boss and win, or survive as long as possible).',
              '',
              'WORKFLOW:',
              '1. Call `create` with { characterId: "jedrek" } to get a runId.',
              '2. Call `startRun` — you receive the first observation (map screen).',
              '3. At each step: read the observation, consult `getLegalActions`, pick one, call `applyAction`.',
              '4. In battle: play cards or end_turn. On map: travel to next node.',
              '5. After battles: pick a card reward or skip. Visit shops, campfires, events.',
              '6. When `done: true` in the observation, the run is over.',
              '',
              'TERMINOLOGY (Polish → English):',
              '- Krzepa = HP  |  Garda = Block  |  Oscypki = Energy  |  Dutki = Coins',
              '- Góral = Player  |  Ceper = Enemy',
              '',
              'Call `renderText` with style "en" for a human-readable observation at any time.',
              'Call `drainEvents` after each action to see what happened.',
            ].join('\n'),
          },
        },
      ],
    })
  );

  server.prompt(
    'balance/probe-card',
    'A/B template for testing how a specific card change affects win rate.',
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              'You are running a balance probe for a card change in Usiec Cepra.',
              '',
              'SETUP:',
              '- Baseline: current card stats (control group).',
              '- Variant: proposed change (treatment group).',
              '- Run N games with a fixed seed range for both groups.',
              '- Compare: win rate, floor reached, damage taken, dutki earned.',
              '',
              'STEPS:',
              '1. For each seed in the test range:',
              '   a. Create a run with the BASELINE pool override.',
              '   b. Play to completion using HeuristicBot actions.',
              '   c. Record outcome in getRunSummary.',
              '2. Repeat with VARIANT pool override.',
              '3. Compare metrics between groups.',
              '',
              'Use `renderText` style "compact" for efficient token usage during play.',
              'Use `snapshot`/`restore` to branch runs if you need to explore multiple paths.',
              '',
              'REPORT: win_rate_delta, floor_delta, key_battle_stats.',
            ].join('\n'),
          },
        },
      ],
    })
  );

  server.prompt(
    'balance/qa-smoke',
    'QA smoke checklist: verify all screens are reachable and respond correctly.',
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              'Run a QA smoke pass on the Usiec Cepra engine. Check each screen is reachable and legal actions work.',
              '',
              'CHECKLIST:',
              '[ ] map — travel actions exist; travel advances floor',
              '[ ] battle — play_card reduces energy; end_turn triggers enemy turn',
              '[ ] reward — reward_pick_card adds card to deck; skip (null) returns to map',
              '[ ] shop — shop_buy_card deducts dutki; shop_leave returns to map',
              '[ ] campfire — rest heals player; upgrade upgrades a card',
              '[ ] event — event_choice applies effect; returns to map',
              '[ ] maryna — maryna_pick grants boon; moves to map',
              '[ ] terminal — done: true with outcome win or loss',
              '',
              'For each step: call `getObservation`, verify phase, call `getLegalActions`,',
              'pick a legal action, call `applyAction`, assert new phase.',
              '',
              'Report: PASS / FAIL per screen with details on any unexpected behavior.',
            ].join('\n'),
          },
        },
      ],
    })
  );
}
