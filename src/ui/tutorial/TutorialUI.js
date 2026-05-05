import { cardLibrary, startingDeck } from '../../data/cards.js';
import { enemyLibrary } from '../../data/enemies.js';
import {
  tutorialFixedRelicId,
  tutorialFixedCardRewardIds,
  tutorialMapSequence,
} from '../../data/tutorialConfig.js';
import * as uiHelpers from '../helpers/UIHelpers.js';
import * as rewardRenderer from '../renderers/RewardRenderer.js';
import {
  TUTORIAL_DONE_KEY,
  tutorialPlayerStatus,
  tutorialSteps,
  buildTutorialMapExplanationText,
  buildTutorialFinaleText,
  createTutorialMiniMap,
} from './tutorialFlow.js';

/** @param {any} uiManager */
export function handleTutorialStart(uiManager) {
  if (uiManager._isInputLocked()) return;

  uiManager._closeReleaseNotesModal();
  uiManager._closeOptionsModal();
  uiHelpers.hideOverlay('library-overlay');
  uiHelpers.hideOverlay('map-overlay');
  uiHelpers.hideOverlay('shop-overlay');
  uiHelpers.hideOverlay('campfire-overlay');
  uiHelpers.hideOverlay('random-event-overlay');
  uiHelpers.hideOverlay('relic-reward-screen');
  uiHelpers.hideOverlay('card-reward-screen');
  uiHelpers.hideOverlay('run-summary-overlay');
  uiHelpers.hideOverlay('pile-viewer-overlay');

  uiManager.state.resetForNewRun(startingDeck);
  uiManager.state.currentScreen = 'battle';
  uiManager.state.hasStartedFirstBattle = true;
  uiManager.mapMessage = '';

  uiManager.state.player.hp = uiManager.state.player.maxHp;
  uiManager.state.player.energy = 3;
  uiManager.state.player.block = 0;
  uiManager.state.player.status = tutorialPlayerStatus();
  uiManager.state.player.stunned = false;
  uiManager.state.player.cardsPlayedThisTurn = 0;

  uiManager.state.enemy = uiManager.state._createEnemyState(enemyLibrary.zagubiony_ceper);
  uiManager.state.enemy.currentIntent = {
    type: 'attack',
    name: 'Niezdarny Cios',
    damage: 5,
    hits: 1,
  };
  uiManager.state.enemy.nextAttack = 5;
  uiManager.state.currentWeather = 'clear';
  uiManager.state.relics = ['ciupaga_dlugopis'];

  uiManager.state.deck = [];
  uiManager.state.discard = [];
  uiManager.state.exhaust = [];
  uiManager.state.hand = buildTutorialFixedHand(uiManager);
  uiManager.state.pendingBattleDutki = false;

  uiManager.isAnimating = false;
  uiManager.isTutorialMode = true;
  uiManager.isTutorialGuidanceActive = true;
  uiManager.tutorialStepIndex = 0;

  uiManager._playEncounterMusic();
  uiManager.updateUI();
  uiManager._syncScreenState();
}

/**
 * @param {any} uiManager
 * @returns {string[]}
 */
export function buildTutorialFixedHand(uiManager) {
  return ['ciupaga', 'goralska_obrona', ...pickTutorialRandomCards(uiManager, 3)];
}

/**
 * @param {any} uiManager
 * @param {number} count
 * @returns {string[]}
 */
export function pickTutorialRandomCards(uiManager, count) {
  const pool = Object.keys(cardLibrary).filter((cardId) => {
    if (cardId === 'ciupaga' || cardId === 'goralska_obrona') return false;
    const card = cardLibrary[cardId];
    if (!card) return false;
    if (card.type === 'status' || card.unplayable) return false;
    if (card.eventOnly || card.rarity === 'rare' || card.tutorialOnly) return false;
    return true;
  });

  const picks = [];
  const clonedPool = [...pool];
  while (picks.length < count && clonedPool.length > 0) {
    const roll = Math.floor(Math.random() * clonedPool.length);
    picks.push(clonedPool.splice(roll, 1)[0]);
  }
  return picks;
}

