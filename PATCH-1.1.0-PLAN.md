# Patch 1.1.0 - Plan Balansu

## Cel patcha

Patch `1.1.0` powinien uporządkować balans całej gry, a nie tylko punktowo osłabiać pojedyncze karty lub bossów.

Główne cele:

- wyrównać siłę dwóch ścieżek wygrywania: obrażenia HP i `Rachunek`
- zmniejszyć wariancję runów opartych o pojedyncze relikty lub pojedyncze rare payoffy
- wygładzić krzywą trudności między early game, midgame i finałem
- poprawić sens decyzji na mapie, w sklepie i po rewardach
- przygotować grunt pod dalszy rozwój puli kart, reliktów i wydarzeń

## Aktualne problemy do rozwiązania

### 1. `Rachunek` daje zbyt dużo naraz

Obecnie build rachunkowy:

- może kończyć walki bez klasycznego DPS checka
- dostaje dodatkowe Dutki za bankructwo
- skaluje się przez relikty i ekonomię
- omija część presji defensywnej, którą muszą znosić buildy atakujące HP

Efekt: ścieżka `Rachunku` bywa jednocześnie bezpieczniejsza i bardziej opłacalna niż zwykłe bicie w HP.

### 2. Rare rewardy wzmacniają wąską metę

Rare karty pojawiają się teraz częściej w rewardach po bitce, ale pula rare jest nadal mała. To zwiększa częstotliwość tych samych mocnych payoffów zamiast realnie poszerzać możliwości budowy talii.

### 3. Za mało stabilnych kart środka

Pula niestarterowych kart jest mała i mocno przechylona w stronę skilli. Brakuje kart, które wzmacniają uczciwy, regularny plan gry:

- stały damage
- stabilna obrona
- miękki card flow bez eksplozji comb

### 4. Midgame ma zbyt nierówny próg trudności

Wczesne walki są relatywnie łagodne, ale `Parkingowy` jest wyraźnym skokiem trudności przez limit 3 kart na turę, wysokie HP i presję na plan tury. Finał jest już po tym kolejnym progiem.

### 5. Relikty zbyt często przejmują cały run

Kilka reliktów bardzo mocno steruje wynikiem gry:

- `flaszka_sliwowicy`
- `pocztowka_giewont`
- `dzwonek_owcy`
- `papryczka_marka`
- `lustrzane_gogle`

To są dobre fantasy payoffs, ale obecnie potrafią zbyt często zastępować sensowne budowanie talii.

### 6. Mapa ma za dużo losowości względem wielkości systemu

Mapa ma dużo nodów niebojowych i wysoki udział eventów, a w grze jest na razie tylko jedno wydarzenie. To sprawia, że struktura runa bywa bardziej losowana niż świadomie budowana.

## Docelowe zasady balansu dla 1.1.0

### Ścieżki zwycięstwa

- build HP i build `Rachunku` mają być porównywalnie skuteczne
- build `Rachunku` nie powinien być bardziej opłacalny ekonomicznie od builda obrażeniowego
- build defensywny powinien móc dojść do finału bez idealnej kombinacji reliktów

### Rewardy i sklepy

- reward po bitce ma częściej popychać build w ciekawą stronę, ale nie powinien zbyt regularnie dostarczać gotowego payoffu
- sklep ma wspierać decyzje, a nie gwarantować domknięcie planu w każdym sensownym runie

### Trudność runa

- early game ma uczyć mechanik i zostawiać margines błędu
- midgame ma sprawdzać jakość deckbuildingu, ale bez nagłych ścian
- finał ma karać brak planu, a nie brak jednej konkretnej synergii

## Propozycje zmian do patcha 1.1.0

## Pakiet A - Ekonomia i `Rachunek`

### A1. Osłabić premię za bankructwo

Aktualnie bankructwo daje dodatkowe Dutki zależne od wartości `Rachunku`.

Propozycja:

- zmiana bonusu z `floor(rachunek / 2)` na `floor(rachunek / 3)`

Alternatywa bardziej bezpieczna:

- `floor(rachunek / 3)`, ale z limitem maksymalnie `+25 Dutków`

Oczekiwany efekt:

- build `Rachunku` dalej wygrywa po swojemu
- ekonomia runa nie odjeżdża tak mocno po kilku udanych bankructwach

### A2. Ograniczyć siłę pakietu `Rachunku`

Propozycja:

- zostawić `Paragon za Gofra` jako karta `PRZEPADO`
- przetestować zmianę `Podatek Klimatyczny` z kosztu `2` na `3`
- rozważyć obniżenie bonusu z `Pękniętego Liczydła` z `3` do `2` HP za tick `Rachunku`

