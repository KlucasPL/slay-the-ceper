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
3. All card/enemy/relic definitions are pure data objects in `src/data/` — no methods, no side effects.
4. CSS animations live in `src/styles/animations.css` — never inline in JS.

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
