/**
 * @typedef {{
 *   text: string,
 *   description: string,
 *   consequence?: string,
 *   cost: number,
 *   effect: (state: import('../state/GameState.js').GameState) => string,
 * }} EventChoiceDef
 *
 * @typedef {{
 *   id: string,
 *   act?: 'I' | 'II' | 'III',
 *   title: string,
 *   description: string,
 *   image: string,
 *   fallbackFight?: { minDutki: number, enemyId: string, message: string },
 *   choices: EventChoiceDef[],
 * }} GameEventDef
 */

const fiakierEventSvg = `
<svg viewBox="0 0 220 130" width="220" height="130" aria-hidden="true">
  <rect x="16" y="84" width="112" height="26" rx="6" fill="#6b3f1e" stroke="#3b220f" stroke-width="3"/>
  <polyline points="24,90 36,84 48,90 60,84 72,90 84,84 96,90 108,84 120,90" fill="none" stroke="#e0b43a" stroke-width="2"/>
  <circle cx="42" cy="112" r="14" fill="none" stroke="#2d1a0c" stroke-width="4"/>
  <circle cx="42" cy="112" r="4" fill="#2d1a0c"/>
  <circle cx="102" cy="112" r="14" fill="none" stroke="#2d1a0c" stroke-width="4"/>
  <circle cx="102" cy="112" r="4" fill="#2d1a0c"/>
  <line x1="42" y1="112" x2="102" y2="112" stroke="#2d1a0c" stroke-width="2"/>

  <ellipse cx="162" cy="86" rx="24" ry="15" fill="#9f6f3d" stroke="#5a381e" stroke-width="3"/>
  <rect x="138" y="72" width="42" height="18" rx="7" fill="#a87743"/>
  <circle cx="176" cy="70" r="9" fill="#a87743" stroke="#5a381e" stroke-width="3"/>
  <polygon points="182,64 198,58 188,71" fill="#5a381e"/>
  <line x1="198" y1="86" x2="214" y2="82" stroke="#2d1a0c" stroke-width="3" stroke-linecap="round"/>

  <rect x="22" y="62" width="26" height="20" rx="6" fill="#31508b" stroke="#1a2d52" stroke-width="2"/>
  <circle cx="35" cy="52" r="11" fill="#e1b48e"/>
  <path d="M 26,56 Q 35,62 44,56" fill="#5a3216"/>
  <path d="M 29,40 Q 35,34 41,40 L 41,46 L 29,46 Z" fill="#1f1f1f"/>
  <line x1="48" y1="66" x2="80" y2="48" stroke="#e1b48e" stroke-width="5" stroke-linecap="round"/>
  <path d="M 80,48 Q 98,40 104,48" fill="none" stroke="#5a3216" stroke-width="2"/>
</svg>`;

const karykaturzystaEventSvg = `
<svg viewBox="0 0 240 140" width="220" height="130" aria-hidden="true">
  <rect x="20" y="106" width="130" height="10" rx="5" fill="#6b4c2d"/>
  <line x1="60" y1="40" x2="30" y2="106" stroke="#8a6a48" stroke-width="6" stroke-linecap="round"/>
  <line x1="100" y1="40" x2="140" y2="106" stroke="#8a6a48" stroke-width="6" stroke-linecap="round"/>
  <line x1="60" y1="40" x2="100" y2="40" stroke="#8a6a48" stroke-width="6" stroke-linecap="round"/>

  <rect x="66" y="44" width="52" height="64" rx="4" fill="#f8f1df" stroke="#4a3522" stroke-width="3"/>
  <path d="M78 66 Q92 48 106 66" fill="none" stroke="#2d2d2d" stroke-width="3" stroke-linecap="round"/>
  <circle cx="86" cy="76" r="3" fill="#2d2d2d"/>
  <circle cx="99" cy="76" r="3" fill="#2d2d2d"/>
  <path d="M82 90 Q93 100 104 90" fill="none" stroke="#2d2d2d" stroke-width="3" stroke-linecap="round"/>
  <path d="M72 56 L78 54 M72 62 L78 60 M72 68 L78 66" stroke="#4b4b4b" stroke-width="2" stroke-linecap="round"/>

  <ellipse cx="176" cy="82" rx="22" ry="28" fill="#213042"/>
  <circle cx="176" cy="56" r="18" fill="#f0c39b"/>
  <ellipse cx="176" cy="46" rx="22" ry="9" fill="#1d1d1d"/>
  <path d="M161 46 Q176 28 191 46" fill="#2b2b2b"/>
  <line x1="196" y1="88" x2="218" y2="70" stroke="#f0c39b" stroke-width="5" stroke-linecap="round"/>
  <rect x="213" y="66" width="18" height="6" rx="3" fill="#2f2f2f"/>

  <path d="M150 38 Q176 20 202 38" fill="#1a1a1a"/>
  <circle cx="176" cy="22" r="4" fill="#e53935"/>
</svg>`;

