# Itch.io Readiness Plan

## P0 — Build & Delivery

**Goal:** Produce a self-contained zip that works when served from any path (itch.io iframe or direct unzip).

| #   | Task                | Notes                                                                                       |
| --- | ------------------- | ------------------------------------------------------------------------------------------- |
| 1   | Add itch build mode | `VITE_DEPLOY_TARGET=itch` → set `base: './'` in `vite.config.js`                            |
| 2   | Add npm scripts     | `build:pages` (current GH Pages build), `build:itch` (itch variant)                         |
| 3   | CI artifact         | Add GitHub Actions job that zips `dist/` on tag → uploadable to itch manually or via butler |

**DoD:** `npm run build:itch && npx serve dist/` smoke-passes locally; upload to itch as hidden game loads without 404s.

---

## P0 — Compliance & Trust

| #   | Task               | Notes                                                                                                                                   |
| --- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Add `LICENSE` file | MIT recommended; project has no license file yet                                                                                        |
| 2   | Privacy policy     | Document GameAnalytics scope (no PII, anonymous session data), opt-out path (`VITE_GAMEANALYTICS_KEY` empty build), link from itch page |
| 3   | Parody/attribution | Note on itch page: fan parody, Slay the Spire not affiliated, Tatra/Góral imagery is satire                                             |

**DoD:** `LICENSE` in repo root, `docs/privacy-policy.md` linked from `README.md` and itch page.

---

## P0 — Storefront & Positioning

| #   | Task              | Notes                                                                  |
| --- | ----------------- | ---------------------------------------------------------------------- |
| 1   | Cover image       | 630×500 px minimum; game title + key art                               |
| 2   | Screenshots       | 3–5 in-game screenshots (combat, map, shop, reward screen)             |
| 3   | Gameplay clip/gif | Short loop showing a combat turn                                       |
| 4   | Itch page copy    | Hook, How to play, Features, Controls, Known issues, link to changelog |

**DoD:** Draft itch page ready in hidden mode; all required assets uploaded.

---

## P1 — Release Ops

| #   | Task                            | Notes                                                           |
| --- | ------------------------------- | --------------------------------------------------------------- |
| 1   | Version tagging checklist       | `npm version patch/minor`, git tag, push tag triggers CI        |
| 2   | Pre-release gate script         | Runs lint + format:check + test + build; blocks ship on failure |
| 3   | Butler auto-upload _(optional)_ | `butler push dist/ <user>/<game>:html5` on tag in CI            |

**DoD:** Repeatable one-command (or short checklist) ship process documented in `RELEASING.md`.

---

## P1 — Post-launch Quality

| #   | Task                    | Notes                                                                                      |
| --- | ----------------------- | ------------------------------------------------------------------------------------------ |
| 1   | Error monitoring policy | JS `window.onerror` → GA design event; decide alerting threshold                           |
| 2   | Feedback loop           | Monitor itch comments; add in-game bug report link (GitHub Issues)                         |
| 3   | Low-end / mobile perf   | Manual playtest on 2–3 browsers + mobile before public launch; Lighthouse CI already green |

**DoD:** Tested on Chrome, Firefox, Safari + one mobile device before flipping itch page to public.

---

## Fast Path (1–2 days to hidden launch)

1. **P0 Build:** Add `build:itch` script with `base: './'`
2. **P0 Compliance:** Add `LICENSE` + `docs/privacy-policy.md`
3. **P0 Storefront:** Grab screenshots in-game, write itch page draft
4. Upload as hidden on itch.io, smoke-test the iframe
5. Flip to public

---

## Missing / Incomplete Game Features

These are gaps in the game itself (not ops/delivery) that affect itch.io quality perception.

### Audio

| Gap                   | Detail                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No SFX files          | `src/audio/` contains only BGM tracks. The only SFX is a procedurally generated "miss" beep (oscillator). No card-play sound, attack hit, block, UI click, reward jingle, etc. |
| No SFX volume control | Settings only expose music mute toggles; no separate SFX slider                                                                                                                |

### Language / Localization

| Gap             | Detail                                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Polish only     | All UI strings, card names, enemy names, events, and tooltips are Polish. No i18n layer exists. Non-Polish players on itch.io will not understand the game. |
| No English mode | Adding even a minimal English toggle (with translated card/enemy names) would significantly widen the audience.                                             |

### Content & Progression

| Gap                      | Detail                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Only 2 acts              | Act 3 / final boss not implemented. The run currently ends after beating the Act 2 boss. |
| Limited character roster | Only Jędrek is selectable                                                                |
| Card pool size           | 60-card backlog exists (`CARDY-PROPOZYCJE-60.md`) — current pool is smaller.             |

### UI / UX

| Gap               | Detail                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No credits screen | No in-game credits/about screen listing music, inspirations, or contributors.                                                                                                        |
| Run summary depth | Run summary overlay exists and already shows floor, Dutki, turns, final relics, and final deck, but it does not show deeper combat metrics (e.g., total damage dealt/taken per run). |
| Settings scope    | Options modal already includes menu music, game music, skip intro, text size, and analytics toggle; still missing language switch, SFX controls, and explicit keybind reference.     |

### Accessibility

| Gap                              | Detail                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Partial ARIA coverage            | Some elements have `aria-label`; interactive card buttons and enemy intent icons are not fully covered.                                                   |
| Keyboard accessibility in combat | Map nodes are keyboard-focusable buttons, but combat cards are rendered as clickable `<div>` elements, so they lack native keyboard activation semantics. |

---

## Technical Notes

- Current `vite.config.js` hardcodes `base: '/slay-the-ceper/'` — itch.io needs `'./'`
- No `LICENSE` file exists in the repo yet
- No privacy policy or terms document exists
- Marketing assets (cover, screenshots) not yet created — only PWA icons present in `public/`
- GameAnalytics live events are enabled by default; privacy policy must document this
