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
    card.className = `library-item ${uiHelpers.rarityClass(item.rarity)}`;

    if (uiManager.libraryTab === 'cards') {
      const cardDef = /** @type {import('../../data/cards.js').CardDef} */ (item);
      card.className = `library-item card ${uiHelpers.rarityClass(cardDef.rarity)} card-${cardDef.type}`;

      const cost = document.createElement('div');
      cost.className = 'card-cost';
      cost.textContent = String(cardDef.cost);

      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = cardDef.name;

      const rarity = document.createElement('div');
      rarity.className = 'card-rarity';
      rarity.textContent = uiHelpers.getFullCardType(cardDef.rarity, cardDef.type);

      const emoji = document.createElement('div');
      emoji.className = 'card-img';
      const iconEl = document.createElement('span');
      iconEl.className = 'card-icon';
      iconEl.textContent = cardDef.emoji;
      emoji.appendChild(iconEl);

      const desc = document.createElement('div');
      desc.className = 'card-desc';
      desc.textContent = cardRenderer.getCardDescription(uiManager, cardDef);

      card.append(cost, title, rarity, emoji, desc);

      if (cardDef.exhaust) {
        card.classList.add('card-exhaust');
        card.appendChild(cardRenderer.createExhaustBadge());
      }
    } else {
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
