/**
 * @typedef {{ version: string, date: string, changes: string[] }} ReleaseNoteEntry
 */

/** @type {ReleaseNoteEntry[]} */
export const releaseNotesData = [
  {
    version: 'v1.0.0 - Wielkie Otwarcie Krupówek',
    date: 'Kwiecień 2026',
    changes: [
      '🏔️ GRA KARCIANA ROGUELIKE: Budujesz talię, zarządzasz Oscypkami i planujesz tury na mapie z wydarzeniami.',
      "⚔️ DWIE ŚCIEŻKI ZWYCIĘSTWA: Możesz wygrać klasycznie przez obrażenia albo przez mechanikę 'Rachunku' i bankructwo przeciwnika.",
      '✨ LANS I STATUSY: Lans daje mocne synergie kart i reliktów, a walka opiera się o statusy (m.in. weak, fragile, vulnerable, next_double).',
      '🎒 SYSTEM PAMIĄTEK: Rozwijasz build przez relikty różnej rzadkości, które zmieniają ekonomię, obronę i tempo walki.',
      '🗺️ PERĆ I WYDARZENIA: Mapa prowadzi przez bitki, sklep, campfire, skarby i finalne starcie bossa.',
      '👺 GALERIA PRZECIWNIKÓW: Wrogowie mają unikalne pasywki i wzorce ruchów, które zmuszają do zmiany taktyki między walkami.',
      '👹 FINAŁ WYPRAWY: Na końcu perci czeka losowy boss i wymagające starcie domykające run.',
    ],
  },
];
