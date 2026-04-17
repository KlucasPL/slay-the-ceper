# Balancing API, Simulation & Dashboard — Plan

**Status:** Draft. Dependencies approved (§7); ready for Phase A.
**Scope:** expose the game as a headless API, run batch simulations, collect telemetry, power a dashboard that lets the designer balance **every balance-relevant entity** (cards, enemies, relics, boons, events, weather, characters), and surface the engine to external agents (Claude Code, Codex CLI) and a Playwright-driven browser harness.
**Provenance:** synthesized from a two-phase team brainstorm (solo ideation → consolidation → cross-pollinated refinement). Full brainstorm artifacts at `/tmp/slay-brainstorm/` during the session.

---

## 1. Goal and end state

Five capabilities, built on one foundation.

1. **Headless API** — a programmatic surface over the game for scripts and external agents. No browser, no DOM.
2. **Simulation harness** — run 1 / 100 / 10 000 / 100 000 games with varying entity pools, agents, seeds; reproducible from seed; parallelizable across worker threads; emits JSONL telemetry.
3. **Balancing dashboard** — static HTML tool reading an aggregated `metrics.json`. Entity-kind tabs, leaderboards, detail views, paired-A/B lift visualization, patch comparison.
4. **External agent interface** — MCP server **and** JSON-RPC 2.0 stdio server expose the same `EngineController` so Claude Code, Codex CLI, or any MCP/RPC-speaking client can drive runs interactively, probe balance hypotheses, and script QA. No bundled "AI bot" — we ship the surface, the user brings the agent.
5. **E2E browser harness** — `@playwright/mcp` lets those same external agents drive a real production build of the game and the dashboard in a headless browser for end-to-end QA, smoke runs, and visual regression.

End state the designer interacts with: open the dashboard, identify an off-balance entity, edit `src/data/*.js`, run `npm run sim -- --batch <hypothesis>`, inspect the new `metrics.json`, commit if good. Target cycle time: **≤ 5 minutes per balance hypothesis.**

Entity coverage (7 kinds — all first-class):

| Kind      | Data file        | Count today     | Notes                                 |
| :-------- | :--------------- | :-------------- | :------------------------------------ |
| card      | `cards.js`       | ~67             | attack/skill/power; rarity tiers      |
| enemy     | `enemies.js`     | ~15             | regular/elite/boss, phase-2 patterns  |
| relic     | `relics.js`      | ~32             | standard + `eventOnly` + `marynaOnly` |
| boon      | `marynaBoons.js` | ~7              | persistent run buffs                  |
| event     | `events.js`      | 3+              | branching choices                     |
| weather   | `weather.js`     | 4               | `clear`, `halny`, `frozen`, `fog`     |
| character | `characters.js`  | 1 (+Baciar WIP) | distinct starter decks                |

---

## 2. Current state assessment — why this is tractable

The engine is already ~90% headless. This is the load-bearing fact of the whole plan.

- `src/state/` (13 modules) and `src/data/` have **zero** references to `document`, `window`, or `console.log`. CLAUDE.md enforces the rule; the codebase obeys it.
- `GameState` is a facade that delegates to subsystems (`BattleLifecycle`, `CombatEngine`, `DeckManager`, `EnemyState`, `EventSystem`, `MapEngine`, `MarynaSystem`, `NavigationState`, `PlayerState`, `RelicSystem`, `ShopSystem`, `StatusEffects`).
- Existing Vitest tests already drive `GameState` headlessly via direct field pokes — the pattern is proven.
- Card `effect(state)` callbacks mutate only `GameState`; no rendering.

The residual work is additive: a thin controller + event emitter + pool-filter hook, plus a PRNG swap for determinism. **No rewrite. No new dependencies at runtime.**

Known leaks (addressed by the plan):

- 37 `Math.random()` call sites across 15 files (non-determinism by default).
- `characters.js` has no explicit `id` field (`jedrek` is only the map key).
- A handful of one-shot UI-consumption flags (`isInputLocked`, `lansBreakEvent`, `consume*` messages) that headless agents must drain.

---

## 3. Architecture — four-layer extension of the current three

Current:

```
L1  src/data/     pure data
L2  src/state/    game logic, zero DOM
L3  src/ui/       DOM, zero game logic
```

Proposed (additive — zero changes to existing layer contracts):

```
L1   src/data/             pure data                                          (unchanged)
L1.5 src/logic/bots/       in-process bot policies (no LLM)                   (NEW)
L2   src/state/            game logic, zero DOM; gains state.emit + filterPool (small hooks added)
L2.5 src/engine/           headless API facade over state                     (NEW)
L2.6 src/rpc/              JSON-RPC 2.0 stdio server bindings                 (NEW)
L2.6 src/mcp/              MCP server bindings                                (NEW)
L3   src/ui/               DOM                                                (unchanged)

scripts/sim/               batch orchestration; not shipped to browser        (NEW)
scripts/analyze.js         JSONL → metrics.json aggregator                    (NEW)
scripts/rpc-server.js      JSON-RPC 2.0 stdio entry (`npm run rpc`)           (NEW)
scripts/mcp-server.js      MCP stdio entry (`npm run mcp`)                    (NEW)
tools/dashboard/           static HTML dashboard                              (NEW)
bench/                     perf benchmarks                                    (NEW)
tests/engine/              engine-layer tests                                 (NEW)
tests/sim/                 runner tests                                       (NEW)
tests/bots/                bot tests                                          (NEW)
tests/rpc/                 JSON-RPC protocol conformance                      (NEW)
tests/mcp/                 MCP protocol conformance                           (NEW)
tests/e2e/                 Playwright E2E suite, driven via @playwright/mcp   (NEW)
```

**Dependency rules (enforced by code review):**

- `src/engine/` depends on `src/state/` and `src/data/`. Never the reverse.
- `src/logic/bots/` depends on `src/engine/` only. Never `src/state/` directly, never `src/ui/`.
- `src/rpc/` and `src/mcp/` depend on `src/engine/` only. Never `src/state/` directly, never `src/ui/`. Both share `RunRegistry` lifecycle semantics (§3.5).
- `scripts/sim/` depends on `src/engine/` + `src/logic/bots/` + `src/data/`. Outside the shipped app.
- `tools/dashboard/` reads `metrics.json` — zero code dependency on the engine at runtime.
- `tests/e2e/` runs against `npm run preview` (production build) and a static dashboard server. **Never** against the live published GitHub Pages URL.

