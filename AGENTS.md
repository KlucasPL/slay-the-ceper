# AGENTS.md — OpenCode

Project: **Usiec Cepra** — Slay-the-Spire-like deckbuilder, Polish Tatra setting.

## Quick Start

```bash
npm run dev          # → http://localhost:5173/slay-the-ceper/
npm test            # Vitest (single: npx vitest run tests/GameState.test.js)
npm run lint        # ESLint check
npm run format      # Prettier write
npm run build       # Production bundle
npm run sim         # 5k-game balance simulation
npm run sim:smoke  # Quick simulation
```

CI gates must pass: `lint → format:check → test → build`

## Architecture (strict 3-layer)

| Layer | Folder | Rule |
|-------|--------|------|
| L1 | `src/data/` | Pure data, NO DOM, NO Math.random (use `state.rng()`) |
| L2 | `src/state/` | Game logic, NO document/window/console.log |
| L3 | `src/ui/` | DOM only, NO game math |

Add feature in order: **Data → State → Test → UI**

## Debug

- URL params: `?debugBoss=<id>`, `?debugEnemy=<id>` or shortcuts `{konik, naganiacz, random-boss}`
- In-game: press `~` or `F9` (dev only) → Debug Overlay

## Key Patterns

- Card `effect(state)` mutates GameState, never touches DOM
- Damage: `base → +strength → ×2 (next_double) → ×0.75 (weak) → ×1.5 (vulnerable) → −block`
- Victory: overlay reward screen, NEVER `alert()`
- Reward pools exclude `{isStarter, eventOnly, tutorialOnly}`

## References

- Full spec: `CLAUDE.md`
- Workspace rules: `.github/copilot-instructions.md`
- Agent persona: `.github/agents/usiec-cepra.agent.md`

## Terminology

- Góral/Jędrek/Baciar = player characters
- Ceper/Cepry = enemies
- Oscypki = energy, Krzepa = HP, Garda = block, Dutki = currency

## Test Coverage

Actual: 95.98% lines, 94.31% functions, 86.81% branches. Thresholds in opencode.json:
- statements: 85%
- branches: 80%
- functions: 90%
- lines: 85%