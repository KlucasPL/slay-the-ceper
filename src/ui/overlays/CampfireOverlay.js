import { cardLibrary } from '../../data/cards.js';
import * as uiHelpers from '../helpers/UIHelpers.js';

/**
 * @param {any} uiManager
 */
export function openCampfire(uiManager) {
  if (uiManager._isInputLocked()) return;
  uiManager.campfireUsed = false;
  uiHelpers.hideOverlay('map-overlay');
  const overlay = document.getElementById('campfire-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  uiManager.audioManager.playCampfireMusic();

  const campHpCurrent = document.getElementById('camp-hp-current');
  const campHpMax = document.getElementById('camp-hp-max');
  if (campHpCurrent) campHpCurrent.textContent = String(uiManager.state.player.hp);
  if (campHpMax) campHpMax.textContent = String(uiManager.state.player.maxHp);

  const select = document.getElementById('camp-card-select');
  select.innerHTML = '';
  const options = uiManager.state.getUpgradeableAttackCards();
  options.forEach((cardId) => {
    const option = document.createElement('option');
    option.value = cardId;
    option.textContent = cardLibrary[cardId]?.name ?? cardId;
    select.appendChild(option);
  });

  document.getElementById('camp-upgrade-btn').disabled = options.length === 0;
}

/**
 * @param {any} uiManager
 */
export function closeCampfire(uiManager) {
  if (uiManager._isInputLocked()) return;
  uiHelpers.hideOverlay('campfire-overlay');
  uiManager.audioManager.stopCampfireMusic();
  uiManager._openMapOverlay();
  uiManager.updateUI();
}

/**
 * @param {any} uiManager
 */
export function useCampfireHeal(uiManager) {
  if (uiManager._isInputLocked()) return;
  if (uiManager.campfireUsed) return;
  const healAmount = Math.max(1, Math.floor(uiManager.state.player.maxHp * 0.2));
  uiManager.state.healPlayer(healAmount);
  uiManager.campfireUsed = true;
  closeCampfire(uiManager);
}

/**
 * @param {any} uiManager
 */
export function useCampfireUpgrade(uiManager) {
  if (uiManager._isInputLocked()) return;
  if (uiManager.campfireUsed) return;
  const select = document.getElementById('camp-card-select');
  const cardId = select.value;
  if (!cardId) return;
  uiManager.state.upgradeCardDamage(cardId, 3);
  uiManager.campfireUsed = true;
  closeCampfire(uiManager);
}
