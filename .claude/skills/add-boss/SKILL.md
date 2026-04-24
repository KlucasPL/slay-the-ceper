---
name: add-boss
description: Add a multi-phase boss with scaling and special mechanics
compatibility: opencode
metadata:
  audience: developers
  workflow: feature
---

## What I do

Follow this order:

### Step 1: Data

Add boss in `src/data/enemies.js` with:

- `id`, `name` (with "Boss" suffix)
- `isBoss: true`
- `phases` — array of phase configurations
- `phaseTrigger` — when to switch phases
- Multi-phase `intent` patterns

### Step 2: State

Handle in `src/state/EnemyState.js`:

- Phase transitions
- HP reset between phases
- Intent recalculation

### Step 3: Test

Test in `tests/GameState.test.js`:

- Phase transitions work
- HP scaling per phase
- Intent variety

### Step 4: UI

Boss health bar needs phase support in CombatUI.

## Phase Structure

```js
{
  phases: [
    { hpPercent: 100, intent: 'attack', status: {} },
    { hpPercent: 66, intent: 'debuff', status: { strength: 2 } },
    { hpPercent: 33, intent: 'buff', status: { vulnerable: 2 } }
  ],
  phaseTrigger: 'below'
}
```

## Scaling

Bosses scale harder:

```js
maxHp: baseHp * (1 + (act - 1) * 0.5);
```

## Debug

Spawn: `?debugBoss=<id>` or `{random-boss}` in URL.

## Verification

```bash
npm run lint
npm run format:check
npm test
```
