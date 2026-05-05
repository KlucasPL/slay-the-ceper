# Patch 1.1.0 - Plan Balansu

## Cel patcha

Patch `1.1.0` powinien uporządkować balans całej gry, a nie tylko punktowo osłabiać pojedyncze karty lub bossów.

Główne cele:

- wyrównać siłę dwóch ścieżek wygrywania: obrażenia HP i `Rachunek`
- zmniejszyć wariancję runów opartych o pojedyncze pamiątki lub pojedyncze rare payoffy
- wygładzić krzywą trudności między early game, midgame i finałem
- poprawić sens decyzji na mapie, w sklepie i po rewardach
- przygotować grunt pod dalszy rozwój puli kart, pamiątek i wydarzeń

## Aktualne problemy do rozwiązania

### 1. `Rachunek` daje zbyt dużo naraz

Obecnie build rachunkowy:

- może kończyć walki bez klasycznego DPS checka
- dostaje dodatkowe Dutki za bankructwo
- skaluje się przez pamiątki i ekonomię
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

### 5. Pamiątki zbyt często przejmują cały run

Kilka pamiątek bardzo mocno steruje wynikiem gry:

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
- build defensywny powinien móc dojść do finału bez idealnej kombinacji pamiątek

### Rewardy i sklepy

- reward po bitce ma częściej popychać build w ciekawą stronę, ale nie powinien zbyt regularnie dostarczać gotowego payoffu
- sklep ma wspierać decyzje, a nie gwarantować domknięcie planu w każdym sensownym runie

### Trudność runa

- early game ma uczyć mechanik i zostawiać margines błędu
- midgame ma sprawdzać jakość deckbuildingu, ale bez nagłych ścian
- finał ma karać brak planu, a nie brak jednej konkretnej synergii

## Propozycje zmian do patcha 1.1.0

## Pakiet A - Ekonomia i `Rachunek`

### A1. Osłabić premię za bankructwo — **DONE**

Aktualnie bankructwo daje dodatkowe Dutki zależne od wartości `Rachunku`.

Propozycja:

- zmiana bonusu z `floor(rachunek / 2)` na `floor(rachunek / 3)`

Alternatywa bardziej bezpieczna:

- `floor(rachunek / 3)`, ale z limitem maksymalnie `+25 Dutków`

Wdrożone w kodzie:

- bonus bankructwa: `Math.min(25, Math.floor(enemy.rachunek / 3))`

Oczekiwany efekt:

- build `Rachunku` dalej wygrywa po swojemu
- ekonomia runa nie odjeżdża tak mocno po kilku udanych bankructwach

### A2. Ograniczyć siłę pakietu `Rachunku` — **DONE**

Propozycja:

- zostawić `Paragon za Gofra` jako karta `PRZEPADO`
- przetestować zmianę `Podatek Klimatyczny` z kosztu `2` na `3`
- rozważyć obniżenie bonusu z `Pękniętego Liczydła` z `3` do `2` HP za tick `Rachunku`

Wdrożone w kodzie:

- `Paragon za Gofra`: `PRZEPADO` (bez zmian względem poprzedniej wersji)
- `Podatek Klimatyczny`: koszt `3`
- `Pęknięte Liczydło`: efekt zmieniony na leczenie gracza `+2 HP` przy nałożeniu `Rachunku`

Oczekiwany efekt:

- build ekonomiczny nadal istnieje
- mniej automatycznych snowballi po dobraniu 2-3 elementów pakietu

### A3. Utrzymać wyjątek Baby, ale wzmocnić kontrę systemową na `Rachunek` — **DONE**

Propozycja:

- nie dodawać odporności na `Rachunek` kolejnym zwykłym przeciwnikom
- zamiast tego dać jednemu z bossów lub jednej elicie łagodną kontrę, np. częściową redukcję nakładanego `Rachunku`

Cel:

- utrzymać różnorodność walk
- nie pozwolić, by `Rachunek` był równie dobry w każdym matchupie

Wdrożone w kodzie:

- `GameState.addEnemyRachunek(amount)`: dla `enemy.id === 'fiakier'` nakłada tylko **70%** otrzymanego `Rachunku` (`floor`, minimum `1`)
- `GameState.getCombatSpecialStatuses()`: dodano badge Fiakiera **Twardy Taryfikator (70%)** z tooltipem wyjaśniającym mechanikę
- Testy: 3 nowe przypadki jednostkowe (redukcja 70%, minimum 1, brak bankructwa po pojedynczym `+10` na `10 HP`)

## Pakiet B - Rewardy i pula kart

### B1. Nie buffować dalej rare rewardów samymi wagami — **DONE**

Po ostatniej zmianie reward rare już pojawia się częściej. Kolejny krok nie powinien polegać na dalszym podnoszeniu szans, tylko na poszerzeniu puli kart.

Decyzja na `1.1.0`:

- zostawić obecne wagi rewardów bez dalszego podbijania
- dołożyć nowe karty, żeby reward rare miał większą różnorodność

Wdrożone w kodzie:

- wagi rewardów nie były dalej podbijane
- nowa pula kart została rozszerzona (pakiet B2), co zwiększa realną różnorodność rewardów

### B2. Dodać nowe karty common i uncommon pod stabilne archetypy — **DONE**

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

Wdrożone w kodzie (6 kart):

- Common: `pchniecie_ciupaga`, `barchanowe_gacie`
- Uncommon: `szukanie_okazji`, `lodolamacz`
- Rare: `duma_podhala`, `zemsta_gorala`

### B3. Zmniejszyć skupienie rare poola na pojedynczych bombach — **DONE**

Rare karty powinny pełnić trzy różne role:

- payoff ofensywny
- payoff ekonomiczny lub statusowy
- payoff defensywno-kontrolny

Obecnie rare pool jest zbyt krótki, więc łatwo powtarza te same scenariusze runa.

Wdrożone w kodzie:

- nowe rare payoffy pełnią różne role:
  - ofensywny finisher: `zemsta_gorala`
  - defensywno-kontrolny power: `duma_podhala`

## Pakiet C - Midgame i roster przeciwników

### C1. Wygładzić `Parkingowego` — **DONE**

`Parkingowy` wygląda dziś jak wyraźna ściana dla talii, które grają dużo tanich kart lub potrzebują setupu.

Propozycja testowa:

- HP `110 -> 95`
- nie zwiększać limitu kart: zostawić pasywkę na poziomie `3` kart na turę

Wdrożone w kodzie:

- `Parkingowy`: HP `110 -> 95`
- limit zagrywanych kart pozostaje `3` na turę

Rekomendacja:

- najpierw test z HP `110 -> 95` przy zachowaniu limitu `3` kart

Powód:

- karta zachowuje swoją tożsamość przeciwnika karzącego spam
- a trudność pozostaje wysoka bez rozmiękczania kluczowej pasywki

### C2. Delikatnie dociągnąć early game — **DONE**

Wczesne walki nie powinny być darmowe, bo wtedy zbyt łatwo wejść w midgame z pełnym HP i nadmiarem Dutków.

Propozycja:

- lekko podnieść presję `Busiarza` albo `Influencerki`
- nie przez czysty damage, tylko przez bardziej konsekwentne debuffy lub tempo

Przykład:

- `Influencerka`: lepszy uptime spamu/statusów
- `Busiarz`: mniejszy heal, ale wyraźniej wymusza obronę

Wdrożone w kodzie:

- `Influencerka`:
  - `Selfie z zaskoczenia`: `applyVulnerable 1 -> 2`
  - `Oznaczenie w relacji`: `amount 1 -> 2` (`spam_tagami`)
- `Busiarz`:
  - `Wyprzedzanie na trzeciego`: `applyFrail 1 -> 2`
  - `Zbieranie kompletu`: `heal 5 -> 3` (block bez zmian)
- Testy: zaktualizowano i rozszerzono testy intencji/movesetu (`busiarz`, nowy blok `influencerka`) — 201 testów ✓, build ✓

