/**
 * @typedef {{ version: string, date: string, changes: string[] }} ReleaseNoteEntry
 */

/** @type {ReleaseNoteEntry[]} */
export const releaseNotesData = [
  {
    version: 'v1.0.1 - Balans Krupówek',
    date: 'Kwiecień 2026',
    changes: [
      '⚖️ BALANS WROGÓW: Gaździna Maryna została osłabiona (Krzepa 95 → 88, Garda 15 → 12, słabość 2 → 1, pasywne leczenie 5 → 3).',
      '❓ WYDARZENIA LOSOWE: Na mapie mogą trafić się specjalne wydarzenia z wyborami, kosztami i unikalnymi efektami dla przebiegu runa.',
    ],
  },
  {
    version: 'v1.0.0 - Wielkie Otwarcie Krupówek',
    date: 'Kwiecień 2026',
    changes: [
      '🏔️ GRA KARCIANA ROGUELIKE: Budujesz talię, zarządzasz Oscypkami i planujesz tury na mapie z wydarzeniami.',
      "⚔️ DWIE ŚCIEŻKI ZWYCIĘSTWA: Możesz wygrać klasycznie przez obrażenia albo przez mechanikę 'Rachunku' i bankructwo przeciwnika.",
      '✨ LANS I STATUSY: Lans daje mocne synergie kart i reliktów, a walka opiera się o statusy (m.in. weak, fragile, vulnerable, next_double).',
      '🎒 SYSTEM PAMIĄTEK: Rozwijasz build przez relikty różnej rzadkości, które zmieniają ekonomię, obronę i tempo walki.',
      '🗺️ PERĆ I WYDARZENIA: Mapa prowadzi przez bitki, sklep, campfire, skarby i finalne starcie bossa.',
      '⚖️ BALANS WROGÓW: Gaździna Maryna została osłabiona (niższa Krzepa, słabsza Garda, mniej Weak i mniejsze leczenie pasywne).',
      '👺 GALERIA PRZECIWNIKÓW: Wrogowie mają unikalne pasywki i wzorce ruchów, które zmuszają do zmiany taktyki między walkami.',
      '👹 FINAŁ WYPRAWY: Na końcu perci czeka losowy boss i wymagające starcie domykające run.',
    ],
  },
];
