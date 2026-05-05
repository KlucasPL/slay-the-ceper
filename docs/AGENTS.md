# AGENTS.md — OpenCode

Project: **Usiec Cepra** (slay-the-ceper) — browser Slay-the-Spire-like deckbuilder.

## Commands

```bash
npm run dev              # → http://localhost:5173/slay-the-ceper/
npm test                 # Vitest (all tests)
npx vitest run -t "name" # Single test by name
npx vitest run tests/GameState.test.js  # Single file
npm run lint             # CI gate 1/4
npm run format:check    # CI gate 2/4
npm run build           # CI gate 4/4 (after test)
```

CI gate order: `lint → format:check → test → build`

## Architecture (strict layers)

| Layer | Folder                           | Rule                                            |
| ----- | -------------------------------- | ----------------------------------------------- |
| L1    | `src/data/`                      | Pure data, NO `Math.random` (use `state.rng()`) |
| L2    | `src/state/`                     | Game logic, NO DOM, NO `console.log`            |
| L2.5  | `src/engine/`, `src/logic/bots/` | Headless API and bots, NO DOM                   |
| L2.6  | `src/rpc/`, `src/mcp/`           | Transport layers, engine only                   |
| L3    | `src/ui/`                        | DOM only, NO game math                          |

**Forbidden in L1/L2/L2.5/L2.6**: `document`, `window`, `console.log`, `Math.random`

Feature order: **Data → State → Test → UI**

## Key Patterns

- Vite `base: '/slay-the-ceper/'` — all URLs include subpath
- Card `effect(state)` mutates GameState directly
- Damage: `base → +strength → ×2 (next_double) → ×0.75 (weak) → ×1.5 (vulnerable) → −block`
- Victory: overlay reward screen, NEVER `alert()`
- Reward pools exclude `{isStarter, eventOnly, tutorialOnly}`
- Coverage (80%): `src/state/**`, `src/data/**` only

## Balance & CI

- Label PR `balance-check` → 5k-game simulation + drift diff vs `baselines/main.metrics.json`
- Label PR `baseline-update` → regenerates baseline at 10k games
- PWA artifacts verified in CI: `sw.js`, `manifest.webmanifest`, `icon-512x512.png`

## References

- Full spec: `CLAUDE.md`
- Workspace rules: `.github/copilot-instructions.md`
- Skills available via `skill` tool: `add-card`, `add-enemy`, `add-boss`, `run-balance-check`, etc.
