/**
 * @typedef {{ id: string, name: string, cost: number, type: 'attack'|'skill', val: number, emoji: string, desc: string }} CardDef
 */

/** @type {Record<string, CardDef>} */
export const cardLibrary = {
  ciupaga: { id: 'ciupaga', name: 'Cios Ciupagą',   cost: 1, type: 'attack', val: 6,  emoji: '🪓',  desc: 'Zadaje 6 obrażeń.' },
  gasior:  { id: 'gasior',  name: 'Łyk z Gąsiora',  cost: 1, type: 'skill',  val: 5,  emoji: '🏺',  desc: 'Zyskujesz 5 Gardy.' },
  kierpce: { id: 'kierpce', name: 'Rzut Kierpcem',   cost: 2, type: 'attack', val: 12, emoji: '👞',  desc: 'Zadaje 12 obrażeń. Śmierdzi.' },
  hej:     { id: 'hej',     name: 'Góralskie Hej!',  cost: 0, type: 'skill',  val: 0,  emoji: '🗣️', desc: 'Dobierz 2 karty. Hej!' },
};

/** @type {string[]} */
export const startingDeck = [
  'ciupaga', 'ciupaga', 'ciupaga', 'ciupaga',
  'gasior',  'gasior',  'gasior',  'gasior',
  'kierpce', 'hej',
];
