/** @typedef {{ icon: string, label: string, tooltip: string, showNumericValue?: boolean }} StatusTooltipDef */

/** @type {Record<string, StatusTooltipDef>} */
export const statusTooltipRegistry = {
  strength: {
    icon: '💢',
    label: 'Siła',
    tooltip: 'Każdy punkt Siły dodaje +1 do obrażeń ataków.',
  },
  weak: {
    icon: '🤢',
    label: 'Słabość',
    tooltip: 'Zmniejsza zadawane obrażenia o 25% i spada o 1 co turę.',
  },
  fragile: {
    icon: '🫧',
    label: 'Kruchość',
    tooltip: 'Zmniejsza zyskiwaną Gardę o 25%. Spada o 1 co turę.',
  },
  vulnerable: {
    icon: '💥',
    label: 'Podatność',
    tooltip: 'Otrzymujesz 50% więcej obrażeń. Spada o 1 co turę.',
  },
  next_double: {
    icon: '✨',
    label: 'Podwójny cios',
    tooltip: 'Następny cios zada podwójne obrażenia, a potem efekt zniknie.',
    showNumericValue: false,
  },
  energy_next_turn: {
    icon: '⚡',
    label: 'Bonus Oscypek',
    tooltip: 'Na początku następnej tury dostaniesz dodatkowy Oscypek.',
  },
  duma_podhala: {
    icon: '🏔️',
    label: 'Duma Podhala',
    tooltip: 'DUMA PODHALA: Za każde 10 Gardy straconej od ataku, wróg otrzymuje 5 obrażeń.',
    showNumericValue: false,
  },
  lans: {
    icon: '🕶️',
    label: 'Lans',
    tooltip: 'LANS: Otrzymujesz obrażenia w Dutkach zamiast HP. Szpan kosztuje!',
    showNumericValue: false,
  },
  stunned: {
    icon: '😵',
    label: 'Ogłuszony',
    tooltip: 'Nie możesz zagrywać kart ataku w tej turze po rozbiciu lansu.',
    showNumericValue: false,
  },
};
