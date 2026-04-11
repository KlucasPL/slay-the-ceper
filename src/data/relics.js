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
    rarity: 'uncommon',
    emoji: '🎫',
    desc: 'Co 3. zagrana karta Ataku w walce daje +1 Oscypka.',
    price: 170,
  },
  wiatr_halny: {
    id: 'wiatr_halny',
    name: 'Wiatr Halny w Butelce',
    rarity: 'common',
    emoji: '🌬️',
    desc: 'Na początku tury: 50% – dobierz +2, 50% – odrzuć losową kartę z ręki.',
    price: 110,
  },
  flaszka_sliwowicy: {
    id: 'flaszka_sliwowicy',
    name: 'Pusta Flaszka po Śliwowicy',
    rarity: 'rare',
    emoji: '🍾',
    desc: 'Na start walki: +5 Siły. Każda tura: koszty kart w ręce losowe (0–3).',
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
    rarity: 'uncommon',
    emoji: '🖼️',
    desc: 'Pierwsza karta zagrana w każdej walce wywołuje efekt dwa razy.',
    price: 195,
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
