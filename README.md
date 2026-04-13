# Usiec Cepra

## Uruchomienie lokalne

1. Zainstaluj zaleznosci:

```bash
npm install
```

2. Uruchom serwer developerski:

```bash
npm run dev
```

3. Otworz aplikacje pod adresem pokazanym przez Vite (zwykle `http://localhost:5173/slay-the-ceper/`).

## Menu Debug

Menu debug dziala tylko w trybie developerskim.

### Jak je wlaczyc

1. Uruchom gre przez `npm run dev`.
2. Na ekranie gry nacisnij `~` (tilde) lub `F9`.
3. Po prawej stronie pojawi sie panel `DEBUG OVERLAY`.

### Co zawiera panel

- `MAP`: liczba rzedow mapy, regeneracja mapy, override nastepnego wezla, odkrywanie calej mapy (fog of war off).
- `BATTLE`: natychmiastowy spawn dowolnego przeciwnika, statusy na wroga, edycja HP, insta-kill, reset akcji tury.
- `PLAYER`: ustawienie Dutkow, dodawanie pamiatek (relics), God Mode, pelne leczenie.

### Log akcji

Na dole overlaya znajduje sie wewnetrzny log debugowy z historia wykonanych akcji, np.:

- `Set dutki to 999`
- `Spawned enemy: boss`
- `God mode: ON`