/** @param {any} uiManager */
export function startTutorialRewardPhase(uiManager) {
  const tutorialRelicId = tutorialFixedRelicId;
  const tutorialCardChoices = [...tutorialFixedCardRewardIds];

  uiManager.tutorialStepIndex = 6;
  uiManager.isTutorialGuidanceActive = true;

  uiManager.pendingBattleRelicClaimAction = () => {
    uiManager.tutorialStepIndex = 7;
    uiManager.isTutorialGuidanceActive = true;
    rewardRenderer.showCardRewardScreen(uiManager, 0, tutorialCardChoices, false, {
      title: uiManager.t('tutorial.rewardChooseCard'),
      allowSkip: false,
    });
    uiManager.updateUI();
    requestAnimationFrame(() => renderTutorialOverlay(uiManager));
  };

  rewardRenderer.showRelicScreen(uiManager, tutorialRelicId, 'battle');
  uiManager.updateUI();
  requestAnimationFrame(() => renderTutorialOverlay(uiManager));
}

/**
 * @param {any} uiManager
 * @param {{ dynamicText?: string, text?: string }} step
 * @returns {string}
 */
export function resolveTutorialStepText(uiManager, step) {
  const lang = uiManager.language ?? 'pl';
  if (step.dynamicText === 'map_explain') {
    return buildTutorialMapExplanationText((type) => uiManager.state.getMapNodeMeta(type), lang);
  }
  if (step.dynamicText === 'finale_text') {
    return buildTutorialFinaleText((type) => uiManager.state.getMapNodeMeta(type), lang);
  }
  if (lang === 'en' && step.textEn) return step.textEn;
  return step.text ?? '';
}

/** @param {any} uiManager */
export function positionTutorialBubble(uiManager) {
  const bubble = document.querySelector('#tutorial-overlay .tutorial-bubble');
  if (!(bubble instanceof HTMLElement)) return;
  const step = getCurrentTutorialStep(uiManager);

  const playerSprite = document.querySelector('#player .sprite');
  const isBattleTutorial = uiManager.isTutorialMode && uiManager.state.currentScreen === 'battle';

  if (!(playerSprite instanceof HTMLElement) || !isBattleTutorial) {
    bubble.classList.remove('tutorial-bubble--player');
    bubble.style.left = '';
    bubble.style.top = '';
    bubble.style.bottom = '';
    bubble.style.transform = '';
    bubble.style.setProperty('--tutorial-tail-left', '44px');
    return;
  }

  const spriteRect = playerSprite.getBoundingClientRect();
  const maxWidth = Math.min(560, window.innerWidth - 20);
  const bubbleWidth = Math.min(maxWidth, bubble.offsetWidth || maxWidth);
  const bubbleHeight = bubble.offsetHeight || 180;

  const left = Math.max(
    10,
    Math.min(
      spriteRect.left + spriteRect.width / 2 - bubbleWidth / 2,
      window.innerWidth - bubbleWidth - 10
    )
  );
  const isRelicExplanationStep = Boolean(step?.selectors?.includes('.relics-wrap'));
  const top = isRelicExplanationStep
    ? Math.max(10, Math.min(spriteRect.bottom + 14, window.innerHeight - bubbleHeight - 10))
    : Math.max(10, spriteRect.top - bubbleHeight - 16);

  bubble.classList.add('tutorial-bubble--player');
  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;
  bubble.style.bottom = 'auto';
  bubble.style.transform = 'none';

  const tailLeft = Math.max(
    24,
    Math.min(spriteRect.left + spriteRect.width / 2 - left, bubbleWidth - 24)
  );
  bubble.style.setProperty('--tutorial-tail-left', `${tailLeft}px`);
}

/** @param {any} uiManager */
export function setTutorialMiniMap(uiManager) {
  const sequence = tutorialMapSequence;

  uiManager.state.map = createTutorialMiniMap(sequence, (type) =>
    uiManager.state.getMapNodeMeta(type)
  );

  uiManager.state.currentLevel = 0;
  uiManager.state.currentNodeIndex = 1;
  uiManager.state.currentNode = { x: 1, y: 0 };
  uiManager.state.hasStartedFirstBattle = true;
}

/** @param {any} uiManager */
export function handleTutorialAcknowledge(uiManager) {
  const step = getCurrentTutorialStep(uiManager);
  if (!step) return;
  if (step.action !== 'ack') return;
  uiManager.tutorialStepIndex += 1;
  uiManager.updateUI();
}

/**
 * @param {any} uiManager
 * @returns {any | null}
 */
