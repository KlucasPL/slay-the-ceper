import { marynaBoonLibrary, marynaSvg } from '../../data/marynaBoons.js';
import * as cardZoomOverlay from './CardZoomOverlay.js';
import * as uiHelpers from '../helpers/UIHelpers.js';

/**
 * @param {any} uiManager
 */
export function openMarynaBoonOverlay(uiManager) {
  const overlay = document.getElementById('maryna-boon-overlay');
  if (!overlay) return;

  uiManager.audioManager.playMarynaMusic();

  const imageEl = document.getElementById('maryna-boon-image');
  if (imageEl) imageEl.innerHTML = marynaSvg;

  const choiceIds = uiManager.state.rollMarynaChoices(3);
  const choicesEl = document.getElementById('maryna-boon-choices');
  if (!choicesEl) return;

  choicesEl.innerHTML = '';
  choicesEl.className = 'shop-cards-grid';
  choicesEl.style.marginTop = '24px';
  choicesEl.style.paddingBottom = '16px';

  choiceIds.forEach((boonId) => {
    const boon = marynaBoonLibrary[boonId];
    if (!boon) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'shop-card-wrapper maryna-boon-card';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '10px';
    wrapper.style.flex = '0 0 auto';

    const plateEl = document.createElement('div');
    plateEl.className = 'relic-plate';
    plateEl.style.cssText =
      'margin: 0; height: auto !important; min-height: 240px !important; justify-content: flex-start;';
    plateEl.innerHTML = `
      <div class="relic-plate-title" style="margin-bottom: 2px;">${boon.name}</div>
      <div style="font-size: 2.4rem; margin: 4px 0 8px 0;">${boon.emoji}</div>
      <div class="relic-plate-desc" style="color: #2c1e16; font-weight: 700;">${boon.effectDesc}</div>
    `;
    uiHelpers.attachLongPressZoom(plateEl, () => {
      cardZoomOverlay.openCardZoom(
        {
          name: boon.name,
          emoji: boon.emoji,
          rarityLabel: 'Błogosławieństwo Maryny',
          description: boon.effectDesc,
          rarityClass: 'rarity-rare',
        },
        'relic'
      );
    });

    const flavorEl = document.createElement('div');
    flavorEl.style.color = '#d9c6a5';
    flavorEl.style.fontStyle = 'italic';
    flavorEl.style.fontSize = '0.85rem';
    flavorEl.style.textAlign = 'center';
    flavorEl.style.maxWidth = '180px';
    flavorEl.style.lineHeight = '1.3';
    flavorEl.style.marginTop = '4px';
    flavorEl.style.marginBottom = 'auto';
    flavorEl.innerHTML = `"${boon.flavor}"`;

    const selectBtn = document.createElement('button');
    selectBtn.className = 'btn';
    selectBtn.style.padding = '8px 24px';
    selectBtn.style.fontSize = '1.1rem';
    selectBtn.textContent = 'Wybierz';

    selectBtn.addEventListener('click', (event) => {
      // Move focus out of the overlay before marking it aria-hidden.
      /** @type {HTMLElement} */ (event.currentTarget).blur();
      uiManager.state.pickMarynaBoon(boonId);
      uiManager.state.hasStartedFirstBattle = true;
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      uiManager.audioManager.stopMarynaMusic();
      uiManager._openMapOverlay();
      uiManager.updateUI();
    });

    wrapper.appendChild(plateEl);
    wrapper.appendChild(flavorEl);
    wrapper.appendChild(selectBtn);
    choicesEl.appendChild(wrapper);
  });

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}