### 3.1 `src/engine/` module map

```
src/engine/
  EngineController.js      10-method facade (§4.1)
  Observation.js           GameState → Observation (pure projection)
  LegalActions.js          pure computation of legal actions per phase
  ActionDispatcher.js      Action → GameState.* method calls
  EngineEvents.js          state.emit() + drain buffer
  PoolOverrides.js         state.filterPool() + override resolution
  Snapshot.js              serialize/restore GameState + RNG + event buffer
  Rng.js                   seeded PRNG + withSeededRng wrapper
  text/AgentText.js        textual renderer for external agents (pl/en/compact)
  index.js                 barrel export
```

### 3.2 `src/logic/bots/`

```
src/logic/bots/
  RandomBot.js             ~30 lines; fuzz + sanity baseline
  HeuristicBot.js          primary workhorse for balance
  HeuristicBot.constants.js tuning weights (§4.5)
  SearchBot.js             1-ply + optional MCTS; uses EngineController.snapshot/restore
  ReplayBot.js             replays a recorded action log (debug)
```

External agents (Claude Code, Codex CLI, etc.) are deliberately **not** bots. They drive the engine over MCP or JSON-RPC (§3.5); they are not co-located with the engine code and they have no privileged access to internal state.

### 3.3 `scripts/sim/`

```
scripts/sim/
  index.js                 CLI: argv + batch module loader + dispatch
  runOneGame.js            driver loop around EngineController + Bot
  batch.js                 matrix expansion + worker pool
  writer.js                JSONL writer (+ gzip); per-verbosity field filter
  pairing.js               paired-A/B seed scheduling
  batches/
    _baseline.js           canonical baseline used by CI drift gate
  tools/
    diff-baseline.js       compares two metrics.json files
```

### 3.4 `tools/dashboard/`

```
tools/dashboard/
  index.html
  app.js
  views/
    batch-summary.js       View 1
    leaderboard.js         View 2 (generic, parameterized by entity kind)
    entity-detail.js       View 3
    enemy-heatmap.js       View 4
    weather-enemy-matrix.js View 5
    run-replay.js          View 6 (needs full-tier JSONL)
    patch-comparison.js    View 7
  vendor/
    chart.min.js           vendored Chart.js (§7.1)
```

### 3.5 `src/rpc/` and `src/mcp/` — external agent transports

Both transports are thin shells over `EngineController`. Identical method surface; identical Observation/Action/Event payloads. A single source of truth (`methods.js`) feeds both — they cannot drift.

```
src/rpc/
  JsonRpcServer.js         JSON-RPC 2.0 over stdio; LSP-style Content-Length framing
  methods.js               method registry; one entry per EngineController method
  RunRegistry.js           runId → EngineController; idle GC (10 min); 16-run cap
  notifications.js         opt-in engine.events push stream

src/mcp/
  McpServer.js             @modelcontextprotocol/sdk server
  tools.js                 MCP tool definitions; delegates to RunRegistry
  resources.js             metrics.json + batch index as MCP resources
  prompts.js               canned prompts: play-run, probe-card, qa-smoke

scripts/rpc-server.js      `npm run rpc` — stdio JSON-RPC entry point
scripts/mcp-server.js      `npm run mcp` — stdio MCP entry point
```

**Why both**: MCP gives Claude Code / Codex CLI first-class tool-use, resource discovery, and prompt templates. JSON-RPC keeps the surface usable from shell scripts, Python notebooks, and the Playwright fixtures (§3.6) that don't yet speak MCP.

### 3.6 `tests/e2e/` — Playwright via `@playwright/mcp`

```
tests/e2e/
  smoke.spec.js            golden-path: launch `npm run preview`, start run, finish 5 floors
  dashboard.spec.js        load metrics.json fixture, navigate all 7 views, assert key DOM
  a11y.spec.js             axe-core checks on dashboard + main game
  fixtures/
    metrics.fixture.json   small but structurally complete metrics file
playwright.config.js       headless chromium; serves dashboard + game from `npm run preview`
```

Driven via `@playwright/mcp` so the same external agents that play via §3.5 can also exercise the production build and the dashboard end-to-end.

---

## 4. Interface contracts

### 4.1 `EngineController` — 10-method facade

```js
/**
 * @typedef {{ kind: 'card'|'enemy'|'relic'|'boon'|'event'|'weather'|'character', id: string }} EntityRef
 */

class EngineController {
  /**
   * Create a controller bound to a specific run. Does NOT start the loop.
   * @param {{
   *   characterId: string,
   *   startingDeck?: string[],
   *   seed?: string,                                     // hex; deterministic if provided
   *   difficulty?: 'normal'|'hard',
   *   rules?: { skipIntro?: boolean, revealAllPiles?: boolean, disableEvents?: boolean },
   *   pools?: PoolOverrides,                             // §4.3
   *   startingRelics?: string[],
   *   marynaEnabled?: boolean,
   *   forceEnemy?: { regular?: string, elite?: string, boss?: string },
   *   forceEvent?: string | null,
   *   forceWeather?: string | null,
   *   enemyScaleFactor?: number | null,
   * }} opts
   */
  static create(opts) { /* ... */ }

  startRun(): Observation                                  // seeds deck, runs first turn, returns first obs
  getObservation(): Observation                            // fresh immutable snapshot
  getLegalActions(): Action[]                              // (same list is embedded in Observation.legalActions)
  applyAction(action: Action): ActionResult                // { observation, events, done, outcome? }
  endTurn(): ActionResult                                  // convenience for { type: 'end_turn' }
  snapshot(): SerializedRun                                // save; includes RNG + event buffer
  static restore(snap: SerializedRun): EngineController    // byte-identical resume
  drainEvents(): EngineEvent[]                             // clears the buffer
  getRunSummary(): RunSummary | null                       // null until terminal
  seed(hex: string): void                                  // re-seed RNG for MCTS rollouts
}
```

