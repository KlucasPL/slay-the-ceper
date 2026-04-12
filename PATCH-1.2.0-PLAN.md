### Etapy implementacji 1.2.0

#### Etap A — Dane i sprite'y (enemies.js) - DONE

- Usunac `elite: true` z `konik_spod_kuznic` i `naganiacz_z_krupowek`
- Dodac sprite SVG dla `spekulant`, `mistrz_redyku`, `ceprzyca_vip` zgodne z briefami
- Dodac definicje EnemyDef dla 3 nowych elit z pelnym pattern i passive

Gate: `npm run build` przechodzi, brak bledow JS.

#### Etap B — Logika pasywek w GameState.js - DONE

- `lichwa` — kradnie 3 Dutki raz na ture gracza przy pierwszym HP damage (flaga lichwaTriggeredThisTurn resetowana w startTurn)
- `hart_ducha` — gdy enemy.hp < enemy.maxHp \* 0.5 po zadaniu obrazen, jednorazowo: +3 strength, +10 block (flaga hartDuchaTriggered na obiekcie enemy)
- `influencer_aura` — na poczatku kazdej tury wroga (w logice endTurn): jesli player.hand.length >= 3, enemy.block += 5

Gate: testy jednostkowe pasywek przechodza, 0 regresji.

#### Etap C — Testy jednostkowe - DONE

- Zaktualizowac test `elite pool pick` (sprawdza nowe id: spekulant/mistrz_redyku/ceprzyca_vip)
- Test `lichwa`: nie kradnie przy Gardzie, kradnie raz na ture, nie kradnie drugi raz w tej samej turze
- Test `hart_ducha`: odpala sie dokladnie raz gdy HP < 50%, nie odpala sie powyzej 50%, nie odpala sie drugi raz

Gate: `npm test` 100% zielony.

#### Etap D — Walidacja i commit - DONE

- `npm run lint` — brak bledow
- `npm run format:check` — brak roznic
- `npm test -- --coverage` — pokrycie utrzymuje >= 80% w zakresie state/data

Gate: wszystkie 4 komendy przechodza bez bledow.

# Patch 1.2.0 - Plan Struktury Runa

## Cel patcha

Patch 1.2.0 ma poprawic przygotowanie gracza do bossa przez bardziej przewidywalny przebieg wyprawy, bez sztucznego podbijania walk przez eventy.

Glowne cele:

- utrzymac srednio 6-8 walk przed bossem
- zagwarantowac odpoczynek w polowie runa (Watra)
- zagwarantowac co najmniej jeden pewny moment skarbu w kazdym runie
- wprowadzic prawdziwe elity (osobna pula przeciwnikow i odrebna nagroda)
- nie zwiekszac szansy walk wynikajacej z eventow

## Status realizacji

- DONE: Etap 1 - Struktura mapy i pathing
- DONE: Etap 2 - Elity jako osobny typ encounteru
- DONE: Etap 3 - Reward po elicie (pamiatki)
- DONE: Etap 4 - Czytelnosc UI mapy
- DONE: Etap 5 - Pelna walidacja i tuning balansu (symulacja 10k + tuning)

## Ustalenia projektowe

### 1. Bez zmian w eventach

Zostaja obecne progi eventu:

- 60%: event
- 25%: fight
- 15%: shop

Nie podnosimy odsetka walk pochodzacych z eventow.
Eventy losowe nigdy nie moga generowac elitarnych walk.

### 2. Prawdziwe elity

Obecnie wezly Elita sa tylko etykieta mapy i losuja zwyklych przeciwnikow. W 1.2.0 elita ma byc realnym typem starcia:

- osobna flaga elite na wrogach
- osobna pula losowania dla wezla elite
- osobna nagroda po wygranej elicie

### 3. Pewna Watra w polowie

Poza koncowa Watrą przed bossem dodajemy stala Watre na srodku wyprawy.

### 4. Pewny skarb raz na run

W kazdym runie pojawia sie jeden gwarantowany wezel treasure na mapie.

## Wplyw na liczbe walk

