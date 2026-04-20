# CLAUDE.md

Spec for Claude Code in this repo.

## Project

**Usiec Cepra** — browser Slay-the-Spire-like roguelike deckbuilder, Polish highlander (Tatra) setting. UI/design docs in Polish.

## Sibling Specs (keep in sync)

- `.github/copilot-instructions.md` — workspace rules.
- `.github/agents/usiec-cepra.agent.md` — "Usiec Cepra Dev" persona + feature output format.

## Commands

```bash
npm run dev          # Vite → http://localhost:5173/slay-the-ceper/
npm run build
npm run preview
npm run lint | lint:fix
npm run format | format:check   # CI gate
npm test | test:watch           # Vitest
npm run lhci                    # Lighthouse CI (mobile perf/a11y)
```

- Single file: `npx vitest run tests/GameState.test.js`
- Single test: `npx vitest run -t "shouldApplyWeakReduction"`
- CI (`.github/workflows/pr-quality.yml`) gates: lint + format:check + test + build. All must be green.

## Architecture — Strict 3-Layer

Violation = breakage.

### [L1] `src/data/` — pure data

Files: `cards.js, enemies.js, relics.js, events.js, marynaBoons.js, weather.js, characters.js, releaseNotes.js, tutorialConfig.js`.

- Card `effect(state)` mutates `GameState`; **never DOM**.
- Random reward pools exclude `{isStarter, eventOnly, tutorialOnly}`.

### [L2] `src/state/` — game logic, zero DOM

`GameState.js` = facade owning mutable run state, delegates to subsystems. **Forbidden refs**: `document, window, console.log`.

| Subsystem         | Responsibility                                                                                                |
| :---------------- | :------------------------------------------------------------------------------------------------------------ |
| `BattleLifecycle` | battle start/end, turn begin/end, reset-for-new-run                                                           |
| `CombatEngine`    | damage math, block, status ticking, attack resolution                                                         |
| `DeckManager`     | shuffle, draw, discard, exhaust, card damage upgrades                                                         |
| `EnemyState`      | enemy factory, intent, phase transitions, passives                                                            |
| `PlayerState`     | stats, energy, heal, status application                                                                       |
| `StatusEffects`   | defs: `strength, weak, fragile, vulnerable, next_double, energy_next_turn, lans, duma_podhala, furia_turysty` |
| `MapEngine`       | procedural map gen, node types, weather rolls                                                                 |
| `NavigationState` | node metadata, current-node tracking                                                                          |
| `EventSystem`     | random events, scripted encounters, recent-event dedupe                                                       |
| `ShopSystem`      | stocking, purchases, card removal                                                                             |
| `RelicSystem`     | relic rolls, acquisition, seen-offers dedupe                                                                  |
| `MarynaSystem`    | Maryna boons (persistent buffs, separate from relics)                                                         |

Rule: extend existing subsystem before inflating `GameState.js`. Add 1-line delegate on `GameState` for stable surface.

### [L3] `src/ui/` — DOM, zero game logic

`UIManager.js` orchestrates: bind listeners → call `state.*` → re-render. Split:

- `ui/renderers/` — Card, Status, Map, Shop, Reward, Event, Library, PileViewer
- `ui/overlays/` — ActIntro, Campfire, Maryna
- `ui/combat/CombatUI.js`
- `ui/tutorial/` — TutorialUI + tutorialFlow
- `ui/intro/MotionComicIntro.js`
- `ui/debug/DebugOverlay.js`
- `ui/helpers/UIHelpers.js`

UIManager methods = thin wrappers calling modules.
**Forbidden in UI**: damage calc, deck array mutation, reading `state.player.hp` for math. Need a derived value → add getter to `GameState`.

### `src/logic/`

- `AudioManager.js` — context-aware menu/battle/boss/event music.
- `settings.js` — localStorage toggles: skip intro, music mute.

### `src/styles/`

- `layout.css` — layout/components.
- `animations.css` — keyframes.
- **Never** inline animations in JS.

## Combat Model

- Status shape identical on `player.status` ∧ `enemy.status`.
- Damage pipeline (in `CombatEngine`/`GameState`): `base → +strength → ×2 if next_double (consumed) → ×0.75 floor if weak → ×1.5 if vulnerable target → −block`.
- `next_double` resets after exactly 1 attack.
- Status tick (decrement durations, clear consumed) at turn boundaries inside `GameState`. **Never from UI.**
- `resetBattle()` handles: Ceper scaling (hard-mode `enemyScaleFactor`), player heal, status/block cleanup, deck rebuild from hand+discard+exhaust, shuffle, fresh turn. **Do not reimplement.**

## Feature Workflow (non-negotiable order)

1. **Data** → pure object in `src/data/`.
2. **State** → subsystem module in `src/state/` + delegate on `GameState`.
3. **Test** → Vitest in `tests/`, logic-only, never DOM. Mock `GameState` fields directly; pattern: `new GameState(characters.jedrek, enemyLibrary.cepr)` then poke fields.
4. **UI** → wire into `UIManager` / renderer.

Coverage: 80% on state+data (config in `vite.config.js`), gates `--coverage` runs.

## Debugging

- URL params skip intro → encounter: `?debugBoss=<id>`, `?debugEnemy=<id>`, shortcuts `{konik, naganiacz, spekulant, mistrz, redyk, ceprzyca, vip}`, or `random-boss` / `random-elite`.
- In-game overlay: `~` or `F9` (dev). Spawn enemies, set HP/Dutki, God Mode, reveal map. Lazy-loaded from `src/ui/debug/DebugOverlay.js` after bootstrap.

## Conventions

- **Stack**: ES6 modules + HTML5 + CSS3 only. **Banned**: React, Vue, Angular, jQuery, Tailwind, Bootstrap.
- **JSDoc everywhere**; complex shapes → `@typedef` near defining module.
- **Naming**:
  - `PascalCase.js` → classes/modules (`GameState.js`)
  - `camelCase.js` → data files (`cards.js`)
  - `kebab-case` → CSS classes
  - `<SourceName>.test.js` → tests
- **Polish terminology** (keep in identifiers, comments, strings):
  - Góral=player, Jędrek=tanky Góral, Baciar=rogue Góral
  - Ceper/Cepry=enemy/enemies
  - Oscypki=energy, Krzepa=HP, Garda=block, Dutki=currency
- **Victory**: overlay reward screen. **Never** `alert()`. Reward pools exclude `{isStarter, eventOnly, tutorialOnly}`.
- **No npm installs** without explicit approval. Dependency surface intentionally tiny.