export function getCurrentTutorialStep(uiManager) {
  if (!uiManager.isTutorialGuidanceActive) return null;
  if (uiManager.tutorialStepIndex >= tutorialSteps.length) {
    uiManager.isTutorialGuidanceActive = false;
    return null;
  }
  return tutorialSteps[uiManager.tutorialStepIndex] ?? null;
}

/** @param {any} uiManager */
export function disableTutorialGuidance(uiManager) {
  uiManager.isTutorialGuidanceActive = false;
  uiManager.tutorialStepIndex = tutorialSteps.length;
  renderTutorialOverlay(uiManager);
}

/** @param {any} uiManager */
export function syncTutorialExitButton(uiManager) {
  const exitBtn = document.getElementById('tutorial-exit-btn');
  if (!exitBtn) return;
  const shouldShow = uiManager.isTutorialMode;
  exitBtn.classList.toggle('hidden', !shouldShow);
  exitBtn.setAttribute('aria-hidden', String(!shouldShow));
}

/** @param {any} uiManager */
export function renderTutorialOverlay(uiManager) {
  const overlay = document.getElementById('tutorial-overlay');
  const text = document.getElementById('tutorial-text');
  const ackBtn = document.getElementById('tutorial-ack-btn');
  const layer = document.getElementById('tutorial-highlight-layer');
  const concludeBtns = document.getElementById('tutorial-conclude-btns');
  const bubble = overlay?.querySelector('.tutorial-bubble');
  const bubbleTitle = overlay?.querySelector('.tutorial-bubble-title');
  const dim = overlay?.querySelector('.tutorial-dim');
  if (!overlay || !text || !ackBtn || !layer) return;

  uiManager.tutorialFocusedElements.forEach((element) => {
    element.classList.remove('tutorial-focus-target');
  });
  uiManager.tutorialFocusedElements = [];
  layer.innerHTML = '';

  const step = getCurrentTutorialStep(uiManager);
  if (!step) {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (concludeBtns) concludeBtns.classList.add('hidden');
    if (bubble) bubble.classList.remove('tutorial-bubble--conclude');
    overlay.classList.remove('tutorial-overlay--map-explain');
    if (bubble) bubble.classList.remove('tutorial-bubble--map-explain');
    document.getElementById('map-overlay')?.classList.remove('map-overlay--tutorial-foreground');
    return;
  }

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  text.textContent = resolveTutorialStepText(uiManager, step);
  if (bubbleTitle instanceof HTMLElement) {
    bubbleTitle.textContent = uiManager.t('tutorial.speaker');
  }

  const showAck = step.action === 'ack';
  ackBtn.classList.toggle('hidden', !showAck);
  if (showAck) {
    const defaultBtn = uiManager.t('tutorial.ack');
    ackBtn.textContent =
      uiManager.language === 'en' ? (step.btnTextEn ?? defaultBtn) : (step.btnText ?? defaultBtn);
  }

  if (concludeBtns) {
    concludeBtns.classList.toggle('hidden', step.action !== 'conclude');
  }
  if (bubble) {
    bubble.classList.toggle('tutorial-bubble--conclude', step.action === 'conclude');
  }

  const isMapExplainStep = step.dynamicText === 'map_explain';
  overlay.classList.toggle('tutorial-overlay--map-explain', isMapExplainStep);
  if (bubble) {
    bubble.classList.toggle('tutorial-bubble--map-explain', isMapExplainStep);
  }
  const mapOverlay = document.getElementById('map-overlay');
  if (mapOverlay) {
    mapOverlay.classList.toggle('map-overlay--tutorial-foreground', isMapExplainStep);
    if (!isMapExplainStep) {
      mapOverlay.classList.add('hidden');
      mapOverlay.setAttribute('aria-hidden', 'true');
    }
  }

  if (dim) {
    dim.style.opacity = step.noDim ? '0' : '';
  }

  const targets = step.selectors.flatMap((selector) =>
    Array.from(document.querySelectorAll(selector)).filter(
      (element) => !element.classList.contains('hidden')
    )
  );

  targets.forEach((element) => {
    element.classList.add('tutorial-focus-target');
    uiManager.tutorialFocusedElements.push(element);
  });

  positionTutorialBubble(uiManager);
}

/**
 * @param {any} uiManager
 * @param {EventTarget | null} target
 * @returns {boolean}
 */
