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
// (Removed duplicate export of openCardZoom)
/**
 * Opens full-screen zoom preview for a card or a relic.
 *
 * @param {any} itemView
 * @param {'card' | 'relic'} itemType
 * @returns {void}
 */
export function openCardZoom(itemView, itemType = 'card') {
  const overlay = document.getElementById('card-zoom-overlay');
  const panel = document.getElementById('card-zoom-panel');
  if (!overlay || !panel) return;

  // Clear existing hardcoded DOM to allow dynamic injection of Card or Relic
  panel.innerHTML = '';

  if (itemType === 'card') {
    const cardEl = document.createElement('article');
    cardEl.className = `card card-zoom-card ${itemView.rarityClass} ${itemView.typeClass}`;
    cardEl.innerHTML = `
      <div class="card-header">
        <div class="card-title">${itemView.name}</div>
        <div class="card-cost-oscypek">
          <span class="cost-value">${itemView.cost}</span>
          <span class="cost-icon">🧀</span>
        </div>
      </div>
      <div class="card-subtitle">${itemView.rarityLabel}</div>
      <div class="card-art">
        <span class="card-icon">${itemView.emoji}</span>
      </div>
      <div class="card-text-box">
        <div class="card-desc">${itemView.description}</div>
        ${itemView.exhaust ? '<div class="card-exhaust-inline"><span class="exhaust-fire">🔥</span> PRZEPADO</div>' : ''}
      </div>
    `;
    panel.appendChild(cardEl);
  } else {
    // Render as a giant Relic Plaque
    const relicEl = document.createElement('article');
    relicEl.className = `relic-zoom-card ${itemView.rarityClass}`;
    relicEl.innerHTML = `
      <h3 class="library-item-title">${itemView.emoji} ${itemView.name}</h3>
      <p class="library-item-rarity">${itemView.rarityLabel}</p>
      <p class="library-item-desc">${itemView.description}</p>
    `;
    panel.appendChild(relicEl);
  }

  // Append the closing tip below the zoomed item
  const tip = document.createElement('p');
  tip.className = 'card-zoom-tip';
  tip.textContent = 'Dotknij tła, aby zamknąć';
  panel.appendChild(tip);

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
