/**
 * @typedef {'common' | 'uncommon' | 'rare'} RarityDef
 * @typedef {{ id: string, name: string, rarity: RarityDef, emoji: string, desc: string, price: number }} RelicDef
 */

/** @type {Record<string, RelicDef>} */
export const relicLibrary = {
  ciupaga_dlugopis: {
    id: 'ciupaga_dlugopis',
    name: 'Ciupaga-Długopis',
    rarity: 'common',
    emoji: '🖊️',
    desc: 'Każda zagrana karta Skill zadaje wrogowi 4 obrażenia.',
    price: 95,
  },
  bilet_tpn: {
    id: 'bilet_tpn',
    name: 'Bilet TPN Ulgowy',
    rarity: 'common',
    emoji: '🎫',
    desc: 'Co 3. zagrana karta Ataku w walce daje +1 Oscypka.',
    price: 115,
  },
  wiatr_halny: {
    id: 'wiatr_halny',
    name: 'Wiatr Halny w Butelce',
    rarity: 'uncommon',
    emoji: '🌬️',
    desc: 'Na początku każdej tury: dobierz +1 kartę.',
    price: 175,
  },
  flaszka_sliwowicy: {
    id: 'flaszka_sliwowicy',
    name: 'Pusta Flaszka po Śliwowicy',
    rarity: 'rare',
    emoji: '🍾',
    desc: 'Na start walki: +4 Siły. Każda tura: koszty kart w ręce losowe (0–3).',
    price: 320,
  },
  krokus: {
    id: 'krokus',
    name: 'Krokus pod Ochroną',
    rarity: 'uncommon',
    emoji: '🌸',
    desc: 'Na koniec tury: jeśli masz >10 Gardy – ulecz 2 HP.',
    price: 155,
  },
  zepsuty_termometr: {
    id: 'zepsuty_termometr',
    name: 'Zepsuty Termometr',
    rarity: 'uncommon',
    emoji: '🌡️',
    desc: 'Słabość i Kruchość na wrogach spada co 2 tury, nie co turę.',
    price: 185,
  },
  pocztowka_giewont: {
    id: 'pocztowka_giewont',
    name: 'Pocztówka z Giewontem',
    rarity: 'rare',
    emoji: '🖼️',
    desc: 'Pierwsza karta zagrana w każdej walce wywołuje efekt dwa razy.',
    price: 260,
  },
  kierpce_wyprzedazy: {
    id: 'kierpce_wyprzedazy',
    name: 'Kierpce z Wyprzedaży',
    rarity: 'common',
    emoji: '👞',
    desc: 'Za każdym razem, gdy tracisz HP w walce, dobierz 1 kartę.',
    price: 120,
  },
  smycz_zakopane: {
    id: 'smycz_zakopane',
    name: 'Smycz „Zakopane 2026"',
    rarity: 'uncommon',
    emoji: '📿',
    desc: 'Na koniec tury: kliknij 📿 na karcie, by trafił na wierzch talii.',
    price: 165,
  },
  dzwonek_owcy: {
    id: 'dzwonek_owcy',
    name: 'Dzwonek Owcy – Przeklęty',
    rarity: 'rare',
    emoji: '🔔',
    desc: 'Wrogowie mają –20% Max HP. Nie możesz się leczyć.',
    price: 280,
  },
  papryczka_marka: {
    id: 'papryczka_marka',
    name: 'Piekielna Papryczka Marka',
    rarity: 'rare',
    emoji: '🌶️',
    desc: 'Na start walki: +3 Siły. Na początku każdej tury: –2 HP.',
    price: 350,
  },
  papucie_po_babci: {
    id: 'papucie_po_babci',
    name: 'Papucie po Babci',
    rarity: 'common',
    emoji: '🥿',
    desc: 'Na koniec tury: jeśli masz aktywny Lans, ulecz 2 HP.',
    price: 90,
  },
  magnes_na_lodowke: {
    id: 'magnes_na_lodowke',
    name: 'Magnes na Lodówkę',
    rarity: 'common',
    emoji: '🧲',
    desc: 'Zwycięstwo przez Bankructwo daje +50% więcej dutków.',
    price: 100,
  },
  pekniete_liczydlo: {
    id: 'pekniete_liczydlo',
    name: 'Pęknięte Liczydło',
    rarity: 'uncommon',
    emoji: '🧮',
    desc: 'Leczy 2 HP przy każdym nałożeniu Rachunku.',
    price: 175,
  },
  blacha_przewodnika: {
    id: 'blacha_przewodnika',
    name: 'Blacha Przewodnika',
    rarity: 'uncommon',
    emoji: '🏅',
    desc: 'Rozpoczynasz każdą walkę z aktywnym Lansem.',
    price: 160,
  },
  lustrzane_gogle: {
    id: 'lustrzane_gogle',
    name: 'Lustrzane Gogle',
    rarity: 'rare',
    emoji: '🥽',
    desc: 'Dopóki masz aktywny Lans, każda karta Gardy daje +2 pkt pancerza więcej.',
    price: 300,
  },
  zlota_karta_zakopianczyka: {
    id: 'zlota_karta_zakopianczyka',
    name: 'Złota Karta Zakopiańczyka',
    rarity: 'rare',
    emoji: '💳',
    desc: 'Usuwanie kart w sklepie kosztuje zawsze 25 dutków. Wszystkie karty w sklepie są o 15% tańsze.',
    price: 310,
  },
  szczegliwa_podkowa: {
    id: 'szczegliwa_podkowa',
    name: 'Szczęśliwa Podkowa',
    rarity: 'common',
    emoji: '🍀',
    desc: 'Wygranie walki mając ≤40% Krzepy daje bonus +25 dutków.',
    price: 105,
  },
  goralski_zegarek: {
    id: 'goralski_zegarek',
    name: 'Góralski Zegarek',
    rarity: 'uncommon',
    emoji: '⌚',
    desc: 'W każdej parzystej turze walki (2, 4, 6...) pierwsza zagrana karta Skill kosztuje 0 Oscypków.',
    price: 170,
  },
  termos_z_herbatka: {
    id: 'termos_z_herbatka',
    name: 'Termos z Herbatką',
    rarity: 'uncommon',
    emoji: '🫖',
    desc: 'Koniec walki w 2 turach lub mniej: ulecz +4 HP. W przeciwnym razie: +15 dutków.',
    price: 165,
  },
  mapa_zakopanego: {
    id: 'mapa_zakopanego',
    name: 'Mapa Zakopanego',
    rarity: 'uncommon',
    emoji: '🗺️',
    desc: "Widzisz, co kryje się pod '?' na mapie.",
    price: 195,
  },
  pas_bacowski: {
    id: 'pas_bacowski',
    name: 'Pas Bacowski',
    rarity: 'common',
    emoji: '🥋',
    desc: 'Po podniesieniu: +6 do maksymalnej Krzepy.',
    price: 120,
  },
  certyfikowany_oscypek: {
    id: 'certyfikowany_oscypek',
    name: 'Certyfikowany Oscypek',
    rarity: 'uncommon',
    emoji: '🧀',
    desc: 'Za wejście do sklepu: +2 do maksymalnej Krzepy (maks. 3 razy na run).',
    price: 190,
  },
};

/**
 * Adds or updates a relic in the runtime relic library.
 * @param {RelicDef} relic
 * @returns {RelicDef}
 */
export function addRelicToLibrary(relic) {
  relicLibrary[relic.id] = relic;
  return relicLibrary[relic.id];
}
