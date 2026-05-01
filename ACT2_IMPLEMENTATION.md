# Act 2 Implementation: Morskie Oko

## Part 1: Act 2 Map Transition

### Context

This is "Usiec Cepra", a Slay-the-Spire-like deckbuilder. We have Act 1 ("KRUPÓWKI"). We need to add Act 2 ("MORSKIE OKO").

**Goal for first iteration:** When the player defeats the Act 1 boss (currentAct=1, boss node victory), stop showing the endgame screen and transition to a new Act 2 map (reuse Act 1 map generation logic for now). Preserve all player progress (deck, relics, HP, Dutki) between acts.

### Key Existing References

- **`src/state/GameState.js`**: Has `currentAct` (1), `currentActName` ("KRUPÓWKI"), `generateMap()`, `checkWinCondition()` delegates to `BattleLifecycle.js`
- **`src/state/BattleLifecycle.js`**: Handles battle victory, calls `resetBattle()`, currently triggers run end for Act 1 boss
- **`src/ui/UIManager.js`**: Shows run summary via `_showRunSummaryOverlay()` when `state.runSummary` is set

### Implementation Steps

#### 1. Add Act 2 Transition Logic to GameState

Add `startAct2()` method that:

- Sets `this.currentAct = 2`, `this.currentActName = 'MORSKIE OKO'`
- Calls `this.generateMap()` (reuse same map gen as Act 1)
- Resets battle-scoped state (enemy, turn counters) but preserves deck/relics/HP/Dutki
- Sets `this.currentScreen = 'map'`

#### 2. Modify Battle Victory Flow

In `BattleLifecycle.js` after player wins:

- Check if `state.currentAct === 1` and current node type is 'boss'
- If true: call `state.startAct2()` instead of triggering run end
- Skip setting `state.runSummary` (avoids endgame screen)

#### 3. Update UI to Skip Endgame for Act 2

In `UIManager` battle victory handler: skip `_showRunSummaryOverlay()` if transitioning to Act 2 (detect via `state.currentAct === 2` post-victory)

#### 4. Temporary: Reuse Act 1 Map Gen for Act 2

No act-specific map changes yet; `generateMap()` uses same params for both acts.

---

## Part 2: Act 2 Transition Relics

### Context

After defeating Act 1 boss (transition to Act 2 "MORSKIE OKO"), player gets a special relic reward. We need 7 new powerful relics that use existing game mechanisms and provide extra Oscypek (energy) at a gameplay cost.

All 7 relics must be:

- **Rare** rarity
- **Boss-reward-only** (obtainable only from the Act 1 boss transition reward, never from normal relic pools)

### Existing Mechanisms to Reuse

Study these existing relics for patterns:

- **Battle start triggers**: `flaszka_sliwowicy` (+2 strength), `papryczka_marka` (+3 strength, -1 HP/turn)
- **Card play counters**: `bilet_tpn` (every 3rd attack → +1 Oscypek)
- **Turn start effects**: `wiatr_halny` (+2 cards/turn), `relic_boon_zloty_rozaniec` (next_double + 5 block)
- **Damage scaling**: `pocztowka_giewont` (first 2 cards trigger twice)
- **HP/block interactions**: `kierpce_wyprzedazy` (lose HP → draw + block), `krokus` (8+ block → heal 2)
- **Energy manipulation**: `sernik` card gives +1 Oscypek, `energy_next_turn` status

### Proposed 7 Relics

Add to `relicLibrary` in `src/data/relics.js`:

#### 1. `pasterski_termos` (rare, 🍵) - "Pasterski Termos"

- **Effect (tuned)**: Start of battle: +2 Oscypki this turn. At end of battle: lose 2 Krzepy (minimum 1 HP).
- **Uses**: `player.energy`, `player.hp` manipulation (battle start + battle end hooks)

#### 2. `muffin_oscypkowy` (rare, 🧁) - "Muffin z Oscypkiem"

- **Effect (tuned)**: Every 2nd Attack card played in a turn: gain 1 Oscypek (max 2 Oscypki per turn).
- **Uses**: Card play tracking (like `bilet_tpn`) + per-turn counters (reset on turn start)

#### 3. `kedziorek_na_energie` (rare, 🎒) - "Kędziołek na Energię"

- **Effect (tuned)**: Start of combat: +2 Oscypki. When you take HP damage with 0 Garda (enemy breaks through completely): lose 1 Oscypek next turn.
- **Rationale**: Penalty fires on the enemy turn when block reaches 0, always meaningful. Rewards maintaining Garda, punishes getting hit bare. Cannot be wasted by a 0-energy hand.
- **Uses**: Battle start hook + `applyDamageToPlayer` hook (check `player.block === 0` before applying damage)

#### 4. `herbata_zimowa` (rare, ☕) - "Herbata Zimowa"

- **Effect (tuned)**: Start of every 2nd turn: +1 Oscypek. End of turn: if you have 8+ Garda, lose 1 Oscypek.
- **Uses**: Turn start/end hooks, turn parity check, block threshold check

