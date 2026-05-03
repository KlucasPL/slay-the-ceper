/**
 * @typedef {{ version: string, date: string, changes: string[] }} ReleaseNoteEntry
 */

/** @type {ReleaseNoteEntry[]} */
export const releaseNotesData = [
  {
    version: 'v2.0.1 - Szlify Aktu II i trybu aplikacyjnego',
    date: 'maj 2026',
    changes: [
      '📱 TRYB APLIKACJI MOBILNEJ: Na urządzeniach mobilnych w wersji aplikacyjnej dodano przycisk „Wymuś poziom”, który wykonuje najlepszą możliwą próbę przejścia do widoku poziomego.',
      '🗺️ WYDARZENIA W AKTACH: Ograniczono powtarzanie wydarzeń w tym samym akcie, dzięki czemu wyprawa daje bardziej różnorodne spotkania.',
      '🔀 LEPSZE ZASTĘPSTWO WĘZŁA WYDARZENIA: Gdy pula wydarzeń w akcie się wyczerpie, węzeł przechodzi na sensowny wariant zastępczy (walka lub jarmark), zamiast pustego zdarzenia.',
      '🚽 KOLEJKA DO TOALETY: Przerobiono pasywkę, aby licznik narastał sensownie między turami i był zużywany dopiero przy odpowiednim efekcie.',
      '🧩 IKONY STATUSÓW: Uspójniono widoczność nowych statusów i znaczników mocy, żeby czytelniej pokazywać aktywne efekty podczas walki.',
    ],
  },
  {
    version: 'v2.0.0 - Morskie Oko i pełna Wyprawa',
    date: 'maj 2026',
    changes: [
      '🏔️ AKT II: Wyprawa została rozszerzona o drugi akt (Morskie Oko) z nową pulą przeciwników, elit i finałowych hersztów.',
      '👑 NOWI HERSZCI AKTU II: Na końcu drugiego aktu czekają Królowa Schroniska oraz Harnaś Pogodynka z własnymi mechanikami i wzorcami walki.',
      '🌦️ POGODA MA WIĘKSZE ZNACZENIE: Starcia i decyzje na mapie mocniej wykorzystują system pogody, który realnie wpływa na tempo i ryzyko wyprawy.',
      '❓ NOWE WYDARZENIA I LEPSZE PULE: Uporządkowano akty wydarzeń (Akt I/Akt II), aby spotkania trafiały do właściwej części wyprawy.',
      '🧾 NOWE STATUSY WROGÓW: Dodano nowe zagrożenia statusowe i dopracowano ekonomiczne presje w walce (m.in. efekty paragonów/rachunku).',
      '⚖️ DOSTROJENIE CAŁEJ GALERII WROGÓW: Przestrojono siłę przeciwników w obu aktach, żeby trudność rosła bardziej płynnie od początku do finału.',
      '📊 ZAPIS PRZEBIEGU ROZGRYWKI: Dodano automatyczny zapis przebiegu wyprawy (z podziałem na akty), co poprawia analizę balansu i jakości walki (DO WYŁĄCZENIA W USTAWIENIACH).',
      '🛠️ STABILNOŚĆ I SPÓJNOŚĆ: Poprawiono obsługę zwycięstw i porażek z hersztami, eksport danych z rozgrywki oraz wiele drobnych błędów wpływających na płynność wyprawy.',
    ],
  },
  {
    version: 'v1.7.2 - Król Krupówek i balans',
    date: 'kwiecień 2026',
    changes: [
      '🐻‍❄️ Król Krupówek – zmniejszono obrażenia wszystkich ataków, obniżono Gardę z wzmocnienia oraz zmniejszono obrażenia Podatku od zdjęcia.',
      '⚖️ Mistrz Redyku – zmniejszono Gardę z wzmocnienia oraz zdrowie.',
      '🚧 Parkingowy – zwiększono obrażenia ataku Bilet za wycieraczką.',
      '🐴 Fiakier – zwiększono obrażenia wszystkich ataków o 20%.',
      '🌬️ Halny – teraz obie strony tracą 3 Gardy na koniec tury.',
      '🛠️ Inne – drobne poprawki i uspójnienia opisów.',
    ],
  },
  {
    version: 'v1.7.1 - Przypomnienie o aktualizacji aplikacji',
    date: 'kwiecień 2026',
    changes: [
      '📲 AKTUALIZACJE GRY W WERSJI APLIKACYJNEJ (PWA): na ekranie menu głównego dodano przypomnienie o aktualizacji aplikacji do najnowszej wersji.',
    ],
  },
  {
    version: 'v1.7.0 - Szlify interfejsu',
    date: 'kwiecień 2026',
    changes: [
      '📲 GRA JAKO APLIKACJA (PWA): Usiec Cepra można teraz zainstalować na telefonie lub komputerze jak prawdziwą aplikację – bez sklepu z aplikacjami, działa w pełni offline. Na Android/Chrome kliknij „Zainstaluj" w menu przeglądarki. Na iPhone/iPad otwórz w Safari → Udostępnij □↑ → „Dodaj do ekranu głównego". Na komputerze (Chrome/Edge) kliknij ikonę ⊕ w pasku adresu. Przycisk „📲 Zainstaluj" w lewym dolnym rogu menu głównego prowadzi przez cały proces.',
      '📱 TRYB POZIOMY WRACA NA TELEFONY: Gra znów działa w orientacji poziomej na urządzeniach mobilnych – blokada z poprzedniej wersji została zniesiona. Interfejs automatycznie dopasowuje się do szerokiego ekranu, a tytuł i przyciski menu są czytelne niezależnie od orientacji.',
      '🔍 PODGLĄD KART I PAMIĄTEK: Przytrzymanie palcem (lub kliknięcie i przytrzymanie myszą) na dowolnej karcie lub pamiątce – w nagrodach, Jarmarku, Watrze, Bibliotece Tatrzańskiej, stosach kart i u Maryny – otwiera pełnoekranowy podgląd z pełnym opisem.',
      '🃏 PODGLĄD DARÓW MARYNY: Przytrzymanie bonu błogosławieństwa Maryny poprawnie pokazuje teraz okno podglądu ponad nakładką wyboru.',
    ],
  },
  {
    version: 'v1.6.0 - Wielki Rebalans Kart i Pamiątek',
    date: 'kwiecień 2026',
    changes: [
      '⚖️ DUŻA AKTUALIZACJA BALANSU: Przestrojono najsłabsze i najsilniejsze elementy jednocześnie, z naciskiem na większą grywalność słabych wyborów i uspokojenie najbardziej dominujących opcji.',
      '🃏 KARTY (ATAK/UMIEJĘTNOŚĆ): Wzmocniono m.in. Zemstę Górala, Punkt Widokowy i List od Maryny, a osłabiono m.in. Młynek Ciupagą, Eksmisję z Kwatery i Paragon Grozy; poprawiono też opisy, by 1:1 zgadzały się z nowymi wartościami.',
      '🎒 PAMIĄTKI: Zrebalansowano kluczowe pamiątki ekonomiczne i bojowe (m.in. Flaszka po Śliwowicy, Dzwonek Owcy, Zepsuty Termometr, Certyfikowany Oscypek, Pęknięte Liczydło, Złota Karta Zakopiańczyka).',
      '👵 WYPRAWKI MARYNY: Dostosowano moc i ekonomię startowych darów (Mokra Ściera, Kiesa, Złoty Różaniec, Przegląd Plecaka), a opisy wyprawek i odpowiadających im pamiątek zostały zsynchronizowane z nowym balansem.',
      '🧾 CZYTELNOŚĆ I SPÓJNOŚĆ: Ujednolicono wartości liczbowe w opisach kart i pamiątek, żeby decyzje dotyczące budowy talii były bardziej przewidywalne już na etapie wyboru.',
    ],
  },
  {
    version: 'v1.5.3 - Wygodniejsza gra na telefonach',
    date: 'kwiecień 2026',
    changes: [
      '📱 TYLKO PION NA TELEFONACH: Gra blokuje teraz rozgrywkę na urządzeniach mobilnych w orientacji poziomej i wyświetla wyraźny komunikat, aby obrócić telefon do pionu.',
      '🛑 CZYTELNY EKRAN BLOKADY: Zamiast próbować upychać interfejs po obrocie, pokazujemy pełnoekranowy ekran informacyjny i wyłączamy interakcję z grą do czasu powrotu do układu pionowego.',
      '🖥️ BRAK MOBILNEGO TRYBU NA KOMPUTERZE: Bardzo szerokie, ale niskie okna na komputerach nie przełączają już gry do awaryjnego układu mobilnego. Zamiast tego pojawia się jasny komunikat, że okno jest zbyt niskie do wygodnej rozgrywki.',
    ],
  },
  {
    version: 'v1.5.2 - Poprawki walki i wydarzeń',
    date: 'kwiecień 2026',
    changes: [
      '🔥 WATRA TYLKO DLA ATAKÓW: Naostrzenie w Watrze ponownie akceptuje wyłącznie karty Ataku; Umiejętności i Moce są poprawnie odrzucane.',
      '🧹 STATUSY CZYSZCZONE OD RAZU PO WYGRANEJ: Tymczasowe karty statusu od Ceprów znikają natychmiast po walce, więc nie pojawiają się już w Jarmarku na liście usuwania.',
      '🐴 WĄSATY FIAKIER - POPRAWIONY PRÓG WALKI: Awaryjna walka uruchamia się teraz poprawnie przy mniej niż 20 Dutkach (także dla zakresu 10-19).',
    ],
  },
  {
    version: 'v1.5.1 - Poprawki i szlify',
    date: 'kwiecień 2026',
    changes: [
      '🗡️ ELITY NA MAPIE: Mapa gwarantuje teraz co najmniej 3 Elity na dostępnych ścieżkach, a każda z nich jest oddalona od pozostałych o co najmniej 3 węzły – koniec z pustymi trasami bez wyzwań.',
      '🛖 NOWE ZASADY JARMARKÓW: Na mapie pojawia się teraz co najmniej 5 Jarmarków, przynajmniej jedna ścieżka prowadzi przez 3 Jarmarki, a dwa Jarmarki nie mogą już stać jeden po drugim.',
      '🔥 WATRA NAPRAWIONA: Przy Watrze lista kart do naostrzenia pokazuje teraz wszystkie Ataki z talii, nie tylko wybrane kilka – każda talia może w pełni skorzystać z ulepszenia.',
      '🪓 JEDNA KARTA, NIE CAŁY STOS: Naostrzenie z Watry wzmacnia już tylko jedną wybraną kopię Ataku, zamiast wszystkich kart tego samego typu w talii.',
      '📝 PORZĄDEK W TERMINOLOGII: Ujednolicono nazwę statusu „Podatność" w całym interfejsie gry.',
    ],
  },
  {
    version: 'v1.5.0 - Nowa paczka kart',
    date: 'kwiecień 2026',
    changes: [
      '🃏 NOWE KARTY: Dodano 35 kart łącznie (19 Ataków, 8 Umiejętności, 8 Mocy).',
      '⚔️ ATAKI: Wydruk z Kasy, Rozpęd z Równi, Krzesany, Tatrzanski Szpan, Ciupaga we Mgle, Paradny Zwyrt, Nadplacony Bilet, Z Rozmachu, Eksmisja z Kwatery, Cios z Telemarkiem, Wymuszony Napiwek, Mlynek Ciupaga, Rachunek za Oddychanie, Przymusowe Morsowanie, Wepchniecie w Kolejke, Lawina z Morskiego Oka, Beczenie Redyku, Skrupulatne Wyliczenie, Paragon Grozy.',
      '🛡️ UMIEJĘTNOŚCI: Pogodzenie Sporów, Zapas Oscypków, Wdech Halnego, Punkt Widokowy, Przymusowy Napiwek, Zgubieni we Mgle, List od Maryny, Dutki na Stole.',
      '✨ MOCE: Pan na Włościach, Czas na Fajkę, Zimna Krew, Góralska Gościnność, Znajomość Szlaku, Kąpiel w Białce, Koncesja na Oscypki, Baciarka Ciesy.',
    ],
  },
  {
    version: 'v1.4.0 - Lans na pełnym gazie',
    date: 'kwiecień 2026',
    changes: [
      '🕶️ LANS Z CHARAKTEREM: Karty z oznaczeniem Lans mają teraz własną, globalną zasadę - jeśli jeszcze nie jesteś w Lansie, pierwsze zagranie odpala sam status, a dopiero kolejne uruchamiają pełny efekt karty.',
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
      '👹 ŁAGODNIEJSI FINAŁOWI WROGOWIE: Fiakier spod Krupówek i Biały Misiek mają teraz po 50 Krzepy mniej, więc finał dalej boli, ale rzadziej kończy wyprawę jedną, zbyt długą walką.',
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
      '📖 LEPSZE TEMPO WSTĘPU: Wydłużyliśmy czas wyświetlania paneli w komiksie startowym, żeby każdy mógł na spokojnie zapoznać się z historią Jędrka.',
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
    version: 'v1.2.4 - Wstęp i grafika pierwszej części na mapie',
    date: 'Kwiecień 2026',
    changes: [
      '🎬 NOWY WSTĘP: Dodano komiksowy wstęp uruchamiany przed główną pętlą gry, z możliwością pominięcia klawiszem ESC lub kliknięciem. Można go również wyłączyć w ustawieniach.',
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
      '📱 LEPSZA ERGONOMIA INTERFEJSU: Ikony stosów są stale widoczne w górnym panelu i nie zasłaniają już kart na ręce, także na mniejszych ekranach.',
      '🧾 POPRAWKA GAŹDZINY: Gaździna jest teraz w pełni odporna na Rachunek - licznik nie narasta i pozostaje na 0 przez całe starcie, co usuwa mylące wskazania.',
    ],
  },
  {
    version: 'v1.2.2 - Hazard na Krupówkach',
    date: 'Kwiecień 2026',
    changes: [
      '🎲 NOWE WYDARZENIE: Na trasie możesz trafić na Hazard na Kartonie z kilkoma różnymi wyborami i konsekwencjami, które zmieniają przebieg wyprawy.',
      '🎨 DRUGIE NOWE WYDARZENIE: Do puli doszedł też Uliczny Karykaturzysta, czyli kolejne spotkanie z własnymi wyborami i nagrodami wpływającymi na talię.',
      '⚔️ NOWE STARCIE SPECJALNE: W ramach wydarzenia pojawia się unikalna walka z Naganiaczami oraz dedykowana nagroda powiązana z tym spotkaniem.',
      '🎁 CZYTELNIEJSZE NAGRODY: Po elitach i wybranych starciach nagrody układają się bardziej przewidywalnie, dzięki czemu łatwiej planować dalsze decyzje.',
      '🗺️ PŁYNNIEJSZA WYPRAWA: Dopracowano mapę i losowość wydarzeń, aby wyprawy częściej trzymały dobre tempo walk i dawały bardziej satysfakcjonujące wybory.',
    ],
  },
  {
    version: 'v1.2.1 - Muzyka i Płynność Wyprawy',
    date: 'Kwiecień 2026',
    changes: [
      '🎵 NOWA MUZYKA I LEPSZE PRZEJŚCIA: Dodano osobne motywy dla mapy, zwykłej walki, finałowego wroga i wydarzenia Wąsatego Fiakra, a przejścia między mapą, wydarzeniem i starciem wracają teraz zawsze do właściwego utworu bez nakładania dźwięku.',
      '💥 LEPSZE WYCZUCIE TURY PRZECIWNIKA: Rozstrzygnięcia związane z bankructwem przeciwnika są bardziej spójne z rytmem tury i animacji.',
    ],
  },
  {
    version: 'v1.2.0 - Struktura Wyprawy i Prawdziwe Elity',
    date: 'Kwiecień 2026',
    changes: [
      '🗺️ STRUKTURA WYPRAWY: Wyprawa ma teraz 15 poziomów, gwarantowaną Watrę w połowie trasy oraz końcową Watrę przed finałowym wrogiem, co stabilizuje tempo przygotowania do finału.',
      '🎁 SKARB I ŚCIEŻKI: Każda wyprawa zawiera dokładnie jeden gwarantowany węzeł skarbu we wczesnej i środkowej fazie, a połączenia na mapie są czytelniejsze i nie przecinają się lokalnie.',
      '👹 PRAWDZIWE ELITY: Węzły elitarne korzystają z osobnej puli przeciwników, pojawiają się najwcześniej od y=4 i dają dedykowaną nagrodę 1 z 3 pamiątek (z awaryjnym doborem kart rzadkich).',
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
      '⚖️ PRZEBALANSOWANIE WYPRAWY: Tempo walk, ekonomia i siła talii zostały lepiej zestrojone, żeby decyzje w trakcie wyprawy miały większe znaczenie.',
      '🌄 PRZEBIEG WYPRAWY: Wczesne i środkowe etapy wyprawy płynniej prowadzą do finału, a finałowi wrogowie są bliżej siebie poziomem wyzwania.',
      '🗺️ MAPA I JARMARK: Zdarzenia, nagrody i zakupy zostały odświeżone, żeby każda ścieżka dawała ciekawsze wybory.',
    ],
  },
  {
    version: 'v1.0.2 - Uspokojenie Finału',
    date: 'Kwiecień 2026',
    changes: [
      '👹 FINAŁ WYPRAWY: Osłabiono końcowych wrogów, żeby finał wyprawy był wymagający, ale mniej frustrujący dla szerszej gamy talii.',
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
      '🎒 SYSTEM PAMIĄTEK: Rozwijasz talię przez pamiątki różnej rzadkości, które zmieniają ekonomię, obronę i tempo walki.',
      '🗺️ PERĆ I WYDARZENIA: Mapa prowadzi przez bitki, Jarmark, Watrę, skarby i finałowe starcie z finałowym wrogiem.',
      '⚖️ WROGOWIE: Każdy przeciwnik ma własny styl walki i wymusza inne podejście do rozgrywki.',
      '👺 GALERIA PRZECIWNIKÓW: Wrogowie mają unikalne pasywki i wzorce ruchów, które zmuszają do zmiany taktyki między walkami.',
      '👹 FINAŁ WYPRAWY: Na końcu perci czeka losowy finałowy wróg i wymagające starcie domykające wyprawę.',
    ],
  },
];
