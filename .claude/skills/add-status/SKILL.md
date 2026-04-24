---
name: add-status
description: Add a new status effect (weak, vulnerable, strength, etc.)
compatibility: opencode
metadata:
  audience: developers
  workflow: feature
---
## What I do

Follow this order:

### Step 1: Data
Add status in `src/data/StatusEffects.js` (or inline in `src/state/StatusEffects.js`):
- `id` — unique identifier
- `name` — display name (Polish)
- `maxStacks` — max duration/stacks
- `isNegative` — debuff flag
- `tickDirection` — start/end of turn

### Step 2: State
Add to `src/state/StatusEffects.js`:
- Apply logic
- Damage modifier (if attack modifier)
- Tick logic at turn boundaries

### Step 3: Test
Add tests in `tests/GameState.test.js`:
- Test application
- Test stacking
- Test duration decrement
- Test damage modification

### Step 4: UI
Add to StatusRenderer in `src/ui/renderers/`.

## Existing Statuses

Reference existing in code:
- `strength` — +flat damage
- `weak` — -25% outgoing damage
- `fragile` — -25% block efficiency
- `vulnerable` — +50% incoming damage
- `next_double` — doubles next attack
- `energy_next_turn` — bonus energy
- `lans` — enemy passive (duma podhala)
- `furia_turysty` — rage bonus

## Damage Pipeline

When adding damage-modifying status:
- `base → +strength → ×2 (next_double) → ×0.75 (weak) → ×1.5 (vulnerable) → −block`

## Verification

```bash
npm run lint
npm run format:check
npm test
```