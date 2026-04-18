# Rachunek Status Counter: Detailed Timeline Analysis

## Executive Summary

**There IS a one-turn delay in bankruptcy resolution.** Rachunek is checked/applied immediately during card play, but bankruptcy is only **resolved at the START of the enemy's turn**, not immediately when the condition is met. This creates a window where the enemy gets one more turn even if rachunek >= hp.

---

## 1. WHEN RACHUNEK IS APPLIED/INCREMENTED

### During Player Card Play (Immediate)
When a player plays a card that adds rachunek:

**Location:** [src/state/CombatEngine.js](src/state/CombatEngine.js) - `playCard()` function execution → card's `effect()` callback

**Cards that add Rachunek:**
1. **Paragon za Gofra** (2nd cheapest rachunek card)
   - Adds 12 rachunek flat
   - Calls `state.addEnemyRachunek(12)`

2. **Wydruk z Kasy**
   - Adds 4 rachunek + deals 6 damage
   - Calls `state.addEnemyRachunek(4)`

3. **Eksmisja z Kwatery**
   - Conditionally adds 6 rachunek (only if enemy has Weak status)
   - Calls `state.addEnemyRachunek(6)`

4. **Rachunek za Oddychanie**
   - Adds 25% of current enemy rachunek (rounded up)
   - Formula: `state.addEnemyRachunek(Math.ceil(state.enemy.rachunek * 0.25))`
   - Cascading effect: if enemy has 10 rachunek, adds 3 → now 13, etc.

5. **Podatek Klimatyczny**
   - DOUBLES current rachunek (not via `addEnemyRachunek`, directly multiplies)
   - `state.enemy.rachunek *= 2`
   - Then calls `state._checkEnemyBankruptcy()` explicitly
   - This is the only non-additive rachunek card

6. **Nadplacony Bilet**
   - Does NOT add rachunek; uses rachunek for damage scaling
   - Reads current rachunek for +1 damage per 5 rachunek (max +5)

7. **Skrupulatne Wyliczenie**
   - Does NOT add rachunek; uses rachunek as damage threshold
   - Bonus damage only if rachunek >= 8

**Rachunek Application Flow:**
```
Player plays card → card.effect() executes → state.addEnemyRachunek(amount)
    ↓
addEnemyRachunek() in EnemyState.js:
  1. Check if amount > 0
  2. Check for enemy passives:
     - If 'targowanie_sie' (Gaździna): RESIST, reset to 0, emit event
     - If 'fiakier': apply only 70% (floor), minimum 1
  3. Increment: state.enemy.rachunek += appliedAmount
  4. Pekniete Liczydlo relic check: heal player +1 HP
  5. IMMEDIATELY call: state._checkEnemyBankruptcy()
```

---

## 2. WHEN BANKRUPTCY CHECKS HAPPEN

### Two-Tier Checking System

#### Tier 1: Check & Defer (`_checkEnemyBankruptcy()`)
**Location:** [src/state/EnemyState.js](src/state/EnemyState.js) line 14-21

Called **immediately** after rachunek is modified:
- After `addEnemyRachunek()` completes
- After `applyEnemyDebuff()` completes  
- After `Double Rachunek` card plays

**What it does:**
```javascript
export function checkEnemyBankruptcy(state) {
  if (state.enemyBankruptFlag) {
    state.enemyBankruptcyPending = false;
    return; // Already bankrupt, don't re-trigger
  }
  state.enemyBankruptcyPending = state._isEnemyBankruptcyConditionMet();
}
```

**Condition for bankruptcy:**
```javascript
export function isEnemyBankruptcyConditionMet(state) {
  if (state.enemy.passive === 'targowanie_sie') return false; // Gaździna IMMUNE
  if (state.enemy.rachunek <= 0) return false;
  return state.enemy.rachunek >= state.enemy.hp;  // THE TRIGGER
}
```

**Result:** Sets `enemyBankruptcyPending = true/false`, but **does NOT trigger bankruptcy yet**.

