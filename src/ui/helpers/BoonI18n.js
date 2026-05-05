/** @typedef {'pl' | 'en'} LanguageCode */

/**
 * Curated English Maryna boon name translations keyed by the canonical Polish name.
 * @type {Record<string, string>}
 */
const BOON_NAMES_EN = {
  'Mokra Ściera Maryny': "Maryna's Wet Rag",
  'Kiesa na Pierwszy Dzień': 'First Day Purse',
  'Przegląd Plecaka Maryny': "Maryna's Pack Inspection",
  'Słoik Rosołu na Drogę': 'Broth Jar for the Journey',
  'Złoty Różaniec Maryny': "Maryna's Golden Rosary",
  'Lista Zakupów': 'Shopping List',
  'Tajny Składnik Maryny': "Maryna's Secret Ingredient",
};

/**
 * Curated English Maryna boon flavor text translations keyed by the canonical Polish flavor.
 * @type {Record<string, string>}
 */
const BOON_FLAVORS_EN = {
  'Wstawaj. Najpierw zimny okład, potem wielkie czyny.':
    'Get up. First a cold compress, then great deeds.',
  'Masz, ale nie przewal wszystkiego na jarmarku.':
    "You have it, but don't blow it all at the Market.",
  'Ten złom wyrzuć, to ci zostawiam.': "Throw out that junk, this I'm leaving you.",
  'Na trzy pierwsze bitki starczy ci mocy i ciepła.':
    'For the first three fights, you have enough strength and warmth.',
  'Pomódl się i bij dwa razy mocniej!': 'Pray and fight twice as hard!',
  'Kup mądrze, nie jak ceper na Krupówkach.': 'Buy wisely, not like a tourist on Krupówki.',
  'Najpierw ich osłabi, potem ich dobij.': 'First weaken them, then finish them off.',
};

/**
 * Curated English Maryna boon effect description translations keyed by the canonical Polish description.
 * Flavor terms preserved: Oscypki, Dutki, Garda, Krzepa, Lans.
 * @type {Record<string, string>}
 */
const BOON_EFFECT_DESCS_EN = {
  '+7 maks. Krzepy i +7 Krzepy (do nowego limitu).': '+7 max Krzepa and +7 Krzepa (to new limit).',
  '+100 Dutków od razu; +40 Dutków po pierwszym zwycięstwie (jednorazowo).':
    '+100 Dutki immediately; +40 Dutki after first victory (once).',
  'Usuń 1 losową kartę startową z talii; dodaj 1 losową kartę niepowszechną; zyskaj +80 Dutków.':
    'Remove 1 random starter card from deck; add 1 random uncommon card; gain +80 Dutki.',
  'Przez pierwsze 4 walki na starcie: +8 Gardy i +1 Siły.':
    'For the first 4 battles, at start: +8 Garda and +1 Strength.',
  'Na starcie każdej walki: +5 Garda i pierwsze trafienie atakiem zadaje podwójne obrażenia.':
    'At the start of each battle: +5 Garda and first Attack hit deals double damage.',
  '+50 Dutków od razu. Wszystkie sklepy: karty -25%. Jedno darmowe usunięcie karty w wyprawie.':
    '+50 Dutki immediately. All shops: cards –25%. One free card removal per run.',
  'Na starcie każdej walki wróg dostaje 2 Słabości i 2 Kruchości.':
    'At the start of each battle, the enemy gains 2 Weak and 2 Fragile.',
};

/**
 * Localizes a Maryna boon name for the active language.
 * Falls back to the original Polish text if no translation exists.
 * @param {LanguageCode} language
 * @param {string} name
 * @returns {string}
 */
export function localizeBoonName(language, name) {
  if (language !== 'en') return name;
  return BOON_NAMES_EN[name] ?? name;
}

/**
 * Localizes a Maryna boon flavor text for the active language.
 * Falls back to the original Polish text if no translation exists.
 * @param {LanguageCode} language
 * @param {string} flavor
 * @returns {string}
 */
export function localizeBoonFlavor(language, flavor) {
  if (language !== 'en') return flavor;
  return BOON_FLAVORS_EN[flavor] ?? flavor;
}

/**
 * Localizes a Maryna boon effect description for the active language.
 * Falls back to the original Polish text if no translation exists.
 * @param {LanguageCode} language
 * @param {string} effectDesc
 * @returns {string}
 */
export function localizeBoonEffectDesc(language, effectDesc) {
  if (language !== 'en') return effectDesc;
  return BOON_EFFECT_DESCS_EN[effectDesc] ?? effectDesc;
}
