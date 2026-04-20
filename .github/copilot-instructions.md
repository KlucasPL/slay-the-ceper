# Usiec Cepra — Copilot Workspace Instructions

These conventions apply to every Copilot interaction in this project, regardless of which agent or mode is active.

## Tech Stack

- **Strictly Vanilla:** Vanilla JavaScript (ES6 Modules), HTML5, CSS3 only.
- **NO FRAMEWORKS:** Never suggest React, Vue, Angular, jQuery, Tailwind, or Bootstrap.
- **Tooling:** Vite (bundler/dev server), Vitest (unit testing).
- **Typing:** Use JSDoc comments for all functions, parameters, and return types.

## File Structure

```
index.html
src/
  data/           # [L1] Pure data objects: cards, characters, enemies, relics
  state/          # [L2] Game logic, math, turn flow — NO DOM access
    GameState.js  # Facade; delegates to subsystems in src/state/
  engine/         # [L2.5] Headless API — EngineController, Observation, ActionDispatcher
  logic/          # [L2.5] Bot policies (HeuristicBot, SearchBot, etc.) — engine only
  rpc/            # [L2.6] JSON-RPC 2.0 stdio server + RunRegistry
  mcp/            # [L2.6] MCP server sharing methods.js with rpc/
  ui/
    UIManager.js  # [L3] All DOM reads/writes — NO game logic
  styles/
    layout.css    # Layout and component styles
    animations.css # Animations separated from layout
scripts/
  sim/            # Batch runner — outside the shipped app bundle
  analyze.js      # JSONL → metrics.json aggregator
tools/
  dashboard/      # Static analytics site — zero engine dependency at runtime
tests/
  engine/         # Vitest tests for src/engine/
  bots/           # Vitest tests for src/logic/bots/
  sim/            # Vitest tests for scripts/sim/
  rpc/            # Vitest tests for src/rpc/ (incl. conformance)
  mcp/            # Vitest tests for src/mcp/
  ci/             # Structural YAML tests for .github/workflows/
  e2e/            # Playwright E2E tests (dashboard + UI)
baselines/
  main.metrics.json  # Canonical baseline; update via 'baseline-update' PR label
  thresholds.json    # Drift thresholds for the CI balance gate
```

## Naming Conventions

- Files: `PascalCase.js` for classes/modules (e.g., `GameState.js`, `UIManager.js`).
- Data files: `camelCase.js` (e.g., `cards.js`, `enemies.js`).
- CSS classes: `kebab-case` (e.g., `.card-hand`, `.enemy-intent`).
- Test files: mirror the source file name with `.test.js` suffix (e.g., `GameState.test.js`).

## Architecture Rules

1. `src/state/GameState.js` must never reference `document`, `window`, or call `console.log` in production code.

2. `src/ui/UIManager.js` must never contain game logic, calculations, or modify game state directly.

3. Characters and enemies stay as pure data objects in `src/data/`.

4. Cards live in `src/data/cards.js` as declarative definitions with metadata plus `effect(state)` callbacks. Card effects must never access the DOM directly.

5. CSS animations live in `src/styles/animations.css` — never inline in JS.

### Layer dependency rules (strict)

| Layer          | Folder                 | May depend on      |
| -------------- | ---------------------- | ------------------ |
| L1             | `src/data/`            | nothing            |
| L2             | `src/state/`           | L1 only            |
| L2.5 Engine    | `src/engine/`          | L1, L2             |
| L2.5 Bots      | `src/logic/bots/`      | L2.5 engine only   |
| L2.6 Transport | `src/rpc/`, `src/mcp/` | L2.5 engine only   |
| L3 UI          | `src/ui/`              | L1, L2, L3 helpers |

**Forbidden refs** (enforced by scanner + ESLint):

- `document`, `window`, `console.log` are banned in `src/data/`, `src/state/`, `src/engine/`, `src/rpc/`, `src/mcp/`, `src/logic/bots/`.
- `Math.random` is banned in `src/state/` and `src/data/` — use `state.rng()` instead (seeded by `EngineController`).

## Core Combat Mechanics

- Status model on both Góral and Ceper: `strength`, `weak`, `fragile`, `next_double`, `energy_next_turn`.
- Damage rules:
  - `strength` adds flat damage.
  - `weak` reduces outgoing damage by 25% (floor).
  - `next_double` doubles only the next attack, then resets.
- End-of-turn / start-of-turn status ticking must stay inside `GameState`.
- Combat reset after victory must stay in `GameState.resetBattle()`:
  - scale Ceper (`maxHp +10`, base attack `+2`),
  - heal Góral by 15 (capped by max Krzepa),
  - clear blocks and statuses,
  - rebuild deck from hand/discard/exhaust and shuffle,
  - start a fresh turn.

## Victory & Rewards

- Win flow must use the overlay reward screen (not `alert`) when Ceper falls.
- Reward choice: show 3 random cards, excluding base cards (`ciupaga`, `gasior`).
- On reward click: add chosen card to deck and call `resetBattle()`.

## npm Scripts

| Script                            | Purpose                                                 |
| --------------------------------- | ------------------------------------------------------- |
| `npm run dev`                     | Vite dev server → http://localhost:5173/slay-the-ceper/ |
| `npm test`                        | Vitest unit tests                                       |
| `npm run lint` / `lint:fix`       | ESLint                                                  |
| `npm run format:check` / `format` | Prettier                                                |
| `npm run build`                   | Production bundle                                       |
| `npm run sim`                     | Batch simulation runner (`scripts/sim/index.js`)        |
| `npm run sim:smoke`               | Quick smoke run                                         |
| `npm run sim:diff`                | Diff two metrics.json baselines                         |
| `npm run sim:replay`              | Replay a saved action log                               |
| `npm run analyze`                 | JSONL → metrics.json (`scripts/analyze.js`)             |
| `npm run rpc`                     | JSON-RPC 2.0 stdio server                               |
| `npm run mcp`                     | MCP stdio server                                        |
| `npm run dashboard:vendor`        | Vendor Chart.js into tools/dashboard/                   |

## CI / Quality Gates

- Keep quality checks green for every change:
  - `npm run lint`
  - `npm run format:check`
  - `npm test`
  - `npm run build`
- Lighthouse CI tracks mobile performance and accessibility on pushes.
- Balance drift gate: apply PR label `balance-check` to run a 5k-game simulation diff against `baselines/main.metrics.json`.
- Baseline refresh: apply PR label `baseline-update` to regenerate `baselines/main.metrics.json` at 10k games.

## Game Terminology

Always use these terms in code identifiers, comments, and UI strings:

| Term          | Meaning                              |
| ------------- | ------------------------------------ |
| Góral         | Player character (Highlander)        |
| Jędrek        | Tanky Góral                          |
| Baciar        | Rogue-like Góral                     |
| Ceper / Cepry | Enemy / Enemies (clueless tourist/s) |
| Oscypki       | Energy (to play cards)               |
| Krzepa        | Health Points                        |
| Garda         | Block / Defense                      |
| Dutki         | Currency (shop)                      |

## Development Workflow

For every new game feature, always follow this order:

1. **Data** — Define in `src/data/` as a pure object.
2. **State Logic** — Implement the subsystem in `src/state/` and add a delegate on `GameState`.
3. **Engine** — If the feature needs headless/API exposure, extend `src/engine/` (optional step).
4. **Unit Test** — Write in `tests/` using Vitest before wiring up UI.
5. **UI** — Wire DOM rendering in `UIManager.js`.

Never skip the unit test step. Tests cover logic only — mock state, never touch the DOM.
