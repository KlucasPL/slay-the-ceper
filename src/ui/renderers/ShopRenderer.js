import { cardLibrary } from '../../data/cards.js';
import { relicLibrary } from '../../data/relics.js';
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
  exitBtn.id = 'shop-exit-btn';
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
  } else if (viewId === 'relics') {
    renderRelicShop(uiManager);
  } else if (viewId === 'services') {
    renderServicesShop(uiManager);
  } else if (viewId === 'removal') {
    renderRemovalShop(uiManager);
  } else {
    const message = document.getElementById('shop-message');
    if (message) message.textContent = `Kategoria ${viewId} wkrótce dostępna!`;
  }
  /**
   * Renders the Relic Shop Sub-view.
   */
  function renderRelicShop(uiManager) {
    const panel = document.getElementById('shop-panel');
    if (!panel) return;

    panel.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'shop-header';
    header.innerHTML = `
    <h2 class="event-title">Kup Pamiątki</h2>
    <div class="map-resource-strip">
       <div class="map-resource-pill">💰 ${uiManager.state.dutki} Dutków</div>
    </div>
  `;
    panel.appendChild(header);

    const relicGrid = document.createElement('div');
    relicGrid.className = 'shop-cards-grid';
    relicGrid.style.justifyContent = 'center';

    // Fetch the relic directly from GameState
    const relicId = uiManager.state.shopStock?.relic;

    if (!relicId) {
      const msg = document.createElement('div');
      msg.className = 'shop-message';
      msg.textContent = 'Brak pamiątek na sprzedaż (lub zostały już wykupione).';
      panel.appendChild(msg);
    } else {
      const relicDef = relicLibrary[relicId];
      // Base pricing based on rarity
      let price = 150;
      if (relicDef.rarity === 'rare') price = 250;
      if (relicDef.rarity === 'uncommon') price = 150;
      if (relicDef.rarity === 'common') price = 100;

      // Apply GameState Discounts manually (since getCardShopPrice is only for cards)
      if (uiManager.state.hasRelic('zlota_karta_zakopianczyka')) {
        price = Math.floor(price * 0.85);
      } else if (uiManager.state.maryna?.flags?.listaDiscountActive) {
        price = Math.floor(price * 0.7);
      }

      const relicItem = { ...relicDef, price: price, id: relicId };

      const relicWrapper = document.createElement('div');
      relicWrapper.className = 'shop-card-wrapper';
      relicWrapper.style.display = 'flex';
      relicWrapper.style.flexDirection = 'column';
      relicWrapper.style.alignItems = 'center';
      relicWrapper.style.gap = '10px';

      const relicEl = document.createElement('div');
      relicEl.className = 'relic-plate';
      relicEl.style.margin = '0';
      relicEl.innerHTML = `
      <div class="relic-plate-title">${relicDef.name}</div>
      <div style="font-size: 3rem; margin: 4px 0;">${relicDef.emoji}</div>
      <div class="relic-plate-rarity">${uiHelpers.rarityLabel(relicDef.rarity, 'relic')}</div>
      <div class="relic-plate-desc">${relicDef.desc}</div>
    `;
      uiHelpers.attachLongPressZoom(relicEl, () => uiManager.showRelicZoom(relicId));

      const buyBtn = document.createElement('button');
      buyBtn.className = 'btn shop-buy-btn';
      buyBtn.innerHTML = `Kup: ${price} 💰`;
      buyBtn.disabled = uiManager.state.dutki < price;
      buyBtn.onclick = () => {
        const result = uiManager.state.buyItem(relicItem, 'relic');
        uiManager.state.lastShopMessage = result.message;
        if (result.success) {
          renderRelicShop(uiManager);
          uiManager.updateUI();
        }
      };

      relicWrapper.appendChild(relicEl);
      relicWrapper.appendChild(buyBtn);
      relicGrid.appendChild(relicWrapper);
      panel.appendChild(relicGrid);
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
}

/**
 * Renders the Services Sub-view (Healing)
 */
function renderServicesShop(uiManager) {
  const panel = document.getElementById('shop-panel');
  if (!panel) return;
  panel.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'shop-header';
  header.innerHTML = `
    <h2 class="event-title">Usługi Bacy</h2>
    <div class="map-resource-strip">
       <div class="map-resource-pill">💰 ${uiManager.state.dutki} Dutków</div>
       <div class="map-resource-pill">❤️ ${uiManager.state.player.hp} / ${uiManager.state.player.maxHp} HP</div>
    </div>
  `;
  panel.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'shop-cards-grid';
  grid.style.justifyContent = 'center';

  const healCost = 75;
  const healAmount = 15;
  const hasSheepBell = uiManager.state.hasRelic('dzwonek_owcy');

  const wrapper = document.createElement('div');
  wrapper.className = 'shop-card-wrapper';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.alignItems = 'center';

  const serviceEl = document.createElement('div');
  serviceEl.className = 'relic-plate';
  serviceEl.innerHTML = `
    <div class="relic-plate-title">Ciepły Oscypek</div>
    <div style="font-size: 3rem; margin: 4px 0;">🧀</div>
    <div class="relic-plate-desc">Odzyskaj ${healAmount} Krzepy (HP).</div>
  `;

  const buyBtn = document.createElement('button');
  buyBtn.className = 'btn shop-buy-btn';
  buyBtn.innerHTML = hasSheepBell ? 'Zablokowane przez Dzwonek Owcy!' : `Kup: ${healCost} 💰`;
  buyBtn.disabled =
    hasSheepBell ||
    uiManager.state.dutki < healCost ||
    uiManager.state.player.hp >= uiManager.state.player.maxHp;

  buyBtn.onclick = () => {
    if (uiManager.state.spendDutki(healCost)) {
      uiManager.state.healPlayer(healAmount);
      uiManager.state.lastShopMessage = 'Baca dał oscypek na ratunek. (+15 HP)';
      renderServicesShop(uiManager);
      uiManager.updateUI();
    }
  };

  wrapper.appendChild(serviceEl);
  wrapper.appendChild(buyBtn);
  grid.appendChild(wrapper);
  panel.appendChild(grid);

  const message = document.createElement('div');
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

/**
 * Renders the Card Removal Sub-view
 */
function renderRemovalShop(uiManager) {
  const panel = document.getElementById('shop-panel');
  if (!panel) return;
  panel.innerHTML = '';

  const price = uiManager.state.getShopRemovalPrice();

  const header = document.createElement('div');
  header.className = 'shop-header';
  header.innerHTML = `
    <h2 class="event-title">Usuń Kartę z Talii</h2>
    <p style="color: #f3dfbd; margin-top: 5px;">Wybierz kartę, o której chcesz zapomnieć.</p>
    <div class="map-resource-strip">
       <div class="map-resource-pill">💰 ${uiManager.state.dutki} Dutków</div>
    </div>
  `;
  panel.appendChild(header);

  // Deck Grid - Override flex-wrap so the whole deck can be seen in rows
  const grid = document.createElement('div');
  grid.className = 'shop-cards-grid';
  grid.style.flexWrap = 'wrap';
  grid.style.justifyContent = 'center';

  const deckIds = uiManager.state.deck || [];

  if (deckIds.length === 0) {
    const msg = document.createElement('div');
    msg.className = 'shop-message';
    msg.textContent = 'Twoja talia jest pusta.';
    panel.appendChild(msg);
  } else {
    deckIds.forEach((cardId) => {
      const cardDef = cardLibrary[cardId];
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
          <div class="card-text-box"><div class="card-desc">${cardRenderer.getCardDescription(uiManager, cardDef)}</div></div>
      `;
      uiHelpers.attachLongPressZoom(cardEl, () => uiManager.showCardZoom(cardId));

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn shop-buy-btn';
      removeBtn.innerHTML = `Usuń: ${price} 💰`;
      removeBtn.style.backgroundColor = '#e74c3c';
      removeBtn.style.borderColor = '#c0392b';
      removeBtn.style.boxShadow = '0 4px 0 #922b21';
      removeBtn.disabled = uiManager.state.dutki < price;

      removeBtn.onclick = () => {
        if (uiManager.state.spendDutki(price)) {
          uiManager.state.removeCardFromDeck(cardId);
          uiManager.state.logAction('removals', cardId);
          uiManager.state.afterShopCardRemoval();
          uiManager.state.lastShopMessage = `Usunięto z talii: ${cardDef.name}`;
          renderRemovalShop(uiManager);
          uiManager.updateUI();
        }
      };

      wrapper.appendChild(cardEl);
      wrapper.appendChild(removeBtn);
      grid.appendChild(wrapper);
    });
    panel.appendChild(grid);
  }

  const message = document.createElement('div');
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

/**
 * Renders the Card Shop Sub-view (Step 2).
 */
/**
 * Renders the Card Shop Sub-view using real GameState data.
 */
function renderCardShop(uiManager) {
  const panel = document.getElementById('shop-panel');
  if (!panel) return;

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

  // Use the actual shop stock generated by GameState
  const cardIds = uiManager.state.shopStock?.cards || [];

  cardIds.forEach((cardId) => {
    const cardDef = cardLibrary[cardId];
    if (!cardDef) return;

    // Use actual pricing logic (factors in Maryna discounts, etc.)
    const price = uiManager.state.getCardShopPrice(cardId);
    const cardDesc = cardRenderer.getCardDescription(uiManager, cardDef);

    // Create the item object expected by buyItem()
    const cardItem = { ...cardDef, id: cardId, price: price };

    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'shop-card-wrapper';
    cardWrapper.style.display = 'flex';
    cardWrapper.style.flexDirection = 'column';
    cardWrapper.style.alignItems = 'center';
    cardWrapper.style.gap = '10px';

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
        <div class="card-text-box"><div class="card-desc">${cardDesc}</div></div>
    `;
    uiHelpers.attachLongPressZoom(cardEl, () => uiManager.showCardZoom(cardId));

    const buyBtn = document.createElement('button');
    buyBtn.className = 'btn shop-buy-btn';
    buyBtn.innerHTML = `Kup: ${price} 💰`;
    buyBtn.disabled = uiManager.state.dutki < price;

    buyBtn.onclick = () => {
      // Use the native buyItem logic
      const result = uiManager.state.buyItem(cardItem, 'card');
      uiManager.state.lastShopMessage = result.message;
      if (result.success) {
        renderCardShop(uiManager); // Re-render this view (bought card will disappear)
        uiManager.updateUI();
      }
    };

    cardWrapper.appendChild(cardEl);
    cardWrapper.appendChild(buyBtn);
    cardGrid.appendChild(cardWrapper);
  });

  if (cardIds.length === 0) {
    const msg = document.createElement('div');
    msg.className = 'shop-message';
    msg.textContent = 'Brak kart na sprzedaż (lub wszystkie wyprzedane).';
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