### C3. Zmniejszyć różnicę między bossami — **DONE (iteracja 1)**

Bossowie nie muszą być identyczni, ale powinni testować podobny poziom gotowości decku.

Propozycja:

- dać `Fiakierowi` miękką ochronę przed debuffami lub `Rachunkiem`
- albo lekko zdjąć część frustracji z `Misia`, jeśli ma pozostać głównym bossem anty-statusowym

Cel:

- losowy finał ma zmieniać charakter walki, ale nie całkowicie zmieniać poziom trudności dla konkretnego archetypu

Wdrożone w kodzie:

- `Król Krupówek (Misiek)`: delikatnie obniżono największy pojedynczy spike obrażeń:
  - `Uścisk Krupówek`: `damage 25 -> 23`
- `GameState.getCombatSpecialStatuses()`: doprecyzowano tooltip Artefaktu Miska (blokuje **2** negatywne statusy, zgodnie z implementacją)
- Testy: dodano nowy test potwierdzający 4. intent Miska i zredukowane obrażenia `Uścisku Krupówek` (201 testów ✓, build ✓)

## Pakiet D - Pamiątki

### D0. Diagnoza puli pamiątek (odkrycie) — **DONE**

Aktualna pula: **16 pamiątek** — 5 common, 7 uncommon, **4 rare**.

Problemy:

- **Rare pool = 4** — sklep oferuje 1 pamiątka na wizytę; w typowym runie gracz widzi wszystkie rare po 2 przejściach. Zero ciekawości.
- **Za dużo szufladkowania** — prawie każdy pamiątka wymusza konkretny build (Lans: 3, Rachunek: 2, attack: 2). Brak pamiątek neutralnych pasujących do każdej talii.
- **Brak pamiątek mapowych** — żaden nie wpływa na to, jak grasz mapę (campfire, sklep, skrzynia).
- **`wiatr_halny` marnuje slot common** — 50% szansa na własny discard to de facto kamień.

Wniosek:

- tonowanie D1 jest ważne, ale bez poszerzenia puli efekt będzie kosmetyczny
- priorytet: **+2–3 nowe rare** z różnymi rolami (neutralne, mapowe, anty-snowball)
- następnie ewentualne zastąpienie `wiatr_halny` albo przeprojektowanie na coś deterministycznego

### D3. Dodać nowe pamiątki poszerzające pulę — **DONE**

Dodano 5 nowych pamiątek (łącznie **21 pamiątek** — 5 common, 10 uncommon, **6 rare**):

- **Złota Karta Zakopiańczyka** (Rare): usunięcie kart kosztuje zawsze 25 Dutków; wszystkie karty w sklepie o 15% tańsze.
- **Szczęśliwa Podkowa** (Uncommon): wygranie walki z ≤40% Krzepy daje +25 Dutków.
- **Góralski Zegarek** (Uncommon): w każdej parzystej turze walki pierwsza zagrana karta Skill kosztuje 0 Oscypków.
- **Termos z Herbatką** (Uncommon): zakończenie walki w ≤2 turach leczy +4 HP; w przeciwnym razie daje +15 Dutków.
- **Mapa Zakopanego** (Rare): ujawnia pre-rolowany wynik pod znakami `?` na mapie (walka, sklep lub wydarzenie).

Wdrożone w kodzie:

- `src/data/relics.js`: 5 nowych definicji pamiątek
- `GameState`: `battleTurnsElapsed`, `zegarekFreeSkillAvailable`, aktualizacje `startTurn()`, `getCardCostInHand()`, `playCard()`, `grantBattleDutki()`
- `GameState.getCardShopPrice()`, `GameState.getShopRemovalPrice()`: nowe metody dla rabatów sklepu
- `GameState._createMapNode()`: nody `event` dostają pole `eventOutcome` pre-rolowane przy generowaniu mapy
- `UIManager._renderShopOffers()`, `UIManager._buyCardRemoval()`: pobierają ceny ze stanu zamiast hardcode
- `UIManager._renderMapTrack()`: wyświetla ikonę wyniku eventu gdy gracz posiada `mapa_zakopanego`
- `UIManager._handleMapNodeSelect()`: używa `node.eventOutcome` zamiast ponownego losowania
- Testy: 17 nowych przypadków dla pakietu D3 (190 testów ✓, build ✓). Po późniejszych poprawkach D1/D4/A3/C2/C3 i fallbacku eventu Fiakiera: 201 testów ✓.