#### Tier 2: Resolve & Execute (`_resolveEnemyBankruptcyAtTurnStart()`)
**Location:** [src/state/EnemyState.js](src/state/EnemyState.js) line 36-40

Called **only at the start of the enemy's turn**, during `endTurn()` → enemy phase initialization

```javascript
export function resolveEnemyBankruptcyAtTurnStart(state) {
  state._checkEnemyBankruptcy(); // Re-check to update pending status
  if (!state.enemyBankruptcyPending) return false;
  state.enemyBankrupt(); // ACTUALLY trigger the bankruptcy
  state.enemyBankruptcyPending = false;
  return true;
}
```

---

## 3. DETAILED TURN SEQUENCE WITH RACHUNEK TIMELINE

### Initial Turn Setup

**Phase 0: Game Initialization** ([BattleLifecycle.js](src/state/BattleLifecycle.js) line 24)
```
initGame() or resetBattle()
  1. startTurn() ← Player turn 1 begins
  2. _applyBattleStartRelics() ← Relics like zloty_rozaniec take effect
```

### Per-Turn Flow

**Phase 1: Player Turn**
```
startTurn() [CombatEngine.js line 338]
  - Set player as active side
  - Draw cards
  - Apply player-start effects (koncesja_na_oscypki checks rachunek >= 20)
  
... Player plays cards ...
  playCard(handIndex)
    - If card adds rachunek:
      → state.addEnemyRachunek(X)
        → state._checkEnemyBankruptcy()  ← Sets enemyBankruptcyPending flag
        → NO BANKRUPTCY TRIGGER YET
    - If card is Podatek Klimatyczny:
      → state.enemy.rachunek *= 2
      → state._checkEnemyBankruptcy()  ← Sets flag
      → NO BANKRUPTCY TRIGGER YET

... All cards played ...

endTurn() [CombatEngine.js line 515]
  - Discard hand
  - Apply player end-of-turn status ticks
  - Special passive heals (krokus, papucie_po_babci)
  
  === ENEMY PHASE NOW STARTS ===
  
  state.combat.activeSide = 'enemy'
  
  ┌─────────────────────────────────────────────┐
  │ **CRITICAL CHECKPOINT: BANKRUPTCY CHECK**   │
  │ if (state._resolveEnemyBankruptcyAtTurnStart())
  │   → If rachunek >= hp: BANKRUPTCY TRIGGERED │
  │   → Return immediately, no enemy attack     │
  │   → Victory!                                 │
  └─────────────────────────────────────────────┘
  
  [If NOT bankrupt, continue enemy turn]
  
  - Enemy block reset
  - Enemy passive abilities (parcie_na_szklo, influencer_aura)
  - Execute enemy intent (attack/block/buff)
  - Enemy end-of-turn status ticks
  - Check _checkEnemyBankruptcy() again (after status ticks)
  
  Loop back to Phase 1 (Player's next turn)
```

---

## 4. THE ONE-TURN DELAY MECHANISM

### Why Does Delay Happen?

When you accumulate rachunek during your turn:

| Timing | Action | Rachunek State | Bankruptcy Triggered? |
|--------|--------|-----------------|----------------------|
| **Turn 1 (Player)** | Play "Paragon za Gofra", add 12 rachunek | rachunek = 12, hp = 12 | ❌ NO (deferred) |
| **Turn 1 (Transition)** | `endTurn()` called | rachunek = 12, hp = 12 | ✅ YES (resolved) |
| **Turn 1 (Enemy)** | Enemy gets one more turn? | — | — |

**Actually NO** — the resolution happens **before** the enemy attack in the same `endTurn()` call!

### The Real Mechanics

**The "delay" is NOT a delay — it's proper ordering:**

1. Player finishes playing cards with rachunek effects
2. `endTurn()` begins
3. **Immediately** at the top of enemy phase initialization: `_resolveEnemyBankruptcyAtTurnStart()` checks and resolves
4. If rachunek >= hp at that moment, enemy **never gets to attack this turn**
5. Battle ends immediately with victory

**No actual turn delay occurs.** However, there's a **window within a single turn:**

