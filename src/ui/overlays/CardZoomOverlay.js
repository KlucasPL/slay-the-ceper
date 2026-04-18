/** @type {boolean} */
let isInitialized = false;

/**
 * Initializes static event listeners for the card zoom overlay.
 * Safe to call multiple times.
 *
 * @returns {void}
 */
export function initCardZoomOverlay() {
  if (isInitialized) return;

  const overlay = document.getElementById('card-zoom-overlay');
  const panel = document.getElementById('card-zoom-panel');
  if (!overlay || !panel) return;

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeCardZoom();
    }
  });

  panel.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeCardZoom();
    }
  });

  isInitialized = true;
}

/**
 * Opens full-screen zoom preview for a card.
 *
 * @param {{
 *   name: string,
 *   emoji: string,
 *   rarityLabel: string,
 *   cost: number,
 *   description: string,
 *   rarityClass: string,
 *   typeClass: string,
 *   exhaust?: boolean,
 * }} cardView
 * @returns {void}
 */
export function openCardZoom(cardView) {
  const overlay = document.getElementById('card-zoom-overlay');
  const cardEl = document.getElementById('card-zoom-card');
  const costEl = document.getElementById('card-zoom-cost');
  const titleEl = document.getElementById('card-zoom-title');
  const rarityEl = document.getElementById('card-zoom-rarity');
  const iconEl = document.getElementById('card-zoom-icon');
  const descEl = document.getElementById('card-zoom-desc');
  const exhaustEl = document.getElementById('card-zoom-exhaust');

  if (!overlay || !cardEl || !costEl || !titleEl || !rarityEl || !iconEl || !descEl || !exhaustEl) {
    return;
  }

  cardEl.className = `card card-zoom-card ${cardView.rarityClass} ${cardView.typeClass}`;
  costEl.textContent = String(cardView.cost);
  titleEl.textContent = cardView.name;
  rarityEl.textContent = cardView.rarityLabel;
  iconEl.textContent = cardView.emoji;
  descEl.textContent = cardView.description;

  exhaustEl.classList.toggle('hidden', !cardView.exhaust);

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}

/**
 * Closes card zoom preview if open.
 *
 * @returns {void}
 */
export function closeCardZoom() {
  const overlay = document.getElementById('card-zoom-overlay');
  if (!overlay || overlay.classList.contains('hidden')) return;
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}
