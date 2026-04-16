/**
 * @typedef {'clear' | 'halny' | 'frozen' | 'fog'} WeatherId
 * @typedef {{ id: WeatherId, name: string, emoji: string, desc: string }} WeatherDef
 */

/** @type {Record<WeatherId, WeatherDef>} */
export const weatherLibrary = {
  clear: {
    id: 'clear',
    name: 'Czyste Niebo',
    emoji: '🌤️',
    desc: 'Brak dodatkowych efektów pogodowych.',
  },
  halny: {
    id: 'halny',
    name: 'Wiatr Halny',
    emoji: '🌬️',
    desc: 'Na końcu każdej tury obie strony tracą 2 punkty Gardy.',
  },
  frozen: {
    id: 'frozen',
    name: 'Zamarznięty Szlak',
    emoji: '🧊',
    desc: 'Słabość obniża obrażenia o 50% zamiast 25%.',
  },
  fog: {
    id: 'fog',
    name: 'Gęsta Mgła',
    emoji: '🌫️',
    desc: 'Pierwszy atak gracza i pierwszy atak wroga w turze mają 25% szans na pudło.',
  },
};
