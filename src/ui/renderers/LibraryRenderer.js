import { cardLibrary } from '../../data/cards.js';
import { relicLibrary } from '../../data/relics.js';
import * as uiHelpers from '../helpers/UIHelpers.js';
import * as cardRenderer from './CardRenderer.js';

/**
 * @param {any} uiManager
 */
export function openLibraryOverlay(uiManager) {
  if (uiManager._isInputLocked()) return;
  uiManager.libraryTab = 'cards';
  uiManager.libraryRarityFilter = 'all';
  renderLibrary(uiManager);
  const overlay = document.getElementById('library-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}

/**
 * @param {any} uiManager
 */
export function closeLibraryOverlay(uiManager) {
  if (uiManager._isInputLocked()) return;
  uiHelpers.hideOverlay('library-overlay');
  uiManager._syncScreenState();
}

/**
 * @param {any} uiManager
 * @param {'cards' | 'relics' | 'maryna'} tab
 */
export function setLibraryTab(uiManager, tab) {
  if (uiManager._isInputLocked()) return;
  uiManager.libraryTab = tab;
  renderLibrary(uiManager);
}

/**
 * @param {any} uiManager
 * @param {'all' | 'common' | 'uncommon' | 'rare'} rarity
 */
export function setLibraryFilter(uiManager, rarity) {
  if (uiManager._isInputLocked()) return;
  uiManager.libraryRarityFilter = rarity;
  renderLibrary(uiManager);
}

/**
 * @param {any} uiManager
 */
export function renderLibrary(uiManager) {
  const grid = document.getElementById('library-grid');
  const cardsTabBtn = document.getElementById('library-tab-cards');
  const relicsTabBtn = document.getElementById('library-tab-relics');
  const marynaTabBtn = document.getElementById('library-tab-maryna');
  if (!grid || !cardsTabBtn || !relicsTabBtn || !marynaTabBtn) return;

  cardsTabBtn.classList.toggle('is-active', uiManager.libraryTab === 'cards');
  cardsTabBtn.setAttribute('aria-selected', String(uiManager.libraryTab === 'cards'));
  relicsTabBtn.classList.toggle('is-active', uiManager.libraryTab === 'relics');
  relicsTabBtn.setAttribute('aria-selected', String(uiManager.libraryTab === 'relics'));
  marynaTabBtn.classList.toggle('is-active', uiManager.libraryTab === 'maryna');
  marynaTabBtn.setAttribute('aria-selected', String(uiManager.libraryTab === 'maryna'));

  document.querySelectorAll('.library-filter').forEach((btn) => {
    if (!(btn instanceof HTMLButtonElement)) return;
    const isActive = btn.dataset.rarity === uiManager.libraryRarityFilter;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });

  grid.innerHTML = '';
  const entries =
    uiManager.libraryTab === 'cards'
      ? Object.values(cardLibrary)
          .filter((card) => !card.eventOnly && !card.tutorialOnly)
          .filter((card) =>
            uiManager.libraryRarityFilter === 'all'
              ? true
              : card.rarity === uiManager.libraryRarityFilter
          )
          .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, 'pl'))
      : uiManager.libraryTab === 'maryna'
        ? Object.values(relicLibrary)
            .filter((relic) => relic.marynaOnly)
            .filter((relic) =>
              uiManager.libraryRarityFilter === 'all'
                ? true
                : relic.rarity === uiManager.libraryRarityFilter
            )
            .sort((a, b) => a.name.localeCompare(b.name, 'pl'))
        : Object.values(relicLibrary)
            .filter((relic) => !relic.marynaOnly)
            .filter((relic) =>
              uiManager.libraryRarityFilter === 'all'
                ? true
                : relic.rarity === uiManager.libraryRarityFilter
            )
            .sort((a, b) => a.name.localeCompare(b.name, 'pl'));

  entries.forEach((item) => {
    const card = document.createElement('article');
    if (uiManager.libraryTab === 'cards') {
      const cardDef = /** @type {import('../../data/cards.js').CardDef} */ (item);
      card.className = `library-item card ${uiHelpers.rarityClass(cardDef.rarity)} card-${cardDef.type}`;

      // Use the new Fluid 50/50 Tatra Card Layout
      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">${cardDef.name}</div>
          <div class="card-cost-oscypek">
            <span class="cost-value">${cardDef.cost}</span>
            <span class="cost-icon">🧀</span>
          </div>
        </div>
        <div class="card-subtitle">${uiHelpers.getFullCardType(cardDef.rarity, cardDef.type)}</div>
        <div class="card-art">
          <span class="card-icon">${cardDef.emoji}</span>
        </div>
        <div class="card-text-box">
          <div class="card-desc">${cardRenderer.getCardDescription(uiManager, cardDef)}</div>
        </div>
      `;

      if (cardDef.exhaust) {
        card.classList.add('card-exhaust');
        const exhaustEl = document.createElement('div');
        exhaustEl.className = 'card-exhaust-inline';
        exhaustEl.innerHTML = '<span class="exhaust-fire">🔥</span> PRZEPADO';
        card.querySelector('.card-text-box').appendChild(exhaustEl);
      }
    } else {
      // CRITICAL FIX: Restore the library-item class so relics are visible!
      card.className = `library-item ${uiHelpers.rarityClass(item.rarity)}`;

      const title = document.createElement('h3');
      title.className = 'library-item-title';
      title.textContent = `${item.emoji} ${item.name}`;

      const rarity = document.createElement('p');
      rarity.className = 'library-item-rarity';
      rarity.textContent = uiHelpers.rarityLabel(item.rarity, 'relic');

      const desc = document.createElement('p');
      desc.className = 'library-item-desc';
      desc.textContent = item.desc;

      card.append(title, rarity, desc);
    }
    grid.appendChild(card);
  });
}
