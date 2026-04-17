# Balancing Pipeline — Audit Findings & Fix Plan

**Branch:** `feat/balancing-api`
**Audit date:** 2026-04-17
**Pipeline:** `sim/index.js` → JSONL → `analyze.js` → `metrics.json` → `tools/dashboard/`
**Baseline used:** 100k runs × 10 agents (HeuristicBot, Aggressive, Defensive, Status, Greedy, Minimalist, Economy, Berserker, DrawEngine, Elitist) — `baselines/main.metrics.json`

---

## 1. What works

- Sim harness runs ~3k games/sec/agent (headless engine is fast).
- Analyzer produces valid JSON with correct sum invariants: `runCount = Σ agentMix`, `Σ bySlice.runCount = runCount`, `diagnostic.belowMinSample = count(sampleTier==='red')`.
- Dashboard views read the analyzer's shape correctly (post-fix): `winrate.rate`, `winrateLiftPp * 100`, `liftCi * 100`, entity `bySlice.{wins,total}` → derived winrate.
- Fixture regenerated from real sim output; identical structure to committed baseline.
- 6 dashboard views + Entity Detail drill-in render cleanly; Patch Comparison diff table, Run Replay scrubber.

---

## 2. Findings (severity-ordered)

| ID  | Sev       | Summary                                                                                                   | File:line                                 |
| :-- | :-------- | :-------------------------------------------------------------------------------------------------------- | :---------------------------------------- |
| F2  | 🔴 severe | Relic `pickRate > 100%` on every relic (min 2.0, max 5.05)                                                | analyze.js + emit sites                   |
| F1  | 🟠 high   | `runsWithEntity` counts `finalDeck` slots, not runs (ciupaga: 14,908 > 3,000 runCount)                    | analyze.js:441-460                        |
| F3  | 🟠 high   | `winrateLiftPp`, `winrateWithout`, `liftCi` null for 101/101 entities — `runsWithoutEntity` never written | analyze.js                                |
| F4  | 🟠 high   | `byFloor` / `byWeather` dead code — Enemy Heatmap + Weather × Enemy permanently empty                     | analyze.js:146-147                        |
| F5  | 🟡 med    | `enemy.avgTurnsToKill = 0` (divides 0 by killCount instead of null)                                       | analyze.js                                |
| F6  | 🟡 med    | `finalBoons` always `[]` — boon subsystem not instrumented in sim                                         | sim/runOneGame + state emit               |
| B1  | 🟠 high   | All bots win 0–0.1% of runs — winrate carries no signal                                                   | HeuristicBase + strategy bots             |
| UX1 | 🟡 med    | Leaderboard has 50+ rows per kind tab, no search/filter                                                   | views/leaderboard.js                      |
| UX2 | 🟡 med    | No headline metric that reflects "how well did the bot do" when winrate is 0                              | views/batch-summary.js                    |
| E1  | 🟢 cos    | Some event entities render id as name (e.g. `event:fiakier_event.name = "fiakier_event"`)                 | data/events.js or analyze.js NAME_LOOKUPS |
| E2  | 🟢 cos    | Leaderboard Events tab shows useless pick-rate column (`pickRate=null` for events)                        | views/leaderboard.js:86                   |

### F1 — `runsWithEntity` counts slots, not runs

`_processEndInventory` iterates `rec.finalDeck`, incrementing once per slot. A final deck of `['ciupaga','ciupaga','gasior']` bumps `card:ciupaga.runsWithEntity` by 2. Over 3k runs, ciupaga reports 14,908 — five times the run count.

Same bug on `finalRelics` (duplicates rare) and `finalBoons` (mostly empty today).

### F2 — `pickRate > 100%`

`pickRate = acquiredCount / offeredCount`. For relics: `reward_picked` events are emitted 3× more often than `reward_offered`. Either:

- Relic reward screens emit `reward_picked` but never `reward_offered`.
- Shop relic purchases emit `reward_picked` (wrong kind of event — should be `shop_purchase` only).
- Event/Maryna relic grants emit `reward_picked` without a prior `reward_offered`.

Need to audit all `state.emit('reward_picked'…)` call sites vs `state.emit('reward_offered'…)`.

### F3 — Lift pipeline completely dark

`EntityAcc.runsWithoutEntity` is declared but never written. So `_buildEntityStats`:

```js
const runsWithout = Math.max(0, acc.runsWithoutEntity);   // always 0
const winrateWithout = runsWithout > 0 ? rateCi(...) : null;
const winrateLiftPp = winrateWithout != null ? ... : null;
```

…returns `null` for 100% of entities. Every "Lift" / "WR w/o" cell in Leaderboard shows `—`.

### F4 — Enemy floor/weather matrices dead

`EntityAcc.byFloor = {}` and `EntityAcc.byWeather = {}` are initialized but never populated. No code path writes to them. The Enemy Heatmap view correctly degrades to "No byFloor data in this metrics file — run with verbosity 'full' to collect floor-level stats.", but this message is misleading: even full-tier runs don't populate these fields.

