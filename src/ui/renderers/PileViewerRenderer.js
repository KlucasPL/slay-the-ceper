import { getCardDefinition } from '../../data/cards.js';
import * as uiHelpers from '../helpers/UIHelpers.js';
import * as cardRenderer from './CardRenderer.js';

/**
 * @param {any} uiManager
 * @param {'draw' | 'discard' | 'exhaust'} pileType
 */
export function openPileViewer(uiManager, pileType) {
  if (uiManager._isInputLocked()) return;
  if (uiManager.state.currentScreen !== 'battle') return;
  uiManager.isPileViewerOpen = true;
  uiManager.activePileViewer = pileType;
  renderPileViewer(uiManager);
  uiManager._syncEndTurnButtonState();
}

/**
 * @param {any} uiManager
 */
export function closePileViewer(uiManager) {
  if (uiManager._isInputLocked()) return;
  const overlay = document.getElementById('pile-viewer-overlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
  uiManager.isPileViewerOpen = false;
  uiManager.activePileViewer = null;
  uiManager._syncEndTurnButtonState();
}

/**
 * @param {any} uiManager
 */
export function renderPileViewer(uiManager) {
  const overlay = document.getElementById('pile-viewer-overlay');
  const title = document.getElementById('pile-viewer-title');
  const grid = document.getElementById('pile-viewer-grid');
  if (!overlay || !title || !grid || !uiManager.activePileViewer) return;

  const view = buildPileViewerData(uiManager, uiManager.activePileViewer);
  title.textContent = view.title;
  grid.innerHTML = '';

  if (view.ids.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'pile-viewer-empty';
    empty.textContent = 'Brak kart w tym stosie.';
    grid.appendChild(empty);
  } else {
    view.ids.forEach((cardId) => {
      const card = getCardDefinition(cardId);
      if (!card) return;
      const cardEl = document.createElement('div');
      cardEl.className = `card pile-viewer-card ${uiHelpers.rarityClass(card.rarity)} card-${card.type}`;
      cardEl.innerHTML = `
        <div class="card-header">
          <div class="card-title">${card.name}</div>
          <div class="card-cost-oscypek">
            <span class="cost-value">${card.cost}</span>
            <span class="cost-icon">🧀</span>
          </div>
        </div>
        <div class="card-subtitle">${uiHelpers.getFullCardType(card.rarity, card.type)}</div>
        <div class="card-art">
          <span class="card-icon">${card.emoji}</span>
        </div>
        <div class="card-text-box">
          <div class="card-desc">${cardRenderer.getCardDescription(uiManager, card, cardId)}</div>
        </div>
      `;
      if (card.exhaust) {
        cardEl.classList.add('card-exhaust');
        const exhaustEl = document.createElement('div');
        exhaustEl.className = 'card-exhaust-inline';
        exhaustEl.innerHTML = '<span class="exhaust-fire">🔥</span> PRZEPADO';
        cardEl.querySelector('.card-text-box').appendChild(exhaustEl);
      }
      uiHelpers.attachLongPressZoom(cardEl, () => uiManager.showCardZoom(cardId));
      grid.appendChild(cardEl);
    });
  }

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}

/**
 * @param {any} uiManager
 * @param {'draw' | 'discard' | 'exhaust'} pileType
 * @returns {{ title: string, ids: string[] }}
 */
export function buildPileViewerData(uiManager, pileType) {
  const drawSource =
    uiManager.state?.combatState?.drawPile ??
    uiManager.state.deck ??
    uiManager.state.drawPile ??
    [];
  const discardSource =
    uiManager.state?.combatState?.discardPile ??
    uiManager.state.discard ??
    uiManager.state.discardPile ??
    [];
  const exhaustSource =
    uiManager.state?.combatState?.exhaustPile ??
    uiManager.state.exhaust ??
    uiManager.state.exhaustPile ??
    [];

  const toIds = (source) => {
    if (!Array.isArray(source)) return [];
    return source
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry === 'object' && typeof entry.id === 'string') return entry.id;
        return null;
      })
      .filter((id) => typeof id === 'string');
  };

  const drawIds = toIds(drawSource)
    .filter((id) => Boolean(getCardDefinition(id)))
    .sort((a, b) => {
      const cardA = getCardDefinition(a);
      const cardB = getCardDefinition(b);
      return cardA.cost - cardB.cost || cardA.name.localeCompare(cardB.name, 'pl');
    });

  const discardIds = toIds(discardSource)
    .filter((id) => Boolean(getCardDefinition(id)))
    .reverse();

  const exhaustIds = toIds(exhaustSource)
    .filter((id) => Boolean(getCardDefinition(id)))
    .reverse();

  if (pileType === 'draw') {
    return { title: 'Talia Dociągu', ids: drawIds };
  }
  if (pileType === 'discard') {
    return { title: 'Karty Odrzucone', ids: discardIds };
  }
  return { title: 'Przepadło', ids: exhaustIds };
}
