---
name: add-weather
description: Add weather effect for map nodes
compatibility: opencode
metadata:
  audience: developers
  workflow: feature
---

## What I do

Follow this order:

### Step 1: Data

Add weather in `src/data/weather.js`:

- `id` — unique identifier
- `name` — display name (Polish)
- `description` — effect description
- `apply(state)` — effect on player/enemy
- `weight` — spawn probability

### Step 2: State

Add to `src/state/MapEngine.js`:

- Weather roll on node generation
- Weather application at node visited

### Step 3: UI

Add to MapRenderer:

- Weather icon on nodes
- Weather effect display

### Step 4: Test

Test in `tests/GameState.test.js`:

- Weather applies correctly
- Weather persists through battle

## Weather Effects

- Modify player stats (HP, energy)
- Modify enemy difficulty
- Add/remove statuses
- Currency bonus/penalty

## Weather Types

- `rain` — -damage dealt
- `fog` — enemy evasion
- `storm` — energy reduction
- `sun` — healing bonus

## Debug

Use debug overlay to force weather.

## Verification

```bash
npm run lint
npm run format:check
npm test
```
