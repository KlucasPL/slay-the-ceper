# Propozycje nowych kart (50 szt.)

Data: 2026-04-14  
Cel: po dodaniu tej puli laczna liczba dostepnych kart bez statusow ma wynosic 75.

## Bilans docelowy

- Aktualnie w grze: 25 kart bez statusow.
- W tym planie: 50 nowych kart.
- Razem po wdrozeniu: 75 kart bez statusow.

## Zasady tej wersji

- To jest tylko design kart, bez implementacji.
- Usuniete zostaly najbardziej "zwykle" pomysly (proste "zadaj X" / "zyskaj Y" bez haczyka).
- Zostawione karty sa bardziej archetypowe: Rachunek, Lans, pogoda, multi-hit, marynowe i reliktowe synergie.
- Nowa zasada rozgrywki (globalna): karta z tagiem `Lans` — jesli gracz NIE ma statusu `lans`, karta aktywuje TYLKO `lans` (efekt glowny jest pomijany w calosci). Jesli gracz MA `lans`, efekt glowny odpala sie normalnie.
- Dutki nie sa wydawane w walce: karty korzystaja z zyskow i progow Dutkow, bez kosztu "zaplac".
- **IKON: Każda karta MUSI mieć unikalną ikonkę — wśród nowych 50 kart, a także wśród istniejących już kart, pamiątek i fantów od Maryny.**

---

## Ataki (20)

1. ✓ **Wydruk z Kasy** | attack | uncommon | koszt 1  
   Efekt: Zadaj 6 obrazen. Dodaj 4 do Rachunku wroga.

2. ✓ **Rozpęd z Równi** | attack | uncommon | koszt 1  
   Efekt: Zadaj 3x3 obrazenia. Jesli wrog ma `weak`, zadaj 4x3.

3. ✓ **Krzesany** | attack | uncommon | koszt 2  
   Efekt: Zadaj 2x6 obrazen. Jesli drugi cios zada obrazenia Krzepie (przebije pancerz), zyskaj 1 Oscypek na te ture.

4. ✓ **Tatrzanski Szpan** | attack | uncommon | koszt 2  
   Efekt: `Lans`: Zadaj 16 obrazen.

5. ✓ **Ciupaga we Mgle** | attack | common | koszt 1  
   Efekt: Zadaj 6 obrazen i naloz 1 `weak`. Jesli pogoda to `fog`, naloz tez 1 `fragile`.

6. ✓ **Paradny Zwyrt** | attack | uncommon | koszt 1  
   Efekt: `Lans`: Zadaj 12 obrazen, dobierz 1 kartę

7. ✓ **Nadplacony Bilet** | attack | uncommon | koszt 1  
   Efekt: Zadaj 7 obrazen. +1 obrazen za kazde 5 Rachunku na wrogu (maks. +5).

8. ✓ **Z Rozmachu** | attack | common | koszt 1  
   Efekt: Zadaj 7 obrazen. Jesli masz status `next_double`, dobierz 1 karte.

9. ✓ **Eksmisja z Kwatery** | attack | rare | koszt 2  
   Efekt: Zadaj 12 obrazen. Jesli wrog ma `weak`, dodaj 10 do Rachunku.

10. ✓ **Cios z Telemarkiem** | attack | common | koszt 1  
    Efekt: `Lans`: Zadaj 9 obrazen.

11. ✓ **Wymuszony Napiwek** | attack | uncommon | koszt 1  
    Efekt: Zadaj 9 obrazen. Jesli wrog padnie od tej karty, zyskaj 15 Dutkow. Exhaust.

12. ✓ **Mlynek Ciupaga** | attack | rare | koszt 2  
    Efekt: `Lans`: Zadaj 3x4 obrazenia i naloz 2 `weak`.

13. ✓ **Rachunek za Oddychanie** | attack | rare | koszt 2  
    Efekt: Zadaj 8 obrazen. Zwieksz aktualny Rachunek wroga o 25% (zaokraglajac w gore). Exhaust.

14. ✓ **Przymusowe Morsowanie** | attack | common | koszt 1  
    Efekt: Zadaj 7 obrazen. Jesli pogoda to `frozen`, zadaj dodatkowe 7 i dobierz 1 karte.