### 4.2 `Action` union (discriminator: `type`)

```ts
type Action =
  // Combat
  | { type: 'play_card'; handIndex: number }
  | { type: 'end_turn' }
  | { type: 'smycz_toggle'; handIndex: number | null } // null = clear selection
  // Map
  | { type: 'travel'; level: number; nodeIndex: number }
  // Reward
  | { type: 'reward_pick_card'; cardId: string | null } // null = skip
  | { type: 'reward_pick_relic'; relicId: string } // when offered
  // Shop
  | { type: 'shop_buy_card'; cardId: string }
  | { type: 'shop_buy_relic'; relicId: string }
  | { type: 'shop_remove_card'; cardId: string }
  | { type: 'shop_leave' }
  // Campfire
  | { type: 'campfire'; option: 'rest' }
  | { type: 'campfire'; option: 'upgrade'; cardId: string }
  | { type: 'campfire'; option: 'leave' }
  // Event / Maryna
  | { type: 'event_choice'; choiceIndex: number }
  | { type: 'maryna_pick'; boonId: string };
```

Legality: every legal action for the current phase is pre-computed in `observation.legalActions`. Bots never recompute. Illegal-action policy: strict throw (bench bots); RPC/MCP transports return a structured `IllegalAction` error (JSON-RPC code `-32001`) so external agents can correct without crashing the run (§4.7).

### 4.3 `PoolOverrides` — generic entity-pool filter

```ts
type PoolFilter = { include?: string[] | null; exclude?: string[] | null; disable?: boolean };

type PoolOverrides = {
  cards?: PoolFilter;
  relics?: PoolFilter;
  boons?: PoolFilter; // disable: true → Maryna offers empty
  events?: PoolFilter; // disable: true → event nodes resolve to 'fight'
  enemies?: { regular?: PoolFilter; elite?: PoolFilter; boss?: PoolFilter };
  weathers?: {
    weights?: Record<'clear' | 'halny' | 'frozen' | 'fog', number>;
    force?: 'clear' | 'halny' | 'frozen' | 'fog' | null;
    forcePerFloor?: Record<number, 'clear' | 'halny' | 'frozen' | 'fog'>;
  };
};
```

Semantics:

- `include: null` → "use all entities passing the existing `{isStarter, eventOnly, tutorialOnly}` core filter."
- `include: [...]` → whitelist. Invalid IDs fail loudly at batch load.
- `exclude: [...]` → applied after include.
- **`exclude` wins over `include`** on conflict.
- Weather uses probability `weights`; override replaces default weights; sum need not be 1 (renormalized).

Implementation: `GameState` gains one helper, `state.filterPool(kind, ids)`, called as a one-liner at 11 existing pick sites (`DeckManager.generateCardRewardChoices`, `ShopSystem.generateShopStock` cards + relic, `RelicSystem.buildAvailableRelicPool`, `EnemyState.pickRandomEnemyDef` regular + elite, `EnemyState.pickFinalBossDef`, `EventSystem.pickRandomEventDef`, `MarynaSystem.rollMarynaChoices`, `MapEngine.rollNodeWeather`, `RelicSystem.generateRelicChoices`). No forked logic — subsystem rules (rarity weights, dedupe, node-type gating) run unchanged on the filtered list.

### 4.4 Event catalog — 25 canonical kinds

Single emitter: `state.emit(kind, payload)`. Envelope added automatically: `{ t, kind, turn, floor, act, seq }` where `seq` is monotonically increasing per run.

Every payload field that references an entity is an `EntityRef = { kind, id }`, never a bare string.

| kind               | tier | emitter location                                  |
| :----------------- | :--- | :------------------------------------------------ |
| `run_started`      | S    | `BattleLifecycle.resetForNewRun`                  |
| `run_ended`        | S    | `BattleLifecycle.captureRunSummary`               |
| `map_generated`    | S    | `MapEngine.generateMap`                           |
| `node_entered`     | S    | `NavigationState.travelTo`                        |
| `weather_entered`  | S    | `NavigationState.setCurrentWeatherFromNode`       |
| `battle_started`   | S    | `BattleLifecycle.resetBattle` / `initGame`        |
| `battle_ended`     | S    | `BattleLifecycle.checkWinCondition` when terminal |
| `phase_transition` | S    | `EnemyState.handleEnemyPhaseTransitions`          |
| `turn_started`     | F    | `CombatEngine.startTurn`                          |
| `turn_ended`       | F    | `CombatEngine.endTurn`                            |
| `card_drawn`       | F    | `CombatEngine.drawCards`                          |
| `card_played`      | S    | `CombatEngine.playCard` (after effect resolves)   |
| `card_skipped`     | F    | `CombatEngine.endTurn` discards                   |
| `card_exhausted`   | F    | card effects that exhaust                         |
| `enemy_move`       | F    | `CombatEngine.applyEnemyIntent`                   |
| `status_applied`   | F    | status mutation in CombatEngine / EnemyState      |
| `shop_opened`      | S    | `ShopSystem.generateShopStock`                    |
| `shop_purchase`    | S    | `ShopSystem.buyItem`                              |
| `event_entered`    | S    | `EventSystem.setActiveEvent`                      |
| `event_resolved`   | S    | `EventSystem.applyActiveEventChoice`              |
| `reward_offered`   | S    | reward-screen construction                        |
| `reward_picked`    | S    | reward acceptance paths                           |
| `campfire_choice`  | S    | campfire resolution path                          |
| `relic_gained`     | S    | `RelicSystem.addRelic`                            |
| `boon_offered`     | S    | `MarynaSystem.rollMarynaChoices`                  |
| `boon_picked`      | S    | `MarynaSystem.pickMarynaBoon`                     |
| `deck_mutation`    | S    | `DeckManager` add/remove/upgrade paths            |

Tier `S` = emitted in `summary` verbosity (default); `F` = `full` only (replay-grade).

### 4.5 `Observation` shape (summary)

Single structured object produced by `EngineController.getObservation()`. Deep-frozen, JSON-serializable. Key top-level fields:

