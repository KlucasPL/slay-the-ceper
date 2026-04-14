# Patch 1.3.0 - Plan "Wyprawka od Maryny"

## Cel patcha

Patch 1.3.0 ma dodac nowy etap startu runa: wybor jednej z 3 losowych wyprawek od Maryny (z puli 7), inspirowany opening boons w Slay the Spire.

Glowne cele:

- dodac mocny i klimatyczny start runa bez rozwalania balansu early game
- zaoferowac 7 mechanicznie roznych wyprawek, ktore promuja rozne style gry
- utrzymac wybor bez autopickow (po nerfach)
- zintegrowac nowy ekran wyboru z obecnym flow tytul -> run -> mapa
- pokryc logike testami jednostkowymi (bez testow DOM)

## Zakres patcha

W zakresie 1.3.0:

- nowy modul danych wyprawek Maryny
- stan runa rozszerzony o wybory i flagi Maryny
- nowy flow startu runa: losowanie 3 z 7, wybor 1, dopiero potem start mapy
- hooki efektow wyprawki w istniejacym cyklu (start walki, zwyciestwo, sklep)
- nowy ekran/overlay wyboru (UI + wiring)
- testy logiki wyboru, aplikacji i wygaszania efektow

Poza zakresem 1.3.0:

- telemetria online pick-rate i win-rate (do obserwacji po wydaniu)
- rozbudowa puli kart/pamiatek pod wyprawki (moze byc 1.3.x)

## Finalna pula 7 wyprawek (po nerfach)

1. Mokra Sciera Maryny

- flavor: "Wstawaj. Najpierw zimny oklad, potem wielkie czyny."
- efekt: +12 max Krzepy i +12 Krzepy (do nowego limitu)

2. Kiesa na Pierwszy Dzien

- flavor: "Masz, ale nie przewal wszystkiego na jarmarku."
- efekt: +80 Dutkow od razu; po pierwszym zwyciestwie nie-eventowym +20 Dutkow (jednorazowo)

3. Przeglad Plecaka Maryny

- flavor: "Ten zlom wyrzuc, to ci zostawiam."
- efekt: usun 1 losowa karte starter z talii; dodaj 1 losowa karte uncommon (bez eventOnly/tutorialOnly)

4. Sloik Rosolu na Droge

- flavor: "Na trzy pierwsze bitki starczy ci mocy i ciepla."
- efekt: przez pierwsze 3 walki na start: +6 Garda i +1 Sila

5. Zloty Rozaniec Maryny

- flavor: "Pomódl się i bij dwa razy mocniej!"
- efekt: na starcie kazdej walki ustaw next_double = true

6. Lista Zakupow

- flavor: "Kup madrze, nie jak ceper na Krupowkach."
- efekt: pierwszy sklep: karty -30%; pierwsze usuniecie karty w runie za 0 Dutkow (jednorazowo)

7. Tajny Składnik Maryny

- flavor: "Najpierw ich oslabi, potem dobij."
- efekt: na starcie kazdej walki wrog dostaje 1 Weak i 1 Fragile

## Ocena balansu po nerfach

Werdykt: zestaw jest mocny, ale juz bez oczywistych autopickow.

Najwieksza wartosc strategiczna:

- ekonomia: Kiesa na Pierwszy Dzien, Lista Zakupow
- bezpieczenstwo runa: Mokra Sciera, Sloik Rosolu
- tempo walk: Zloty Rozaniec, Slubowanie
- jakosc talii: Przeglad Plecaka

Ryzyka, ktore trzeba monitorowac po wydaniu:

- czy Lista Zakupow nie dominuje na trasach z wczesnym sklepem
- czy Rozaniec nie daje zbyt wysokiej stabilnosci burstu na bossach
- czy Przeglad Plecaka nie ma za wysokiego win-rate przy dobrych trafieniach uncommon

## Architektura techniczna

### A. Dane wyprawek (src/data/) - TODO

Plik:

- src/data/marynaBoons.js

Zawartosc:

- typedef `MarynaBoonDef`
- `marynaBoonLibrary` (7 wpisow)
- helper wyboru losowych 3 unikalnych wyprawek

Zasady:

- same dane i lekkie helpery (bez DOM)
- efekty opisane jako klucze/hooki + parametry (nie anonimowe funkcje UI)

### B. Stan runa i hooki logiki (src/state/GameState.js) - TODO

Dodac sekcje stanu, np.:

- `maryna = { offeredIds: [], pickedId: null, flags: {}, counters: {} }`

Wymagane metody:

