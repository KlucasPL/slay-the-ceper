/**
 * @typedef {{ id: string, name: string, emoji: string, desc: string }} RelicDef
 */

/** @type {Record<string, RelicDef>} */
export const relicLibrary = {
  ciupaga_dziadka: {
    id: 'ciupaga_dziadka',
    name: 'Ciupaga Dziadka',
    emoji: '🪓',
    desc: '+1 Siły na start walki.',
  },
  zloty_oscypek: {
    id: 'zloty_oscypek',
    name: 'Złoty Oscypek',
    emoji: '🧀',
    desc: '+1 Max Energii na stałe.',
  },
  termos: {
    id: 'termos',
    name: 'Termos',
    emoji: '🧊',
    desc: '+6 Gardy na start walki.',
  },
  kierpce: {
    id: 'kierpce',
    name: 'Kierpce',
    emoji: '👞',
    desc: '+1 dobierana karta co turę.',
  },
  klisza: {
    id: 'klisza',
    name: 'Klisza',
    emoji: '📸',
    desc: 'Wróg startuje z Weak: 1.',
  },
  pas_zbojnicki: {
    id: 'pas_zbojnicki',
    name: 'Pas Zbójnicki',
    emoji: '🧵',
    desc: '+15 Max HP i leczy 15 HP przy podniesieniu.',
  },
  bat: {
    id: 'bat',
    name: 'Bat',
    emoji: '🪢',
    desc: '+1 stałych obrażeń do każdego ataku.',
  },
  sol: {
    id: 'sol',
    name: 'Sól',
    emoji: '🧂',
    desc: '+1 Gardy z każdej karty dającej Gardę.',
  },
  parzenica: {
    id: 'parzenica',
    name: 'Parzenica',
    emoji: '🧶',
    desc: 'Leczy 2 HP za każdą niezużytą energię na koniec tury.',
  },
  giewont: {
    id: 'giewont',
    name: 'Giewont',
    emoji: '⛰️',
    desc: 'Zmniejsza każde otrzymane obrażenia o 1.',
  },
};
