import { cardLibrary } from '../../data/cards.js';
import * as uiHelpers from '../helpers/UIHelpers.js';

/**
 * @param {any} uiManager
 * @param {import('../../data/cards.js').CardDef} card
 * @returns {string}
 */
export function getCardDescription(uiManager, card) {
  if (card.id === 'prestiz_na_kredyt') {
    return `Zyskujesz ${uiManager.state.getPrestizNaKredytBlock()} Gardy (bazowo 6, +2 za każde 20 dutków, max +14).`;
  }
  return card.desc;
}

/**
 * @returns {HTMLDivElement}
 */
export function createExhaustBadge() {
  const badge = document.createElement('div');
  badge.className = 'card-exhaust-badge';
  badge.innerHTML = '<span class="card-exhaust-fire">🔥</span> <b>PRZEPADO</b>';
  return badge;
}

/**
 * @param {any} uiManager
 */
export function renderHand(uiManager) {
  const { hand, player, enemy } = uiManager.state;
  const handDiv = document.getElementById('hand');
  if (!handDiv) return;
  handDiv.innerHTML = '';

  hand.forEach((cardId, index) => {
    const card = cardLibrary[cardId];
    const actualCost = uiManager.state.getCardCostInHand(cardId);
    const canPlay = player.energy >= actualCost && !card.unplayable;

    const cardEl = document.createElement('div');
    const isKept = uiManager.state.smyczKeptHandIndex === index;
    cardEl.className = `card ${uiHelpers.rarityClass(card.rarity)} card-${card.type}${canPlay ? '' : ' disabled'}${isKept ? ' card--kept' : ''}`;
    cardEl.dataset.cardId = cardId;

    if (card.exhaust) {
      cardEl.classList.add('card-exhaust');
      cardEl.appendChild(createExhaustBadge());
    }

    if (canPlay && player.hp > 0 && enemy.hp > 0) {
      cardEl.addEventListener('click', () => {
        if (!uiManager.isAnimating) uiManager._handlePlayCard(index);
      });
    }

    const costEl = document.createElement('div');
    costEl.className = 'card-cost';
    costEl.textContent = String(actualCost);
    const titleEl = document.createElement('div');
    titleEl.className = 'card-title';
    titleEl.textContent = card.name;
    const rarityEl = document.createElement('div');
    rarityEl.className = 'card-rarity';
    rarityEl.textContent = uiHelpers.getFullCardType(card.rarity, card.type);
    const imgEl = document.createElement('div');
    imgEl.className = 'card-img';
    const iconEl = document.createElement('span');
    iconEl.className = 'card-icon';
    iconEl.textContent = card.emoji;
    imgEl.appendChild(iconEl);
    const descEl = document.createElement('div');
    descEl.className = 'card-desc';
    descEl.textContent = getCardDescription(uiManager, card);

    cardEl.append(costEl, titleEl, rarityEl, imgEl, descEl);

    if (uiManager.state.hasRelic('smycz_zakopane') && player.hp > 0 && enemy.hp > 0) {
      const keepBtn = document.createElement('button');
      keepBtn.type = 'button';
      keepBtn.className = 'card-keep-btn';
      keepBtn.textContent = '📿';
      keepBtn.title = isKept ? 'Anuluj zachowanie' : 'Zachowaj na następną turę';
      keepBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        uiManager.state.setSmyczKeptCard(index);
        uiManager.updateUI();
      });
      cardEl.appendChild(keepBtn);
    }

    handDiv.appendChild(cardEl);
  });
}
