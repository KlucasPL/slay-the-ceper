# Patch 1.2.2 - Plan Eventu "Hazard na Kartonie"

## Cel patcha

Patch 1.2.2 ma dodac pelny modul event -> walka dla Act I (Krupowki), ale bez rozwalania ekonomii runa i bez dominujacego "autopicka".

Zakres:

- nowy event `event_hazard_karton`
- 2 nowe karty (`spostrzegawczosc`, `pocieszenie`)
- 1 nowa pamiatka (`zasluzony_portfel`)
- 1 nowy przeciwnik fazowany (`naganiacze_duo`)
- pelna integracja nagrod i flow wydarzenia

## Review balansu (stan po ostatnich poprawkach)

## Werdykt

Proponowany zestaw jest **akceptowalny balansowo** i wyraznie lepszy od poprzedniej wersji.

Najwazniejsze plusy:

- opcja 3 nie daje juz "golej" gotowki z eventu przed walka
- relikt jest oslabiony do +6 (zamiast +10), wiec snowball jest mniejszy
- tuning duetu naganiaczy zmniejsza ryzyko naglego wipe'a

Ryzyka, ktore nadal trzeba pilnowac telemetrycznie po wdrozeniu:

- ekonomia opcji hazardowej jest lekko dodatnia (EV dutkow > 0)
- relikt +6 po zwyciestwie moze byc bardzo mocny przy dlugich runach z wysoka win-rate

## Ocena opcji eventu

### Opcja 1 - "Wchodze w to!" (20 koszt, 50/50, wygrana 45)

Ekonomia:

- win: +25 netto
- loss: -20 netto + karta Pocieszenie
- EV dutkow: `0.5 * 25 + 0.5 * (-20) = +2.5`

Wniosek:

- delikatnie "pro-gracz", ale miesci sie w fantasy hazardu
- rekomendacja: zostawic liczby bez zmian na start 1.2.2 i monitorowac

### Opcja 2 - "Obserwuj z boku"

Wniosek:

- stabilna opcja utility, nie daje bezposredniego skoku ekonomii
- dobra jako bezpieczny wybor

### Opcja 3 - "Wywroc im stolik"

Wniosek:

- to ryzyko bojowe za relikt ekonomiczny (zdrowy trade)
- brak natychmiastowej gotowki przed walka jest poprawny
- opcja nadal moze byc czesto najlepsza dla mocnych talii, ale juz nie jest darmowym autopickiem

## Finalne parametry 1.2.2 (zatwierdzone do wdrozenia)

## Karty i pamiatka

1. `zasluzony_portfel` (Relikt)

- emoji: `💰`
- efekt: `+6 dutkow po kazdym zwyciestwie w walce niebedacej walka eventowa`

2. `spostrzegawczosc` (Rare Skill, koszt 0, exhaust)

- emoji: `👁️`
- efekt: `Dobierz 1. Jesli dobrana karta to Attack, nastepny atak w tej turze dostaje +2 obrazen.`

3. `pocieszenie` (Status, koszt 0, exhaust)

- emoji: `🩹`
- efekt: `Dobierz 1.`

## Event `event_hazard_karton`

Wstep:

- klimat shell game na kartonie po bananach

Opcje:

1. "Wchodze w to!" (koszt 20)

- 50% win / 50% loss
- win: `+45 dutkow`
- loss: dodaj `pocieszenie`

2. "Obserwuj z boku"

- dodaj `spostrzegawczosc`

3. "Wywroc im stolik"

- start walki z `naganiacze_duo`
- po zwyciestwie: `zasluzony_portfel`

## Przeciwnik `naganiacze_duo`

Model:

- pojedynczy obiekt enemy, 2 fazy po HP
- HP total: 80

Faza 1 (80 -> 41):

- `Podpuszczanie`: 6 dmg + 1 weak
- `Szybkie Palce`: 2x4 dmg, przy nieblokowanych obrazeniach kradnie 2 dutki

Transition (pierwszy raz przy HP <= 40):

- czysci debuffy
- +2 strength
- +8 block
- tekst narracyjny: "Seba ucieka! Mati wpada w furie!"

Faza 2 (40 -> 0):

- `Desperackie Ciecie`: 3x3 dmg
- `Unik w Tlumie`: +12 block + 1 unik

## Integracja techniczna

## 1. Rozroznienie typu walki dla nagrod ekonomicznych

Dodac znacznik kontekstu walki, np.:

- `battleContext: 'map' | 'event' | 'debug'`

Przy starcie walki z eventu ustawic `battleContext = 'event'`.
Przy standardowych walkach mapowych ustawic `battleContext = 'map'`.

Relikt `zasluzony_portfel` ma trigger tylko gdy:

- zwyciestwo w walce
- `battleContext !== 'event'`

## 2. Hook nagrody po walce

W jednym centralnym miejscu po zwyciestwie (najlepiej tam, gdzie liczone sa Dutki za bitke) dodac:

- jesli gracz ma `zasluzony_portfel` i walka nie-eventowa: `addDutki(6)`

