# Balancing Toolchain — Usage Guide

This guide covers the simulation harness, analysis pipeline, benchmarking, and the balancing dashboard introduced in the `feat/balancing-api` branch.

## Prerequisites

```bash
npm install          # install all dependencies
npm run dashboard:vendor  # copy Chart.js into tools/dashboard/vendor/ (one-time)
```

---

## Quick start: smoke test

Run a single deterministic game to verify the stack end-to-end:

```bash
npm run sim:smoke
```

Exits 0 on success, prints a one-line summary. Run this after any change to the engine or bots to catch regressions quickly.

---

## Running simulations: `npm run sim`

```bash
node scripts/sim/index.js [options]
```

Or via the shorthand:

```bash
npm run sim -- [options]
```

### Options

| Flag                             | Default       | Description                                                                            |
| :------------------------------- | :------------ | :------------------------------------------------------------------------------------- |
| `--games <n>`                    | batch default | Number of games to run                                                                 |
| `--seed <n>`                     | batch default | Starting seed (games run seeds `n` to `n+games-1`)                                     |
| `--agent <name>`                 | `heuristic`   | Bot strategy to use (see Agents below)                                                 |
| `--agentParams <json>`           | `{}`          | JSON object passed to the bot factory (e.g. `'{"mctsN":20}'`)                          |
| `--scenario <name>`              | —             | Load a named seed set from `scripts/sim/scenarios/`                                    |
| `--batch <path>`                 | `_baseline`   | Path to a batch config module                                                          |
| `--paired <kind>:<id>`           | —             | Paired A/B run: include vs exclude entity (kinds: card/relic/boon/event/weather/enemy) |
| `--workers auto\|<n>`            | `auto`        | Worker thread count                                                                    |
| `--verbosity off\|summary\|full` | `summary`     | Output verbosity                                                                       |
| `--out <path>`                   | stdout        | Write JSONL results to file                                                            |

### Agents

| Name          | Archetype                                                               |
| :------------ | :---------------------------------------------------------------------- |
| `heuristic`   | Balanced greedy policy (default baseline)                               |
| `random`      | Uniform random action picker                                            |
| `aggressive`  | Glass-cannon: max damage, ignores block                                 |
| `defensive`   | Tank: prioritises block and healing                                     |
| `status`      | Status-synergy: maximises weak/vulnerable/strength                      |
| `greedy`      | Big-deck: aggressively acquires cards (targetDeckSize 25)               |
| `minimalist`  | Thin-deck: refuses most rewards (targetDeckSize 10)                     |
| `economy`     | Economy-curve: heavy weight on shop and treasure nodes                  |
| `berserker`   | All-attack, status-heavy damage dealer                                  |
| `draw-engine` | Maximises card draw / scry / upgrades                                   |
| `elitist`     | Risk-taker: routes through elites for better rewards                    |
| `search`      | 1-ply lookahead: snapshot/apply/eval via HeuristicBot scorer            |
| `search-mcts` | MCTS rollouts: `--agentParams '{"mctsN":20}'` tunes rollouts per action |

Search-based agents need the engine for snapshot/restore, so they pay a
per-action cost (≈0.4 s/game for `search`, ≈1.3 s/game for `search-mcts`
with `mctsN=5`). Use them as a "strong bot" reference when comparing against
`heuristic` to detect heuristic blindness (good cards the scripted bot
ignores). Divergence between bots shows up in `metrics.json` under
`agentDivergence`.

### Examples

```bash
# 100 games with the aggressive bot
npm run sim -- --games 100 --agent aggressive

# Run the curated tester corpus with the defensive bot
npm run sim -- --scenario tester-corpus --agent defensive

# Paired A/B test: measure lift from a specific relic
npm run sim -- --games 500 --paired relic:bilet_tpn --out metrics/bilet_tpn.jsonl

# 1-ply SearchBot — strong policy, slow but signal-rich
npm run sim -- --games 1000 --agent search --out metrics/search.jsonl

# MCTS with 20 rollouts per action — even stronger, much slower
npm run sim -- --games 500 --agent search-mcts --agentParams '{"mctsN":20}'

# Lans archetype — prefers lans-tagged cards and raises damage threshold
npm run sim -- --games 1000 --agent lans --out metrics/lans.jsonl

# Rachunek archetype — races enemy bankruptcy instead of HP
npm run sim -- --games 1000 --agent rachunek --out metrics/rachunek.jsonl
```

