/** Drops sunglasses onto player sprite and flashes the screen gold. */
export function triggerLansOnAnimation() {
  const el = document.getElementById('lans-sunglasses');
  if (!el) return;
  el.dataset.lansAnimating = 'on';
  el.classList.remove('lans-falling');
  el.classList.add('lans-dropping');
  el.addEventListener(
    'animationend',
    () => {
      el.classList.remove('lans-dropping');
      el.classList.add('lans-active');
      delete el.dataset.lansAnimating;
    },
    { once: true }
  );

  const flash = document.createElement('div');
  flash.className = 'lans-screen-flash';
  document.body.appendChild(flash);
  flash.addEventListener('animationend', () => flash.remove(), { once: true });
}

/** Knocks sunglasses off the player sprite. */
export function triggerLansOffAnimation() {
  const el = document.getElementById('lans-sunglasses');
  if (!el) return;
  el.dataset.lansAnimating = 'off';
  el.classList.remove('lans-dropping');
  el.classList.add('lans-active', 'lans-falling');
  el.addEventListener(
    'animationend',
    () => {
      el.classList.remove('lans-falling', 'lans-active');
      delete el.dataset.lansAnimating;
    },
    { once: true }
  );
}

/**
 * @param {any} uiManager
 * @param {number} handIndex
 */
export function handlePlayCard(uiManager, handIndex) {
  if (uiManager._isInputLocked()) return;
  const selectedCardId = uiManager.state.hand[handIndex];
  if (!uiManager._isTutorialCardPlayAllowed(selectedCardId)) {
    showFloatingText(
      uiManager,
      'sprite-player',
      'Najpierw zagraj wskazaną kartę.',
      'floating-shame'
    );
    return;
  }
  const result = uiManager.state.playCard(handIndex);
  if (!result.success) {
    if (result.reason === 'stunned_attack') {
      showFloatingText(
        uiManager,
        'sprite-player',
        'OGŁUSZONY! Ataki zablokowane',
        'floating-shame'
      );
    } else if (result.reason === 'blokada') {
      showFloatingText(uiManager, 'sprite-enemy', 'PARKINGOWY: LIMIT 3 KART!', 'floating-shame');
    }
    return;
  }

  const { effect } = result;
  uiManager._handleTutorialCardPlayed(selectedCardId);
  if (uiManager.state.consumeLansActivatedEvent()) {
    triggerLansOnAnimation();
    showFloatingText(uiManager, 'sprite-player', 'JEST LANS!', 'floating-lans');
  }
  const missEvent = uiManager.state.consumeWeatherMissEvent();
  if (missEvent) {
    uiManager.audioManager.playMissSound();
    const targetSprite = missEvent.target === 'enemy' ? 'sprite-enemy' : 'sprite-player';
    showFloatingText(uiManager, targetSprite, missEvent.text, 'floating-damage');
  }
  if (uiManager.state.consumeEnemyEvasionEvent()) {
    uiManager.audioManager.playMissSound();
    showFloatingText(uiManager, 'sprite-enemy', 'UNIK!', 'floating-damage');
  }
  const phaseTransitionText = uiManager.state.consumeEnemyPhaseTransitionMessage();
  if (phaseTransitionText) {
    showFloatingText(uiManager, 'sprite-enemy', phaseTransitionText, 'floating-shame');
  }
  const rachunekResistEvent = uiManager.state.consumeRachunekResistEvent();
  if (rachunekResistEvent) {
    const targetSprite = rachunekResistEvent.target === 'enemy' ? 'sprite-enemy' : 'sprite-player';
    showFloatingText(uiManager, targetSprite, rachunekResistEvent.text, 'floating-shame');
  }
  showLansDutkiSpentFeedback(uiManager);

  if (effect.enemyAnim) {
    uiManager.isAnimating = true;
    if (effect.playerAnim) triggerAnim(uiManager, 'sprite-player', effect.playerAnim, 300);
    uiManager.updateUI();

    setTimeout(() => {
      triggerAnim(uiManager, 'sprite-enemy', effect.enemyAnim);
      uiManager.updateUI();

      setTimeout(() => {
        uiManager.isAnimating = false;
        const win = uiManager.state.checkWinCondition();
        if (win) {
          showEndGame(uiManager, win);
        } else {
          uiManager.updateUI();
        }
      }, 400);
    }, 150);
  } else {
    if (effect.playerAnim) triggerAnim(uiManager, 'sprite-player', effect.playerAnim);
    uiManager.updateUI();
    const win = uiManager.state.checkWinCondition();
    if (win) showEndGame(uiManager, win);
  }
}