#### 5. `portfel_turysty` (rare, 👛) - "Portfel Turysty"

- **Effect (tuned)**: First shop purchase in each shop visit: gain +1 temporary Oscypek for next battle start.
- **Uses**: Shop purchase hook only (avoid global Dutki gain/spend listeners)

#### 6. `ciupaga_ekspresowa` (rare, ⚡) - "Ciupaga Ekspresowa"

- **Effect (tuned)**: First Skill card each turn costs 0 Oscypków. No extra Oscypek gain, no carryover clause.
- **Uses**: Card cost modification with once-per-turn flag

#### 7. `dzban_mleka` (rare, 🥛) - "Dzbanek Mleka"

- **Effect (tuned)**: Start of battle: -1 Oscypek. Healing effects grant +1 Oscypek per 3 HP healed (max 2 Oscypki per turn).
- **Uses**: Healing hooks + per-turn energy cap + battle start penalty

---

## Part 3: Act 2 Boss Relics (Rachunek / Lans / Weather)

9 more Rare boss-only relics, dropped from Act 2 boss fights. Same flags as Part 2: `rarity: 'rare'`, `act2Only: true`, `bossRewardOnly: true`.

### 3× Rachunek Relics

Rachunek mechanic recap: `enemy.rachunek` accumulates; when `rachunek >= enemy.hp` the enemy goes bankrupt (instant kill). Hook: `addEnemyRachunek(amount)`, `enemyBankrupt()`.

#### 1. `paragon_startowy` (rare, 🧾) - "Paragon Startowy"

- **Effect**: Start of each battle: enemy immediately has 6 Rachunek.
- **Rationale**: Jumpstarts Rachunek strategy without needing dedicated cards; safe on its own, scales well with Rachunek builds.
- **Hook**: `applyBattleStartRelics` → `state.addEnemyRachunek(6)`

#### 2. `ksiega_dluguw` (rare, 📒) - "Księga Długów"

- **Effect**: Every Skill card you play adds 2 Rachunek to the enemy.
- **Rationale**: Opens Rachunek path to control/skill-heavy decks; existing `goralska_goscinnosc` already does this for attacks.
- **Hook**: `playCard` → `if (card.type === 'skill') state.addEnemyRachunek(2)`

#### 3. `bankructwo_z_bonusem` (rare, 💸) - "Bankructwo z Bonusem"

- **Effect**: When the enemy goes bankrupt via Rachunek: heal 6 Krzepy and gain 20 Dutki.
- **Rationale**: Rewards Rachunek-focused runs with meaningful post-kill bonus; has zero effect if enemy is killed by HP.
- **Hook**: `enemyBankrupt()` in `EnemyState.js`

---

### 3× Lans Relics

Lans mechanic recap: `player.status.lans > 0` = active; absorbs incoming damage at (2 + lansHitsAbsorbed) Dutki/HP cost; when Dutki run out, Lans breaks → player stunned, `lansBreakEvent` fires.

#### 4. `pancerz_z_lansu` (rare, 🛡️) - "Pancerz z Lansu"

- **Effect**: While Lans is active, reduce all incoming HP damage by 2 (minimum 0).
- **Rationale**: Makes Lans a real defensive layer on top of its Dutki-absorption; stacks with existing Lans mechanics without replacing them.
- **Hook**: `takeDamage` in `PlayerState.js` → `if (state._isLansActive()) dealt = Math.max(0, dealt - 2)`

#### 5. `wejscie_z_przytupem` (rare, 👞) - "Wejście z Przytupem"

- **Effect**: When Lans activates: deal 5 damage to the enemy.
- **Rationale**: Gives offensive value to Lans activation; synergizes with `blacha_przewodnika` (free 5 dmg every battle) without being broken on its own.
- **Hook**: `setLansActive` in `PlayerState.js` → `if (active && !wasActive) state._applyDamageToEnemy(5)`

#### 6. `zaszczyt_upadku` (rare, 🏳️) - "Zaszczyt Upadku"

- **Effect**: When Lans breaks (runs out of Dutki): draw 2 cards and gain +2 Oscypki next turn.
- **Rationale**: Converts the Lans-break stun penalty into a comeback moment; incentivises intentional Lans stretching.
- **Hook**: Consume `lansBreakEvent` in `startTurn` of `CombatEngine.js` → `state._drawCards(2); state.player.status.energy_next_turn += 2`

---

### 3× Weather Relics

Weather recap: `currentWeather` ∈ `{clear, halny, frozen, fog}`. Halny drains 2 block/end-of-turn both sides. Frozen: Weak = −50% dmg. Fog: first attack each side has 25% miss.

#### 7. `plecak_na_kazda_pogode` (rare, 🎒) - "Plecak na Każdą Pogodę"

- **Effect**: Start of each battle, bonus based on weather:
  - `clear` → +1 Oscypek this turn
  - `halny` → gain 6 Garda
  - `frozen` → apply 1 Vulnerable to enemy
  - `fog` → draw 2 cards
- **Rationale**: Always gives something; adapts to every node without being trivially best in one weather. Wide design space.
- **Hook**: `applyBattleStartRelics` with `switch(state.currentWeather)`

