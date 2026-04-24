---
name: add-card
description: Add a new card following the strict 4-step workflow
compatibility: opencode
metadata:
  audience: developers
  workflow: feature
---

## What I do

Follow this exact order:

### Step 1: Data

Create card definition in `src/data/cards.js`:

- Add pure object with `id`, `name`, `type`, `cost`, `damage`, `block`, `effects`, `isStarter`
- Add `effect(state)` function that mutates GameState
- NEVER touch DOM in effect

### Step 2: State

If card needs new mechanics:

- Add subsystem to `src/state/` (or extend existing)
- Add 1-line delegate on `GameState.js`
- NEVER add `document`, `window`, `console.log` refs

### Step 3: Test

Write unit test in `tests/`:

- Mock GameState fields directly
- Pattern: `new GameState(characters.jedrek, enemyLibrary.cepr)`
- Test all card effects
- Run: `npx vitest run tests/GameState.test.js`

### Step 4: UI

Add rendering in `src/ui/`:

- Add to CardRenderer
- Add to RewardCards (if not starter)
- NEVER calculate game values in UI

## Naming

- File: `camelCase.js` for data
- Card IDs: `kebab-case` (e.g., `ciupaga`, `gazior-zaplata`)
- Polish terminology in identifiers

## Verification

Run after implementation:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

## Forbidden

- NO frameworks (React, Vue, jQuery, Tailwind)
- NO Math.random in state (use `state.rng()`)
- NO inline animations (use `animations.css`)
