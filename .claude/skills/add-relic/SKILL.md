---
name: add-relic
description: Add a new relic following the relic pattern
compatibility: opencode
metadata:
  audience: developers
  workflow: feature
---

## What I do

Follow this order:

### Step 1: Data

Add relic in `src/data/relics.js`:

- `id`, `name`, `rarity` (starter/common/rare/epic/boss)
- `description` (Polish)
- `trigger`: when relic activates (e.g., `onDamaged`, `onTurnStart`, `onBattleStart`)
- `effect(state)` callback

### Step 2: State

If new trigger type:

- Add to `src/state/RelicSystem.js`
- Add trigger hook in `BattleLifecycle.js`

### Step 3: Test

Write test in `tests/GameState.test.js`:

- Test relic activation
- Test trigger conditions

### Step 4: UI

Add to RelicRenderer if visual.

## Trigger Types

- `onBattleStart` — once when battle starts
- `onTurnStart` — start of each turn
- `onTurnEnd` — end of each turn
- `onDamaged` — when taking damage
- `onCardPlayed` — when playing specific card type
- `onEnemyDeath` — when enemy dies
- `onVictory` — after winning battle

## Naming

- IDs: `kebab-case` (e.g., `oscypki-buta`, `kamien-gorski`)
- Polish in UI strings

## Verification

```bash
npm run lint
npm run format:check
npm test
```
