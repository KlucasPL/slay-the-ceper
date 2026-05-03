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
  furia_turysty: {
    icon: '😡',
    label: 'Furia Turysty',
    tooltip: 'Zadajesz 50% więcej obrażeń. Spada o 1 co turę.',
  },
  okradziony: {
    icon: '🔴',
    label: 'Okradziony',
    tooltip: 'Złodziejska Kaczka ukradła Ci kartę. Odzyskasz ją po walce.',
  },
  lans: {
    icon: '🕶️',
    label: 'Lans',
    tooltip:
      'LANS: Gdy aktywny, obrażenia trafiają najpierw w Dutki zamiast Krzepy. Karty z tagiem Lans: bez aktywnego Lansu tylko włączają Lans (pomijają efekt główny), z aktywnym Lansem działają normalnie.',
    showNumericValue: false,
  },
  stunned: {
    icon: '😵',
    label: 'Ogłuszony',
    tooltip: 'Nie możesz zagrywać kart ataku w tej turze po rozbiciu lansu.',
    showNumericValue: false,
  },
  brak_reszty: {
    icon: '💰',
    label: 'Brak Reszty',
    tooltip: 'Busiarz kradnie 3 Dutki za każde uderzenie zadające obrażenia HP.',
    showNumericValue: false,
  },
  targowanie_sie: {
    icon: '🤝',
    label: 'Targowanie Się',
    tooltip: 'Handlara oscypkami ignoruje rachunek — nie można jej zbankrutować!',
    showNumericValue: false,
  },
  parcie_na_szklo: {
    icon: '📸',
    label: 'Parcie na Szkło',
    tooltip: 'Gdy masz aktywnego Lansa, Influencerka zyskuje +2 Siły.',
    showNumericValue: false,
  },
  blokada_parkingowa: {
    icon: '🚧',
    label: 'Blokada Parkingowa',
    tooltip: 'Nie możesz zagrać więcej niż 2 karty w jednej turze.',
    showNumericValue: false,
  },
  lichwa: {
    icon: '💼',
    label: 'Lichwa',
    tooltip: 'Spekulant kradnie 2 Dutki za każde uderzenie zadające obrażenia HP.',
    showNumericValue: false,
  },
  hart_ducha: {
    icon: '💪',
    label: 'Hart Ducha',
    tooltip: 'Mistrz Redyku zyskuje +2 Siły i +6 Gardy, gdy spadnie do 40% HP (tylko raz).',
    showNumericValue: false,
  },
  influencer_aura: {
    icon: '📢',
    label: 'Aura Influencera',
    tooltip: 'Gdy zagrasz 3+ kart w jednej turze, Ceprzyca VIP zyskuje +3 Gardy.',
    showNumericValue: false,
  },
  ochrona_wizerunku: {
    icon: '🛡️',
    label: 'Ochrona Wizerunku',
    tooltip:
      'Za każdy cios w Fiakiera otrzymujesz 1 obrażenie (trafia najpierw w Gardę, potem HP).',
    showNumericValue: false,
  },
  drugi_oddech: {
    icon: '🏃',
    label: 'Drugi Oddech',
    tooltip: 'Spocony Półmaratończyk zyskuje +2 Siły, gdy spadnie do 60% HP (tylko raz).',
    showNumericValue: false,
  },
  wiecznie_glodny: {
    icon: '🐿️',
    label: 'Wiecznie Głodny',
    tooltip: 'Głodny Świstak leczy 4 HP na początku tury, jeśli nie ma pełnej Krzepy.',
    showNumericValue: false,
  },
  kontrola_stempla: {
    icon: '🎫',
    label: 'Kontrola Stempla',
    tooltip: 'Bileter z TPN zyskuje +1 Siły za każdą kartę statusu w Twojej ręce.',
    showNumericValue: false,
  },
  gaz_do_dechy: {
    icon: '💨',
    label: 'Gaz do Dechy',
    tooltip: 'Meleksiarz zyskuje +5 obrażeń za każdą turę bez obrażeń HP (reset przy uderzeniu).',
  },
  napor_wody: {
    icon: '🌊',
    label: 'Napór Wody',
    tooltip: 'Bober gromadzi napór (+1 za każdą turę bez obrażeń HP, reset przy uderzeniu).',
  },
  kolejka_do_toalety: {
    icon: '🚾',
    label: 'Kolejka do Toalety',
    tooltip:
      'Na końcu tury wroga licznik kolejki rośnie o liczbę kart statusu w Twojej ręce. Przy ruchu "Gorąca zupa" Królowa dodaje 2 + licznik kart statusu i zużywa licznik.',
  },
  zmiana_pogody: {
    icon: '🌤',
    label: 'Zmiana Pogody',
    tooltip: 'Harnaś Pogodynka zmienia pogodę co 3 tury: halny → mróz → mgła → halny...',
    showNumericValue: false,
  },
};
