---
name: add-event
description: Add a random event with choices and consequences
compatibility: opencode
metadata:
  audience: developers
  workflow: feature
---

## What I do

Follow this order:

### Step 1: Data

Add event in `src/data/events.js`:

- `id`, `title`, `description`
- `type`: `encounter`, `merchant`, `campfire`, `question`
- `choices`: array of {label, effect, requirements}
- Effect mutates `state`, never DOM

### Step 2: State

If new mechanics:

- Extend `src/state/EventSystem.js`
- Add choice resolution logic

### Step 3: Test

Test in `tests/GameState.test.js`:

- Test each choice outcome
- Test requirements

### Step 4: UI

Add to EventRenderer in `src/ui/`.

## Event Types

- `encounter` — story event with choices
- `merchant` — shop event
- `campfire` — rest/heal choice
- `question` — yes/no choice

## Choice Structure

```js
{
  label: "Wejdź do karczmy",
  requirement: (state) => state.dutki >= 20,
  effect: (state) => {
    state.dutki -= 20;
    state.heal(15);
  }
}
```

## Verification

```bash
npm run lint
npm run format:check
npm test
```
