/**
 * @param {string} overlayId
 */
export function hideOverlay(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

/**
 * @param {string | undefined} outcome
 * @returns {string}
 */
export function revealedEventEmoji(outcome) {
  if (outcome === 'fight') return '⚔️';
  if (outcome === 'shop') return '🛖';
  return '❓';
}

/**
 * @param {'common' | 'uncommon' | 'rare' | undefined} rarity
 * @returns {string}
 */
export function rarityClass(rarity) {
  return `rarity-${rarity ?? 'common'}`;
}

/**
 * @param {'common' | 'uncommon' | 'rare' | undefined} rarity
 * @param {'card' | 'relic'} type
 * @returns {string}
 */
export function rarityLabel(rarity, type) {
  const labels = {
    common: type === 'card' ? 'Powszechna karta' : 'Powszechna pamiątka',
    uncommon: type === 'card' ? 'Niepowszechna karta' : 'Niepowszechna pamiątka',
    rare: type === 'card' ? 'Rzadka karta' : 'Rzadka pamiątka',
  };
  return labels[rarity ?? 'common'];
}

/**
 * @param {'common' | 'uncommon' | 'rare' | undefined} rarity
 * @param {'attack' | 'skill' | 'status' | 'power'} type
 * @returns {string}
 */
export function getFullCardType(rarity, type) {
  const typeLabelMap = {
    attack: { label: 'Atak', gender: 'm' },
    status: { label: 'Stan', gender: 'm' },
    skill: { label: 'Umiejętność', gender: 'f' },
    power: { label: 'Moc', gender: 'f' },
  };

  const selectedType = typeLabelMap[type] ?? typeLabelMap.attack;
  const rarityByGender = {
    common: selectedType.gender === 'f' ? 'Powszechna' : 'Powszechny',
    uncommon: selectedType.gender === 'f' ? 'Niepowszechna' : 'Niepowszechny',
    rare: selectedType.gender === 'f' ? 'Rzadka' : 'Rzadki',
  };

  return `${rarityByGender[rarity ?? 'common']} ${selectedType.label}`;
}

/**
 * @param {{ isInputLocked: boolean }} state
 * @returns {boolean}
 */
export function isInputLocked(state) {
  return Boolean(state.isInputLocked);
}

/**
 * Attaches a robust long-press listener to an element to trigger zoom overlays.
 * Prevents the default mobile browser context menu.
 * @param {HTMLElement} element
 * @param {() => void} onLongPress
 */
export function attachLongPressZoom(element, onLongPress) {
  let pressTimer;
  let isDragging = false;

  const start = (e) => {
    if (e.type === 'touchstart' && e.touches.length > 1) return;
    if (e.button !== 0 && e.type === 'mousedown') return;
    isDragging = false;
    pressTimer = setTimeout(() => {
      if (!isDragging) onLongPress();
    }, 450);
  };

  const cancel = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };

  const move = () => {
    isDragging = true;
    cancel();
  };

  element.addEventListener('mousedown', start);
  element.addEventListener('touchstart', start, { passive: true });
  element.addEventListener('mouseup', cancel);
  element.addEventListener('mouseleave', cancel);
  element.addEventListener('touchend', cancel);
  element.addEventListener('touchcancel', cancel);
  element.addEventListener('touchmove', move, { passive: true });
  element.addEventListener('mousemove', move);

  element.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    cancel();
  });
}
