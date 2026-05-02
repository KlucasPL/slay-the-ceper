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

const korekDoToaletyEventSvg = `
<svg viewBox="0 0 220 130" width="220" height="130" aria-hidden="true">
  <!-- floor -->
  <rect x="0" y="112" width="220" height="18" rx="0" fill="#c8b89a"/>
  <!-- door frame -->
  <rect x="74" y="20" width="72" height="92" rx="4" fill="#6b3f1e" stroke="#3b220f" stroke-width="3"/>
  <!-- door panel -->
  <rect x="80" y="26" width="60" height="80" rx="3" fill="#a87743"/>
  <!-- WC sign -->
  <rect x="90" y="34" width="40" height="18" rx="3" fill="#f5f1dd" stroke="#3b220f" stroke-width="2"/>
  <text x="110" y="47" font-size="11" font-weight="700" fill="#2d2d2d" text-anchor="middle">WC 15 zł</text>
  <!-- door knob -->
  <circle cx="128" cy="72" r="4" fill="#e0b43a" stroke="#8a6000" stroke-width="1.5"/>
  <!-- queue figure 1 -->
  <circle cx="38" cy="52" r="9" fill="#e1b48e" stroke="#5a3216" stroke-width="1.5"/>
  <rect x="30" y="62" width="16" height="24" rx="4" fill="#31508b" stroke="#1a2d52" stroke-width="1.5"/>
  <line x1="30" y1="68" x2="22" y2="80" stroke="#e1b48e" stroke-width="4" stroke-linecap="round"/>
  <line x1="46" y1="68" x2="54" y2="76" stroke="#e1b48e" stroke-width="4" stroke-linecap="round"/>
  <!-- queue figure 2 -->
  <circle cx="170" cy="56" r="9" fill="#e1b48e" stroke="#5a3216" stroke-width="1.5"/>
  <rect x="162" y="66" width="16" height="22" rx="4" fill="#7b3f2e" stroke="#3b1810" stroke-width="1.5"/>
  <!-- impatience lines -->
  <line x1="54" y1="78" x2="66" y2="78" stroke="#e0b43a" stroke-width="2" stroke-dasharray="3,2"/>
  <!-- price tag hanging on door -->
  <rect x="90" y="60" width="40" height="12" rx="2" fill="#fff9e0" stroke="#8a6000" stroke-width="1"/>
  <text x="110" y="70" font-size="8" fill="#5a3000" text-anchor="middle">papier własny</text>
</svg>`;

const selfieNaKrawedziEventSvg = `
<svg viewBox="0 0 220 130" width="220" height="130" aria-hidden="true">
  <!-- sky -->
  <rect x="0" y="0" width="220" height="130" fill="#b8d8f0"/>
  <!-- mountains far -->
  <polygon points="0,90 40,40 80,90" fill="#8aabb0"/>
  <polygon points="50,90 100,30 150,90" fill="#6b8fa0"/>
  <!-- cliff edge -->
  <polygon points="110,130 220,130 220,70 150,60 110,80" fill="#7a6a50"/>
  <polygon points="110,80 150,60 220,70 220,90 110,90" fill="#9a8a68"/>
  <!-- person on cliff -->
  <circle cx="172" cy="58" r="9" fill="#e1b48e" stroke="#5a3216" stroke-width="1.5"/>
  <rect x="164" y="68" width="16" height="22" rx="4" fill="#d43f3f" stroke="#8a1a1a" stroke-width="1.5"/>
  <!-- selfie stick arm -->
  <line x1="180" y1="74" x2="206" y2="52" stroke="#e1b48e" stroke-width="4" stroke-linecap="round"/>
  <!-- phone -->
  <rect x="200" y="44" width="14" height="10" rx="2" fill="#2d2d2d" stroke="#111" stroke-width="1"/>
  <rect x="202" y="46" width="10" height="6" rx="1" fill="#6af"/>
  <!-- camera flash burst -->
  <circle cx="207" cy="44" r="2" fill="#fffbe0"/>
  <line x1="207" y1="38" x2="207" y2="42" stroke="#fffbe0" stroke-width="1.5"/>
  <line x1="211" y1="40" x2="209" y2="43" stroke="#fffbe0" stroke-width="1.5"/>
  <line x1="213" y1="44" x2="209" y2="44" stroke="#fffbe0" stroke-width="1.5"/>
  <!-- cloud -->
  <ellipse cx="50" cy="22" rx="22" ry="10" fill="white" opacity="0.8"/>
  <ellipse cx="38" cy="26" rx="14" ry="8" fill="white" opacity="0.8"/>
  <ellipse cx="64" cy="26" rx="14" ry="8" fill="white" opacity="0.8"/>
</svg>`;

