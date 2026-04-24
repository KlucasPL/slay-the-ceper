---
name: add-tutorial
description: Add tutorial flow for new players
compatibility: opencode
metadata:
  audience: developers
  workflow: feature
---

## What I do

Follow this order:

### Step 1: Config

Add tutorial steps in `src/data/tutorialConfig.js`:

- `id` — step identifier
- `trigger` — when to show (battle, card_play, etc.)
- `highlight` — UI element to highlight
- `content` — instruction text (Polish)
- `position` — where to show (top/bottom/overlay)

### Step 2: State

Add to `src/state/TutorialFlow.js`:

- Step progression
- Skip logic (if `settings.skipTutorial`)
- Completion tracking

### Step 3: UI

Add `TutorialUI` in `src/ui/tutorial/`:

- Highlight component
- Step display
- Progress indicator
- Skip button

### Step 4: Test

Test in `tests/GameState.test.js`:

- Steps progress correctly
- Skip works
- Completion saves

## Tutorial Data Structure

```js
{
  steps: [
    {
      id: 'play-card',
      trigger: 'canPlayCard',
      highlight: '.hand .card:first-child',
      content: 'Wybierz kartę z ręki by zagrać ją przeciwko Ceperowi',
      position: 'bottom',
    },
  ];
}
```

## Skippable

Always allow skip: stored in `settings.js`:

```js
skipTutorial: localStorage.getItem('skipTutorial') === 'true';
```

## Verification

```bash
npm run lint
npm run format:check
npm test
```