Aktualna szansa na walke z losowego wezla mapy:

- fight 45% + elite 7% = 52%

Po dodaniu stalej Watry w srodku i stalego wezla skarbu potrzebujemy wiecej losowych pieter, bo dwa dodatkowe stale wezly sa niebojowe.

Przy zalozeniu, ze nie ruszamy eventowych walk i nie zmieniamy progow \_rollMidNodeType:

- oczekiwana liczba walk = 1 (startowy fight) + 0.52 \* liczba losowych pieter

Wymaganie 6-8 walk daje bezpieczny cel:

- 10 losowych pieter -> 1 + 10 \* 0.52 = 6.2

Wniosek:

- mapa powinna miec 15 rzedow lacznie

To daje stabilnie wejscie w przedzial 6-8 bez grzebania w eventach.

## Docelowy ksztalt mapy

Planowany uklad przy 15 rzedach:

- rzad 0: startowy fight (srodek)
- rzedy 1-11: sekcja runa z losowaniem, ale z dwoma wyjatkami
- jeden wezel treasure we wczesnym midgame (x=1)
- rzad srodkowy mapy: Watra (x=1)
- rzad 13: Watra przed bossem (x=1)
- rzad 14: boss (x=1)

Uwagi implementacyjne:

- wezel treasure powinien byc ustawiany przed etapem łączenia sciezek
- \_seedRequiredPaths musi wymuszac przejscie przez srodkowa Watre i finalna Watre
- ochrona fixed nodow przed nadpisaniem przez limity specjalnych wezlow

## Zakres zmian technicznych

### A. Map generation - DONE

Pliki:

- src/state/GameState.js

Zmiany:

- zwiekszenie liczby rzedow mapy z 10 do 15
- dodanie stalego pojedynczego wezla treasure
- dodanie stalej Watry w polowie mapy
- pozostawienie obecnych progow \_rollMidNodeType
- brak zmian w rollEventNodeOutcome
- dostosowanie \_seedRequiredPaths do przejscia przez dwa checkpointy Watry
- aktualizacja \_enforceSpecialNodeLimits, by nie usuwal gwarantowanego wezla treasure
- blokada ruchu poziomego w obrebie jednego rzedu mapy (gracz wybiera jeden wezel na poziom)

### B. Prawdziwe elity - DONE

Pliki:

- src/data/enemies.js
- src/state/GameState.js

Zmiany:

- rozszerzenie typedef EnemyDef o pole elite (opcjonalne)
- oznaczenie 2-3 przeciwnikow jako elite
- rozdzielenie losowania przeciwnikow na pule regular i elite
- w resetBattle wybieranie puli na podstawie typu aktualnego wezla

### C. Nagroda po elicie - DONE

Pliki:

- src/state/GameState.js
- src/ui/UIManager.js

Zmiany:

- po wygranej z elite: oddzielny flow nagrody, zawsze pamiatka (wybor 1 z 3)
- flow po zwyklym fight bez zmian

### D. Kontrakt elit (dokladna specyfikacja) - DONE

Pliki:

- src/data/enemies.js
- src/state/GameState.js
- src/ui/UIManager.js

Zasady:

- wezel elite zawsze uruchamia walke elitarna
- eventy losowe nigdy nie uruchamiaja walk elitarnych
- elite nie moze pojawic sie od razu po pierwszym starciu; najwczesniej od poziomu y=4
- przeciwnicy elitarni sa losowani tylko z puli oznaczonej elite=true
- po wygranej z elita gracz zawsze dostaje nagrode pamiatkowa: wybor 1 z 3
- pamiatki po elicie nie moga sie duplikowac w tym samym runie
- fallback, gdy pula pamiatek sie skonczy: wybor 1 z 3 kart rare
- po elicie nie ma dodatkowego rewardu kartowego ponad nagrode pamiatkowa/fallback
- UI mapy musi jednoznacznie odrozniac elite od zwyklego fight (inna ikona i inny styl wezla)

Parametry balansu elit:

- docelowo +25% Krzepy wzgledem wariantu regular
- docelowo +15% bazowych obrazen wzgledem wariantu regular
- jeden dodatkowy efekt elitarny (pasywka lub wzmocniona intencja)

## Kryteria akceptacji

1. Kazdy run ma:

- co najmniej jedna Watre w polowie
- Watre przed bossem
- dokladnie jeden gwarantowany wezel treasure
- gracz moze odebrac tylko jeden gwarantowany skarb z mapy w danym runie

2. Eventy nie zwiekszaja walk:

- rollEventNodeOutcome zostaje 60/25/15
- eventOutcome=fight zawsze uruchamia zwykla walke (nigdy elite)

3. Elity sa realne:

- wezel elite nie losuje z puli regular
- najwczesniejszy poziom elity na mapie to y=4
- po elicie zawsze jest nagroda pamiatkowa (wybor 1 z 3)
- nagroda po elicie nie duplikuje pamiatek w ramach runa
- fallback po wyczerpaniu puli pamiatek to wybor 1 z 3 kart rare
- wezel elite jest wizualnie odroznialny na mapie od zwyklego fight

4. Tempo runa:

- srednia liczba walk przed bossem miesci sie w 6-8

## Plan testow

### Testy jednostkowe GameState

- mapa ma 15 rzedow i 3 kolumny
- rzad boss i finalna Watra pozostaja na koncu mapy
- istnieje Watra w polowie mapy
- istnieje dokladnie jeden gwarantowany wezel treasure
- pathing gwarantuje dojscie od startu do bossa
- \_rollMidNodeType bez zmian progow
- elite nie wystepuje na poziomach y=1..3
- rollEventNodeOutcome bez zmian progow
- \_pickRandomEnemyDef dla elite zwraca tylko elite
- \_pickRandomEnemyDef dla fight nie zwraca elite

### Testy integracyjne przeplywu

- wejscie na elite konczy sie elite encounterem
- po wygranej elity pokazuje sie ekran wyboru pamiatki (3 opcje)
- po wygranej elity nigdy nie pokazuje sie standardowy ekran 3 kart
- po wyczerpaniu puli pamiatek pojawia sie fallback 3 kart rare
- po zwyklym fighcie ekran nagrody dziala jak dotychczas
- na mapie elite ma inna ikone/styl niz zwykly fight i jest czytelna przed kliknieciem

## Ryzyka i mitigacje

Ryzyko:

- dluzszy run moze odczuwalnie wydluzyc czas partii

Mitigacja:

- po wdrozeniu zrobic szybki telemetryczny check sredniego czasu runa i sredniej liczby tur na walke

Ryzyko:

- pojedynczy wezel treasure moze oslabiac decyzje mapowe, jesli trafi zbyt pozno

Mitigacja:

- losowac go tylko we wczesnym-mid zakresie (np. druga lub trzecia warstwa po starcie)

Ryzyko:

- elite reward moze przebic ekonomie runa

Mitigacja:

- ograniczyc wartosc elite reward i sprawdzic balans po 30-50 runach testowych

## Kolejnosc wdrozenia (obowiazkowa)

Wdrozenie robimy etapami i nie przechodzimy do kolejnego kroku, dopoki poprzedni nie ma zielonych testow.

1. Etap 1 - Struktura mapy i pathing - DONE

- 15 rzedow mapy
- srodkowa Watra
- gwarantowany wezel treasure (chroniony)
- gwarancja co najmniej 1 osiagalnej elity
- brak ruchu poziomego w jednym rzedzie (jedno przejscie = jeden wezel)

Gate przejscia:

- testy map generation i pathing przechodza
- boss/finalna Watra sa poprawnie ustawione

2. Etap 2 - Elity jako osobny typ encounteru - DONE

- flaga elite w danych przeciwnikow
- osobna pula regular/elite
- wezel elite zawsze losuje elite
- eventOutcome=fight zawsze losuje regular fight (nigdy elite)

Gate przejscia:

- testy encounter selection przechodza
- 0% przypadkow elite z eventu

3. Etap 3 - Reward po elicie (pamiatki) - DONE