If you have `rachunek >= hp` during your own turn, you might think "I won", but the bankruptcy only **resolves** when transitioning to enemy's turn. During that transition, if the condition is still met, enemy never attacks.

---

## 5. SPECIAL LOGIC: CEPRZYCA VIP & FIAKIER

### Ceprzyca VIP (influencer_aura)
- **Passive:** `influencer_aura`
- **Rachunek Interaction:** NONE — no special rachunek mechanics
- **What it does:** Gains +5 block if player has 3+ cards in hand when attacking
- **NOT affected by rachunek rules**

### Fiakier (rachunek_za_kurs)
- **Passive:** `rachunek_za_kurs` (decorative name, not enforced in logic)
- **Rachunek Resistance:** Takes **only 70% of incoming rachunek** (floor, minimum 1)

**Implementation** ([EnemyState.js](src/state/EnemyState.js) line 64-85):
```javascript
export function addEnemyRachunek(state, amount) {
  if (amount <= 0) return;
  if (state.enemy.passive === 'targowanie_sie') {
    // Gaździna: completely immune
    state.rachunekResistEvent = true;
    state.enemy.rachunek = 0;
    state._checkEnemyBankruptcy();
    return;
  }
  
  let appliedAmount = amount;
  if (state.enemy.id === 'fiakier') {
    appliedAmount = Math.max(1, Math.floor(amount * 0.7));
  }
  
  state.enemy.rachunek += appliedAmount;
  // ... rest of checks
}
```

**Examples:**
- Paragon za Gofra (adds 12): Fiakier gets only 8 (floor of 8.4)
- Rachunek za Oddychanie (adds 25%): Reduced by 30% before application
- Single rachunek additions: Minimum 1 (e.g., add 1 → Fiakier gets 1)

**Bankruptcy Check for Fiakier:**
- Same as any enemy: when `rachunek >= hp`
- HP: 165 → needs rachunek >= 165
- With 70% reduction, much harder to bankrupt

**Tests:**
- ✅ [GameState.test.js](tests/GameState.test.js) line 1381: "fiakier takes only 70% of incoming rachunek"
- ✅ [GameState.test.js](tests/GameState.test.js) line 1392: "fiakier rachunek reduction still applies minimum 1 stack"
- ✅ [GameState.test.js](tests/GameState.test.js) line 1403: "fiakier is not bankrupted by a single 10-rachunek hit at 10 hp" (7 rachunek < 10 hp)

---

## 6. KEY CHECKPOINT CALLS IN CODE