- `phase`, `turn`, `battleTurn`, `floor`, `act`
- `weather: { id, name, description }`
- `player: { hp, maxHp, block, energy, maxEnergy, status, stunned, cardsPlayedThisTurn }`
- `enemy: { id, name, hp, maxHp, block, status, passive, isElite, isBoss, rachunek, ped, intent: { type, name, hits, expectedDamageToPlayer, ...}, upcomingIntents, phaseTwoTriggered }`
- `hand: CardView[]` with precomputed `effectiveCost`, `unplayable`
- `deckCount`, `discardCount`, `exhaustCount` (+ `fullDeck?`, `discardContents?`, `exhaustContents?` when `rules.revealAllPiles`)
- `combat: { firstAttackUsed, activeSide, attackCardsPlayedThisBattle }`
- `run: { character, difficulty, dutki, relics, marynaBoon, cardDamageBonus, acquired: { cards, relics, boons, eventsResolved, weathersEncountered } }`
- `map?`, `activeEvent?`, `shopStock?`, `campfire?`, `marynaOffer?`, `rewardOffer?`
- `legalActions: Action[]` — pre-filtered; every entry guaranteed to apply
- `done`, `outcome`

### 4.6 HeuristicBot tuning constants (starting values)

Locked in `src/logic/bots/HeuristicBot.constants.js`. Values are tuning seeds, not optima — change proposals require ≥1000-seed before/after winrate delta.

```js
export const HEURISTIC_WEIGHTS = {
  statusValue: {
    weak: 3,
    vulnerable: 4,
    fragile: 2,
    strength: 5,
    nextDouble: 8,
    lans: 6,
    dumaPodhala: 4,
    furiaTurysty: 5,
  },
  blockUrgency: { hpDiscount: 0.3, panicThreshold: 0.4 },
  cardScore: {
    damagePerEnergy: 1.0,
    blockPerEnergy: 0.9,
    statusPerEnergy: 1.0,
    drawPerEnergy: 2.5,
    exhaustPenalty: 0.5,
    lethalBonus: 1000,
  },
  mapScore: {
    eliteHealthyHp: 10,
    elitePenaltyLowHp: -20,
    shopIfAffordable: 5,
    campfireLowHp: 15,
    treasure: 8,
    event: 4,
    fight: 2,
  },
  reward: {
    targetDeckSize: 15,
    rareMultiplier: 1.5,
    shopRelicRatio: 0.6,
    shopRemovalStarterThreshold: 10,
  },
  endTurn: { minPositiveScore: 0.5 },
};
```

### 4.7 External agent interfaces (MCP + JSON-RPC)

Both transports wrap a shared `RunRegistry` over `EngineController`. Every method has identical semantics across both surfaces; the schema is generated from a single `methods.js` registry so the two cannot drift.

**JSON-RPC 2.0 (stdio)** — `npm run rpc`. LSP-style `Content-Length` framing.

| method                   | params                                    | result          |
| :----------------------- | :---------------------------------------- | :-------------- |
| `engine.create`          | `EngineController.create` opts (§4.1)     | `{ runId }`     |
| `engine.startRun`        | `{ runId }`                               | `Observation`   |
| `engine.getObservation`  | `{ runId }`                               | `Observation`   |
| `engine.getLegalActions` | `{ runId }`                               | `Action[]`      |
| `engine.applyAction`     | `{ runId, action }`                       | `ActionResult`  |
| `engine.endTurn`         | `{ runId }`                               | `ActionResult`  |
| `engine.snapshot`        | `{ runId }`                               | `SerializedRun` |
| `engine.restore`         | `{ snapshot }`                            | `{ runId }`     |
| `engine.drainEvents`     | `{ runId }`                               | `EngineEvent[]` |
| `engine.getRunSummary`   | `{ runId }`                               | `RunSummary?`   |
| `engine.seed`            | `{ runId, hex }`                          | `null`          |
| `engine.renderText`      | `{ runId, style: 'pl'\|'en'\|'compact' }` | `string`        |
| `engine.subscribe`       | `{ runId }`                               | `null` (stream) |
| `engine.dispose`         | `{ runId }`                               | `null`          |

Server → client notifications (after `engine.subscribe`): `engine.events` carries new entries from the run's event buffer in real time. Engine errors use namespaced JSON-RPC codes: `-32001` IllegalAction, `-32002` UnknownRun, `-32003` RunCapExceeded, `-32004` RunErrored.

**MCP (stdio)** — `npm run mcp`. Built on `@modelcontextprotocol/sdk`.

- **Tools**: 1:1 with the JSON-RPC methods above. Identical input/output schemas; tool name = method name without the `engine.` prefix.
- **Resources**:
  - `balance://metrics/{batchId}` — any committed `metrics.json`
  - `balance://baseline/main` — current main baseline
  - `balance://batches` — index of available batches
  - `balance://run/{runId}/observation` — live observation for the named run (read-through)
- **Prompts**:
  - `balance/play-run` — preamble for an agent expected to drive a full run end-to-end
  - `balance/probe-card` — paired-A/B template for ad-hoc card-balance probing
  - `balance/qa-smoke` — checklist-style QA pass over a candidate build

**RunRegistry invariants** (both transports):

- Opaque `runId` (UUID v4); never expose underlying object handles.
- Idle GC: runs untouched > 10 min are disposed; clients receive `UnknownRun` on next call.
- Hard cap: 16 concurrent runs per process; `RunCapExceeded` returned when full.
- Crash isolation: a thrown error in `applyAction` marks the run `errored: true` but does not kill the server; client may `dispose` and `create` a fresh run.
- No filesystem or network surface from agent calls. Agents read `metrics.json` only via the explicit `balance://` resources.

### 4.8 `BatchConfig` — runner input