15. ✓ **Wepchniecie w Kolejke** | attack | common | koszt 1  
    Efekt: `Lans`: Naloz 1 `vulnerable` i dobierz 1 karte.

16. ✓ **Lawina z Morskiego Oka** | attack | uncommon | koszt 2  
    Efekt: Zadaj 16 obrazen. Jesli pogoda to `frozen`, ta karta kosztuje 1.

17. ✓ **Beczenie Redyku** | attack | common | koszt 1  
    Efekt: Zadaj 5 obrazen. Zyskuje +4 obrazenia za kazdy punkt Twojej Sily (`strength`).

18. ✓ **Skrupulatne Wyliczenie** | attack | uncommon | koszt 1  
    Efekt: Zadaj obrazenia rowne polowie Twojej aktualnej Gardy. Jesli Rachunek > 15, dodaj +5 obrazen.

19. ✓ **Zaskoczenie z Kosodrzewiny** | attack | common | koszt 1  
    Efekt: Zadaj 7 obrazen. Ten atak ignoruje uniki/pudla (zawsze trafia).

20. ✓ **Paragon Grozy** | attack | rare | koszt 3  
    Efekt: Zadaj 25 obrazen. Jesli wrog ma co najmniej 25 Rachunku, ta karta kosztuje 1 Oscypek.

---

## Skille (20)

21. ✓ **Pogodzenie Sporów** | skill | common | koszt 1  
    Efekt: Dodaj 10 do Rachunku. Dobierz 1.

22. ✓ **Zapas Oscypków** | skill | common | koszt 1  
    Efekt: Zyskaj 1 Oscypek na nastepna ture (`energy_next_turn`) i 4 Gardy.

23. ✓ **Wdech Halnego** | skill | common | koszt 0  
    Efekt: Odrzuc 1 karte z reki, dobierz 2 karty.

24. ✓ **Schowek za Pazuchą** | skill | uncommon | koszt 0  
    Efekt: Wybierz 1 karte z reki. Zostaje ona na nastepna ture (Retain).

25. ✓ **Piórko u Kapelusza** | skill | uncommon | koszt 1  
    Efekt: `Lans`: Zyskaj 8 Gardy i dobierz 1 karte.

26. ✓ **Wypięta Pierś** | skill | uncommon | koszt 1  
    Efekt: `Lans`: Zyskaj 7 Gardy. Nastepny zagrany przez Ciebie Atak w tej turze zadaje +3 obrazenia.

27. ✓ **Stary Numer Maryny** | skill | rare | koszt 2  
    Efekt: Naloz 2 `weak` i 2 `fragile`. Dobierz 1.

28. ✓ **Nauczka z Krupowek** | skill | uncommon | koszt 1  
    Efekt: Naloz na siebie 1 `weak`, zyskaj +2 Sily (`strength`).

29. ✓ **Zasieki z Gubałówki** | skill | rare | koszt 2  
    Efekt: Zyskaj 12 Gardy. Za kazdym razem, gdy otrzymasz od wroga obrazenia (nawet zablokowane) w tej turze, zadaj mu 5 obrazen.

30. ✓ **Zamach znad Glodowki** | skill | uncommon | koszt 0  
    Efekt: Ustaw status `next_double` = true. Exhaust.

31. ✓ **Punkt Widokowy** | skill | common | koszt 1  
    Efekt: Dobierz 1 karte. Jesli pogoda to `clear`, dobierz jeszcze 1 karte.

32. ✓ **Przymusowy Napiwek** | skill | uncommon | koszt 1  
    Efekt: Dodaj 5 do Rachunku. Jesli przeciwnik ma `vulnerable`, dodaj jeszcze 5.

33. ✓ **Wezwanie Przedsadowe** | skill | rare | koszt 2  
    Efekt: Zyskaj Garde rowna 1/3 aktualnego Rachunku wroga. Exhaust.

34. ✓ **Zgubieni we Mgle** | skill | uncommon | koszt 1  
    Efekt: Jesli pogoda to `fog`, naloz 2 `weak`. W innym wypadku zyskaj 8 Gardy.

35. ✓ **Przeliczanie Dutków** | skill | common | koszt 1  
    Efekt: `Lans`: Dobierz 1 karte i zyskaj 4 Gardy.