### Memory for large batches

The default Node heap (~4 GB on 64-bit hosts) is fine up to a few thousand
games but will OOM on 25k-game batches with full-verbosity JSONL. Raise the
old-generation cap via `NODE_OPTIONS` before running the sim:

```bash
# 25k games at summary verbosity — raise to 8 GB
NODE_OPTIONS=--max-old-space-size=8192 npm run sim -- --games 25000

# 10k games of search-mcts with full verbosity — 12 GB is safer
NODE_OPTIONS=--max-old-space-size=12288 \
  npm run sim -- --games 10000 --agent search-mcts --verbosity full
```

Workers inherit `NODE_OPTIONS`, so the cap applies to each parallel worker.

---

## Scenarios

Scenarios are named seed sets for reproducible testing across different game configurations. Built-in scenarios live in `scripts/sim/scenarios/`.

### Built-in: `tester-corpus`

40 hand-curated seeds covering:

- Seeds 1–10: general variety
- Seeds 11–20: elite-heavy paths
- Seeds 21–30: easy/favourable starts
- Seeds 31–40: hard/punishing seeds

```bash
npm run sim -- --scenario tester-corpus --agent heuristic --out metrics/corpus.jsonl
```

### Custom scenarios

Create a file exporting a scenario object:

```js
// my-scenario.js
export default {
  name: 'my-scenario',
  description: 'Seeds that triggered a specific balance issue.',
  seeds: [42, 137, 501, 999],
};
```

Then load by file path:

```bash
npm run sim -- --scenario ./my-scenario.js --agent heuristic
```

---

## Analyzing results: `npm run analyze`

Convert a JSONL run output to a structured metrics file:

```bash
node scripts/analyze.js metrics/run.jsonl metrics/run.metrics.json
# or pipe:
npm run sim -- --games 1000 | node scripts/analyze.js > metrics/run.metrics.json
```

The output `metrics.json` contains:

- Overall winrate with bootstrap 95% CI
- Overall avg HP-at-death + survival score (`floor + hpAtDeath/maxHp`) — usable signal when winrate is 0
- Per-agent breakdown (`agentStats`) + cross-agent divergence (`agentDivergence`: winrate / floor / survival stddev & spread)
- Per-entity pick rates, winrate with/without, lift in percentage points + CI
- Per-entity avg floor reached with/without + floor lift (replaces winrate lift when every run dies)
- Per-enemy `byFloor` and `byWeather` as `{wins, total, winrate}` cells — dashboard surfaces as kill-rate heatmap
- Sample tier indicator (green ≥ 2000 games, yellow ≥ 500, red < 500)

### Comparing against baseline

```bash
node scripts/sim/tools/diff-baseline.js metrics/run.metrics.json baselines/main.metrics.json
```

Prints a markdown table of drift per entity. Exit code 1 if any metric exceeds the thresholds in `baselines/thresholds.json` (winrateDrift ≤ 0.02, liftPpDrift ≤ 0.03, pickRateDrift ≤ 0.10).

---

## Benchmarking: `npm run bench:sim`

```bash
npm run bench:sim
```

Runs 200-sample throughput measurement for RandomBot and HeuristicBot. Acceptance targets:

| Bot          | Target          |
| :----------- | :-------------- |
| RandomBot    | ≥ 500 games/sec |
| HeuristicBot | ≥ 200 games/sec |

Results print to stdout. No file output — re-run to compare before/after changes.

---

## Dashboard

The balancing dashboard is a static HTML app that visualises `metrics.json` output.

### Setup

```bash
npm run dashboard:vendor   # one-time: copies Chart.js into tools/dashboard/vendor/
npx serve tools/dashboard  # serve locally
# or
python3 -m http.server 8080 --directory tools/dashboard
```

Open `http://localhost:8080`.

### Loading data

- **Fixture data** loads automatically on open (`metrics.fixture.json`).
- **Drop a file** — drag any `metrics.json` onto the page.
- **File picker** — use the load button in the top bar.

### Views