```js
/**
 * @typedef {{
 *   schemaVersion: 2,
 *   name: string,
 *   games?: number,                              // mutually exclusive with matrix+gamesPerCell
 *   gamesPerCell?: number,
 *   seedStart?: number,                          // default 1
 *   seeds?: number[],                            // explicit override
 *   character: string,
 *   difficulty?: 'normal'|'hard',
 *   agent: BotFn,
 *   agentParams?: Record<string, unknown>,
 *   startingDeck?: string[] | ((character: string) => string[]),
 *   startingRelics?: string[],
 *   marynaEnabled?: boolean,
 *   enemyScaleFactor?: number | null,
 *   forceEnemy?: { regular?: string, elite?: string, boss?: string },
 *   forceEvent?: string | null,
 *   forceWeather?: string | null,
 *   pools?: PoolOverrides,
 *   matrix?: Record<string, unknown[]>,
 *   paired?: { entity: EntityRef, mode: 'include_vs_exclude' },
 *   verbosity?: 'off'|'summary'|'full',          // default 'summary'
 *   output?: { path?: string, compress?: boolean },
 *   workers?: 'auto' | number,
 *   timeoutMs?: number,                          // default 5000
 * }} BatchConfig
 */
```

Worker seed partitioning: seed `S` runs on worker `W = ((S - seedStart) mod workerCount)`. Paired siblings (A and B for the same `S`) share the same worker.

### 4.9 Paired A/B sims

`--paired <kind>:<id>` (e.g., `--paired relic:flaszka_sliwowicy`) runs each seed **twice**: one run with the entity forced present, one with it forced absent. Analytics computes lift:

```
liftPp = (presentWins − absentWins) / pairs
CI via paired bootstrap (2000 resamples)
sampleTier from pair count, not run count (green ≥ 2000 pairs, yellow 500–2000, red < 500)
```

Paired-inject wins over batch-level pools for the paired entity only. Broken pairs (half crashed) are marked `pairStatus: 'broken'` and excluded from lift estimation but counted in diagnostics.

Per entity kind:

| kind    | World A (forced present)                                        | World B (forced absent)                             |
| :------ | :-------------------------------------------------------------- | :-------------------------------------------------- |
| card    | starter deck appends id; `pools.cards.exclude` prevents rerolls | `pools.cards.exclude` subtracts id                  |
| relic   | `startingRelics` has id; `pools.relics.exclude` prevents reroll | `pools.relics.exclude` has id                       |
| boon    | `marynaEnabled: true`; Maryna offer forced-contains id          | `pools.boons.exclude` has id                        |
| event   | `forceEvent: id` at first event node                            | `pools.events.exclude` has id                       |
| weather | `forceWeather: id`                                              | `pools.weathers.weights` zeros out id, renormalizes |
| enemy   | `forceEnemy.<tier> = id` at first fight node                    | `pools.enemies.<tier>.exclude` has id               |

### 4.10 JSONL output — per tier

One line per game. All tiers carry: `schemaVersion: 2`, `batch`, `gitSha`, `configHash`, `poolOverridesHash`, `cell`, `pairKey?`, `world?`, `pairStatus?`, `seed`, `agent`, `agentParams`, `character`, `difficulty`, `poolOverrides`, `outcome`, `floorReached`, `turnsPlayed`, `totalDutkiEarned`, `hpAtDeath`, `maxHpAtDeath`, `survivalScore`, `killerEnemyId`, `killerName`, `finalDeck`, `finalRelics`, `finalBoons`, `durationMs`, `errorStack?`.

`survivalScore = floorReached + hpAtDeath / maxHpAtDeath` — always in `[floor, floor+1]`. Ranks runs that died on the same floor by HP margin and carries a real signal even when `winrate = 0`.

- `off` — only the fields above. ~1-2 KB/game. CI hash gate + smoke.
- `summary` (default) — adds `battles[]` per-battle summaries + filtered `entityEvents[]` (acquisitions + battle boundaries) + counter rollups. ~6 KB/game. Balance runs + nightly.
- `full` — adds unfiltered `entityEvents[]` (all S + F kinds) + optional `agentTrace[]`. ~180 KB/game. Replay debug.

Storage: 100k games summary gzipped ≈ 60 MB. Ships as GitHub Actions artifact.

### 4.11 `metrics.json` — canonical committed artifact

Structure (simplified):

```
{
  schemaVersion: 1,
  batchId, batchName, gitSha, runCount, dateRun,
  configHash, poolOverridesHash,
  agentMix: { heuristic: 5000, random: 1000 },
  agentStats: {
    heuristic: { runCount, winrate: RateCi, avgFloorReached: MeanCi, avgSurvivalScore: MeanCi },
    random:    { runCount, winrate: RateCi, avgFloorReached: MeanCi, avgSurvivalScore: MeanCi },
  },
  agentDivergence: {
    agents,                 // number of agents with ≥1 run
    winrateStdDev,          // stddev of per-agent winrate
    winrateSpread,          // max − min winrate across agents
    winrateMin, winrateMax,
    floorStdDev, floorSpread,
    survivalScoreStdDev, survivalScoreSpread,
  },
  overall: {
    winrate: RateCi,
    avgFloorReached: MeanCi, avgTurnsPlayed: MeanCi, avgDutkiEarned: MeanCi,
    avgHpAtDeath: MeanCi, avgSurvivalScore: MeanCi,
    floorReached: Distribution,   // mean + p10 / p50 / p90 / max
    turnsPlayed: Distribution,
    dutkiEarned: Distribution,
    hpAtDeath: Distribution,
    survivalScore: Distribution,
  },
  bySlice: { 'jedrek/normal/1': PerSliceStats, ... },
  byEntity: {
    'card:ciupaga': CardPerEntityStats,
    'enemy:cepr': EnemyPerEntityStats,
    'relic:flaszka_sliwowicy': RelicPerEntityStats,
    'boon:zloty_rozaniec': BoonPerEntityStats,
    'event:karykaturzysta': EventPerEntityStats,
    'weather:fog': WeatherPerEntityStats,
    'character:jedrek': CharacterPerEntityStats,
    ...
  },
  synergyMatrix: { topK: 5, pairs: { [ref]: { topSynergies, topAntiSynergies } } },
  archetypes?: { definitions, runCount },
  diagnostic: { ciMethodology, sampleTierThresholds, belowMinSample,
                brokenPairs, schemaDrift, coverage, overallFloorVariance },
}
```

