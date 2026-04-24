---
name: add-enemy
description: Add a new enemy with scaling formula and intents
compatibility: opencode
metadata:
  audience: developers
  workflow: feature
---
## What I do

Follow this exact order:

### Step 1: Data
Add enemy definition in `src/data/enemies.js`:
- `id`, `name`, `maxHp` (base), `baseDamage` (base)
- `intent`: attack/defend/debuff/buff pattern
- `scalingFormula`: formula for act-based HP/damage scaling
- `statuses`: passive effects (e.g., `lans`, `duma_podhala`)
- `phases`: if multi-phase boss
- NEVER put enemy in `enemyLibrary` here

### Step 2: Library
Add to `enemyLibrary` in `enemies.js`:
- `common`, `elite`, `boss` pools
- Ensure scaling formula matches pattern: `base + (act - 1) * scaling`

### Step 3: State
If new mechanics:
- Add to `src/state/EnemyState.js`
- Add intent selection logic
- Add phase transitions
- Add status effect handlers

### Step 4: Test
Write tests in `tests/GameState.test.js`:
- Test HP scaling across acts
- Test intent generation
- Test phase transitions
- Test passive status application

## Scaling Formula Pattern

```js
// For regular enemies
maxHp: baseHp + (act - 1) * 10
baseDamage: base + (act - 1) * 2

// For bosses (harder)
maxHp: baseHp * (1 + (act - 1) * 0.5)
```

## Verification

Run after implementation:
```bash
npm run lint
npm run format:check
npm test
```

## Debug Spawn

To test: `?debugEnemy=<id>` or `{shortcut}` in URL. In-game: `~` or `F9`.