| View          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
| Batch Summary | Overall winrate CI, agent mix, winrate-by-floor-slice, sample tier badge     |
| Leaderboard   | Per-entity table: pick rate, WR with/without, lift pp + CI, sortable columns |
| Entity Detail | Drill-in view: by-floor-slice breakdown, acquisition sources, per-kind stats |
| Paired Lift   | A/B comparison chart: lift distribution and significance for paired runs     |
| Win Path      | Heatmap of which floors and node types appear in winning vs losing runs      |
| Run Replay    | Step-through replay of a recorded game from a JSONL action trace             |

### Updating the fixture

After a significant balance change, regenerate the fixture to keep the dashboard realistic:

```bash
npm run sim -- --games 200 --out /tmp/fixture.jsonl
node scripts/analyze.js /tmp/fixture.jsonl tools/dashboard/metrics.fixture.json
```

---

## Baseline management

The canonical baseline lives in `baselines/main.metrics.json`. To update it:

1. Apply the PR label `baseline-update`.
2. The CI workflow regenerates the baseline from a 10k-game batch and opens a bot PR.

To check drift locally before pushing:

```bash
npm run sim -- --games 5000 --out /tmp/candidate.jsonl
node scripts/analyze.js /tmp/candidate.jsonl /tmp/candidate.metrics.json
node scripts/sim/tools/diff-baseline.js /tmp/candidate.metrics.json baselines/main.metrics.json
```

---

## CI workflows

### Balance-check gate (`balance-check` label)

Applying the PR label `balance-check` triggers `.github/workflows/balance-check.yml`:

1. Checks out the branch and runs `npm ci`.
2. Runs a 5k-game `_baseline` batch → `metrics/candidate.jsonl`.
3. Analyzes to `metrics/candidate.metrics.json`.
4. Diffs against `baselines/main.metrics.json` using `diff-baseline.js`.
5. Posts a markdown summary as a PR comment.
6. Exits non-zero if any metric exceeds the thresholds in `baselines/thresholds.json`.

### Baseline refresh (`baseline-update` label)

Applying the PR label `baseline-update` triggers `.github/workflows/baseline-update.yml`:

1. Runs a 10k-game `_baseline` batch.
2. Overwrites `baselines/main.metrics.json` with the new metrics.
3. Commits and pushes the updated baseline via a bot PR.

### E2E suite (`e2e.yml`)

Runs automatically on push when any of these paths change:

- `tools/dashboard/**`
- `src/ui/**`
- `src/engine/**`
- `tests/e2e/**`
- `playwright.config.js`

Also triggerable via `workflow_dispatch`. Runs `npx playwright test` against a preview build served at `http://localhost:4173`.

---

## External agent interface

Two server modes expose the game engine to external tools over stdio. Both are long-running processes that accept requests on stdin and write responses to stdout.

### JSON-RPC server — `npm run rpc`

LSP-style framing: each message is preceded by a `Content-Length: <n>\r\n\r\n` header.

**14 methods:**

| Method                   | Description                                               |
| :----------------------- | :-------------------------------------------------------- |
| `engine.create`          | Create a new engine instance; returns `runId`             |
| `engine.startRun`        | Initialise a fresh run on an existing engine              |
| `engine.getObservation`  | Return the current observation                            |
| `engine.getLegalActions` | Return the current legal action set                       |
| `engine.applyAction`     | Apply one action; returns updated observation + events    |
| `engine.endTurn`         | End the player turn; returns updated observation + events |
| `engine.snapshot`        | Serialise engine state to a portable snapshot             |
| `engine.restore`         | Restore engine state from a snapshot                      |
| `engine.drainEvents`     | Consume and return buffered engine events                 |
| `engine.getRunSummary`   | Return the run summary (only set when run is terminal)    |
| `engine.seed`            | Set the hex seed for the next `startRun` call             |
| `engine.renderText`      | Render the current observation as human-readable text     |
| `engine.subscribe`       | Stream engine events as JSON-RPC notifications            |
| `engine.dispose`         | Destroy the engine instance and free resources            |

**Error codes:**