| Location | Function | When Called | Purpose |
|----------|----------|-------------|---------|
| [EnemyState.js:14](src/state/EnemyState.js#L14) | `checkEnemyBankruptcy()` | After any rachunek change | Sets `enemyBankruptcyPending` flag |
| [EnemyState.js:36](src/state/EnemyState.js#L36) | `resolveEnemyBankruptcyAtTurnStart()` | [CombatEngine.js:600](src/state/CombatEngine.js#L600) during `endTurn()` | Actually triggers bankruptcy if pending |
| [CombatEngine.js:153](src/state/CombatEngine.js#L153) | `_checkEnemyBankruptcy()` | After damage/HP changes | Rechecks condition |
| [CombatEngine.js:594](src/state/CombatEngine.js#L594) | `_checkEnemyBankruptcy()` | After enemy passive heal (baba) | Rechecks condition |
| [CombatEngine.js:626](src/state/CombatEngine.js#L626) | `_checkEnemyBankruptcy()` | After enemy status ticks | Rechecks condition |
| [CombatEngine.js:634](src/state/CombatEngine.js#L634) | `_checkEnemyBankruptcy()` | After busiarz strength gain | Rechecks condition |

---

## 7. COMPLETE TIMELINE: EXAMPLE SCENARIO

### Scenario: Playing Paragon za Gofra with hp = 12

```
=== TURN 1 (PLAYER) ===
Player has 12 oscypek, enemy has 12 hp, 0 rachunek

startTurn() called
  Player draws 5 cards including Paragon za Gofra

playCard(0) - Paragon za Gofra
  ✓ Card plays successfully
  ✓ Draws 1 card
  └─→ addEnemyRachunek(12)
      ├─ appliedAmount = 12 (no special logic)
      ├─ enemy.rachunek += 12 (now 12)
      ├─ _checkEnemyBankruptcy() called
      │  └─ isEnemyBankruptcyConditionMet() returns TRUE (12 >= 12)
      │  └─ enemyBankruptcyPending = true ⚠️ PENDING, NOT RESOLVED
      └─ Return from card effect

Player may play more cards...

endTurn() called [CombatEngine.js:515]
  - Discard hand
  - Tick player status
  - Drain halny block
  
  state.combat.activeSide = 'enemy'
  state.combat.firstAttackUsed = false
  
  ➡️ _resolveEnemyBankruptcyAtTurnStart() called [line 600]
     ├─ _checkEnemyBankruptcy() called
     │  └─ isEnemyBankruptcyConditionMet() returns TRUE
     │  └─ enemyBankruptcyPending = true (still true)
     ├─ enemyBankruptcyPending is TRUE → proceed
     ├─ enemyBankrupt() called [EnemyState.js:45]
     │  ├─ enemyBankruptFlag = true
     │  ├─ enemy.hp = 0
     │  ├─ enemy.isBankrupt = true
     │  ├─ bonus = min(25, floor(12/3)) = 4
     │  ├─ addDutki(4)
     │  └─ lastVictoryMessage = "Wróg zbankrutował! +4 Dutków"
     ├─ enemyBankruptcyPending = false
     └─ RETURN TRUE (battle ends)
  
  ✅ checkWinCondition() returns 'player_win'
  ✅ Victory screen shows +4 Dutki bonus
  
=== BATTLE OVER ===
```

---

## 8. SUMMARY TABLE

| Aspect | Details |
|--------|---------|
| **When Applied** | During card play, immediately via `addEnemyRachunek()` |
| **When Checked** | Immediately after each rachunek change (6+ locations) |
| **When Resolved** | At START of enemy turn in `endTurn()` → `_resolveEnemyBankruptcyAtTurnStart()` |
| **Bankruptcy Condition** | `rachunek >= enemy.hp` (except for passives) |
| **Delay Type** | Not a delay—proper deferred resolution within same turn |
| **Enemy Gets Extra Turn?** | ❌ NO—bankruptcy resolved before enemy can attack |
| **Fiakier Special** | Takes only 70% of incoming rachunek (floor, min 1) |
| **Ceprzyca VIP Special** | NO special rachunek mechanics (only influencer_aura for block) |
| **Gaździna (targowanie_sie)** | Completely immune—rachunek stays at 0 |

---

## 9. RELATED FILES

- **Core Logic:** [src/state/EnemyState.js](src/state/EnemyState.js)
- **Turn Flow:** [src/state/CombatEngine.js](src/state/CombatEngine.js)
- **Cards:** [src/data/cards.js](src/data/cards.js) (6 cards with rachunek tags)
- **Enemies:** [src/data/enemies.js](src/data/enemies.js) (Fiakier with 70% resistance)
- **Tests:** [tests/GameState.test.js](tests/GameState.test.js) lines 572–605 (bankruptcy tests)

---

## 10. KEY INSIGHTS

✅ **Immediate application:** Rachunek is added/incremented instantly during card play
✅ **Deferred resolution:** Bankruptcy check happens immediately, but resolution waits for enemy turn
✅ **No actual delay:** Enemy never gets a bonus turn—resolution occurs before enemy can act
✅ **Multiple checks:** Bankruptcy is re-checked after every status tick and passive ability
✅ **Special cases:** Fiakier (70% resistance), Gaździna (100% immunity), Ceprzyca VIP (no special logic)
✅ **Cascading effects:** Cards like "Rachunek za Oddychanie" multiply on existing rachunek
✅ **Bonus calculation:** Min of 25 or floor(rachunek / 3) in dutki reward