Per-entity baseline fields: `offeredCount`, `acquiredCount`, `runsWithEntity`, `runsWithoutEntity`, `pickRate`, `winrateWithEntity`, `winrateWithout`, `winrateLiftPp`, `liftCi`, `matchedPairCount`, `pairedLift?`, `avgFloorReachedWith`, `avgFloorReachedWithout`, `floorReachedLift`, `floorReachedLiftCi`, `bySlice`, `acquisitionSources`, `sampleTier`, `synergy?`.

Pick-rate strategy is per-kind. Cards and events use `acquiredCount / offeredCount` because the pick decision is observable. Relics and boons use `acquiredCount / runCount` because they are frequently granted without an explicit offer event (boss reward, scripted event grant); the rate is bounded ≤ 1. Enemies, weather and characters carry `pickRate: null` — there is no pick decision to measure.

Per-kind extensions: card adds `avgPlaysPerBattle` and `damagePerEnergy`; enemy adds `avgTurnsToKill` (null when no kills or zero turn data), `byFloor: Record<floor, { wins, total, winrate }>` and `byWeather: Record<weather, { wins, total, winrate }>`.

Marginal lift (`winrateWithout`, `winrateLiftPp`, `liftCi`, `avgFloorReachedWithout`, `floorReachedLift`) is computed against the global without-entity population — every entity always carries a non-null lift signal, even without paired sims. When paired sims are present, the paired bootstrap CI on `pairDeltas` replaces the marginal two-proportion CI for cleaner attribution.

`agentDivergence` quantifies how much different bots disagree on the same build's difficulty. When all bots have the same winrate but very different `avgFloorReached`, the floor-spread / stddev values surface that tension — especially valuable as the "blindness" signal per §7.2.2 (bots play suboptimally → bad cards look good). Batch Summary renders these as a dedicated card above the agent-mix chart.

File size: ~200-400 KB per batch. Text-diffable, git-friendly. A year of weekly batches ≈ 20 MB.

**Both the raw batch config and the resolved `poolOverrides` are hashed** (`configHash`, `poolOverridesHash`). The Patch Comparison dashboard view refuses to diff batches with mismatched residual pool configs — prevents the diff from lying.

---

## 5. Phased implementation roadmap

Each phase is a set of PRs with clear acceptance criteria. All non-runtime dependencies (Chart.js, MCP SDK, Playwright) are pre-approved (§7), so phase boundaries depend only on engineering work.

### Phase A — "It runs headless" (~1 week of focused work)

Goal: prove the architecture. End with a Node script that runs a full game from seed to terminal state.

1. `src/engine/Rng.js` — mulberry32 + `withSeededRng(seed, fn)` (~11 lines of PRNG, ~20 lines of wrapper).
2. `src/engine/EngineEvents.js` — emit + drain + seq counter.
3. `src/engine/PoolOverrides.js` — `state.filterPool(kind, ids)` + override resolution.
4. Sprinkle `state.emit()` calls at ~15 mutation sites across subsystems.
5. Sprinkle `state.filterPool(...)` one-liners at the 11 pick sites.
6. `src/engine/LegalActions.js` + `src/engine/ActionDispatcher.js` — dispatch table for all 14 action kinds.
7. `src/engine/Observation.js` — projection from `GameState` to `Observation`.
8. `src/engine/EngineController.js` — 10-method facade.
9. `src/engine/Snapshot.js` — serialize/restore (includes RNG + event buffer + `run.acquired`).
10. `src/logic/bots/RandomBot.js` — ~30 lines.
11. `scripts/sim/smoke.js` — end-to-end RandomBot run until terminal, assert `outcome ∈ {player_win, enemy_win}`.
12. Add `id: 'jedrek'` to `characters.js`.
13. `tests/dataExports.test.js` — invariant: `libraryKey === entity.id` for every library.
14. `tests/engine/determinism.test.js` — 20 seeds, byte-identical JSONL across two runs.
15. `tests/engine/nondeterminism-sources.test.js` — scanner forbidding `Date.now` / `performance.now` / `crypto.getRandomValues` / `setTimeout` / `setInterval` in `src/state/**` and `src/data/**`.
16. `tests/engine/event-consistency.test.js` — replay 5 seeded runs; reconstruct final deck / relics / boons from event stream; assert equal to live-state final inventory. Plus invariants: `run_started` exactly once; `run_ended` exactly once; `battle_started` precedes first `card_played`; `seq` strict-monotonic.

**Phase A exit gate:** steps 11, 14, 15, 16 all pass. The smoke script prints a valid `RunSummary`.

### Phase B — "It produces balance-useful data"

Goal: first balance insights.

17. `src/logic/bots/HeuristicBot.js` + `HeuristicBot.constants.js` + pinned-output fixtures in `tests/bots/`.
18. `scripts/sim/runOneGame.js` — driver loop around `EngineController` + Bot (~80 lines).
19. `scripts/sim/writer.js` — JSONL (+ optional gzip) writer with per-verbosity field filtering.
20. `scripts/sim/index.js` — CLI.
21. `scripts/sim/batch.js` — sequential first, then `node:worker_threads` with range-partitioning.
22. `scripts/sim/batches/_baseline.js` — canonical batch config.
23. `scripts/analyze.js` — JSONL → `metrics.json` aggregator (pure function).
24. `bench/runOneGame.bench.js` + `npm run bench:sim`. Acceptance: RandomBot ≥ 500 games/sec, HeuristicBot ≥ 200 games/sec, 4-worker speedup ≥ 3.0×, p99 ≤ 10ms.
25. `tools/dashboard/` — Views 1 (Batch Summary), 2 (Leaderboard), 3 (Entity Detail). Using vendored chart lib (§10).

**Phase B exit gate:** 10k-run HeuristicBot baseline produces a `metrics.json`; dashboard opens it and renders the 3 views.

### Phase C — "It detects regressions and surfaces corners"

Goal: balance workflow operates at target cycle time (≤ 5 min).

