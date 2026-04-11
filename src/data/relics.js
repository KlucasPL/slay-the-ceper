/**
 * @typedef {{ id: string, name: string, emoji: string, desc: string, price: number }} RelicDef
 */

/** @type {Record<string, RelicDef>} */
export const relicLibrary = {
  ciupaga_dlugopis: {
    id: 'ciupaga_dlugopis',
    name: 'Ciupaga-Długopis',
    emoji: '🖊️',
    desc: 'Każda zagrana karta Skill zadaje wrogowi 4 obrażenia.',
    price: 140,
  },
  bilet_tpn: {
    id: 'bilet_tpn',
    name: 'Bilet TPN Ulgowy',
    emoji: '🎫',
    desc: 'Co 3. zagrana karta Ataku w walce daje +1 Oscypka.',
    price: 160,
  },
  wiatr_halny: {
    id: 'wiatr_halny',
    name: 'Wiatr Halny w Butelce',
    emoji: '🌬️',
    desc: 'Na początku tury: 50% – dobierz +2, 50% – odrzuć losową kartę z ręki.',
    price: 130,
  },
  flaszka_sliwowicy: {
    id: 'flaszka_sliwowicy',
    name: 'Pusta Flaszka po Śliwowicy',
    emoji: '🍾',
    desc: 'Na start walki: +5 Siły. Każda tura: koszty kart w ręce losowe (0–3).',
    price: 200,
  },
  krokus: {
    id: 'krokus',
    name: 'Krokus pod Ochroną',
    emoji: '🌸',
    desc: 'Na koniec tury: jeśli masz ≥5 Gardy – ulecz 2 HP.',
    price: 150,
  },
  zepsuty_termometr: {
    id: 'zepsuty_termometr',
    name: 'Zepsuty Termometr',
    emoji: '🌡️',
    desc: 'Słabość i Kruchość na wrogach spada co 2 tury, nie co turę.',
    price: 180,
  },
  pocztowka_giewont: {
    id: 'pocztowka_giewont',
    name: 'Pocztówka z Giewontem',
    emoji: '🖼️',
    desc: 'Pierwsza karta zagrana w każdej walce wywołuje efekt dwa razy.',
    price: 190,
  },
  kierpce_wyprzedazy: {
    id: 'kierpce_wyprzedazy',
    name: 'Kierpce z Wyprzedaży',
    emoji: '👞',
    desc: 'Za każdym razem, gdy tracisz HP w walce, dobierz 1 kartę.',
    price: 140,
  },
  smycz_zakopane: {
    id: 'smycz_zakopane',
    name: 'Smycz „Zakopane 2026"',
    emoji: '📿',
    desc: 'Na koniec tury: kliknij 📿 na karcie, by trafił na wierzch talii.',
    price: 150,
  },
  dzwonek_owcy: {
    id: 'dzwonek_owcy',
    name: 'Dzwonek Owcy – Przeklęty',
    emoji: '🔔',
    desc: 'Wrogowie mają –20% Max HP. Nie możesz się leczyć.',
    price: 220,
  },
  papryczka_marka: {
    id: 'papryczka_marka',
    name: 'Piekielna Papryczka Marka',
    emoji: '🌶️',
    desc: 'Na start walki: +3 Siły. Na początku każdej tury: –2 HP.',
    price: 250,
  },
};
