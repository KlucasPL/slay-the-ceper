import { enemyLibrary } from '../../data/enemies.js';
import * as uiHelpers from '../helpers/UIHelpers.js';

/**
 * @param {any} uiManager
 * @param {string | null} [forcedEventId=null]
 */
export function openRandomEvent(uiManager, forcedEventId = null) {
  const overlay = document.getElementById('random-event-overlay');
  const title = document.getElementById('random-event-title');
  const image = document.getElementById('random-event-image');
  const description = document.getElementById('random-event-description');
  const choicesContainer = document.getElementById('random-event-choices');
  const result = document.getElementById('random-event-result');
  const continueBtn = document.getElementById('random-event-continue-btn');
  if (
    !overlay ||
    !title ||
    !image ||
    !description ||
    !choicesContainer ||
    !result ||
    !continueBtn
  ) {
    return;
  }

  let eventDef = null;
  if (forcedEventId) {
    uiManager.state.setActiveEvent(forcedEventId);
    eventDef = uiManager.state.getActiveEventDef();
  } else {
    eventDef = uiManager.state.pickRandomEventDef();
  }
  if (!eventDef) {
    uiManager.mapMessage = 'Cisza na szlaku... dziś nic się nie wydarzyło.';
    uiManager.state.currentScreen = 'map';
    uiManager._openMapOverlay();
    return;
  }

  if (!forcedEventId) {
    uiManager.state.setActiveEvent(eventDef.id);
  }

  if (
    eventDef.id === 'fiakier_event' ||
    eventDef.id === 'event_karykaturzysta' ||
    eventDef.id === 'event_hazard_karton'
  ) {
    uiManager.audioManager.playEventMusic(eventDef.id);
  }

  const fallbackFight = eventDef.fallbackFight;
  if (fallbackFight && uiManager.state.dutki < fallbackFight.minDutki) {
    uiManager.pendingEventFallbackEnemyId = fallbackFight.enemyId;
    title.textContent = eventDef.title;
    image.innerHTML = eventDef.image;
    description.textContent = fallbackFight.message;
    result.textContent = 'Przedzierasz się przez tłum i szykujesz do walki.';
    continueBtn.classList.remove('hidden');
    continueBtn.textContent = 'Stań do walki';
    choicesContainer.innerHTML = '';

    uiHelpers.hideOverlay('map-overlay');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    uiManager.updateUI();
    return;
  }

  uiManager.pendingEventFallbackEnemyId = null;
  continueBtn.textContent = 'Kontynuuj';

  title.textContent = eventDef.title;
  image.innerHTML = eventDef.image;
  description.textContent = eventDef.description;
  result.textContent = '';
  continueBtn.classList.add('hidden');

  choicesContainer.innerHTML = '';
  eventDef.choices.forEach((choice, choiceIndex) => {
    const choiceBtn = document.createElement('button');
    choiceBtn.type = 'button';
    choiceBtn.className = 'random-event-choice';
    choiceBtn.disabled = uiManager.state.dutki < choice.cost;
    const fallbackConsequence =
      choice.cost > 0
        ? `Koszt: ${choice.cost} ${uiManager.state.getDutkiLabel(choice.cost)}.`
        : 'Koszt: brak.';
    const consequence = choice.consequence ?? fallbackConsequence;
    choiceBtn.innerHTML = `
        <span class="random-event-choice-title">${choice.text}</span>
        <span class="random-event-choice-desc">${choice.description}</span>
        <span class="random-event-choice-impact">Skutek: ${consequence}</span>
      `;
    choiceBtn.addEventListener('click', () => handleRandomEventChoice(uiManager, choiceIndex));
    choicesContainer.appendChild(choiceBtn);
  });

  uiHelpers.hideOverlay('map-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  uiManager.updateUI();
}

/**
 * @param {any} uiManager
 * @param {number} choiceIndex
 */
export function handleRandomEventChoice(uiManager, choiceIndex) {
  if (uiManager._isInputLocked()) return;
  const result = uiManager.state.applyActiveEventChoice(choiceIndex);
  const resultEl = document.getElementById('random-event-result');
  const continueBtn = document.getElementById('random-event-continue-btn');
  if (!resultEl || !continueBtn) return;

  resultEl.textContent = result.message;
  if (!result.success) return;

  document.querySelectorAll('#random-event-choices .random-event-choice').forEach((btn) => {
    if (btn instanceof HTMLButtonElement) {
      btn.disabled = true;
    }
  });
  continueBtn.classList.remove('hidden');
  uiManager.updateUI();
}

/**
 * @param {any} uiManager
 */
export function continueAfterRandomEvent(uiManager) {
  if (uiManager._isInputLocked()) return;
  uiHelpers.hideOverlay('random-event-overlay');

  const queuedEventBattle = uiManager.state.consumeQueuedEventBattle();
  if (queuedEventBattle) {
    uiManager.state.clearActiveEvent();
    uiManager.state.currentScreen = 'battle';
    const started = uiManager.state.startBattleWithEnemyId(queuedEventBattle.enemyId, {
      battleContext: 'event',
      rewardRelicId: queuedEventBattle.rewardRelicId,
    });
    if (!started) {
      uiManager.mapMessage = 'Nie udało się rozpocząć walki eventowej.';
      uiManager.state.currentScreen = 'map';
      uiManager._openMapOverlay();
      uiManager.updateUI();
      return;
    }
    uiManager._playEncounterMusic();
    document.getElementById('end-turn-btn').disabled = false;
    uiManager.updateUI();
    return;
  }

  if (uiManager.pendingEventFallbackEnemyId) {
    uiManager.state.clearActiveEvent();
    uiManager.state.currentScreen = 'battle';
    const started = uiManager.state.startBattleWithEnemyId(uiManager.pendingEventFallbackEnemyId, {
      battleContext: 'event',
    });
    uiManager.pendingEventFallbackEnemyId = null;
    if (!started) {
      const emergencyEnemy = enemyLibrary.pomocnik_fiakra;
      if (emergencyEnemy) {
        uiManager.state.enemy = uiManager.state._createEnemyState(emergencyEnemy);
      }
    }
    uiManager._playEncounterMusic();
    document.getElementById('end-turn-btn').disabled = false;
    uiManager.updateUI();
    return;
  }

  if (uiManager.state.applyJumpToBossShortcut()) {
    uiManager.mapMessage = 'Fiakier skrócił drogę. Następny przystanek: finał wyprawy.';
  } else {
    uiManager.mapMessage = '';
  }

  uiManager.state.clearActiveEvent();
  uiManager.state.currentScreen = 'map';
  uiManager._openMapOverlay();
  uiManager.updateUI();
}