/**
 * @param {any} uiManager
 */
export function handleEndTurn(uiManager) {
  if (uiManager._isInputLocked()) return;
  if (!uiManager._isTutorialEndTurnAllowed()) {
    if (uiManager.isTutorialGuidanceActive) {
      showFloatingText(uiManager, 'sprite-player', 'Jeszcze nie kończ tury.', 'floating-shame');
    }
    return;
  }
  if (uiManager.isAnimating || uiManager.state.currentScreen !== 'battle') return;
  if (uiManager.state.enemy.hp <= 0 || uiManager.state.player.hp <= 0) return;

  uiManager._handleTutorialEndTurnClicked();

  uiManager.isAnimating = true;
  uiManager._syncEndTurnButtonState();

  const result = uiManager.state.endTurn();
  uiManager.updateUI();
  const missEvent = uiManager.state.consumeWeatherMissEvent();
  if (missEvent) {
    uiManager.audioManager.playMissSound();
    const targetSprite = missEvent.target === 'enemy' ? 'sprite-enemy' : 'sprite-player';
    showFloatingText(uiManager, targetSprite, missEvent.text, 'floating-damage');
  }
  if (uiManager.state.consumeEnemyEvasionEvent()) {
    uiManager.audioManager.playMissSound();
    showFloatingText(uiManager, 'sprite-enemy', 'UNIK!', 'floating-damage');
  }
  const phaseTransitionText = uiManager.state.consumeEnemyPhaseTransitionMessage();
  if (phaseTransitionText) {
    showFloatingText(uiManager, 'sprite-enemy', phaseTransitionText, 'floating-shame');
  }
  if (result.enemyPassiveHeal) {
    showFloatingText(uiManager, 'sprite-enemy', result.enemyPassiveHeal.text, 'floating-heal');
  }
  if (result.playerPassiveHeal) {
    showFloatingText(uiManager, 'sprite-player', result.playerPassiveHeal.text, 'floating-heal');
  }
  const lansBreakText = uiManager.state.consumeLansBreakEvent();
  if (lansBreakText) {
    triggerLansOffAnimation();
    showFloatingText(uiManager, 'sprite-player', lansBreakText, 'floating-shame');
  }
  showLansDutkiSpentFeedback(uiManager);

  const immediateWin = uiManager.state.checkWinCondition();
  if (immediateWin) {
    uiManager.isAnimating = false;
    uiManager._syncEndTurnButtonState();
    showEndGame(uiManager, immediateWin);
    return;
  }

  setTimeout(() => {
    triggerAnim(uiManager, 'sprite-enemy', 'anim-attack-e', 300);

    setTimeout(() => {
      const anim = result.enemyAttack.dealt > 0 ? 'anim-damage' : 'anim-block';
      triggerAnim(uiManager, 'sprite-player', anim);
      uiManager.updateUI();

      setTimeout(() => {
        uiManager.isAnimating = false;
        const win = uiManager.state.checkWinCondition();
        if (win) {
          showEndGame(uiManager, win);
        } else {
          uiManager.state.startTurn();
          uiManager.updateUI();
        }
      }, 500);
    }, 150);
  }, 300);
}

/**
 * @param {any} uiManager
 * @param {'player_win'|'enemy_win'} outcome
 */
