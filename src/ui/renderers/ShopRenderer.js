import { cardLibrary } from '../../data/cards.js';
import * as uiHelpers from '../helpers/UIHelpers.js';
import * as cardRenderer from './CardRenderer.js';

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

  // Clear the entire panel to rebuild the layout from scratch
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

  // 4. Global Exit Button
  const exitBtn = document.createElement('button');
  exitBtn.className = 'btn shop-exit-btn';
  exitBtn.style.marginTop = 'auto';
  exitBtn.textContent = 'Wróć na szlak';
  exitBtn.onclick = () => closeShop(uiManager);
  panel.appendChild(exitBtn);
}

/**
 * Handles routing to category subviews.
 */
function renderShopSubView(uiManager, viewId) {
  if (viewId === 'cards') {
    renderCardShop(uiManager);
  } else {
    const message = document.getElementById('shop-message');
    if (message) message.textContent = `Kategoria ${viewId} wkrótce dostępna!`;
  }
}

/**
 * Renders the Card Shop Sub-view (Step 2).
 */
function renderCardShop(uiManager) {
  const panel = document.getElementById('shop-panel');
  if (!panel) return;

  // --- CRITICAL FALLBACK: Generate shop cards if GameState hasn't ---
  if (!uiManager.state.shopCards || uiManager.state.shopCards.length === 0) {
    const randomCardIds = uiManager._pickRewardCards ? uiManager._pickRewardCards(4) : [];
    uiManager.state.shopCards = randomCardIds.map(cardId => {
      const cardDef = cardLibrary[cardId];
      let price = 50; 
      if (cardDef.rarity === 'rare') price = 120;
      if (cardDef.rarity === 'uncommon') price = 80;
      return { card: cardDef, price: price, sold: false };
    });
  }

  panel.innerHTML = '';
  
  const header = document.createElement('div');
  header.className = 'shop-header';
  header.innerHTML = `
    <h2 class="event-title">Wybierz Karty</h2>
    <div class="map-resource-strip">
       <div class="map-resource-pill">💰 ${uiManager.state.dutki} Dutków</div>
    </div>
  `;
  panel.appendChild(header);

  const cardGrid = document.createElement('div');
  cardGrid.className = 'shop-cards-grid'; 

  let available = 0;
  
  uiManager.state.shopCards.forEach((item) => {
    if (item.sold) return;
    available++;

    const card = item.card;
    const price = item.price;
    const cardDesc = cardRenderer.getCardDescription(uiManager, card);
    
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'shop-card-wrapper';
    cardWrapper.style.display = 'flex';
    cardWrapper.style.flexDirection = 'column';
    cardWrapper.style.alignItems = 'center';
    cardWrapper.style.gap = '10px';

    const cardEl = document.createElement('div');
    cardEl.className = `card reward-phase-card ${uiHelpers.rarityClass(card.rarity)} card-${card.type}`;
    cardEl.innerHTML = `
        <div class="card-header">
          <div class="card-title">${card.name}</div>
          <div class="card-cost-oscypek">
            <span class="cost-value">${card.cost}</span>
            <span class="cost-icon">🧀</span>
          </div>
        </div>
        <div class="card-subtitle">${uiHelpers.getFullCardType(card.rarity, card.type)}</div>
        <div class="card-art"><span class="card-icon">${card.emoji}</span></div>
        <div class="card-text-box"><div class="card-desc">${cardDesc}</div></div>
    `;

    const buyBtn = document.createElement('button');
    buyBtn.className = 'btn shop-buy-btn';
    buyBtn.innerHTML = `Kup: ${price} 💰`;
    buyBtn.disabled = uiManager.state.dutki < price;
    
    buyBtn.onclick = () => {
      if (uiManager.state.spendDutki(price)) {
        uiManager.state.deck.push(card.id);
        item.sold = true;
        uiManager.state.lastShopMessage = `Kupiono: ${card.name}`;
        renderCardShop(uiManager); 
        uiManager.updateUI();
      }
    };

    cardWrapper.appendChild(cardEl);
    cardWrapper.appendChild(buyBtn);
    cardGrid.appendChild(cardWrapper);
  });

  if (available === 0) {
    const msg = document.createElement('div');
    msg.className = 'shop-message';
    msg.textContent = 'Wszystkie karty wyprzedane.';
    panel.appendChild(msg);
  } else {
    panel.appendChild(cardGrid);
  }

  const message = document.createElement('div');
  message.id = 'shop-message';
  message.className = 'shop-message';
  message.textContent = uiManager.state.lastShopMessage || '';
  panel.appendChild(message);

  const backBtn = document.createElement('button');
  backBtn.className = 'btn shop-exit-btn';
  backBtn.style.marginTop = 'auto';
  backBtn.textContent = 'Wróć do Bacy';
  backBtn.onclick = () => {
    uiManager.state.lastShopMessage = '';
    renderShopOffers(uiManager);
  };
  panel.appendChild(backBtn);
}