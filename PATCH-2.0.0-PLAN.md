# PATCH 2.0.0 — Architectural Refactor

**Goal:** Split monolithic `GameState.js` (3 064 LOC) and `UIManager.js` (3 247 LOC) into focused ES modules.  
**Constraints:** Zero logic changes. 100% feature parity. All quality gates must stay green after every file.

---

## File Size Inventory

| File                        | Lines | Action                               |
| --------------------------- | ----- | ------------------------------------ |
| `src/state/GameState.js`    | 3 064 | Split — becomes thin orchestrator    |
| `src/ui/UIManager.js`       | 3 247 | Split — becomes thin orchestrator    |
| `src/data/enemies.js`       | 798   | Leave intact (data-only)             |
| `src/data/cards.js`         | 625   | Leave intact (data-only)             |
| `src/logic/AudioManager.js` | 517   | Leave intact (single responsibility) |
| Everything else             | < 300 | Leave intact                         |

---

## Proposed ES Module Tree

```
src/
├── main.js                          (unchanged – wiring only)
│
├── data/                            (unchanged – pure data objects)
│   ├── cards.js
│   ├── characters.js
│   ├── enemies.js
│   ├── events.js
│   ├── marynaBoons.js
│   ├── relics.js
│   ├── releaseNotes.js
│   ├── tutorialConfig.js
│   └── weather.js
│
├── logic/                           (unchanged)
│   ├── AudioManager.js
│   └── settings.js
│
├── state/
│   ├── GameState.js                 (thin orchestrator – imports & delegates)
│   │
│   ├── MapEngine.js                 [NEW] ~500 lines
│   │   ├── generateMap()
│   │   ├── _createMapNode()
│   │   ├── _forceRow1CeprFights()
│   │   ├── _rollMidNodeType()
│   │   ├── _rollNodeWeather()
│   │   ├── _seedRequiredPaths()
│   │   ├── _connectOptionalGridNodes()
│   │   ├── _removeCrossingConnections()
│   │   ├── _pruneUnreachableNodes()
│   │   ├── _ensureGuaranteedPathRewards()
│   │   ├── _enforcePseSpecialNodeLimits()
│   │   ├── _ensureReachableElite()
│   │   ├── _ensureReachableTrueEvent()
│   │   ├── _trimNodeType()
│   │   ├── _getReachableCoordinates()
│   │   ├── _setNodeType()
│   │   ├── _getAdjacentColumns()
│   │   ├── _pickNextColumn()
│   │   ├── _linkNode()
│   │   └── _hasInbound()
│   │
│   ├── NavigationState.js           [NEW] ~200 lines
│   │   ├── getReachableNodes()
│   │   ├── canTravelTo()
│   │   ├── travelTo()
│   │   ├── getCurrentMapNode()
│   │   ├── getMapNodeMeta()
│   │   ├── applyJumpToBossShortcut()
│   │   ├── _setCurrentWeatherFromNode()
│   │   └── _getCurrentAct()
│   │
│   ├── CombatEngine.js              [NEW] ~600 lines
│   │   ├── startTurn()
│   │   ├── playCard()
│   │   ├── endTurn()
│   │   ├── _drawCards()
│   │   ├── _drawPerTurn()
│   │   ├── _applyBattleStartRelics()
│   │   ├── _applyEnemyIntent()
│   │   ├── _applyDamageToEnemy()
│   │   ├── _applyDamageToPlayer()
│   │   ├── getEnemyIntentDamage()
│   │   ├── getEnemyIntentText()
│   │   └── _resetBattleScopedFlags()
│   │
│   ├── PlayerState.js               [NEW] ~300 lines
│   │   ├── gainMaxHp()
│   │   ├── healPlayer()
│   │   ├── gainPlayerBlockFromCard()
│   │   ├── calculateDamage()
│   │   ├── takeDamage()
│   │   ├── queueNextAttackCardBonus()
│   │   ├── setSmyczKeptCard()
│   │   ├── getCardCostInHand()
│   │   ├── getCardShopPrice()
│   │   ├── getShopRemovalPrice()
│   │   ├── afterShopCardRemoval()
│   │   ├── _applyHalnyBlockDrain()
│   │   ├── _setLansActive()
│   │   └── _isLansActive()
│   │
│   ├── EnemyState.js                [NEW] ~250 lines
│   │   ├── _createEnemyState()
│   │   ├── _pickRandomEnemyDef()
│   │   ├── _pickFinalBossDef()
│   │   ├── _buildEnemyIntent()
│   │   ├── _refreshEnemyIntent()
│   │   ├── _rollEnemyAttack()
│   │   ├── _handleEnemyPhaseTransitions()
│   │   ├── applyEnemyDebuff()
│   │   ├── addEnemyRachunek()
│   │   ├── _checkEnemyBankruptcy()
│   │   ├── _isEnemyBankruptcyConditionMet()
│   │   ├── _resolveEnemyBankruptcyAtTurnStart()
│   │   ├── enemyBankrupt()
│   │   └── applyEnemyDebugStatus()
│   │
│   ├── RelicSystem.js               [NEW] ~280 lines
│   │   ├── hasRelic()
│   │   ├── addRelic()
│   │   ├── grantTreasureRelic()
│   │   ├── generateRelicReward()
│   │   ├── generateRelicChoices()
│   │   ├── _buildAvailableRelicPool()
│   │   ├── _markRelicAsSeen()
│   │   ├── getRandomItem()
│   │   └── _pickUniqueItems()
│   │
│   ├── ShopSystem.js                [NEW] ~150 lines
│   │   ├── generateShopStock()
│   │   ├── buyItem()
│   │   ├── spendDutki()
│   │   ├── grantBattleDutki()
│   │   ├── getPrestizNaKredytBlock()
│   │   └── addDutki()
│   │
│   ├── DeckManager.js               [NEW] ~100 lines
│   │   ├── removeCardFromDeck()
│   │   ├── getUpgradeableAttackCards()
│   │   ├── upgradeCardDamage()
│   │   ├── getCardDamageBonus()
│   │   ├── generateCardRewardChoices()
│   │   └── getRunDeckCardIds()
│   │
│   ├── MarynaSystem.js              [NEW] ~120 lines
│   │   ├── rollMarynaChoices()
│   │   ├── pickMarynaBoon()
│   │   └── _applyMarynaBoonImmediateEffects()
│   │
│   ├── EventSystem.js               [NEW] ~150 lines
│   │   ├── pickRandomEventDef()
│   │   ├── setActiveEvent()
│   │   ├── getActiveEventDef()
│   │   ├── clearActiveEvent()
│   │   ├── applyActiveEventChoice()
│   │   ├── queueEventBattle()
│   │   ├── consumeQueuedEventBattle()
│   │   ├── consumePendingEventVictoryRelicReward()
│   │   └── startBattleWithEnemyId()
│   │
│   ├── BattleLifecycle.js           [NEW] ~150 lines
│   │   ├── initGame()
│   │   ├── resetBattle()
│   │   ├── checkWinCondition()
│   │   ├── resetForNewRun()
│   │   ├── captureRunSummary()
│   │   └── getRunDeckCardIds()
│   │
│   └── StatusEffects.js             [NEW] ~60 lines
│       ├── defaultStatus()           (pure factory — no side effects)
│       ├── _tickStatus()             (pure function — no side effects)
│       └── WeatherHelpers:
│           ├── _registerWeatherMiss()
│           ├── consumeWeatherMissEvent()
│           └── getCurrentWeather()
│
└── ui/
    ├── UIManager.js                 (thin orchestrator – imports & delegates)
    │
    ├── renderers/
    │   ├── CardRenderer.js          [NEW] ~150 lines
    │   │   ├── _renderHand()
    │   │   ├── _getCardDescription()
    │   │   └── _createExhaustBadge()
    │   │
    │   ├── StatusRenderer.js        [NEW] ~150 lines
    │   │   ├── _renderStatuses()
    │   │   ├── _renderEnemyPresentation()
    │   │   ├── _renderRelics()
    │   │   └── _renderWeatherIndicator()
    │   │
    │   ├── MapRenderer.js           [NEW] ~350 lines
    │   │   ├── _openMapOverlay()
    │   │   ├── _renderMapTrack()
    │   │   ├── _drawMapConnections()
    │   │   └── _handleMapNodeSelect()
    │   │
    │   ├── ShopRenderer.js          [NEW] ~200 lines
    │   │   ├── _openShop()
    │   │   ├── _closeShop()
    │   │   ├── _renderShopOffers()
    │   │   ├── _populateRemoveCardSelect()
    │   │   ├── _buyShopHeal()
    │   │   └── _buyCardRemoval()
    │   │
    │   ├── RewardRenderer.js        [NEW] ~400 lines
    │   │   ├── _showVictoryOverlay()
    │   │   ├── showRelicScreen()
    │   │   ├── _showCardRewardScreen()
    │   │   ├── _closeRewardScreens()
    │   │   ├── _showEliteRewardOverlay()
    │   │   ├── _showScriptedEventBattleRewards()
    │   │   └── _showRunSummaryOverlay()
    │   │
    │   ├── EventRenderer.js         [NEW] ~150 lines
    │   │   ├── _openRandomEvent()
    │   │   ├── _handleRandomEventChoice()
    │   │   └── _continueAfterRandomEvent()
    │   │
    │   ├── LibraryRenderer.js       [NEW] ~120 lines
    │   │   ├── _openLibraryOverlay()
    │   │   ├── _setLibraryTab()
    │   │   ├── _setLibraryFilter()
    │   │   └── _renderLibrary()
    │   │
    │   └── PileViewerRenderer.js    [NEW] ~200 lines
    │       ├── _openPileViewer()
    │       ├── _closePileViewer()
    │       ├── _renderPileViewer()
    │       └── _buildPileViewerData()
    │
    ├── overlays/
    │   ├── CampfireOverlay.js       [NEW] ~80 lines
    │   │   ├── _openCampfire()
    │   │   ├── _closeCampfire()
    │   │   ├── _useCampfireHeal()
    │   │   └── _useCampfireUpgrade()
    │   │
    │   └── MarynaOverlay.js         [NEW] ~80 lines
    │       └── _openMarynaBoonOverlay()
    │
    ├── combat/
    │   └── CombatUI.js              [NEW] ~320 lines
    │       ├── _handlePlayCard()
    │       ├── _handleEndTurn()
    │       ├── _showEndGame()
    │       ├── _showFloatingText()
    │       ├── _showLansDutkiSpentFeedback()
    │       └── _triggerAnim()
    │
    ├── tutorial/
    │   ├── tutorialFlow.js          (unchanged)
    │   └── TutorialUI.js            [NEW – extracted from UIManager] ~450 lines
    │       ├── _handleTutorialStart()
    │       ├── _buildTutorialFixedHand()
    │       ├── _startTutorialRewardPhase()
    │       ├── _renderTutorialOverlay()
    │       ├── _isTutorialCardPlayAllowed()
    │       ├── _isTutorialEndTurnAllowed()
    │       └── (all remaining _tutorial* methods)
    │
    ├── debug/
    │   └── DebugOverlay.js          (existing – already extracted)
    │
    └── helpers/
        └── UIHelpers.js             [NEW] ~120 lines
            ├── _rarityClass()
            ├── _rarityLabel()
            ├── getFullCardType()
            ├── _hideOverlay()
            ├── _isInputLocked()
            ├── _revealedEventEmoji()
            └── _scaleGame()
```

