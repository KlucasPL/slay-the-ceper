---
name: add-character
description: Add a new character (Jędrek, Baciar, etc.)
compatibility: opencode
metadata:
  audience: developers
  workflow: feature
---

## What I do

Follow this order:

### Step 1: Data

Add character in `src/data/characters.js`:

- `id` — unique identifier
- `name` — display name (Polish)
- `archetype` — tank/rogue/mage
- `baseHp` — starting HP
- `baseEnergy` — starting energy
- `startDeck` — array of starter card IDs

### Step 2: State

Add to `src/state/PlayerState.js`:

- Character-specific stats
- Special abilities hook points

### Step 3: UI

Add to CharacterSelect if new character.

## Characters

- `jedrek` — tanky Góral (more HP, block focus)
- `baciar` — rogue Góral (evasion, crits)

## Starter Deck

Starter cards should have `isStarter: true` in `cards.js`.

## Verification

```bash
npm run lint
npm run format:check
npm test
```

Test with `?debugBoss=...` URL param.
