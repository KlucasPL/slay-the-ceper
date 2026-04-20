import { getCardDefinition } from '../../data/cards.js';
import { getCardDescription } from '../renderers/CardRenderer.js';
import * as uiHelpers from '../helpers/UIHelpers.js';

export const watraSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" width="100%" height="100%">
  <rect width="300" height="120" fill="#1c130e" />
  <path d="M -20 120 L 40 40 L 100 120 Z" fill="#2c1e16" />
  <path d="M 60 120 L 150 20 L 240 120 Z" fill="#3d2314" />
  <path d="M 190 120 L 260 50 L 330 120 Z" fill="#2c1e16" />
  <circle cx="30" cy="25" r="1.5" fill="#fdf8eb" opacity="0.6"/>
  <circle cx="120" cy="15" r="1" fill="#fdf8eb" opacity="0.4"/>
  <circle cx="270" cy="30" r="2" fill="#fdf8eb" opacity="0.8"/>
  <circle cx="200" cy="40" r="1" fill="#fdf8eb" opacity="0.5"/>
  <ellipse cx="150" cy="105" rx="50" ry="10" fill="#0a0502" opacity="0.7"/>
  <g stroke="#1a0f0a" stroke-width="1.5" stroke-linejoin="round">
    <path d="M 110 95 L 190 85 A 4 4 0 0 1 195 90 L 115 100 A 4 4 0 0 1 110 95 Z" fill="#5c3a21" />
    <path d="M 190 95 L 110 85 A 4 4 0 0 0 105 90 L 185 100 A 4 4 0 0 0 190 95 Z" fill="#4a2e15" />
    <path d="M 150 80 L 150 105" stroke-width="12" stroke="#2c1e16" stroke-linecap="round"/>
  </g>
  <path d="M 125 90 Q 150 15 175 90 Q 150 100 125 90 Z" fill="#d35400" />
  <path d="M 134 92 Q 150 35 166 92 Q 150 100 134 92 Z" fill="#e67e22" />
  <path d="M 142 92 Q 150 60 158 92 Q 150 96 142 92 Z" fill="#f1c40f" />
  <path d="M 150 5 L 152 9 L 150 13 L 148 9 Z" fill="#f1c40f" />
  <path d="M 125 35 L 127 38 L 125 41 L 123 38 Z" fill="#e67e22" />
  <path d="M 175 40 L 177 43 L 175 46 L 173 43 Z" fill="#f1c40f" />
