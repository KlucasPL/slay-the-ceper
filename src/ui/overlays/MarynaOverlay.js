import { marynaBoonLibrary, marynaSvg } from '../../data/marynaBoons.js';

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
    wrapper.className = 'shop-card-wrapper';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '10px';
    wrapper.style.flex = '0 0 auto';

    // 1. The Plate (ONLY Mechanics, guaranteed to fit)
    const plateEl = document.createElement('div');
    plateEl.className = 'relic-plate';
    plateEl.style.margin = '0';
    plateEl.innerHTML = `
      <div class="relic-plate-title" style="font-size: 1.05rem; margin-bottom: 4px;">${boon.name}</div>
      <div style="font-size: 3rem; margin: 4px 0;">${boon.emoji}</div>
      <div class="relic-plate-desc" style="font-size: 0.9rem; color: #2c1e16; font-weight: 700;">${boon.effectDesc}</div>
    `;

    // 2. The Flavor Text (OUTSIDE the plate)
    const flavorEl = document.createElement('div');
    flavorEl.style.color = '#d9c6a5';
    flavorEl.style.fontStyle = 'italic';
    flavorEl.style.fontSize = '0.85rem';
    flavorEl.style.textAlign = 'center';
    flavorEl.style.maxWidth = '180px';
    flavorEl.style.lineHeight = '1.3';
    flavorEl.style.marginTop = '4px';
    flavorEl.style.marginBottom = 'auto'; // Pushes the button to the bottom
    flavorEl.innerHTML = `"${boon.flavor}"`;

    // 3. The Selection Button
    const selectBtn = document.createElement('button');
    selectBtn.className = 'btn';
    selectBtn.style.padding = '8px 24px';
    selectBtn.style.fontSize = '1.1rem';
    selectBtn.textContent = 'Wybierz';

    selectBtn.onclick = () => {
      uiManager.state.pickMarynaBoon(boonId);
      uiManager.state.hasStartedFirstBattle = true;
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      uiManager.audioManager.stopMarynaMusic();
      uiManager._openMapOverlay();
      uiManager.updateUI();
    };

    wrapper.appendChild(plateEl);
    wrapper.appendChild(flavorEl);
    wrapper.appendChild(selectBtn);
    choicesEl.appendChild(wrapper);
  });

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}