---

## Test Plan: Existing → New Modules

### `tests/GameState.test.js` → Split into:

| New Test File                         | Covers Module                  | Migrated `describe` blocks                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/state/MapEngine.test.js`       | `MapEngine.js`                 | `map and economy` (map-generation subset: node limits, path connectivity, reachability)                                                                                                                                                                                                                                                                                             |
| `tests/state/NavigationState.test.js` | `NavigationState.js`           | `map and economy` (travelTo, canTravelTo, getReachableNodes subset)                                                                                                                                                                                                                                                                                                                 |
| `tests/state/CombatEngine.test.js`    | `CombatEngine.js`              | `playCard basics`, `ciupaga`, `kierpce`, `gasior`, `hej`, `prestiz_na_kredyt`, `sernik`, `redyk`, `paragon_za_gofra`, `podatek_klimatyczny`, `wypozyczone_gogle`, `zdjecie_z_misiem`, `parzenica`, `zadyma`, `zyntyca`, `janosik`, `echo`, `sandaly`, `giewont`, `pchniecie_ciupaga`, `barchanowe_gacie`, `szukanie_okazji`, `lodolamacz`, `endTurn`, `startTurn`, `deck recycling` |
| `tests/state/PlayerState.test.js`     | `PlayerState.js`               | `calculateDamage`, `strength status`, `weak status`, `next_double status`, `lans status`, `furia_turysty`, `spostrzegawczosc`, `pocieszenie`, `halny`, `duma_podhala`, `zemsta_gorala`, `mocny_organizm`                                                                                                                                                                            |
| `tests/state/EnemyState.test.js`      | `EnemyState.js`                | `cepr - Pytanie o drogę`, `busiarz`, `influencerka`, `baba`, `boss - Król Krupówek`, `elite passives`                                                                                                                                                                                                                                                                               |
| `tests/state/RelicSystem.test.js`     | `RelicSystem.js`               | `relics` (all relic tests), `relic library helper`                                                                                                                                                                                                                                                                                                                                  |
| `tests/state/ShopSystem.test.js`      | `ShopSystem.js`                | `map and economy` (buyItem, grantBattleDutki, addDutki subset)                                                                                                                                                                                                                                                                                                                      |
| `tests/state/DeckManager.test.js`     | `DeckManager.js`               | `deck recycling`, `initGame` (deck rebuild portion)                                                                                                                                                                                                                                                                                                                                 |
| `tests/state/MarynaSystem.test.js`    | `MarynaSystem.js`              | `Maryna boon system`                                                                                                                                                                                                                                                                                                                                                                |
| `tests/state/EventSystem.test.js`     | `EventSystem.js`               | `startBattleWithEnemyId` tests                                                                                                                                                                                                                                                                                                                                                      |
| `tests/state/BattleLifecycle.test.js` | `BattleLifecycle.js`           | `initGame`, `resetBattle`, `checkWinCondition`, `run summary capture`                                                                                                                                                                                                                                                                                                               |
| `tests/state/StatusEffects.test.js`   | `StatusEffects.js`             | `weak status`, `next_double status` (tick-only subset)                                                                                                                                                                                                                                                                                                                              |
| `tests/state/DebugHelpers.test.js`    | `GameState.js` (debug methods) | `debug helpers`                                                                                                                                                                                                                                                                                                                                                                     |

### Existing test files — keep unchanged:

| File                           | Reason                                       |
| ------------------------------ | -------------------------------------------- |
| `tests/dataExports.test.js`    | Tests data modules; no changes needed        |
| `tests/tutorialConfig.test.js` | Tests `tutorialConfig.js`; no changes needed |

### New UI test files (currently no UI tests):

| New Test File                   | Covers            | What to Test                                                                                      |
| ------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `tests/ui/UIHelpers.test.js`    | `UIHelpers.js`    | `_rarityClass`, `_rarityLabel`, `getFullCardType`, `_revealedEventEmoji` (pure functions, no DOM) |
| `tests/ui/CardRenderer.test.js` | `CardRenderer.js` | `_getCardDescription` dynamic logic (mocked state, no DOM)                                        |

> All other UI renderer modules touch the DOM and are excluded from unit tests per project rules.  
> Their logic is covered indirectly through `GameState` tests.

---

## Architectural Constraints

1. **`GameState.js` becomes a façade** — instantiates and composes sub-modules; all existing `state.*` call sites in `UIManager.js` remain unchanged.
2. **`UIManager.js` becomes a façade** — renderer sub-modules receive `(state, audioManager, uiManager)` so shared helpers like `_rarityClass()` remain accessible.
3. **Zero call-site changes** — `this.state.playCard()`, `this.state.hasRelic()` etc. all keep working via delegation.
4. **Method bodies move verbatim** — only import/export wiring is added; no logic rewrites.
5. **`StatusEffects.js` is fully stateless** — `defaultStatus()` and `_tickStatus()` are pure functions with no side effects.
6. **Quality gates must stay green after every individual file move** — run `npm run lint && npm run format:check && npm test && npm run build` after each module extraction.

---

## Suggested Extraction Order

Extract modules in dependency order (leaves first, orchestrator last):

1. `DONE` `StatusEffects.js` — no dependencies on other new modules
2. `DONE` `DeckManager.js` — depends only on data imports
3. `DONE` `PlayerState.js` — depends on StatusEffects
4. `DONE` `EnemyState.js` — depends on StatusEffects, data imports
5. `DONE` `RelicSystem.js` — depends on DeckManager, data imports
6. `DONE` `ShopSystem.js` — depends on RelicSystem
7. `DONE` `MarynaSystem.js` — depends on RelicSystem, PlayerState
8. `DONE` `EventSystem.js` — depends on EnemyState, MarynaSystem
9. `DONE` `MapEngine.js` — depends on data imports, weather
10. `DONE` `NavigationState.js` — depends on MapEngine, EventSystem
11. `DONE` `CombatEngine.js` — depends on PlayerState, EnemyState, RelicSystem, ShopSystem
12. `DONE` `BattleLifecycle.js` — depends on CombatEngine, DeckManager, RelicSystem
13. `DONE` `GameState.js` (façade) — orchestrates all of the above
14. `UIHelpers.js` — pure helpers, no state deps
15. `CardRenderer.js` — depends on UIHelpers
16. `StatusRenderer.js` — depends on UIHelpers
17. `PileViewerRenderer.js` — depends on CardRenderer
18. `MapRenderer.js` — depends on UIHelpers
19. `ShopRenderer.js` — depends on CardRenderer, UIHelpers
20. `RewardRenderer.js` — depends on CardRenderer, UIHelpers
21. `EventRenderer.js` — depends on UIHelpers
22. `LibraryRenderer.js` — depends on CardRenderer, UIHelpers
23. `CampfireOverlay.js` — depends on UIHelpers
24. `MarynaOverlay.js` — depends on UIHelpers
25. `CombatUI.js` — depends on UIHelpers, CardRenderer
26. `TutorialUI.js` — depends on CombatUI, RewardRenderer, UIHelpers
27. `UIManager.js` (façade) — orchestrates all of the above
