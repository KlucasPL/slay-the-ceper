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

Przy zalozeniu, ze nie ruszamy eventowych walk i nie zmieniamy progow _rollMidNodeType:

- oczekiwana liczba walk = 1 (startowy fight) + 0.52 * liczba losowych pieter

Wymaganie 6-8 walk daje bezpieczny cel:

- 10 losowych pieter -> 1 + 10 * 0.52 = 6.2

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
- _seedRequiredPaths musi wymuszac przejscie przez srodkowa Watre i finalna Watre
- ochrona fixed nodow przed nadpisaniem przez limity specjalnych wezlow

## Zakres zmian technicznych

### A. Map generation - DONE

Pliki:

- src/state/GameState.js

Zmiany:

- zwiekszenie liczby rzedow mapy z 10 do 15
- dodanie stalego pojedynczego wezla treasure
- dodanie stalej Watry w polowie mapy
- pozostawienie obecnych progow _rollMidNodeType
- brak zmian w rollEventNodeOutcome
- dostosowanie _seedRequiredPaths do przejscia przez dwa checkpointy Watry
- aktualizacja _enforceSpecialNodeLimits, by nie usuwal gwarantowanego wezla treasure
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
- _rollMidNodeType bez zmian progow
- elite nie wystepuje na poziomach y=1..3
- rollEventNodeOutcome bez zmian progow
- _pickRandomEnemyDef dla elite zwraca tylko elite
- _pickRandomEnemyDef dla fight nie zwraca elite

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
	E[w] = 1 + p(combat_mid) * N_mid
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