export function showEndGame(uiManager, outcome) {
  if (uiManager.isTutorialMode) {
    if (outcome === 'player_win') {
      uiManager._startTutorialRewardPhase();
    } else {
      uiManager._handleTutorialStart();
    }
    return;
  }
  if (outcome === 'player_win') {
    // Clear temporary status cards right after victory so they cannot appear in map/shop flows.
    uiManager.state.clearStatusCardsFromPiles();

    const droppedDutki = uiManager.state.grantBattleDutki();
    const currentNode = uiManager.state.getCurrentMapNode();
    const isBossFight =
      uiManager.state.enemy.id === 'boss' || uiManager.state.enemy.id === 'fiakier';
    const isEliteFight = currentNode?.type === 'elite';
    const isBankrupt = uiManager.state.enemy.isBankrupt;
    const bankruptBonus = uiManager.state.enemyBankruptcyBonus;
    const scriptedEventRewardRelic = uiManager.state.consumePendingEventVictoryRelicReward();

    if (uiManager.state.tryAdvanceActAfterBossVictory()) {
      uiManager.audioManager.playVictoryTheme();
      const choices = uiManager.state.generateAct2TransitionRelicChoices(3);
      uiManager._showAct2TransitionRelicReward(choices);
      return;
    }

    if (isBossFight) {
      uiManager.audioManager.playVictoryTheme();
      uiManager.updateUI();
      const showSummary = () => {
        uiManager.state.captureRunSummary('player_win');
        uiManager._showRunSummaryOverlay();
      };

      if (isBankrupt && bankruptBonus > 0) {
        showFloatingText(
          uiManager,
          'sprite-enemy',
          `+${bankruptBonus} ${uiManager.state.getDutkiLabel(bankruptBonus)}!`,
          'floating-dutki'
        );
        setTimeout(showSummary, 2500);
      } else {
        setTimeout(showSummary, 700);
      }
      return;
    }

    if (isBankrupt) {
      uiManager.updateUI();
      if (bankruptBonus > 0) {
        showFloatingText(
          uiManager,
          'sprite-enemy',
          `+${bankruptBonus} ${uiManager.state.getDutkiLabel(bankruptBonus)}!`,
          'floating-dutki'
        );
      }
      setTimeout(() => {
        if (scriptedEventRewardRelic) {
          uiManager._showScriptedEventBattleRewards(scriptedEventRewardRelic, droppedDutki);
          return;
        }
        if (isEliteFight) {
          uiManager._showEliteRewardOverlay(droppedDutki);
        } else {
          uiManager._showVictoryOverlay(droppedDutki, isBossFight);
        }
      }, 2500);
      return;
    }

    if (scriptedEventRewardRelic) {
      uiManager._showScriptedEventBattleRewards(scriptedEventRewardRelic, droppedDutki);
      return;
    }

    if (isEliteFight) {
      uiManager._showEliteRewardOverlay(droppedDutki);
      return;
    }

    uiManager._showVictoryOverlay(droppedDutki, isBossFight);
    return;
  }
  uiManager.audioManager.playDefeatTheme();
  uiManager.state.captureRunSummary('enemy_win');
  setTimeout(() => uiManager._showRunSummaryOverlay(), 700);
}

/**
 * @param {any} uiManager
 * @param {string} elementId
 * @param {string} animClass
 * @param {number} [duration=400]
 */
export function triggerAnim(uiManager, elementId, animClass, duration = 400) {
  const el = document.getElementById(elementId);
  el.classList.remove(animClass);
  void el.offsetWidth;
  el.classList.add(animClass);
  setTimeout(() => el.classList.remove(animClass), duration);
}

/**
 * @param {any} uiManager
 * @param {string} elementId
 * @param {string} text
 * @param {string} extraClass
 */
export function showFloatingText(uiManager, elementId, text, extraClass) {
  const anchor = document.getElementById(elementId);
  if (!anchor) return;

  const float = document.createElement('div');
  float.className = `floating-text ${extraClass}`;
  float.textContent = text;
  anchor.appendChild(float);

  setTimeout(() => {
    float.remove();
  }, 1100);
}

/**
 * @param {any} uiManager
 */
export function showLansDutkiSpentFeedback(uiManager) {
  const spent = uiManager.state.consumeLansDutkiSpentEvent();
  if (spent <= 0) return;
  showFloatingText(
    uiManager,
    'sprite-player',
    `LANS: -${spent} ${uiManager.state.getDutkiLabel(spent)}`,
    'floating-dutki-loss'
  );
}
