import * as uiHelpers from '../helpers/UIHelpers.js';

/**
 * Entry point to open the shop.
 */
export function openShop(uiManager) {
  if (uiManager._isInputLocked()) return;
  uiHelpers.hideOverlay('map-overlay');
  const overlay = document.getElementById('shop-overlay');
  if (!overlay) return;

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');

  // Initialize stock for the current node
  uiManager.state.generateShopStock();
  renderShopOffers(uiManager);
  uiManager.audioManager.playShopMusic();
}

/**
 * Entry point to close the shop.
 */
export function closeShop(uiManager) {
  if (uiManager._isInputLocked()) return;
  uiHelpers.hideOverlay('shop-overlay');
  uiManager.audioManager.stopShopMusic();
  uiManager._openMapOverlay();
  uiManager.updateUI();
}

/**
 * Renders the Main Shop Category Menu (Step 1).
 */
export function renderShopOffers(uiManager) {
  const panel = document.getElementById('shop-panel');
  if (!panel) return;
  panel.innerHTML = '';

  // 1. Header with ORIGINAL SVG and Specific Greeting
  const header = document.createElement('div');
  header.className = 'shop-header';
  header.innerHTML = `
    <h2 class="event-title">Jarmark u Bacy</h2>
    <div class="baca-sprite" id="baca-sprite">
      <svg viewBox="0 0 120 100" width="160" height="120" aria-label="Baca za ladą">
        <rect x="5" y="62" width="110" height="28" rx="6" fill="#6e4a2b" stroke="#3d2716" stroke-width="4" />
        <rect x="8" y="70" width="104" height="6" fill="#8f673f" />
        <circle cx="60" cy="34" r="16" fill="#f2c8a6" />
        <path d="M 44,25 Q 60,8 76,25" fill="#1d1d1d" />
        <rect x="43" y="49" width="34" height="18" rx="6" fill="#f7efe0" stroke="#bca88a" stroke-width="2" />
        <path d="M 46,50 L 74,50 M 46,56 L 74,56" stroke="#ba2d2d" stroke-width="2" />
        <path d="M 52,39 Q 60,45 68,39" fill="none" stroke="#5a2f16" stroke-width="3" />
        <circle cx="54" cy="33" r="2" fill="#111" />
        <circle cx="66" cy="33" r="2" fill="#111" />
      </svg>
    </div>
    <p class="shop-line">"Patrzcie no! Mom towar i ciepłe oscypki!"</p>
    <div class="map-resource-strip">
       <div class="map-resource-pill">💰 ${uiManager.state.dutki} Dutków</div>
       <div class="map-resource-pill">❤️ ${uiManager.state.player.hp} / ${uiManager.state.player.maxHp} HP</div>
    </div>
  `;
  panel.appendChild(header);

  // 2. Main Menu Grid
  const menuGrid = document.createElement('div');
  menuGrid.className = 'shop-main-menu';

  const categories = [
    { id: 'cards', label: 'Kup Karty', icon: '🃏' },
    { id: 'relics', label: 'Pamiątki', icon: '🏔️' },
    { id: 'services', label: 'Usługi Bacy', icon: '🧀' },
    { id: 'removal', label: 'Usuwanie Kart', icon: '🔥' },
  ];

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'shop-category-btn';
    btn.innerHTML = `
      <span class="category-icon">${cat.icon}</span>
      <span class="category-label">${cat.label}</span>
    `;
    btn.onclick = () => renderShopSubView(uiManager, cat.id);
    menuGrid.appendChild(btn);
  });
  panel.appendChild(menuGrid);

  // 3. Status Message Area
  const message = document.createElement('div');
  message.id = 'shop-message';
  message.className = 'shop-message';
  message.textContent = uiManager.state.lastShopMessage || '';
  panel.appendChild(message);

  // 4. Exit Button
  const exitBtn = document.createElement('button');
  exitBtn.className = 'btn shop-exit-btn';
  exitBtn.style.marginTop = 'auto';
  exitBtn.textContent = 'Wróć na szlak';
  exitBtn.onclick = () => closeShop(uiManager);
  panel.appendChild(exitBtn);
}

/**
 * Placeholder for category subviews (to be implemented in next steps).
 */
function renderShopSubView(uiManager, viewId) {
  const message = document.getElementById('shop-message');
  if (message) message.textContent = `Wybrano kategorię: ${viewId}. (Wkrótce dostępne)`;
}