### F5 — `avgTurnsToKill = 0` instead of `null`

`acc.killCount > 0` but `acc.turnsToKillTotal === 0` (never incremented) → `0/N = 0`. Should be `null` so the field hides in Entity Detail. `battle_ended` event payload needs to include the turn count so it can be aggregated.

### F6 — Boons unobserved

Every JSONL record has `finalBoons: []`. The sim either doesn't offer Maryna or doesn't capture boon picks in the run summary. `boon_offered` / `boon_picked` events are in `KNOWN_EVENT_KINDS` but the sim never emits them because the sim path might skip the Maryna node. Need to verify: does the engine's sim path reach Maryna? Is `marynaEnabled: true` by default in batch configs?

### B1 — Bots don't win

Even the best heuristic bot over 10,000 games wins 0.1%. Root causes (speculative, need profiling):

- `HeuristicBase` doesn't read `enemy.intent.expectedDamageToPlayer` when scoring block cards. Bot plays attacks greedily while taking lethal hits.
- Card scoring is single-turn only — no multi-turn planning.
- Reward selection targets `targetDeckSize: 15` rigidly, even when the deck is already dangerously weak.
- `endTurn` is triggered at `minPositiveScore: 0.5` — too aggressive; bot ends turn with energy unused when no card scores high.
- No adaptation to enemy archetype (Cepr vs Naganiacz vs bosses).

### UX1 — Leaderboard needs search/filter

Card kind has 50+ rows, relics 24, enemies 11. No way to jump to a specific entity by name or filter by sample tier.

### UX2 — No signal-bearing headline metric

Win Rate: 0%. For cards/relics with no wins in either population, lift is undefined. Need a metric that reflects progression:

- **Floor reached** (mean + p10/p50/p90 distribution) — already collected, just not surfaced per-entity.
- **Survival score**: `floorReached + (hp_at_death / maxHp)` — needs hp-at-death in the record.
- **Damage-per-energy** — available in `card_played` events, not aggregated.

---

## 3. Fix plan (by priority)

### Phase 1 — Analyzer truth (blocks everything downstream)

1. **F1**: Dedupe entity ids per run in `_processEndInventory`. Use `new Set(rec.finalDeck ?? [])` → iterate unique ids. Also `finalRelics` / `finalBoons`. (~15 lines)
2. **F3**: After the main loop, compute `acc.runsWithoutEntity = totalValidRuns - acc.runsWithEntity` and `acc.winsWithoutEntity = totalWins - acc.winsWithEntity` for every entity. This gives marginal "without" stats. (~10 lines; 1 global counter)
3. **F2**: Audit `state.emit` call sites. Likely fixes:
   - `ShopSystem.buyItem` for relics: emit only `shop_purchase`, not `reward_picked`.
   - `RelicSystem.addRelic` (boss/event grants): emit `reward_offered` + `reward_picked` as a pair, OR switch the dashboard formula to `acquiredCount / runsWithEntity` for relics (simpler).
   - Decision: switch formula for relics/boons to "of runs where the relic was ever in the pool, what fraction of runs ended with it acquired" → `acquiredCount / runCount` is even simpler.
4. **F5**: In `_buildEntityStats` guard: `avgTurnsToKill = acc.killCount > 0 && acc.turnsToKillTotal > 0 ? ... : null`. Also make `battle_ended` event include `turnCount` and aggregate it into `turnsToKillTotal`.
5. **F4**: Populate `acc.byFloor[floor].{wins,total}` and `acc.byWeather[w].{wins,total}` on `battle_started` + `battle_ended` events (need floor from `rec` envelope, weather from `rec.entityEvents[…weather_entered…]` preceding the battle). Output at `_buildEntityStats` as `{floor: wr, ...}` map keyed by floor.
6. **F6**: Investigate why `finalBoons` is always empty. Two sub-tasks:
   - Verify `engine.getRunSummary().finalBoons` extracts from `state.maryna.pickedId` correctly (source: `EngineController.js`).
   - If Maryna is skipped in sim, enable it in batch configs. Check `marynaEnabled` default.

### Phase 2 — Headline metric that reflects bot behaviour

7. Add `overall.floorReached` distribution to metrics: `{mean, lo, hi, p10, p50, p90, max}`. (~10 lines)
8. Add per-entity `avgFloorReachedWith` / `avgFloorReachedWithout` / `floorReachedLift` parallel to the winrate versions. Uses the same marginal computation from F3. (~20 lines)
9. Add `record.hpAtDeath` / `record.maxHpAtDeath` to `runOneGame._buildResult` from `engine.getRunSummary()` (engine side needs to expose these — currently it only exposes `outcome`).
10. Update Batch Summary to show floor-reached histogram + p10/p50/p90 as secondary cards.
11. Update Leaderboard to include "Floor w/" and "Floor lift" columns (sortable). Sort default by floor lift when winrate is all zeros.

### Phase 3 — Leaderboard UX