### D1. Uporządkować najmocniejsze pamiątki

**Rewizja po poszerzeniu puli (D3):** rare pool rósł z 4 → 6, więc każdy konkretny rare pojawia się rzadziej w sklepie per run. Pilność nerfów jest niższa, ale absolutny pułap mocy jest niezmieniony — run, który trafi `flaszkę` lub `papryczkę`, jest nadal przez nie zdominowany.

Pamiątki do przeglądu:

- `flaszka_sliwowicy` — **DONE**: osłabiono z +5 do +4 Siły
- `pocztowka_giewont` — **DONE**: reklasyfikacja uncommon → rare, cena 195 → 260
- `dzwonek_owcy` — nie ruszać bez danych z testów runów
- `papryczka_marka` — **AUDITED**: +3 Siły + –2 HP/turę + cena 350 Dutków. Kara jest realna przy długich walkach. Brak zmian — obecna równowaga defensywna jest odpowiednia.
- `lustrzane_gogle` — ocenić po poszerzeniu puli kart obronnych i Lansowych

Wdrożone w kodzie:

- `flaszka_sliwowicy`: `player.status.strength += 5` → `+= 4` w `_applyBattleStartRelics()`
- `flaszka_sliwowicy`: opis w `relics.js` zaktualizowany
- `pocztowka_giewont`: `rarity: 'uncommon'` → `'rare'`, `price: 195` → `260`
- Testy: zaktualizowano test flaszki (201 testów ✓)

### D2. Mniej pamiątek "wygrywających run samodzielnie"

Docelowo pamiątka powinien:

- wzmacniać plan gracza
- otwierać nową linię decyzji
- nie zastępować sensownego deckbuildingu

**Rewizja po D3:** pięć nowych pamiątek (`szczegliwa_podkowa`, `goralski_zegarek`, `termos_z_herbatka`, `zlota_karta_zakopianczyka`, `mapa_zakopanego`) poprawnie wypełnia tę rolę — wzmacniają ekonomię i tempo warunkowe, nie zastępują deckbuildingu. Problem pozostaje w legacy secie (D1).

Uwaga: `termos_z_herbatka` — pocieszny bonus (+15 Dutków jeśli walka trwa >2 tury) lekko premiuje buildy Rachunku potrzebujące czasu na setup. Drobne, ale kierunkowo odwrotne do celów A2/A3.

To oznacza, że w `1.1.0` warto bardziej tonować skrajne piki mocy niż buffować słabsze pamiątki.

### D4. Błędy i ryzyka odkryte przy rewizji D3

#### D4a. Kolizja emoji — `szczegliwa_podkowa` i `magnes_na_lodowke` (oba `🧲`) — **DONE**

Dwa pamiątki różnych rzadkości używają tej samej ikony. Wprowadza zamieszanie w sklepie i bibliotece.

Wdrożone: `szczegliwa_podkowa` emoji zmienione na `🍀`.

#### D4b. Cena `mapa_zakopanego` zawyżona względem użyteczności — **DONE**

`mapa_zakopanego` kosztowała 290 Dutków bez żadnego wpływu na walkę.

Wdrożone: cena obniżona z 290 do **250 Dutków** (dolna granica rare).

#### D4c. `wiatr_halny` nadal marnuje slot common — **DONE**

Common pool: 5 pozycji, z czego `wiatr_halny` był de facto 50/50 kamieniem.

Wdrożone: przeprojektowany na deterministyczny efekt — **dobierz +1 kartę na początku każdej tury**. Zero RNG, jasna wartość, common-tier power. Testy: +1 nowy test (201 testów ✓).

## Pakiet E - Mapa, eventy i ekonomia runa