export function isTutorialInteractionAllowed(uiManager, target) {
  if (!uiManager.isTutorialGuidanceActive) return true;
  if (!(target instanceof Element)) return false;
  if (target.closest('#tutorial-ack-btn')) return true;
  if (target.closest('#tutorial-exit-btn')) return true;
  if (target.closest('#tutorial-repeat-btn')) return true;
  if (target.closest('#tutorial-finish-btn')) return true;
  if (target.closest('.map-node-btn')) return false;
  return uiManager.tutorialFocusedElements.some((element) => element.contains(target));
}

/**
 * @param {any} uiManager
 * @param {string | undefined} cardId
 * @returns {boolean}
 */
export function isTutorialCardPlayAllowed(uiManager, cardId) {
  if (!uiManager.isTutorialGuidanceActive) return true;
  const step = getCurrentTutorialStep(uiManager);
  if (!step) return true;
  if (step.action !== 'play_card') return false;
  return cardId === step.requiredCardId;
}

/**
 * @param {any} uiManager
 * @param {string | undefined} cardId
 */
export function handleTutorialCardPlayed(uiManager, cardId) {
  if (!uiManager.isTutorialGuidanceActive) return;
  const step = getCurrentTutorialStep(uiManager);
  if (!step || step.action !== 'play_card') return;
  if (cardId !== step.requiredCardId) return;
  uiManager.tutorialStepIndex += 1;
}

/**
 * @param {any} uiManager
 * @returns {boolean}
 */
export function isTutorialEndTurnAllowed(uiManager) {
  if (!uiManager.isTutorialGuidanceActive) return true;
  const step = getCurrentTutorialStep(uiManager);
  if (!step) return true;
  return step.action === 'end_turn';
}

/** @param {any} uiManager */
export function handleTutorialEndTurnClicked(uiManager) {
  if (!uiManager.isTutorialGuidanceActive) return;
  const step = getCurrentTutorialStep(uiManager);
  if (!step || step.action !== 'end_turn') return;
  uiManager.tutorialStepIndex += 1;
  disableTutorialGuidance(uiManager);
}

/** @param {any} uiManager */
export function handleTutorialRepeat(uiManager) {
  handleTutorialStart(uiManager);
}

/** @param {any} uiManager */
export function handleTutorialFinish(uiManager) {
  setTutorialDoneFlag();
  uiManager.audioManager.clearDefeatThemeLock();

  uiHelpers.hideOverlay('map-overlay');
  uiHelpers.hideOverlay('shop-overlay');
  uiHelpers.hideOverlay('campfire-overlay');
  uiHelpers.hideOverlay('random-event-overlay');
  uiHelpers.hideOverlay('relic-reward-screen');
  uiHelpers.hideOverlay('card-reward-screen');
  uiHelpers.hideOverlay('run-summary-overlay');
  uiHelpers.hideOverlay('pile-viewer-overlay');

  uiManager.state.resetForNewRun(startingDeck);
  uiManager.state.currentScreen = 'title';
  uiManager.mapMessage = '';
  uiManager.isTutorialMode = false;
  uiManager.tutorialStepIndex = tutorialSteps.length - 1;
  uiManager.isTutorialGuidanceActive = true;
  uiManager.updateUI();
  uiManager._syncScreenState();
  renderTutorialOverlay(uiManager);
}

/** @param {any} uiManager */
export function finishTutorialMode(uiManager) {
  setTutorialDoneFlag();
  disableTutorialGuidance(uiManager);
  uiManager.isTutorialMode = false;
  uiManager.audioManager.clearDefeatThemeLock();

  uiHelpers.hideOverlay('map-overlay');
  uiHelpers.hideOverlay('shop-overlay');
  uiHelpers.hideOverlay('campfire-overlay');
  uiHelpers.hideOverlay('random-event-overlay');
  uiHelpers.hideOverlay('relic-reward-screen');
  uiHelpers.hideOverlay('card-reward-screen');
  uiHelpers.hideOverlay('run-summary-overlay');
  uiHelpers.hideOverlay('pile-viewer-overlay');

  uiManager.state.resetForNewRun(startingDeck);
  uiManager.state.currentScreen = 'title';
  uiManager.mapMessage = '';
  uiManager.updateUI();
  uiManager._syncScreenState();
}

export function setTutorialDoneFlag() {
  try {
    localStorage.setItem(TUTORIAL_DONE_KEY, 'true');
  } catch {
    // Ignore blocked localStorage.
  }
}
