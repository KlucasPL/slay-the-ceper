/**
 * @typedef {{ version: string, date: string, changes: string[] }} ReleaseNoteEntry
 */

/** @type {ReleaseNoteEntry[]} */
export const releaseNotesData = [
  {
    version: 'v1.2.0 - Struktura Runa i Prawdziwe Elity',
    date: 'Kwiecień 2026',
    changes: [
      '🗺️ STRUKTURA RUNA: Wyprawa ma teraz 15 poziomów, gwarantowaną Watrę w połowie trasy oraz końcową Watrę przed bossem, co stabilizuje tempo przygotowania do finału.',
      '🎁 SKARB I ŚCIEŻKI: Każdy run zawiera dokładnie jeden gwarantowany węzeł skarbu we wczesnym-midgame, a połączenia na mapie są czytelniejsze i nie przecinają się lokalnie.',
      '👹 PRAWDZIWE ELITY: Węzły elitarne korzystają z osobnej puli przeciwników, pojawiają się najwcześniej od y=4 i dają dedykowaną nagrodę 1 z 3 pamiątek (z fallbackiem do kart rare).',
    ],
  },
  {
    version: 'v1.1.3 - Nowa muzyka i poprawki',
    date: 'Kwiecień 2026',
    changes: [
      '🎵 NOWA MUZYKA: Dodano nowe utwory dla Jarmarku i Watry oraz poprawiono przełączanie muzyki między najważniejszymi scenami gry.',
      '⚔️ WALKA: Główny motyw gry gra teraz stabilniej podczas bitwy i nie restartuje się przy zwykłych akcjach.',
      '📝 NAZEWNICTWO: Uporządkowano część nazw i opisów widocznych w trakcie rozgrywki, żeby były bardziej spójne.',
    ],
  },
  {
    version: 'v1.1.2 - Nowe ekrany i muzyka',
    date: 'Kwiecień 2026',
    changes: [
      '🆕 NOWE EKRANY: Dodano ekran opcji oraz podsumowanie runa, dzięki czemu łatwiej śledzić postępy i wrócić do kolejnej wyprawy.',
      '🎵 MUZYKA: Gra dostała nowe utwory i bardziej filmowe przejścia między najważniejszymi momentami rozgrywki.',
      '⚙️ WYGODA: Opcje są teraz dostępne także podczas gry, bez potrzeby wracania do menu głównego.',
    ],
  },
  {
    version: 'v1.1.1 - Re-tiering Pamiątek',
    date: 'Kwiecień 2026',
    changes: [
      '🎒 PAMIĄTKI: Uporządkowano rzadkości części pamiątek, żeby nagrody i wybory w sklepie były bardziej intuicyjne.',
      '⚖️ BALANS: Rozkład mocy między pamiątkami jest teraz równiejszy, więc łatwiej ocenić wartość łupu w trakcie runa.',
      '🛖 JARMARK: Dostosowano ceny wybranych pamiątek, żeby lepiej pasowały do ich nowej roli w rozgrywce.',
    ],
  },
  {
    version: 'v1.1.0 - Wielki Rebalans',
    date: 'Kwiecień 2026',
    changes: [
      '🆕 NOWOŚCI: Rozszerzono grę o nowe karty, nowych przeciwników i nowe pamiątki.',
      '⚖️ REBALANS RUNA: Tempo walk, ekonomia i siła buildów zostały lepiej zestrojone, żeby decyzje w trakcie wyprawy miały większe znaczenie.',
      '🌄 PRZEBIEG WYPRAWY: Wczesne i środkowe etapy runa płynniej prowadzą do finału, a bossowie są bliżej siebie poziomem wyzwania.',
      '🗺️ MAPA I JARMARK: Zdarzenia, nagrody i zakupy zostały odświeżone, żeby każda ścieżka dawała ciekawsze wybory.',
    ],
  },
  {
    version: 'v1.0.2 - Uspokojenie Finału',
    date: 'Kwiecień 2026',
    changes: [
      '👹 FINAŁ RUNA: Osłabiono końcowych bossów, żeby finał wyprawy był wymagający, ale mniej frustrujący dla szerszej gamy buildów.',
      '🎴 NAGRODY: Łatwiej trafić na mocniejsze karty po walce, więc składanie talii pod konkretny plan stało się przyjemniejsze.',
      '🗺️ ŚCIEŻKA WYPRAWY: Środkowa część mapy częściej prowadzi przez walki i sklepy, a rzadziej przez przypadkowe odskoki od głównego tempa runa.',
    ],
  },
  {
    version: 'v1.0.1 - Balans Krupówek',
    date: 'Kwiecień 2026',
    changes: [
      '⚖️ BALANS WROGÓW: Uspokojono trudność niektórych starć, żeby początek i środek runa były bardziej fair.',
      '❓ WYDARZENIA LOSOWE: Na mapie pojawiły się specjalne wydarzenia z własnymi wyborami i skutkami dla dalszej wyprawy.',
    ],
  },
  {
    version: 'v1.0.0 - Wielkie Otwarcie Krupówek',
    date: 'Kwiecień 2026',
    changes: [
      '🏔️ GRA KARCIANA ROGUELIKE: Budujesz talię, zarządzasz Oscypkami i planujesz tury na mapie z wydarzeniami.',
      "⚔️ DWIE ŚCIEŻKI ZWYCIĘSTWA: Możesz wygrać klasycznie przez obrażenia albo przez mechanikę 'Rachunku' i bankructwo przeciwnika.",
      '✨ LANS I STATUSY: Walka opiera się na statusach, synergii kart i efektach, które pozwalają budować bardzo różne style gry.',
      '🎒 SYSTEM PAMIĄTEK: Rozwijasz build przez pamiątki różnej rzadkości, które zmieniają ekonomię, obronę i tempo walki.',
      '🗺️ PERĆ I WYDARZENIA: Mapa prowadzi przez bitki, Jarmark, Watrę, skarby i finałowe starcie z bossem.',
      '⚖️ WROGOWIE: Każdy przeciwnik ma własny styl walki i wymusza inne podejście do rozgrywki.',
      '👺 GALERIA PRZECIWNIKÓW: Wrogowie mają unikalne pasywki i wzorce ruchów, które zmuszają do zmiany taktyki między walkami.',
      '👹 FINAŁ WYPRAWY: Na końcu perci czeka losowy boss i wymagające starcie domykające run.',
    ],
  },
];