const hazardKartonEventSvg = `
<svg viewBox="0 0 240 140" width="220" height="130" aria-hidden="true">
  <rect x="18" y="108" width="160" height="10" rx="5" fill="#6b4c2d"/>
  <rect x="44" y="80" width="92" height="28" rx="3" fill="#b89562" stroke="#6b4c2d" stroke-width="3"/>
  <line x1="44" y1="89" x2="136" y2="89" stroke="#8a6a48" stroke-width="2"/>
  <line x1="44" y1="97" x2="136" y2="97" stroke="#8a6a48" stroke-width="2"/>
  <circle cx="66" cy="74" r="7" fill="#2d2d2d"/>
  <circle cx="90" cy="74" r="7" fill="#2d2d2d"/>
  <circle cx="114" cy="74" r="7" fill="#2d2d2d"/>
  <circle cx="90" cy="74" r="3" fill="#f5f1dd"/>

  <rect x="158" y="58" width="42" height="52" rx="8" fill="#333"/>
  <circle cx="179" cy="48" r="13" fill="#444"/>
  <rect x="168" y="36" width="22" height="9" rx="3" fill="#222"/>
  <circle cx="174" cy="49" r="2" fill="#111"/>
  <circle cx="184" cy="49" r="2" fill="#111"/>
  <path d="M 172,56 Q 179,60 186,56" fill="none" stroke="#111" stroke-width="2"/>

  <line x1="200" y1="74" x2="222" y2="64" stroke="#f0c39b" stroke-width="5" stroke-linecap="round"/>
  <rect x="218" y="58" width="12" height="10" rx="2" fill="#a87f47"/>

  <text x="18" y="24" font-size="13" font-weight="700" fill="#2d2d2d">Gdzie jest kulka?!</text>
</svg>`;