| Code   | Name           | Meaning                                |
| :----- | :------------- | :------------------------------------- |
| -32001 | IllegalAction  | Action not in current legal set        |
| -32002 | UnknownRun     | `runId` does not exist in the registry |
| -32003 | RunCapExceeded | Per-process run cap reached            |
| -32004 | RunErrored     | Engine threw an unrecoverable error    |

### MCP server — `npm run mcp`

Same 14 operations exposed as MCP tools (names without the `engine.` prefix), plus 4 resources and 3 prompts.

**Resources:**

| URI                                 | Description                                          |
| :---------------------------------- | :--------------------------------------------------- |
| `balance://baseline/main`           | Current `baselines/main.metrics.json`                |
| `balance://metrics/{batchId}`       | Any committed `metrics/{batchId}.json`               |
| `balance://batches`                 | Index of all batch configs in `scripts/sim/batches/` |
| `balance://run/{runId}/observation` | Live observation from a running engine instance      |

**Prompts:**

| Name                 | Purpose                                              |
| :------------------- | :--------------------------------------------------- |
| `balance/play-run`   | Play a full run to completion and return the outcome |
| `balance/probe-card` | Paired A/B test a single card across N seeds         |
| `balance/qa-smoke`   | Quick smoke check: one seeded run, assert no crash   |

**Example: connect Claude Code to the MCP server**

Add this to your Claude Code MCP config (`.claude/settings.json`):

```json
{
  "mcpServers": {
    "usiec-cepra": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/path/to/slay-the-ceper"
    }
  }
}
```

Then in a Claude Code session:

```
Use the balance/play-run prompt with seed=deadbeef to play one run.
Read balance://baseline/main and summarise the top 3 relics by lift.
```

---

## Scene-based E2E testing

The game supports a `?scene=<name>` URL parameter that loads a pre-built game state snapshot, bypassing the title screen and normal game flow. This makes Playwright tests fast (sub-second per scene) and deterministic.

### Available scenes

| Scene name       | What it shows                                    |
| :--------------- | :----------------------------------------------- |
| `combat-opening` | First-floor battle, fresh hand                   |
| `combat-boss`    | Boss battle at full health                       |
| `combat-lethal`  | Battle where enemy intent kills player next turn |
| `combat-lose`    | Player HP at 0 (game-over state)                 |
| `reward-card`    | Post-battle card reward screen                   |
| `reward-relic`   | Post-battle relic reward screen                  |
| `shop-stocked`   | Shop with cards, relics, and removal available   |
| `shop-broke`     | Shop open but player has 0 dutki                 |
| `campfire-ready` | Campfire node, healthy player                    |
| `event-branch`   | Random event with multiple choices               |
| `map-midway`     | Map view at floor 8                              |
| `maryna-offer`   | Maryna boon selection overlay                    |
| `run-ended-win`  | Victory overlay                                  |
| `run-ended-loss` | Defeat overlay                                   |

### Guardrail

Scene loading is only permitted on localhost or when `window.__SCENE_TEST__ = true` is set. It is blocked in production builds.

### Running the E2E suite

```bash
# Requires a preview build to be served at localhost:4173
npm run build && npm run preview &
npx playwright test
```

Or run a single spec:

```bash
npx playwright test tests/e2e/scenes.spec.js
```

### Adding a new scene

1. Add a `build(state)` function in `src/logic/scenes/index.js` that mutates a fresh `GameState` into the target snapshot.
2. Export it under a kebab-case name from the scene registry.
3. Add a test entry in `tests/e2e/scenes.spec.js` using `page.goto('/?scene=<name>')`.

---

## Seeded runs for players

Human players can start a run from a specific seed to reproduce or share exact game experiences.

### Starting a seeded run

On the title screen, use the **Podany Seed** button (seeded-run option). Enter an 8-character hex seed (e.g. `deadbeef`). The run uses the same map layout, enemy sequence, weather, and reward pools as any other player with that seed.

Alternatively, append `?seed=<hex>` to the URL to start directly:

```
http://localhost:5173/slay-the-ceper/?seed=deadbeef
```

### HUD seed display

During a run, the current seed is shown in small text in a corner of the HUD. Click it to copy the seed to the clipboard.

### Replaying a run

On the run-end overlay (win or loss), the seed is displayed prominently alongside a **Powtórz ten seed** (Replay this seed) button. Clicking it resets to a fresh run with the same seed.
