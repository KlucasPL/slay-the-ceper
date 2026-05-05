/** @typedef {'pl' | 'en'} LanguageCode */

/** @type {Record<string, string>} */
const STATUS_LABELS_EN = {
  strength: 'Strength',
  weak: 'Weak',
  fragile: 'Fragile',
  vulnerable: 'Vulnerable',
  next_double: 'Double Strike',
  energy_next_turn: 'Bonus Oscypek',
  duma_podhala: 'Duma Podhala',
  furia_turysty: 'Tourist Fury',
  okradziony: 'Robbed',
  lans: 'Lans',
  stunned: 'Stunned',
  brak_reszty: 'No Change',
  targowanie_sie: 'Haggling',
  parcie_na_szklo: 'Fame Hungry',
  blokada_parkingowa: 'Parking Block',
  lichwa: 'Usury',
  hart_ducha: 'Iron Will',
  influencer_aura: 'Influencer Aura',
  ochrona_wizerunku: 'Image Protection',
  drugi_oddech: 'Second Wind',
  wiecznie_glodny: 'Always Hungry',
  kontrola_stempla: 'Stamp Control',
  gaz_do_dechy: 'Floor It',
  napor_wody: 'Water Pressure',
  kolejka_do_toalety: 'Restroom Queue',
  zmiana_pogody: 'Weather Shift',
};

/** @type {Record<string, string>} */
const STATUS_TOOLTIPS_EN = {
  strength: 'Each point of Strength adds +1 to attack damage.',
  weak: 'Reduces outgoing damage by 25%. Decreases by 1 each turn.',
  fragile: 'Reduces Block gained by 25%. Decreases by 1 each turn.',
  vulnerable: 'You take 50% more damage. Decreases by 1 each turn.',
  next_double: 'The next hit deals double damage, then this effect expires.',
  energy_next_turn: 'At the start of your next turn, you gain an extra Oscypek.',
  duma_podhala: 'DUMA PODHALA: For every 10 Block lost from an attack, the enemy takes 5 damage.',
  furia_turysty: 'Deal 50% more damage. Decreases by 1 each turn.',
  okradziony: 'The Thieving Duck stole a card from you. You will recover it after combat.',
  lans: 'LANS: While active, damage hits Dutki before Krzepa. Cards tagged Lans: without active Lans they only activate Lans (skip main effect); with active Lans they work normally.',
  stunned: 'You cannot play attack cards this turn after the Lans was broken.',
  brak_reszty: 'The Busker steals 3 Dutki for each hit that deals HP damage.',
  targowanie_sie: 'The Oscypek Merchant ignores the bill — she cannot be bankrupted!',
  parcie_na_szklo: 'When you have active Lans, the Influencer gains +2 Strength.',
  blokada_parkingowa: 'You cannot play more than 2 cards in a single turn.',
  lichwa: 'The Speculator steals 2 Dutki for each hit that deals HP damage.',
  hart_ducha: 'Mistrz Redyku gains +2 Strength and +6 Block when he falls to 40% HP (once only).',
  influencer_aura: 'When you play 3+ cards in a turn, Ceprzyca VIP gains +3 Block.',
  ochrona_wizerunku: 'Each hit on the Coachman deals 1 damage to you (hits Block first, then HP).',
  drugi_oddech: 'Sweaty Half-Marathon Runner gains +2 Strength when falling to 60% HP (once only).',
  wiecznie_glodny: 'Hungry Marmot heals 4 HP at turn start if not at full Krzepa.',
  kontrola_stempla: 'TPN Ticket Inspector gains +1 Strength for each status card in your hand.',
  gaz_do_dechy: 'Golf Cart gains +5 damage for each turn without HP damage (resets on hit).',
  napor_wody: 'Beaver builds pressure (+1 per turn without HP damage, resets on hit).',
  kolejka_do_toalety:
    "At end of enemy's turn, the queue counter rises by the number of status cards in your hand. On the 'Hot Soup' move the Queen adds 2 + queue counter and resets the counter.",
  zmiana_pogody: 'Harnaś Pogodynka changes weather every 3 turns: halny → frost → fog → halny…',
};

/**
 * Returns the localized label for a status effect.
 * @param {LanguageCode} language
 * @param {string} key - status key (e.g. 'strength', 'weak')
 * @param {string} fallback - original Polish label
 * @returns {string}
 */
export function localizeStatusLabel(language, key, fallback) {
  if (language !== 'en') return fallback;
  return STATUS_LABELS_EN[key] ?? fallback;
}

/**
 * Returns the localized tooltip for a status effect.
 * @param {LanguageCode} language
 * @param {string} key - status key
 * @param {string} fallback - original Polish tooltip
 * @returns {string}
 */
export function localizeStatusTooltip(language, key, fallback) {
  if (language !== 'en') return fallback;
  return STATUS_TOOLTIPS_EN[key] ?? fallback;
}