26. `src/logic/bots/SearchBot.js` — 1-ply default, optional MCTS (N=50). Uses `EngineController.snapshot/restore`.
27. `scripts/sim/pairing.js` + `--paired <kind>:<id>` CLI flag.
28. `scripts/sim/tools/diff-baseline.js` — compares two `metrics.json` files; emits markdown diff table.
29. `baselines/main.metrics.json` committed. `baselines/thresholds.json` with drift thresholds.
30. CI balance-drift gate — PR label `balance-check` triggers 5k-game run + diff-baseline; blocks on drift above thresholds with p < 0.01.
31. `tools/dashboard/` — Views 4 (Enemy Heatmap), 5 (Weather × Enemy Matrix), 7 (Patch Comparison).
32. Baseline refresh workflow — PR label `baseline-update` regenerates `baselines/main.metrics.json`.

**Phase C exit gate:** a deliberate balance change (e.g., "nerf fog miss rate") passes through the full loop: edit → sim → analyze → diff → commit, in ≤ 5 minutes.

### Phase D — "External agents, E2E, and polish"

Goal: open the engine to external agents (Claude Code, Codex CLI), cover the production build E2E, and finish operational polish.

33. `src/rpc/` — JSON-RPC 2.0 stdio server + `RunRegistry` + the 14 methods in §4.7. `npm run rpc`.
34. `src/mcp/` — MCP server with the same surface as item 33, plus `balance://` resources and three canned prompts. `npm run mcp`.
35. `src/engine/text/AgentText.js` — Polish + English + compact renderers; consumed by both transports via `engine.renderText`.
36. `tests/rpc/` + `tests/mcp/` — protocol conformance: a scripted scenario runs through both transports and asserts byte-identical Observation and event payloads.
37. `tests/e2e/` via `@playwright/mcp` — golden-path smoke against `npm run preview` (game) + dashboard navigation across all 7 views against a fixture metrics file + axe-core a11y. CI workflow `e2e.yml` triggers on changes under `tools/dashboard/**`, `src/ui/**`, or `src/engine/**`.
38. `docs/agent-interface.md` — how to point Claude Code / Codex CLI at `npm run mcp`; example sessions for "play a run", "probe a card", "QA-smoke a build".
39. `src/logic/bots/ReplayBot.js` + action-log replay tooling.
40. `tools/dashboard/` — View 6 (Run Replay) — reads `full`-tier JSONL.
41. Full `Math.random()` → `state.rng` codemod across `src/state/` and `src/data/`. Drop `withSeededRng()` swap. Enforce via lint rule.
42. Nightly 50k-game cron + historical trend dashboard.
43. Human-run corpus — replay exporter from the real game (localStorage → JSON); 20-50 calibration runs; KL divergence between HeuristicBot and human action distributions.
44. Archetype clustering for richer metrics (optional).

---

## 6. Key design decisions (with rationale)

### D1 — Seeded RNG via `Math.random` swap (not a codemod)

Adopt `withSeededRng(seed, fn)` that saves `Math.random`, replaces it with mulberry32(seed) for the duration, restores on exit. Zero source edits.

_Rationale:_ covers all 37 call sites atomically; ships in a day; fully reversible. The codemod is a Phase D cleanup, gated by the `nondeterminism-sources` lint so no new offenders land in the meantime.

### D2 — Events emitted by subsystems in-place, not centralized

Each mutation site in `ShopSystem`, `RelicSystem`, `MarynaSystem`, `EventSystem`, `DeckManager`, `BattleLifecycle`, `CombatEngine`, `NavigationState` calls `state.emit(kind, payload)` directly.

_Rationale:_ narrower blast radius than an interceptor. Event-consistency test (step 16) protects against silent mutations.

### D3 — Single `getObservation()` with a text renderer side-helper

No tiered observations. External agents call both `engine.getObservation` (for legality check) and `engine.renderText` (for a token-friendly text projection) over MCP/RPC.

_Rationale:_ one code path is testable; Tier 2 "filtered" was a non-goal optimization.

### D4 — Pool overrides via `state.filterPool(kind, ids)` one-liner

One helper on `GameState`; 11 one-liner insertions at existing pick sites.

_Rationale:_ preserves all existing subsystem logic (rarity weights, dedupe, node-type gating); no forked code paths.

### D5 — Bots in `src/logic/bots/`, not `scripts/sim/agents/`

Adjacent to `AudioManager` (same L1.5 tier — no DOM, no game-logic mutation except via controller).

_Rationale:_ reusable between CLI sims and browser DebugOverlay (watch-a-bot demos); normal Vitest test location.

### D6 — `metrics.json` as the committed baseline, not raw JSONL

JSONL is a transient CI artifact. `metrics.json` is git-friendly (text, ~300 KB) and drives both the dashboard's Patch Comparison view and the CI drift gate via the same file.

_Rationale:_ one artifact for humans and CI; human-reviewable diffs in PRs.

### D7 — Summary tier is the default; full tier is replay-only

Dashboard + analytics need acquisitions + battle-boundary events + per-battle summaries — not per-draw or per-status-application.

_Rationale:_ 6 KB/game vs. 180 KB/game; full-tier only for debug sessions.

### D8 — Hidden info mirrors human experience by default (`revealAllPiles: false`)

RandomBot, HeuristicBot, and external agents (via MCP/RPC) don't see pile contents during battle. SearchBot sets `rules.revealAllPiles: true` because MCTS rollouts need the real prior; the tradeoff ("SearchBot winrate is ceiling with perfect info") is documented, not hidden.

_Rationale:_ prevents inflated winrates that don't transfer to human play. HeuristicBot is the workhorse for balance; its numbers must match human experience.

---

## 7. Dependencies (user-approved)

All three additions are pre-approved. Recorded here for traceability and CLAUDE.md compliance.

### 7.1 Chart.js — vendored for the dashboard

Vendored as `tools/dashboard/vendor/chart.min.js` (~60 KB gzipped). Declarative API, stable, zero perf concern at our data scale. Used by Phase B Views 1–3 and Phase C Views 4, 5, 7.

### 7.2 `@modelcontextprotocol/sdk` — for the MCP server

Anthropic's official MCP SDK. Single import in `src/mcp/McpServer.js`. Powers Phase D item 34 (MCP transport). Stable schema; semver-tracked.

### 7.3 `@playwright/mcp` + `@playwright/test` — for E2E

