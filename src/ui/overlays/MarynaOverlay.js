import { marynaBoonLibrary, marynaSvg } from '../../data/marynaBoons.js';

/**
 * @param {any} uiManager
 */
export function openMarynaBoonOverlay(uiManager) {
  const overlay = document.getElementById('maryna-boon-overlay');
  if (!overlay) return;

  const imageEl = document.getElementById('maryna-boon-image');
  if (imageEl) imageEl.innerHTML = marynaSvg;

  const choiceIds = uiManager.state.rollMarynaChoices(3);
  const choicesEl = document.getElementById('maryna-boon-choices');
  if (!choicesEl) return;
  choicesEl.innerHTML = '';

  choiceIds.forEach((boonId) => {
    const boon = marynaBoonLibrary[boonId];
    if (!boon) return;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'maryna-boon-card';
    card.setAttribute('aria-label', `${boon.name}. ${boon.effectDesc}`);
    card.innerHTML = `
        <span class="maryna-boon-header">
          <span class="maryna-boon-emoji">${boon.emoji}</span>
          <span class="maryna-boon-title-wrap">
            <strong class="maryna-boon-name">${boon.name}</strong>
            <em class="maryna-boon-flavor">${boon.flavor}</em>
          </span>
        </span>
        <span class="maryna-boon-effect">${boon.effectDesc}</span>
      `;

    card.addEventListener('click', () => {
      uiManager.state.pickMarynaBoon(boonId);
      uiManager.state.hasStartedFirstBattle = true;
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      uiManager._openMapOverlay();
    });

    choicesEl.appendChild(card);
  });

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}
