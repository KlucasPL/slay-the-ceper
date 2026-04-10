/**
 * @typedef {{ id: string, name: string, emoji: string, desc: string, price: number }} RelicDef
 */

/** @type {Record<string, RelicDef>} */
export const relicLibrary = {
  ciupaga_dziadka: {
    id: 'ciupaga_dziadka',
    name: 'Ciupaga Dziadka',
    emoji: '🪓',
    desc: '+1 Siły na start walki.',
    price: 140,
  },
  zloty_oscypek: {
    id: 'zloty_oscypek',
    name: 'Złoty Oscypek',
    emoji: '🧀',
    desc: '+1 Max Energii na stałe.',
    price: 300,
  },
  termos: {
    id: 'termos',
    name: 'Termos',
    emoji: '🧊',
    desc: '+6 Gardy na start walki.',
    price: 150,
  },
  kierpce: {
    id: 'kierpce',
    name: 'Kierpce',
    emoji: '👞',
    desc: '+1 dobierana karta co turę.',
    price: 170,
  },
  klisza: {
    id: 'klisza',
    name: 'Klisza',
    emoji: '📸',
    desc: 'Wróg startuje z Weak: 1.',
    price: 160,
  },
  pas_zbojnicki: {
    id: 'pas_zbojnicki',
    name: 'Pas Zbójnicki',
    emoji: '🧵',
    desc: '+15 Max HP i leczy 15 HP przy podniesieniu.',
    price: 220,
  },
  bat: {
    id: 'bat',
    name: 'Bat',
    emoji: '🪢',
    desc: '+1 stałych obrażeń do każdego ataku.',
    price: 180,
  },
  sol: {
    id: 'sol',
    name: 'Sól',
    emoji: '🧂',
    desc: '+1 Gardy z każdej karty dającej Gardę.',
    price: 155,
  },
  parzenica: {
    id: 'parzenica',
    name: 'Parzenica',
    emoji: '🧶',
    desc: 'Leczy 2 HP za każdą niezużytą energię na koniec tury.',
    price: 190,
  },
  giewont: {
    id: 'giewont',
    name: 'Giewont',
    emoji: '⛰️',
    desc: 'Zmniejsza każde otrzymane obrażenia o 1.',
    price: 210,
  },
  zakopane: {
    id: 'zakopane',
    name: 'KATANA "ZAKOPANE"',
    emoji: '🗡️',
    desc: 'Pierwszy atak w każdej turze zadaje +50% obrażeń.',
    price: 200,
  },
};