Drives a headless Chromium against `npm run preview` (production build of game) and the dashboard served as a static site. Used by `tests/e2e/` (§3.6) and exposed to external agents that want to drive the live UI. Browsers are downloaded on demand by Playwright; not committed.

---

## 8. Risks and mitigations

| Risk                                                               | Mitigation                                                                                                                        |
| :----------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| Bots play suboptimally → bad cards look good, good cards look weak | Multi-agent consensus (Random + Heuristic + Search). Report `SearchBot_vs_HeuristicBot` divergence as "blindness" signal.         |
| Optimizing for bot winrate ≠ fun for humans                        | Designer playtests on every major patch. "Boring-run counter" metric (% battles decided by turn 2).                               |
| Simpson's paradox hides slice-specific imbalances                  | Dashboard always renders slice breakdowns next to aggregates. Lift positive in ≥ 2 of 3 characters rule before acting.            |
| Survivorship bias inflates late-game entity stats                  | Lift conditional on `offeredCount`, not `acquiredCount`. `reward_offered` / `boon_offered` events exist for exactly this.         |
| Entity ID renamed silently breaks longitudinal stats               | `aliases: [oldId]` field required on renames. `dataExports.test.js` invariant: library key === entity id.                         |
| New `Math.random()` / `Date.now()` sneaks into state/data layer    | `nondeterminism-sources.test.js` scanner in CI, starting from Phase A.                                                            |
| JSONL drift between engine version and analyzer version            | `metrics.json.diagnostic.schemaDrift.unknownEventKinds` surfaces mismatched runs. `configHash` prevents invalid Patch Comparison. |
| MCP/RPC server holds runs forever / OOMs the host                  | `RunRegistry` idle GC (10 min) + 16-run hard cap; opaque runIds; no filesystem or network surface from agent calls.               |
| Playwright suite mistakenly hits the live deploy                   | `tests/e2e/` runs only against `npm run preview` and a static dashboard server; assertions reject any URL not on `localhost`.     |
| Character 2 (Baciar) ships; pipeline needs to adapt                | Character onboarding = data-only edit (`characters.js` + optional starter deck). Matrix sweeps pick it up automatically.          |
| Dashboard maintenance tax                                          | 7-view ceiling. Each view must survive "would I open this next patch?" test.                                                      |
| `withSeededRng` leaks `Math.random` override on throw              | `try/finally` in the wrapper. Tested in `determinism.test.js`.                                                                    |

---

## 9. Acceptance criteria summary

| Gate                                      | Criterion                                                                                                                                                              |
| :---------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase A done                              | Smoke script exits 0 with valid `RunSummary`; 4 engine tests pass; `characters.js` has explicit `id`.                                                                  |
| Phase B done                              | 10k-run HeuristicBot baseline → `metrics.json`; dashboard opens 3 views and renders the leaderboard.                                                                   |
| Phase C done                              | One real balance change completes the 6-step workflow in ≤ 5 minutes.                                                                                                  |
| Perf benchmark                            | RandomBot ≥ 500 g/s; HeuristicBot ≥ 200 g/s; 4-worker speedup ≥ 3.0×; p99 ≤ 10ms.                                                                                      |
| Determinism (always on)                   | 20-seed byte-identical JSONL, in CI on every PR.                                                                                                                       |
| Event consistency (always on)             | 5-seed replay reconstructs inventory from events, in CI on every PR.                                                                                                   |
| No non-determinism regression (always on) | Scanner finds no forbidden calls in `src/state/` + `src/data/`, in CI on every PR.                                                                                     |
| CI balance drift (label-triggered)        | 5k-game baseline runs in ~30s; drift outside thresholds blocks PR.                                                                                                     |
| Phase D agent interface                   | An external Claude Code session connects to `npm run mcp`, plays a full run start to terminal, and reads a `metrics.json` resource — without engine-side code changes. |
| Phase D E2E (Playwright)                  | `tests/e2e/` green in CI: smoke run against `npm run preview` reaches ≥ floor 3; dashboard fixture loads all 7 views; axe-core finds no critical violations.           |

---

## 10. Decisions and remaining confirmations

Dependency approvals are settled (§7): Chart.js, `@modelcontextprotocol/sdk`, `@playwright/mcp` + `@playwright/test`. No bundled LLM bot — external agents (Claude Code, Codex CLI) drive the engine via MCP/JSON-RPC instead.

Outstanding confirmations:

1. **Roadmap priority.** Phase A → B → C is the recommended order. Phase D (external agent interface, E2E) can pick up in parallel by a different contributor if desired.
2. **Plan location.** This document lives at `docs/balancing-api-plan.md`; it's the spec the team works from.

Everything else is decided. Implementation can start on Phase A.

---

## Appendix — Brainstorm provenance

This plan was produced by a 4-specialist team (architect, sim-engineer, agent-designer, analytics-lead) using a structured brainstorming process:

1. **Phase 1 — solo ideation.** Each specialist produced a deep analysis of their area independently (no cross-talk), per the research finding that group brainstorming underperforms individuals working alone by ~83% (Mullen et al., 1991). Outputs: 4 markdown files, ~142 KB total.
2. **Phase 1 consolidation.** The team lead read all four deliverables, identified 10 strong agreements, 8 open questions requiring resolution, 7 unowned gaps, and wrote a consolidated brief.
3. **Phase 2 — cross-pollinated refinement.** Each specialist received the consolidation, read the adjacent specialists' Phase 1 where interfaces touched, and revised their deliverable — locking contracts, adopting or pushing back on decisions, and closing their assigned gaps. Outputs: 4 refined markdowns, ~124 KB total.
4. **Final synthesis.** This document — not a copy-paste of Phase 2 deliverables but a coherent plan with one voice, concrete contracts, and an actionable roadmap.

Techniques applied across the brainstorm: First Principles Thinking, Abstraction Laddering, SCAMPER, TRIZ-style contradictions, Reverse Brainstorming ("how could our simulation framework silently produce wrong stats?"), Analogical Reasoning (chess engines, RL gyms, poker solvers, sabermetrics), Starbursting, and Six Thinking Hats for evaluation.