Oczekiwany efekt:

- build ekonomiczny nadal istnieje
- mniej automatycznych snowballi po dobraniu 2-3 elementów pakietu

### A3. Utrzymać wyjątek Baby, ale wzmocnić kontrę systemową na `Rachunek`

Propozycja:

- nie dodawać odporności na `Rachunek` kolejnym zwykłym przeciwnikom
- zamiast tego dać jednemu z bossów lub jednej elicie łagodną kontrę, np. częściową redukcję nakładanego `Rachunku`

Cel:

- utrzymać różnorodność walk
- nie pozwolić, by `Rachunek` był równie dobry w każdym matchupie

## Pakiet B - Rewardy i pula kart

### B1. Nie buffować dalej rare rewardów samymi wagami

Po ostatniej zmianie reward rare już pojawia się częściej. Kolejny krok nie powinien polegać na dalszym podnoszeniu szans, tylko na poszerzeniu puli kart.

Decyzja na `1.1.0`:

- zostawić obecne wagi rewardów bez dalszego podbijania
- dołożyć nowe karty, żeby reward rare miał większą różnorodność

### B2. Dodać nowe karty common i uncommon pod stabilne archetypy

Minimalny cel:

- `2` nowe common
- `2` nowe uncommon
- `1-2` nowe rare

Braki, które warto uzupełnić:

- common attack z dobrym tempem, bez dodatkowej ekonomii
- common skill obronny lepszy od `Gąsiora`, ale bez skoku mocy
- uncommon karta draw/filter bez pełnego combogennego wybuchu
- uncommon attack, który skaluje się od Gardy albo od liczby zagranych ataków
- rare payoff dla archetypu nieopartego o `Rachunek`

### B3. Zmniejszyć skupienie rare poola na pojedynczych bombach

Rare karty powinny pełnić trzy różne role:

- payoff ofensywny
- payoff ekonomiczny lub statusowy
- payoff defensywno-kontrolny

Obecnie rare pool jest zbyt krótki, więc łatwo powtarza te same scenariusze runa.

## Pakiet C - Midgame i roster przeciwników

### C1. Wygładzić `Parkingowego`

`Parkingowy` wygląda dziś jak wyraźna ściana dla talii, które grają dużo tanich kart lub potrzebują setupu.

Propozycja testowa:

- HP `110 -> 100`
- albo zostawić HP, ale zmienić pasywkę z limitu `3` kart na limit `4` kart

Rekomendacja:

- najpierw test z limitem `4` kart

Powód:

- karta zachowuje swoją tożsamość przeciwnika karzącego spam
- ale przestaje być aż tak twardym hard counterem dla połowy talii

### C2. Delikatnie dociągnąć early game

Wczesne walki nie powinny być darmowe, bo wtedy zbyt łatwo wejść w midgame z pełnym HP i nadmiarem Dutków.

Propozycja:

- lekko podnieść presję `Busiarza` albo `Influencerki`
- nie przez czysty damage, tylko przez bardziej konsekwentne debuffy lub tempo

Przykład:

- `Influencerka`: lepszy uptime spamu/statusów
- `Busiarz`: mniejszy heal, ale wyraźniej wymusza obronę

### C3. Zmniejszyć różnicę między bossami

Bossowie nie muszą być identyczni, ale powinni testować podobny poziom gotowości decku.

Propozycja:

- dać `Fiakierowi` miękką ochronę przed debuffami lub `Rachunkiem`
- albo lekko zdjąć część frustracji z `Misia`, jeśli ma pozostać głównym bossem anty-statusowym

Cel:

- losowy finał ma zmieniać charakter walki, ale nie całkowicie zmieniać poziom trudności dla konkretnego archetypu

## Pakiet D - Relikty

### D1. Uporządkować najmocniejsze relikty

Relikty do przeglądu:

- `flaszka_sliwowicy`
- `pocztowka_giewont`
- `dzwonek_owcy`
- `papryczka_marka`
- `lustrzane_gogle`

Rekomendacje testowe:

- `Flaszka`: sprawdzić `+5 Siły -> +4 Siły`
- `Pocztówka`: zostawić fantasy, ale pilnować interakcji z najlepszymi kartami `PRZEPADO`
- `Dzwonek`: bardzo mocny, ale ciekawy; nie ruszać bez danych z testów runów
- `Papryczka`: sprawdzić, czy kara `-2 HP` realnie równoważy bonus
- `Lustrzane Gogle`: ocenić po poszerzeniu puli kart obronnych i Lansowych

### D2. Mniej reliktów "wygrywających run samodzielnie"

Docelowo relikt powinien:

- wzmacniać plan gracza
- otwierać nową linię decyzji
- nie zastępować sensownego deckbuildingu

To oznacza, że w `1.1.0` warto bardziej tonować skrajne piki mocy niż buffować słabsze relikty.

## Pakiet E - Mapa, eventy i ekonomia runa

### E1. Obniżyć udział eventów albo dodać nowe eventy

Aktualny udział `event` na mapie jest duży względem tego, że istnieje tylko jedno wydarzenie.

Opcja bezpieczna na `1.1.0`:

- zmniejszyć szansę na `event` z `30%` do `20%`

Opcja rozwojowa:

- zostawić `30%`, ale dodać przynajmniej `2` nowe eventy

Rekomendacja:

- jeśli `1.1.0` ma być głównie patchem balansowym, wybrać wariant `20%`

### E2. Ostudzić ekonomię sklepu

Obecnie przy sensownym runie stosunkowo łatwo zbiera się Dutki na dobre zakupy.

Propozycje do testów:

- standardowa nagroda po bitce: `30-40 -> 28-36`
- zostawić eventowe wydatki jako główne sinki
- nie podnosić jeszcze cen kart common i uncommon

Cel:

- sklep ma być decyzją, a nie prawie automatycznym upgrade'em runa

## Proponowany zakres patcha 1.1.0

## Zakres minimalny

- osłabienie premii za bankructwo
- lekkie przytemperowanie pakietu `Rachunku`
- wygładzenie `Parkingowego`
- obniżenie udziału eventów na mapie albo dodanie nowych eventów
- 2-3 nowe karty pod stabilniejsze archetypy

## Zakres rekomendowany

- wszystko z zakresu minimalnego
- pełny przegląd 4-5 najmocniejszych reliktów
- 5-6 nowych kart w różnych rzadkościach
- lepsze rozróżnienie ról rare payoffów
- testowy pass po obu bossach pod różne archetypy

## Zakres ambitny

- wszystko z zakresu rekomendowanego
- 2 nowe eventy
- 1 nowy przeciwnik midgame albo pełne strojenie obecnych encounterów
- przygotowanie gry pod drugi grywalny archetyp postaci w kolejnym patchu

## Kolejność wdrażania

1. Ekonomia `Rachunku` i bankructwa
2. Rewardy i pula kart
3. Midgame i `Parkingowy`
4. Mapa i częstotliwość eventów
5. Relikty high-impact
6. Finałowe strojenie bossów po całej reszcie

## Plan testów

### Testy jednostkowe

- bankructwo daje nową, obniżoną premię Dutków
- zmienione karty `Rachunku` zachowują prawidłowe interakcje
- `Parkingowy` dalej ogranicza tempo, ale nie hard-lockuje łatwo tury
- mapa generuje nowy docelowy rozkład eventów
- nowe karty mają testy logiki i interakcji z reliktami/statusami

### Testy ręczne

- run ofensywny bez `Rachunku`
- run defensywny z Gardą
- run Lansowy
- run `Rachunku`
- boss `Misiek` i boss `Fiakier` dla każdego z powyższych archetypów
- test sklepu przy przeciętnym i mocnym income

### Kryteria sukcesu

- build `Rachunku` nadal jest grywalny, ale nie dominuje ekonomicznie
- rewardy nie zamykają zbyt często runa pojedynczym rare pickiem
- midgame jest trudniejsze, ale bardziej uczciwe
- finał mniej zależy od tego, którego bossa wylosowano pod konkretną talię

## Kandydaci do release notes 1.1.0

- `⚖️ GENERALNY REBALANS: Uporządkowano ekonomię runa, rewardy i tempo progresji.`
- `🧾 RACHUNEK: Osłabiono snowball buildów bankrutujących przeciwników.`
- `🎴 KARTY: Rozszerzono pulę kart, żeby więcej archetypów miało sensowny payoff.`
- `🚧 MIDGAME: Wygładzono najostrzejsze skoki trudności między zwykłymi walkami a finałem.`
- `❓ MAPA I EVENTY: Lepszy rozkład nodów i sensowniejsza wartość decyzji poza walką.`

## Rekomendacja końcowa

Patch `1.1.0` nie powinien być kolejnym małym hotfixem. Najlepiej potraktować go jako pierwszy duży patch systemowy:

- mniej snowballa ekonomicznego
- więcej stabilnych kart środka
- gładsza krzywa trudności
- bardziej uczciwy losowy finał

Jeśli trzeba ciąć zakres, nie warto zaczynać od kolejnych nerfów bossów. Najpierw trzeba uporządkować `Rachunek`, rewardy, mapę i midgame.