### E1. Obniżyć udział eventów albo dodać nowe eventy — **DONE**

Aktualny udział `event` na mapie jest duży względem tego, że istnieje tylko jedno wydarzenie.

Opcja bezpieczna na `1.1.0`:

- zmniejszyć szansę na `event` z `30%` do `20%`

Opcja rozwojowa:

- zostawić `30%`, ale dodać przynajmniej `2` nowe eventy

Uzupełnienie (nowa propozycja):

- w nodzie `event` dopuścić także losowanie wyniku: `starcie` (bez bossów) albo `sklep`
- dzięki temu eventy przestają być jednowymiarowe i lepiej skalują się do małej puli treści

Rekomendowany model balansu dla `1.1.0`:

- rozkład wyniku eventu:
  - `60%` klasyczne wydarzenie z `eventLibrary`
  - `25%` starcie z losowym zwykłym wrogiem (bez bossów)
  - `15%` zwykły sklep (identyczny z dedykowanym nodem `shop`)
- uzasadnienie: event pojawia się na ~20% nodów, sklep wewnątrz eventu to 15% z tego — łącznie ~3% wszystkich nodów, co jest za rzadkie by istotnie wpłynąć na ekonomię

Dlaczego to działa balansowo:

- zwiększa różnorodność decyzji na nodzie `event` bez pompowania ekonomii
- dedykowane nody `shop` nadal generują zdecydowaną większość zakupów
- nie rozwadnia trudności, bo część eventów zamienia się na realny test walki

Rekomendacja:

- jeśli `1.1.0` ma być głównie patchem balansowym, wybrać wariant `20%`
- jeśli wdrażamy powyższe uzupełnienie, można utrzymać `event` na `20%` i nadal zyskać większą różnorodność

**Implementacja:**

- `GameState._rollMidNodeType()`: `event` zostaje przy `20%` (już było)
- `GameState.rollEventNodeOutcome()`: `60%` event / `25%` fight / `15%` shop
- `UIManager._handleMapNodeSelect()`: odczytuje wynik `rollEventNodeOutcome()` i routuje do odpowiedniej ścieżki
- decyzja produktowa: wynik `shop` z noda event otwiera **pełny sklep** (ta sama logika co dedykowany nod `shop`)
- `fiakier_event`: jeśli gracz ma `<10 DUTKI`, wydarzenie nie blokuje progresji — pojawia się fallback fight z `pomocnik_fiakra` (HP 58, uproszczony moveset bez ciężkich mechanik Rachunku)
- Testy: `rollEventNodeOutcome` — 3 przypadki brzegowe (173 testów ✓)

### E2. Ostudzić ekonomię sklepu — **DONE**

Obecnie przy sensownym runie stosunkowo łatwo zbiera się Dutki na dobre zakupy.

Propozycje do testów:

- standardowa nagroda po bitce: `30-40 -> 28-36` ✓
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
- pełny przegląd 4-5 najmocniejszych pamiątek
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
5. Pamiątki high-impact
6. Finałowe strojenie bossów po całej reszcie

## Plan testów

### Testy jednostkowe

- bankructwo daje nową, obniżoną premię Dutków - DONE
- zmienione karty `Rachunku` zachowują prawidłowe interakcje - DONE
- Fiakier ma miękką kontrę na `Rachunek` (70% nakładanych stacków, min. 1) - DONE
- `Parkingowy` dalej ogranicza tempo, ale nie hard-lockuje łatwo tury - DONE
- C3 (iteracja 1): Misiek ma obniżony pojedynczy spike (`Uścisk Krupówek 25 -> 23`) - DONE
- mapa generuje nowy docelowy rozkład eventów
- nowe karty mają testy logiki i interakcji z pamiątkaami/statusami - DONE
- event node może zakończyć się klasycznym wydarzeniem, starciem (bez bossów) albo pełnym sklepem
- wariant `shop` z noda event używa tej samej oferty/usług co zwykły nod `shop`
- `fiakier_event` ma fallback walki przy `<10 DUTKI` i nie blokuje interakcji - DONE

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
