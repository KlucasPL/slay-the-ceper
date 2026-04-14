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
 * Scales the game wrapper to fit the viewport height on small screens.
 */
export function scaleGame() {
  const wrapper = document.getElementById('game-wrapper');
  if (!wrapper) return;
  wrapper.style.zoom = '';
  const scale = Math.min(1, window.innerHeight / wrapper.offsetHeight);
  if (scale < 1) wrapper.style.zoom = scale;
}

/**
 * @param {{ isInputLocked: boolean }} state
 * @returns {boolean}
 */
export function isInputLocked(state) {
  return Boolean(state.isInputLocked);
}
