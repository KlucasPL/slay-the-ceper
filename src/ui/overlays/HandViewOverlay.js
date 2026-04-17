/** @type {boolean} */
let isInitialized = false;

/**
 * Initializes static event listeners for the hand view overlay.
 * Safe to call multiple times.
 *
 * @returns {void}
 */
export function initHandViewOverlay() {
  if (isInitialized) return;

  const overlay = document.getElementById('hand-view-overlay');
  const panel = document.getElementById('hand-view-panel');
  if (!overlay || !panel) return;

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeHandView();
    }
  });

  panel.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeHandView();
    }
  });

  isInitialized = true;
}

/**
 * Opens full-screen hand view overlay showing all cards in a grid.
 *
 * @param {Array<{
 *   cardId: string,
 *   name: string,
 *   emoji: string,
 *   rarityLabel: string,
 *   cost: number,
 *   description: string,
 *   rarityClass: string,
 *   typeClass: string,
 *   exhaust?: boolean,
 *   handIndex: number,
 * }>} cardViews
 * @param {(index: number) => void} [onCardClick]
 * @returns {void}
 */
export function openHandView(cardViews, onCardClick = null) {
  const overlay = document.getElementById('hand-view-overlay');
  const gridContainer = document.getElementById('hand-view-grid');

  if (!overlay || !gridContainer) return;

  // Clear existing cards
  gridContainer.innerHTML = '';

  // Create card elements for the grid
  cardViews.forEach((cardView) => {
    const cardEl = document.createElement('article');
    cardEl.className = `card hand-view-card ${cardView.rarityClass} ${cardView.typeClass}`;

    const costEl = document.createElement('div');
    costEl.className = 'card-cost';
    costEl.textContent = String(cardView.cost);

    const titleEl = document.createElement('div');
    titleEl.className = 'card-title';
    titleEl.textContent = cardView.name;

    const rarityEl = document.createElement('div');
    rarityEl.className = 'card-rarity';
    rarityEl.textContent = cardView.rarityLabel;

    const imgEl = document.createElement('div');
    imgEl.className = 'card-img';

    const iconEl = document.createElement('span');
    iconEl.className = 'card-icon';
    iconEl.textContent = cardView.emoji;
    imgEl.appendChild(iconEl);

    const descEl = document.createElement('div');
    descEl.className = 'card-desc';
    descEl.textContent = cardView.description;

    const exhaustEl = document.createElement('div');
    exhaustEl.className = 'card-exhaust-badge hidden';
    exhaustEl.innerHTML = '<span class="card-exhaust-fire">🔥</span> <b>PRZEPADO</b>';
    exhaustEl.classList.toggle('hidden', !cardView.exhaust);

    cardEl.appendChild(costEl);
    cardEl.appendChild(titleEl);
    cardEl.appendChild(rarityEl);
    cardEl.appendChild(imgEl);
    cardEl.appendChild(descEl);
    cardEl.appendChild(exhaustEl);

    // Attach click handler if callback is provided
    if (onCardClick) {
      cardEl.style.cursor = 'pointer';
      cardEl.addEventListener('click', () => {
        closeHandView();
        onCardClick(cardView.handIndex);
      });
    }

    gridContainer.appendChild(cardEl);
  });

  // Display overlay
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}

/**
 * Closes the hand view overlay.
 *
 * @returns {void}
 */
export function closeHandView() {
  const overlay = document.getElementById('hand-view-overlay');
  if (!overlay || overlay.classList.contains('hidden')) return;

  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

/**
 * Checks if the hand view overlay is currently open.
 *
 * @returns {boolean}
 */
export function isHandViewOpen() {
  const overlay = document.getElementById('hand-view-overlay');
  return overlay ? !overlay.classList.contains('hidden') : false;
}