- `rollMarynaChoices(count = 3)`
- `pickMarynaBoon(boonId)`
- `applyMarynaPickImmediateEffects()`
- hook startu walki dla wyprawek czasowych/stalych
- hook zwyciestwa dla bonusu jednorazowego (Kiesa)
- hook sklepu dla rabatu/free removal (Lista Zakupow)

Wymagane resety:

- pelny reset sekcji `maryna` w `resetForNewRun()`

Wymagania kompatybilnosci:

- nie lamac tutorial flow
- nie lamac debug/new run flow

### C. Integracja flow startu runa (src/ui/UIManager.js) - TODO

Obecny flow:

- title start -> resetForNewRun -> mapa

Nowy flow:

- title start -> resetForNewRun -> ekran Maryny -> wybor 1 z 3 -> mapa

Wymagane kroki:

- po `_handleTitleStart()` wywolac losowanie wyprawek
- pokazac overlay wyboru
- po kliknieciu wyprawki:
  - zapis wyboru w stanie
  - aplikacja efektow natychmiastowych
  - zamkniecie overlay
  - przejscie do mapy

### D. UI ekranu wyboru (index.html + src/styles/layout.css + UIManager wiring) - TODO

Elementy:

- osobny overlay (jak pozostale ekrany)
- naglowek narracyjny Maryny
- 3 karty wyboru (name + flavor + efekt mechaniczny)
- brak opcji skip

Wymogi UX:

- czytelne na mobile
- obsluga klawiatury i focus
- blokada klikow poza overlay podczas wyboru

### E. Rozszerzenie release notes (src/data/releaseNotes.js) - TODO

Dodac wpis 1.3.0 z najwazniejszymi zmianami:

- nowy system "Wyprawka od Maryny"
- 7 wyprawek, losowanie 3, wybor 1
- krotka wzmianka o balansie po nerfach

## Kryteria akceptacji

1. Start nowego runa zawsze pokazuje wybor 3 unikalnych wyprawek z puli 7.
2. Gracz musi wybrac 1 wyprawke (brak skip), po czym run przechodzi dalej.
3. Efekty natychmiastowe dzialaja od razu po wyborze.
4. Efekty czasowe i jednorazowe dzialaja we wlasciwych hookach i wygaszaja sie poprawnie.
5. Reset runa czyści stan Maryny i nie przenosi flag do kolejnego runa.
6. Tutorial nie uruchamia ekranu wyboru Maryny.
7. Lint, testy i build przechodza bez regresji.

## Plan testow

### Testy jednostkowe (GameState)

- roll 3/7 bez duplikatow
- pick boona zapisuje `pickedId` i blokuje drugi pick
- Mokra Sciera: poprawny wzrost maxHp i hp
- Kiesa: +80 od razu i +20 tylko raz po pierwszym zwyciestwie nie-eventowym
- Przeglad Plecaka: usuwa starter i dodaje 1 uncommon
- Rosol: dziala tylko przez 3 pierwsze walki
- Rozaniec: next_double ustawiany na starcie kazdej walki
- Slubowanie: debuffy enemy na starcie walki
- Lista Zakupow: rabat tylko w pierwszym sklepie; free removal tylko raz
- resetForNewRun czyści caly stan Maryny

### Testy integracyjne flow (UIManager)

- title start otwiera overlay Maryny przed mapa
- wybor karty zamyka overlay i odpala mape
- tutorial start pomija overlay Maryny

## Kolejnosc wdrozenia (obowiazkowa)

1. Etap 1 - Dane wyprawek i kontrakt stanu (A + czesc B)

Gate:

- testy jednostkowe losowania/picka przechodza

2. Etap 2 - Hooki efektow w GameState (B)

Gate:

- testy efektow 7 wyprawek przechodza
- brak regresji w istniejacych testach combat/economy

3. Etap 3 - UI overlay i integracja flow startu (C + D)

Gate:

- poprawny przeplyw title -> Maryna -> mapa
- tutorial bez zmian

4. Etap 4 - Release notes + finalna walidacja (E)

Gate:

- `npm run lint`
- `npm run format:check`
- `npm test`
- `npm run build`

## Ryzyka i mitigacje

Ryzyko:

- jedna wyprawka zacznie dominowac meta wyborow

Mitigacja:

- przygotowany szybki tuning wartosci w 1.3.1 (parametryzacja liczb w danych)

Ryzyko:

- konflikty z istniejacymi reliktami/start-battle hookami

Mitigacja:

- trzymac efekty Maryny w osobnych, jawnych blokach kodu i testach konfliktow

Ryzyko:

- przeciaganie flow startowego przez dodatkowy ekran

Mitigacja:

- prosty, szybki UX (jedno klikniecie wyboru, bez dodatkowych krokow)
