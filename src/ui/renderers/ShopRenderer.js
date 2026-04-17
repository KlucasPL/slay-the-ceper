import { getBaseCardId, getCardDefinition } from '../../data/cards.js';
import { relicLibrary } from '../../data/relics.js';
import * as uiHelpers from '../helpers/UIHelpers.js';
import * as cardRenderer from './CardRenderer.js';

/**
 * @param {any} uiManager
 */
export function openShop(uiManager) {
  if (uiManager._isInputLocked()) return;
  uiHelpers.hideOverlay('map-overlay');
  const overlay = document.getElementById('shop-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  uiManager.state.generateShopStock();
  renderShopOffers(uiManager);
  uiManager.audioManager.playShopMusic();
}

/**
 * @param {any} uiManager
 */
export function closeShop(uiManager) {
  if (uiManager._isInputLocked()) return;
  uiHelpers.hideOverlay('shop-overlay');
  uiManager.audioManager.stopShopMusic();
  uiManager._openMapOverlay();
  uiManager.updateUI();
}

/**
 * @param {any} uiManager
 */
export function renderShopOffers(uiManager) {
  const cardContainer = document.getElementById('shop-cards');
  const relicContainer = document.getElementById('shop-relic');
  const healBtn = document.getElementById('shop-heal-btn');
  const removeBtn = document.getElementById('shop-remove-btn');
  const message = document.getElementById('shop-message');
  const dutkiCurrent = document.getElementById('shop-dutki-current');
  const hpCurrent = document.getElementById('shop-hp-current');
  const hpMax = document.getElementById('shop-hp-max');
  const cards = uiManager.state.shopStock.cards;

  if (dutkiCurrent) {
    dutkiCurrent.textContent = String(uiManager.state.dutki);
  }
  if (hpCurrent) {
    hpCurrent.textContent = String(uiManager.state.player.hp);
  }
  if (hpMax) {
    hpMax.textContent = String(uiManager.state.player.maxHp);
  }

  cardContainer.innerHTML = '';
  cards.forEach((cardId) => {
    const card = getCardDefinition(cardId);
    if (!card) return;
    const cardDesc = cardRenderer.getCardDescription(uiManager, card, cardId);

    const cardBox = document.createElement('div');
    cardBox.className = `shop-item ${uiHelpers.rarityClass(card.rarity)}`;
    if (card.exhaust) {
      cardBox.classList.add('card-exhaust');
      cardBox.appendChild(cardRenderer.createExhaustBadge());
    }

    const title = document.createElement('div');
    title.className = 'shop-item-title';
    title.textContent = `${card.emoji} ${card.name}`;
    title.title = cardDesc;
    title.setAttribute('aria-label', `${card.name}: ${cardDesc}`);

    const desc = document.createElement('div');
    desc.className = 'shop-item-desc';
    desc.textContent = cardDesc;

    const rarity = document.createElement('div');
    rarity.className = 'shop-item-rarity';
    rarity.textContent = uiHelpers.getFullCardType(card.rarity, card.type);

    const energyCost = document.createElement('div');
    energyCost.className = 'shop-item-energy';
    energyCost.textContent = `${card.cost} Osc.`;
    energyCost.setAttribute('aria-label', `Koszt zagrania: ${card.cost} Oscypków`);

    const price = document.createElement('div');
    price.className = 'shop-item-price';
    const cardShopPrice = uiManager.state.getCardShopPrice(cardId);
    price.textContent = `${cardShopPrice} 💰`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'shop-card-btn';
    btn.textContent = 'Kup';
    btn.title = `${card.name}: ${cardDesc}`;
    btn.setAttribute('aria-label', `Kup kartę ${card.name}. ${cardDesc}`);
    btn.disabled = uiManager.state.dutki < cardShopPrice;
    btn.addEventListener('click', () => {
      if (uiManager._isInputLocked()) return;
      const cardWithPrice = { ...card, price: cardShopPrice };
      const result = uiManager.state.buyItem(cardWithPrice, 'card');
      message.textContent = result.message;
      renderShopOffers(uiManager);
      uiManager.updateUI();
    });

    cardBox.append(title, rarity, energyCost, desc, price, btn);
    cardContainer.appendChild(cardBox);
  });

  relicContainer.innerHTML = '';
  if (uiManager.state.shopStock.relic) {
    const relic = relicLibrary[uiManager.state.shopStock.relic];
    if (relic) {
      const relicBox = document.createElement('div');
      relicBox.className = `shop-item ${uiHelpers.rarityClass(relic.rarity)}`;

      const title = document.createElement('div');
      title.className = 'shop-item-title';
      title.textContent = `${relic.emoji} ${relic.name}`;
      title.title = relic.desc;
      title.setAttribute('aria-label', `${relic.name}: ${relic.desc}`);

      const desc = document.createElement('div');
      desc.className = 'shop-item-desc';
      desc.textContent = relic.desc;

      const rarity = document.createElement('div');
      rarity.className = 'shop-item-rarity';
      rarity.textContent = uiHelpers.rarityLabel(relic.rarity, 'relic');

      const price = document.createElement('div');
      price.className = 'shop-item-price';
      price.textContent = `${relic.price} 💰`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-card-btn';
      btn.textContent = 'Kup';
      btn.title = `${relic.name}: ${relic.desc}`;
      btn.setAttribute('aria-label', `Kup pamiątkę ${relic.name}. ${relic.desc}`);
      btn.disabled = uiManager.state.dutki < relic.price;
      btn.addEventListener('click', () => {
        if (uiManager._isInputLocked()) return;
        const result = uiManager.state.buyItem(relic, 'relic');
        message.textContent = result.message;
        renderShopOffers(uiManager);
        uiManager.updateUI();
      });

      relicBox.append(title, rarity, desc, price, btn);
      relicContainer.appendChild(relicBox);
    }
  }

  healBtn.disabled =
    uiManager.state.dutki < 75 || uiManager.state.player.hp >= uiManager.state.player.maxHp;
  populateRemoveCardSelect(uiManager);
  const select = document.getElementById('shop-remove-select');
  const removalPrice = uiManager.state.getShopRemovalPrice();
  removeBtn.textContent = `Usuń kartę (${removalPrice} 💰)`;
  removeBtn.disabled = uiManager.state.dutki < removalPrice || !select.value;

  if (!message.textContent) {
    message.textContent = uiManager.state.lastShopMessage;
  }
}

/**
 * @param {any} uiManager
 */
export function buyShopHeal(uiManager) {
  if (uiManager._isInputLocked()) return;
  const message = document.getElementById('shop-message');
  if (!uiManager.state.spendDutki(75)) {
    message.textContent = 'Ni mos tela dutków, synek!';
    return;
  }
  uiManager.state.healPlayer(15);
  message.textContent = 'Baca dał oscypek na ratunek.';
  renderShopOffers(uiManager);
  uiManager.updateUI();
}

/**
 * @param {any} uiManager
 */
export function buyCardRemoval(uiManager) {
  if (uiManager._isInputLocked()) return;
  const select = document.getElementById('shop-remove-select');
  const message = document.getElementById('shop-message');
  const cardId = select.value;
  if (!cardId) return;
  const removalPrice = uiManager.state.getShopRemovalPrice();
  if (!uiManager.state.spendDutki(removalPrice)) {
    message.textContent = 'Ni mos tela dutków, synek!';
    return;
  }
  const removed = uiManager.state.removeCardFromDeck(cardId);
  if (!removed) {
    message.textContent = 'Nie ma tej karty do usunięcia.';
    return;
  }
  message.textContent = `Usunięto kartę: ${getCardDefinition(cardId)?.name ?? getBaseCardId(cardId)}`;
  uiManager.state.afterShopCardRemoval();
  renderShopOffers(uiManager);
  uiManager.updateUI();
}

/**
 * @param {any} uiManager
 */
export function populateRemoveCardSelect(uiManager) {
  const select = document.getElementById('shop-remove-select');
  const pool = [
    ...uiManager.state.deck,
    ...uiManager.state.hand,
    ...uiManager.state.discard,
    ...uiManager.state.exhaust,
  ];
  const unique = [...new Set(pool.map((cardId) => getBaseCardId(cardId)))];
  select.innerHTML = '';
  unique.forEach((cardId) => {
    const option = document.createElement('option');
    option.value = cardId;
    option.textContent = getCardDefinition(cardId)?.name ?? cardId;
    select.appendChild(option);
  });
}