36. ✓ **List od Maryny** | skill | uncommon | koszt 1  
    Efekt: Dobierz 1 karte. Jesli wrog ma status `weak` lub `fragile`, dobierz jeszcze 1 karte.

37. ✓ **Herbata z Prądem** | skill | uncommon | koszt 1  
    Efekt: Jesli masz <=50% Krzepy, ulecz 6. Inaczej ulecz 2. Exhaust.

38. ✓ **Dutki na Stole** | skill | common | koszt 0  
    Efekt: +10 Dutkow i dodaj 4 do Rachunku. Exhaust.

39. ✓ **Goralski Upor** | skill | uncommon | koszt 1  
    Efekt: Zyskaj 5 Gardy. Ta Garda nie znika na poczatku nastepnej tury (Blur).

40. ✓ **Na Ratunek GOPR** | skill | uncommon | koszt 1  
    Efekt: Ulecz 5 Krzepy. Jesli wrog ma >20 Rachunku, ulecz dodatkowe 5. Exhaust.

---

## Power (10)

41. ✓ **Pan na Włościach** | power | uncommon | koszt 1  
    Efekt: Za kazdym razem, gdy zyskujesz status `lans`, zyskaj 3 Gardy.

42. ✓ **Czas na Fajkę** | power | rare | koszt 2  
    Efekt: Na koniec Twojej tury, jesli masz >10 Gardy, ulecz 2 Krzepy.

43. ✓ **Zimna Krew** | power | uncommon | koszt 1  
    Efekt: Ilekroc nakladasz na wroga `weak`, nakladasz +1 `weak` dodatkowo.

44. ✓ **Góralska Gościnność** | power | rare | koszt 2  
    Efekt: Za kazda zagrana karte Ataku dodaj 2 do Rachunku wroga.

45. ✓ **Znajomość Szlaku** | power | uncommon | koszt 1  
    Efekt: W pogodzie `fog` zyskujesz 5 Gardy na starcie swojej tury.

46. ✓ **Kąpiel w Białce** | power | uncommon | koszt 1  
    Efekt: W pogodzie `frozen` naloz na wroga 1 `vulnerable` na starcie swojej tury.

47. ✓ **Koncesja na Oscypki** | power | rare | koszt 2  
    Efekt: Na poczatku Twojej tury, jesli wrog ma co najmniej 25 Rachunku, zyskaj 1 Oscypek i dobierz 1 karte.

48. ✓ **Baciarka Ciesy** | power | uncommon | koszt 1  
    Efekt: Zyskaj +2 Sily (`strength`) na cala walke.

49. ✓ **Szał Bacy** | power | rare | koszt 2  
    Efekt: Ilekroc dobierasz dodatkowo karte w trakcie swojej tury, zadaj wrogowi 3 obrazenia.

50. ✓ **Góralski Upór** | power | uncommon | koszt 1  
    Efekt: Ilekroc tracisz Krzepe, dobierz 1 karte na poczatku nastepnej tury.

---

## Pakiety synergii

### 1) Rachunek / bankructwo

- Karty: 1, 7, 9, 13, 18, 20, 21, 32, 33, 38, 40, 44, 47.
- Relikty: `magnes_na_lodowke`, `pekniete_liczydlo`.

### 2) Lans / obrona

- Karty: 4, 6, 10, 12, 15, 25, 26, 35, 39, 41.
- Relikty: `blacha_przewodnika`, `lustrzane_gogle`, `papucie_po_babci`.

### 3) Multi-hit i scaling ataku

- Karty: 2, 3, 12, 17, 48.
- Relikty: `bilet_tpn`, `flaszka_sliwowicy`, `pocztowka_giewont`.

### 4) Kontrola debuffow

- Karty: 5, 27, 28, 34, 36, 43.
- Relikty/Maryna: `zepsuty_termometr`, `relic_boon_tajny_skladnik`.

### 5) Pogoda

- Karty: 5, 14, 16, 31, 34, 45, 46.
- Warunki: `clear`, `fog`, `frozen`.

### 6) Wysoki sufit mocy (rare)

- Karty: 9, 12, 13, 20, 27, 29, 33, 42, 44, 47, 49.
- Cel: mniej fillerow, wiecej kart "build-around".

### 6) Wysoki sufit mocy (rare)