</svg>
`;

/**
 * @param {any} uiManager
 */
export function openCampfire(uiManager) {
  if (uiManager._isInputLocked()) return;
  uiManager.campfireUsed = false;
  uiManager.campfireMessage = '';
  uiHelpers.hideOverlay('map-overlay');
  const overlay = document.getElementById('campfire-overlay');
  if (!overlay) return;

  // Keep campfire functional even if markup is missing the panel container.
  let panel = overlay.querySelector('.event-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'event-panel campfire-panel';
    overlay.appendChild(panel);
  }

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  uiManager.audioManager.playCampfireMusic();
  renderCampfireMain(uiManager);
}

function renderCampfireMain(uiManager) {
  const overlay = document.getElementById('campfire-overlay');
  if (!overlay) return;
  const panel = overlay.querySelector('.event-panel');
  if (!panel) return;
  panel.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'shop-header';
  header.innerHTML = `
    <h2 class="event-title">Watra</h2>
    <div style="width: 100%; height: 120px; border-radius: 8px; margin: 16px 0; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.5), inset 0 0 0 2px #5a3800; display: flex; justify-content: center; align-items: flex-end;">
       ${watraSvg}
    </div>
    <div class="map-resource-strip">
       <div class="map-resource-pill">❤️ <span id="camp-hp-current">${uiManager.state.player.hp}</span> / ${uiManager.state.player.maxHp} HP</div>
    </div>
  `;
  panel.appendChild(header);

  // --- Modern vertical action button layout ---
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.flexDirection = 'column';
  actions.style.gap = '18px';
  actions.style.alignItems = 'stretch';
  actions.style.margin = '32px 0 18px 0';

  const isFullHp = uiManager.state.player.hp >= uiManager.state.player.maxHp;

  // Heal action
  const healBtn = document.createElement('button');
  healBtn.className = 'event-choice-btn';
  healBtn.type = 'button';
  healBtn.disabled = isFullHp || uiManager.campfireUsed;
  healBtn.innerHTML = `
    <span class="event-choice-emoji">🥔</span>
    <span class="event-choice-title">Pieczone Grule</span>
    <span class="event-choice-desc">Odpocznij i zjedz ciepły posiłek.<br><span style='color:#27ae60;'>Odzyskaj 20% Krzepy</span></span>
  `;
  if (isFullHp) healBtn.innerHTML += `<span class="event-choice-extra">Krzepa pełna</span>`;
  healBtn.onclick = () => {
    const healAmount = Math.max(1, Math.floor(uiManager.state.player.maxHp * 0.2));
    uiManager.state.healPlayer(healAmount);
    uiManager.state.logAction('campfire', { action: 'heal', amount: healAmount });
    uiManager.campfireUsed = true;
    uiManager.campfireMessage = `Zjedzono grule. Odzyskano ${healAmount} Krzepy.`;
    renderCampfireMain(uiManager);
    uiManager.updateUI();
  };
  actions.appendChild(healBtn);

  // Upgrade action
  const upgradeBtn = document.createElement('button');
  upgradeBtn.className = 'event-choice-btn';
  upgradeBtn.type = 'button';
  upgradeBtn.disabled = uiManager.campfireUsed;
  upgradeBtn.innerHTML = `
    <span class="event-choice-emoji">🪓</span>
    <span class="event-choice-title">Naostrz Broń</span>
    <span class="event-choice-desc">Zwiększ siłę jednego ataku.<br><span style='color:#b32d1c;'>+3 Obrażenia do wybranej karty</span></span>
  `;
  upgradeBtn.onclick = () => {
    renderCampfireUpgrade(uiManager);
  };
  actions.appendChild(upgradeBtn);

  panel.appendChild(actions);

  const message = document.createElement('div');
  message.className = 'shop-message';
  message.textContent = uiManager.campfireMessage || '';
  panel.appendChild(message);

  const exitBtn = document.createElement('button');
  exitBtn.id = 'camp-exit-btn';
  exitBtn.className = 'btn shop-exit-btn';
  exitBtn.style.marginTop = 'auto';
  exitBtn.textContent = uiManager.campfireUsed ? 'Ruszaj w drogę' : 'Opuść Watrę';
  exitBtn.onclick = () => closeCampfire(uiManager);
  panel.appendChild(exitBtn);
}

function renderCampfireUpgrade(uiManager) {
  const overlay = document.getElementById('campfire-overlay');
  if (!overlay) return;
  const panel = overlay.querySelector('.event-panel');
  if (!panel) return;
  panel.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'shop-header';
  header.innerHTML = `
    <h2 class="event-title">Wybierz Atak</h2>
    <p style="color: #f3dfbd; margin-top: 5px;">Ta karta otrzyma +3 obrażenia w następnej walce.</p>
  `;
  panel.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'shop-cards-grid';
  grid.style.flexWrap = 'wrap';
  grid.style.justifyContent = 'center';

  const options = uiManager.state.getUpgradeableAttackCards();

  if (options.length === 0) {
    const msg = document.createElement('div');
    msg.className = 'shop-message';
    msg.textContent = 'Brak kart ataku do ulepszenia.';
    panel.appendChild(msg);
  } else {
    options.forEach((cardId) => {
      const cardDef = getCardDefinition(cardId);
      if (!cardDef) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'shop-card-wrapper';
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '10px';

      const cardEl = document.createElement('div');
      cardEl.className = `card reward-phase-card ${uiHelpers.rarityClass(cardDef.rarity)} card-${cardDef.type}`;
      cardEl.innerHTML = `
          <div class="card-header">
            <div class="card-title">${cardDef.name}</div>
            <div class="card-cost-oscypek">
              <span class="cost-value">${cardDef.cost}</span>
              <span class="cost-icon">🧀</span>
            </div>
          </div>
          <div class="card-subtitle">${uiHelpers.getFullCardType(cardDef.rarity, cardDef.type)}</div>
          <div class="card-art"><span class="card-icon">${cardDef.emoji}</span></div>
          <div class="card-text-box"><div class="card-desc">${getCardDescription(uiManager, cardDef, cardId)}</div></div>
      `;
      uiHelpers.attachLongPressZoom(cardEl, () => uiManager.showCardZoom(cardId));

      const selectBtn = document.createElement('button');
      selectBtn.className = 'btn shop-buy-btn';
      selectBtn.style.backgroundColor = '#e67e22';
      selectBtn.style.borderColor = '#d35400';
      selectBtn.style.boxShadow = '0 4px 0 #a04000';
      selectBtn.textContent = 'Naostrz';
      selectBtn.onclick = () => {
        if (!uiManager.state.cardDamageBonus) uiManager.state.cardDamageBonus = {};
        uiManager.state.cardDamageBonus[cardId] =
          (uiManager.state.cardDamageBonus[cardId] || 0) + 3;
        uiManager.state.logAction('campfire', { action: 'upgrade', cardId });
        uiManager.campfireUsed = true;
        uiManager.campfireMessage = `Naostrzono: ${cardDef.name} (+3 obr).`;
        renderCampfireMain(uiManager);
        uiManager.updateUI();
      };

      wrapper.appendChild(cardEl);
      wrapper.appendChild(selectBtn);
      grid.appendChild(wrapper);
    });
    panel.appendChild(grid);
  }

  const backBtn = document.createElement('button');
  backBtn.className = 'btn shop-exit-btn';
  backBtn.style.marginTop = 'auto';
  backBtn.textContent = 'Wróć';
  backBtn.onclick = () => renderCampfireMain(uiManager);
  panel.appendChild(backBtn);
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
