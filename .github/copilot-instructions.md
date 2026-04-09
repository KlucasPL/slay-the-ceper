# Usiec Cepra — Copilot Workspace Instructions

These conventions apply to every Copilot interaction in this project, regardless of which agent or mode is active.

## Tech Stack

- **Strictly Vanilla:** Vanilla JavaScript (ES6 Modules), HTML5, CSS3 only.
- **NO FRAMEWORKS:** Never suggest React, Vue, Angular, jQuery, Tailwind, or Bootstrap.
- **Tooling:** Vite (bundler/dev server), Vitest (unit testing).
- **Typing:** Use JSDoc comments for all functions, parameters, and return types.

## File Structure

```
index.html
src/
  data/           # Pure data objects: cards, characters, enemies, relics
  state/
    GameState.js  # All game logic, math, turn flow — NO DOM access
  ui/
    UIManager.js  # All DOM reads/writes — NO game logic
  styles/
    layout.css    # Layout and component styles
    animations.css # Animations separated from layout
tests/            # Vitest unit tests — logic only, never DOM
```

## Naming Conventions

- Files: `PascalCase.js` for classes/modules (e.g., `GameState.js`, `UIManager.js`).
- Data files: `camelCase.js` (e.g., `cards.js`, `enemies.js`).
- CSS classes: `kebab-case` (e.g., `.card-hand`, `.enemy-intent`).
- Test files: mirror the source file name with `.test.js` suffix (e.g., `GameState.test.js`).

## Architecture Rules

1. `src/state/GameState.js` must never reference `document`, `window`, or call `console.log` in production code.
2. `src/ui/UIManager.js` must never contain game logic, calculations, or modify game state directly.
3. Characters and enemies stay as pure data objects in `src/data/`.
4. Cards live in `src/data/cards.js` as declarative definitions with metadata plus `effect(state)` callbacks. Card effects must never access the DOM directly.
5. CSS animations live in `src/styles/animations.css` — never inline in JS.

## Core Combat Mechanics

- Status model on both Góral and Ceper: `strength`, `weak`, `fragile`, `next_double`, `energy_next_turn`.
- Damage rules:
  - `strength` adds flat damage.
  - `weak` reduces outgoing damage by 25% (floor).
  - `next_double` doubles only the next attack, then resets.
- End-of-turn / start-of-turn status ticking must stay inside `GameState`.
- Combat reset after victory must stay in `GameState.resetBattle()`:
  - scale Ceper (`maxHp +10`, base attack `+2`),
  - heal Góral by 15 (capped by max Krzepa),
  - clear blocks and statuses,
  - rebuild deck from hand/discard/exhaust and shuffle,
  - start a fresh turn.

## Victory & Rewards

- Win flow must use the overlay reward screen (not `alert`) when Ceper falls.
- Reward choice: show 3 random cards, excluding base cards (`ciupaga`, `gasior`).
- On reward click: add chosen card to deck and call `resetBattle()`.

## CI / Quality Gates

- Keep quality checks green for every change:
  - `npm run lint`
  - `npm run format:check`
  - `npm test`
  - `npm run build`
- Lighthouse CI tracks mobile performance and accessibility on pushes.

## Game Terminology

Always use these terms in code identifiers, comments, and UI strings:

| Term          | Meaning                              |
| ------------- | ------------------------------------ |
| Góral         | Player character (Highlander)        |
| Jędrek        | Tanky Góral                          |
| Baciar        | Rogue-like Góral                     |
| Ceper / Cepry | Enemy / Enemies (clueless tourist/s) |
| Oscypki       | Energy (to play cards)               |
| Krzepa        | Health Points                        |
| Garda         | Block / Defense                      |
| Dutki         | Currency (shop)                      |

## Development Workflow

For every new game feature, always follow this order:

1. **Data** — Define in `src/data/` as a pure object.
2. **State Logic** — Implement in `GameState.js` (pure, testable).
3. **Unit Test** — Write in `tests/` using Vitest before wiring up UI.
4. **UI** — Wire DOM rendering in `UIManager.js`.

Never skip the unit test step. Tests cover logic only — mock state, never touch the DOM.