## 3. Dzialanie `spostrzegawczosc`

Najbezpieczniejsza implementacja pod obecny silnik:

- po dobraniu karty sprawdzic jej typ
- jesli to Attack: ustawic tymczasowy bonus `+2` na najblizszy atak w tej turze
- bonus konsumuje sie po pierwszym ataku

## 4. Unik u `naganiacze_duo`

Wprowadzic prosty i czytelny model:

- `enemy.evasionCharges` (int)
- gdy `> 0`, pierwszy przychodzacy atak gracza jest anulowany, charge --
- UI intencji/statusu pokazuje aktywny unik

## 5. Event flow i reward flow

Opcja 3 musi odpalic walke eventowa i po zwyciestwie nadac relikt.
Nie dawac dodatkowej stalej gotowki z eventu poza standardowym lootem bojowym.

## Kryteria akceptacji

1. Event zawsze pokazuje 3 opcje z poprawnymi konsekwencjami.
2. Opcja 1 poprawnie robi coin-flip 50/50 i daje odpowiedni outcome.
3. Opcja 2 dodaje `spostrzegawczosc` do talii.
4. Opcja 3 uruchamia walke z `naganiacze_duo` i po wygranej daje relikt.
5. `zasluzony_portfel` daje +6 tylko po zwyciestwach w walkach nie-eventowych.
6. `naganiacze_duo` poprawnie przechodzi w faze 2 przy HP <= 40 tylko raz.
7. Lint i testy przechodza po wdrozeniu.

## Test plan (do dopisania/rozszerzenia)

- test EV i branchingu opcji 1 (mock random)
- test dodania kart z opcji 1/2
- test triggera reliktu tylko dla walk nie-eventowych
- test transitionu fazy `naganiacze_duo`
- test kradziezy dutkow przy nieblokowanych hitach
- test uniku (anuluje tylko nastepny atak)

## Telemetria po wdrozeniu (balans)

Monitorowac po wydaniu:

- pick rate opcji 1/2/3
- win rate po opcji 3
- srednie dutki na floor po zdobyciu reliktu
- odsetek runow, gdzie relikt jest top-1 kontribucja ekonomiczna

Jesli `zasluzony_portfel` bedzie dominowal ekonomie:

- fallback nerf: `+6 -> +5`.

## Status realizacji (audit)

### Zakres patcha

- DONE: nowy event `event_hazard_karton`
- DONE: 2 nowe karty (`spostrzegawczosc`, `pocieszenie`)
- DONE: 1 nowa pamiatka (`zasluzony_portfel`)
- DONE: 1 nowy przeciwnik fazowany (`naganiacze_duo`)
- DONE: pelna integracja nagrod i flow wydarzenia

### Integracja techniczna

- DONE: `battleContext: 'map' | 'event' | 'debug'` i poprawne ustawianie kontekstu
- DONE: trigger `zasluzony_portfel` tylko dla zwyciestw poza walkami eventowymi
- DONE: centralny hook +6 dutkow po zwyciestwie nie-eventowym
- DONE: `spostrzegawczosc` daje tymczasowy bonus +2 do najblizszego ataku po dobraniu Attack
- DONE: model uniku `enemy.evasionCharges` dla `naganiacze_duo`
- DONE: opcja 3 uruchamia walke eventowa, daje relikt i nie dodaje stalej gotowki poza standardowym lootem

### Kryteria akceptacji

- DONE: Event pokazuje 3 opcje z konsekwencjami
- DONE: Opcja 1 ma coin-flip 50/50 i poprawne outcome
- DONE: Opcja 2 dodaje `spostrzegawczosc`
- DONE: Opcja 3 uruchamia walke z `naganiacze_duo` i po wygranej daje relikt
- DONE: `zasluzony_portfel` daje +6 tylko po zwyciestwach nie-eventowych
- DONE: `naganiacze_duo` przechodzi do fazy 2 przy HP <= 40 tylko raz
- DONE: lint i testy przechodza po wdrozeniu

### Test plan

- DONE: branching opcji 1 (mock random)
- DONE: dodawanie kart z opcji 1/2
- DONE: trigger reliktu tylko dla walk nie-eventowych
- DONE: transition fazy `naganiacze_duo`
- DONE: kradziez dutkow przy nieblokowanych hitach
- DONE: unik anuluje nastepny atak
- NOT DONE: osobny test EV (wartosc oczekiwana liczona statystycznie) jako dedykowany test jednostkowy

### Dodatkowo poza pierwotnym planem

- DONE: eventowe karty/pamiatki sa wyciete ze sklepu i z globalnych nagrod
- DONE: po elicie jest sekwencja pamiatka -> wybor karty
- DONE: anty-powtorka eventow (ten sam event nie wpada 2x pod rzad)
- DONE: tuning mapy do srednio 6-8 walk/run (potwierdzone Monte Carlo)

### Poza zakresem implementacji kodu

- NOT DONE: telemetria po wydaniu (pick rate, win rate, srednie dutki, top kontribucja reliktu) - to wymaga danych live po deployu
