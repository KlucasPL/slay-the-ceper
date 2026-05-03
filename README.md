# Usiec Cepra

## Uruchomienie lokalne

1. Zainstaluj zaleznosci:

```bash
npm install
```

2. (Opcjonalnie) skonfiguruj GameAnalytics przez lokalny plik `.env.local`:

```bash
VITE_GAMEANALYTICS_GAME_KEY=twoj_game_key
VITE_GAMEANALYTICS_SECRET_KEY=twoj_secret_key
VITE_GAMEANALYTICS_BUILD=web-1.7.2
```

> Dla bezpieczenstwa klucze trzymaj tylko lokalnie. Repo zawiera `.env.example`,
> a `.env.local` jest ignorowany przez git.

### GameAnalytics na GitHub Pages

Aby zbieranie danych dzialalo na deployu z GitHub Pages, ustaw w repo (lub w environment
`github-pages`) sekrety:

- `VITE_GAMEANALYTICS_GAME_KEY`
- `VITE_GAMEANALYTICS_SECRET_KEY`
- `VITE_GAMEANALYTICS_BUILD` (np. `web-1.7.2`)

Workflow [deploy-pages.yml](.github/workflows/deploy-pages.yml) przekazuje te wartosci do kroku
`npm run build`, wiec analytics beda dostepne w buildzie publikowanym na Pages.

3. Uruchom serwer developerski:

```bash
npm run dev
```

4. Otworz aplikacje pod adresem pokazanym przez Vite (zwykle `http://localhost:5173/slay-the-ceper/`).

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

---

## Symulator balansowania

Pełna dokumentacja: [`docs/balancing-usage.md`](docs/balancing-usage.md)

### Jednorazowe przygotowanie

```bash
npm install
npm run dashboard:vendor
```

### Uruchomienie symulacji + dashboard (krok po kroku)

**Krok 1 — uruchom symulację i zapisz wyniki do pliku JSONL:**

```bash
node --max-old-space-size=8192 scripts/sim/index.js --games 70000 --agent heuristic --verbosity summary --out /tmp/sim.jsonl
```

> **Ważne:** użyj `--verbosity summary` (nie `off`) — tylko wtedy JSONL zawiera zdarzenia
> `battle_started`/`battle_ended`, których wymaga analizator do wygenerowania danych
> o wrogach (Enemy Heatmap na dashboardzie).
>
> Flaga `--max-old-space-size=8192` jest wymagana dla batchy powyżej ~25 000 gier.
> Dla mniejszych batchy (np. 5 000 gier) można ją pominąć:
>
> ```bash
> node scripts/sim/index.js --games 5000 --agent heuristic --verbosity summary --out /tmp/sim.jsonl
> ```

**Krok 2 — przetworz JSONL do metrics.json:**

```bash
node --max-old-space-size=8192 scripts/analyze.js /tmp/sim.jsonl tools/dashboard/metrics.json
```

> Przy 70 000 grach plik summary JSONL waży ~1,2 GB. Analizator wczytuje go w całości,
> dlatego `--max-old-space-size=8192` jest tu równie wymagane co przy samej symulacji.

**Krok 3 — uruchom dashboard lokalnie:**

```bash
npx serve tools/dashboard
```

Otwórz `http://localhost:3000` (lub port pokazany przez `serve`) w przeglądarce.

Dashboard załaduje automatycznie `metrics.json`. Możesz też przeciągnąć dowolny plik `metrics.json` na stronę.

---

### Skrócony pipeline (jeden ciąg komend)

```bash
node --max-old-space-size=8192 scripts/sim/index.js --games 70000 --agent heuristic --verbosity summary --out /tmp/sim.jsonl \
  && node --max-old-space-size=8192 scripts/analyze.js /tmp/sim.jsonl tools/dashboard/metrics.json \
  && npx serve tools/dashboard
```

---

### Inne przydatne warianty symulacji

```bash
# Szybki smoke test (~100 gier)
npm run sim:smoke

# 5 000 gier, bot agresywny
node scripts/sim/index.js --games 5000 --agent aggressive --verbosity summary --out /tmp/aggressive.jsonl

# Porównanie z bazowym baseline
node --max-old-space-size=8192 scripts/analyze.js /tmp/sim.jsonl /tmp/candidate.metrics.json
node scripts/sim/tools/diff-baseline.js /tmp/candidate.metrics.json baselines/main.metrics.json
```
