import { getCardDefinition } from '../../data/cards.js';
import * as uiHelpers from '../helpers/UIHelpers.js';
import * as cardZoomOverlay from '../overlays/CardZoomOverlay.js';

/**
 * @param {any} uiManager
 * @param {import('../../data/cards.js').CardDef} card
 * @param {string} [runtimeCardId]
 * @returns {string}
 */
export function getCardDescription(uiManager, card, runtimeCardId = card.id) {
  const upgradeBonus = uiManager.state.getCardDamageBonus(runtimeCardId);

  if (card.id === 'prestiz_na_kredyt') {
    const baseDescription = `Zyskujesz ${uiManager.state.getPrestizNaKredytBlock()} Gardy (bazowo 6, +2 za każde 20 dutków, max +14).`;
    return upgradeBonus > 0
      ? `${baseDescription} Naostrzona: +${upgradeBonus} do ataku w tej walce.`
      : baseDescription;
  }

  if (card.type === 'attack' && upgradeBonus > 0) {
    return `${card.desc} Naostrzona: +${upgradeBonus} do ataku w tej walce.`;
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
    const card = getCardDefinition(cardId);
    if (!card) return;
    const actualCost = uiManager.state.getCardCostInHand(cardId);
    const cardDescription = getCardDescription(uiManager, card, cardId);
    const canPlay = player.energy >= actualCost && !card.unplayable;

    const cardEl = document.createElement('div');
    const isKept = uiManager.state.smyczKeptHandIndex === index;
    cardEl.className = `card ${uiHelpers.rarityClass(card.rarity)} card-${card.type}`;
    cardEl.dataset.cardId = cardId;
    if (!canPlay) {
      cardEl.classList.add('card-disabled-state');
    }
    if (isKept) {
      cardEl.classList.add('card--kept');
    }

    // New Fluid Tatra Card Layout
    cardEl.innerHTML = `
      <div class="card-header">
        <div class="card-title">${card.name}</div>
        <div class="card-cost-oscypek">
          <span class="cost-value">${actualCost}</span>
          <span class="cost-icon">🧀</span>
        </div>
      </div>
      <div class="card-subtitle">${uiHelpers.getFullCardType(card.rarity, card.type)}</div>
      <div class="card-art">
        <span class="card-icon">${card.emoji}</span>
      </div>
      <div class="card-text-box">
        <div class="card-desc">${cardDescription}</div>
      </div>
    `;

    // Inline Highlander Exhaust
    if (card.exhaust) {
      cardEl.classList.add('card-exhaust');
      const exhaustEl = document.createElement('div');
      exhaustEl.className = 'card-exhaust-inline';
      exhaustEl.innerHTML = '<span class="exhaust-fire">🔥</span> PRZEPADO';
      cardEl.querySelector('.card-text-box').appendChild(exhaustEl);
    }

    // Always attach click handler during battle
    if (player.hp > 0 && enemy.hp > 0) {
      cardEl.addEventListener('click', () => {
        if (cardEl.dataset.longPressZoomUsed === 'true') {
          cardEl.dataset.longPressZoomUsed = 'false';
          return;
        }
        if (uiManager.isAnimating) return;
        if (!canPlay) {
          uiManager._showFloatingText('sprite-player', 'Brak oscypków!', 'floating-shame');
          return;
        }
        uiManager._handlePlayCard(index);
      });
    }

    attachMobileLongPressZoom(cardEl, {
      name: card.name,
      emoji: card.emoji,
      rarityLabel: uiHelpers.getFullCardType(card.rarity, card.type),
      cost: actualCost,
      description: cardDescription,
      rarityClass: uiHelpers.rarityClass(card.rarity),
      typeClass: `card-${card.type}`,
      exhaust: Boolean(card.exhaust),
    });

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

  attachHandTapToOpenView(handDiv, uiManager);
  /**
   * Attaches a tap handler to the hand container on mobile to open the full hand view.
   * Distinguishes between tapping a card (which triggers zoom/play) and tapping the background.
   *
   * @param {HTMLElement} handDiv
   * @param {any} uiManager
   */
  function attachHandTapToOpenView(handDiv, uiManager) {
    if (!isTouchMobileDevice()) return;

    // Remove old handler if exists
    if (handDiv.dataset.handViewHandler === 'true') {
      return;
    }
    handDiv.dataset.handViewHandler = 'true';

    handDiv.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      // If clicked on a card element itself, let card's own handlers deal with it
      if (target.closest('.card')) return;

      // Only open hand view on mobile if there are cards
      if (uiManager.state.hand.length === 0) return;

      // Build card view objects for the hand view overlay
      const cardViews = uiManager.state.hand
        .map((cardId, index) => {
          const card = getCardDefinition(cardId);
          if (!card) return null;

          const actualCost = uiManager.state.getCardCostInHand(cardId);
          const cardDescription = getCardDescription(uiManager, card, cardId);

          return {
            cardId,
            handIndex: index,
            name: card.name,
            emoji: card.emoji,
            rarityLabel: uiHelpers.getFullCardType(card.rarity, card.type),
            cost: actualCost,
            description: cardDescription,
            rarityClass: uiHelpers.rarityClass(card.rarity),
            typeClass: `card-${card.type}`,
            exhaust: Boolean(card.exhaust),
          };
        })
        .filter(Boolean);

      if (cardViews.length > 0) {
        // Import at function scope to avoid circular dependency
        import('../overlays/HandViewOverlay.js').then((handViewOverlay) => {
          const onCardClick = (index) => {
            if (!uiManager.isAnimating) {
              uiManager._handlePlayCard(index);
            }
          };
          handViewOverlay.openHandView(cardViews, onCardClick);
        });
      }
    });
  }
}

/**
 * @returns {boolean}
 */
function isTouchMobileDevice() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
  );
}

/**
 * Adds long-press gesture on mobile to preview a card in full-screen.
 *
 * @param {HTMLDivElement} cardEl
 * @param {{
 *   name: string,
 *   emoji: string,
 *   rarityLabel: string,
 *   cost: number,
 *   description: string,
 *   rarityClass: string,
 *   typeClass: string,
 *   exhaust: boolean,
 * }} cardView
 */
function attachMobileLongPressZoom(cardEl, cardView) {
  if (!isTouchMobileDevice()) return;

  const LONG_PRESS_MS = 360;
  const MOVE_CANCEL_PX = 14;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;
  /** @type {number} */
  let startX = 0;
  /** @type {number} */
  let startY = 0;

  const clearLongPress = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  cardEl.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    event.preventDefault();
    startX = event.clientX;
    startY = event.clientY;
    clearLongPress();
    timer = setTimeout(() => {
      cardEl.dataset.longPressZoomUsed = 'true';
      cardZoomOverlay.openCardZoom(cardView);
      timer = null;
    }, LONG_PRESS_MS);
  });

  cardEl.addEventListener('pointermove', (event) => {
    if (timer === null || event.pointerType !== 'touch') return;
    if (Math.abs(event.clientX - startX) > MOVE_CANCEL_PX) clearLongPress();
    if (Math.abs(event.clientY - startY) > MOVE_CANCEL_PX) clearLongPress();
  });

  cardEl.addEventListener('pointerup', clearLongPress);
  cardEl.addEventListener('pointercancel', clearLongPress);
  cardEl.addEventListener('pointerleave', clearLongPress);
}
