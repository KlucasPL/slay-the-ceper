/**
 * @typedef {{ version: string, date: string, changes: string[] }} ReleaseNoteEntry
 */

/** @type {ReleaseNoteEntry[]} */
export const releaseNotesData = [
  {
    version: 'v1.5.0 - Nowa paczka kart',
    date: 'kwiecień 2026',
    changes: [
      '🃏 NOWE KARTY: Dodano 35 kart łącznie (19 Ataków, 8 Skilli, 8 Mocy).',
      '⚔️ ATAKI: Wydruk z Kasy, Rozpęd z Równi, Krzesany, Tatrzanski Szpan, Ciupaga we Mgle, Paradny Zwyrt, Nadplacony Bilet, Z Rozmachu, Eksmisja z Kwatery, Cios z Telemarkiem, Wymuszony Napiwek, Mlynek Ciupaga, Rachunek za Oddychanie, Przymusowe Morsowanie, Wepchniecie w Kolejke, Lawina z Morskiego Oka, Beczenie Redyku, Skrupulatne Wyliczenie, Paragon Grozy.',
      '🛡️ SKILLE: Pogodzenie Sporów, Zapas Oscypków, Wdech Halnego, Punkt Widokowy, Przymusowy Napiwek, Zgubieni we Mgle, List od Maryny, Dutki na Stole.',
      '✨ MOCE: Pan na Włościach, Czas na Fajkę, Zimna Krew, Góralska Gościnność, Znajomość Szlaku, Kąpiel w Białce, Koncesja na Oscypki, Baciarka Ciesy.',
    ],
  },
  {
    version: 'v1.4.0 - Lans na pełnym gazie',
    date: 'kwiecień 2026',
    changes: [
      '🕶️ LANS Z CHARAKTEREM: Karty z tagiem Lans mają teraz własną, globalną zasadę - jeśli jeszcze nie jesteś w Lansie, pierwsze zagranie odpala sam status, a dopiero kolejne uruchamiają pełny efekt karty.',
      '💸 SZPAN KOSZTUJE WIĘCEJ: Lans dalej chroni Krzepę kosztem Dutków, ale w trakcie walki rachunek za taki styl rośnie coraz szybciej, więc mocny start łatwiej kończy się bolesnym BANKRUTEM.',
      '✨ NOWA OPRAWA LANSU: Aktywacji statusu towarzyszy teraz złoty błysk, spadające okulary i okrzyk "JEST LANS!", a przy utracie efektu okulary widowiskowo zlatują z nosa.',
    ],
  },
  {
    version: 'v1.3.2 - Nowa twarz na targu',
    date: 'kwiecień 2026',
    changes: [
      '🧀 HANDLARA OSCYPKAMI: Gaździna Maryna zmieniła się w Handlarę oscypkami – ta sama twarda gospodyni, nowe, trafniejsze imię.',
    ],
  },
  {
    version: 'v1.3.1 - Spokojniejszy finał wyprawy',
    date: 'kwiecień 2026',
    changes: [
      '👹 ŁAGODNIEJSI BOSSOWIE: Fiakier spod Krupówek i Biały Misiek mają teraz po 50 Krzepy mniej, więc finał dalej boli, ale rzadziej kończy wyprawę jedną, zbyt długą walką.',
    ],
  },
  {
    version: 'v1.3.0 - Wyprawka od Maryny',
    date: 'kwiecień 2026',
    changes: [
      '👵 MARYNA: Przed pierwszą walką spotykasz Marynę – starą góralką, która wręcza Ci jeden z trzech specjalnych darów na drogę. Wybierz mądrze!',
      '🎁 7 PAMIĄTEK MARYNY: Mokra ściora (+12 Max Krzepa), Kiesa (+80 Dutki + bonus po pierwszej walce), Przegląd Plecaka (wymień kartę startową na niepospolitą), Słoik Rosołu (przez 3 walki: +6 Gardy i +1 Siły na start), Złoty Różaniec (podwajaj pierwsze trafienie atakiem w każdej walce), Lista Zakupów (pierwsza wizyta w sklepie: 30% rabat na karty + darmowe usunięcie), Tajny Składnik (każda walka: Cepr zaczyna z -1 Słabości i -1 Kruchości).',
      '⚔️ GWARANTOWANY CEPR: Po wyborze daru od Maryny, pierwszy prawdziwy przeciwnik to zawsze Cepr – żeby na spokojnie przetestować dar.',
      '🏠 MAPA POPRAWIONA: Węzeł startowy mapy to teraz "Maryna" zamiast losowej walki – rysunek Maryny pojawia się w dedykowanym okienku wyboru.',
    ],
  },
  {
    version: 'v1.2.6 - Wielkie szlify i czytelne karty',
    date: 'Kwiecień 2026',
    changes: [
      '🃏 PERFEKCYJNE KARTY: Gruntowny remont wyglądu kart! Teksty i ikony inteligentnie robią sobie nawzajem miejsce, opisy są większe i czytelniejsze, a rogi z kosztami już się nie ucinają na telefonach. Dodatkowo karty jasno wyświetlają swój pełny rodzaj (np. "Powszechny Atak", "Niepowszechna Umiejętność").',
      '📱 ELASTYCZNY INTERFEJS: Koniec z uciętymi widokami! Nieważne, czy grasz na małym smartfonie, czy na laptopie (jak Mac Air) – Menu Główne i Biblioteka Tatrzańska idealnie dopasują się do Twojego wyświetlacza bez chowania przycisków na dole.',
      '📖 LEPSZE TEMPO INTRO: Wydłużyliśmy czas wyświetlania paneli w komiksie startowym, żeby każdy mógł na spokojnie zapoznać się z historią Jędrka.',
      '🎓 POPRAWKA W SAMOUCZKU: Przesunęliśmy dymek Jędrka, który wcześniej niegrzecznie zasłaniał przycisk "Wyjdź".',
      '⚖️ FORMALNOŚCI: Na dole menu dodaliśmy dyskretną informację przypominającą, że nasza góraleskowa gra jest po prostu humorystyczną parodią Slay the Spire.',
    ],
  },
  {
    version: 'v1.2.5 - Samouczek i wygoda na telefonach',
    date: 'Kwiecień 2026',
    changes: [
      '🧭 NOWY SAMOUCZEK OD JĘDRKA: Dodano pełny tryb Samouczek, który krok po kroku tłumaczy walkę, nagrody i poruszanie się po mapie.',
      '📱 LEPSZA CZYTELNOŚĆ NA TELEFONACH: Uporządkowano układ menu głównego, żeby nic się nie ucinało i żeby treści były czytelne na mniejszych ekranach.',
    ],
  },
  {
    version: 'v1.2.4 - Intro i grafika pierwszej części na mapie',
    date: 'Kwiecień 2026',
    changes: [
      '🎬 NOWE INTRO: Dodano komiksowe Intro uruchamiane przed główną pętlą gry, z możliwością pominięcia klawiszem ESC lub kliknięciem. Można je również wyłączyć w ustawieniach.',
      '🖼️ NOWA GRAFIKA PRZYGODY: Dodano grafikę pierwszej części przygód Jędrka wykorzystywaną na mapie.',
      '🎵 NOWY UTWÓR W MENU: Dodano nowy utwór muzyczny w głównym menu gry.',
    ],
  },
  {
    version: 'v1.2.3 - Podgląd Stosów Kart',
    date: 'Kwiecień 2026',
    changes: [
      '🃏 NOWY PODGLĄD STOSÓW W WALCE: W trakcie starcia możesz kliknąć ikonki Talii, Odrzuconych i Przepadłych, aby podejrzeć dokładnie jakie karty są w każdym stosie.',
      '👀 CZYTELNIEJSZE DECYZJE TAKTYCZNE: Podgląd działa w wygodnym oknie z siatką kart, więc łatwiej planować kolejne ruchy i zarządzać tempem walki.',
      '📱 LEPSZA ERGONOMIA UI: Ikony stosów są stale widoczne w górnym panelu i nie zasłaniają już kart na ręce, także na mniejszych ekranach.',
      '🧾 BUGFIX GAŹDZINY: Gaździna jest teraz w pełni odporna na Rachunek - licznik nie narasta i pozostaje na 0 przez całe starcie, co usuwa mylące wskazania.',
    ],
  },
  {
    version: 'v1.2.2 - Hazard na Krupówkach',
    date: 'Kwiecień 2026',
    changes: [
      '🎲 NOWE WYDARZENIE: Na trasie możesz trafić na Hazard na Kartonie z kilkoma różnymi wyborami i konsekwencjami, które zmieniają przebieg wyprawy.',
      '🎨 DRUGIE NOWE WYDARZENIE: Do puli doszedł też Uliczny Karykaturzysta, czyli kolejne spotkanie z własnymi wyborami i nagrodami wpływającymi na build.',
      '⚔️ NOWE STARCIE SPECJALNE: W ramach wydarzenia pojawia się unikalna walka z Naganiaczami oraz dedykowana nagroda powiązana z tym spotkaniem.',
      '🎁 CZYTELNIEJSZE NAGRODY: Po elitach i wybranych starciach nagrody układają się bardziej przewidywalnie, dzięki czemu łatwiej planować dalsze decyzje.',
      '🗺️ PŁYNNIEJSZY RUN: Dopracowano mapę i losowość wydarzeń, aby wyprawy częściej trzymały dobre tempo walk i dawały bardziej satysfakcjonujące wybory.',
    ],
  },
  {
    version: 'v1.2.1 - Muzyka i Płynność Wyprawy',
    date: 'Kwiecień 2026',
    changes: [
      '🎵 NOWA MUZYKA I LEPSZE PRZEJŚCIA: Dodano osobne motywy dla mapy, zwykłej walki, bossa i wydarzenia Wąsatego Fiakra, a przejścia między mapą, wydarzeniem i starciem wracają teraz zawsze do właściwego utworu bez nakładania dźwięku.',
      '💥 LEPSZE WYCZUCIE TURY PRZECIWNIKA: Rozstrzygnięcia związane z bankructwem przeciwnika są bardziej spójne z rytmem tury i animacji.',
    ],
  },
  {
    version: 'v1.2.0 - Struktura Wyprawy i Prawdziwe Elity',
    date: 'Kwiecień 2026',
    changes: [
      '🗺️ STRUKTURA RUNA: Wyprawa ma teraz 15 poziomów, gwarantowaną Watrę w połowie trasy oraz końcową Watrę przed bossem, co stabilizuje tempo przygotowania do finału.',
      '🎁 SKARB I ŚCIEŻKI: Każda wyprawa zawiera dokładnie jeden gwarantowany węzeł skarbu we wczesnym-midgame, a połączenia na mapie są czytelniejsze i nie przecinają się lokalnie.',
      '👹 PRAWDZIWE ELITY: Węzły elitarne korzystają z osobnej puli przeciwników, pojawiają się najwcześniej od y=4 i dają dedykowaną nagrodę 1 z 3 pamiątek (z fallbackiem do kart rare).',
      '👑 NOWE ELITY: Elitarne starcia zyskały nową pulę przeciwników z wyraźnie różnymi stylami walki, więc każda walka elitarna ma własny charakter i tempo.',
      '⚖️ LEPSZY BALANS ELIT: Dopracowano siłę wybranych elit, żeby nadal były wymagające, ale rzadziej kończyły wyprawę przez pojedynczy zbyt mocny spike.',
      '🧭 CZYTELNIEJ W TRAKCIE WYPRAWY: Na mapie widzisz teraz od razu aktualną Krzepę i Dutki, więc łatwiej planować ryzyko kolejnych węzłów.',
      '💰 JAŚNIEJSZE EFEKTY WALKI: Efekty związane z utratą Dutków (np. interakcje z LANS-em) są lepiej sygnalizowane podczas starcia.',
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
      '🆕 NOWE EKRANY: Dodano ekran opcji oraz podsumowanie wyprawy, dzięki czemu łatwiej śledzić postępy i wrócić do kolejnej wyprawy.',
      '🎵 MUZYKA: Gra dostała nowe utwory i bardziej filmowe przejścia między najważniejszymi momentami rozgrywki.',
      '⚙️ WYGODA: Opcje są teraz dostępne także podczas gry, bez potrzeby wracania do menu głównego.',
    ],
  },
  {
    version: 'v1.1.1 - Re-tiering Pamiątek',
    date: 'Kwiecień 2026',
    changes: [
      '🎒 PAMIĄTKI: Uporządkowano rzadkości części pamiątek, żeby nagrody i wybory w sklepie były bardziej intuicyjne.',
      '⚖️ BALANS: Rozkład mocy między pamiątkami jest teraz równiejszy, więc łatwiej ocenić wartość łupu w trakcie wyprawy.',
      '🛖 JARMARK: Dostosowano ceny wybranych pamiątek, żeby lepiej pasowały do ich nowej roli w rozgrywce.',
    ],
  },
  {
    version: 'v1.1.0 - Wielki Rebalans',
    date: 'Kwiecień 2026',
    changes: [
      '🆕 NOWOŚCI: Rozszerzono grę o nowe karty, nowych przeciwników i nowe pamiątki.',
      '⚖️ REBALANS RUNA: Tempo walk, ekonomia i siła buildów zostały lepiej zestrojone, żeby decyzje w trakcie wyprawy miały większe znaczenie.',
      '🌄 PRZEBIEG WYPRAWY: Wczesne i środkowe etapy wyprawy płynniej prowadzą do finału, a bossowie są bliżej siebie poziomem wyzwania.',
      '🗺️ MAPA I JARMARK: Zdarzenia, nagrody i zakupy zostały odświeżone, żeby każda ścieżka dawała ciekawsze wybory.',
    ],
  },
  {
    version: 'v1.0.2 - Uspokojenie Finału',
    date: 'Kwiecień 2026',
    changes: [
      '👹 FINAŁ RUNA: Osłabiono końcowych bossów, żeby finał wyprawy był wymagający, ale mniej frustrujący dla szerszej gamy buildów.',
      '🎴 NAGRODY: Łatwiej trafić na mocniejsze karty po walce, więc składanie talii pod konkretny plan stało się przyjemniejsze.',
      '🗺️ ŚCIEŻKA WYPRAWY: Środkowa część mapy częściej prowadzi przez walki i sklepy, a rzadziej przez przypadkowe odskoki od głównego tempa wyprawy.',
    ],
  },
  {
    version: 'v1.0.1 - Balans Krupówek',
    date: 'Kwiecień 2026',
    changes: [
      '⚖️ BALANS WROGÓW: Uspokojono trudność niektórych starć, żeby początek i środek wyprawy były bardziej fair.',
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
      '👹 FINAŁ WYPRAWY: Na końcu perci czeka losowy boss i wymagające starcie domykające wyprawę.',
    ],
  },
];