#### 8. `goralska_skora` (rare, 🏔️) - "Góralska Skóra"

- **Effect**: Negative weather effects on you are halved: Halny drains only 1 block per turn (instead of 2); fog miss chance reduced to 12% (instead of 25%).
- **Rationale**: Mitigates Act 2 weather variance; strong on halny maps; opens block-building in previously punishing conditions.
- **Hook**: `applyHalnyBlockDrain` → `if (hasRelic('goralska_skora') && entity === state.player) amount = 1`; fog miss roll → `if (hasRelic('goralska_skora')) threshold = 0.12`

#### 9. `barometr_tatrzanski` (rare, 🌡️) - "Barometr Tatrzański"

- **Effect**: Start of each turn in non-clear weather: +1 Oscypek.
- **Rationale**: Reliable energy engine in Act 2 where weather is always active; no effect in clear-sky nodes (fair tradeoff). Never gains multiple Oscypki — simple, predictable.
- **Hook**: `startTurn` in `CombatEngine.js` → `if (hasRelic('barometr_tatrzanski') && state.currentWeather !== 'clear') state.player.energy += 1`

---

### Relic Implementation Steps

1. **Add relic definitions** to `src/data/relics.js` with all of:
   - `rarity: 'rare'`
   - `act2Reward: true`
   - `act2Only: true`
   - `bossRewardOnly: true` (new explicit gate for this reward channel)

2. **Wire into Act 2 transition** in `BattleLifecycle.js`:
   - After Act 1 boss victory, before `startAct2()`, offer reward from only these 7 relics
   - Prefer 3-choice boss reward (pick 1), fallback to random 1 if UI reuse is constrained
   - Use `state.addRelic(relicId)` after player choice
   - Show special relic reward screen (reuse `RewardRenderer.js` logic)

3. **Implement relic effects** in relevant subsystems:
   - Add hooks in `CombatEngine.js` (battle start/end)
   - Add hooks in `PlayerState.js` (card play, block gain, healing)
   - Add hooks in `ShopSystem.js` (shop purchase marker for next-battle temporary energy)
   - Add per-turn reset fields in turn start flow for capped/once-per-turn relic triggers

4. **Enforce boss-only availability** so they don't appear in regular pools:
   - Keep `act2Only: true` and `bossRewardOnly: true` on definitions
   - Update `RelicSystem.js` `buildAvailableRelicPool()` to exclude `act2Only` and `bossRewardOnly`
   - Add dedicated selector for transition reward pool (e.g. `buildAct2BossRelicPool()`)

---

## Repo Conventions

- **L2 state logic**, **L3 UI only**
- No DOM in state, no game math in UI
- Use existing methods like `generateMap()`, `getCurrentMapNode()`
- Polish terminology: Góral, Ceper, Oscypki, Krzepa, Garda, Dutki
- Use Polish names and descriptions for relics

## Files to Modify

1. `src/state/GameState.js` - Add `startAct2()` method
2. `src/state/BattleLifecycle.js` - Modify victory flow for Act 1 boss, grant Act 2 relic
3. `src/ui/UIManager.js` - Skip endgame screen for Act 2 transition
4. `src/data/relics.js` - Add 16 relic definitions as rare with `act2Only: true` and `bossRewardOnly: true` (7 transition + 9 boss)
5. `src/state/CombatEngine.js` - Add hooks for new relic effects (battle start/end)
6. `src/state/PlayerState.js` - Add hooks for card play/block/healing relics
7. `src/state/ShopSystem.js` - Add shop-purchase hook and next-battle temporary energy marker for `portfel_turysty`
8. `src/state/RelicSystem.js` - Handle `act2Only` + `bossRewardOnly` filtering, transition pool builder, and Act 2 boss reward pool builder
9. `src/state/EnemyState.js` - Add `bankructwo_z_bonusem` hook in `enemyBankrupt()`

## Testing

- Test that defeating Act 1 boss transitions to new map instead of showing endgame
- Verify all player progress is preserved (deck, relics, HP, Dutki)
- Confirm Act 2 map generates correctly
- Test that one of the 7 transition relics is granted after Act 1 boss
- Test all 16 relics are marked rare
- Test all 16 relics never appear in normal relic rewards/shops/treasure
- Verify transition relic effects work correctly (Oscypek gains, costs)
- Test Rachunek relics: `paragon_startowy` sets 6 rachunek at battle start; `ksiega_dluguw` adds 2 per skill card; `bankructwo_z_bonusem` triggers heal+Dutki on bankruptcy kill
- Test Lans relics: `pancerz_z_lansu` reduces damage while Lans active; `wejscie_z_przytupem` deals 5 dmg on activation; `zaszczyt_upadku` draws 2 + gives +2 energy next turn on Lans break
- Test Weather relics: `plecak_na_kazda_pogode` gives correct bonus per weather; `goralska_skora` halves Halny drain + fog miss; `barometr_tatrzanski` gives +1 energy on non-clear turns
- Run `npm test` to ensure no regressions