const paragonZaWrzatekEventSvg = `
<svg viewBox="0 0 220 130" width="220" height="130" aria-hidden="true">
  <!-- table -->
  <rect x="30" y="96" width="100" height="8" rx="3" fill="#8a6a48" stroke="#5a3216" stroke-width="2"/>
  <line x1="50" y1="104" x2="50" y2="122" stroke="#8a6a48" stroke-width="5" stroke-linecap="round"/>
  <line x1="110" y1="104" x2="110" y2="122" stroke="#8a6a48" stroke-width="5" stroke-linecap="round"/>
  <!-- small cup -->
  <rect x="62" y="78" width="24" height="18" rx="3" fill="#f5f1dd" stroke="#3b220f" stroke-width="2"/>
  <path d="M86 82 Q94 86 86 92" fill="none" stroke="#3b220f" stroke-width="2" stroke-linecap="round"/>
  <!-- steam -->
  <path d="M68 76 Q70 70 68 64" fill="none" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
  <path d="M74 76 Q78 68 74 62" fill="none" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
  <path d="M80 76 Q82 70 80 64" fill="none" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
  <!-- giant receipt -->
  <rect x="130" y="8" width="54" height="114" rx="3" fill="#fafafa" stroke="#bbb" stroke-width="2"/>
  <!-- receipt serrated top -->
  <polyline points="130,8 134,14 138,8 142,14 146,8 150,14 154,8 158,14 162,8 166,14 170,8 174,14 178,8 182,14 184,8" fill="none" stroke="#bbb" stroke-width="2"/>
  <!-- receipt lines -->
  <line x1="136" y1="26" x2="178" y2="26" stroke="#ccc" stroke-width="1.5"/>
  <text x="157" y="38" font-size="8" fill="#2d2d2d" text-anchor="middle" font-weight="700">PARAGON</text>
  <line x1="136" y1="43" x2="178" y2="43" stroke="#ccc" stroke-width="1"/>
  <text x="145" y="54" font-size="7" fill="#555">Wrzątek</text>
  <text x="174" y="54" font-size="7" fill="#555" text-anchor="end">18 zł</text>
  <text x="145" y="64" font-size="7" fill="#555">Kubek</text>
  <text x="174" y="64" font-size="7" fill="#555" text-anchor="end">6 zł</text>
  <text x="145" y="74" font-size="7" fill="#555">Stół</text>
  <text x="174" y="74" font-size="7" fill="#555" text-anchor="end">4 zł</text>
  <text x="145" y="84" font-size="7" fill="#555">Krzesło</text>
  <text x="174" y="84" font-size="7" fill="#555" text-anchor="end">3 zł</text>
  <line x1="136" y1="90" x2="178" y2="90" stroke="#333" stroke-width="1.5"/>
  <text x="145" y="101" font-size="8" fill="#2d2d2d" font-weight="700">SUMA</text>
  <text x="174" y="101" font-size="8" fill="#c0392b" font-weight="700" text-anchor="end">31 zł</text>
  <!-- small mountain hut in bg -->
  <polygon points="10,96 30,64 50,96" fill="#7a6a50"/>
  <rect x="16" y="80" width="14" height="16" rx="1" fill="#a87743"/>
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
          if (state.rng() < 0.5) {
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
          'Koszt: 0 dutków. Nagroda: karta Spostrzegawczość (dobierz 1; jeśli to Atak, Twój następny atak w tej turze zadaje +2 obrażeń).',
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
          'Koszt: 0 dutków. Efekt: walka wydarzeniowa z Naganiaczami. Nagroda po wygranej: Zasłużony Portfel (+6 dutków po każdym zwycięstwie poza walkami wydarzeniowymi).',
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
          'Koszt: -5 Krzepy. Nagroda: karta Prestiż na Kredyt (1 koszt, 6 Gardy +2 za każde 20 dutków, maks. +14 premii).',
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
      minDutki: 20,
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
          'Koszt: 150 dutków. Efekt: skrót do finału i wymuszenie walki z głównym finałowym wrogiem.',
        cost: 150,
        effect(state) {
          state.jumpToBoss = true;
          state.forceMainBossNextBattle = true;
          return 'Wiatr we włosach! Fiakier dowozi Cię pod samiuśkie stopy Białego Miśka.';
        },
      },
    ],
  },

  // ─── Act II: Morskie Oko events ────────────────────────────────────────────

  event_korek_do_toalety: {
    id: 'event_korek_do_toalety',
    act: 'II',
    title: 'Korek do Toalety',
    description:
      'Przy drzwiach z literą "WC" stoi kolejka jak na Black Friday. Tabliczka: "Wejście 15 zł. Papier własny."',
    image: korekDoToaletyEventSvg,
    choices: [
      {
        text: 'Kup szybkie wejście (30 dutków)',
        description: 'Wciskasz banknotówy w szparę i wchodzisz bez kolejki. Krótka chwila spokoju.',
        consequence: 'Koszt: 30 dutków. Nagroda: +10 Krzepy.',
        cost: 30,
        effect(state) {
          state.healPlayer(10);
          return 'Świeży i wypoczęty wychodzisz z toalety. Odzyskałeś 10 Krzepy.';
        },
      },
      {
        text: 'Stój w kolejce',
        description: 'Czekasz cierpliwie. Godzina mija. Nogi bolą. Za to portfel cały.',
        consequence:
          'Koszt: czas. Efekt: karta Ulotka trafia do talii, +15 dutków za znoszoną cierpliwość.',
        cost: 0,
        effect(state) {
          state.deck.push('ulotka');
          state.addDutki(15);
          return 'Czekałeś jak mężczyzna. Ktoś dał Ci ulotkę i monetę ze współczucia (+15 dutków, karta Ulotka).';
        },
      },
      {
        text: 'Idź w krzaki (ryzyko)',
        description: 'Znasz las lepiej niż toaletę. Ale TPN czuwa.',
        consequence: '50% szans: +25 dutków. 50%: wróg wypada z krzaków — walka wydarzeniowa!',
        cost: 0,
        effect(state) {
          if (state.rng() < 0.5) {
            state.addDutki(25);
            return 'Cisza, śpiew ptaków i +25 dutków. Nikt nie widział.';
          }
          state.queueEventBattle('bileter_z_tpn', null);
          return 'Z krzaków wyskakuje bileter z TPN-u z mandatem! Czas walczyć!';
        },
      },
    ],
  },

  event_selfie_na_krawedzi: {
    id: 'event_selfie_na_krawedzi',
    act: 'II',
    title: 'Selfie na Krawędzi',
    description:
      'Insta-taterniczka stoi na krawędzi skały z telefonem w wyciągniętej ręce. "Hej, możesz zrobić zdjęcie? Potrzebuję 400 zdjęć, żeby wybrać jedno!"',
    image: selfieNaKrawedziEventSvg,
    choices: [
      {
        text: 'Pomóż zrobić ujęcie',
        description: 'Fotograf-amator na chwilę. Twoje ręce drżą z wysiłku i strachu o aparat.',
        consequence: 'Nagroda: karta Spostrzegawczość. Koszt: -3 Krzepy (spięte mięśnie).',
        cost: 0,
        effect(state) {
          state.player.hp = Math.max(1, state.player.hp - 3);
          state.deck.push('spostrzegawczosc');
          return 'Trzysta ujęć. Trzysta. Twoje ramiona płoną, ale karta Spostrzegawczość trafia do talii.';
        },
      },
      {
        text: 'Sprzedaj jej kijek selfie (zysk)',
        description: 'Masz stary kijaszek. Ona desperacko potrzebuje zasięgu. Biznes gotowy.',
        consequence:
          'Nagroda: +40 dutków. Koszt: karta Pocieszenie trafia do talii (bez kija ciężej).',
        cost: 0,
        effect(state) {
          state.addDutki(40);
          state.deck.push('pocieszenie');
          return 'Targu dobrego! 40 dutków w kieszeni, ale bez kija góry wyglądają inaczej (+40 dutków, karta Pocieszenie).';
        },
      },
      {
        text: 'Zgaś temat i idź dalej',
        description: 'Masz dość contentu. Zostawiasz ją z telefonem i idziesz w swoją stronę.',
        consequence: 'Nagroda: +6 Krzepy (spokój wewnętrzny). Bez kosztów.',
        cost: 0,
        effect(state) {
          state.healPlayer(6);
          return 'Cisza. Spokój. Dobre zdrowie. Odzyskałeś 6 Krzepy.';
        },
      },
    ],
  },

  event_paragon_za_wrzatek: {
    id: 'event_paragon_za_wrzatek',
    act: 'II',
    title: 'Paragon za Wrzątek',
    description:
      'W schronisku dostęp do wrzątku kosztuje 18 zł. Do kubka 6 zł. Do stołu 4 zł. Za siedzenie na krześle dopłata 3 zł.',
    image: paragonZaWrzatekEventSvg,
    fallbackFight: {
      minDutki: 25,
      enemyId: 'bileter_z_tpn',
      message: 'Bileter z TPN-u słyszy awanturę i rusza w twoją stronę z notatnikiem.',
    },
    choices: [
      {
        text: 'Płać i pij (40 dutków)',
        description: 'Wyciągasz portfel, nie patrzysz na rachunek i delektujesz się herbatą.',
        consequence: 'Koszt: 40 dutków. Nagroda: +10 Krzepy i karta Sernik trafia do talii.',
        cost: 40,
        effect(state) {
          state.healPlayer(10);
          state.deck.push('sernik');
          return 'Gorąca herbata smakuje jak zapomnienie. +10 Krzepy, karta Sernik w talii.';
        },
      },
      {
        text: 'Negocjuj cenę (15 dutków)',
        description: 'Targuj się jak na bazarze. Może uda się zbić cenę.',
        consequence:
          '50%: pełen zwrot 15 dutków + 5 Krzepy. 50%: płacisz i dostajesz kartę Ulotka.',
        cost: 15,
        effect(state) {
          if (state.rng() < 0.5) {
            state.addDutki(15);
            state.healPlayer(5);
            return 'Właścicielka się ugięła. Zwróciła 15 dutków i dolała herbaty gratis (+5 Krzepy).';
          }
          state.deck.push('ulotka');
          return 'Negocjacje skończyły się formularzem skargi w dłoniach. Karta Ulotka w talii.';
        },
      },
      {
        text: 'Awantura przy ladzie',
        description:
          'To jest skandal, złodziejstwo i naruszenie praw konsumenta! Wzywasz wszystkich na świadków!',
        consequence: 'Walka wydarzeniowa z Bileterem z TPN. Po wygranej: relikt Zasluzony Portfel.',
        cost: 0,
        effect(state) {
          state.queueEventBattle('bileter_z_tpn', 'zasluzony_portfel');
          return 'Skandal przy kasie! Obsługa schroniska ruszy na Ciebie z klipboardem!';
        },
      },
    ],
  },
};

export const events = eventLibrary;
