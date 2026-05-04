/** @typedef {'pl' | 'en'} LanguageCode */

/** @type {Record<string, string>} */
const WEATHER_NAMES_EN = {
  'Czyste Niebo': 'Clear Sky',
  'Wiatr Halny': 'Halny Wind',
  'Zamarznięty Szlak': 'Frozen Trail',
  'Gęsta Mgła': 'Dense Fog',
};

/** @type {Record<string, string>} */
const WEATHER_DESCS_EN = {
  'Brak dodatkowych efektów pogodowych.': 'No additional weather effects.',
  'Na końcu każdej tury obie strony tracą 3 punkty Gardy.':
    'At end of each turn, both sides lose 3 Block.',
  'Słabość obniża obrażenia o 50% zamiast 25%.': 'Weak reduces damage by 50% instead of 25%.',
  'Pierwszy atak gracza i pierwszy atak wroga w turze mają 25% szans na pudło.':
    "The player's first attack and the enemy's first attack each turn have a 25% chance to miss.",
};

/**
 * Localizes a weather name.
 * @param {LanguageCode} language
 * @param {string} name
 * @returns {string}
 */
export function localizeWeatherName(language, name) {
  if (language !== 'en' || !name) return name;
  return WEATHER_NAMES_EN[name] ?? name;
}

/**
 * Localizes a weather description.
 * @param {LanguageCode} language
 * @param {string} desc
 * @returns {string}
 */
export function localizeWeatherDesc(language, desc) {
  if (language !== 'en' || !desc) return desc;
  return WEATHER_DESCS_EN[desc] ?? desc;
}
