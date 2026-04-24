# AGENTS.md — OpenCode

Project: **Usiec Cepra** (slay-the-ceper) — Slay-the-Spire-like deckbuilder, Polish Tatra setting.

## Quick Commands

```bash
npm run dev          # → http://localhost:5173/slay-the-ceper/
npm run lint         # ESLint (CI gate)
npm run format:check # Prettier (CI gate)
npm test             # Vitest (CI gate)
npm run build        # Production bundle (CI gate)
npm run sim:smoke    # Quick 100-game balance check
npm run sim          # Full 5k-game balance simulation
```

CI gate order (all must pass): `lint → format:check → test → build`

## Skills (use `skill` tool for these)

- `add-card`, `add-enemy`, `add-boss`, `add-relic`, `add-status`, `add-event`, `add-character`, `add-weather`, `add-tutorial`
- `run-balance-check`, `run-smoke`, `run-lint`, `run-e2e`, `run-game`, `update-baseline`

## Architecture (strict 3-layer)

| Layer | Folder | Rule |
|-------|--------|------|
| L1 | `src/data/` | Pure data, NO `Math.random` (use `state.rng()`) |
| L2 | `src/state/` | Game logic, NO DOM, NO `console.log` |
| L3 | `src/ui/` | DOM only, NO game math |

Add features in order: **Data → State → Test → UI**

## Debug

- URL: `?debugBoss=<id>`, `?debugEnemy=<id>`, shortcuts `{konik, naganiacz, random-boss}`
- In-game: press `~` or `F9` (dev only) → Debug Overlay

## Key Patterns

- Card `effect(state)` mutates GameState directly
- Damage: `base → +strength → ×2 (next_double) → ×0.75 (weak) → ×1.5 (vulnerable) → −block`
- Victory: overlay reward screen, NEVER `alert()`
- Reward pools exclude `{isStarter, eventOnly, tutorialOnly}`

## References

- Full spec: `CLAUDE.md`
- Workspace rules: `.github/copilot-instructions.md`

## Terminology

- Góral/Jędrek/Baciar = player characters
- Ceper/Cepry = enemies
- Oscypki = energy, Krzepa = HP, Garda = block, Dutki = currency