/** @type {Record<string, GameEventDef>} */
export const eventLibrary = {
  event_hazard_karton: {
    id: 'event_hazard_karton',
    act: 'I',
    title: 'Hazard na Kartonie',
    description:
      'Przy kartonie po bananach stoi podejrzany typ i miesza kubki. "Gdzie jest kulka?!"',
    image: hazardKartonEventSvg,
    choices: [
      {
        text: 'Wchodzę w to! (20 dutków)',
        description: 'Stawiasz wszystko na szybkie oko i jeszcze szybszą rękę.',
        consequence:
          'Koszt: 20 dutków. Wynik: 50% WYGRANA (+45 dutków), 50% PRZEGRANA (karta Pocieszenie: dobierz 1).',
        cost: 20,
        effect(state) {
          if (Math.random() < 0.5) {
            state.addDutki(45);
            return 'Wygrana! Czysty fart. Wyciągasz banknot z rąk oszusta (+45 dutków).';
          }
          state.deck.push('pocieszenie');
          return 'Przegrana! Mrugnąłeś i kulka znikła. Dostajesz kartę Pocieszenie.';
        },
      },
      {
        text: 'Obserwuj z boku',
        description: 'Nie grasz. Patrzysz, jak oszust robi robotę palcami.',
        consequence:
          'Koszt: 0 dutków. Nagroda: karta Spostrzegawczość (dobierz 1; jeśli to Attack, Twój następny atak w tej turze zadaje +2 obrażeń).',
        cost: 0,
        effect(state) {
          state.deck.push('spostrzegawczosc');
          return 'Zauważasz kulkę w rękawie. Twoje oczy są teraz ostrzejsze.';
        },
      },
      {
        text: 'Wywróć im stolik',
        description: 'Masz dość wałków. Czas roznieść ten interes.',
        consequence:
          'Koszt: 0 dutków. Efekt: walka eventowa z Naganiaczami. Nagroda po wygranej: Zasłużony Portfel (+6 dutków po każdym zwycięstwie w walce nieeventowej).',
        cost: 0,
        effect(state) {
          state.queueEventBattle('naganiacze_duo', 'zasluzony_portfel');
          return 'W tłumie robi się ciasno. Seba i Mati ruszają na Ciebie!';
        },
      },
    ],
  },
  event_karykaturzysta: {
    id: 'event_karykaturzysta',
    act: 'I',
    title: 'Uliczny Karykaturzysta',
    description:
      'Na Krupówkach uliczny artysta pokazuje Ci groteskowy portret. "Płać, bo dorysuję rogi!"',
    image: karykaturzystaEventSvg,
    choices: [
      {
        text: 'Kup arcydzieło (25 dutków)',
        description: 'Płacisz i zabierasz obraz, który wywołuje śmiech i wybija wrogów z rytmu.',
        consequence:
          'Koszt: 25 dutków. Nagroda: relikt Krzywy Portret (wróg zadaje -2 obrażeń przez 1 turę).',
        cost: 25,
        effect(state) {
          state.addRelic('krzywy_portret');
          return 'Transakcja dokonana. Portret jest tak brzydki, że aż fascynujący. Przeciwnicy nie będą mogli powstrzymać śmiechu.';
        },
      },
      {
        text: 'To nie ja!',
        description: 'Odmawiasz zapłaty i odpalisz się jak granat pod Giewontem.',
        consequence:
          'Koszt: brak. Nagroda: karta Furia Turysty (0 kosztu, +50% obrażeń w turze, -3 Krzepy, PRZEPADO).',
        cost: 0,
        effect(state) {
          state.deck.push('furia_turysty');
          return 'Twoja twarz czerwienieje z oburzenia na tę zniewagę. Czujesz nagły przypływ adrenaliny i chęć mordu.';
        },
      },
      {
        text: 'Dorysuj złoty łańcuch i furę',
        description: 'Pozujesz jak gwiazda. Plecy cierpną, ale styl musi się zgadzać.',
        consequence:
          'Koszt: -5 Krzepy. Nagroda: karta Prestiż na Kredyt (1 koszt, 6 Gardy +2 za każde 20 dutków, max +14 bonusu).',
        cost: 0,
        effect(state) {
          state.player.hp = Math.max(1, state.player.hp - 5);
          state.deck.push('prestiz_na_kredyt');
          return 'Stoisz bez ruchu przez godzinę w nienaturalnej pozie, prężąc muskuły. Twoje plecy pulsują bólem, ale efekt na papierze jest czystym prestiżem.';
        },
      },
    ],
  },
  fiakier_event: {
    id: 'fiakier_event',
    title: 'Wąsaty Fiakier',
    description:
      "Wielka bryczka tarasuje przejście. Fiakier w zakurzonym kapeluszu strzela z bata i patrzy na Twoją sakiewkę. 'Panocku, koń tyż głodny, a patrzynie na luksusy kosztuje!'",
    image: fiakierEventSvg,
    fallbackFight: {
      minDutki: 10,
      enemyId: 'pomocnik_fiakra',
      message:
        "Fiakier mierzy Cię wzrokiem: 'Bez dutków to se możesz po asfalcie tupać, a nie moją bryką jechać! Naucy Cie rozumu...'",
    },
    choices: [
      {
        text: 'Pogłaskaj konia (60 dutków)',
        description: 'Koń jest miły w dotyku. Chwila relaksu regeneruje siły.',
        consequence: 'Koszt: 60 dutków. Efekt: +7 Krzepy.',
        cost: 60,
        effect(state) {
          state.healPlayer(7);
          return 'Poczułeś powiew tatrzańskiej natury. Odzyskałeś 7 Krzepy.';
        },
      },
      {
        text: 'Popatrz na konia (20 dutków)',
        description: 'Tylko rzuciłeś okiem na kopyta, ale Fiakier już wyciąga rękę po zapłatę.',
        consequence: 'Koszt: 20 dutków. Efekt: brak dodatkowej nagrody.',
        cost: 20,
        effect() {
          return 'Fiakier mruknął coś pod nosem i schował monety. Nic się nie zmieniło.';
        },
      },
      {
        text: 'Przejażdżka bryczką (150 dutków)',
        description:
          'Wsiadasz dumnie na tył. Bryczka rusza z kopyta, omijając wszystkich turystów!',
        consequence:
          'Koszt: 150 dutków. Efekt: skrót do finału i wymuszenie walki z głównym bossem.',
        cost: 150,
        effect(state) {
          state.jumpToBoss = true;
          state.forceMainBossNextBattle = true;
          return 'Wiatr we włosach! Fiakier dowozi Cię pod samiuśkie stopy Białego Miśka.';
        },
      },
    ],
  },
};

export const events = eventLibrary;