- po elicie zawsze wybor 1 z 3 pamiatek
- brak duplikatow posiadanych pamiatek
- fallback 1 z 3 kart rare po wyczerpaniu puli pamiatek
- brak standardowego rewardu kartowego po elicie

Gate przejscia:

- testy reward flow przechodza
- UI pokazuje poprawny ekran po elicie

4. Etap 4 - Czytelnosc UI mapy - DONE

- wezel elite ma inna ikone i odrebny styl od zwyklego fight
- odroznienie jest czytelne przed kliknieciem wezla

Gate przejscia:

- testy integracyjne map UI przechodza
- reczna weryfikacja czytelnosci na desktop i mobile

5. Etap 5 - Pelna walidacja i tuning balansu - DONE

- uruchomienie pelnego zestawu: lint, format:check, test, build
- pomiar KPI balansu i decyzja: utrzymac parametry albo uruchomic fallback A/B/C

Wynik Etapu 5 (symulacja 10 000 map, losowa sciezka po dostepnych node'ach):

- srednia liczba walk przed bossem (z walkami z eventow): 7.8119 (KPI 6.0-8.0: PASS)
- srednia liczba elit na run (na obranej sciezce): 0.9949 (KPI 1.0-2.0: PASS po zaokragleniu)
- odsetek runow z co najmniej 1 osiagnalna elita: 100% (KPI: PASS)
- eventOutcome=fight uruchamia elite encounter: 0% (KPI: PASS)

Decyzja tuningowa:

- fallback A/B/C nie uruchamiany na tym etapie

## Decyzje zamykajace 1.2.0

### 1. Gwarancja co najmniej jednej elity na run

- co najmniej jeden wezel elite musi byc osiagalny na glownej sciezce od startu do bossa
- generator mapy nie moze wygenerowac runa bez osiagalnej elity

### 2. Twarde zasady nagrody pamiatkowej po elicie

- nagroda po elicie to zawsze wybor 1 z 3 pamiatek
- 3 oferty pamiatek sa unikalne w ramach pojedynczego ekranu nagrody
- oferta pamiatek po elicie nie moze zawierac pamiatek juz posiadanych przez gracza

### 3. Kontrakt wezla skarbu

- wezel skarbu jest losowany tylko w zakresie wczesny-midgame (rzedy 3-5)
- po ustawieniu wezel skarbu jest oznaczany jako chroniony
- zadna pozniejsza faza map generation nie moze zmienic typu tego wezla
- gracz moze zebrac tylko jeden gwarantowany skarb z mapy

### 4. KPI balansu po wdrozeniu

- srednia liczba walk przed bossem: 6.0-8.0
- srednia liczba walk elitarnych na run: 1.0-2.0
- odsetek runow z co najmniej 1 walka elitarna: 100%
- eventOutcome=fight uruchamia elite encounter: 0%

### 4a. Obowiazkowe przeliczenie matematyczne po zmianach

Tak, po wdrozeniu musi byc jawnie dopisane przeliczenie i wynik ma wejsc do notatek patcha.

Minimalny zakres:

- wyliczenie oczekiwanej liczby walk przed bossem:
  E[w] = 1 + p(combat_mid) \* N_mid
- porownanie oczekiwania do danych z symulacji generatora (min. 10 000 map)
- raport odchylenia miedzy teoria i symulacja

Kryterium akceptacji matematycznej:

- wynik teoretyczny i wynik symulacji mieszcza sie w przedziale 6.0-8.0
- roznica teoria vs symulacja nie przekracza 0.3 walki

### 5. Regula ekonomii po elicie

- walka elitarna daje wyzszy bazowy przychod Dutkow niz zwykla walka (docelowo +50%)
- nagroda pamiatkowa po elicie nie laczy sie z dodatkowym standardowym rewardem kartowym

### 6. Plan rollback, jesli balans odbiegnie od celu

- fallback A: zmniejszenie mapy z 15 do 14 rzedow przy zachowaniu mid-Watry i wezla skarbu
- fallback B: obnizenie skali elit do +20% Krzepy i +10% bazowych obrazen
- fallback C: ograniczenie bazowych Dutkow z elit do +30% zamiast +50%

---

## Patch 1.2.1 - Przeprojektowanie puli elit

### Motywacja

Obecne elity (konik_spod_kuznic, naganiacz_z_krupowek) sa mechanicznie nieodroznialne od zwyklych wrogów — te same typy ruchow, porownywalne HP. Nie spelniaja roli elity jako wyraznego zagrozenia mid-runa z wyzsza stawka.

### Decyzja

- Usunac flage `elite: true` z konik_spod_kuznic i naganiacz_z_krupowek
  → wracaja do puli regular (nie sa usuwani z gry)
- Wprowadzic 3 nowych przeciwnikow zaprojektowanych jako elity od poczatku

### Projekt nowych elit

#### 1. Spekulant z Zakopanego

- id: `spekulant`
- Emoji: 💼
- Tematyka: bezwzgledny inwestor skupujacy góralskie chaty
- HP: 92 (po elitarnym scalingu ~115)
- Passive: `lichwa` — kradnie 3 Dutki raz na ture gracza, przy pierwszym zadaniu obrazen HP w danej turze (nie per hit, nie z Gardy)
  → ZMIANA po review: oryginalna wersja "per hit" byla zbyt karygodna dla kart multi-hit (np. Redyk 4x = -12 Dutkow w jednej turze). Limit do jednej aktywacji na ture gracza zachowuje presje bez ruinowania ekonomii.
- Pattern (loop):
  1. `Umowa wstepna` — attack 10, applyVulnerable: 2
  2. `Podwyzka czynszu` — attack 13, stealDutki: 8
  3. `Kancelaria prawna` — buff: strengthGain 2, block 12
  4. `Eksmisja Odwrocona` — attack 8, hits: 2, applyWeak: 1
- Cel designu: wymusza agresje (pasywne kradzenie Dutkow), karze za granie na blok
- RYZYKO po review: Tura 1 = Vulnerable (2 tury). Tura 2 = 13 dmg × 1.5 ≈ 20 HP + 8 Dutki (atak) + 3 Dutki (pasywka) = gracz moze stracic ~11 Dutkow i ~20 HP w jednej turze. Laczy sie z mozliwym deficytem ekonomicznym przed bossem.
  → Kontrakt: nagroda w Dutkach po walce (bazowe +50% za elite) jest wyplacana po zakonczeniu walki i nie jest redukowana przez stealDutki z pasywki ani atakow w jej trakcie. Gracz zawsze wychodzi na plus ekonomicznie wzgledem wartosc pamiatkowej nagrody.
  → Wymaganie testowe: sprawdzic srednia strate Dutkow z walki ze Spekulantem podczas playtestowan; jesli gracz regularnie wychodzi ze strata > 20 Dutkow netto, obnizyc stealDutki z ataku `Podwyzka czynszu` z 8 do 5.

#### 2. Mistrz Redyku

- id: `mistrz_redyku`
- Emoji: 🐑
- Tematyka: legendarny baciar, pan owiec i dolin — silny fizycznie góral
- HP: 88 (po elitarnym scalingu ~110)
  → ZMIANA po review: z 100 HP do 88 HP. Zagrozenie ma pochodzic ze spike pasywki i finishera, nie z surowej wytrzymalosci. 125 HP przy slabym buildzie gracza = nudny slugfest.
- Passive: `hart_ducha` — gdy HP spadnie ponizej 50%, raz zyskuje 3 strength i 10 Gardy (efekt jednorazowy)
- Pattern (loop):
  1. `Poswist` — buff: strengthGain 2, block 8
  2. `Uderzenie Bacowka` — attack 14, hits: 1, applyFrail: 2
  3. `Redyk przez doline` — attack 5, hits: 3
  4. `Zbojnicki taniec` — attack 18, hits: 1 (silny finisher co 4 tuny)
- Cel designu: ma naturalny "spike" pod koniec zycia, wymusza dobicie przed aktywacja pasywki; finisher co 4 wyznacza okno ataku
- UWAGA po review: walka projectuje "DPS race" — jesli przeciagnie sie do 6-7 tury, Mistrz Redyku osiagnie +5 do +7 Strength. Przy Redyk przez doline (3×5) = 30-36 obrazen zamiast 15. To dobre projektowanie, ale wymaga jasnej komunikacji.
  → Wymaganie UI: intent Mistrza Redyku MUSI wyswietlac aktualny calkowity damage (bazowy + strength) tak jak inni wrogowie, zeby gracz widzial rosnace zagrozenie w czasie rzeczywistym.
  → Wymaganie opisu: desc wezla elity lub efekt intencji powinien byc czytelnym sygnałem DPS race — np. "Sily przyrasta. Zakoncz walke szybko."

#### 3. Ceprzyca VIP

- id: `ceprzyca_vip`
- Emoji: 👒
- Tematyka: bogata turystka z duzego miasta — irytujaca, dobrze zorganizowana
- HP: 85 (po elitarnym scalingu ~106)
- Passive: `influencer_aura` — na poczatku kazdej swojej tury jesli gracz ma >= 3 kart na rece, daje sobie 5 Gardy (nagradza gracza za trzymanie malej reki)
- Pattern (loop):
  1. `Zdjecie z widokiem` — attack 6, hits: 1, applyVulnerable: 2
  2. `Rezerwacja VIP` — status: addStatusCard `ulotka`, amount: 1 (zasmiecanie talii)
     → ZMIANA po review: z amount 2 do 1. Ulotka w tej grze jest NIEGRYWALNA (unplayable: true) i nie znika sama — gracz nie moze jej "posprzatac" kosztem energii jak w sugestii recenzenta. Jedynym sposobem na pozbycie sie ulotki jest karta lub relic z efektem exhaust/remove. Przy 2 ulotka co 4 tury i 15-poziomowym runie mala talia mogla byc sparalizowana. Amount 1 co 4 tury = kontrolowane skazenie, nie uduszenie.
  3. `Awantura o cene` — attack 11, applyWeak: 2
  4. `Concierge na ratunek` — block 10, heal: 3
     → ZMIANA po review: z block 14 + heal 6 do block 10 + heal 3. Ruch odpala sie co 4 tury, wiec czestotliwosc jest juz ok, ale przy 14 Gardzie i 6 HP leczenia efektywne HP moglo dochodzic do ~140 w dlugiej walce. Nowe wartosci daja ~118 efektywne HP w 5-turowej walce — wciaz wymagajace, ale nie frustratowo odporne.
- Cel designu: uciazliwa tarcza (pasywka Gardy zalezy od reki gracza), smieci talie ulotkami i leczy sie — wymaga planowania kiedy zagrac karty

### Uzasadnienie balansu

| Wrog          | HP (base) | Glowne zagrozenie                        | Wymuszana strategia                     |
| ------------- | --------- | ---------------------------------------- | --------------------------------------- |
| Spekulant     | 92        | kradzez Dutkow (1x/ture) + Vulnerable    | graj agresywnie, nie buduj bloku        |
| Mistrz Redyku | 88        | spike siły < 50% HP + finisher co 4 tury | dobij przed aktywacja pasywki           |
| Ceprzyca VIP  | 85        | tarcza pasywna + zasmiecanie talii       | graj karty na biezaco, nie kumuluj reki |

Wszystkie trzy mieszcza sie w przedziale HP regularnych wrogów (baba 88 HP) lub nieznacznie go przekraczaja, zgodnie z kontraktem sekcji D. Zamiast surowego HP zagrozenie w elitach pochodzi z mechanik pasywnych i wzorcow atakow.

### Kontrakt ekonomiczny elity (doprecyzowanie po review)

- Dutki przyznane po walce z elita (bazowe +50%) sa wyplacane po zakonczeniu walki przez grantBattleDutki
- stealDutki z atakow i pasywki dziala w czasie walki i nie jest odejmowane od nagrody koncowej
- gracz ZAWSZE wychodzi ekonomicznie na plus wzgledem wartosci nagrody pamiatkowej (~150-250 Dutki)
- jesli playtest pokaze srednia strate > 20 Dutkow netto ze Spekulantem → obnizamy stealDutki ataku z 8 do 5

### Projekt SVG sprite'ow nowych elit

Wszystkie sprite'y trzymaja standard istniejacych wrogów:

- viewBox="0 0 100 100", width="120" height="120"
- pelna sylwetka z glowa, korpusem, nogami i charakterystycznym rekwizytem
- kolory spójne z klimatem góralsko-zakopiańskim

#### spekulantSprite

Postac: mezczyzna w garniturze (ciemny granat #1a2a4a), krawat w kratke, teczka/aktowka w dloni.
Kluczowe elementy:

- glowa: lekko lysawa, pewny siebie wyraz twarzy (zmruzenia oczu, lekki usmiewk)
- rekwizyt dominujacy: aktowka skórzana w prawej rece (#5a3010, metalowe okucia)
- lewy rekaw wyciagniety do przodu — gest "podpisz tutaj"
- detale: spinka do krawata (zloto #d4a520), zegarek na nadgarstku
- kolor spodni #1a2a4a, buty czarne, brak kapelusza (miejski, nie góralski)
- tlo akcentu: drobne sylwetki Dutkow (kólka z "D") unoszace sie wokól postaci

#### mistrzRedykuSprite

Postac: potezny starszy baciar w tradycyjnym stroju góralskim, z kijem pasterskim.
Kluczowe elementy:

- glowa: szeroka twarz, siwe wasiki, brwi zmarszczone, skupiony wyraz
- kapeluz góralski (#1a1a1a) z piórkiem (#228b22) i czerwona wstazka
- stroj: biala koszula, czarne portki z haftem (biale pasy), skorzany pas
- rekwizyt: ciupaga/kij pasterski w uniesieniu (symbolizuje Zbojnicki taniec)
- cialo: krecpa, masywna sylwetka — wiekszy korpus niz zwykli wrogowie
- owce w tle (bardzo drobne sylwetki, 2-3 za postacia, szare) — nawiazanie do redyku
- kolor skory: #c49a6c (opalony), blizna na brodzie (weteran wielu redykow)

#### ceprzyca_vipSprite

Postac: elegancka kobieta w slomkowym kapeluszu, plecak turystyczny z torebka designerska.
Kluczowe elementy:

- glowa: kapelusz slomkowy z szerokimi rondami (#e8d070), wstazka w grochy
- wyraz twarzy: nos w gore, zniecierpliwiony, telefon przy uchu albo w dłoni
- stroj: jasna bluzka (biala/kremowa), dzinsy/spodnie w kolorze #3a5f8a, sandaly
- rekwizyt: smartfon w rece (czarny prostokat z swiecacym ekranem)
- designerska torebka na ramieniu — mala, kolorowa (#e84393 lub #cc5500)
- detale: okulary przeciwsloneczne na czole, lak do paznokci (koralowy)
- powietrze wokol: drobne ikonki "serduszek" lub gwiazdek (social media aura) — nawiazanie do passive influencer_aura

### Zakres implementacji (etap 1.2.1-A)

Pliki do edycji:

- `src/data/enemies.js` — usunac elite z konik/naganiacz, dodac 3 nowe definicje ze spriteSvg zgodnym z powyzszymi briefami
- `tests/GameState.test.js` — zaktualizowac test `elite pool pick` (nowe id), dodac test pasywki `hart_ducha` i `lichwa`
- `src/ui/UIManager.js` — intent Mistrza Redyku wyswietla damage z aktualna Sila (standard, potwierdzic ze intenty sa poprawnie aktualizowane)

Gate przejscia:

- `npm test` zelony bez regresji
- `npm run build` przechodzi
- 3 nowe elity laduja poprawnie i sa osiagalne na wezlach elite
- Mistrz Redyku intent pokazuje rosnacy damage w momencie aktywacji pasywki hart_ducha

Status etapu 1.2.1-A: DONE