12. Add text search input at top of `views/leaderboard.js`: live-filter rows by `name` substring (case-insensitive) OR `id` substring.
13. Add tier dropdown: `all / green+yellow / green only`.
14. Sortable column headers (click to toggle asc/desc) for all numeric cols. Already partially sortable by winrateLiftPp — extend to all.
15. **E2**: Hide pick-rate column when all entries for the current kind tab have `pickRate === null` (events, enemies, weather, characters).
16. **E1**: Verify `eventLibrary[id].name` is set for every event in `src/data/events.js`. Fix the fallback-to-id entries.

### Phase 4 — HeuristicBot tuning

17. Factor `enemy.intent.expectedDamageToPlayer` into `blockUrgency` scoring. When intent damage ≥ `player.hp + player.block`, prioritise block-generating cards at `cardScore.lethalBonus` weight — same level as finishing attacks.
18. Add a `threatTurns` concept: look ahead 1-2 enemy intents. If cumulative damage > player.hp, shift to defensive mode regardless of deck score.
19. Calibrate `endTurn.minPositiveScore` down (currently 0.5 → try 0.1) so bot uses more energy before ending turn.
20. Add a per-bot `difficulty: 'normal'` override in bot configs — currently the baseline batch runs `difficulty: 'normal'`, but pool settings may push scaling. Verify.
21. Re-run 10k baseline after each tuning change. Gate: HeuristicBot ≥ 5% winrate.

---

## 4. TODO list (ordered)

Implement in this PR:

- [ ] **T1** Fix F1: `_processEndInventory` dedupes finalDeck/finalRelics/finalBoons per run.
- [ ] **T2** Fix F3: global totalValidRuns+totalWins → compute runsWithoutEntity/winsWithoutEntity per entity, populate winrateWithout/winrateLiftPp/liftCi.
- [ ] **T3** Fix F2: switch relic pickRate formula to `acquiredCount / runCount`, OR audit emit sites to balance offered/picked. Pick the simpler path.
- [ ] **T4** Fix F5: null-guard `avgTurnsToKill` + aggregate `turnsToKillTotal` from `battle_ended.turnCount`.
- [ ] **T5** Fix F4: populate `byFloor` and `byWeather` in the analyzer from events.
- [ ] **T6** Fix F6: enable boons in sim batch; verify `finalBoons` populates.
- [ ] **T7** Add `overall.floorReached` distribution (p10/p50/p90) + per-entity `avgFloorReachedWith/Without/Lift`.
- [ ] **T8** Surface floor-reached distribution in Batch Summary; add Floor columns to Leaderboard.
- [ ] **T9** Leaderboard search input (filter by name/id).
- [ ] **T10** Leaderboard tier filter dropdown.
- [ ] **T11** Leaderboard sortable columns.
- [ ] **T12** Fix E2: hide pick-rate col for kinds where pickRate is always null.
- [ ] **T13** Fix E1: ensure all events in `data/events.js` have a `name`.
- [ ] **T14** HeuristicBase: model enemy.intent.expectedDamageToPlayer in block scoring.
- [ ] **T15** HeuristicBase: multi-turn threat lookahead (2 turns).
- [ ] **T16** Regenerate 100k baseline + fixture after all fixes.
- [ ] **T17** Update `tests/analyze.test.js` for new metrics fields (runsWithoutEntity, floor lift, etc.).
- [ ] **T18** Update `docs/balancing-api-plan.md` §4.11 metrics.json spec to reflect actual shape.

Follow-up (separate PR):

- Paired A/B sims (`--paired card:foo`) to isolate individual-entity lift cleanly.
- SearchBot with MCTS rollouts — compare against HeuristicBot for "is this card strong, or does the heuristic love it?" signal.
- Bot divergence metric in Batch Summary.
- `data/events.js` name coverage.
- Proper `hpAtDeath` + survival score.

---

## 5. Verification

After each fix, rerun:

```bash
# 1. Tests
npx vitest run tests/analyze.test.js

# 2. 10k smoke (fast sanity check)
for a in heuristic aggressive defensive status greedy minimalist economy berserker draw-engine elitist; do
  npm run sim -- --games 1000 --agent "$a" --out "/tmp/mix_$a.jsonl"
  cat "/tmp/mix_$a.jsonl" >> /tmp/mix.jsonl
done
NODE_OPTIONS=--max-old-space-size=4096 node scripts/analyze.js /tmp/mix.jsonl /tmp/check.metrics.json

# 3. Dashboard walk-through (Batch Summary, Leaderboard × 6 kind tabs, Entity Detail, Heatmap, Matrix, Patch Comparison, Run Replay).
npx serve tools/dashboard -p 8081
```

Exit gates for this PR:

- Every entity has non-null `winrateWithEntity` (T2).
- Every relic has `0 ≤ pickRate ≤ 1` (T3).
- `runsWithEntity ≤ runCount` for every entity (T1).
- HeuristicBot ≥ 5% winrate over 10k games (T14/T15).
- Leaderboard search box filters rows in real time (T9).
- `npx vitest run` all green (T17).
